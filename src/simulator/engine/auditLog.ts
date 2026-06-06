import type { AuditEntry, InterventionId, ScenarioAssumptions, BehaviourLeverId } from '../types';
import type { HealthMetric } from '@/types';
import { MODEL_VERSION } from '../constants';

let auditCounter = 0;

function makeEntry(
  action: string,
  layer: string,
  detail: string,
  signalsUsed: HealthMetric[],
  rulesFired: string[],
  evidenceCited: string[],
  assumptions: Record<string, number>,
): AuditEntry {
  auditCounter++;
  return {
    id: `audit_${Date.now()}_${auditCounter}`,
    timestamp: new Date().toISOString(),
    action,
    layer,
    detail,
    signalsUsed,
    rulesFired,
    evidenceCited,
    assumptions,
    modelVersion: MODEL_VERSION,
  };
}

export function generateAuditTrail(params: {
  scenarioId: string;
  signals: HealthMetric[];
  interventionIds: InterventionId[];
  assumptions: ScenarioAssumptions;
  cohortSize: number;
  leverBaselines: Record<BehaviourLeverId, number>;
  leverTargets: Record<BehaviourLeverId, number>;
}): AuditEntry[] {
  const { scenarioId, signals, interventionIds, assumptions, cohortSize, leverBaselines } = params;
  const entries: AuditEntry[] = [];

  // L1: Signal ingestion
  entries.push(makeEntry(
    'signal_ingestion',
    'L1 — Signal Matrix',
    `Loaded ${signals.length} health signals for simulation. Scenario: ${scenarioId}`,
    signals,
    [],
    [],
    {},
  ));

  // L2: Confidence scoring
  entries.push(makeEntry(
    'confidence_scoring',
    'L2 — Confidence Scoring',
    `Scored data confidence and evidence confidence for ${signals.length} signals across available sources.`,
    signals,
    [],
    [],
    { realizationFactor: assumptions.realizationFactor, verificationRate: assumptions.verificationRate },
  ));

  // L3: Cohort filtering
  entries.push(makeEntry(
    'cohort_filter',
    'L3 — Cohort & Risk Levers',
    `Filtered cohort: ${cohortSize} members. Applied ${Object.keys(leverBaselines).length} behaviour lever baselines.`,
    [],
    [],
    [],
    { cohortSize, dropoutRate: assumptions.dropoutRate },
  ));

  // L4: Rules engine
  const rulesFired = interventionIds.map((id) => `intervention:${id}`);
  entries.push(makeEntry(
    'rules_applied',
    'L4 — Behaviour Change Rules',
    `Applied clinical rules for ${interventionIds.length} interventions. Computed lever movements from baselines to targets.`,
    signals,
    rulesFired,
    ['banach_2023', 'mandsager_2018', 'discovery_vitality', 'cappuccio_2010', 'hilton_2022'],
    {},
  ));

  // L5: Reward calculation
  entries.push(makeEntry(
    'reward_calculation',
    'L5 — Reward Function',
    `Calculated reward costs with behavioural economics modifiers. Applied dropout rate: ${(assumptions.dropoutRate * 100).toFixed(0)}%.`,
    [],
    [],
    ['patel_2019'],
    { discountRate: assumptions.discountRate, dropoutRate: assumptions.dropoutRate },
  ));

  // L6: ROI projection
  entries.push(makeEntry(
    'roi_projection',
    'L6 — ROI Output',
    `Projected multi-horizon ROI for 90-day, 1-year, and 3-year horizons. Claims inflation: ${(assumptions.claimsInflation * 100).toFixed(0)}%.`,
    signals,
    rulesFired,
    ['discovery_vitality', 'munich_re_klarity_2025'],
    { ...assumptions as unknown as Record<string, number> },
  ));

  // Audit generation
  entries.push(makeEntry(
    'audit_generated',
    'Audit',
    `Generated full audit trail with ${entries.length + 1} entries. Model version: ${MODEL_VERSION}.`,
    [],
    [],
    [],
    {},
  ));

  return entries;
}
