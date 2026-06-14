import type { Citation } from "@shared/schema";

export const CITATIONS: Citation[] = [
  {
    key: "paluch2022",
    authors: "Paluch AE, et al.",
    year: 2022,
    title: "Daily steps and all-cause mortality: a meta-analysis of 15 international cohorts",
    journal: "The Lancet Public Health",
    doi: "10.1016/S2468-2667(21)00302-9",
    finding:
      "Higher daily step counts were associated with progressively lower all-cause mortality; benefit accrued up to ~6,000–10,000 steps/day depending on age.",
  },
  {
    key: "mandsager2018",
    authors: "Mandsager K, et al.",
    year: 2018,
    title: "Association of Cardiorespiratory Fitness With Long-term Mortality",
    journal: "JAMA Network Open",
    doi: "10.1001/jamanetworkopen.2018.3605",
    finding:
      "Greater cardiorespiratory fitness (VO2 max) was associated with substantially lower long-term mortality, with no observed upper limit of benefit.",
  },
  {
    key: "sprint2015",
    authors: "SPRINT Research Group",
    year: 2015,
    title: "A Randomized Trial of Intensive versus Standard Blood-Pressure Control",
    journal: "New England Journal of Medicine",
    doi: "10.1056/NEJMoa1511939",
    finding:
      "Intensive systolic BP control (<120 mmHg) reduced major cardiovascular events by ~25% versus standard control.",
  },
  {
    key: "cappuccio2010",
    authors: "Cappuccio FP, et al.",
    year: 2010,
    title: "Sleep duration and all-cause mortality: a systematic review and meta-analysis",
    journal: "Sleep",
    doi: "10.1093/sleep/33.5.585",
    finding:
      "Both short and long sleep duration were associated with increased all-cause mortality, supporting sleep regularity as a health target.",
  },
  {
    key: "patel2016",
    authors: "Patel MS, et al.",
    year: 2016,
    title: "Framing Financial Incentives to Increase Physical Activity Among Overweight and Obese Adults",
    journal: "Annals of Internal Medicine",
    doi: "10.7326/M15-1635",
    finding:
      "Loss-framed financial incentives and gamification significantly increased physical-activity goal achievement versus control.",
  },
  {
    key: "finkelstein2016",
    authors: "Finkelstein EA, et al. (TRIPPA trial)",
    year: 2016,
    title: "Effectiveness of activity trackers with and without incentives to increase physical activity (TRIPPA): a randomised controlled trial",
    journal: "The Lancet Diabetes & Endocrinology",
    doi: "10.1016/S2213-8587(16)30284-4",
    finding:
      "Singapore RCT (n=800): cash incentives (~S$470/6mo) added ~+570 steps/day; the cash effect fully eroded 6 months after incentives stopped, and only ~10% still wore trackers at 12 months.",
  },
  {
    key: "mitchell2019",
    authors: "Mitchell MS, et al.",
    year: 2019,
    title: "Financial incentives for physical activity in adults: systematic review and meta-analysis",
    journal: "British Journal of Sports Medicine",
    doi: "10.1136/bjsports-2019-100633",
    finding:
      "Across 23 trials (n=6,074), modest incentives (~US$1.40/day) increased activity by ~+607 steps/day during interventions, with incentive size a significant moderator; the dose-response saturates near $1–1.5/day.",
  },
  {
    key: "mantzari2015",
    authors: "Mantzari E, et al.",
    year: 2015,
    title: "Personal financial incentives for changing habitual health-related behaviors: a systematic review and meta-analysis",
    journal: "Preventive Medicine",
    doi: "10.1016/j.ypmed.2015.03.001",
    finding:
      "Incentive effects on habitual behaviours dissipate within ~3 months of reward removal — the basis for the simulator's fader part-credit and decay assumptions.",
  },
  {
    key: "carlson2015",
    authors: "Carlson SA, et al.",
    year: 2015,
    title: "Inadequate physical activity and health care expenditures in the United States",
    journal: "Progress in Cardiovascular Diseases",
    doi: "10.1016/j.pcad.2014.08.002",
    finding:
      "Inactive vs active adults incur ~$1,313/yr higher healthcare expenditure (cross-sectional gradient — used as the CEILING for the claims delta, not the causal estimate).",
  },
  {
    key: "patel2011",
    authors: "Patel DN, et al.",
    year: 2011,
    title: "Participation in fitness-related activities of an incentive-based health promotion program and hospital costs (Discovery Vitality)",
    journal: "American Journal of Health Promotion",
    doi: "10.4278/ajhp.100603-QUAN-172",
    finding:
      "Longitudinal insured-book evidence (n=304,054): members who BECAME active showed ~6% lower hospital costs; continuously active ~16% lower — anchors the claims delta at 6–8% of baseline claims.",
  },
  {
    key: "jones2019",
    authors: "Jones D, Molitor D, Reif J",
    year: 2019,
    title: "What do workplace wellness programs do? Evidence from the Illinois Workplace Wellness Study",
    journal: "Quarterly Journal of Economics",
    doi: "10.1093/qje/qjz023",
    finding:
      "RCT (n≈4,800): no causal effect on medical spending at 12–30 months; participants were already healthier pre-programme — selection explains the naive observational savings. Basis for the 0.3 attribution factor.",
  },
  {
    key: "song2019",
    authors: "Song Z, Baicker K",
    year: 2019,
    title: "Effect of a workplace wellness program on employee health and economic outcomes: a randomized clinical trial",
    journal: "JAMA",
    doi: "10.1001/jama.2019.3307",
    finding:
      "RCT (n≈33,000): improved self-reported behaviours but no significant effect on spending, utilisation or biometrics at 18 months (still null at 3 years) — the second leg of the attribution haircut.",
  },
  {
    key: "wagner2001",
    authors: "Wagner EH, et al.",
    year: 2001,
    title: "Effect of improved glycemic control on health care costs and utilization",
    journal: "JAMA",
    doi: "10.1001/jama.285.2.182",
    finding:
      "Sustained ≥1% HbA1c reduction was followed by $685–950/yr lower total costs in years 1–4, concentrated in members with baseline HbA1c ≥10% — the best-evidenced claims pathway in the model.",
  },
  {
    key: "hka22",
    authors: "Actuarial Society of Hong Kong",
    year: 2025,
    title: "Hong Kong Assured Lives Mortality Study 2022 (HKA22)",
    journal: "ASHK experience study (13 insurers, >60M life-years)",
    doi: "actuaries.org.hk",
    finding:
      "Crude HK insured-lives mortality ≈ 1.75 per 1,000 (2014–2021) — regulator-grade basis for the 0.0015 baseline mortality assumption.",
  },
  {
    key: "patel2019stepup",
    authors: "Patel MS, et al. (STEP UP trial)",
    year: 2019,
    title:
      "Effectiveness of Behaviorally Designed Gamification Interventions With Social Incentives for Increasing Physical Activity: The STEP UP Randomized Clinical Trial",
    journal: "JAMA Internal Medicine",
    doi: "10.1001/jamainternmed.2019.3505",
    finding:
      "RCT (n=602): behaviourally designed gamification (points, levels, social incentives — no cash) significantly increased steps over 24 weeks; the competition arm stayed above control in follow-up. Evidence that programme DESIGN quality adds engagement beyond the cash reward — the basis for modelling intrinsic/companion-driven engagement at the $0-reward arm.",
  },
  {
    key: "ifrs15breakage",
    authors: "IASB / loyalty-programme industry studies",
    year: 2018,
    title: "IFRS 15 Revenue from Contracts with Customers — customer loyalty programmes (breakage)",
    journal: "IFRS Foundation; industry redemption studies",
    doi: "ifrs.org/ifrs-15",
    finding:
      "Loyalty-point redemption runs at ~67–69% (31–33% breakage); IFRS 15 requires recognising reward liabilities at EXPECTED redemption, not face value — the basis for the simulator's reward cost ratio on points/voucher rewards (cash rewards stay at 100%).",
  },
  {
    key: "zhang2016",
    authors: "Zhang GQ, Zhang W",
    year: 2016,
    title: "Resting heart rate and all-cause and cardiovascular mortality: a meta-analysis",
    journal: "CMAJ",
    doi: "10.1503/cmaj.150535",
    finding:
      "Elevated resting heart rate was independently associated with higher all-cause and cardiovascular mortality.",
  },
];
