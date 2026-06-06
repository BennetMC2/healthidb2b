import type { Market, StudyDesign, ChapterId } from './types';
import type { MetricCategory } from './data/metricEvidence';

export const MARKET_LABELS: Record<Market, string> = {
  hong_kong: 'Hong Kong',
  singapore: 'Singapore',
};

export const STUDY_DESIGN_LABELS: Record<StudyDesign, string> = {
  rct: 'Randomised Controlled Trial',
  meta_analysis: 'Meta-Analysis',
  cohort_study: 'Cohort Study',
  industry_review: 'Industry Review',
};

export const HORIZON_OPTIONS = [
  { label: '1 Year', months: 12 },
  { label: '3 Years', months: 36 },
  { label: '5 Years', months: 60 },
] as const;

export const MODEL_VERSION = 'EBM-v3.0';

export const DEFAULT_REWARD_CEILING_PCT = 0.70;

export const DEFAULT_REALIZATION_DISCOUNT = 0.65;

export const ARCHETYPE_COLORS: Record<string, string> = {
  non_starters: '#94a3b8',
  early_dropouts: '#f97316',
  sporadic_engagers: '#eab308',
  steady_movers: '#22c55e',
  super_engagers: '#3b82f6',
  already_active: '#8b5cf6',
};

export const METRIC_CATEGORY_COLORS: Record<MetricCategory, string> = {
  cardiac: '#ef4444',
  sleep: '#8b5cf6',
  respiratory: '#06b6d4',
  activity: '#22c55e',
  clinical: '#f59e0b',
};

export const METRIC_CATEGORY_LABELS: Record<MetricCategory, string> = {
  cardiac: 'Cardiac',
  sleep: 'Sleep',
  respiratory: 'Respiratory',
  activity: 'Activity',
  clinical: 'Clinical',
};

export interface ChapterDefinition {
  id: ChapterId;
  title: string;
  subtitle: string;
  path: string;
}

export const CHAPTERS: ChapterDefinition[] = [
  { id: 1, title: 'Your Population', subtitle: 'Market demographics and signal coverage', path: '/simulator/build/1' },
  { id: 2, title: 'The Health Opportunity', subtitle: 'Population risk by metric and evidence strength', path: '/simulator/build/2' },
  { id: 3, title: 'Select Your Campaigns', subtitle: 'Pick 1-3 campaigns matching your objectives', path: '/simulator/build/3' },
  { id: 4, title: 'How People Actually Behave', subtitle: '6 archetypes adapted per metric', path: '/simulator/build/4' },
  { id: 5, title: 'The Health Impact', subtitle: 'Per-campaign dose-response and avoided deaths', path: '/simulator/build/5' },
  { id: 6, title: 'The Financial Case', subtitle: 'Combined ROI — it pays for itself', path: '/simulator/build/6' },
  { id: 7, title: 'What If We\'re Wrong?', subtitle: 'Sensitivity analysis and stress testing', path: '/simulator/build/7' },
];

export function getChapter(id: ChapterId): ChapterDefinition {
  return CHAPTERS.find((c) => c.id === id)!;
}
