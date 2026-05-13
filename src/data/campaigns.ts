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

  // 1. Signal improvement — VO2 Max (active, stream)
  {
    name: 'Cardio Fitness Activation',
    description: 'Reward low or declining VO2 Max members for verified Zone 2 consistency and a positive cardio-fitness trend.',
    purpose: 'This campaign targets members with low or declining cardio-fitness signals who are still active enough to respond to a structured intervention. Health Points are paid for verified Zone 2 consistency and a positive VO2 Max trend over eight weeks. The insurer receives cohort movement, proof receipts, and reward status without raw wearable history, allowing the book-value impact to be measured against the Health Points budget.',
    useCase: 'claims_reduction',
    type: 'stream',
    status: 'active',
    partnerIndex: 0,
    challenge: { metric: 'vo2_max', operator: 'gte', target: 2, unit: 'mL/kg/min uplift' },
    targeting: { reputationTiers: ['medium', 'high'], healthScoreMin: 35, healthScoreMax: 72, dataSources: ['apple_health', 'garmin', 'whoop'], ageRanges: ['35-44', '45-54'], regions: ['Hong Kong', 'Japan'] },
    budgetCeiling: 58000,
    pointsPerVerification: 650,
    maxParticipants: 3847,
    eligible: 3847,
    frequency: 'weekly',
    streamDuration: 56,
    dynamicPricing: false,
  },

  // 2. Signal improvement — HRV (active, stream)
  {
    name: 'HRV Recovery',
    description: 'Intervene before recovery drift becomes claims risk by rewarding verified recovery days.',
    purpose: 'This campaign targets members with sustained HRV decline, rising training stress, and inconsistent recovery windows. Health Points are paid for verified recovery days across sleep consistency, lighter movement, and stabilised resting heart rate. The goal is to move a cohort that is drifting into avoidable risk before that deterioration appears in claims or renewal behaviour.',
    useCase: 'claims_reduction',
    type: 'stream',
    status: 'active',
    partnerIndex: 0,
    challenge: { metric: 'hrv', operator: 'gte', target: 8, unit: 'ms recovery' },
    targeting: { reputationTiers: ['medium', 'high'], healthScoreMin: 30, dataSources: ['apple_health', 'oura', 'whoop'], ageRanges: ['35-44', '45-54'], regions: ['Hong Kong', 'Japan'] },
    budgetCeiling: 36000,
    pointsPerVerification: 520,
    maxParticipants: 1204,
    eligible: 1204,
    frequency: 'daily',
    streamDuration: 60,
    dynamicPricing: false,
  },

  // 3. Signal improvement — Sleep (active, stream)
  {
    name: 'Sleep Regularity',
    description: 'Stabilise sleep debt by rewarding consistent sleep windows and verified sleep sufficiency.',
    purpose: 'This campaign targets members with persistent sleep debt or irregular sleep timing. Health Points are paid for consistent sleep windows and verified sleep sufficiency, not one-off long sleeps. The commercial case is modest individual improvement at scale: better engagement, better metabolic-risk proxy, and stronger renewal quality.',
    useCase: 'claims_reduction',
    type: 'stream',
    status: 'active',
    partnerIndex: 0,
    challenge: { metric: 'sleep_hours', operator: 'gte', target: 6.5, unit: 'hrs' },
    additionalChallenges: [{ metric: 'sleep_quality', operator: 'gte', target: 78, unit: 'score' }],
    targeting: { reputationTiers: ['medium', 'high'], healthScoreMin: 25, dataSources: ['apple_health', 'oura', 'whoop'], ageRanges: ['25-34', '35-44', '45-54'], regions: ['Hong Kong', 'Japan'] },
    budgetCeiling: 42000,
    pointsPerVerification: 480,
    maxParticipants: 2186,
    eligible: 2186,
    frequency: 'daily',
    streamDuration: 45,
    dynamicPricing: false,
  },

  // 4. Signal improvement — Resting HR (active, stream)
  {
    name: 'Resting Heart Rate Improvement',
    description: 'Run a controlled pilot for members with elevated or worsening resting heart rate.',
    purpose: 'This campaign targets members with elevated or worsening resting heart rate and enough device coverage to verify improvement. Health Points are paid for activity consistency and a measurable resting heart rate reduction over 90 days. It is narrower than the VO2 Max and sleep campaigns, but creates a clear proof story for partners evaluating outcome-linked rewards.',
    useCase: 'claims_reduction',
    type: 'stream',
    status: 'active',
    partnerIndex: 0,
    challenge: { metric: 'heart_rate_resting', operator: 'lte', target: 3, unit: 'bpm improvement' },
    targeting: { reputationTiers: ['medium', 'high'], healthScoreMin: 35, dataSources: ['apple_health', 'garmin', 'fitbit'], ageRanges: ['35-44', '45-54', '55-64'], regions: ['Hong Kong', 'Japan'] },
    budgetCeiling: 31000,
    pointsPerVerification: 600,
    maxParticipants: 946,
    eligible: 946,
    frequency: 'weekly',
    streamDuration: 90,
    dynamicPricing: false,
  },

  // 5. Acquisition — Open Pool Cardio (active, snapshot)
  {
    name: 'Open Pool Cardio Acquisition',
    description: 'Invite anonymous HealthID members with strong activity consistency to opt into partner onboarding.',
    purpose: 'This campaign targets anonymous opted-in HealthID members in the open pool. The partner sees only a verified segment and campaign performance until the user consents to onboarding. Health Points are paid for a verified cardio activity receipt and consented partner onboarding, allowing the insurer to acquire higher-engagement members without handling raw wearable data inside Campaign Studio.',
    useCase: 'acquisition',
    type: 'snapshot',
    status: 'active',
    partnerIndex: 0,
    challenge: { metric: 'active_minutes', operator: 'gte', target: 150, unit: 'min/wk' },
    targeting: { reputationTiers: ['medium', 'high'], healthScoreMin: 55, dataSources: ['apple_health', 'garmin', 'whoop'], ageRanges: ['25-34', '35-44', '45-54'], regions: ['Hong Kong', 'Japan'] },
    budgetCeiling: 50000,
    pointsPerVerification: 350,
    maxParticipants: 8400,
    eligible: 8400,
  },

  // 6. Retention — Renewal readiness (active, stream)
  {
    name: 'Renewal Readiness Streak',
    description: 'Retain members approaching renewal by rewarding verified sleep, activity, and resting HR receipts.',
    purpose: 'This campaign targets members inside the renewal window and rewards a 60-day readiness streak across wearable signals. The goal is not medical underwriting; it is to keep good members engaged, increase renewal confidence, and reduce friction before lapse risk builds. The partner receives verified receipts and engagement status while raw health records remain with the member.',
    useCase: 'renewal',
    type: 'stream',
    status: 'active',
    partnerIndex: 0,
    challenge: { metric: 'heart_rate_resting', operator: 'lte', target: 72, unit: 'bpm' },
    additionalChallenges: [
      { metric: 'sleep_hours', operator: 'gte', target: 6.5, unit: 'hrs' },
      { metric: 'active_minutes', operator: 'gte', target: 120, unit: 'min/wk' },
    ],
    targeting: { reputationTiers: ['medium', 'high'], dataSources: ['apple_health', 'garmin', 'oura', 'whoop'], ageRanges: ['35-44', '45-54', '55-64'], regions: ['Hong Kong', 'Japan'] },
    budgetCeiling: 42000,
    pointsPerVerification: 420,
    maxParticipants: 2100,
    eligible: 2100,
    frequency: 'weekly',
    streamDuration: 60,
    dynamicPricing: false,
  },

  // 7. Engagement — Device connection (active, snapshot)
  {
    name: 'Device Connection Activation',
    description: 'Increase future campaign readiness by rewarding device connection and first verified receipt.',
    purpose: 'This campaign targets dormant or single-source members and pays Health Points for connecting a wearable and emitting a first verified receipt. The commercial value is future campaign capacity: more source coverage, more reachable members, and stronger proof density for later signal-improvement and retention campaigns.',
    useCase: 'renewal',
    type: 'snapshot',
    status: 'active',
    partnerIndex: 0,
    challenge: { metric: 'active_minutes', operator: 'gte', target: 30, unit: 'min' },
    targeting: { reputationTiers: ['low', 'medium'], dataSources: ['apple_health', 'google_fit', 'samsung_health'], ageRanges: ['18-24', '25-34', '35-44', '45-54'], regions: ['Hong Kong', 'Japan'] },
    budgetCeiling: 24000,
    pointsPerVerification: 180,
    maxParticipants: 6800,
    eligible: 6800,
  },

  // 8. Underwriting — HbA1c lab proof (completed, snapshot)
  {
    name: 'HbA1c Underwriting Screen',
    description: 'Blood-test proof for applicants who can verify HbA1c ≤5.7% without exposing the raw lab value.',
    purpose: 'This is the one clinical proof in the Pacific Assurance demo portfolio. Applicants generate a zero-knowledge proof from a lab result and the partner receives only the pass/fail receipt. It demonstrates that HealthID can support lab-based underwriting checks alongside wearable-led campaigns, while keeping raw blood-test data outside the Campaign Studio.',
    useCase: 'underwriting',
    type: 'snapshot',
    status: 'completed',
    partnerIndex: 0,
    challenge: { metric: 'hba1c', operator: 'lte', target: 5.7, unit: '%' },
    targeting: { dataSources: ['lab_results'], ageRanges: ['35-44', '45-54', '55-64'], regions: ['Hong Kong', 'Japan'] },
    budgetCeiling: 41200,
    pointsPerVerification: 150,
    maxParticipants: 4200,
    eligible: 4200,
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

  // 14. Acquisition (corporate wellness) — Active Minutes (active, stream)
  {
    name: 'Workplace Active Minutes Challenge',
    description: '90-day corporate wellness stream — employees prove ≥ 30 active minutes daily (WHO guideline aligned) to qualify for embedded group coverage. Verified via heart-rate-zone data from any connected device.',
    purpose: 'Active minutes — time spent in elevated heart-rate zones — is the most clinically meaningful activity metric available from consumer wearables. Unlike step counts, which reward any ambulatory movement, active minutes require sustained cardiovascular effort, aligning with the WHO recommendation of ≥ 150 minutes of moderate-intensity activity per week (≈ 30 min/day). This 90-day stream targets employer-distributed group coverage: employees who consistently prove ≥ 30 active minutes daily demonstrate a health-engagement pattern that correlates with 25% lower short-term disability claims. The employer-as-distribution-channel model reduces customer acquisition cost to near zero while pre-qualifying healthy, engaged lives for the insurer\'s group book.',
    useCase: 'acquisition',
    type: 'stream',
    status: 'active',
    partnerIndex: 2,
    challenge: { metric: 'active_minutes', operator: 'gte', target: 30, unit: 'min' },
    targeting: { reputationTiers: ['medium', 'high'], dataSources: ['apple_health', 'fitbit', 'garmin', 'samsung_health'], regions: ['Hong Kong', 'Singapore'] },
    budgetCeiling: 28000,
    pointsPerVerification: 50,
    maxParticipants: 5000,
    eligible: 3800,
    frequency: 'daily',
    streamDuration: 90,
    dynamicPricing: false,
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
  {
    id: 'tmpl_active_minutes',
    name: 'Active Minutes Wellness Stream',
    description: 'Corporate wellness stream — employees prove ≥ 30 active minutes daily (WHO guideline aligned) to qualify for embedded group coverage via heart-rate-zone verification.',
    type: 'stream',
    icon: 'Flame',
    challenge: { metric: 'active_minutes', operator: 'gte', target: 30, unit: 'min' },
    targeting: { reputationTiers: ['medium', 'high'], dataSources: ['apple_health', 'fitbit', 'garmin'] },
    suggestedBudget: 30000,
    suggestedPoints: 50,
  },
];
