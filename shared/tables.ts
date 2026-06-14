import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// ---------------------------------------------------------------------------
// Persistence: completed simulation runs (optional history)
// ---------------------------------------------------------------------------
export const runs = sqliteTable("runs", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").notNull().default("demo-org"),
  createdBy: text("created_by").notNull().default("system"),
  goal: text("goal").notNull(),
  plan: text("plan").notNull(), // JSON ResolvedPlan
  behavior: text("behavior").notNull(), // JSON BehaviorRates
  finance: text("finance").notNull(), // JSON MonteCarloResult
  createdAt: integer("created_at").notNull(),
});

export const insertRunSchema = createInsertSchema(runs);
export type InsertRun = z.infer<typeof insertRunSchema>;
export type Run = typeof runs.$inferSelect;

export const scenarios = sqliteTable("scenarios", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").notNull().default("demo-org"),
  createdBy: text("created_by").notNull().default("system"),
  name: text("name").notNull(),
  goal: text("goal").notNull(),
  plan: text("plan").notNull(),
  behavior: text("behavior").notNull(),
  finance: text("finance").notNull(),
  methodology: text("methodology").notNull(),
  narrative: text("narrative"),
  createdAt: integer("created_at").notNull(),
});
export const insertScenarioSchema = createInsertSchema(scenarios).omit({ id: true, createdAt: true });
export type InsertScenario = z.infer<typeof insertScenarioSchema>;
export type Scenario = typeof scenarios.$inferSelect;

export const backtests = sqliteTable("backtests", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").notNull().default("demo-org"),
  createdBy: text("created_by").notNull().default("system"),
  campaign: text("campaign").notNull(),
  market: text("market").notNull(),
  bookSize: integer("book_size").notNull(),
  rewardPerMemberPerMonth: integer("reward_pmpm").notNull(),
  observedEnrollment: integer("observed_enrollment").notNull(),
  observedPersistence: integer("observed_persistence").notNull(),
  observedClaimsDeltaPct: integer("observed_claims_delta").notNull(),
  notes: text("notes"),
  createdAt: integer("created_at").notNull(),
});
export const insertBacktestSchema = createInsertSchema(backtests).omit({ id: true, createdAt: true });
export type InsertBacktest = z.infer<typeof insertBacktestSchema>;
export type Backtest = typeof backtests.$inferSelect;

export const evidenceCollectionRecords = sqliteTable("evidence_collection_records", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").notNull().default("demo-org"),
  runId: text("run_id").notNull(),
  signalId: text("signal_id").notNull(),
  evidenceTier: text("evidence_tier").notNull(),
  behaviorChange: integer("behavior_change").notNull(),
  observedOutcome: text("observed_outcome").notNull(),
  memberCount: integer("member_count").notNull(),
  metadata: text("metadata").notNull(),
  createdAt: integer("created_at").notNull(),
});
export const insertEvidenceCollectionRecordSchema = createInsertSchema(evidenceCollectionRecords).omit({ id: true, createdAt: true });
export type InsertEvidenceCollectionRecord = z.infer<typeof insertEvidenceCollectionRecordSchema>;
export type EvidenceCollectionRecord = typeof evidenceCollectionRecords.$inferSelect;

export const segmentUploads = sqliteTable("segment_uploads", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").notNull().default("demo-org"),
  createdBy: text("created_by").notNull().default("system"),
  name: text("name").notNull(),
  market: text("market").notNull(),
  source: text("source").notNull(),
  rowCount: integer("row_count").notNull(),
  rows: text("rows").notNull(),
  createdAt: integer("created_at").notNull(),
});
export const insertSegmentUploadSchema = createInsertSchema(segmentUploads).omit({ id: true, rowCount: true, rows: true, createdAt: true }).extend({
  rows: z.array(z.object({
    id: z.string().min(1),
    label: z.string().min(1),
    weight: z.number().min(0).max(1),
    ageBand: z.string().min(1),
    baselineSteps: z.number().min(0).max(50000),
    mortalityPer1k: z.number().min(0).max(1000),
    wearableOwnership: z.number().min(0).max(1),
    modifiabilityIndex: z.number().min(0).max(1),
    rewardSensitivity: z.number().min(0).max(1),
    source: z.string().min(1),
  })).min(1).max(100),
});
export type InsertSegmentUpload = z.infer<typeof insertSegmentUploadSchema>;
export type SegmentUpload = typeof segmentUploads.$inferSelect;

export const modelInputVersions = sqliteTable("model_input_versions", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").notNull().default("demo-org"),
  createdBy: text("created_by").notNull().default("system"),
  kind: text("kind").notNull(),
  name: text("name").notNull(),
  status: text("status").notNull(),
  source: text("source").notNull(),
  payload: text("payload").notNull(),
  createdAt: integer("created_at").notNull(),
  approvedAt: integer("approved_at"),
});
export const insertModelInputVersionSchema = createInsertSchema(modelInputVersions)
  .omit({ id: true, status: true, payload: true, createdAt: true, approvedAt: true })
  .extend({
    kind: z.enum([
      "life_assumptions",
      "segment_set",
      "claims_bridge",
      "discounting",
      "cost_basis",
      "claims_tiers",
      "behavior_calibration",
      "group_productivity",
      "mortality_table",
    ]),
    payload: z.record(z.string(), z.unknown()),
  });
export type InsertModelInputVersion = z.infer<typeof insertModelInputVersionSchema>;
export type ModelInputVersion = typeof modelInputVersions.$inferSelect;

export const auditEvents = sqliteTable("audit_events", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").notNull().default("demo-org"),
  actor: text("actor").notNull(),
  role: text("role").notNull().default("system"),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id"),
  summary: text("summary").notNull(),
  metadata: text("metadata").notNull(),
  createdAt: integer("created_at").notNull(),
});
export const insertAuditEventSchema = createInsertSchema(auditEvents).omit({ id: true, createdAt: true });
export type InsertAuditEvent = z.infer<typeof insertAuditEventSchema>;
export type AuditEvent = typeof auditEvents.$inferSelect;
