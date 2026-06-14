import { useState } from "react";
import type { SimState } from "@sim/lib/sim";
import { fmtPct, fmtUSD } from "@sim/lib/sim";
import { ChevronDown, Database, LineChart, ShieldCheck, Sparkles, Users, WalletCards } from "lucide-react";

const STEPS = [
  { id: "data", title: "Where the data comes from", icon: Users },
  { id: "reward", title: "How we set the reward", icon: WalletCards },
  { id: "behaviour", title: "How behaviour change is derived", icon: Sparkles },
  { id: "claims", title: "How claims reduction is derived", icon: LineChart },
  { id: "value", title: "How value is calculated", icon: Database },
  { id: "trust", title: "Why you can trust it", icon: ShieldCheck },
] as const;

export default function MethodologyWalkthrough({ state }: { state: SimState }) {
  const [idx, setIdx] = useState(0);
  const [open, setOpen] = useState(true);
  const step = STEPS[idx];
  const Icon = step.icon;
  return (
    <section className="rounded-xl border border-card-border bg-card/45 p-4" data-testid="tab-methodology">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="font-mono text-xs uppercase tracking-[0.16em] text-foreground">Methodology walkthrough</div>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight">How the simulator builds the answer</h2>
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            Click through the chain from synthetic cohort to reward response, behaviour change, claims bridge, value and governance.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIdx((i) => Math.min(STEPS.length - 1, i + 1))}
          className="rounded-lg border border-primary/35 bg-primary/10 px-3 py-2 font-mono text-xs font-semibold text-primary hover-elevate"
          data-testid="button-methodology-next"
        >
          Next step
        </button>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2 lg:grid-cols-6">
        {STEPS.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setIdx(i)}
            className={`rounded-lg border p-2.5 text-left transition-colors ${i === idx ? "border-primary/50 bg-primary/10 text-primary" : i < idx ? "border-primary/25 bg-primary/5 text-foreground/80" : "border-card-border bg-background/35 text-muted-foreground"}`}
          >
            <div className="font-mono text-[0.62rem]">{String(i + 1).padStart(2, "0")}</div>
            <div className="mt-1 text-xs font-semibold">{s.title}</div>
          </button>
        ))}
      </div>

      <Flow active={idx} />

      <article className="mt-4 rounded-xl border border-primary/25 bg-background/45 p-4">
        <div className="mb-2 flex items-center gap-2 font-mono text-sm font-semibold">
          <Icon className="h-4 w-4 text-primary" /> {step.title}
        </div>
        <PlainStep idx={idx} state={state} />
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="mt-4 flex w-full items-center justify-between rounded-lg border border-card-border bg-card/45 px-3 py-2 font-mono text-xs text-muted-foreground hover:text-foreground"
        >
          Show the maths and sources
          <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
        {open && <MathStep idx={idx} state={state} />}
      </article>
    </section>
  );
}

function Flow({ active }: { active: number }) {
  const labels = ["Personas", "Reward", "Behaviour", "Claims", "Value", "Trust"];
  return (
    <div className="grid grid-cols-1 gap-2 md:grid-cols-6">
      {labels.map((l, i) => (
        <div key={l} className={`rounded-lg border p-3 ${i === active ? "border-primary/50 bg-primary/10" : "border-card-border bg-background/35"}`}>
          <div className="font-mono text-[0.62rem] uppercase tracking-wide text-muted-foreground">Step {i + 1}</div>
          <div className={`mt-1 font-mono text-sm ${i === active ? "text-foreground" : "text-foreground/75"}`}>{l}</div>
        </div>
      ))}
    </div>
  );
}

// Every step is told the same way: one plain truth to start from, a short
// chain of questions that build the answer, and where it lands in this run.
interface ChainContent {
  intro: string;
  steps: { q: string; a: string }[];
  close: string;
}

function PlainStep({ idx, state }: { idx: number; state: SimState }) {
  const reward = state.plan?.incentiveDesign?.rewardPmpm ?? state.plan?.assumedOfferPmpm ?? 0;
  const changed = state.finance?.behaviorChange.p50 ?? state.calibratedBehavior?.behaviorChangeRate ?? 0;
  const members = state.finance?.behaviorChangeMembers.p50 ?? 0;
  const claims = state.finance?.claimsSavingsP50 ?? 0;
  const net = state.finance?.netValueP50 ?? 0;
  const b = state.finance?.claimsBreakdown;
  const cal = state.calibration;
  const marketLabel = state.plan?.marketLabel ?? "the selected market";
  const iterations = state.finance?.iterations ?? 0;

  const personas: ChainContent = {
    intro: `You cannot survey members about a programme that does not exist yet — so we build a synthetic copy of the book and let it answer. The test of each synthetic member is simple: would an underwriter recognise them? We build ${
      state.agents.length ? `each of the ${state.agents.length} agents in this run` : "each agent"
    } by answering five questions a real file would answer:`,
    steps: [
      {
        q: "How old are they, and what is their risk?",
        a: `Age, sex and baseline mortality follow real insured-lives experience for ${marketLabel} (the ASHK HKA22 study: 13 insurers, over 60 million life-years) — so the synthetic book ages, claims and dies like a real one.`,
      },
      {
        q: "Where do they live?",
        a: "Districts are drawn with their actual population weights, then matched to what each member's job realistically pays — the senior surgeon does not end up in a subdivided flat, and rarely the other way round.",
      },
      {
        q: "What do they do all day?",
        a: "Occupations carry their real-world sex and activity skews. A ward nurse is on her feet all shift; an analyst sits — so their baseline step counts differ before any programme exists, which decides who even has room to improve.",
      },
      {
        q: "Can they even take part?",
        a: "Wearable ownership comes from published market surveys (roughly 36% in Hong Kong, 30% in Singapore — Rakuten Insight / Statista), adjusted by income. No device, no verified rewards.",
      },
      {
        q: "What is their health story?",
        a: "Health histories are age- and sex-gated so nobody is implausible — no 25-year-old on long-term statins, no man with gestational diabetes. Risk concentrates where it really does: older, more sedentary, more financially stretched members.",
      },
    ],
    close:
      "The result is a cohort that behaves like the book without containing anyone from it — representative of everyone, identifiable as no one.",
  };

  const rewardChain: ChainContent = {
    intro: `Everything downstream responds to one chosen input: the reward. Three questions pin down what it really costs:`,
    steps: [
      {
        q: "What is on the table?",
        a: `${fmtUSD(reward, false)} per member per month in this run, paid as Health Points for hitting the verified behaviour target.`,
      },
      {
        q: "What does it actually cost?",
        a: "Less than face value. Loyalty accounting (IFRS 15) shows only 67–69% of points are ever redeemed — unclaimed points cost the insurer nothing, so a dollar of rewards books below a dollar.",
      },
      {
        q: "Is this the right level?",
        a: "More money buys more engagement, but with diminishing returns — trials find responses saturating around US$1–1.5 per day. The reward lever sweeps the whole curve, so this level is always compared against cheaper and richer offers.",
      },
    ],
    close: "The reward is the model's main dial: every result on the simulation page is conditional on this choice, and changes live when it moves.",
  };

  const behaviour: ChainContent = {
    intro: `The hardest question in the model: how many people genuinely change behaviour for the money? Nobody can know this exactly in advance, so we ask two imperfect witnesses and let each correct the other:`,
    steps: [
      {
        q: "What do these specific members say?",
        a: "Each synthetic member is role-played live by an AI agent that decides from that person's job, family, health and finances — the night-shift nurse answers differently from the gadget-loving analyst. This captures what is specific about this book and this offer.",
      },
      {
        q: "What did real programmes actually achieve?",
        a: "Published results for verified-device reward programmes: enrolment of 44–47% (UnitedHealthcare Motion, Vitality Apple Watch, Carrot Rewards), 12-month persistence from the Singapore TRIPPA randomised trial and National Steps Challenge, and step-lift of roughly +1,368 steps/day from loss-framed incentive RCTs.",
      },
      {
        q: "Who wins when they disagree?",
        a: `Neither, automatically. The two are blended by statistical confidence${
          cal ? ` — in this run the literature carried a weight of ${(cal.shrinkage ?? 0).toFixed(2)}` : ""
        }: a large, consistent agent sample moves the answer; a small or noisy one gets held near what real programmes achieved. Material disagreements are flagged, not hidden.`,
      },
    ],
    close: `Where it lands here: about ${fmtPct(changed)} of the book meaningfully changes behaviour — roughly ${Math.round(members).toLocaleString()} members.`,
  };

  const claimsChain: ChainContent = {
    intro:
      "Start from the one thing nobody disputes: healthier members make fewer and smaller claims. The honest question is how much of that an incentive programme can take credit for. We get there by asking five questions in a row — each one shrinks the number:",
    steps: [
      {
        q: "Who actually changed?",
        a: `Not everyone who enrolled — only members who genuinely moved their behaviour count${
          b?.effectiveTreated ? `, about ${Math.round(b.effectiveTreated).toLocaleString()} members in this run` : ""
        }. People who tried for a while and faded get partial credit that fades with them.`,
      },
      {
        q: "Can it change what the insurer pays?",
        a: `More activity only reduces claims for people whose health risks respond to it — the member with rising blood pressure, not the one who already runs 10Ks. That applies to ${
          b?.applicablePrevalence ? `about ${fmtPct(b.applicablePrevalence)} of` : "only part of"
        } the book; for everyone else it is good for them but free for the insurer.`,
      },
      {
        q: "How much cheaper is a healthier year?",
        a: `Studies of real insured books measure the gap: a member who is healthier on this signal costs ${
          b?.annualClaimsDeltaPerTreated ? `about ${fmtUSD(b.annualClaimsDeltaPerTreated, false)}` : "a few hundred dollars"
        } less in claims per year than one who is not.`,
      },
      {
        q: "Did the programme cause it?",
        a: `Mostly, no — healthy people were already healthy before they joined, so most of that gap was always going to be there. The strictest randomised trials (Illinois Workplace Wellness; Song & Baicker, JAMA) prove this. So we keep only ${
          b?.attributionFactor ? fmtPct(b.attributionFactor) : "a fraction"
        } of the gap as genuinely caused by the programme.`,
      },
      {
        q: "How much of the goal did they hit?",
        a: `Someone who got halfway to the target gets halfway credit${
          b?.doseAchievement ? ` — this run's average achievement is ${fmtPct(b.doseAchievement)}` : ""
        }. Savings that arrive in future years are also discounted back to today's dollars.`,
      },
    ],
    close: `Multiply those five together and you get the claims savings${
      state.finance ? ` — ${fmtUSD(claims)} in this run` : ""
    }. Built this way the figure is deliberately a floor, not a ceiling: every step takes credit away unless the evidence says otherwise.`,
  };

  const value: ChainContent = {
    intro:
      "A member who genuinely changes behaviour is worth more to the insurer in three distinct ways. Each is counted once, costed honestly, and never double-counted:",
    steps: [
      {
        q: "They claim less.",
        a: `The claims savings from the previous step${state.finance ? ` — ${fmtUSD(claims)} here` : ""}. Members who keep the habit earn ${
          b?.persistedSavingsYears ? `${b.persistedSavingsYears} years` : "multiple years"
        } of savings (sustained health improvements show cost effects over years 1–4); those who fade get credit that decays the way incentive trials say it does.`,
      },
      {
        q: "They stay longer.",
        a: `A member who interacts with their insurer weekly — and is earning rewards — is less likely to lapse the policy. Each retained member keeps future profit that would otherwise walk out the door${
          b?.retentionValue ? `; worth ${fmtUSD(b.retentionValue)} in this run` : ""
        }.`,
      },
      {
        q: "They live longer.",
        a: `For a life book, later deaths mean later payouts. Each extra 1,000 daily steps maps to roughly 9% lower all-cause mortality (Paluch 2022, Lancet — 15 cohorts), but we credit only a conservative share as caused by the programme${
          b?.mortalityValue ? `; worth ${fmtUSD(b.mortalityValue)} here` : ""
        }.`,
      },
      {
        q: "What did it cost to get?",
        a: `Now subtract everything: the rewards themselves (at their real, post-breakage cost), administration, and platform fees${
          b?.totalCost ? ` — ${fmtUSD(b.totalCost)} all-in for this run` : ""
        }. No cost is buried.`,
      },
      {
        q: "How sure are we?",
        a: `Not very — and the model says so. Every uncertain input is drawn ${
          iterations ? iterations.toLocaleString() : "thousands of"
        } times and the whole calculation re-run, producing a range (P5 to P95) instead of a single confident number. The downside scenario is shown, not hidden.`,
      },
    ],
    close: `Add the three value streams, subtract the full cost: net value of ${fmtUSD(net)} at the median in this run. If the reward is too rich for the behaviour it buys, this number goes negative — and the simulator will say so.`,
  };

  const trust: ChainContent = {
    intro:
      "The model is built to survive an actuary's review, not to flatter the result. Four questions any reviewer would ask — and how it answers:",
    steps: [
      {
        q: "Is the evidence strong enough to book value?",
        a: "Every pathway is gated by its evidence tier: Proven pathways earn full credit, Emerging ones are haircut, Experimental signals earn engagement value only — enthusiasm is not a valuation basis.",
      },
      {
        q: "What if the agents and the trials disagree?",
        a: `Disagreement is flagged, not averaged away${
          cal?.divergenceFindings?.length
            ? ` — ${cal.divergenceFindings.length} divergence flag${cal.divergenceFindings.length === 1 ? "" : "s"} raised in this run`
            : ""
        }. A reviewer sees where the synthetic members departed from published experience and can judge which to trust.`,
      },
      {
        q: "Could anyone reproduce this?",
        a: "Yes — a fixed random seed, versioned model modules and a versioned assumption set are stamped on every run, so the same inputs always give the same answer.",
      },
      {
        q: "Where did each number come from?",
        a: "Every anchor and assumption carries its source — a study, a regulator dataset, or a disclosed judgement call. Nothing in the result is untraceable.",
      },
    ],
    close: "Open the maths below on any step: the same numbers, with their formulas and citations.",
  };

  const chains: ChainContent[] = [personas, rewardChain, behaviour, claimsChain, value, trust];
  return <PrincipleChain content={chains[idx]} />;
}

function PrincipleChain({ content }: { content: ChainContent }) {
  return (
    <div className="max-w-4xl">
      <p className="text-base leading-relaxed text-foreground/85">{content.intro}</p>
      <ol className="mt-3 space-y-2">
        {content.steps.map((s, i) => (
          <li key={i} className="flex gap-3 rounded-lg border border-card-border/60 bg-card/30 px-3 py-2.5">
            <span className="font-mono text-xs font-semibold text-foreground">{i + 1}</span>
            <span className="text-sm leading-relaxed text-foreground/85">
              <span className="font-semibold text-foreground">{s.q}</span> {s.a}
            </span>
          </li>
        ))}
      </ol>
      <p className="mt-3 text-base leading-relaxed text-foreground/85">{content.close}</p>
    </div>
  );
}

function MathStep({ idx, state }: { idx: number; state: SimState }) {
  const b = state.finance?.claimsBreakdown;
  const calibration = state.calibration;
  const methodology = state.methodology;
  const primarySignal = state.plan?.primarySignal;
  const primaryDose =
    methodology?.doseResponse?.find((d) => d.campaign === state.plan?.campaign) ?? methodology?.doseResponse?.[0];
  const anchorRows: [string, string][] = (calibration?.anchors ?? []).slice(0, 4).map((a) => {
    const isProportion = a.anchorHigh <= 1;
    const fmt = (v: number) => (isProportion ? fmtPct(v) : `+${Math.round(v).toLocaleString()} steps/day`);
    return [
      `Anchor · ${a.metric}`,
      `${fmt(a.anchorLow)}–${fmt(a.anchorHigh)} band; agents said ${fmt(a.rawValue)}, calibrated to ${fmt(a.calibratedValue)}. ${a.source}`,
    ];
  });
  const rows: [string, string][] =
    idx === 0
      ? [
          ["Synthetic sample", `${state.agents.length} member-agents from ${state.populationTotal.toLocaleString()} book members`],
          ["Mortality & age structure", "ASHK HKA22 insured-lives study (13 HK insurers, >60M life-years, 2014–21); segment mortality per 1,000 carried on each agent."],
          ["Districts & occupations", "Residential districts weighted by population and matched to occupation income band; jobs carry real-world sex, age and activity skews that set baseline step counts."],
          ["Wearable priors", "HK ~36%, SG ~30% smartwatch/wearable ownership (Rakuten Insight / Statista market surveys), adjusted by income band."],
          ["Signals", state.plan?.signalDefinitions?.map((s) => `${s.displayName} (${s.evidenceTier})`).join(", ") ?? "Pending"],
          ["Privacy posture", "Representative synthetic profile; enterprise identity remains anonymous."],
        ]
      : idx === 1
      ? [
          ["Reward input", `${fmtUSD(state.plan?.incentiveDesign?.rewardPmpm ?? state.plan?.assumedOfferPmpm ?? 0, false)} PMPM`],
          ["Reward cost ratio", b?.rewardCostRatio != null ? `${fmtPct(b.rewardCostRatio)} of face value — IFRS 15 loyalty-programme redemption runs 67–69%, so unredeemed points cost nothing.` : "Pending"],
          ["Optimiser", "Reward curve is still available through reward_optimization; UI lets presenter explore off the optimum."],
          ["Health Points", "HP = USD × 100"],
        ]
      : idx === 2
      ? [
          ["Method", calibration?.method ?? "Pending"],
          ["Reference class", calibration?.referenceClass ?? "Pending"],
          ["Literature weight", `w = ${(calibration?.shrinkage ?? 0).toFixed(2)} (precision-weighted; rises when the agent sample is small or noisy)`],
          ...anchorRows,
          ...(calibration?.divergenceFindings?.length
            ? ([["Divergence flags", calibration.divergenceFindings.join(" · ")]] as [string, string][])
            : []),
        ]
      : idx === 3
      ? [
          ["Formula", "effective treated × prevalence × annual claims delta × attribution × dose × PV factor"],
          ["Annual claims delta", primaryDose ? `${fmtUSD(primaryDose.effectP50, false)}/yr (CI ${fmtUSD(primaryDose.effectCI[0], false)}–${fmtUSD(primaryDose.effectCI[1], false)}) — ${primaryDose.source}` : "Pending"],
          ["Attribution haircut", b ? `${fmtPct(b.attributionFactor ?? 0, 1)} — calibrated down to RCT reality (Illinois Workplace Wellness, QJE 2019; Song & Baicker, JAMA 2019: causal claims effects far below cohort gradients).` : "Pending"],
          ["Claims bridge source", b?.claimsBridgeSource ?? methodology?.doseResponse?.[0]?.source ?? "Pending"],
        ]
      : idx === 4
      ? [
          ["Gross value", "claims saved + retention value + mortality margin"],
          ["Mortality margin source", b?.mortalityDetail?.source ?? "Paluch 2022 (Lancet Public Health): HR ≈0.91 per +1,000 steps/day, 15-cohort meta-analysis; only a conservative causal share credited."],
          ["Multi-year savings", b?.persistedSavingsYears ? `Persisting members credited ${b.persistedSavingsYears} years of savings (Wagner 2001, JAMA: sustained HbA1c improvement shows cost effects in years 1–4); faders get decaying part-credit (Mantzari 2015 meta-analysis).` : "Pending"],
          ["Net value", "gross value − reward − admin − platform"],
          ["ROI", "net value / total all-in cost; shown as P5/P50/P95 Monte Carlo band"],
        ]
      : [
          ["Evidence gates", "Proven full value; Emerging haircut; Experimental engagement-only."],
          ["Fusion", state.plan?.fusionDefinition ? `${state.plan.fusionDefinition.displayName}: ${state.plan.fusionDefinition.components.map((c) => `${c.signalId} ${(c.weight * 100).toFixed(0)}%`).join(", ")}` : "No fusion selected"],
          ["Model modules", methodology?.modelModules?.map((m) => `${m.moduleName}@${m.moduleVersion}`).join(", ") ?? "Pending"],
          ["Assumption set", methodology?.selectedLifeAssumptionSet ? `${methodology.selectedLifeAssumptionSet.name} (${methodology.selectedLifeAssumptionSet.source})` : "Pending"],
          ["Reproducibility", methodology?.seed != null ? `Seed ${methodology.seed}; ${methodology.monteCarloIterations.toLocaleString()} Monte Carlo iterations; run mode ${methodology.runMode ?? "—"}.` : "Pending"],
        ];
  return (
    <div className="mt-3 rounded-lg border border-card-border bg-card/35 p-3">
      {rows.map(([k, v]) => (
        <div key={k} className="grid grid-cols-1 gap-1 border-b border-card-border/70 py-2 last:border-0 md:grid-cols-[220px_1fr]">
          <div className="font-mono text-xs text-muted-foreground">{k}</div>
          <div className="text-sm leading-relaxed text-foreground/85">{v}</div>
        </div>
      ))}
    </div>
  );
}

