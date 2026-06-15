// ===========================================================================
// Model registry — "models = assumption sets" (Assumptions Studio brief §1, §6).
//
// A Model = a VersionedAssumptionSet payload + ModelMeta governance metadata.
// resolveActiveModel(modelId) is the single entry point the engine uses to pick
// which assumptions a request runs against (replaces the old hardcoded
// activeAssumptionSet()). Model 1 is the evidence floor; Model 2 is a forward
// fork of Model 1 stored as a labelled diff so the Studio can show what differs
// from the floor and why. Model 3 (pure-AI, internal_only) is stubbed.
// ===========================================================================

import type {
  ModelAdjustment,
  ModelChangeLogEntry,
  ModelMeta,
  ModelSummary,
} from "@shared/models";
import { isBuyerSelectable } from "@shared/models";
import {
  DEFAULT_ASSUMPTION_SET,
  EVIDENCE_ASSUMPTION_SET,
  type VersionedAssumptionSet,
} from "./assumptionSets";

export interface Model {
  meta: ModelMeta;
  set: VersionedAssumptionSet;
  // For child models: the labelled adjustments applied to the parent. Empty for roots.
  adjustments: ModelAdjustment[];
}

// --- path helpers (apply a forward fork's labelled diffs onto a clone) --------

function deepClone<T>(value: T): T {
  // structuredClone is available in the Node 18+ / Vercel runtime this targets.
  return structuredClone(value);
}

function getPath(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object") return (acc as Record<string, unknown>)[key];
    return undefined;
  }, obj);
}

function setPath(obj: unknown, path: string, value: unknown): void {
  const keys = path.split(".");
  const last = keys.pop()!;
  const target = keys.reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object") return (acc as Record<string, unknown>)[key];
    return undefined;
  }, obj);
  if (target && typeof target === "object") {
    (target as Record<string, unknown>)[last] = value;
  }
}

// Apply adjustments to a cloned set, capturing fromValue for the diff view.
function applyAdjustments(
  base: VersionedAssumptionSet,
  adjustments: Array<Omit<ModelAdjustment, "fromValue">>,
): { set: VersionedAssumptionSet; resolved: ModelAdjustment[] } {
  const set = deepClone(base);
  const resolved: ModelAdjustment[] = adjustments.map((adj) => {
    const fromValue = getPath(set, adj.path) as number | string;
    setPath(set, adj.path, adj.toValue);
    return { ...adj, fromValue };
  });
  return { set, resolved };
}

// --- Model 1: evidence floor --------------------------------------------------

const MODEL_1_META: ModelMeta = {
  id: "model-1-evidence-floor",
  name: "Evidence Floor",
  basis: "evidence",
  governanceStatus: "signed",
  confidencePosture: "floor",
  visibility: "buyer_facing",
  version: EVIDENCE_ASSUMPTION_SET.version,
  owner: "HealthID actuarial",
  signedBy: "HealthID actuarial",
  signedAt: "2026-06-01T00:00:00.000Z",
  summary: "Published-evidence, regulator-anchored assumptions. The conservative case every number can clear.",
};

const MODEL_1: Model = {
  meta: MODEL_1_META,
  set: EVIDENCE_ASSUMPTION_SET,
  adjustments: [],
};

// --- Model 2: forward / upside (a labelled fork of Model 1) -------------------
// Each lever carries a rationale and provenanceType (forward or ai_projected).
// No un-rationalised "bigger number" edits (brief §6).
const MODEL_2_ADJUSTMENTS: Array<Omit<ModelAdjustment, "fromValue">> = [
  {
    path: "economic.discounting.valuationHorizonYears",
    label: "Valuation horizon",
    toValue: 5,
    rationale:
      "Extend the PV valuation window 3 → 5 years so the multi-year persistence below can actually be booked. Within the medium-term horizon insurers use for wellness ROI; longer claims tails are simply not credited.",
    provenanceType: "forward",
  },
  {
    path: "economic.persistedSavingsYears",
    label: "Persisting-member savings window",
    toValue: 5,
    rationale:
      "Wagner 2001 (JAMA) shows claims savings persist across years 1–4+ for sustained behaviour change; the forward case books persisters over the full 5-year PV-discounted window (3 → 5). Biggest single lever; faders keep the 1-year window.",
    provenanceType: "forward",
  },
  {
    path: "economic.claimsBridge.steps.attributionFactor",
    label: "Steps claims attribution",
    toValue: 0.5,
    rationale:
      "Upper end of the causal range (0.30 → 0.50): verified, sustained engagement narrows the selection gap that drove offer-only RCTs toward null. Bounded below the ~0.6 observational gradient.",
    provenanceType: "forward",
  },
  {
    path: "economic.claimsBridge.hba1c_screening.attributionFactor",
    label: "HbA1c claims attribution",
    toValue: 0.55,
    rationale:
      "HbA1c is the best-evidenced pathway; the forward case credits the upper bound of the sustained-1pt-drop savings (0.35 → 0.55) for a verified-outcome programme.",
    provenanceType: "forward",
  },
  {
    path: "lifeInsurance.mortalityMargin.attributionFactor",
    label: "Mortality-margin attribution",
    toValue: 0.45,
    rationale:
      "Mirrors the claims-bridge forward attribution lift (0.30 → 0.45): verified activity data is assumed to reduce healthy-user bias in the mortality gradient.",
    provenanceType: "forward",
  },
  {
    path: "economic.rewardCostRatio",
    label: "Reward cost ratio (breakage / co-funding)",
    toValue: 0.55,
    rationale:
      "Credit IFRS-15 redemption breakage (~31–33%) plus 5–15% partner co-funding (Vitality-style ecosystems): only ~55% of reward face value is actually funded (0.70 → 0.55), lowering the cost denominator.",
    provenanceType: "forward",
  },
  {
    path: "economic.ltvPerMember",
    label: "LTV per member",
    toValue: 1800,
    rationale:
      "Upper end of the AIA FY2024 VONB-margin LTV range (1,400 → 1,800) for a verified, higher-persistency book.",
    provenanceType: "forward",
  },
  {
    path: "economic.claimsValueMultiplier",
    label: "Claims realisation multiplier",
    toValue: 1.35,
    rationale:
      "Prices a +35% realisation of claims value (1.0 → 1.35) for well-evidenced signals whose per-signal attribution is already capped by the evidence-tier mask — the lever that lets verified, sustained engagement convert more of the modelled gradient into bookable savings.",
    provenanceType: "forward",
  },
];

const MODEL_2_BUILD = applyAdjustments(
  { ...EVIDENCE_ASSUMPTION_SET },
  MODEL_2_ADJUSTMENTS,
);

const MODEL_2_META: ModelMeta = {
  id: "model-2-forward-upside",
  name: "Forward / Upside",
  basis: "forward",
  governanceStatus: "draft",
  confidencePosture: "ceiling",
  visibility: "buyer_facing",
  parentModelId: MODEL_1_META.id,
  version: "1.0.0-forward",
  owner: "HealthID actuarial",
  summary: "A labelled forward fork of the Evidence Floor — higher attribution and persistence, every lever rationalised.",
};

const MODEL_2: Model = {
  meta: { ...MODEL_2_META, version: `${EVIDENCE_ASSUMPTION_SET.version}-forward` },
  set: { ...MODEL_2_BUILD.set, id: MODEL_2_META.id, label: MODEL_2_META.name, status: "draft" },
  adjustments: MODEL_2_BUILD.resolved,
};

// --- Model 3: pure-AI sandbox (stub — internal_only, UI deferred per brief §7)
const MODEL_3_META: ModelMeta = {
  id: "model-3-ai-sandbox",
  name: "AI Sandbox (exploratory)",
  basis: "ai",
  governanceStatus: "draft",
  confidencePosture: "ceiling",
  visibility: "internal_only",
  parentModelId: MODEL_1_META.id,
  version: "0.0.1-ai",
  owner: "HealthID research",
  summary: "Internal-only AI-projected stress-test set. Not selectable in buyer-facing contexts.",
};

const MODEL_3: Model = {
  meta: MODEL_3_META,
  // Stub: reuse the illustrative v0 set as a stand-in payload until the AI pass
  // is built (brief §7 — data model now, UI deferred).
  set: { ...DEFAULT_ASSUMPTION_SET, id: MODEL_3_META.id, label: MODEL_3_META.name, status: "illustrative" },
  adjustments: [],
};

// --- registry -----------------------------------------------------------------

const MODELS: Model[] = [MODEL_1, MODEL_2, MODEL_3];
const MODELS_BY_ID = new Map(MODELS.map((m) => [m.meta.id, m]));

export const DEFAULT_MODEL_ID = MODEL_1.meta.id;

export function listModels(): Model[] {
  return MODELS;
}

// Resolve the Model a request runs against. Unknown / undefined → Model 1 floor.
// internal_only models are never resolved as the active model in a buyer context
// unless explicitly allowed (Studio / internal tooling).
export function resolveActiveModel(modelId?: string, opts?: { allowInternal?: boolean }): Model {
  if (!modelId) return MODEL_1;
  const found = MODELS_BY_ID.get(modelId);
  if (!found) return MODEL_1;
  if (!opts?.allowInternal && !isBuyerSelectable(found.meta)) {
    // Guard: an internal_only model can never become the default for a
    // buyer-facing session (brief §3). Fall back to the floor.
    return MODEL_1;
  }
  return resolveWithOverrides(found)!;
}

export function getModel(modelId: string): Model | undefined {
  return resolveWithOverrides(MODELS_BY_ID.get(modelId));
}

// --- Studio edits: in-memory override store + change log (brief §2, §5) -------
// Edits made in the Model Studio are applied as per-path overrides on top of a
// Model's base set, logged with rationale + actor. This is the edit → re-run →
// live-update loop: the next /api/simulate against this model picks them up.
// (In-memory for the demo; the change log is the governance record.)

const overrides = new Map<string, Map<string, number | string>>();
const changeLog: ModelChangeLogEntry[] = [];
let changeSeq = 0;

function resolveWithOverrides(model: Model | undefined): Model | undefined {
  if (!model) return undefined;
  const ov = overrides.get(model.meta.id);
  if (!ov || ov.size === 0) return model;
  const set = deepClone(model.set);
  for (const [path, value] of ov) setPath(set, path, value);
  return { ...model, set };
}

export function applyModelOverride(input: {
  modelId: string;
  path: string;
  label: string;
  toValue: number | string;
  rationale: string;
  actor: string;
  at: string;
}): { ok: true; entry: ModelChangeLogEntry } | { ok: false; error: string } {
  const base = MODELS_BY_ID.get(input.modelId);
  if (!base) return { ok: false, error: "unknown model" };
  if (base.meta.governanceStatus === "signed") {
    // Provenance integrity: a signed floor can't be silently edited (brief §5).
    return { ok: false, error: "model is signed; fork or unlock before editing" };
  }
  if (!input.rationale?.trim()) {
    return { ok: false, error: "rationale required for every edit" };
  }
  const fromValue = (getPath(resolveWithOverrides(base)!.set, input.path) ?? "") as number | string;
  let ov = overrides.get(input.modelId);
  if (!ov) overrides.set(input.modelId, (ov = new Map()));
  ov.set(input.path, input.toValue);
  const entry: ModelChangeLogEntry = {
    id: `chg-${++changeSeq}`,
    modelId: input.modelId,
    path: input.path,
    label: input.label,
    fromValue,
    toValue: input.toValue,
    rationale: input.rationale.trim(),
    actor: input.actor,
    at: input.at,
  };
  changeLog.push(entry);
  return { ok: true, entry };
}

export function getChangeLog(modelId?: string): ModelChangeLogEntry[] {
  return modelId ? changeLog.filter((e) => e.modelId === modelId) : changeLog;
}

// Sign-off: name + date a draft model → governed signed floor (brief §5).
export function signModel(modelId: string, signedBy: string, at: string): { ok: boolean; error?: string } {
  const model = MODELS_BY_ID.get(modelId);
  if (!model) return { ok: false, error: "unknown model" };
  model.meta.governanceStatus = "signed";
  model.meta.signedBy = signedBy;
  model.meta.signedAt = at;
  return { ok: true };
}

// Metadata-only list for the /api/models endpoint and the switcher.
export function listModelSummaries(opts?: { buyerContext?: boolean }): ModelSummary[] {
  const buyerContext = opts?.buyerContext ?? true;
  return MODELS.map((m) => ({
    ...m.meta,
    selectableInBuyerContext: isBuyerSelectable(m.meta) || !buyerContext,
  }));
}
