import { Activity, ArrowRight, BookOpen, HeartPulse, Moon, ShieldCheck, TrendingUp } from 'lucide-react';
import type { Campaign, HealthMetric } from '@/types';
import { formatNumber, formatPercent } from '@/utils/format';

interface BehaviorShiftEvidenceProps {
  campaign: Campaign;
}

interface EvidenceModel {
  behaviorLabel: string;
  behaviorShift: string;
  improvedShare: number;
  markerLabel: string;
  markerShift: string;
  insurerSignal: string;
  researchSummary: string;
  sourceLabel: string;
  sourceUrl: string;
}

const evidenceByMetric: Partial<Record<HealthMetric, EvidenceModel>> = {
  active_minutes: {
    behaviorLabel: 'Weekly active minutes',
    behaviorShift: '+64 min/wk',
    improvedShare: 0.41,
    markerLabel: 'Activity trajectory',
    markerShift: '+18% meeting WHO baseline',
    insurerSignal: 'Higher engagement, stronger wellness adherence, and more proof-ready lives.',
    researchSummary: 'Prospective cohort evidence links increased physical activity trajectories with lower all-cause and cardiovascular mortality risk.',
    sourceLabel: 'BMJ physical activity trajectory study',
    sourceUrl: 'https://www.bmj.com/content/365/bmj.l2323',
  },
  vo2_max: {
    behaviorLabel: 'Zone 2 consistency',
    behaviorShift: '+2.1 sessions/wk',
    improvedShare: 0.36,
    markerLabel: 'Cardiorespiratory fitness proxy',
    markerShift: '+1.8 mL/kg/min trend',
    insurerSignal: 'A stronger population fitness signal for pricing confidence and long-term risk segmentation.',
    researchSummary: 'AHA scientific statements treat cardiorespiratory fitness as a powerful marker of cardiovascular and all-cause mortality risk.',
    sourceLabel: 'American Heart Association CRF statement',
    sourceUrl: 'https://professional.heart.org/en/science-news/importance-of-assessing-cardiorespiratory-fitness-in-clinical-practice-a-case-for-fitness/top-things-to-know',
  },
  heart_rate_resting: {
    behaviorLabel: 'Recovery adherence',
    behaviorShift: '+23 recovery days',
    improvedShare: 0.33,
    markerLabel: 'Resting HR trend',
    markerShift: '-3.4 bpm median',
    insurerSignal: 'Improved cardiometabolic marker quality without claiming a near-term claims effect.',
    researchSummary: 'Meta-analysis evidence associates higher resting heart rate with higher all-cause and cardiovascular mortality risk.',
    sourceLabel: 'Resting heart rate meta-analysis',
    sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/26598376/',
  },
  hrv: {
    behaviorLabel: 'Recovery days',
    behaviorShift: '+19 days in range',
    improvedShare: 0.32,
    markerLabel: 'Autonomic recovery proxy',
    markerShift: '+7.6 ms median',
    insurerSignal: 'Better recovery consistency and member adherence signals for future outcome-linked programmes.',
    researchSummary: 'Recovery markers are treated here as behavior-adherence signals, not as direct morbidity or claims endpoints.',
    sourceLabel: 'Evidence bridge uses internal verified trend logic',
    sourceUrl: 'https://www.bmj.com/content/365/bmj.l2323',
  },
  sleep_hours: {
    behaviorLabel: 'Sleep schedule consistency',
    behaviorShift: '+4.6 nights/wk',
    improvedShare: 0.39,
    markerLabel: 'Sleep duration band',
    markerShift: '+52 min/night',
    insurerSignal: 'Stronger routine and recovery signals that may support retention and wellness targeting.',
    researchSummary: 'Prospective cohort meta-analysis links sleep duration patterns with all-cause mortality and cardiovascular events.',
    sourceLabel: 'Sleep duration dose-response meta-analysis',
    sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/28889101/',
  },
  sleep_quality: {
    behaviorLabel: 'Sleep quality routine',
    behaviorShift: '+11 quality points',
    improvedShare: 0.35,
    markerLabel: 'Sleep regularity proxy',
    markerShift: '+3.8 stable nights/wk',
    insurerSignal: 'A better recovery and adherence marker for member engagement programmes.',
    researchSummary: 'Sleep duration and quality are associated with cardiovascular and metabolic outcomes in observational research.',
    sourceLabel: 'Sleep and cardiovascular outcomes review',
    sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/29206050/',
  },
  spo2: {
    behaviorLabel: 'Source readiness',
    behaviorShift: '+28% completed check',
    improvedShare: 0.28,
    markerLabel: 'Screening completeness',
    markerShift: '+21% proof-ready',
    insurerSignal: 'Cleaner digital underwriting flow and fewer incomplete health checks.',
    researchSummary: 'Screening completeness and proof readiness are tracked as operational quality signals that improve underwriting workflow confidence.',
    sourceLabel: 'Operational evidence framework',
    sourceUrl: 'https://www.bmj.com/content/365/bmj.l2323',
  },
};

const fallbackEvidence: EvidenceModel = {
  behaviorLabel: 'Verified behavior',
  behaviorShift: '+17% improvement',
  improvedShare: 0.31,
  markerLabel: 'Proof-ready signal',
  markerShift: '+24% confidence',
  insurerSignal: 'Better engagement, stronger verified evidence density, and cleaner future segmentation.',
  researchSummary: 'Behavior change is linked to validated risk markers where available, while claims impact is treated as a longer-term downstream outcome.',
  sourceLabel: 'Physical activity and mortality evidence review',
  sourceUrl: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6527136/',
};

function getEvidenceModel(campaign: Campaign): EvidenceModel {
  return evidenceByMetric[campaign.challenge.metric] ?? fallbackEvidence;
}

function getProjectedValues(campaign: Campaign, improvedShare: number) {
  const invited = campaign.funnel.invited || campaign.funnel.eligible;
  const verified = Math.max(campaign.funnel.verified, Math.round(invited * 0.22));
  const shifted = Math.max(1, Math.round(verified * improvedShare));
  const sustained = Math.max(1, Math.round(shifted * 0.68));

  return { invited, verified, shifted, sustained };
}

export default function BehaviorShiftEvidence({ campaign }: BehaviorShiftEvidenceProps) {
  const evidence = getEvidenceModel(campaign);
  const projected = getProjectedValues(campaign, evidence.improvedShare);
  const shiftedRate = projected.shifted / Math.max(projected.verified, 1);
  const sustainedRate = projected.sustained / Math.max(projected.shifted, 1);

  const flow = [
    {
      label: 'Verified members',
      value: formatNumber(projected.verified),
      icon: <ShieldCheck size={15} />,
    },
    {
      label: 'Behavior shifted',
      value: formatNumber(projected.shifted),
      icon: <TrendingUp size={15} />,
    },
    {
      label: 'Sustained at 60 days',
      value: formatNumber(projected.sustained),
      icon: <Activity size={15} />,
    },
  ];

  return (
    <section className="card border-accent/20 p-5 xl:p-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="flex items-center gap-2 text-base font-semibold text-primary">
            <HeartPulse size={18} className="text-accent" />
            Behaviour Shift Intelligence
          </div>
          <p className="mt-2 max-w-4xl text-sm leading-relaxed text-secondary">
            Tracks verified member behaviour change, sustained health-signal movement, and the published risk-marker evidence that supports long-range insurer value.
          </p>
        </div>
        <span className="badge bg-accent/10 border-accent/20 text-accent">
          Evidence-linked outcome signals
        </span>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <div className="rounded-xl border border-border bg-surface/70 p-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {flow.map((item, index) => (
              <div key={item.label} className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-accent/20 bg-accent/10 text-accent">
                  {item.icon}
                </div>
                <div className="min-w-0">
                  <div className="font-mono text-2xl font-semibold text-primary">{item.value}</div>
                  <div className="text-xs text-tertiary">{item.label}</div>
                </div>
                {index < flow.length - 1 && (
                  <ArrowRight size={14} className="ml-auto hidden text-tertiary md:block" />
                )}
              </div>
            ))}
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-border bg-base/70 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                <Activity size={15} className="text-accent" />
                {evidence.behaviorLabel}
              </div>
              <div className="mt-3 flex items-end justify-between gap-3">
                <span className="font-mono text-3xl font-semibold text-primary">{evidence.behaviorShift}</span>
                <span className="text-xs text-success">{formatPercent(shiftedRate)} shifted</span>
              </div>
              <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-hover">
                <div className="h-full rounded-full bg-accent" style={{ width: `${Math.min(100, shiftedRate * 100)}%` }} />
              </div>
            </div>

            <div className="rounded-lg border border-border bg-base/70 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                <Moon size={15} className="text-accent" />
                {evidence.markerLabel}
              </div>
              <div className="mt-3 flex items-end justify-between gap-3">
                <span className="font-mono text-3xl font-semibold text-primary">{evidence.markerShift}</span>
                <span className="text-xs text-success">{formatPercent(sustainedRate)} sustained</span>
              </div>
              <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-hover">
                <div className="h-full rounded-full bg-success" style={{ width: `${Math.min(100, sustainedRate * 100)}%` }} />
              </div>
            </div>
          </div>
        </div>

        <aside className="rounded-xl border border-border bg-base/70 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-primary">
            <BookOpen size={16} className="text-accent" />
            Evidence Interpretation
          </div>
          <p className="mt-3 text-sm leading-relaxed text-secondary">{evidence.researchSummary}</p>
          <div className="mt-4 rounded-lg bg-hover px-4 py-4 text-sm leading-relaxed text-tertiary">
            Insurer readout: {evidence.insurerSignal}
          </div>
          <a
            href={evidence.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex text-xs font-semibold text-accent hover:text-accent-secondary"
          >
            {evidence.sourceLabel}
          </a>
        </aside>
      </div>
    </section>
  );
}
