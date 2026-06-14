# HealthID Platform Walkthrough — Video Script

*Upload this document to NotebookLM as a source, then generate an Audio Overview or video.*

---

## Opening

Every life insurer knows the problem. Your policyholders are getting sicker, claims are rising, and the wellness programmes you've tried — step challenges, gym discounts, health apps — haven't moved the needle. You've spent millions. You've got nothing to show for it.

HealthID changes that. It's a platform that lets insurers run health campaigns on their policyholders using real wearable and clinical signals — VO2 Max, HRV, sleep, resting heart rate, blood pressure — and it proves the financial return with cited, peer-reviewed evidence. No hand-waving. No marketing language. Actuarial numbers.

Let's walk through how it works.

---

## The Platform: What the Insurer Sees

When a partner logs into HealthID, they land on the AI Actuary — a real-time intelligence cockpit. Think of it as a Bloomberg terminal for health campaigns.

The AI Actuary continuously scans wearable signals across the partner's member pool — say, 50,000 lives — and surfaces the highest-confidence behaviour change opportunities. It might say: "3,847 members have VO2 Max below clinical thresholds. A Cardio Fitness campaign targeting this cohort would cost 650 Health Points per member and project a 4.2x ROI with $4.2M in book value improvement. Payback: 8 months."

That's not a guess. Each recommendation comes with a full evidence trail — the peer-reviewed study, the sample size, the effect size, and the actuarial claims impact.

From the Actuary, the partner can launch a campaign in minutes. The Campaign Studio offers pre-built templates matching the platform's four campaign families: signal improvement (reduce claims), acquisition (attract new members), retention (prevent lapse), and engagement (increase verified interactions).

The creation flow is a 5-step wizard. Pick your business outcome. Choose your health signal — say, VO2 Max above 35 mL/kg/min. Define your cohort. Set the incentive in Health Points. Review and launch. A live ROI calculator sits in the sidebar showing projected claims reduction, annual savings per member, and payback period — all updating in real time as the partner adjusts parameters.

Once campaigns are live, the partner can explore their member pool in the Cohort Explorer. They see anonymised members segmented by risk cohort, health score, trust tier, and connected data sources. Crucially, they never see raw health data. They see binary verification receipts: "Did this member meet the VO2 Max threshold? Yes or no." That's it. Zero PII exposure.

The Treasury page shows the financial mechanics. How Health Points are funded through T-Bill yield on idle capital — the budget appreciates at 4.5 to 5.5% APY while sitting in tokenised treasuries. How aspirational rewards like flights and experiences deliver 1.5 to 2.5 times the engagement of cash equivalents. And how the actuarial impact scales across the full book — from claims reduction percentage to morbidity shift in basis points to Value of New Business impact.

And for compliance conversations, the Verification Trail provides a signed audit log of every proof generated, every verification event, every receipt delivered. Zero raw-data access. The proof receipts use a zero-knowledge SNARK circuit. The partner can export signed audit logs for regulators showing: "We verified 18,400 health outcomes. We accessed zero personal health records. Here's the cryptographic proof."

---

## The Simulator: Proving the Numbers

Now, here's the problem every insurer has when evaluating HealthID. They've been burned before. They've heard the pitch — "wellness reduces claims" — and they've seen it fail. The CEO's first question is always: "Prove it. With my population. With my numbers. Show me it still works when most people quit."

That's exactly what the ROI Simulator does. It sits alongside the main platform and walks the executive through a 7-chapter case — like a McKinsey presentation — building from their specific population to a stress-tested financial bottom line. Every number is cited. Every assumption is challenged.

### Chapter 1: Your Population

Start with reality. The executive selects their market — Hong Kong or Singapore — and their book size, say 100,000 lives. The simulator instantly generates census-accurate demographics from government statistics: age-sex distribution, average age, and signal coverage. What percentage of these 100,000 people have a phone? A wearable? Access to clinical data?

This matters because a VO2 Max campaign needs wearable data. If only 38% of the population wears a device, the addressable cohort is 38,000, not 100,000. The simulator is honest about reach from the very first slide.

### Chapter 2: The Health Opportunity

Before choosing any campaigns, the executive sees the health landscape. Ten health metrics, ranked by evidence strength. For each one: what percentage of the population is at risk, what the behaviour shift evidence shows, and what the dose-response relationship is between improvement and mortality reduction.

Take VO2 Max. Thirty-five to fifty-five percent of adults have fitness below clinical thresholds. Structured training programmes improve VO2 Max by 3.5 to 5.2 mL/kg/min. And each 1 MET increase in cardiorespiratory fitness reduces all-cause mortality by 13 to 17 percent. That's from Mandsager et al. 2018, published in JAMA Network Open, 122,007 participants.

Or sleep. Cappuccio et al. 2010 — a meta-analysis of 1.38 million participants published in Sleep — found that consistently sleeping less than 6 hours increases mortality risk by 12 percent.

This chapter reframes the conversation. It's not "wellness is nice." It's "your policyholders have documented health risks that are costing you money, and here's the published evidence quantifying exactly how much."

### Chapter 3: Select Your Campaigns

Now the executive picks which campaigns to model — up to 3 from 8 options that match what the HealthID platform actually delivers: Cardio Fitness Activation, HRV Recovery, Sleep Regularity, Resting Heart Rate Improvement, Active Minutes Challenge, HbA1c Screening, Blood Pressure Monitoring, SpO2 Screening.

Each card shows the evidence level, the required signal, the sample size behind the dose-response data, and the commercial value pitch. Pick Cardio Fitness and Sleep Regularity? The simulator applies an overlap discount — 84% of combined value for two campaigns — because health improvements are correlated. You can't count the same claims savings twice.

The executive also sets the economic parameters: what percentage of savings to reinvest as member rewards, the time horizon, and the use case — claims reduction, underwriting, acquisition, renewal, or dynamic premium.

### Chapter 4: How People Actually Behave

This is the chapter that wins the room. Every CEO has the same objection: "I've seen these programmes fail. People sign up, do it for two weeks, and quit."

The simulator agrees with them. It models six behavioural archetypes derived from real-world wellness programme data. Forty-five percent of the population are non-starters — they never meaningfully engage, and the model assumes zero benefit from them. Seventeen percent are early dropouts. Thirteen percent are sporadic engagers. Only 16 percent — the steady movers and super engagers — sustain behaviour change long enough to generate meaningful health impact.

Each archetype has a decay curve showing how quickly engagement fades. The model doesn't pretend everyone sticks with it. It explicitly accounts for the fact that most people quit — and then shows the ROI still works because the 16% who persist generate enough claims savings to cover the entire programme.

This turns the CEO's skepticism into a selling point: "We agree most people will drop off. We've modelled that. Here's why it still works."

### Chapter 5: The Health Impact

Now the evidence chain connects. For each campaign, the simulator shows the eligible cohort filtered by signal availability, the dose-response-derived mortality reduction, the number of avoided deaths, the morbidity reduction, and which archetypes are driving the value.

Every number is a range — low, central, and high — never a single point estimate. The simulator is transparent about uncertainty. If the central estimate says 4.7 avoided deaths from a Cardio Fitness campaign on 38,000 wearable-equipped members over 3 years, it also shows the conservative estimate at 2.1 and the optimistic estimate at 8.3.

### Chapter 6: The Financial Case

This is the slide the CFO came for. All campaign results combine into one financial picture: gross claims savings, reward budget, net ROI, ROI multiple, reward per member per month, and payback period.

The simulator benchmarks against Discovery Vitality — the world's most successful health incentive programme, run by Discovery Limited in South Africa across millions of members. Discovery achieves a 1.8x ROI. If the simulator shows something in that range, it's credible. If it shows 10x, something's wrong with the assumptions.

A typical result for two campaigns on 100,000 lives over 3 years might show: $12M in gross value, $3.6M in reward budget, $8.4M in net ROI, a 2.3x multiple, $3 per member per month in rewards, and a 14-month payback. These are real numbers from the actuarial model, not marketing projections.

### Chapter 7: What If We're Wrong?

The final chapter is the strongest. It stress-tests every assumption with a tornado chart, a breakeven analysis, and three scenario comparisons.

The tornado chart shows which variables matter most. Participation rate and improvement rate dominate — if fewer people engage or the behaviour shift is smaller, ROI drops. But claims cost baseline and persistence rate matter too.

The breakeven analysis answers: "What's the minimum that has to go right for this to pay for itself?" If breakeven requires only a 12% participation rate — and the model already assumes 45% non-starters — there's a massive margin of safety.

Three scenarios close it out. The conservative case cuts participation and improvement rates in half. The central case uses base assumptions. The optimistic case uses Discovery Vitality benchmarks. The punchline: even the conservative scenario generates positive ROI.

---

## Why This Matters

Most wellness ROI tools fall into two traps. They're either too simple — multiply participants by average savings, ignore dropout, present a single optimistic number — or too complex, requiring an actuary to operate.

HealthID's simulator sits in the sweet spot. It's narrative-driven, so executives follow a story, not a spreadsheet. It's evidence-grounded, so every number traces to a published source. It's honest about uncertainty, showing ranges instead of point estimates. And it directly addresses the #1 objection — "people quit" — by modelling dropout explicitly and showing the ROI survives it.

The platform and the simulator work together. The platform runs the campaigns — targeting real wearable signals, rewarding verified health outcomes with Health Points, maintaining zero-PII compliance through zero-knowledge proofs. The simulator proves it's worth doing — with the executive's own population, their own book size, their own market.

Together, they transform the sales conversation from "trust us, wellness works" to "here are your policyholders, here's the peer-reviewed evidence, here's what happens when most of them quit, and here's why it still pays for itself."

That's the difference between a wellness pitch and an actuarial case.
