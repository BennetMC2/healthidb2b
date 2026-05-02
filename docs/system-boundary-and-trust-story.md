# System Boundary And Trust Story

## Why this exists

Insurer buyers will eventually ask a version of:

- what is real today
- what is simulated
- where does raw data actually go
- what exactly would be true in a pilot

This document is the answer. It is designed to make the product more credible, not more magical.

## Product posture

HealthID should be presented as:

- `enterprise campaign infrastructure for insurer outcomes`

Within that:

- `primary story`: claims reduction
- `secondary story`: underwriting / pre-policy verification
- `also supported`: engagement and lead generation

## System boundary

### What the insurer sees

The insurer-facing product should show:

- campaign configuration
- cohort sizing and targeting
- receipt-level verification outcomes
- modeled business and actuarial scenarios
- audit and verification trail
- agent-generated recommendations and summaries

The insurer should not need raw health data to understand campaign performance.

### What HealthID handles

HealthID should be described as handling:

- campaign orchestration
- member consent flow
- source connectivity and verification workflow
- receipt generation and verification trail
- modeled analytics and insurer-facing reporting
- advisory agent workflows

### What raw data does

The clean target architecture is:

- raw health data does not appear in insurer-facing surfaces
- the insurer receives binary outcome receipts and supporting verification metadata
- HealthID handles the orchestration layer between consented member data sources and insurer outcomes

If this is not yet technically true in production, say:

- `this is the intended pilot architecture`

Do not say:

- `this is already proven in production`

### What is simulated today

Be explicit:

- member population is synthetic
- campaign activity is synthetic
- verification receipts are synthetic
- business outcome and ROI estimates are modeled scenarios
- the proof architecture is still directional, not production-proven

This is not a weakness if it is stated clearly. It becomes a weakness only when it is obscured.

## Recommended language

### Good language

- `modeled claims impact`
- `receipt-level verification`
- `intended pilot architecture`
- `synthetic member environment`
- `directional scenario model`
- `raw-data minimization target`

### Bad language

- `proven claims reduction`
- `production-grade ZK platform` unless true
- `raw data never touches HealthID` unless proven
- `actuarially validated` unless true
- `autonomous insurance decisions`

## Claims-reduction trust posture

Because claims reduction is now the lead story, the trust burden is higher.

So the posture should be:

- strong on modeled commercial upside
- explicit about evidence limits
- clear that early versions support decision-making, not actuarial certification
- disciplined about where human review remains required

## Underwriting as the safety valve

Underwriting / pre-policy verification should remain visible in the story because it helps buyers understand:

- the same campaign engine can drive simpler, more legible workflows
- not every buyer needs to believe the full claims-reduction case immediately
- there is a narrower adjacent path that can still justify adoption

## Deployment answer for now

Until a harder deployment strategy is chosen, the cleanest answer is:

- HealthID intends to support a managed enterprise deployment posture
- the exact model can evolve between hosted, private, or insurer-controlled environments
- pilot architecture would be agreed with the insurer based on security and data-governance requirements

That is honest and flexible without pretending the decision is already fully settled.

## What to say in a meeting

Short version:

`The insurer configures campaigns, targets a reachable cohort, and receives binary verification outcomes plus modeled business impact. The current environment is a synthetic but internally consistent operating model. In a pilot, the goal is to keep raw health data out of insurer-facing surfaces and deliver receipt-level verification and auditability instead.`

## Internal rule

If the team is unsure whether something is real, simulated, or target-state:

- label it before presenting it

That one rule will prevent a lot of credibility damage.
