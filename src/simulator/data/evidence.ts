import type { EvidenceCitation } from '../types';

/**
 * Expanded evidence library — 15 citations covering the full evidence chain.
 * Each citation is linked to a specific step in the simulation model.
 */

export const EVIDENCE_LIBRARY: EvidenceCitation[] = [
  // ── Steps → Mortality (primary dose-response) ──
  {
    id: 'paluch_2022',
    authors: 'Paluch AE, Bajpai S, Bassett DR, et al.',
    year: 2022,
    title: 'Daily steps and all-cause mortality: a meta-analysis of 15 international cohorts',
    journal: 'Lancet Public Health',
    doi: '10.1016/S2468-2667(21)00302-9',
    sampleSize: 47_488,
    studyDesign: 'meta_analysis',
    effectSize: 'Non-linear dose-response: 3,500→5,800 steps = HR 0.60; 5,800→7,800 = HR 0.45; 7,800→10,900 = HR 0.35',
    effectSizeNumeric: 0.15,
    metricCategories: ['activity', 'mortality'],
    modelUsage: 'Primary dose-response curve for steps → all-cause mortality. Used in Step 5 (Health Impact).',
    evidenceLevel: 'high',
  },
  {
    id: 'banach_2023',
    authors: 'Banach M, Lewek J, Surma S, et al.',
    year: 2023,
    title: 'The association between daily step count and all-cause and cardiovascular mortality: a meta-analysis',
    journal: 'European Journal of Preventive Cardiology',
    doi: '10.1093/eurjpc/zwad229',
    sampleSize: 226_889,
    studyDesign: 'meta_analysis',
    effectSize: '15% all-cause mortality reduction per +1,000 steps/day; 7% CV mortality reduction per +500 steps/day',
    effectSizeNumeric: 0.15,
    metricCategories: ['activity', 'mortality'],
    modelUsage: 'Cross-check for Paluch 2022 dose-response. Validates ~15% per 1K steps linear approximation.',
    evidenceLevel: 'high',
  },
  {
    id: 'saint_maurice_2020',
    authors: 'Saint-Maurice PF, Troiano RP, Bassett DR, et al.',
    year: 2020,
    title: 'Association of daily step count and step intensity with mortality among US adults',
    journal: 'JAMA',
    doi: '10.1001/jama.2020.1382',
    sampleSize: 4_840,
    studyDesign: 'cohort_study',
    effectSize: '≥8,000 vs 4,000 steps: HR 0.49 all-cause mortality. ≥12,000 vs 4,000: HR 0.35. Step intensity not independently associated.',
    effectSizeNumeric: 0.51,
    metricCategories: ['activity', 'mortality'],
    modelUsage: 'Age-stratified dose-response validation. Confirms non-linear curve shape matches Paluch 2022.',
    evidenceLevel: 'high',
  },

  // ── Activity → CVD ──
  {
    id: 'lear_2017',
    authors: 'Lear SA, Hu W, Rangarajan S, et al.',
    year: 2017,
    title: 'The effect of physical activity on mortality and cardiovascular disease in 130,000 people from 17 high-income, middle-income, and low-income countries: the PURE study',
    journal: 'The Lancet',
    doi: '10.1016/S0140-6736(17)31634-3',
    sampleSize: 130_843,
    studyDesign: 'cohort_study',
    effectSize: 'Meeting guidelines (150 min/week): 20% CVD reduction, 28% mortality reduction vs inactive',
    effectSizeNumeric: 0.20,
    metricCategories: ['activity', 'cardiovascular'],
    modelUsage: 'CVD event reduction for activity guideline adherence. Used in morbidity savings calculation.',
    evidenceLevel: 'high',
  },

  // ── Activity → Mortality (device-measured) ──
  {
    id: 'ekelund_2020',
    authors: 'Ekelund U, Tarp J, Fagerland MW, et al.',
    year: 2020,
    title: 'Joint associations of accelerometer-measured physical activity and sedentary time with all-cause mortality',
    journal: 'British Journal of Sports Medicine',
    doi: '10.1136/bjsports-2020-103270',
    sampleSize: 44_370,
    studyDesign: 'meta_analysis',
    effectSize: 'HR ≈ 0.48 highest vs lowest activity quartile (52% mortality reduction). Device-measured.',
    effectSizeNumeric: 0.52,
    metricCategories: ['activity', 'mortality'],
    modelUsage: 'Validates wearable-measured activity → mortality. Supports using step counts from phones/wearables.',
    evidenceLevel: 'high',
  },

  // ── Fitness → Mortality ──
  {
    id: 'mandsager_2018',
    authors: 'Mandsager K, Harb S, Cremer P, et al.',
    year: 2018,
    title: 'Association of cardiorespiratory fitness with long-term mortality among adults undergoing exercise treadmill testing',
    journal: 'JAMA Network Open',
    doi: '10.1001/jamanetworkopen.2018.3605',
    sampleSize: 122_007,
    studyDesign: 'cohort_study',
    effectSize: 'HR 0.20 elite vs low fitness (80% mortality reduction); low fitness exceeds smoking/diabetes risk',
    effectSizeNumeric: 0.80,
    metricCategories: ['activity', 'mortality'],
    modelUsage: 'Supports the premise that physical activity is the strongest modifiable mortality risk factor.',
    evidenceLevel: 'high',
  },

  // ── Global inactivity burden ──
  {
    id: 'hallal_2012',
    authors: 'Hallal PC, Andersen LB, Bull FC, et al.',
    year: 2012,
    title: 'Global physical activity levels: surveillance progress, pitfalls, and prospects',
    journal: 'The Lancet',
    doi: '10.1016/S0140-6736(12)60646-1',
    sampleSize: 0,
    studyDesign: 'meta_analysis',
    effectSize: '31.1% of adults worldwide do not meet minimum physical activity guidelines. Inactivity causes 6-10% of NCDs globally.',
    effectSizeNumeric: 0.31,
    metricCategories: ['activity', 'population'],
    modelUsage: 'Establishes global baseline inactivity prevalence. Contextualises HK (61%) and SG (36%) insufficient activity rates.',
    evidenceLevel: 'high',
  },

  // ── Behaviour Change RCTs ──
  {
    id: 'patel_2016',
    authors: 'Patel MS, Asch DA, Rosin R, et al.',
    year: 2016,
    title: 'Individual versus team-based financial incentives to increase physical activity: a randomized, controlled trial',
    journal: 'Annals of Internal Medicine',
    doi: '10.7326/M15-1635',
    sampleSize: 281,
    studyDesign: 'rct',
    effectSize: 'Loss-framed incentive: +1,600 steps/day during intervention. Top quartile sustained +2,400 steps.',
    effectSizeNumeric: 1600,
    metricCategories: ['activity', 'behaviour_change'],
    modelUsage: 'Calibrates archetype step changes and dropout curves. Top quartile maps to "steady movers" archetype.',
    evidenceLevel: 'medium',
  },
  {
    id: 'patel_2019',
    authors: 'Patel MS, Benjamin EJ, Volpp KG, et al.',
    year: 2019,
    title: 'Effect of a game-based intervention designed to enhance social incentives to increase physical activity (STEP UP)',
    journal: 'JAMA Internal Medicine',
    doi: '10.1001/jamainternmed.2019.3505',
    sampleSize: 602,
    studyDesign: 'rct',
    effectSize: 'Competition gamification: +920 steps/day vs control. Support arm +610, collaboration +530.',
    effectSizeNumeric: 920,
    metricCategories: ['activity', 'behaviour_change'],
    modelUsage: 'Gamification effect size and dropout pattern calibration. Maps to "sporadic engagers" archetype.',
    evidenceLevel: 'medium',
  },

  // ── Real-World Programme Data ──
  {
    id: 'discovery_vitality',
    authors: 'Discovery Vitality',
    year: 2023,
    title: '13-year longitudinal review of Vitality wellness programme outcomes',
    journal: 'Discovery Internal / Published summaries',
    doi: '',
    sampleSize: 5_200_000,
    studyDesign: 'industry_review',
    effectSize: '3× mortality differential engaged vs unengaged; 42% mortality improvement; 1.8× ROI at scale; $120/member/year cost',
    effectSizeNumeric: 0.42,
    metricCategories: ['activity', 'programme', 'roi'],
    modelUsage: 'Gold standard for real-world programme ROI. Validates our 1.8× central ROI estimate. Calibrates archetype persistence rates.',
    evidenceLevel: 'high',
  },

  // ── Wearable / Reinsurer Validation ──
  {
    id: 'munich_re_klarity_2025',
    authors: 'Munich Re / Klarity Health',
    year: 2025,
    title: 'Wearable data for mortality prediction: UK Biobank analysis',
    journal: 'Munich Re Technical Publication',
    doi: '',
    sampleSize: 502_369,
    studyDesign: 'cohort_study',
    effectSize: 'Steps = 2nd strongest mortality predictor after age; >4× risk at <5K vs 15K+ steps',
    effectSizeNumeric: 0.50,
    metricCategories: ['activity', 'wearable', 'underwriting'],
    modelUsage: 'Reinsurer validation that wearable step data is actuarially predictive. Supports signal tier assumptions.',
    evidenceLevel: 'high',
  },
  {
    id: 'swiss_re_risk_assessment',
    authors: 'Swiss Re Institute',
    year: 2023,
    title: 'Life & Health insurance risk assessment through wearable technology',
    journal: 'Swiss Re sigma research',
    doi: '',
    sampleSize: 0,
    studyDesign: 'industry_review',
    effectSize: 'Wearable data can improve mortality/morbidity prediction by 15-25% vs traditional underwriting factors alone',
    effectSizeNumeric: 0.20,
    metricCategories: ['wearable', 'underwriting'],
    modelUsage: 'Validates the use of wearable signals for insurance risk stratification and pricing.',
    evidenceLevel: 'medium',
  },

  // ── Sleep ──
  {
    id: 'cappuccio_2010',
    authors: 'Cappuccio FP, D\'Elia L, Strazzullo P, Miller MA',
    year: 2010,
    title: 'Sleep duration and all-cause mortality: a systematic review and meta-analysis of prospective studies',
    journal: 'Sleep',
    doi: '10.1093/sleep/33.5.585',
    sampleSize: 1_382_999,
    studyDesign: 'meta_analysis',
    effectSize: 'Short sleep RR 1.12; long sleep RR 1.30. U-shaped dose-response.',
    effectSizeNumeric: 0.12,
    metricCategories: ['sleep', 'mortality'],
    modelUsage: 'Context for sleep signals. Not used in primary step-based model but relevant for wearable tier justification.',
    evidenceLevel: 'high',
  },

  // ── Wearable Feedback Meta-Review ──
  {
    id: 'glisic_2026',
    authors: 'Glisic M, et al.',
    year: 2026,
    title: 'Wearable feedback interventions for physical activity promotion: a systematic review of systematic reviews',
    journal: 'Physiological Reviews',
    doi: '10.1152/physrev.00045.2025',
    sampleSize: 0,
    studyDesign: 'meta_analysis',
    effectSize: 'Wearable feedback consistently increases steps across populations (39 systematic reviews)',
    effectSizeNumeric: 0.15,
    metricCategories: ['activity', 'wearable'],
    modelUsage: 'Supports the premise that wearable feedback drives behaviour change across populations.',
    evidenceLevel: 'medium',
  },

  // ── Lapse Reduction ──
  {
    id: 'discovery_lapse_2022',
    authors: 'Discovery Vitality Financial Reports',
    year: 2022,
    title: 'Vitality member engagement and lapse rate analysis',
    journal: 'Discovery Annual Report 2022',
    doi: '',
    sampleSize: 3_800_000,
    studyDesign: 'industry_review',
    effectSize: 'Engaged Vitality members 10-15% less likely to lapse than non-engaged members',
    effectSizeNumeric: 0.125,
    metricCategories: ['programme', 'retention'],
    modelUsage: 'Calibrates lapse reduction value in financial model. Applied to engaged archetypes only.',
    evidenceLevel: 'medium',
  },
];

export function getEvidenceById(id: string) {
  return EVIDENCE_LIBRARY.find((e) => e.id === id);
}

export function getEvidenceByCategory(category: string) {
  return EVIDENCE_LIBRARY.filter((e) => e.metricCategories.includes(category));
}

export function getEvidenceByDesign(design: EvidenceCitation['studyDesign']) {
  return EVIDENCE_LIBRARY.filter((e) => e.studyDesign === design);
}
