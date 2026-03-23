import type {
  Campaign,
  SnapshotCampaign,
  StreamCampaign,
  CampaignTemplate,
  CampaignStatus,
  CampaignType,
  CampaignUseCase,
  ChallengeCriteria,
  CohortTargeting,
  CampaignFunnelData,
} from '@/types';
import { seededRandom, randomInt, generateId } from './seed';
import { partners } from './partners';

// ── Seed ────────────────────────────────────────────────────────────

const SEED = 1337;
const rng = seededRandom(SEED);

// ── Helper: build funnel with realistic drop-off ────────────────────

// Funnel profiles vary by campaign type and status to avoid suspicious uniformity
const FUNNEL_PROFILES = {
  snapshot: {
    // Lower friction: higher invite→enroll, moderate verify
    inviteRate: [0.70, 0.20],   // 70-90%
    enrollRate: [0.50, 0.25],   // 50-75%
    verifyRate: [0.35, 0.30],   // 35-65%
    rewardRate: [0.85, 0.13],   // 85-98%
  },
  stream: {
    // Higher commitment: lower enroll, but higher verify (ongoing engagement)
    inviteRate: [0.55, 0.25],   // 55-80%
    enrollRate: [0.25, 0.25],   // 25-50%
    verifyRate: [0.55, 0.35],   // 55-90%
    rewardRate: [0.82, 0.16],   // 82-98%
  },
} as const;

function buildFunnel(
  rng: () => number,
  eligible: number,
  status: CampaignStatus,
  type: CampaignType,
): CampaignFunnelData {
  if (status === 'draft') {
    return { eligible, invited: 0, enrolled: 0, verified: 0, rewarded: 0 };
  }

  const profile = FUNNEL_PROFILES[type];
  // Per-campaign noise from rng
  const noise = () => 0.97 + rng() * 0.06; // ±3% jitter

  let invited = Math.round(eligible * (profile.inviteRate[0] + rng() * profile.inviteRate[1]) * noise());
  let enrolled = Math.round(invited * (profile.enrollRate[0] + rng() * profile.enrollRate[1]) * noise());
  let verified = Math.round(enrolled * (profile.verifyRate[0] + rng() * profile.verifyRate[1]) * noise());
  let rewarded = Math.round(verified * (profile.rewardRate[0] + rng() * profile.rewardRate[1]) * noise());

  // Completed campaigns get tighter, more realistic final numbers
  if (status === 'completed') {
    invited = Math.round(eligible * (0.78 + rng() * 0.12));
    enrolled = Math.round(invited * (0.55 + rng() * 0.20));
    verified = Math.round(enrolled * (0.65 + rng() * 0.20));
    rewarded = Math.round(verified * (0.92 + rng() * 0.07));
  }

  return { eligible, invited, enrolled, verified, rewarded };
}

// ── Campaign definitions ────────────────────────────────────────────

interface CampaignSeed {
  name: string;
  description: string;
  purpose: string;
  useCase: CampaignUseCase;
  type: CampaignType;
  status: CampaignStatus;
  partnerIndex: number;
  challenge: ChallengeCriteria;
  additionalChallenges?: ChallengeCriteria[];
  targeting: CohortTargeting;
  budgetCeiling: number;
  pointsPerVerification: number;
  maxParticipants: number;
  eligible: number;
  // Stream-only
  frequency?: 'daily' | 'weekly' | 'monthly';
  streamDuration?: number;
  dynamicPricing?: boolean;
}

const seeds: CampaignSeed[] = [
  // ═══════════════════════════════════════════════════════════════════
  // Pacific Assurance Group (index 0) — 6 campaigns
  // ═══════════════════════════════════════════════════════════════════

  // 1. Underwriting — BMI (active, snapshot)
  {
    name: 'Pre-Policy BMI Verification — APAC Threshold',
    description: 'Verify that applicant BMI falls within the Asian-adjusted insurable range (18.5–27.5 kg/m²) using connected device or lab data — replaces in-person medical exam.',
    purpose: 'Traditional underwriting in APAC requires an in-person medical exam that adds 7–14 days to policy issuance and costs $120–$180 per applicant. This campaign replaces that step with a zero-knowledge BMI proof sourced from connected wearables or recent lab results. The insurer receives a pass/fail attestation against the Asian-adjusted threshold (18.5–27.5 kg/m²) without ever seeing raw biometric data, satisfying MAS data-minimization guidelines while cutting underwriting cycle time by up to 60%.',
    useCase: 'underwriting',
    type: 'snapshot',
    status: 'active',
    partnerIndex: 0,
    challenge: { metric: 'bmi', operator: 'between', target: 18.5, targetMax: 27.5, unit: 'kg/m²' },
    targeting: { healthScoreMin: 40, reputationTiers: ['medium', 'high'], dataSources: ['apple_health', 'garmin', 'lab_results'], regions: ['Singapore', 'Hong Kong', 'Thailand', 'Malaysia', 'Indonesia'] },
    budgetCeiling: 38500,
    pointsPerVerification: 90,
    maxParticipants: 8000,
    eligible: 5600,
  },

  // 2. Dynamic premium — VO2 Max (active, stream)
  {
    name: 'Cardiorespiratory Fitness Premium Tier',
    description: '180-day dynamic pricing programme rewarding policyholders who maintain VO2 max ≥ 40 mL/kg/min — the gold-standard marker of cardiorespiratory fitness, verified via wearable data.',
    purpose: 'VO2 max is the single strongest predictor of all-cause mortality, outperforming traditional markers like BMI or resting heart rate. This stream campaign continuously verifies cardiorespiratory fitness over 180 days, generating a tamper-proof fitness ledger the actuarial team can feed into renewal pricing models. Policyholders who maintain VO2 max ≥ 40 mL/kg/min — indicating "good" to "excellent" aerobic capacity — earn an automatic premium discount at their next renewal date. Modern wearables (Apple Watch, Garmin, WHOOP) estimate VO2 max from heart rate and workout data without requiring a lab treadmill test.',
    useCase: 'dynamic_premium',
    type: 'stream',
    status: 'active',
    partnerIndex: 0,
    challenge: { metric: 'vo2_max', operator: 'gte', target: 40, unit: 'mL/kg/min' },
    targeting: { reputationTiers: ['medium', 'high'], healthScoreMin: 50, dataSources: ['apple_health', 'garmin', 'whoop'], regions: ['Singapore', 'Hong Kong', 'Thailand', 'Malaysia'] },
    budgetCeiling: 52000,
    pointsPerVerification: 60,
    maxParticipants: 10000,
    eligible: 7200,
    frequency: 'daily',
    streamDuration: 180,
    dynamicPricing: true,
  },

  // 3. Underwriting — HbA1c (completed, snapshot)
  {
    name: 'Q4 HbA1c Underwriting Screen',
    description: 'Collect zero-knowledge proofs of quarterly lab HbA1c results (≤5.7%) for underwriting decisions across the 35–65+ cohort — no raw lab data ever leaves the device.',
    purpose: 'Pre-diabetic risk is the single largest driver of claims inflation in the 35–65+ cohort across Southeast Asia. This snapshot campaign collected ZK proofs of HbA1c lab results to stratify applicants into standard vs. substandard risk tiers at the point of underwriting. By proving the result is ≤5.7% without exposing the raw value, the insurer avoids PDPA data-handling obligations while still making actuarially sound decisions. The completed dataset now feeds the quarterly risk model refresh.',
    useCase: 'underwriting',
    type: 'snapshot',
    status: 'completed',
    partnerIndex: 0,
    challenge: { metric: 'hba1c', operator: 'lte', target: 5.7, unit: '%' },
    targeting: { dataSources: ['lab_results'], ageRanges: ['35-44', '45-54', '55-64', '65+'], regions: ['Singapore', 'Hong Kong', 'Indonesia'] },
    budgetCeiling: 41200,
    pointsPerVerification: 150,
    maxParticipants: 6000,
    eligible: 4200,
  },

  // 4. Renewal — Resting HR (active, snapshot)
  {
    name: 'Annual Policy Renewal Health Check',
    description: 'Wearable-verified resting heart rate ≤72 bpm for annual policy renewal — medium/high reputation identities only, automated proof receipt at renewal.',
    purpose: 'Policy renewal is a critical retention moment where friction drives lapse. This campaign automates the annual health attestation by accepting a wearable-verified resting heart rate proof instead of requiring a clinic visit. Policyholders with medium or high reputation tiers generate a proof in under 60 seconds, and the receipt is automatically attached to their renewal file. This reduces renewal processing time from 5 business days to near-instant while maintaining actuarial confidence in the health status of the renewing cohort.',
    useCase: 'renewal',
    type: 'snapshot',
    status: 'active',
    partnerIndex: 0,
    challenge: { metric: 'heart_rate_resting', operator: 'lte', target: 72, unit: 'bpm' },
    targeting: { reputationTiers: ['medium', 'high'], dataSources: ['apple_health', 'garmin', 'oura', 'whoop'], regions: ['Singapore', 'Hong Kong', 'Thailand', 'Malaysia', 'Indonesia'] },
    budgetCeiling: 28400,
    pointsPerVerification: 100,
    maxParticipants: 5000,
    eligible: 3800,
  },

  // 5. Acquisition (lead-gen) — Blood glucose (active, snapshot)
  {
    name: 'Preferred Life Pre-Qualification',
    description: 'Open pool targeting — users who prove blood glucose ≤100 mg/dL receive pre-qualified preferred rates. No raw health data shared with the insurer.',
    purpose: 'Customer acquisition cost for life insurance in Singapore averages $350–$500 per policy. This campaign targets the open HealthID pool with a low-friction blood glucose proof that pre-qualifies users for preferred rates before they even start an application. Users who prove ≤100 mg/dL are routed into a fast-track underwriting flow, reducing drop-off by an estimated 40%. The insurer never sees raw glucose values — only a cryptographic pass/fail — making this PDPA-compliant by design.',
    useCase: 'acquisition',
    type: 'snapshot',
    status: 'active',
    partnerIndex: 0,
    challenge: { metric: 'blood_glucose', operator: 'lte', target: 100, unit: 'mg/dL' },
    targeting: { healthScoreMin: 55, dataSources: ['lab_results', 'apple_health'], ageRanges: ['25-34', '35-44', '45-54'], regions: ['Singapore', 'Hong Kong', 'Malaysia'] },
    budgetCeiling: 22000,
    pointsPerVerification: 120,
    maxParticipants: 4000,
    eligible: 2800,
  },

  // 6. Claims reduction — HRV (draft, stream)
  {
    name: 'Cardiac Risk Reduction Programme',
    description: '90-day HRV monitoring programme for elevated cardiac risk cohort — verified via wearable, targeting claims cost reduction through early intervention.',
    purpose: 'Cardiac events account for 28% of critical illness claims in the 45+ cohort. This programme monitors heart rate variability (HRV) daily for 90 days to identify policyholders whose autonomic nervous system indicators are trending below safe thresholds. Early detection enables the insurer to trigger wellness interventions — coaching, telehealth consults — before a claimable event occurs. Actuarial models project a 12–18% reduction in cardiac-related claims cost for participants who complete the full 90-day stream.',
    useCase: 'claims_reduction',
    type: 'stream',
    status: 'draft',
    partnerIndex: 0,
    challenge: { metric: 'hrv', operator: 'gte', target: 45, unit: 'ms' },
    targeting: { healthScoreMin: 30, dataSources: ['apple_health', 'garmin', 'oura', 'whoop'], ageRanges: ['45-54', '55-64', '65+'] },
    budgetCeiling: 31000,
    pointsPerVerification: 55,
    maxParticipants: 3000,
    eligible: 2100,
    frequency: 'daily',
    streamDuration: 90,
    dynamicPricing: false,
  },

  // ═══════════════════════════════════════════════════════════════════
  // Harbour Life Insurance (index 1) — 5 campaigns
  // ═══════════════════════════════════════════════════════════════════

  // 7. Underwriting — Cholesterol (active, snapshot)
  {
    name: 'Critical Illness Screening Proof',
    description: 'Pre-screen critical illness coverage applicants with cholesterol ≤200 mg/dL via zero-knowledge lab result proofs — no PHI transmitted to the insurer.',
    purpose: 'Critical illness underwriting traditionally requires a full lipid panel sent to the insurer, creating data-handling liability and slowing approval. This campaign replaces the panel with a single ZK proof attesting that total cholesterol is ≤200 mg/dL. The proof is generated from the applicant\'s own lab portal data, and the insurer receives only the cryptographic receipt. This satisfies the clinical threshold check while eliminating PHI transmission entirely, reducing regulatory exposure and cutting approval turnaround from 10 days to under 48 hours.',
    useCase: 'underwriting',
    type: 'snapshot',
    status: 'active',
    partnerIndex: 1,
    challenge: { metric: 'cholesterol', operator: 'lte', target: 200, unit: 'mg/dL' },
    targeting: { dataSources: ['lab_results'], ageRanges: ['35-44', '45-54', '55-64'], regions: ['Singapore', 'Malaysia', 'Thailand'] },
    budgetCeiling: 35000,
    pointsPerVerification: 130,
    maxParticipants: 5000,
    eligible: 3500,
  },

  // 8. Dynamic premium — Respiratory Rate (active, stream)
  {
    name: 'Overnight Breathing Rate Premium Unlock',
    description: '120-day stream verifying overnight respiratory rate ≤ 16 br/min — a novel wearable biomarker for cardio conditioning, with automated premium discount.',
    purpose: 'Overnight respiratory rate is an emerging clinical signal that wearables now capture passively during sleep. A resting rate ≤ 16 breaths/min indicates strong cardiopulmonary conditioning and correlates with lower all-cause hospitalization risk. This 120-day stream verifies nightly breathing rate against that threshold, building a longitudinal respiratory health profile the pricing team can use for dynamic premium tiers. Unlike step counts or active minutes, respiratory rate is a passive, unfakeable signal — the policyholder simply wears their device to bed. Early cohort data shows a 20% improvement in retention among participants versus non-participants.',
    useCase: 'dynamic_premium',
    type: 'stream',
    status: 'active',
    partnerIndex: 1,
    challenge: { metric: 'respiratory_rate', operator: 'lte', target: 16, unit: 'br/min' },
    targeting: { reputationTiers: ['medium', 'high'], healthScoreMin: 50, dataSources: ['oura', 'whoop', 'apple_health', 'garmin'], regions: ['Singapore', 'Malaysia'] },
    budgetCeiling: 42000,
    pointsPerVerification: 55,
    maxParticipants: 6000,
    eligible: 4400,
    frequency: 'daily',
    streamDuration: 120,
    dynamicPricing: true,
  },

  // 9. Claims reduction — Blood pressure (completed, stream)
  {
    name: 'Hypertension Monitoring Programme',
    description: '12-week blood pressure monitoring for high-risk cohort — verified proofs of systolic ≤130 mmHg reduce claims risk and qualify for wellness rewards.',
    purpose: 'Uncontrolled hypertension is a leading predictor of stroke and cardiac claims. This 12-week programme targeted the high-risk 45+ cohort with weekly systolic blood pressure proofs, creating an early-warning system for the claims team. Policyholders who maintained readings ≤130 mmHg earned wellness rewards, incentivizing adherence to treatment plans. The completed dataset showed a measurable correlation between programme completion and reduced hospitalization rates, validating the business case for ongoing claims-reduction streams.',
    useCase: 'claims_reduction',
    type: 'stream',
    status: 'completed',
    partnerIndex: 1,
    challenge: { metric: 'blood_pressure', operator: 'lte', target: 130, unit: 'mmHg' },
    targeting: { healthScoreMin: 30, dataSources: ['apple_health', 'lab_results'], ageRanges: ['45-54', '55-64', '65+'], regions: ['Singapore', 'Malaysia', 'Thailand'] },
    budgetCeiling: 25500,
    pointsPerVerification: 65,
    maxParticipants: 3500,
    eligible: 2600,
    frequency: 'weekly',
    streamDuration: 84,
    dynamicPricing: false,
  },

  // 10. Renewal — Sleep Health (active, snapshot, multi-metric)
  {
    name: 'Sleep Health Renewal Attestation',
    description: 'Annual renewal verification combining sleep duration ≥ 7 hrs and sleep quality ≥ 70 — a holistic sleep health attestation that replaces the paper medical declaration.',
    purpose: 'Poor sleep is a leading predictor of chronic disease onset, absenteeism, and mental health claims. This campaign turns the annual renewal check-in into a holistic sleep health attestation: policyholders prove they consistently achieve ≥ 7 hours of sleep (duration) and a sleep quality score ≥ 70 (architecture — deep sleep, REM, wake-ups). The dual-metric proof provides a richer signal than either metric alone, giving the renewal pricing model a composite sleep health indicator. For the policyholder, it replaces a paper medical declaration with a 30-second wearable proof.',
    useCase: 'renewal',
    type: 'snapshot',
    status: 'active',
    partnerIndex: 1,
    challenge: { metric: 'sleep_hours', operator: 'gte', target: 7, unit: 'hrs' },
    additionalChallenges: [{ metric: 'sleep_quality', operator: 'gte', target: 70, unit: 'score' }],
    targeting: { reputationTiers: ['medium', 'high'], dataSources: ['oura', 'apple_health', 'whoop', 'fitbit'], regions: ['Singapore', 'Malaysia', 'Thailand'] },
    budgetCeiling: 18000,
    pointsPerVerification: 85,
    maxParticipants: 3000,
    eligible: 2200,
  },

  // 11. Acquisition (embedded) — VO2 Max (draft, snapshot)
  {
    name: 'Bank Partnership Embedded Fitness Screen',
    description: 'Bancassurance integration — mortgage protection applicants prove VO2 max ≥ 35 mL/kg/min during the bank loan flow. No health data hits the bank.',
    purpose: 'Bancassurance is the fastest-growing distribution channel in Southeast Asia, but embedding health checks into a bank loan flow creates data-sharing complications. This campaign solves that by letting mortgage applicants generate a VO2 max proof directly from their wearable during the loan application. VO2 max ≥ 35 mL/kg/min indicates at least "fair" cardiorespiratory fitness — a stronger underwriting signal than resting heart rate alone. The bank never touches health data — only the insurer receives the cryptographic receipt. This enables real-time underwriting decisions embedded in the bank\'s digital flow, targeting a 3x increase in mortgage protection attachment rates.',
    useCase: 'acquisition',
    type: 'snapshot',
    status: 'draft',
    partnerIndex: 1,
    challenge: { metric: 'vo2_max', operator: 'gte', target: 35, unit: 'mL/kg/min' },
    targeting: { healthScoreMin: 40, dataSources: ['apple_health', 'garmin', 'whoop'], ageRanges: ['25-34', '35-44', '45-54'], regions: ['Singapore', 'Malaysia'] },
    budgetCeiling: 15000,
    pointsPerVerification: 70,
    maxParticipants: 2000,
    eligible: 1400,
  },

  // ═══════════════════════════════════════════════════════════════════
  // NovaBridge Digital (index 2) — 5 campaigns
  // ═══════════════════════════════════════════════════════════════════

  // 12. Acquisition (lead-gen) — SpO2 (active, snapshot)
  {
    name: 'Instant Quote Blood Oxygen Screen',
    description: '10-second wearable proof for instant online quote — users verify SpO2 ≥ 95% to unlock real-time pricing without submitting medical records.',
    purpose: 'Digital-first insurers lose up to 70% of quote-to-bind conversions due to medical questionnaire friction. This campaign eliminates that barrier with the lowest-friction biometric check available: a 10-second blood oxygen reading from any modern smartwatch or fitness band. Users who prove SpO2 ≥ 95% — the clinical threshold for normal oxygen saturation — instantly unlock a real-time premium quote. The insurer receives a cryptographic pass/fail attestation with zero raw health data, and the user gets an instant price. SpO2 screens for respiratory and cardiovascular red flags without requiring lab work or medical records.',
    useCase: 'acquisition',
    type: 'snapshot',
    status: 'active',
    partnerIndex: 2,
    challenge: { metric: 'spo2', operator: 'gte', target: 95, unit: '%' },
    targeting: { dataSources: ['apple_health', 'garmin', 'fitbit', 'samsung_health'], ageRanges: ['18-24', '25-34', '35-44'], regions: ['Hong Kong', 'Singapore'] },
    budgetCeiling: 20000,
    pointsPerVerification: 50,
    maxParticipants: 8000,
    eligible: 5800,
  },

  // 13. Dynamic premium — Sleep + Respiratory (active, stream, multi-metric)
  {
    name: 'Sleep + Respiratory Premium Unlock',
    description: '30-day programme combining sleep quality ≥ 75 and overnight respiratory rate ≤ 16 br/min — a dual-signal sleep health proof for premium discount eligibility.',
    purpose: 'Sleep quality alone is a useful actuarial signal, but combining it with overnight respiratory rate creates a much stronger composite indicator. A sleep score ≥ 75 confirms good sleep architecture (deep sleep, REM, minimal wake-ups), while respiratory rate ≤ 16 br/min during sleep confirms strong cardiopulmonary function. Together, these two passive wearable signals screen for sleep apnea, respiratory conditions, and poor recovery — all predictors of future claims. The 30-day window keeps engagement high while generating enough dual-metric data for the pricing team to validate the correlation. Early results show participants have 30% fewer short-term disability claims than non-participants.',
    useCase: 'dynamic_premium',
    type: 'stream',
    status: 'active',
    partnerIndex: 2,
    challenge: { metric: 'sleep_quality', operator: 'gte', target: 75, unit: 'score' },
    additionalChallenges: [{ metric: 'respiratory_rate', operator: 'lte', target: 16, unit: 'br/min' }],
    targeting: { dataSources: ['oura', 'apple_health', 'whoop', 'fitbit'], ageRanges: ['25-34', '35-44'], regions: ['Hong Kong', 'Singapore'] },
    budgetCeiling: 16500,
    pointsPerVerification: 40,
    maxParticipants: 4000,
    eligible: 3000,
    frequency: 'daily',
    streamDuration: 30,
    dynamicPricing: true,
  },

  // 14. Acquisition (embedded) — Body Temp Deviation (draft, snapshot)
  {
    name: 'Workplace Wellness Baseline Screen',
    description: 'Corporate enrollment integration — employees prove nightly body temperature deviation ≤ 0.5°C to qualify for embedded group coverage, screening for acute illness at enrollment.',
    purpose: 'Embedded insurance distributed through corporate wellness programmes is a high-volume, low-CAC acquisition channel. This campaign uses nightly body temperature stability as a baseline wellness gate: employees prove their temperature deviation is ≤ 0.5°C from their personal baseline, screening for acute illness, inflammation, or infection at the point of enrollment. Modern wearables (Oura, Apple Watch, WHOOP) track skin temperature deviation passively during sleep, making this a zero-effort check. The insurer acquires pre-qualified, healthy lives without any medical questionnaire friction, and the user never shares raw health data with either party.',
    useCase: 'acquisition',
    type: 'snapshot',
    status: 'draft',
    partnerIndex: 2,
    challenge: { metric: 'body_temp_deviation', operator: 'lte', target: 0.5, unit: '°C' },
    targeting: { healthScoreMin: 40, reputationTiers: ['low', 'medium', 'high'], dataSources: ['oura', 'apple_health', 'whoop'], regions: ['Hong Kong', 'Singapore'] },
    budgetCeiling: 12000,
    pointsPerVerification: 45,
    maxParticipants: 3000,
    eligible: 2200,
  },

  // 15. Claims reduction — Stress score (paused, stream)
  {
    name: 'Stress Resilience Monthly Check',
    description: 'Monthly HRV-derived stress score monitoring — paused for product restructuring. Targets stress score ≤50 to reduce mental health claims.',
    purpose: 'Mental health claims have grown 35% year-over-year in Hong Kong and Singapore. This monthly monitoring programme uses HRV-derived stress scores as an early indicator of burnout and anxiety-related conditions. Policyholders who maintain a stress score ≤50 demonstrate resilience patterns that correlate with lower claims frequency. The programme is currently paused for product restructuring but will resume with an enhanced intervention pathway that routes high-stress signals to a telehealth wellness coach.',
    useCase: 'claims_reduction',
    type: 'stream',
    status: 'paused',
    partnerIndex: 2,
    challenge: { metric: 'stress_score', operator: 'lte', target: 50, unit: 'score' },
    targeting: { healthScoreMin: 35, dataSources: ['oura', 'whoop', 'apple_health'], ageRanges: ['25-34', '35-44', '45-54'] },
    budgetCeiling: 14000,
    pointsPerVerification: 40,
    maxParticipants: 2000,
    eligible: 1500,
    frequency: 'monthly',
    streamDuration: 180,
    dynamicPricing: false,
  },

  // 16. Renewal — Resting HR (completed, snapshot)
  {
    name: 'Digital Renewal Express',
    description: 'Automated wearable-based renewal — policyholders prove resting HR ≤70 bpm to skip paper medical and auto-renew digitally.',
    purpose: 'Paper-based medical declarations at renewal are the primary driver of policyholder friction and agent workload. This completed campaign proved the viability of fully automated digital renewal: policyholders generated a resting heart rate proof from their wearable, and the system auto-renewed their policy without any paper forms or agent involvement. The pilot achieved a 92% self-service completion rate and reduced renewal processing cost by $45 per policy. Results are being used to justify a permanent digital renewal pathway.',
    useCase: 'renewal',
    type: 'snapshot',
    status: 'completed',
    partnerIndex: 2,
    challenge: { metric: 'heart_rate_resting', operator: 'lte', target: 70, unit: 'bpm' },
    targeting: { reputationTiers: ['medium', 'high'], dataSources: ['apple_health', 'garmin', 'oura'], regions: ['Hong Kong', 'Singapore'] },
    budgetCeiling: 11000,
    pointsPerVerification: 75,
    maxParticipants: 2500,
    eligible: 1800,
  },
];

// ── Build campaign objects ──────────────────────────────────────────

function buildCampaigns(): Campaign[] {
  const now = new Date();
  return seeds.map((s) => {
    const id = generateId(rng, 'cmp');
    const partnerId = partners[s.partnerIndex].id;
    const funnel = buildFunnel(rng, s.eligible, s.status, s.type);

    // Date logic based on status
    let startDate: string;
    let endDate: string | null = null;
    let createdAt: string;

    const daysAgo = randomInt(rng, 30, 180);
    const start = new Date(now);
    start.setDate(start.getDate() - daysAgo);

    switch (s.status) {
      case 'draft': {
        createdAt = new Date(now.getTime() - randomInt(rng, 1, 14) * 86400000).toISOString();
        startDate = new Date(now.getTime() + randomInt(rng, 7, 30) * 86400000).toISOString();
        endDate = s.type === 'snapshot'
          ? new Date(new Date(startDate).getTime() + randomInt(rng, 14, 60) * 86400000).toISOString()
          : null;
        break;
      }
      case 'active': {
        createdAt = new Date(start.getTime() - randomInt(rng, 3, 14) * 86400000).toISOString();
        startDate = start.toISOString();
        endDate = s.type === 'snapshot'
          ? new Date(now.getTime() + randomInt(rng, 14, 90) * 86400000).toISOString()
          : null;
        break;
      }
      case 'completed': {
        const endDaysAgo = randomInt(rng, 5, 60);
        const completedEnd = new Date(now);
        completedEnd.setDate(completedEnd.getDate() - endDaysAgo);
        const duration = randomInt(rng, 30, 120);
        const completedStart = new Date(completedEnd);
        completedStart.setDate(completedStart.getDate() - duration);
        createdAt = new Date(completedStart.getTime() - randomInt(rng, 3, 14) * 86400000).toISOString();
        startDate = completedStart.toISOString();
        endDate = completedEnd.toISOString();
        break;
      }
      case 'paused': {
        createdAt = new Date(start.getTime() - randomInt(rng, 3, 14) * 86400000).toISOString();
        startDate = start.toISOString();
        endDate = null;
        break;
      }
    }

    const budgetSpent = s.status === 'completed'
      ? Math.round(s.budgetCeiling * (0.75 + rng() * 0.23))
      : s.status === 'active'
        ? Math.round(s.budgetCeiling * (0.15 + rng() * 0.50))
        : s.status === 'paused'
          ? Math.round(s.budgetCeiling * (0.10 + rng() * 0.30))
          : 0;

    const base: Campaign = {
      id,
      name: s.name,
      description: s.description,
      purpose: s.purpose,
      useCase: s.useCase,
      type: s.type,
      status: s.status,
      partnerId,
      challenge: s.challenge,
      ...(s.additionalChallenges && { additionalChallenges: s.additionalChallenges }),
      targeting: s.targeting,
      rewards: {
        pointsPerVerification: s.pointsPerVerification,
        budgetCeiling: s.budgetCeiling,
        budgetSpent,
        maxParticipants: s.maxParticipants,
      },
      funnel,
      startDate,
      endDate,
      createdAt,
    };

    // Add stream-specific fields
    if (s.type === 'stream' && s.frequency) {
      return {
        ...base,
        type: 'stream' as const,
        frequency: s.frequency,
        streamDuration: s.streamDuration!,
        dynamicPricing: s.dynamicPricing!,
      } satisfies StreamCampaign;
    }

    if (s.type === 'snapshot' && base.endDate) {
      return {
        ...base,
        type: 'snapshot' as const,
        endDate: base.endDate,
      } satisfies SnapshotCampaign;
    }

    return base;
  });
}

export const campaigns: Campaign[] = buildCampaigns();

// ── Campaign Templates ──────────────────────────────────────────────

export const campaignTemplates: CampaignTemplate[] = [
  {
    id: 'tmpl_underwriting',
    name: 'Underwriting Health Proof',
    description: 'Pre-policy BMI verification using Asian-adjusted thresholds (18.5–27.5 kg/m²) — replaces in-person medical exam with a zero-knowledge proof.',
    type: 'snapshot',
    icon: 'Shield',
    challenge: { metric: 'bmi', operator: 'between', target: 18.5, targetMax: 27.5, unit: 'kg/m²' },
    targeting: { reputationTiers: ['medium', 'high'], dataSources: ['lab_results', 'apple_health'] },
    suggestedBudget: 35000,
    suggestedPoints: 90,
  },
  {
    id: 'tmpl_dynamic_premium',
    name: 'Dynamic Premium Fitness Stream',
    description: 'Ongoing VO2 max verification stream for dynamic pricing — policyholders earn premium discounts by proving cardiorespiratory fitness ≥ 40 mL/kg/min.',
    type: 'stream',
    icon: 'TrendingUp',
    challenge: { metric: 'vo2_max', operator: 'gte', target: 40, unit: 'mL/kg/min' },
    targeting: { reputationTiers: ['medium', 'high'], healthScoreMin: 50 },
    suggestedBudget: 50000,
    suggestedPoints: 60,
  },
  {
    id: 'tmpl_claims_risk',
    name: 'Claims Risk Monitoring',
    description: 'High-risk cohort blood pressure monitoring stream — ongoing verification of systolic ≤130 mmHg to reduce claims cost and trigger early intervention.',
    type: 'stream',
    icon: 'Activity',
    challenge: { metric: 'blood_pressure', operator: 'lte', target: 130, unit: 'mmHg' },
    targeting: { healthScoreMin: 30, dataSources: ['apple_health', 'lab_results'], ageRanges: ['45-54', '55-64', '65+'] },
    suggestedBudget: 25000,
    suggestedPoints: 65,
  },
  {
    id: 'tmpl_lead_gen',
    name: 'Pre-Qualification Lead-Gen',
    description: 'Open pool acquisition — users who prove blood glucose ≤100 mg/dL receive pre-qualified preferred rates without submitting medical records.',
    type: 'snapshot',
    icon: 'UserPlus',
    challenge: { metric: 'blood_glucose', operator: 'lte', target: 100, unit: 'mg/dL' },
    targeting: { healthScoreMin: 55, dataSources: ['lab_results', 'apple_health'] },
    suggestedBudget: 20000,
    suggestedPoints: 120,
  },
];
