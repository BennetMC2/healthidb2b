import { MessageCircle, Gift, ShieldCheck, ArrowRight, Smartphone, CheckCircle2 } from 'lucide-react';
import { HEALTH_METRIC_LABELS } from '@/utils/constants';
import type { Campaign, Partner } from '@/types';

interface DeliveryLoopPreviewProps {
  campaign: Campaign;
  partner: Partner;
}

// Context-aware nudge messages from Liv based on campaign signal
function getLivMessages(campaign: Campaign, partner: Partner): { intro: string; nudge: string; encouragement: string } {
  const metric = campaign.challenge.metric;
  const partnerName = partner.label;

  const messages: Record<string, { intro: string; nudge: string; encouragement: string }> = {
    vo2_max: {
      intro: `Hey! ${partnerName} has a cardio fitness reward available for you.`,
      nudge: "Your Zone 2 minutes have dipped this week. Want to rebuild the streak? There's a reward waiting.",
      encouragement: "Your VO2 Max trend is up 1.8 mL/kg this month. You're on track for the full reward.",
    },
    hrv: {
      intro: `${partnerName} is offering a recovery programme reward.`,
      nudge: "Your HRV has been trending down. A lighter training week could help — and there's a reward for verified recovery days.",
      encouragement: "Your resting HRV is stabilising. Keep this up and the reward unlocks in 12 days.",
    },
    sleep_hours: {
      intro: `${partnerName} has a sleep consistency reward for you.`,
      nudge: "Your sleep window has been shifting later. A consistent bedtime this week could get you back on track — and there's HP waiting.",
      encouragement: "7h 12m average this week. Your sleep debt is clearing and the reward is nearly there.",
    },
    heart_rate_resting: {
      intro: `${partnerName} is rewarding resting heart rate improvement.`,
      nudge: "Your resting HR has crept up 3 bpm. A few easy cardio sessions this week could bring it back — and earn you Health Points.",
      encouragement: "Down 2 bpm from your baseline. The 90-day trend is heading the right way.",
    },
    active_minutes: {
      intro: `${partnerName} has an activity challenge for you.`,
      nudge: "You're at 18 active minutes today — 12 more to hit the daily target and earn HP.",
      encouragement: "5 days in a row above 30 minutes. The streak reward is close.",
    },
    sleep_quality: {
      intro: `${partnerName} is offering a sleep health reward.`,
      nudge: "Your deep sleep has been lighter this week. Try cutting screen time 30 min before bed.",
      encouragement: "Sleep quality score hit 82 last night. You're in the reward zone.",
    },
    blood_pressure: {
      intro: `${partnerName} has a blood pressure monitoring reward.`,
      nudge: "Time for your weekly reading. Consistent monitoring earns Health Points.",
      encouragement: "All readings below 130/85 this month. Keep it up for the full reward.",
    },
  };

  const fallback = {
    intro: `${partnerName} has a health challenge waiting for you.`,
    nudge: "Your recent data shows room for improvement. There's a reward for verified progress.",
    encouragement: "You're making progress. Keep going to unlock the full reward.",
  };

  return messages[metric] ?? fallback;
}

export default function DeliveryLoopPreview({ campaign, partner }: DeliveryLoopPreviewProps) {
  const metricLabel = HEALTH_METRIC_LABELS[campaign.challenge.metric] ?? campaign.challenge.metric;
  const liv = getLivMessages(campaign, partner);
  const hp = campaign.rewards.pointsPerVerification;

  return (
    <div className="card">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <div className="text-2xs uppercase tracking-[0.14em] text-accent font-medium">Campaign delivery loop</div>
          <h3 className="mt-1 text-sm font-semibold text-primary">How this reaches members</h3>
        </div>
        <div className="flex items-center gap-1 rounded-full border border-border bg-elevated px-2 py-1 text-2xs text-secondary">
          <Smartphone size={10} />
          Liv + Offers
        </div>
      </div>

      {/* 5-step delivery flow */}
      <div className="space-y-3 mb-5">
        {[
          { step: 1, label: 'Define', desc: 'Campaign rule created in Campaign Studio', done: true },
          { step: 2, label: 'Target', desc: `${campaign.funnel.eligible.toLocaleString()} eligible members identified`, done: true },
          { step: 3, label: 'Deliver', desc: 'Liv conversation + Offer card sent to member app', done: campaign.status !== 'draft' },
          { step: 4, label: 'Verify', desc: `Member proves ${metricLabel} against campaign rule`, done: campaign.funnel.verified > 0 },
          { step: 5, label: 'Measure', desc: 'Proof receipt flows to Verification Trail + ROI', done: campaign.funnel.verified > 0 },
        ].map((s, i, arr) => (
          <div key={s.step} className="flex items-start gap-3">
            <div className="flex flex-col items-center">
              <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                s.done ? 'bg-accent text-white' : 'bg-elevated text-tertiary border border-border'
              }`}>
                {s.done ? <CheckCircle2 size={14} /> : s.step}
              </div>
              {i < arr.length - 1 && (
                <div className={`w-px h-4 ${s.done ? 'bg-accent/30' : 'bg-border'}`} />
              )}
            </div>
            <div className="pt-0.5">
              <div className={`text-xs font-semibold ${s.done ? 'text-primary' : 'text-tertiary'}`}>{s.label}</div>
              <div className="text-2xs text-tertiary">{s.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Phone mockup — Liv conversation + Offer card */}
      <div className="rounded-2xl border-2 border-border bg-base p-4 mx-auto max-w-[280px]">
        {/* Status bar */}
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-2xs font-mono text-tertiary">9:41</span>
          <div className="flex gap-1">
            <div className="w-3 h-1.5 bg-tertiary/30 rounded-sm" />
            <div className="w-3 h-1.5 bg-tertiary/30 rounded-sm" />
            <div className="w-1.5 h-1.5 bg-tertiary/30 rounded-full" />
          </div>
        </div>

        {/* App header */}
        <div className="flex items-center gap-2 mb-3 px-1">
          <div className="h-7 w-7 rounded-full bg-accent/20 flex items-center justify-center">
            <MessageCircle size={13} className="text-accent" />
          </div>
          <div>
            <div className="text-xs font-semibold text-primary">Liv</div>
            <div className="text-2xs text-tertiary">Health companion</div>
          </div>
        </div>

        {/* Chat bubbles */}
        <div className="space-y-2 mb-3">
          {/* Liv intro */}
          <div className="rounded-xl rounded-tl-sm bg-elevated border border-border px-3 py-2 max-w-[90%]">
            <p className="text-2xs leading-relaxed text-primary">{liv.intro}</p>
          </div>
          {/* Liv nudge */}
          <div className="rounded-xl rounded-tl-sm bg-elevated border border-border px-3 py-2 max-w-[90%]">
            <p className="text-2xs leading-relaxed text-primary">{liv.nudge}</p>
          </div>
          {/* User reply */}
          <div className="flex justify-end">
            <div className="rounded-xl rounded-tr-sm bg-accent text-white px-3 py-2 max-w-[75%]">
              <p className="text-2xs leading-relaxed">Show me the reward</p>
            </div>
          </div>
          {/* Liv encouragement */}
          <div className="rounded-xl rounded-tl-sm bg-elevated border border-border px-3 py-2 max-w-[90%]">
            <p className="text-2xs leading-relaxed text-primary">{liv.encouragement}</p>
          </div>
        </div>

        {/* Offer card */}
        <div className="rounded-xl border border-accent/30 bg-accent/5 p-3">
          <div className="flex items-center gap-2 mb-2">
            <Gift size={12} className="text-accent" />
            <span className="text-2xs font-semibold text-accent uppercase tracking-wider">Offer</span>
          </div>
          <div className="text-xs font-semibold text-primary mb-1">{campaign.name}</div>
          <p className="text-2xs text-secondary mb-2">
            Earn {hp} HP for verified {metricLabel.toLowerCase()} improvement
          </p>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 text-2xs text-tertiary">
              <ShieldCheck size={10} />
              ZK-verified
            </div>
            <button className="flex items-center gap-1 rounded-full bg-accent px-3 py-1.5 text-2xs font-semibold text-white">
              Accept <ArrowRight size={10} />
            </button>
          </div>
        </div>

        {/* Proof receipt preview */}
        <div className="mt-3 rounded-lg border border-success/20 bg-success/5 p-2">
          <div className="flex items-center gap-1.5 mb-1">
            <ShieldCheck size={10} className="text-success" />
            <span className="text-2xs font-semibold text-success">Proof receipt</span>
          </div>
          <div className="font-mono text-2xs text-tertiary leading-relaxed">
            plonk_health_v2 · rule_pass: true<br />
            pii_access: none · raw_data: 0<br />
            verifier: moca_testnet
          </div>
        </div>

        {/* Home bar */}
        <div className="w-12 h-1 bg-border rounded-full mx-auto mt-3" />
      </div>

      {/* Schema contract note */}
      <div className="mt-4 rounded-xl border border-border bg-surface/80 px-3 py-2">
        <div className="text-2xs font-medium text-secondary mb-1">Shared schema contract</div>
        <div className="font-mono text-2xs text-tertiary leading-relaxed">
          {'{'} cohortRule, reward: {'{'}hp, budget{'}'}, verificationRule: {'{'}metric, operator, target{'}'}, proofType: "plonk_health_v2" {'}'}
        </div>
      </div>
    </div>
  );
}
