import { users, runs, scenarios, backtests, segmentUploads, modelInputVersions, auditEvents, evidenceCollectionRecords } from "@shared/tables";
import type { User, InsertUser, Run, InsertRun, Backtest, SegmentUpload, ModelInputVersion, Scenario, AuditEvent, EvidenceCollectionRecord } from "@shared/tables";
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { and, eq, desc } from "drizzle-orm";

const sqlitePath = process.env.SQLITE_PATH || (process.env.VERCEL ? "/tmp/healthid-data.db" : "data.db");
const sqlite = new Database(sqlitePath);
sqlite.pragma("journal_mode = WAL");

// Ensure tables exist (template doesn't run migrations automatically here)
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS runs (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL DEFAULT 'demo-org',
    created_by TEXT NOT NULL DEFAULT 'system',
    goal TEXT NOT NULL,
    plan TEXT NOT NULL,
    behavior TEXT NOT NULL,
    finance TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS scenarios (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL DEFAULT 'demo-org',
    created_by TEXT NOT NULL DEFAULT 'system',
    name TEXT NOT NULL,
    goal TEXT NOT NULL,
    plan TEXT NOT NULL,
    behavior TEXT NOT NULL,
    finance TEXT NOT NULL,
    methodology TEXT NOT NULL,
    narrative TEXT,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS backtests (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL DEFAULT 'demo-org',
    created_by TEXT NOT NULL DEFAULT 'system',
    campaign TEXT NOT NULL,
    market TEXT NOT NULL,
    book_size INTEGER NOT NULL,
    reward_pmpm INTEGER NOT NULL,
    observed_enrollment INTEGER NOT NULL,
    observed_persistence INTEGER NOT NULL,
    observed_claims_delta INTEGER NOT NULL,
    notes TEXT,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS segment_uploads (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL DEFAULT 'demo-org',
    created_by TEXT NOT NULL DEFAULT 'system',
    name TEXT NOT NULL,
    market TEXT NOT NULL,
    source TEXT NOT NULL,
    row_count INTEGER NOT NULL,
    rows TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS model_input_versions (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL DEFAULT 'demo-org',
    created_by TEXT NOT NULL DEFAULT 'system',
    kind TEXT NOT NULL,
    name TEXT NOT NULL,
    status TEXT NOT NULL,
    source TEXT NOT NULL,
    payload TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    approved_at INTEGER
  );
  CREATE TABLE IF NOT EXISTS audit_events (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL DEFAULT 'demo-org',
    actor TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'system',
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    summary TEXT NOT NULL,
    metadata TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS evidence_collection_records (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL DEFAULT 'demo-org',
    run_id TEXT NOT NULL,
    signal_id TEXT NOT NULL,
    evidence_tier TEXT NOT NULL,
    behavior_change INTEGER NOT NULL,
    observed_outcome TEXT NOT NULL,
    member_count INTEGER NOT NULL,
    metadata TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );
`);

for (const statement of [
  "ALTER TABLE runs ADD COLUMN organization_id TEXT NOT NULL DEFAULT 'demo-org'",
  "ALTER TABLE runs ADD COLUMN created_by TEXT NOT NULL DEFAULT 'system'",
  "ALTER TABLE scenarios ADD COLUMN organization_id TEXT NOT NULL DEFAULT 'demo-org'",
  "ALTER TABLE scenarios ADD COLUMN created_by TEXT NOT NULL DEFAULT 'system'",
  "ALTER TABLE backtests ADD COLUMN organization_id TEXT NOT NULL DEFAULT 'demo-org'",
  "ALTER TABLE backtests ADD COLUMN created_by TEXT NOT NULL DEFAULT 'system'",
  "ALTER TABLE segment_uploads ADD COLUMN organization_id TEXT NOT NULL DEFAULT 'demo-org'",
  "ALTER TABLE segment_uploads ADD COLUMN created_by TEXT NOT NULL DEFAULT 'system'",
  "ALTER TABLE model_input_versions ADD COLUMN organization_id TEXT NOT NULL DEFAULT 'demo-org'",
  "ALTER TABLE model_input_versions ADD COLUMN created_by TEXT NOT NULL DEFAULT 'system'",
  "ALTER TABLE audit_events ADD COLUMN organization_id TEXT NOT NULL DEFAULT 'demo-org'",
  "ALTER TABLE audit_events ADD COLUMN role TEXT NOT NULL DEFAULT 'system'",
]) {
  try {
    sqlite.exec(statement);
  } catch {
    // Column already exists.
  }
}

export const db = drizzle(sqlite);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  saveRun(run: InsertRun): Promise<Run>;
  getRecentRuns(limit?: number, organizationId?: string): Promise<Run[]>;
  saveScenario(scenario: Scenario): Promise<Scenario>;
  getScenarios(limit?: number, organizationId?: string): Promise<Scenario[]>;
  saveBacktest(bt: Backtest): Promise<Backtest>;
  getBacktests(limit?: number, organizationId?: string): Promise<Backtest[]>;
  saveSegmentUpload(upload: SegmentUpload): Promise<SegmentUpload>;
  getSegmentUploads(limit?: number, organizationId?: string): Promise<SegmentUpload[]>;
  getSegmentUpload(id: string, organizationId?: string): Promise<SegmentUpload | undefined>;
  saveModelInputVersion(version: ModelInputVersion): Promise<ModelInputVersion>;
  getModelInputVersions(limit?: number, organizationId?: string): Promise<ModelInputVersion[]>;
  saveAuditEvent(event: AuditEvent): Promise<AuditEvent>;
  getAuditEvents(limit?: number, organizationId?: string): Promise<AuditEvent[]>;
  saveEvidenceCollectionRecord(record: EvidenceCollectionRecord): Promise<EvidenceCollectionRecord>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    return db.select().from(users).where(eq(users.id, id)).get();
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return db.select().from(users).where(eq(users.username, username)).get();
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    return db.insert(users).values(insertUser).returning().get();
  }

  async saveRun(run: InsertRun): Promise<Run> {
    return db.insert(runs).values(run).returning().get();
  }

  async getRecentRuns(limit = 10, organizationId = "demo-org"): Promise<Run[]> {
    return db.select().from(runs).where(eq(runs.organizationId, organizationId)).orderBy(desc(runs.createdAt)).limit(limit).all();
  }

  async saveScenario(scenario: Scenario): Promise<Scenario> {
    return db.insert(scenarios).values(scenario).returning().get();
  }

  async getScenarios(limit = 50, organizationId = "demo-org"): Promise<Scenario[]> {
    return db.select().from(scenarios).where(eq(scenarios.organizationId, organizationId)).orderBy(desc(scenarios.createdAt)).limit(limit).all();
  }

  async saveBacktest(bt: Backtest): Promise<Backtest> {
    return db.insert(backtests).values(bt).returning().get();
  }

  async getBacktests(limit = 50, organizationId = "demo-org"): Promise<Backtest[]> {
    return db.select().from(backtests).where(eq(backtests.organizationId, organizationId)).orderBy(desc(backtests.createdAt)).limit(limit).all();
  }

  async saveSegmentUpload(upload: SegmentUpload): Promise<SegmentUpload> {
    return db.insert(segmentUploads).values(upload).returning().get();
  }

  async getSegmentUploads(limit = 20, organizationId = "demo-org"): Promise<SegmentUpload[]> {
    return db.select().from(segmentUploads).where(eq(segmentUploads.organizationId, organizationId)).orderBy(desc(segmentUploads.createdAt)).limit(limit).all();
  }

  async getSegmentUpload(id: string, organizationId = "demo-org"): Promise<SegmentUpload | undefined> {
    return db.select().from(segmentUploads).where(and(eq(segmentUploads.id, id), eq(segmentUploads.organizationId, organizationId))).get();
  }

  async saveModelInputVersion(version: ModelInputVersion): Promise<ModelInputVersion> {
    return db.insert(modelInputVersions).values(version).returning().get();
  }

  async getModelInputVersions(limit = 50, organizationId = "demo-org"): Promise<ModelInputVersion[]> {
    return db.select().from(modelInputVersions).where(eq(modelInputVersions.organizationId, organizationId)).orderBy(desc(modelInputVersions.createdAt)).limit(limit).all();
  }

  async saveAuditEvent(event: AuditEvent): Promise<AuditEvent> {
    return db.insert(auditEvents).values(event).returning().get();
  }

  async getAuditEvents(limit = 100, organizationId = "demo-org"): Promise<AuditEvent[]> {
    return db.select().from(auditEvents).where(eq(auditEvents.organizationId, organizationId)).orderBy(desc(auditEvents.createdAt)).limit(limit).all();
  }

  async saveEvidenceCollectionRecord(record: EvidenceCollectionRecord): Promise<EvidenceCollectionRecord> {
    return db.insert(evidenceCollectionRecords).values(record).returning().get();
  }
}

export const storage = new DatabaseStorage();
