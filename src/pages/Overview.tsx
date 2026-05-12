import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  BrainCircuit,
  CreditCard,
  Eye,
  Gift,
  HeartPulse,
  Lock,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Target,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';
import { useSimulatedLoading } from '@/hooks/useSimulatedLoading';
import { useCampaignStore } from '@/stores/useCampaignStore';
import { usePartnerStore } from '@/stores/usePartnerStore';
import { formatCurrency, formatNumber, formatPercent } from '@/utils/format';

function sum<T>(items: T[], selector: (item: T) => number): number {
  return items.reduce((total, item) => total + selector(item), 0);
}

function ratio(numerator: number, denominator: number): number {
  return numerator / Math.max(denominator, 1);
}

const bridgeChips = ['Proofs / Signals', 'Consent & Control', 'Privacy by Design'] as const;

export default function Overview() {
  const navigate = useNavigate();
  const loading = useSimulatedLoading(300);
  const currentPartner = usePartnerStore((s) => s.currentPartner);
  const allCampaigns = useCampaignStore((s) => s.campaigns);

  const campaigns = useMemo(
    () => allCampaigns.filter((campaign) => campaign.partnerId === currentPartner.id),
    [allCampaigns, currentPartner.id],
  );

  const overview = useMemo(() => {
    const reachableMembers = sum(campaigns, (campaign) => campaign.funnel.eligible);
    const invitedMembers = sum(campaigns, (campaign) => campaign.funnel.invited);
    const enrolledMembers = sum(campaigns, (campaign) => campaign.funnel.enrolled);
    const verifiedOutcomes = sum(campaigns, (campaign) => campaign.funnel.verified);
    const rewardedMembers = sum(campaigns, (campaign) => campaign.funnel.rewarded);
    const rewardsBudget = sum(campaigns, (campaign) => campaign.rewards.budgetSpent);
    const redemptionCount = sum(campaigns, (campaign) => campaign.b2cSync?.redemptionCount ?? 0);
    const highTrustMembers = campaigns.flatMap((campaign) => campaign.b2cSync?.memberSummaries ?? []).filter((member) => member.fidelity === 'high').length;

    return {
      activeCampaigns: campaigns.filter((campaign) => campaign.status === 'active').length,
      reachableMembers,
      invitedMembers,
      enrolledMembers,
      verifiedOutcomes,
      rewardedMembers,
      rewardsBudget,
      redemptionCount,
      highTrustMembers,
      verificationRate: ratio(verifiedOutcomes, enrolledMembers),
      enrollmentRate: ratio(enrolledMembers, invitedMembers),
    };
  }, [campaigns]);

  const partnerCopy = useMemo(() => {
    if (currentPartner.tier === 'enterprise') {
      return {
        headline: 'A new intelligence layer for health insurers.',
        subheadline: 'Verified health signals, campaign tools and ROI insight without raw-data custody.',
        benefitA: 'Better pricing, underwriting and risk decisions',
        benefitB: 'Stronger retention, acquisition and product differentiation',
      };
    }

    if (currentPartner.tier === 'professional') {
      return {
        headline: 'A compact operating layer for insurer growth teams.',
        subheadline: 'Move from pilot campaigns to measurable proof-backed insurer actions without taking custody of health records.',
        benefitA: 'Faster validation with risk, compliance and distribution',
        benefitB: 'Proof-backed engagement that can scale beyond a single pilot',
      };
    }

    return {
      headline: 'A launchpad for zero-custody insurer products.',
      subheadline: 'Use verified health movement to test pricing, engagement and rewards mechanics before building a heavier system.',
      benefitA: 'Clearer unit economics for each campaign',
      benefitB: 'A credible wedge into underwriting and retention workflows',
    };
  }, [currentPartner.tier]);

  const userBenefits = [
    {
      icon: <Users size={16} />,
      text: 'Lifetime record of health and device data in one place',
    },
    {
      icon: <BrainCircuit size={16} />,
      text: 'Persistent AI companion that learns over time',
    },
    {
      icon: <TrendingUp size={16} />,
      text: 'Forward-looking guidance, not just a rear-view mirror',
    },
    {
      icon: <Lock size={16} />,
      text: 'Private control over what is shared and with whom',
    },
    {
      icon: <Gift size={16} />,
      text: 'Health Points for verified improvement, redeemable for real-world rewards',
      strong: true,
    },
  ];

  const enterpriseBenefits = [
    {
      icon: <Eye size={16} />,
      text: 'High-fidelity view of user health status through verified signals',
    },
    {
      icon: <ShieldCheck size={16} />,
      text: 'No raw-data liability for data they never hold',
    },
    {
      icon: <Activity size={16} />,
      text: partnerCopy.benefitA,
    },
    {
      icon: <Target size={16} />,
      text: partnerCopy.benefitB,
    },
    {
      icon: <Wallet size={16} />,
      text: 'A way to fund meaningful rewards from verified health value',
      strong: true,
    },
  ];

  if (loading) {
    return (
      <div className="h-full overflow-hidden px-4 py-4 sm:px-6">
        <div className="grid h-full gap-4 rounded-[28px] border border-border/60 bg-surface/80 p-4 shadow-[0_20px_60px_rgb(var(--n-shadow)/0.08)]">
          <div className="skeleton h-16 rounded-2xl" />
          <div className="grid flex-1 gap-4 xl:grid-cols-[1.1fr_0.34fr_1.1fr]">
            <div className="skeleton rounded-[28px]" />
            <div className="skeleton rounded-[28px]" />
            <div className="skeleton rounded-[28px]" />
          </div>
          <div className="skeleton h-24 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-hidden px-2 py-2 sm:px-3 sm:py-3">
      <div className="relative grid h-full gap-3 overflow-hidden rounded-[30px] border border-border/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(247,249,252,0.92))] p-3 shadow-[0_24px_80px_rgb(var(--n-shadow)/0.08)] lg:gap-4 lg:p-5">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[-8%] top-[-8%] h-56 w-56 rounded-full bg-accent/10 blur-3xl" />
          <div className="absolute right-[-10%] top-[14%] h-56 w-56 rounded-full bg-accent-secondary/10 blur-3xl" />
          <div className="absolute bottom-[-14%] left-[34%] h-48 w-48 rounded-full bg-accent/8 blur-3xl" />
        </div>

        <header className="relative grid gap-3 lg:grid-cols-[auto_1fr] lg:items-start">
          <div>
            <div className="text-[1.9rem] font-semibold tracking-[-0.03em] text-primary">HealthID</div>
          </div>
          <div className="flex flex-col gap-2 lg:items-center lg:text-center">
            <h1 className="max-w-[980px] text-[1.3rem] font-semibold leading-[1.12] text-primary sm:text-[1.55rem] lg:text-[2rem]">
              HealthID connects users and enterprises through verified health data in a privacy-preserving way that creates value for both.
            </h1>
            <div className="flex flex-wrap gap-2 lg:justify-center">
              <button onClick={() => navigate('/campaigns/new')} className="btn rounded-full bg-accent px-4 py-2 text-xs text-white shadow-sm hover:bg-accent-hover">
                Launch campaign
              </button>
              <button onClick={() => navigate('/compliance')} className="btn rounded-full border border-border bg-surface/80 px-4 py-2 text-xs text-secondary hover:bg-hover">
                Review trust boundary
              </button>
            </div>
          </div>
        </header>

        <section className="relative grid min-h-0 flex-1 gap-3 xl:grid-cols-[1.08fr_0.34fr_1.08fr] xl:gap-4">
          <div className="grid min-h-0 rounded-[28px] border border-accent-secondary/18 bg-white/82 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] xl:grid-rows-[auto_1fr_auto]">
            <div className="grid gap-1 xl:grid-cols-[210px_1fr] xl:gap-5">
              <div className="order-2 xl:order-1 xl:self-end">
                <div className="mx-auto mt-1 w-[170px] rounded-[30px] border border-slate-300/80 bg-white p-3 shadow-[0_20px_40px_rgba(15,23,42,0.12)] xl:mt-0 xl:w-[190px]">
                  <div className="flex items-center justify-between text-[0.58rem] font-semibold text-primary/70">
                    <span>9:21</span>
                    <div className="h-4 w-10 rounded-full bg-slate-950" />
                    <span>AI</span>
                  </div>
                  <div className="mt-3 text-[0.72rem] text-secondary">Good morning,</div>
                  <div className="text-[1.1rem] font-semibold leading-none text-primary">Alex</div>
                  <div className="mt-4 grid grid-cols-[1fr_72px] items-center gap-2">
                    <div>
                      <div className="text-[0.58rem] uppercase tracking-[0.18em] text-tertiary">Health Score</div>
                      <div className="mt-1 text-[2rem] font-semibold leading-none text-primary">82</div>
                      <div className="mt-1 text-[0.58rem] font-medium text-success">Great</div>
                      <div className="text-[0.54rem] text-tertiary">+5 this week</div>
                    </div>
                    <div className="relative h-[72px] w-[72px] rounded-full bg-[conic-gradient(rgb(var(--a-accent-secondary))_0_72%,rgb(var(--n-border))_72%_100%)] p-[7px]">
                      <div className="h-full w-full rounded-full bg-white" />
                    </div>
                  </div>
                  <div className="mt-4 rounded-2xl bg-accent-dim/55 p-2.5">
                    <div className="text-[0.56rem] text-tertiary">Today&apos;s focus</div>
                    <div className="mt-1 text-[0.68rem] font-medium leading-snug text-primary">Improve sleep quality</div>
                  </div>
                  <div className="mt-3 rounded-2xl border border-border/80 p-2.5">
                    <div className="text-[0.56rem] text-tertiary">Health Points</div>
                    <div className="mt-1 text-[1rem] font-semibold text-primary">1,250 HP</div>
                    <div className="mt-1 inline-flex items-center gap-1 text-[0.56rem] font-medium text-accent-secondary">
                      View wallet
                      <ArrowRight size={9} />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-[0.54rem] text-tertiary">
                    <span>Home</span>
                    <span>Insights</span>
                    <span>Track</span>
                    <span>Points</span>
                    <span>Profile</span>
                  </div>
                </div>
              </div>

              <div className="order-1 xl:order-2">
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-accent-secondary">User App</div>
                <h2 className="mt-2 max-w-[420px] text-[1.65rem] font-semibold leading-[1.08] text-primary lg:text-[2.15rem]">
                  The most rewarding AI health companion.
                </h2>
                <p className="mt-2 max-w-[420px] text-sm leading-relaxed text-secondary">
                  Private health record, personalised guidance and Health Points in one place.
                </p>
                <div className="mt-5 text-xs font-semibold uppercase tracking-[0.14em] text-accent-secondary">
                  What users get
                </div>
                <div className="mt-2 grid gap-1.5">
                  {userBenefits.map((benefit) => (
                    <div key={benefit.text} className="grid grid-cols-[40px_1fr] items-start gap-3 rounded-2xl border border-transparent px-1 py-1.5">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-secondary-muted text-accent-secondary">
                        {benefit.icon}
                      </div>
                      <div className={`border-b border-border/60 pb-2 text-[0.96rem] leading-snug ${benefit.strong ? 'font-semibold text-primary' : 'text-secondary'}`}>
                        {benefit.text}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-3 grid gap-2 lg:grid-cols-2">
              <div className="rounded-2xl border border-accent-secondary/20 bg-white/88 p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(145deg,rgb(var(--a-accent-secondary)),rgb(var(--a-accent)))] text-white shadow-sm">
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <div className="text-[1.08rem] font-semibold leading-tight text-primary">AI Companion &amp; Tracker</div>
                    <div className="mt-1 text-xs text-secondary">Guidance loop informed by user-controlled health history.</div>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-accent-secondary/20 bg-white/88 p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(145deg,rgb(var(--a-accent-secondary)),rgb(var(--a-accent)))] text-white shadow-sm">
                    <CreditCard size={20} />
                  </div>
                  <div>
                    <div className="text-[1.08rem] font-semibold leading-tight text-primary">Health Points Wallet</div>
                    <div className="mt-1 text-xs text-secondary">{formatNumber(overview.redemptionCount)} redemptions tied to verified progress.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid min-h-0 grid-rows-[1fr_auto] items-center gap-3">
            <div className="relative flex h-full min-h-[260px] flex-col items-center justify-center rounded-[28px] border border-border/70 bg-white/76 px-3 py-4 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]">
              <div className="absolute left-0 top-1/2 hidden h-px w-[18%] -translate-y-1/2 border-t-2 border-dashed border-accent-secondary/70 xl:block" />
              <div className="absolute right-0 top-1/2 hidden h-px w-[18%] -translate-y-1/2 border-t-2 border-dashed border-accent-secondary/70 xl:block" />
              <div className="mb-4 text-[1.05rem] font-semibold uppercase tracking-[0.1em] text-accent-secondary">
                Verified.
                <br />
                Private.
                <br />
                Valuable.
              </div>
              <div className="flex h-20 w-20 items-center justify-center rounded-[28px] bg-[linear-gradient(145deg,rgb(var(--a-accent-secondary))/0.9,rgb(var(--a-accent))/0.9)] text-white shadow-lg">
                <ShieldCheck size={34} />
              </div>
              <div className="mt-5 text-[1.65rem] font-semibold text-primary">ZK Bridge</div>
              <p className="mt-3 max-w-[180px] text-sm leading-relaxed text-secondary">
                Zero-knowledge proofs ensure only verified signals pass between apps.
              </p>
            </div>
            <div className="grid gap-2">
              {bridgeChips.map((chip) => (
                <div key={chip} className="rounded-full border border-border/80 bg-white/92 px-3 py-2 text-center text-[0.78rem] font-medium uppercase tracking-[0.08em] text-secondary shadow-sm">
                  {chip}
                </div>
              ))}
            </div>
          </div>

          <div className="grid min-h-0 rounded-[28px] border border-accent/18 bg-white/82 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] xl:grid-rows-[auto_1fr_auto]">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--a-accent))]">Enterprise App</div>
              <h2 className="mt-2 max-w-[480px] text-[1.65rem] font-semibold leading-[1.08] text-primary lg:text-[2.15rem]">
                {partnerCopy.headline}
              </h2>
              <p className="mt-2 max-w-[470px] text-sm leading-relaxed text-secondary">
                {partnerCopy.subheadline}
              </p>
            </div>

            <div className="mt-4 grid min-h-0 gap-4 xl:grid-cols-[1.18fr_0.82fr]">
              <div className="overflow-hidden rounded-[24px] border border-accent/18 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(241,245,249,0.92))] shadow-[0_18px_36px_rgba(15,23,42,0.08)]">
                <div className="grid h-full min-h-[250px] grid-cols-[92px_1fr]">
                  <div className="bg-[linear-gradient(180deg,#0f1b52,#121b3f)] p-3 text-white">
                    <div className="text-[1.5rem] font-semibold leading-none">H</div>
                    <div className="mt-4 grid gap-3 text-[0.62rem] text-white/80">
                      <div className="rounded-lg bg-white/10 px-2 py-1.5">Overview</div>
                      <div>Users</div>
                      <div>Segments</div>
                      <div>Campaigns</div>
                      <div>Insights</div>
                      <div>ROI / Actuary</div>
                      <div>Settings</div>
                    </div>
                  </div>
                  <div className="grid grid-rows-[auto_1fr] p-3">
                    <div className="grid grid-cols-2 gap-2 2xl:grid-cols-4">
                      {[
                        { label: 'Active users', value: formatNumber(overview.enrolledMembers) },
                        { label: 'Verified signals', value: formatNumber(overview.verifiedOutcomes) },
                        { label: 'Verification rate', value: formatPercent(overview.verificationRate) },
                        { label: 'Rewards budget', value: formatCurrency(overview.rewardsBudget) },
                      ].map((stat) => (
                        <div key={stat.label} className="rounded-2xl border border-border/70 bg-white/90 p-2.5">
                          <div className="text-[0.58rem] uppercase tracking-[0.14em] text-tertiary">{stat.label}</div>
                          <div className="mt-2 text-[1.1rem] font-semibold leading-none text-primary">{stat.value}</div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 grid gap-3 xl:grid-cols-[1.05fr_0.95fr]">
                      <div className="rounded-2xl border border-border/70 bg-white/90 p-3">
                        <div className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-secondary">Health Score Distribution</div>
                        <div className="mt-4 flex h-[120px] items-end gap-2">
                          {[22, 36, 58, 84, 52, 28].map((height, index) => (
                            <div key={height} className="flex flex-1 flex-col items-center gap-2">
                              <div
                                className={`w-full rounded-t-xl ${index === 3 ? 'bg-accent/55' : 'bg-accent/28'}`}
                                style={{ height: `${height}%` }}
                              />
                              <span className="text-[0.52rem] text-tertiary">{20 + index * 10}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="rounded-2xl border border-border/70 bg-white/90 p-3">
                        <div className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-secondary">Top Campaign Performance</div>
                        <div className="mt-4 grid gap-3">
                          {[
                            { name: 'Move More', value: 72 },
                            { name: 'Sleep Better', value: 64 },
                            { name: 'Prevent & Screen', value: 58 },
                          ].map((campaign) => (
                            <div key={campaign.name} className="grid grid-cols-[1fr_78px_34px] items-center gap-2">
                              <div className="truncate text-[0.72rem] text-secondary">{campaign.name}</div>
                              <div className="h-1.5 rounded-full bg-accent-dim">
                                <div className="h-full rounded-full bg-accent" style={{ width: `${campaign.value}%` }} />
                              </div>
                              <div className="text-right text-[0.68rem] font-semibold text-primary">{campaign.value}%</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-2.5 self-start">
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--a-accent))]">What enterprises get</div>
                {enterpriseBenefits.map((benefit) => (
                  <div key={benefit.text} className="grid grid-cols-[38px_1fr] items-start gap-3 rounded-2xl border border-transparent px-1 py-1">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-muted text-accent">
                      {benefit.icon}
                    </div>
                    <div className={`border-b border-border/60 pb-2 text-[0.92rem] leading-snug ${benefit.strong ? 'font-semibold text-primary' : 'text-secondary'}`}>
                      {benefit.text}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-3 grid gap-2 xl:grid-cols-3">
              {[
                {
                  icon: <Stethoscope size={20} />,
                  title: 'AI Actuary ROI Tool',
                  caption: `${formatPercent(overview.enrollmentRate)} enrollment conversion`,
                },
                {
                  icon: <Target size={20} />,
                  title: 'Campaign Builder',
                  caption: `${overview.activeCampaigns} active programmes`,
                },
                {
                  icon: <HeartPulse size={20} />,
                  title: 'User Insights & Analytics',
                  caption: `${formatNumber(overview.highTrustMembers)} high-trust members`,
                },
              ].map((module) => (
                <div key={module.title} className="rounded-2xl border border-accent/18 bg-white/88 p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(145deg,rgb(var(--a-accent)),rgb(var(--a-accent-secondary)))] text-white shadow-sm">
                      {module.icon}
                    </div>
                    <div>
                      <div className="text-[1.02rem] font-semibold leading-tight text-primary">{module.title}</div>
                      <div className="mt-1 text-xs text-secondary">{module.caption}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <footer className="relative rounded-[26px] border border-border/80 bg-white/88 px-4 py-3 shadow-[0_12px_24px_rgba(15,23,42,0.06)]">
          <div className="grid gap-3 lg:grid-cols-[auto_1fr_auto] lg:items-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-secondary-muted text-accent-secondary">
              <Users size={26} />
            </div>
            <div>
              <div className="text-[1.15rem] font-semibold leading-tight text-primary">
                Over time, every campaign grows an open network of opt-in, verified health users.
              </div>
              <div className="mt-1 text-sm text-secondary">
                More users. More signals. More value for {currentPartner.label} and every member who chooses to participate.
              </div>
            </div>
            <div className="flex flex-wrap gap-2 lg:justify-end">
              <button onClick={() => navigate('/campaigns')} className="btn rounded-full border border-border bg-surface/90 px-4 py-2 text-xs text-secondary hover:bg-hover">
                View campaigns
              </button>
              <button onClick={() => navigate('/explorer')} className="btn rounded-full bg-accent-secondary px-4 py-2 text-xs text-white hover:bg-accent-secondary-hover">
                Explore members
              </button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
