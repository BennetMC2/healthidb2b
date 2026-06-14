// ---------------------------------------------------------------------------
// Signal registry — single source of truth shared between server engine and
// client cockpit. Moved from server/engine/registry.ts so both sides can
// import the same definitions without an API round-trip.
// ---------------------------------------------------------------------------
import type { EvidenceTier, FusionDef, SignalDef, SignalId, TrustTier } from "./schema";

export const EMERGING_HAIRCUT = 0.5;
export const TRUST_VALUE_MODIFIER: Record<TrustTier, number> = {
  High: 1,
  Medium: 0.85,
  Low: 0.5,
};

const citation = (key: string, title: string, finding: string, doi: string) => ({
  key,
  authors: "Registry evidence",
  year: 2026,
  title,
  journal: "Signal registry source",
  doi,
  finding,
});

export const SIGNALS: SignalDef[] = [
  {
    signalId: "steps",
    displayName: "Steps",
    category: "movement",
    dataSources: ["Apple Health", "Fitbit", "Garmin", "Samsung Health", "Google Fit"],
    trustCeiling: "Medium",
    evidenceTier: "Proven",
    behaviourLever: "Increase verified daily walking volume and active minutes.",
    doseResponse: { effectP50: 0.13, effectCI: [0.08, 0.18], unit: "fractional mortality / claims bridge anchor" },
    claimsPathway: "Physical activity medical-cost gradient, claims bridge by risk tier.",
    evidenceSources: [
      citation("steps-adaptive-rct", "Adaptive step goals RCT", "+1,130 steps/day adaptive-goal evidence.", "https://mhealth.jmir.org/2018/1/e28/"),
      citation("steps-tailored-gamification", "Tailored gamification", "Personalised gamification improves physical activity engagement.", "https://games.jmir.org/2025/1/e66793/"),
    ],
    attributionConfidence: 0.6,
    probeReward: 10,
    outcome: "daily step count",
    doseLabel: "mean step lift",
    doseKind: "steplift",
    shortName: "Steps",
  },
  {
    signalId: "vo2max",
    displayName: "VO2 Max",
    category: "cardio_autonomic",
    dataSources: ["Apple Health", "Garmin", "Fitbit", "Samsung Health"],
    trustCeiling: "Medium",
    evidenceTier: "Proven",
    behaviourLever: "Sustain Zone-2 / cardio training that improves cardiorespiratory fitness.",
    doseResponse: { effectP50: 0.09, effectCI: [0.05, 0.15], unit: "fractional mortality / claims bridge anchor" },
    claimsPathway: "Cardiorespiratory fitness risk gradient mapped through claims-cost bridge.",
    evidenceSources: [
      citation("vo2max-mandsager", "Cardiorespiratory fitness and mortality", "CRF strongly stratifies all-cause mortality.", "https://pubmed.ncbi.nlm.nih.gov/30646252/"),
    ],
    attributionConfidence: 0.65,
    probeReward: 15,
    outcome: "cardiorespiratory fitness",
    doseLabel: "mean Zone-2 adherence",
    doseKind: "intensity",
    shortName: "VO2 Max",
  },
  {
    signalId: "hba1c",
    displayName: "HbA1c",
    category: "metabolic",
    dataSources: ["Lab Results"],
    trustCeiling: "High",
    evidenceTier: "Proven",
    behaviourLever: "Complete verified HbA1c testing and improve glycaemic control if flagged.",
    doseResponse: { effectP50: 0.1, effectCI: [0.05, 0.18], unit: "fractional diabetes-related claims bridge anchor" },
    claimsPathway: "HbA1c reduction associated with all-cause and diabetes-related cost reductions.",
    evidenceSources: [
      citation("hba1c-costs", "HbA1c cost gradient", "1% HbA1c reduction linked to lower annual costs.", "https://www.tandfonline.com/doi/full/10.1080/03007995.2020.1787971"),
    ],
    attributionConfidence: 0.7,
    probeReward: 14,
    outcome: "glycaemic control",
    doseLabel: "mean management adherence",
    doseKind: "intensity",
    shortName: "HbA1c",
  },
  {
    signalId: "bp",
    displayName: "Blood Pressure",
    category: "cardio_autonomic",
    dataSources: ["Lab Results", "Apple Health", "Samsung Health"],
    trustCeiling: "High",
    evidenceTier: "Proven",
    behaviourLever: "Complete blood-pressure screening and adhere to monitoring / treatment if elevated.",
    doseResponse: { effectP50: 0.11, effectCI: [0.06, 0.2], unit: "fractional CVD event / claims bridge anchor" },
    claimsPathway: "BP control reduces cardiovascular event and cost risk among elevated-BP members.",
    evidenceSources: [
      citation("bp-sprint", "SPRINT BP control", "Intensive BP control reduced major cardiovascular events.", "https://pmc.ncbi.nlm.nih.gov/articles/PMC6874096/"),
    ],
    attributionConfidence: 0.68,
    probeReward: 12,
    outcome: "blood-pressure control",
    doseLabel: "mean treatment adherence",
    doseKind: "intensity",
    shortName: "Blood Pressure",
  },
  {
    signalId: "resting_hr",
    displayName: "Resting Heart Rate",
    category: "cardio_autonomic",
    dataSources: ["Apple Health", "Fitbit", "Garmin", "Oura", "WHOOP", "Samsung Health", "Google Fit"],
    trustCeiling: "Medium",
    evidenceTier: "Emerging",
    behaviourLever: "Improve recovery, aerobic base and resting-heart-rate trend.",
    doseResponse: { effectP50: 0.04, effectCI: [0.01, 0.08], unit: "fractional indirect claims contribution before evidence haircut" },
    claimsPathway: "Strong mortality association but indirect dollar link, therefore haircut.",
    evidenceSources: [
      citation("rhr-mortality", "Resting HR mortality evidence", "Large cohort evidence for RHR as independent mortality predictor.", "https://www.thelyonsshare.org/2025/03/04/interpreting-wearable-metrics-how-to-use-whoop-oura-and-apple-watch-to-optimize-your-health/"),
    ],
    attributionConfidence: 0.55,
    probeReward: 8,
    outcome: "resting-heart-rate trend",
    doseLabel: "mean RHR trend adherence",
    doseKind: "intensity",
    shortName: "Resting HR",
  },
  {
    signalId: "hrv",
    displayName: "HRV",
    category: "cardio_autonomic",
    dataSources: ["Apple Health", "Fitbit", "Garmin", "Oura", "WHOOP"],
    trustCeiling: "Medium",
    evidenceTier: "Emerging",
    behaviourLever: "Improve recovery routines and autonomic resilience.",
    doseResponse: { effectP50: 0.035, effectCI: [0.01, 0.07], unit: "fractional indirect claims contribution before evidence haircut" },
    claimsPathway: "Autonomic risk evidence; indirect claims link.",
    evidenceSources: [
      citation("fusion-cv-review", "Cardiovascular multimodal signal review", "Wearable autonomic metrics support risk stratification.", "https://pmc.ncbi.nlm.nih.gov/articles/PMC12591514/"),
    ],
    attributionConfidence: 0.52,
    probeReward: 8,
    outcome: "autonomic recovery",
    doseLabel: "mean recovery adherence",
    doseKind: "intensity",
    shortName: "HRV",
  },
  {
    signalId: "sleep_regularity",
    displayName: "Sleep Regularity",
    category: "sleep_recovery",
    dataSources: ["Apple Health", "Fitbit", "Garmin", "Oura", "WHOOP", "Samsung Health"],
    trustCeiling: "Medium",
    evidenceTier: "Emerging",
    behaviourLever: "Improve sleep timing consistency and recovery routines.",
    doseResponse: { effectP50: 0.05, effectCI: [0.02, 0.09], unit: "fractional indirect claims contribution before evidence haircut" },
    claimsPathway: "Sleep regularity linked to cardiometabolic risk; dollar link indirect.",
    evidenceSources: [
      citation("sleep-regularity", "Sleep regularity evidence", "Wearable sleep timing supports cardiometabolic risk stratification.", "https://developer.apple.com/videos/play/wwdc2020/10656/"),
    ],
    attributionConfidence: 0.5,
    probeReward: 9,
    outcome: "sleep-schedule consistency",
    doseLabel: "mean sleep-routine adherence",
    doseKind: "intensity",
    shortName: "Sleep Regularity",
  },
  {
    signalId: "glucose_tir",
    displayName: "Glucose Time-in-Range",
    category: "metabolic",
    dataSources: ["Apple Health", "Lab Results"],
    trustCeiling: "Medium",
    evidenceTier: "Emerging",
    behaviourLever: "Improve consumer-CGM time-in-range and follow-up behaviours.",
    doseResponse: { effectP50: 0.06, effectCI: [0.02, 0.1], unit: "fractional indirect claims contribution before evidence haircut" },
    claimsPathway: "CGM behaviour is clinically meaningful; insurer dollar link still emerging.",
    evidenceSources: [
      citation("stelo-cgm", "OTC CGM", "Consumer CGM enables behaviour feedback for glucose time-in-range.", "https://www.stelo.com/en-us"),
      citation("lingo-cgm", "Consumer glucose coaching", "Consumer glucose platform for lifestyle behaviour.", "https://www.hellolingo.com"),
    ],
    attributionConfidence: 0.55,
    probeReward: 12,
    outcome: "glucose time-in-range",
    doseLabel: "mean glucose-behaviour adherence",
    doseKind: "intensity",
    shortName: "Glucose TIR",
  },
  {
    signalId: "gait_speed",
    displayName: "Gait Speed",
    category: "movement",
    dataSources: ["Apple Health", "Google Fit"],
    trustCeiling: "Medium",
    evidenceTier: "Experimental",
    behaviourLever: "Passively monitor walking speed and gait regularity for frailty risk.",
    doseResponse: null,
    claimsPathway: "",
    evidenceSources: [
      citation("gait-sixth-vital", "Gait speed as sixth vital sign", "Gait speed is a frailty and outcome marker.", "https://pmc.ncbi.nlm.nih.gov/articles/PMC4254896/"),
      citation("gait-fall-risk", "Gait fall-risk analysis", "Gait analysis supports fall-risk stratification.", "https://www.onestep.co/resources-blog/assessing-fall-risk-with-gait-analysis"),
    ],
    attributionConfidence: 0.35,
    probeReward: 6,
    outcome: "walking-speed stability",
    doseLabel: "mean gait-monitoring adherence",
    doseKind: "intensity",
    shortName: "Gait Speed",
  },
  {
    signalId: "respiratory_rate",
    displayName: "Respiratory Rate",
    category: "respiratory",
    dataSources: ["Apple Health", "Fitbit", "Garmin", "Oura", "WHOOP"],
    trustCeiling: "Medium",
    evidenceTier: "Experimental",
    behaviourLever: "Monitor respiratory-rate deviations for early warning and follow-up.",
    doseResponse: null,
    claimsPathway: "",
    evidenceSources: [
      citation("rr-illness", "Respiratory rate illness prediction", "Respiratory-rate deviations can precede symptoms.", "https://www.nature.com/articles/s41746-021-00493-6"),
    ],
    attributionConfidence: 0.35,
    probeReward: 5,
    outcome: "respiratory-rate stability",
    doseLabel: "mean monitoring adherence",
    doseKind: "intensity",
    shortName: "Respiratory Rate",
  },
];

export const FUSIONS: FusionDef[] = [
  {
    fusionId: "cardio_autonomic_index",
    displayName: "Cardio-Autonomic Index",
    components: [
      { signalId: "vo2max", weight: 0.4 },
      { signalId: "resting_hr", weight: 0.25 },
      { signalId: "hrv", weight: 0.25 },
      { signalId: "respiratory_rate", weight: 0.1 },
    ],
    evidenceTier: "Experimental",
    corroboration: true,
    rationale:
      "Composite cardio-autonomic score with disclosed weights; credits stronger attribution only when multiple component signals agree.",
  },
  {
    fusionId: "recovery_resilience_index",
    displayName: "Recovery Resilience Index",
    components: [
      { signalId: "sleep_regularity", weight: 0.4 },
      { signalId: "hrv", weight: 0.35 },
      { signalId: "resting_hr", weight: 0.25 },
    ],
    evidenceTier: "Experimental",
    corroboration: true,
    rationale: "Recovery composite for employer/group resilience use cases with transparent sleep/autonomic weights.",
  },
];

// ── Lookup helpers ─────────────────────────────────────────────────

export function allSignals(): SignalDef[] {
  return SIGNALS;
}

export function getSignal(id: SignalId): SignalDef {
  const signal = SIGNALS.find((s) => s.signalId === id);
  if (!signal) throw new Error(`Unknown signal: ${id}`);
  return signal;
}

export function maybeSignal(id: SignalId | undefined): SignalDef | undefined {
  return id ? SIGNALS.find((s) => s.signalId === id) : undefined;
}

export function getFusion(id: SignalId | undefined): FusionDef | undefined {
  return id ? FUSIONS.find((f) => f.fusionId === id) : undefined;
}

export function signalsForCategory(category: SignalDef["category"]): SignalDef[] {
  return SIGNALS.filter((s) => s.category === category);
}

export function primarySignalFor(ids: SignalId[]): SignalDef {
  for (const id of ids) {
    const signal = maybeSignal(id);
    if (signal?.evidenceTier === "Proven") return signal;
  }
  return maybeSignal(ids[0]) ?? getSignal("vo2max");
}

export function evidenceGateMultiplier(evidenceTier: SignalDef["evidenceTier"]): number {
  if (evidenceTier === "Proven") return 1;
  if (evidenceTier === "Emerging") return EMERGING_HAIRCUT;
  return 0;
}
