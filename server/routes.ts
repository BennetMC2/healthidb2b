import type { Express, Request, Response } from "express";
import type { Server } from "node:http";
import { randomUUID } from "node:crypto";
import { storage } from "./storage";
import { DEFAULT_ASSUMED_OFFER_PMPM, resolvePlan } from "./engine/orchestrator";
import { bookPriorsFromSegments, generatePopulationSample, segmentsFromUpload } from "./engine/population";
import { runAgentBatch, runAgentBatchStrict, aggregateBehavior, makeSimilarityGuard, AGENT_PROVIDER_LABEL } from "./engine/agents";
import { runGrowthBatch, aggregateGrowth, evaluateGrowth } from "./engine/growth";
import { runMonteCarlo, DOSE_RESPONSE_PARAMS } from "./engine/montecarlo";
import { calibrateBehavior } from "./engine/calibration";
import { generateNarrative } from "./engine/narrative";
import { CITATIONS } from "./engine/citations";
import { assumptionRegister, MARKET_WEARABLE_PRIOR } from "./engine/assumptions";
import { activeModelModuleSummary } from "./engine/moduleRegistry";
import { allocateCohortRewards } from "./engine/cohortRewardAllocator";
import { estimateLifeInsuranceValue } from "./engine/lifeInsuranceValue";
import { compareLifeBacktest } from "./engine/lifeBacktest";
import { explainRewardStrategy } from "./engine/rewardStrategyExplainer";
import { buildOperatorModelMap } from "./engine/operatorModelMap";
import { enterModel } from "./engine/modelContext";
import { listModelSummaries, getModel, applyModelOverride, getChangeLog, signModel } from "./engine/models";
import { getSignal, allSignals, FUSIONS, EMERGING_HAIRCUT, TRUST_VALUE_MODIFIER } from "./engine/registry";
import { answerCopilotQuestion } from "./engine/copilot";
import type {
  StreamEvent,
  AgentDecision,
  GrowthDecision,
  ResolvedPlan,
  BehaviorRates,
  MethodologyReport,
  CalibrationReport,
  NarrativeReport,
  IncentiveDesign,
  RewardStrategyConfig,
  LifeAssumptionOverrides,
  AssumptionItem,
} from "@shared/schema";
import { insertBacktestSchema, insertSegmentUploadSchema, insertModelInputVersionSchema, insertScenarioSchema } from "@shared/tables";

function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// run promises with bounded concurrency, emitting as each settles
async function mapConcurrent<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
  onResult: (r: R) => void
): Promise<R[]> {
  const results: R[] = [];
  let idx = 0;
  async function worker() {
    while (idx < items.length) {
      const cur = idx++;
      const r = await fn(items[cur], cur);
      results[cur] = r;
      onResult(r);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

const MC_ITERS = 7000;
const AGENT_LLM_CONCURRENCY = Math.max(1, Math.min(12, Number(process.env.AGENT_LLM_CONCURRENCY || 4)));
const MAX_AGENT_SAMPLE = Math.max(12, Math.min(600, Number(process.env.MAX_AGENT_SAMPLE || 600)));
const AGENT_BATCH_SIZE = Math.max(1, Math.min(60, Number(process.env.AGENT_BATCH_SIZE || 20)));
const AGENT_BATCH_COOLDOWN_MS = Math.max(0, Math.min(60000, Number(process.env.AGENT_BATCH_COOLDOWN_MS || 0)));
const AGENT_BATCH_RETRIES = Math.max(0, Math.min(8, Number(process.env.AGENT_BATCH_RETRIES || (process.env.VERCEL ? 5 : 2))));

// Synthetic RCT: at or above this sample size, agents are randomized across
// reward arms ($0 / low / offer / high) so the reward→engagement curve is fit
// through OBSERVED arm engagement instead of stated sensitivities. The $0 arm
// measures intrinsic motivation — who engages with no cash on the table.
const DOSE_ARM_MIN_SAMPLE = Math.max(50, Math.min(600, Number(process.env.DOSE_ARM_MIN_SAMPLE || 200)));

function doseArmLevels(offer: number): { zero: number; low: number; offerArm: number; high: number } {
  const base = Math.round(offer) > 0 ? Math.round(offer) : 12;
  const low = Math.max(2, Math.round(base * 0.5));
  const high = Math.min(85, Math.max(base + 15, Math.round(base * 2)));
  return { zero: 0, low, offerArm: Math.round(offer) > 0 ? Math.round(offer) : 0, high };
}

// Deterministic round-robin randomization: 20% $0, 20% low, 40% offer, 20% high.
// Agents are generated in interleaved segment order, so round-robin keeps the
// persona mix balanced across arms.
function assignDoseArms(agents: { armRewardPmpm?: number }[], offer: number) {
  const levels = doseArmLevels(offer);
  agents.forEach((a, i) => {
    const slot = i % 5;
    a.armRewardPmpm = slot === 0 ? levels.zero : slot === 1 ? levels.low : slot === 4 ? levels.high : levels.offerArm;
  });
  return levels;
}

function assumedOfferPmpm(incentiveDesign?: IncentiveDesign, rewardStrategy?: RewardStrategyConfig): number {
  if (incentiveDesign?.configured) return incentiveDesign.rewardPmpm;
  if (typeof rewardStrategy?.budgetPmpm === "number" && Number.isFinite(rewardStrategy.budgetPmpm) && rewardStrategy.budgetPmpm > 0) {
    return rewardStrategy.budgetPmpm;
  }
  return DEFAULT_ASSUMED_OFFER_PMPM;
}

type RequestContext = {
  organizationId: string;
  actor: string;
  role: "admin" | "actuary" | "underwriter" | "viewer" | "compliance" | "system";
};

function requestContext(req: Request): RequestContext {
  const rawRole = String(req.header("x-healthid-role") || "admin");
  const role = ["admin", "actuary", "underwriter", "viewer", "compliance", "system"].includes(rawRole)
    ? (rawRole as RequestContext["role"])
    : "viewer";
  return {
    organizationId: String(req.header("x-healthid-org") || "demo-org").slice(0, 80),
    actor: String(req.header("x-healthid-user") || "system").slice(0, 120),
    role,
  };
}

function hasRole(ctx: RequestContext, allowed: RequestContext["role"][]) {
  return allowed.includes(ctx.role);
}

function allocatorObjective(objective: RewardStrategyConfig["objective"]) {
  if (objective === "reduce_mortality") return "max_mortality_impact" as const;
  if (objective === "reduce_morbidity") return "max_mortality_impact" as const;
  if (objective === "attract_users") return "max_persistency" as const;
  if (objective === "max_net_value") return "max_net_value" as const;
  if (objective === "max_persistency") return "max_persistency" as const;
  return "balanced" as const;
}

function boundedQueryNumber(raw: unknown, min: number, max: number): number | undefined {
  const parsed = parseFloat(String(raw ?? ""));
  if (!Number.isFinite(parsed)) return undefined;
  return Math.max(min, Math.min(max, parsed));
}

function pendingLifeAssumptionItems(overrides: LifeAssumptionOverrides, market: string): AssumptionItem[] {
  const items: AssumptionItem[] = [];
  const push = (key: keyof LifeAssumptionOverrides, label: string, unit: string, value?: number) => {
    if (typeof value !== "number") return;
    items.push({
      key,
      label,
      value,
      unit,
      source: "Pending user override for this run only; not an approved assumption-set default.",
      geography: market,
      editable: true,
    });
  };
  push("baselineAnnualMortalityRate", "Baseline annual mortality rate", "fraction/year", overrides.baselineAnnualMortalityRate);
  push("sumAssured", "Average sum assured", "USD", overrides.sumAssured);
  push("annualPremium", "Average annual premium", "USD/member/year", overrides.annualPremium);
  push("morbidityValuePctOfMortality", "Morbidity value proxy", "fraction of mortality value", overrides.morbidityValuePctOfMortality);
  push("acquisitionValuePerNewVerifiedMember", "Acquisition value per new verified member", "USD/member", overrides.acquisitionValuePerNewVerifiedMember);
  push("maxLapseImprovement", "Maximum lapse improvement", "fraction", overrides.maxLapseImprovement);
  return items;
}

async function loadSelectedSegments(versionId: string | undefined, organizationId = "demo-org") {
  if (!versionId) return undefined;
  const versions = await storage.getModelInputVersions(100, organizationId);
  const version = versions.find((v) => v.id === versionId);
  if (!version || version.kind !== "segment_set") {
    throw new Error("Selected segment-set version was not found or is not approved as a segment set.");
  }
  const payload = JSON.parse(version.payload);
  const rows = Array.isArray(payload.rows) ? payload.rows : [];
  return {
    version,
    segments: segmentsFromUpload(rows),
    rowCount: typeof payload.rowCount === "number" ? payload.rowCount : rows.length,
  };
}

async function loadSelectedLifeAssumptions(versionId: string | undefined, organizationId = "demo-org") {
  if (!versionId) return undefined;
  const versions = await storage.getModelInputVersions(100, organizationId);
  const version = versions.find((v) => v.id === versionId);
  if (!version || version.kind !== "life_assumptions") {
    throw new Error("Selected life-assumption version was not found or is not approved as life assumptions.");
  }
  return {
    version,
    assumptions: JSON.parse(version.payload) as LifeAssumptionOverrides,
  };
}

function mergeLifeAssumptions(base?: LifeAssumptionOverrides, overrides?: LifeAssumptionOverrides): LifeAssumptionOverrides {
  return {
    ...(base ?? {}),
    ...Object.fromEntries(Object.entries(overrides ?? {}).filter(([, value]) => typeof value === "number")),
  };
}

async function audit(ctx: RequestContext, action: string, entityType: string, entityId: string | null, summary: string, metadata: Record<string, unknown> = {}) {
  try {
    await storage.saveAuditEvent({
      id: randomUUID(),
      organizationId: ctx.organizationId,
      actor: ctx.actor,
      role: ctx.role,
      action,
      entityType,
      entityId,
      summary,
      metadata: JSON.stringify(metadata),
      createdAt: Date.now(),
    });
  } catch {
    // Audit writes should never break the user workflow in this prototype.
  }
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
  return chunks;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function retryAfterMs(message: string, attempt: number) {
  const match = message.match(/try again in\s+([0-9.]+)s/i);
  if (match) return Math.ceil(Number(match[1]) * 1000) + 1500;
  if (/429|rate limit/i.test(message)) return 25000;
  if (/timed out|timeout/i.test(message)) return Math.min(45000, 8000 + attempt * 6000);
  return Math.min(30000, 2500 * 2 ** attempt);
}

async function sleepWithHeartbeat(ms: number, send: (e: StreamEvent) => void, label: string) {
  const started = Date.now();
  let remaining = ms;
  while (remaining > 0) {
    const step = Math.min(10000, remaining);
    await sleep(step);
    remaining = ms - (Date.now() - started);
    if (remaining > 1000) {
      send({ type: "thought", text: `${label} ${Math.ceil(remaining / 1000)}s remaining.` });
    }
  }
}

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  app.get("/api/citations", (_req, res) => res.json(CITATIONS));
  // Signal registry: every signal the simulator can verify, with evidence
  // tiers, trust ceilings and the gates that scale bookable claims value.
  app.get("/api/signals", (_req, res) =>
    res.json({
      signals: allSignals(),
      fusions: FUSIONS,
      emergingHaircut: EMERGING_HAIRCUT,
      trustModifiers: TRUST_VALUE_MODIFIER,
    })
  );
  app.get("/api/health", (_req, res) => res.json({ ok: true }));
  app.get("/api/operator/model-map", (req, res) => {
    enterModel(String(req.query.modelId || ""));
    res.json(buildOperatorModelMap());
  });

  // Model registry — the switcher and Studio read this (brief §1, §3).
  app.get("/api/models", (req, res) => {
    const buyerContext = String(req.query.context || "buyer") !== "internal";
    res.json({ models: listModelSummaries({ buyerContext }), defaultModelId: "model-1-evidence-floor" });
  });

  // A Model's assumptions + governance metadata + forward-fork diff (Studio).
  app.get("/api/models/:id", (req, res) => {
    const model = getModel(String(req.params.id));
    if (!model) return res.status(404).json({ error: "unknown model" });
    enterModel(model.meta.id, { allowInternal: true });
    res.json({
      meta: model.meta,
      adjustments: model.adjustments,
      assumptions: assumptionRegister("steps", "HK"),
      changeLog: getChangeLog(model.meta.id),
    });
  });

  // Studio edit: apply an assumption override with a required rationale. Logged
  // to the change log + audit trail; picked up by the next simulation.
  app.patch("/api/models/:id/assumptions", async (req, res) => {
    const ctx = requestContext(req);
    const { path, label, toValue, rationale } = req.body ?? {};
    if (typeof path !== "string" || (typeof toValue !== "number" && typeof toValue !== "string")) {
      return res.status(400).json({ error: "path and toValue required" });
    }
    const result = applyModelOverride({
      modelId: String(req.params.id),
      path,
      label: String(label ?? path),
      toValue,
      rationale: String(rationale ?? ""),
      actor: ctx.actor,
      at: new Date().toISOString(),
    });
    if (!result.ok) return res.status(400).json({ error: result.error });
    await storage.saveAuditEvent({
      id: randomUUID(),
      organizationId: ctx.organizationId,
      actor: ctx.actor,
      role: ctx.role,
      action: "model.assumption.edit",
      entityType: "model",
      entityId: String(req.params.id),
      summary: `${result.entry.label}: ${result.entry.fromValue} → ${result.entry.toValue}`,
      metadata: JSON.stringify({ rationale: result.entry.rationale, path }),
      createdAt: Date.now(),
    }).catch(() => {});
    res.json({ ok: true, entry: result.entry });
  });

  // Sign-off: name + date a draft model as a governed signed floor.
  app.post("/api/models/:id/signoff", async (req, res) => {
    const ctx = requestContext(req);
    const result = signModel(String(req.params.id), ctx.actor, new Date().toISOString());
    if (!result.ok) return res.status(400).json({ error: result.error });
    await storage.saveAuditEvent({
      id: randomUUID(),
      organizationId: ctx.organizationId,
      actor: ctx.actor,
      role: ctx.role,
      action: "model.signoff",
      entityType: "model",
      entityId: String(req.params.id),
      summary: `Model signed off by ${ctx.actor}`,
      metadata: "{}",
      createdAt: Date.now(),
    }).catch(() => {});
    res.json({ ok: true });
  });

  // Results co-pilot: grounded Q&A over a completed run. The client sends the
  // run's canonical numbers as context; the model explains them, never invents.
  app.post("/api/copilot", async (req, res) => {
    const ctx = requestContext(req);
    const question = String(req.body?.question || "").trim();
    if (!question) {
      res.status(400).json({ message: "question is required" });
      return;
    }
    try {
      const result = await answerCopilotQuestion({
        question,
        history: req.body?.history,
        context: req.body?.context,
      });
      await audit(ctx, "copilot.question", "run", null, `Co-pilot answered a question about the latest run.`, {
        question: question.slice(0, 200),
        provider: result.provider,
        model: result.model,
      });
      res.json(result);
    } catch (e: any) {
      res.status(502).json({ message: e?.message || "co-pilot request failed" });
    }
  });

  app.get("/api/audit", async (req, res) => {
    const ctx = requestContext(req);
    try {
      res.json(await storage.getAuditEvents(100, ctx.organizationId));
    } catch {
      res.json([]);
    }
  });

  app.post("/api/audit", async (req, res) => {
    const ctx = requestContext(req);
    const action = String(req.body?.action || "").trim();
    const entityType = String(req.body?.entityType || "ui").trim();
    const entityId = req.body?.entityId == null ? null : String(req.body.entityId);
    const summary = String(req.body?.summary || "").trim();
    if (!action || !summary) {
      res.status(400).json({ message: "action and summary are required" });
      return;
    }
    await audit(ctx, action, entityType, entityId, summary, req.body?.metadata ?? {});
    res.json({ ok: true });
  });

  app.post("/api/scenarios", async (req, res) => {
    const ctx = requestContext(req);
    if (!hasRole(ctx, ["admin", "actuary", "underwriter"])) {
      res.status(403).json({ message: `Role ${ctx.role} cannot save scenarios.` });
      return;
    }
    const parsed = insertScenarioSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: "invalid scenario payload", issues: parsed.error.issues });
      return;
    }
    try {
      const saved = await storage.saveScenario({
        ...parsed.data,
        organizationId: ctx.organizationId,
        createdBy: ctx.actor,
        narrative: parsed.data.narrative ?? null,
        id: randomUUID(),
        createdAt: Date.now(),
      });
      await audit(ctx, "scenario.saved", "scenario", saved.id, `Saved scenario "${saved.name}".`, {
        name: saved.name,
        goal: saved.goal,
      });
      res.json({ ok: true, scenario: saved, note: `Saved scenario "${saved.name}".` });
    } catch (e: any) {
      res.status(500).json({ message: e?.message || "failed to save scenario" });
    }
  });

  app.get("/api/scenarios", async (req, res) => {
    const ctx = requestContext(req);
    try {
      res.json(await storage.getScenarios(50, ctx.organizationId));
    } catch {
      res.json([]);
    }
  });

  // ---- Backtesting hook (first-class; calibration/validation entry point) ----
  // Insurers POST real historical campaign outcomes; the server stores them and
  // returns a comparison-ready record. Designed as the seam where the model
  // moves from CALIBRATED PLANNING ESTIMATE to VALIDATED against real data.
  app.post("/api/backtest", async (req: Request, res: Response) => {
    const ctx = requestContext(req);
    if (!hasRole(ctx, ["admin", "actuary", "compliance"])) {
      res.status(403).json({ message: `Role ${ctx.role} cannot upload backtests.` });
      return;
    }
    const parsed = insertBacktestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: "invalid backtest payload", issues: parsed.error.issues });
      return;
    }
    try {
      const saved = await storage.saveBacktest({
        ...parsed.data,
        organizationId: ctx.organizationId,
        createdBy: ctx.actor,
        notes: parsed.data.notes ?? null,
        id: randomUUID(),
        createdAt: Date.now(),
      });
      const comparison = compareLifeBacktest({ observed: saved });
      await audit(ctx, "backtest.uploaded", "backtest", saved.id, `Uploaded backtest for ${saved.campaign} in ${saved.market}.`, {
        campaign: saved.campaign,
        market: saved.market,
        validationStatus: comparison.validationStatus,
      });
      res.json({
        ok: true,
        backtest: saved,
        comparison,
        note: `Stored and compared against current planning defaults. Validation status: ${comparison.validationStatus}.`,
      });
    } catch (e: any) {
      res.status(500).json({ message: e?.message || "failed to save backtest" });
    }
  });

  app.get("/api/backtest", async (req, res) => {
    const ctx = requestContext(req);
    try {
      const records = await storage.getBacktests(50, ctx.organizationId);
      res.json(records.map((backtest) => ({ ...backtest, comparison: compareLifeBacktest({ observed: backtest }) })));
    } catch {
      res.json([]);
    }
  });

  app.post("/api/segments/upload", async (req, res) => {
    const ctx = requestContext(req);
    if (!hasRole(ctx, ["admin", "actuary"])) {
      res.status(403).json({ message: `Role ${ctx.role} cannot upload segment tables.` });
      return;
    }
    const parsed = insertSegmentUploadSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: parsed.error.issues.map((i) => i.message).join("; ") });
      return;
    }
    try {
      const totalWeight = parsed.data.rows.reduce((sum, row) => sum + row.weight, 0);
      const saved = await storage.saveSegmentUpload({
        id: randomUUID(),
        organizationId: ctx.organizationId,
        createdBy: ctx.actor,
        name: parsed.data.name,
        market: parsed.data.market,
        source: parsed.data.source,
        rowCount: parsed.data.rows.length,
        rows: JSON.stringify(parsed.data.rows),
        createdAt: Date.now(),
      });
      await audit(ctx, "segment_upload.created", "segment_upload", saved.id, `Uploaded ${saved.rowCount} segment rows for ${saved.market}.`, {
        name: saved.name,
        market: saved.market,
        rowCount: saved.rowCount,
      });
      res.json({
        ok: true,
        upload: saved,
        note: `Stored ${parsed.data.rows.length} sourced segment rows. Total weight ${totalWeight.toFixed(3)}; sampling will use this after an actuary approves and selects the segment set.`,
      });
    } catch (e: any) {
      res.status(500).json({ message: e?.message || "failed to save segment upload" });
    }
  });

  app.get("/api/segments/uploads", async (req, res) => {
    const ctx = requestContext(req);
    try {
      res.json(await storage.getSegmentUploads(20, ctx.organizationId));
    } catch {
      res.json([]);
    }
  });

  app.post("/api/governance/model-inputs", async (req, res) => {
    const ctx = requestContext(req);
    if (!hasRole(ctx, ["admin", "actuary", "compliance"])) {
      res.status(403).json({ message: `Role ${ctx.role} cannot approve model inputs.` });
      return;
    }
    const parsed = insertModelInputVersionSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: "invalid model input payload", issues: parsed.error.issues });
      return;
    }
    try {
      const saved = await storage.saveModelInputVersion({
        id: randomUUID(),
        organizationId: ctx.organizationId,
        createdBy: ctx.actor,
        kind: parsed.data.kind,
        name: parsed.data.name,
        status: "approved",
        source: parsed.data.source,
        payload: JSON.stringify(parsed.data.payload),
        createdAt: Date.now(),
        approvedAt: Date.now(),
      });
      await audit(ctx, "model_input.approved", "model_input_version", saved.id, `Approved ${saved.kind} version "${saved.name}".`, {
        kind: saved.kind,
        name: saved.name,
      });
      res.json({
        ok: true,
        version: saved,
        note: `Approved ${parsed.data.kind.replace("_", " ")} version "${parsed.data.name}". It is now stored as governed model input, but simulation uses it only when explicitly selected.`,
      });
    } catch (e: any) {
      res.status(500).json({ message: e?.message || "failed to approve model input" });
    }
  });

  app.post("/api/segments/uploads/:id/approve", async (req, res) => {
    const ctx = requestContext(req);
    if (!hasRole(ctx, ["admin", "actuary", "compliance"])) {
      res.status(403).json({ message: `Role ${ctx.role} cannot approve segment sets.` });
      return;
    }
    try {
      const upload = await storage.getSegmentUpload(req.params.id, ctx.organizationId);
      if (!upload) {
        res.status(404).json({ message: "segment upload not found" });
        return;
      }
      const saved = await storage.saveModelInputVersion({
        id: randomUUID(),
        organizationId: ctx.organizationId,
        createdBy: ctx.actor,
        kind: "segment_set",
        name: `${upload.name} approved`,
        status: "approved",
        source: upload.source,
        payload: JSON.stringify({
          uploadId: upload.id,
          market: upload.market,
          rowCount: upload.rowCount,
          rows: JSON.parse(upload.rows),
        }),
        createdAt: Date.now(),
        approvedAt: Date.now(),
      });
      await audit(ctx, "segment_set.approved", "model_input_version", saved.id, `Approved segment upload "${upload.name}" as governed segment set.`, {
        uploadId: upload.id,
        rowCount: upload.rowCount,
        market: upload.market,
      });
      res.json({
        ok: true,
        version: saved,
        note: `Approved ${upload.rowCount} segment rows as a governed segment-set version. It will affect sampling only after selected as the active segment set.`,
      });
    } catch (e: any) {
      res.status(500).json({ message: e?.message || "failed to approve segment upload" });
    }
  });

  app.get("/api/governance/model-inputs", async (req, res) => {
    const ctx = requestContext(req);
    try {
      res.json(await storage.getModelInputVersions(50, ctx.organizationId));
    } catch {
      res.json([]);
    }
  });

  // Main agentic simulation stream (SSE)
  app.get("/api/simulate", async (req: Request, res: Response) => {
    const ctx = requestContext(req);
    // Activate the selected Model for this request — every downstream engine
    // read (claims bridge, life value, reward allocation) resolves against it.
    enterModel(String(req.query.modelId || ""));
    const goal = String(req.query.goal || "").trim();
    const requestedSample = parseInt(String(req.query.sample || "12"), 10) || 12;
    const sampleSize = Math.max(12, Math.min(MAX_AGENT_SAMPLE, requestedSample));
    const incentiveConfigured = String(req.query.incentiveConfigured || "") === "true";
    const rewardPmpm = Math.max(0, Math.min(250, parseFloat(String(req.query.rewardPmpm || "0")) || 0));
    const adminCostPmpm = Math.max(0, Math.min(100, parseFloat(String(req.query.adminCostPmpm || "0")) || 0));
    const platformCostPmpm = Math.max(0, Math.min(100, parseFloat(String(req.query.platformCostPmpm || "0")) || 0));
    const rawStrategyObjective = String(req.query.strategyObjective || "balanced") as RewardStrategyConfig["objective"];
    const strategyObjective: RewardStrategyConfig["objective"] = [
      "balanced",
      "attract_users",
      "reduce_morbidity",
      "reduce_mortality",
      "max_net_value",
      "max_persistency",
    ].includes(rawStrategyObjective)
      ? rawStrategyObjective
      : "balanced";
    const strategyBudgetRaw = parseFloat(String(req.query.strategyBudgetPmpm || ""));
    const rewardStrategy: RewardStrategyConfig = {
      objective: strategyObjective,
      budgetPmpm: Number.isFinite(strategyBudgetRaw) ? Math.max(0, Math.min(250, strategyBudgetRaw)) : undefined,
    };
    const lifeAssumptions: LifeAssumptionOverrides = {
      baselineAnnualMortalityRate: boundedQueryNumber(req.query.lifeBaselineAnnualMortalityRate, 0.0001, 0.05),
      sumAssured: boundedQueryNumber(req.query.lifeSumAssured, 1000, 10000000),
      annualPremium: boundedQueryNumber(req.query.lifeAnnualPremium, 0, 200000),
      morbidityValuePctOfMortality: boundedQueryNumber(req.query.lifeMorbidityValuePctOfMortality, 0, 2),
      acquisitionValuePerNewVerifiedMember: boundedQueryNumber(req.query.lifeAcquisitionValuePerNewVerifiedMember, 0, 10000),
      maxLapseImprovement: boundedQueryNumber(req.query.lifeMaxLapseImprovement, 0, 0.3),
    };
    const segmentSetVersionId = String(req.query.segmentSetVersionId || "").trim() || undefined;
    const lifeAssumptionVersionId = String(req.query.lifeAssumptionVersionId || "").trim() || undefined;
    // Prior-trust dial for the Bayesian calibration blend: 1 = full literature
    // prior (default), 0 = agents only. Bounded, optional.
    const priorTrustRaw = parseFloat(String(req.query.priorTrust ?? ""));
    const priorTrust = Number.isFinite(priorTrustRaw) ? Math.max(0, Math.min(1, priorTrustRaw)) : 1;
    const pendingAssumptionOverrides = pendingLifeAssumptionItems(lifeAssumptions, "run market");
    const incentiveDesign: IncentiveDesign | undefined = incentiveConfigured
      ? { configured: true, rewardPmpm, adminCostPmpm, platformCostPmpm }
      : undefined;
    if (!goal) {
      res.status(400).json({ message: "goal is required" });
      return;
    }

    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    });

    const send = (e: StreamEvent) => {
      res.write(`data: ${JSON.stringify(e)}\n\n`);
    };

    let closed = false;
    req.on("close", () => {
      closed = true;
    });

    try {
      send({ type: "thought", text: "Parsing your objective — selecting signals, market, book size and horizon. The selected reward is the behaviour lever for this run." });
      if (requestedSample > sampleSize) {
        send({
          type: "thought",
          text: `Live run capped at ${sampleSize} member-agents. Raise MAX_AGENT_SAMPLE only after moving very large samples to a background job.`,
        });
      }

      const plan = await resolvePlan(goal, sampleSize);
      plan.assumedOfferPmpm = incentiveDesign?.configured ? assumedOfferPmpm(incentiveDesign, rewardStrategy) : plan.probeReward;
      if (incentiveDesign) plan.incentiveDesign = incentiveDesign;
      if (closed) return;
      send({
        type: "plan",
        plan,
        thought: `Plan locked: a ${plan.signalDefinitions?.map((s) => s.displayName).join(" + ") ?? plan.campaignLabel} campaign${
          (plan.signalDefinitions?.length ?? 0) > 1 ? ` (primary signal: ${plan.campaignLabel})` : ""
        } for a ${plan.bookSize.toLocaleString()}-member ${plan.marketLabel} book over ${plan.horizonMonths} months. The simulator will estimate member behaviour with strict live AI batches, retry provider limits instead of substituting heuristic decisions, apply calibration, then propagate behavioural and parameter uncertainty through a ${MC_ITERS.toLocaleString()}-iteration Monte Carlo. ${
          incentiveDesign
            ? "Net value and ROI will use the configured reward, admin and platform costs."
            : "This run is impact-only: ROI is unavailable until incentive economics are configured."
        }`,
      });

      if (plan.parseMode === "heuristic") {
        send({
          type: "mode",
          mode: "heuristic",
          message: `Planning model unavailable; using registry heuristic parser. ${plan.fallbackReason ?? ""}`.trim(),
        });
      }

      const selectedLifeAssumptions = await loadSelectedLifeAssumptions(lifeAssumptionVersionId, ctx.organizationId);
      const effectiveLifeAssumptions = mergeLifeAssumptions(selectedLifeAssumptions?.assumptions, lifeAssumptions);
      if (selectedLifeAssumptions) {
        send({
          type: "thought",
          text: `Using approved life-assumption version "${selectedLifeAssumptions.version.name}" as the base life-economics input.`,
        });
      }

      const seed = hashSeed(`${goal}|${plan.signals.join("+")}|${plan.fusion ?? "none"}|${plan.market}|${plan.sampleSize}|${plan.assumedOfferPmpm}|${segmentSetVersionId ?? "default-segments"}`);
      const selectedSegments = await loadSelectedSegments(segmentSetVersionId, ctx.organizationId);
      if (selectedSegments) {
        send({
          type: "thought",
          text: `Using approved segment set "${selectedSegments.version.name}" for population sampling (${selectedSegments.segments.length} cohort rows).`,
        });
      }
      const agents = generatePopulationSample(plan.market, plan.sampleSize, seed, selectedSegments?.segments, plan.targetHighRisk);
      if (plan.targetHighRisk) {
        send({
          type: "thought",
          text: `Targeting lever active: the goal asks for least-active / high-risk members, so the sample is drawn from the highest-mortality-risk segments and economics scale to the targeted tiers only (claims tiers renormalize; the low-risk tier is excluded from both costs and value).`,
        });
      }
      const armsActive = plan.sampleSize >= DOSE_ARM_MIN_SAMPLE;
      if (armsActive) {
        const levels = assignDoseArms(agents, plan.assumedOfferPmpm);
        send({
          type: "thought",
          text: `Synthetic RCT: randomizing the ${plan.sampleSize} member-agents across four reward arms — $0 (intrinsic-motivation floor: who engages with no cash on the table), $${levels.low}, $${levels.offerArm} (the run offer, 40% of agents) and $${levels.high} PMPM. The reward→engagement curve will be fit through the OBSERVED engagement of each arm, not stated sensitivities.`,
        });
      }
      const priorsWearable = selectedSegments
        ? bookPriorsFromSegments(selectedSegments.segments).wearablePct
        : MARKET_WEARABLE_PRIOR[plan.market];
      send({ type: "population_init", total: plan.bookSize, sampleSize: plan.sampleSize, wearablePct: priorsWearable });
      send({ type: "thought", text: `Generating ${plan.sampleSize} heterogeneous member records from ${selectedSegments ? "the selected approved segment set" : `illustrative ${plan.marketLabel} priors`}. Member decisions are strict live-model outputs; if providers rate-limit, the run waits and retries rather than filling with heuristics.` });

      for (const a of agents) {
        if (closed) return;
        send({ type: "agent_spawned", agent: a });
      }

      const guard = makeSimilarityGuard(0.62);
      let completed = 0;
      const batches = chunk(agents, AGENT_BATCH_SIZE);
      send({
        type: "thought",
        text: `Running ${plan.sampleSize} member-agents as ${batches.length} strict live-model batches of up to ${AGENT_BATCH_SIZE}. The run will wait and retry on provider limits instead of substituting heuristic member decisions.`,
      });
      // Shared across parallel workers: when one batch hits a provider rate
      // limit, every worker pauses until the quota window reopens instead of
      // burning retries against the same 429.
      let quotaPauseUntil = 0;
      const runStrictBatchWithRetry = async (batch: AgentDecision["agent"][], index: number) => {
        let lastError = "";
        for (let attempt = 0; attempt <= AGENT_BATCH_RETRIES; attempt++) {
          const sharedWait = quotaPauseUntil - Date.now();
          if (sharedWait > 250) {
            await sleepWithHeartbeat(sharedWait, send, `Waiting out shared provider rate limit before batch ${index + 1}/${batches.length}:`);
            if (closed) throw new Error("client disconnected during live-model retry");
          }
          try {
            if (attempt > 0) {
              send({
                type: "thought",
                text: `Retrying live batch ${index + 1}/${batches.length} (attempt ${attempt + 1}/${AGENT_BATCH_RETRIES + 1}).`,
              });
            }
            return await runAgentBatchStrict(batch, plan);
          } catch (err: any) {
            lastError = err?.message ? String(err.message) : "live model batch failed";
            if (attempt >= AGENT_BATCH_RETRIES) break;
            const waitMs = retryAfterMs(lastError, attempt);
            if (/429|rate limit|try again in/i.test(lastError)) {
              quotaPauseUntil = Math.max(quotaPauseUntil, Date.now() + waitMs);
            }
            send({
              type: "thought",
              text: `Live batch ${index + 1}/${batches.length} hit provider limits; waiting ${Math.ceil(waitMs / 1000)}s before retry.`,
            });
            await sleepWithHeartbeat(waitMs, send, `Waiting on live model quota for batch ${index + 1}/${batches.length}:`);
            if (closed) throw new Error("client disconnected during live-model retry");
          }
        }
        throw new Error(`Live model could not complete batch ${index + 1}/${batches.length} after ${AGENT_BATCH_RETRIES + 1} attempts. ${lastError}`);
      };
      const emitBatch = (batchDecisions: AgentDecision[]) => {
        if (closed) return;
        for (const d of batchDecisions) {
          guard.add(d.reasoning);
          completed++;
          send({ type: "agent_decision", decision: d, completed, total: agents.length });
        }
      };
      const batchResults: AgentDecision[][] = [];
      if (AGENT_LLM_CONCURRENCY === 1) {
        for (let i = 0; i < batches.length; i++) {
          const batchDecisions = await runStrictBatchWithRetry(batches[i], i);
          batchResults[i] = batchDecisions;
          emitBatch(batchDecisions);
          if (closed) return;
          const shouldCooldown = AGENT_BATCH_COOLDOWN_MS > 0 && (i + 1) % 2 === 0 && i < batches.length - 1;
          if (shouldCooldown) {
            send({
              type: "thought",
              text: `Provider quota cooldown for ${Math.round(AGENT_BATCH_COOLDOWN_MS / 1000)}s before the next live-model batches.`,
            });
            await sleep(AGENT_BATCH_COOLDOWN_MS);
          }
        }
      } else {
        const parallelResults = await mapConcurrent(
          batches,
          AGENT_LLM_CONCURRENCY,
          (batch, i) => runStrictBatchWithRetry(batch, i),
          emitBatch
        );
        batchResults.push(...parallelResults);
      }
      const decisions: AgentDecision[] = batchResults.flat();
      if (closed) return;

      const llmCount = decisions.filter((d) => d.mode === "llm").length;
      const runMode = llmCount === decisions.length ? "llm" : llmCount === 0 ? "heuristic" : "mixed";
      send({
        type: "mode",
        mode: runMode,
        message:
          runMode === "llm"
            ? `All member decisions used live AI (${AGENT_PROVIDER_LABEL}).`
            : `${decisions.length - llmCount}/${decisions.length} member decisions used heuristic fallback. Outputs are degraded and should not be described as model-backed member reasoning.`,
      });

      const rawBehavior = aggregateBehavior(decisions, armsActive ? plan.assumedOfferPmpm : undefined);
      send({ type: "behavior", rates: rawBehavior });
      if (rawBehavior.doseResponseArms?.length) {
        const armLine = rawBehavior.doseResponseArms
          .map((a) => `$${a.rewardPmpm}: ${(a.engagedRate * 100).toFixed(0)}% engaged (n=${a.n})`)
          .join(" · ");
        send({
          type: "thought",
          text: `Observed dose-response from the randomized arms — ${armLine}. Headline rates use the offer arm only (n=${rawBehavior.sampleSize}); the $0 arm is the intrinsic-motivation floor: members who engage for their own health and the companion experience, with no reward.`,
        });
      }

      // CALIBRATION — Bayesian blend: agent sample is evidence, the published
      // band is a prior; the weight is derived from the two precisions.
      const { calibrated, report: calReport } = calibrateBehavior(rawBehavior, plan.primarySignal, { priorTrust });
      send({ type: "calibration", report: calReport, rates: calibrated });
      send({ type: "thought", text: `Calibration: blending the ${rawBehavior.sampleSize}-agent evidence with the published prior (derived prior weight w=${calReport.shrinkage.toFixed(2)}${priorTrust < 1 ? `, prior trust ${priorTrust.toFixed(2)}` : ""}). Enrollment ${(rawBehavior.enrollmentRate * 100).toFixed(0)}%→${(calibrated.enrollmentRate * 100).toFixed(0)}%, persistence ${(rawBehavior.persistenceRate * 100).toFixed(0)}%→${(calibrated.persistenceRate * 100).toFixed(0)}%. The agent sample carries ${(100 * (1 - calReport.shrinkage)).toFixed(0)}% of the blended estimate.` });
      for (const finding of calReport.divergenceFindings ?? []) {
        send({ type: "critique", text: `Divergence finding: ${finding}` });
      }
      if (rawBehavior.rewardCurveShape) {
        send({
          type: "thought",
          text: `Reward-response shape derived from per-agent decisions: ${(rawBehavior.rewardCurveShape.floorShare * 100).toFixed(0)}% of current engagement is money-indifferent (survives a zero reward); a saturating reward could reach ${(rawBehavior.rewardCurveShape.capShare).toFixed(2)}× current engagement. The curve's floor and ceiling come from the agents, not tuned constants.`,
        });
      }

      const behavior: BehaviorRates = calibrated;
      const critique = buildCritique(plan, behavior, calReport);
      send({ type: "critique", text: critique });

      const rewardAllocation = allocateCohortRewards({
        plan,
        behavior,
        objective: allocatorObjective(rewardStrategy.objective),
        budgetPmpm: rewardStrategy.budgetPmpm,
      });
      const lifeInsuranceValue = estimateLifeInsuranceValue({
        plan,
        allocation: rewardAllocation,
        ...effectiveLifeAssumptions,
      });
      const rewardStrategyExplanation = await explainRewardStrategy({
        plan,
        behavior,
        strategy: rewardStrategy,
        allocation: rewardAllocation,
        lifeValue: lifeInsuranceValue,
      });

      send({ type: "thought", text: `Propagating calibrated rates, claims-cost bridge uncertainty, attribution haircuts and present-value costs through a ${MC_ITERS.toLocaleString()}-iteration Monte Carlo over the full book…` });
      const finance = runMonteCarlo(plan, behavior, MC_ITERS, seed, incentiveDesign, calReport.shrinkage);
      if (closed) return;
      send({ type: "reward_optimization", optimization: finance.rewardOptimization });
      send({ type: "montecarlo", result: finance });

      const methodology: MethodologyReport = {
        chain: [
          "Reward → engagement (response curve under selected assumptions)",
          "Engagement → verified-device behaviour change (strict live-model member decisions; calibrated to the active verified-device, loss-framed reference class)",
          "Behaviour → applicable treated cohort (persisting members plus explicit part-credit for faders)",
          "Applicable treated cohort → claims savings (claims-denominated cost delta × prevalence × attribution factor × achieved dose, discounted to present value)",
          "Optional group productivity stream adds productivity value for the group-book fraction only; it is separate from claims and disabled for individual-only books.",
          "Life-book mortality margin: achieved step lift → relative mortality reduction (Paluch 2022, capped) × attribution haircut × baseline mortality × sum assured — a separate stream that never multiplies the health-claims base",
          incentiveDesign
            ? "Gross value → net value (claims + productivity + retention + mortality margin, minus configured reward at expected-redemption cost, admin and platform costs)"
            : "Gross value → break-even budget (ROI unavailable until incentive economics are configured)",
          "Reward comparison sweeps PMPM levels with explicit reward/admin/platform cost denominators",
        ],
        monteCarloIterations: finance.iterations,
        doseResponse: DOSE_RESPONSE_PARAMS,
        calibration: calReport,
        assumptions: assumptionRegister(plan.primarySignal, plan.market),
        pendingAssumptionOverrides: pendingAssumptionOverrides.length ? pendingLifeAssumptionItems(lifeAssumptions, plan.market) : undefined,
        selectedLifeAssumptionSet: selectedLifeAssumptions
          ? {
              id: selectedLifeAssumptions.version.id,
              name: selectedLifeAssumptions.version.name,
              source: selectedLifeAssumptions.version.source,
            }
          : undefined,
        selectedSegmentSet: selectedSegments
          ? {
              id: selectedSegments.version.id,
              name: selectedSegments.version.name,
              source: selectedSegments.version.source,
              rowCount: selectedSegments.rowCount,
            }
          : undefined,
        modelRegistryVersion: activeModelModuleSummary().registryVersion,
        modelModules: activeModelModuleSummary().modules,
        rewardStrategy,
        rewardAllocation,
        rewardStrategyExplanation,
        lifeInsuranceValue,
        seed,
        runMode,
        behaviorSegments: rawBehavior.segments,
        rewardCurveShape: rawBehavior.rewardCurveShape,
        doseResponseArms: rawBehavior.doseResponseArms,
        caveat: incentiveDesign
          ? "This is an illustrative planning estimate using strict live-model member decisions. Claims savings use claims-denominated bridge assumptions, selection haircuts and discounting; life value is separate and all assumptions require insurer validation before production use."
          : "This is an impact-only planning estimate using strict live-model member decisions. ROI is intentionally unavailable until reward, admin and platform costs are configured; gross value uses claims-denominated bridge assumptions and discounted value paths.",
      };
      send({ type: "methodology", report: methodology });

      // Plain-English executive read-out generated from the run's real numbers.
      send({ type: "thought", text: "Writing the plain-English read-out — translating the distributions into what happened, what it's worth, and what to do about the reward." });
      const narrative: NarrativeReport = await generateNarrative(plan, behavior, finance);
      if (closed) return;
      send({ type: "narrative", report: narrative });

      const runId = randomUUID();
      try {
        await storage.saveRun({
          id: runId,
          organizationId: ctx.organizationId,
          createdBy: ctx.actor,
          goal,
          plan: JSON.stringify(plan),
          behavior: JSON.stringify(behavior),
          finance: JSON.stringify(finance),
          createdAt: Date.now(),
        });
        await audit(ctx, "simulation.completed", "run", runId, `Completed ${plan.campaignLabel} simulation for ${plan.marketLabel}.`, {
          campaign: plan.primarySignal,
          market: plan.market,
          sampleSize: plan.sampleSize,
          runMode,
          seed,
          selectedLifeAssumptionSet: methodology.selectedLifeAssumptionSet?.id ?? null,
          selectedSegmentSet: methodology.selectedSegmentSet?.id ?? null,
        });
        for (const signalId of plan.signals) {
          const signal = getSignal(signalId);
          if (signal.evidenceTier !== "Experimental") continue;
          await storage.saveEvidenceCollectionRecord({
            id: randomUUID(),
            organizationId: ctx.organizationId,
            runId,
            signalId,
            evidenceTier: signal.evidenceTier,
            behaviorChange: Math.round(behavior.behaviorChangeRate * 10000),
            observedOutcome: "pending_backtest_upload",
            memberCount: Math.round(behavior.behaviorChangeRate * plan.bookSize),
            metadata: JSON.stringify({
              planSignals: plan.signals,
              fusion: plan.fusion ?? null,
              note: "Experimental signal engagement-only run; claims impact requires observed outcome upload.",
            }),
            createdAt: Date.now(),
          });
        }
      } catch {
        /* persistence best-effort */
      }
      send({ type: "done", runId });
      res.end();
    } catch (err: any) {
      if (!closed) {
        send({ type: "error", message: err?.message || "Simulation failed" });
        res.end();
      }
    }
  });

  // Growth simulation stream (SSE) — the commercial clock. Separate from the
  // actuarial /api/simulate: models additional buying (riders, top-ups, second
  // products) and program-driven new customers via referral and visibility,
  // with a quarterly cash P&L. Never models carrier switching.
  app.get("/api/growth", async (req: Request, res: Response) => {
    const ctx = requestContext(req);
    enterModel(String(req.query.modelId || ""));
    const goal = String(req.query.goal || "").trim();
    const requestedSample = parseInt(String(req.query.sample || "60"), 10) || 60;
    const sampleSize = Math.max(12, Math.min(MAX_AGENT_SAMPLE, requestedSample));
    const rewardPmpmRaw = parseFloat(String(req.query.rewardPmpm || ""));
    if (!goal) {
      res.status(400).json({ message: "goal is required" });
      return;
    }

    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    });
    const send = (e: StreamEvent) => {
      res.write(`data: ${JSON.stringify(e)}\n\n`);
    };
    let closed = false;
    req.on("close", () => {
      closed = true;
    });

    try {
      send({ type: "thought", text: "Growth run: parsing the programme objective, then asking each member two commercial questions — would you buy additional cover, and would you refer the programme? No switching is modelled; only additional buying." });
      const plan = await resolvePlan(goal, sampleSize);
      const rewardPmpm = Number.isFinite(rewardPmpmRaw) && rewardPmpmRaw >= 0 ? Math.min(250, rewardPmpmRaw) : plan.probeReward;
      plan.assumedOfferPmpm = rewardPmpm;
      if (closed) return;
      send({
        type: "plan",
        plan,
        thought: `Growth plan locked: ${plan.campaignLabel} programme for a ${plan.bookSize.toLocaleString()}-member ${plan.marketLabel} book, $${rewardPmpm} PMPM reward. First the wellness engagement pass, then the commercial pass (upsell + referral), then a quarterly cash P&L with channel-specific acquisition costs.`,
      });

      const seed = hashSeed(`growth|${goal}|${plan.market}|${plan.sampleSize}|${rewardPmpm}`);
      const agents = generatePopulationSample(plan.market, plan.sampleSize, seed);
      send({ type: "population_init", total: plan.bookSize, sampleSize: plan.sampleSize, wearablePct: MARKET_WEARABLE_PRIOR[plan.market] });
      for (const a of agents) {
        if (closed) return;
        send({ type: "agent_spawned", agent: a });
      }

      // Pass 1 — wellness engagement (same engine as the book-health sim).
      send({ type: "thought", text: `Pass 1/2: ${plan.sampleSize} member-agents decide whether they enrol and engage with the programme.` });
      let completed = 0;
      const engagementBatches = await mapConcurrent(
        chunk(agents, AGENT_BATCH_SIZE),
        AGENT_LLM_CONCURRENCY,
        (batch) => runAgentBatch(batch, plan),
        (batchDecisions) => {
          if (closed) return;
          for (const d of batchDecisions) {
            completed++;
            send({ type: "agent_decision", decision: d, completed, total: agents.length });
          }
        }
      );
      const decisions: AgentDecision[] = engagementBatches.flat();
      if (closed) return;
      const rates = aggregateBehavior(decisions);
      send({ type: "behavior", rates });

      // Pass 2 — commercial questions, conditioned on each member's outcome.
      send({ type: "thought", text: `Pass 2/2: the same members decide on ADDITIONAL buying (CI rider, top-up, savings plan) and whether they'd refer the programme — conditioned on what each one actually did in pass 1. Engaged members get warmer; financially pressured members add no premium regardless.` });
      const pairs = decisions.map((d) => ({ agent: d.agent, engagement: d.decision }));
      let growthCompleted = 0;
      const growthBatches = await mapConcurrent(
        chunk(pairs, AGENT_BATCH_SIZE),
        AGENT_LLM_CONCURRENCY,
        (batch) => runGrowthBatch(batch, plan),
        (batchDecisions) => {
          if (closed) return;
          for (const d of batchDecisions) {
            growthCompleted++;
            send({ type: "growth_decision", decision: d, completed: growthCompleted, total: pairs.length });
          }
        }
      );
      const growthDecisions: GrowthDecision[] = growthBatches.flat();
      if (closed) return;

      const llmCount = decisions.filter((d) => d.mode === "llm").length + growthDecisions.filter((d) => d.mode === "llm").length;
      const totalCount = decisions.length + growthDecisions.length;
      const runMode = llmCount === totalCount ? "llm" : llmCount === 0 ? "heuristic" : "mixed";
      send({
        type: "mode",
        mode: runMode,
        message:
          runMode === "llm"
            ? `All member decisions used live AI (${AGENT_PROVIDER_LABEL}).`
            : `${totalCount - llmCount}/${totalCount} decisions used heuristic fallback.`,
      });

      const growthBehavior = aggregateGrowth(growthDecisions);
      send({ type: "growth_behavior", behavior: growthBehavior });
      send({
        type: "thought",
        text: `Commercial signals from the sample: ${(growthBehavior.upsellRateEngaged * 100).toFixed(0)}% of engaged members would add cover vs ${(growthBehavior.upsellRateOther * 100).toFixed(0)}% organic baseline (only the excess is credited), ${(growthBehavior.referralRate * 100).toFixed(0)}% of engaged members refer, ${growthBehavior.referralsPerEngaged.toFixed(1)} mentions each. Now pricing three channels at realistic acquisition costs and phasing cash by quarter.`,
      });

      const result = evaluateGrowth(
        {
          bookSize: plan.bookSize,
          market: plan.market,
          horizonMonths: plan.horizonMonths,
          rewardPmpm,
          enrolledShare: rates.enrollmentRate,
          behavior: growthBehavior,
        },
        seed
      );
      if (closed) return;
      send({ type: "growth_result", result });

      const runId = randomUUID();
      try {
        await audit(ctx, "growth.completed", "run", runId, `Completed growth simulation for ${plan.marketLabel}.`, {
          market: plan.market,
          sampleSize: plan.sampleSize,
          runMode,
          seed,
          paybackQuarter: result.paybackQuarter,
        });
      } catch {
        /* best-effort */
      }
      send({ type: "done", runId });
      res.end();
    } catch (err: any) {
      if (!closed) {
        send({ type: "error", message: err?.message || "Growth simulation failed" });
        res.end();
      }
    }
  });

  return httpServer;
}

function buildCritique(plan: ResolvedPlan, behavior: BehaviorRates, cal: CalibrationReport): string {
  const parts: string[] = [];
  parts.push(
    `Where I'm least confident: the behaviour-change rate of ${(behavior.behaviorChangeRate * 100).toFixed(0)}% (95% CI ${(behavior.behaviorChangeCI[0] * 100).toFixed(0)}–${(behavior.behaviorChangeCI[1] * 100).toFixed(0)}%) drives most of the financial spread; that band is sampling error from ${behavior.sampleSize} agents.`
  );
  parts.push(
    `I shrank the raw agent rates toward published anchors (weight ${cal.shrinkage.toFixed(2)}) so levels aren't invented, but the anchor bands themselves carry uncertainty.`
  );
  parts.push(
    `Dose-response (behaviour → claims) is sampled across each study's confidence interval, and cross-sell is held strictly separate from evidence-backed value so proven and assumed return are never conflated.`
  );
  return parts.join(" ");
}
