import { BookOpenCheck, ExternalLink, FlaskConical, Scale, ShieldAlert, TrendingDown } from "lucide-react";

// Static research report (evidence pass, June 2026). This tab is the
// click-through version of EVIDENCE_DOSSIER.md: every replaced constant in
// the healthid-life-v1-evidence assumption set, with its source and the
// honest counter-evidence. Content is deliberately hard-coded — it documents
// a specific research pass, not live state.

type Conf = "High" | "Med-high" | "Medium" | "Low-med" | "Low";

interface EvidenceRow {
  parameter: string;
  v0: string;
  v1: string;
  evidence: string;
  sources: { label: string; href: string }[];
  confidence: Conf;
}

const CLAIMS_ROWS: EvidenceRow[] = [
  {
    parameter: "Steps claims delta",
    v0: "$840/yr per treated member",
    v1: "$120/yr (CI 50–280) ≈ 6–8% of local claims base",
    evidence:
      "Discovery insured book, longitudinal n=304k: became-active −6% hospital costs, always-active −16%. Japanese fixed-effects panel: ¥16–28 per daily step per year. Carlson gradient ($1,313/yr, US) kept only as ceiling.",
    sources: [
      { label: "Patel 2011 AJHP", href: "https://pubmed.ncbi.nlm.nih.gov/21534837/" },
      { label: "Sci Rep 2021 (Japan)", href: "https://www.nature.com/articles/s41598-021-94553-2" },
      { label: "Carlson 2015", href: "https://pmc.ncbi.nlm.nih.gov/articles/PMC4604440/" },
    ],
    confidence: "Medium",
  },
  {
    parameter: "VO2max claims delta",
    v0: "$1,100/yr",
    v1: "$90/yr (CI 40–180) ≈ 5–6% of claims per MET gained",
    evidence:
      "VETS (n=9,942): ~5.6% lower cost per MET; Cooper Center (n=19,571): ~6.7%/MET. The relative effect imports; the absolute US-Medicare dollars (~$1,600/MET) do not — v0 was ~10× too high for an HK/SG book. Overlaps the steps pathway; not additive.",
    sources: [
      { label: "Myers 2018 VETS", href: "https://pubmed.ncbi.nlm.nih.gov/29195922/" },
      { label: "Bachmann 2015 JACC", href: "https://www.jacc.org/doi/10.1016/j.jacc.2015.08.030" },
    ],
    confidence: "Medium",
  },
  {
    parameter: "Sleep claims delta",
    v0: "$400/yr @ 32% prevalence",
    v1: "$200/yr (CI 80–350) @ 12% prevalence",
    evidence:
      "No direct sleep-regularity cost literature exists — mapped via the insomnia excess-cost gradient (~$2,300–2,500/yr US) at a 10–20% recoverable fraction. v0 double-counted: broad prevalence (any poor sleep) × the full clinical-insomnia delta.",
    sources: [
      { label: "Ozminkowski 2007", href: "https://pubmed.ncbi.nlm.nih.gov/17425222/" },
      { label: "Wickwire 2019", href: "https://pmc.ncbi.nlm.nih.gov/articles/PMC6448286/" },
    ],
    confidence: "Low",
  },
  {
    parameter: "BP claims delta",
    v0: "$390/yr",
    v1: "$60/yr (CI 0–150) on a 3-yr window",
    evidence:
      "The literature is unambiguous: BP control is cost-EFFECTIVE, not cost-saving, inside 1–3 years. SMBP review: median −$148 to +$3/person-yr. SPRINT intensive control: +$12,796 lifetime cost at $28–47k/QALY. Payback sits 5–15 years out — beyond typical policy persistency.",
    sources: [
      { label: "CDC Community Guide SMBP", href: "https://pmc.ncbi.nlm.nih.gov/articles/PMC5657494/" },
      { label: "Bress 2017 NEJM (SPRINT CEA)", href: "https://pmc.ncbi.nlm.nih.gov/articles/PMC5708850/" },
    ],
    confidence: "High",
  },
  {
    parameter: "HbA1c claims delta",
    v0: "$429/yr @ 11% prevalence",
    v1: "$400/yr (CI 250–750) @ 5% prevalence",
    evidence:
      "Best-evidenced pathway in the model: three independent designs triangulate $400–950/yr per sustained 1% HbA1c drop. But savings concentrate in baseline HbA1c ≥10%, so applicable prevalence is poorly-controlled diabetics (~5%), not all diabetics (~11%).",
    sources: [
      { label: "Wagner 2001 JAMA", href: "https://pubmed.ncbi.nlm.nih.gov/11176811/" },
      { label: "CMRO 2020", href: "https://www.tandfonline.com/doi/full/10.1080/03007995.2020.1787971" },
      { label: "Juarez 2013", href: "https://pubmed.ncbi.nlm.nih.gov/24379909/" },
    ],
    confidence: "High",
  },
  {
    parameter: "Attribution factor",
    v0: "0.6",
    v1: "0.3 (range 0.15–0.5)",
    evidence:
      "The two best RCTs in the field found ZERO causal claims effect from programme offers at 18–30 months; pre-programme spending of participants was already lower (selection). Verified-dose designs justify keeping some credit, but 0.6 is indefensible in front of an actuary.",
    sources: [
      { label: "Jones/Molitor/Reif QJE 2019", href: "https://clear.dol.gov/Study/What-do-workplace-wellness-programs-do-Evidence-Illinois-workplace-wellness-study-Jones" },
      { label: "Song & Baicker JAMA 2019", href: "https://jamanetwork.com/journals/jama/fullarticle/2730614" },
      { label: "Baxter 2014 (ROI negative in RCTs)", href: "https://pubmed.ncbi.nlm.nih.gov/24977496/" },
    ],
    confidence: "High",
  },
  {
    parameter: "Risk tiers / claims base",
    v0: "55/30/15% @ $650/$1.8k/$6.5k (mean $1,872)",
    v1: "80/15/5% @ $300/$1.5k/$9k (mean ≈ $915)",
    evidence:
      "Published concentration: top ~5% of members drive ~50% of claims. Local base: HK group claims ≈ US$750–1,250/member/yr (IA premium index × 58–64% loss ratios); SG Integrated Shield claims S$548/life. v0 was both under-concentrated and over-rich.",
    sources: [
      { label: "KFF concentration", href: "https://www.kff.org/health-costs/health-policy-101-health-care-costs-and-affordability/" },
      { label: "SAS Nov 2024 (SG)", href: "https://www.actuaries.org.sg/sites/default/files/2024-11/SAS%20Discussion%20Paper%20Medical%20Insurance%20Premiums%20Nov24%20Final.pdf" },
      { label: "MMB Health Trends", href: "https://www.mercer.com/en-hk/insights/total-rewards/employee-benefits-optimization/mmb-health-trends/" },
    ],
    confidence: "Med-high",
  },
  {
    parameter: "Group productivity",
    v0: "$300/yr × 0.6 attribution",
    v1: "$250/yr × 0.4 attribution",
    evidence:
      "Valued via causal absence days (1–2 days/yr × HK median wage), not survey presenteeism. The famous 67–77 lost-days-per-year figures are self-reported WPAI surveys — context, never monetised. RCTs found no absenteeism effect, hence the deeper haircut.",
    sources: [
      { label: "Loeppke 2009 JOEM", href: "https://pubmed.ncbi.nlm.nih.gov/19339899/" },
      { label: "AIA Healthiest Workplace", href: "https://healthiestworkplace.aia.com/regional/eng/" },
    ],
    confidence: "Medium",
  },
];

const BEHAVIOUR_ROWS: EvidenceRow[] = [
  {
    parameter: "Enrollment band (verified rewards)",
    v0: "35–55% (one band)",
    v1: "35–50% sponsored group channel; 12–30% retail book",
    evidence:
      "UHC Motion >45%, US Vitality Apple Watch 47%, Carrot 44% — all sponsored/group. Retail reality: SA Apple Watch uptake 14%, Discovery Active Rewards ~20% of members, and only ~60% of registrants ever transmit data (registered ≠ active).",
    sources: [
      { label: "RAND RR-2870", href: "https://www.rand.org/pubs/research_reports/RR2870.html" },
      { label: "Carrot Rewards JMIR", href: "https://pmc.ncbi.nlm.nih.gov/articles/PMC6231836/" },
      { label: "NSC3 JAHA 2022", href: "https://www.ahajournals.org/doi/10.1161/JAHA.121.022508" },
    ],
    confidence: "Medium",
  },
  {
    parameter: "12-month persistence",
    v0: "40–60%",
    v1: "25–45% (anchor lowered); 45–60% only for loss-framed device financing",
    evidence:
      "The two best Singapore datasets contradict the old band: TRIPPA RCT — only ~10% still wearing trackers at 12 months; National Steps Challenge — median 74 of 223 engaged days, <33% active at season end. Loss-framed Apple Watch designs (RAND, 400k+) hold the upper end for 24 months.",
    sources: [
      { label: "TRIPPA Lancet D&E 2016", href: "https://pubmed.ncbi.nlm.nih.gov/27717766/" },
      { label: "NSC3 JAHA 2022", href: "https://pmc.ncbi.nlm.nih.gov/articles/PMC9238668/" },
      { label: "RAND/Vitality", href: "https://pmc.ncbi.nlm.nih.gov/articles/PMC7371354/" },
    ],
    confidence: "Med-high",
  },
  {
    parameter: "Intrinsic motivation & companion effect",
    v0: "Implicit only (hidden in agent traits)",
    v1: "Measured empirically: the $0 reward arm of the synthetic RCT",
    evidence:
      "People engage for their own health, not only for money. Runs of 200+ agents now randomize a $0 arm — engagement there is pure intrinsic motivation plus the AI-companion experience (coaching, insights), observed rather than assumed. STEP UP (RCT, n=602) shows behaviourally designed engagement (no cash) significantly lifts activity, with the competition arm sustaining post-intervention — programme design quality is real value on top of the reward. No hidden multiplier is applied, so this cannot double-count with the reward effect.",
    sources: [
      { label: "STEP UP JAMA IM 2019", href: "https://pubmed.ncbi.nlm.nih.gov/31498375/" },
      { label: "TRIPPA tracker-only arm", href: "https://pubmed.ncbi.nlm.nih.gov/27717766/" },
    ],
    confidence: "Medium",
  },
  {
    parameter: "Reward-response saturation",
    v0: "Invented floor/cap, 1 anchor point",
    v1: "Saturation ≈ $1–1.5/day ($30–45 PMPM); loss-framing ×~2.7",
    evidence:
      "Real multi-point dose-response now exists (table below). Effects rise steeply from tiny rewards, then flatten: paying beyond ~$1.5/day buys almost nothing for gain-framed cash. Framing beats magnitude — loss-framed deposits produced 2.7× the gain-framed effect at identical expected value.",
    sources: [
      { label: "Mitchell 2019 BJSM", href: "https://pubmed.ncbi.nlm.nih.gov/31092399/" },
      { label: "Patel 2016 Ann Intern Med", href: "https://pmc.ncbi.nlm.nih.gov/articles/PMC6029433/" },
      { label: "2025 meta-update", href: "https://pubmed.ncbi.nlm.nih.gov/39870214/" },
    ],
    confidence: "Medium",
  },
  {
    parameter: "Incentive decay",
    v0: "Absent (faders got 40% part-credit, unsourced)",
    v1: "Lose ~60% of lift by 3mo post-reward, ~85% by 6mo — part-credit now cited",
    evidence:
      "Meta-analytic: incentive effects on habitual behaviours dissipate within ~3 months of removal. TRIPPA's cash-arm effect fully eroded 6 months post-incentive. Charity framing, commitment contracts and device ownership retain 50–88% — design levers, not free habit formation.",
    sources: [
      { label: "Mantzari 2015", href: "https://pubmed.ncbi.nlm.nih.gov/25843244/" },
      { label: "Royer 2015 AEJ", href: "https://www.aeaweb.org/articles?id=10.1257/app.20130327" },
    ],
    confidence: "Med-high",
  },
  {
    parameter: "Wearable ownership priors",
    v0: "HK 21% · SG 27%",
    v1: "HK 36% · SG 30% (the only numbers that went UP)",
    evidence:
      "Rakuten Insight / Statista 2022: HK ~42% smartwatch (~64% own some wearable); SG ~27% smartwatch (~45–69% any wearable). Market-panel data, online-respondent skew — graded low-medium.",
    sources: [
      { label: "Statista HK", href: "https://www.statista.com/statistics/1058302/hong-kong-ownership-of-wearable-tech/" },
      { label: "Statista SG", href: "https://www.statista.com/statistics/1053344/singapore-ownership-of-wearable-tech/" },
    ],
    confidence: "Low-med",
  },
];

const ACTUARIAL_ROWS: EvidenceRow[] = [
  {
    parameter: "Lapse reduction (engaged)",
    v0: "2.0pp absolute",
    v1: "1.0pp central (0.5–2.0pp)",
    evidence:
      "Programme-level evidence (RGA): Discovery lowered life lapse ~15% relative on a ~5–6%/yr base. The famous '50–67% lower lapse' compares Gold/Diamond vs non-engaged tiers — people who log gym visits were never going to lapse; that is selection, not programme effect.",
    sources: [
      { label: "RGA wellness review", href: "https://www.rgare.com/knowledge-center/article/the-case-for-wellness-programs-in-life-and-health-insurance" },
      { label: "SOA/LIMRA lapse study", href: "https://www.soa.org/resources/experience-studies/2024/15-22-twlls/" },
    ],
    confidence: "Medium",
  },
  {
    parameter: "Member lifetime value",
    v0: "$2,600",
    v1: "$1,400 central ($900–1,800); $2,600 only as cross-sell-rich high case",
    evidence:
      "AIA FY2024: VONB margin 54.5% on ANP — a protection policy at realistic HK/SG premiums implies ~$550–1,000 base LTV, lifted to ~$1,500–2,500 by the 80% higher repurchase rate among engaged members.",
    sources: [
      { label: "AIA FY2024 results", href: "https://www.aia.com/en/media-centre/press-releases/2025/aia-group-press-release-20250314" },
    ],
    confidence: "Medium",
  },
  {
    parameter: "Baseline mortality",
    v0: "0.0028/yr",
    v1: "0.0015/yr (0.0008–0.0020)",
    evidence:
      "ASHK HKA22 study — 13 insurers, 94% market coverage, >60M life-years, ~105k claims: crude HK insured-lives mortality ≈ 1.75 per 1,000. Regulator-grade. v0 implied an older or substandard book.",
    sources: [
      { label: "ASHK HKA22", href: "https://www.actuaries.org.hk/storage/download/HKA22%20Report%20(final%2021%20Aug%202025).pdf" },
    ],
    confidence: "High",
  },
  {
    parameter: "Sum assured / premium",
    v0: "$150k / $1,800",
    v1: "$95k / $1,500 (blended protection + rider, labelled)",
    evidence:
      "HK IA Table L2 2024: average in-force sum assured ≈ HK$659k ≈ US$84.5k. LIA Protection Gap 2022: ~S$110k per policy (S$331k per insured life across ~3 policies). Pure term premium ≈ US$770/yr; the v1 figure is an explicit blend.",
    sources: [
      { label: "HK IA statistics", href: "https://www.ia.org.hk/en/infocenter/statistics/market_5_2024.html" },
      { label: "LIA Protection Gap 2022", href: "https://www.lia.org.sg/media/3974/lia-pgs-2022-report_final_8-sep-2023.pdf" },
    ],
    confidence: "High",
  },
  {
    parameter: "Mortality differential (engaged)",
    v0: "implicit, vendor-grade",
    v1: "Causal credit 10–25% (⅓–½ of the published 42–76% raw differentials)",
    evidence:
      "Discovery/John Hancock publish 42–76% lower mortality for top engagement tiers — heavily selection-confounded ('13–21 years longer' is marketing). Reinsurer programme-level numbers run ~¼–⅓ of tier differentials; that ratio is the market's own implied causal haircut.",
    sources: [
      { label: "RGA quantified health", href: "https://www.rgare.com/knowledge-center/article/quantifying-quantified-health" },
      { label: "Hannover Re wellness", href: "https://www.hannover-re.com/en/life-and-health/inspire/product-and-pricing-case-studies/wellness-solutions-evolving-insurance-for-a-healthier-future/" },
    ],
    confidence: "Low-med",
  },
  {
    parameter: "Mortality margin (headline chain)",
    v0: "not in headline chain",
    v1: "9% relative mortality reduction per +1,000 achieved steps/day, capped at 20%, × 0.3 attribution × sum assured",
    evidence:
      "Paluch 2022 Lancet Public Health pooled meta-analysis (15 cohorts, n=47,471): HR ≈ 0.91 per +1,000 steps/day. The simulator credits only the ACHIEVED step lift, caps total relative reduction at 20%, and applies the same 0.3 causal haircut as the claims bridge before multiplying by ASHK baseline mortality and HK IA average sum assured.",
    sources: [
      { label: "Paluch 2022", href: "https://doi.org/10.1016/S2468-2667(21)00302-9" },
      { label: "ASHK HKA22", href: "https://www.actuaries.org.hk/storage/download/HKA22%20Report%20(final%2021%20Aug%202025).pdf" },
    ],
    confidence: "Medium",
  },
  {
    parameter: "Reward cost ratio (breakage)",
    v0: "100% of face value",
    v1: "70% of face value for points/voucher rewards; 100% for pure cash",
    evidence:
      "Loyalty-programme redemption runs at ~67–69% (31–33% breakage); IFRS 15 requires booking reward liabilities at expected redemption, not face value. Partner co-funding (Discovery Vitality model) would lower this further but is NOT credited.",
    sources: [
      { label: "IFRS 15", href: "https://www.ifrs.org/issued-standards/list-of-standards/ifrs-15-revenue-from-contracts-with-customers/" },
    ],
    confidence: "Medium",
  },
  {
    parameter: "Persisting-member savings window",
    v0: "1 year for everyone",
    v1: "3 years for persisting members (PV-discounted); faders stay at 1 year",
    evidence:
      "Wagner 2001 JAMA: sustained ≥1% HbA1c improvement was followed by $685–950/yr lower costs in years 1–4 — sustained behaviour change pays over multiple years, not one. Faders keep the 1-year window per Mantzari 2015 decay evidence.",
    sources: [
      { label: "Wagner 2001 JAMA", href: "https://pubmed.ncbi.nlm.nih.gov/11176811/" },
    ],
    confidence: "Medium",
  },
  {
    parameter: "High-risk targeting",
    v0: "whole-book blanket offer only",
    v1: "optional lever: offer only the high-/moderate-risk tiers (~20% of book), tier mix renormalized",
    evidence:
      "Claims concentration (KFF/MEPS: top 5% ≈ 50% of spend) means value per treated member is ~2.5× higher in the non-low tiers, while reward cost shrinks to the targeted pool. This is the difference between the RCT-consistent negative ROI of blanket cash-for-steps and a defensible positive case.",
    sources: [
      { label: "MEPS Brief #540", href: "https://meps.ahrq.gov/data_files/publications/st540/stat540.shtml" },
    ],
    confidence: "Medium",
  },
];

const DOSE_RESPONSE = [
  { usd: "$0.03/day", effect: "+115 steps/day (+874 in sedentary segment)", design: "Carrot Rewards, n=32,229, loyalty points", grade: "B" },
  { usd: "$1.40/day gain-framed", effect: "+5pp goal-days (n.s.)", design: "Patel 2016 RCT, n=281", grade: "A" },
  { usd: "$1.40/day loss-framed", effect: "+16pp goal-days — ×2.7 the gain-frame effect", design: "Patel 2016 RCT, same trial", grade: "A" },
  { usd: "~$1.30/day (median of 23 trials)", effect: "+607 steps/day pooled (CI 422–792)", design: "Mitchell 2019 meta-analysis, n=6,074", grade: "A" },
  { usd: "~$1.90/day max (S$470/6mo)", effect: "+570 steps/day — no gain over the $1.30 point", design: "TRIPPA RCT, Singapore, n=800", grade: "A" },
  { usd: "$0.10/day (S$30/season)", effect: "+1,579 steps/day (self-selected, pre-post — upper bound)", design: "National Steps Challenge, n=421k", grade: "B" },
  { usd: "Loss-framed device financing", effect: "+34% activity, sustained 24 months", design: "RAND/Vitality Apple Watch, n=422,643", grade: "B" },
];

const CONF_STYLE: Record<Conf, string> = {
  High: "border-emerald-400/40 bg-emerald-400/10 text-emerald-200",
  "Med-high": "border-primary/40 bg-primary/10 text-primary",
  Medium: "border-sky-400/40 bg-sky-400/10 text-sky-200",
  "Low-med": "border-amber-400/40 bg-amber-400/10 text-amber-200",
  Low: "border-orange-400/40 bg-orange-400/10 text-orange-200",
};

function SourceLink({ label, href }: { label: string; href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 rounded-md border border-card-border bg-background/50 px-1.5 py-0.5 font-mono text-[0.62rem] text-foreground/70 hover:border-primary/40 hover:text-primary"
    >
      {label} <ExternalLink className="h-2.5 w-2.5" />
    </a>
  );
}

function EvidenceTable({ title, icon, rows }: { title: string; icon: React.ReactNode; rows: EvidenceRow[] }) {
  return (
    <div className="rounded-xl border border-card-border bg-card/40 p-4">
      <div className="mb-3 flex items-center gap-2 font-mono text-[0.72rem] uppercase tracking-[0.16em] text-foreground">
        {icon} {title}
      </div>
      <div className="space-y-3">
        {rows.map((r) => (
          <div key={r.parameter} className="rounded-lg border border-card-border bg-background/40 p-3">
            <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-semibold">{r.parameter}</span>
              <span className={`rounded-full border px-2 py-0.5 font-mono text-[0.6rem] uppercase tracking-wide ${CONF_STYLE[r.confidence]}`}>
                {r.confidence} confidence
              </span>
            </div>
            <div className="mb-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div className="rounded-md border border-card-border bg-card/40 px-2.5 py-1.5">
                <div className="font-mono text-[0.6rem] uppercase tracking-wide text-muted-foreground">v0 (illustrative)</div>
                <div className="font-mono text-xs text-foreground/60 line-through decoration-foreground/30">{r.v0}</div>
              </div>
              <div className="rounded-md border border-primary/30 bg-primary/5 px-2.5 py-1.5">
                <div className="font-mono text-[0.6rem] uppercase tracking-wide text-foreground/80">v1 (evidence-anchored)</div>
                <div className="font-mono text-xs font-semibold">{r.v1}</div>
              </div>
            </div>
            <p className="mb-2 text-xs leading-relaxed text-foreground/75">{r.evidence}</p>
            <div className="flex flex-wrap gap-1.5">
              {r.sources.map((s) => (
                <SourceLink key={s.href} {...s} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function EvidenceReport() {
  return (
    <section className="space-y-4" data-testid="tab-evidence">
      {/* header */}
      <div className="rounded-xl border border-card-border bg-card/45 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="font-mono text-xs uppercase tracking-[0.16em] text-foreground">Evidence dossier</div>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight">What the numbers are based on</h2>
            <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted-foreground">
              June 2026 evidence pass: every material constant was checked against published RCTs, meta-analyses,
              regulator statistics and insured-book cohort studies. The simulator now runs on the
              evidence-anchored set below. Where the honest literature said our numbers were too optimistic,
              they were cut — most of the corrections are downward, and that is deliberate.
            </p>
          </div>
          <span className="rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 font-mono text-[0.65rem] text-amber-200">
            healthid-life-v1-evidence @ 1.0.0 · draft — pending actuary sign-off
          </span>
        </div>

        {/* three structural corrections */}
        <div className="mt-4 grid grid-cols-1 gap-2 lg:grid-cols-3">
          <div className="rounded-lg border border-card-border bg-background/40 p-3">
            <div className="mb-1 flex items-center gap-1.5 font-mono text-[0.68rem] uppercase tracking-wide text-foreground">
              <Scale className="h-3.5 w-3.5" /> 1 · Local claims base
            </div>
            <p className="text-xs leading-relaxed text-foreground/75">
              Claims deltas are now expressed against a locally calibrated base (HK group ≈ US$915/member/yr,
              SG IP ≈ US$410/life) instead of absolute US dollars. The old steps delta was most of an entire
              HK claims base — arithmetically impossible.
            </p>
          </div>
          <div className="rounded-lg border border-card-border bg-background/40 p-3">
            <div className="mb-1 flex items-center gap-1.5 font-mono text-[0.68rem] uppercase tracking-wide text-foreground">
              <ShieldAlert className="h-3.5 w-3.5" /> 2 · RCT-honest attribution
            </div>
            <p className="text-xs leading-relaxed text-foreground/75">
              The two best RCTs in the field (Illinois Wellness, QJE 2019; Song &amp; Baicker, JAMA 2019) found
              zero causal claims effect from programme offers. Attribution is cut 0.6 → 0.3, and the nulls are
              cited in the model rather than hidden from it.
            </p>
          </div>
          <div className="rounded-lg border border-card-border bg-background/40 p-3">
            <div className="mb-1 flex items-center gap-1.5 font-mono text-[0.68rem] uppercase tracking-wide text-foreground">
              <TrendingDown className="h-3.5 w-3.5" /> 3 · Selection ≠ causation
            </div>
            <p className="text-xs leading-relaxed text-foreground/75">
              Vendor-famous differentials ("67% lower lapse", "76% lower mortality") compare top engagement
              tiers against the disengaged — mostly selection. The model uses programme-level numbers with a
              ~⅓–½ causal credit, the same haircut reinsurers apply.
            </p>
          </div>
        </div>
      </div>

      {/* reward dose-response — the new core dataset */}
      <div className="rounded-xl border border-card-border bg-card/40 p-4">
        <div className="mb-1 flex items-center gap-2 font-mono text-[0.72rem] uppercase tracking-[0.16em] text-foreground">
          <FlaskConical className="h-3.5 w-3.5" /> Reward dose-response — published calibration points
        </div>
        <p className="mb-3 max-w-3xl text-xs leading-relaxed text-muted-foreground">
          The reward curve was previously fitted through one observed point with invented shape constants. These
          published (incentive, effect) pairs now back the saturation scale (~$1–1.5/day ≈ $30–45 PMPM): paying more
          than that buys almost nothing for gain-framed cash, while loss-framing multiplies the effect ~2.7× at the
          same cost. Grade A = RCT/meta-analysis, B = large observational.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-xs">
            <thead>
              <tr className="border-b border-card-border font-mono text-[0.62rem] uppercase tracking-wide text-muted-foreground">
                <th className="py-1.5 pr-3">Incentive</th>
                <th className="py-1.5 pr-3">Observed effect</th>
                <th className="py-1.5 pr-3">Study</th>
                <th className="py-1.5">Grade</th>
              </tr>
            </thead>
            <tbody>
              {DOSE_RESPONSE.map((d) => (
                <tr key={d.usd} className="border-b border-card-border/50">
                  <td className="py-2 pr-3 font-mono font-semibold">{d.usd}</td>
                  <td className="py-2 pr-3 text-foreground/80">{d.effect}</td>
                  <td className="py-2 pr-3 text-muted-foreground">{d.design}</td>
                  <td className="py-2 font-mono">{d.grade}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <EvidenceTable title="Claims economics" icon={<Scale className="h-3.5 w-3.5" />} rows={CLAIMS_ROWS} />
      <EvidenceTable title="Behaviour & incentives" icon={<FlaskConical className="h-3.5 w-3.5" />} rows={BEHAVIOUR_ROWS} />
      <EvidenceTable title="Actuarial & product economics" icon={<BookOpenCheck className="h-3.5 w-3.5" />} rows={ACTUARIAL_ROWS} />

      {/* what we still can't solve ourselves */}
      <div className="rounded-xl border border-amber-400/30 bg-amber-400/5 p-4">
        <div className="mb-2 font-mono text-[0.72rem] uppercase tracking-[0.16em] text-amber-200">
          Remaining gaps — only the insurer or a pilot can close these
        </div>
        <ul className="space-y-1.5 text-xs leading-relaxed text-foreground/80">
          <li>
            <span className="font-semibold">The insurer's own book:</span> claims distribution by risk tier, baseline
            PMPM claims, lapse rates and LTV. Every one of these is an editable input — "plug in your numbers" is the
            engagement model, not a weakness.
          </li>
          <li>
            <span className="font-semibold">AIA Vitality HK/SG penetration:</span> not publicly disclosed; obtainable
            in conversation. The RAND Vitality follow-up is the best public proxy.
          </li>
          <li>
            <span className="font-semibold">Reward elasticity above ~$2/day:</span> no trial data exists anywhere.
            A 2–3 arm pilot is the only honest way to price rewards beyond the published range — the simulator is
            designed to specify exactly that pilot.
          </li>
          <li>
            <span className="font-semibold">SG market persistency:</span> MAS/LIA do not publish market-wide lapse
            rates; the 5–6%/yr baseline is a US SOA/LIMRA proxy, disclosed as such.
          </li>
        </ul>
      </div>

      <p className="font-mono text-[0.65rem] leading-relaxed text-muted-foreground">
        Full dossier with ~60 sources: EVIDENCE_DOSSIER.md in the repository. Assumption set
        healthid-life-v1-evidence@1.0.0 (status: draft). v0 illustrative set retained for comparison. All external
        links open the cited source.
      </p>
    </section>
  );
}
