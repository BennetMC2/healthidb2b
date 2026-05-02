# Synthetic Data And ROI Roadmap

## What changed in code

I replaced the old disconnected mock-data pattern with a single simulation backbone in [src/data/simulation.ts](/Users/bennetpember/HealthID-B2B-Platform/src/data/simulation.ts).

That simulation now:

- creates a larger persistent member pool
- gives members stable demographics, source connectivity, risk cohorts, and metric values
- derives verification receipts from campaign targeting and challenge logic
- derives campaign time series from the same campaign/member state
- derives compliance records and monthly processing summaries from the receipt stream
- refreshes on a rolling time bucket so the dataset is not frozen forever

The old files now re-export from that simulation:

- [src/data/identities.ts](/Users/bennetpember/HealthID-B2B-Platform/src/data/identities.ts)
- [src/data/verifications.ts](/Users/bennetpember/HealthID-B2B-Platform/src/data/verifications.ts)
- [src/data/campaignTimeSeries.ts](/Users/bennetpember/HealthID-B2B-Platform/src/data/campaignTimeSeries.ts)
- [src/data/compliance.ts](/Users/bennetpember/HealthID-B2B-Platform/src/data/compliance.ts)

I also reworked the ROI layer in [src/utils/actuarial.ts](/Users/bennetpember/HealthID-B2B-Platform/src/utils/actuarial.ts) and [src/components/campaigns/ActuarialROICalculator.tsx](/Users/bennetpember/HealthID-B2B-Platform/src/components/campaigns/ActuarialROICalculator.tsx).

That model now:

- presents itself as a `scenario model`, not a fake live actuarial truth engine
- separates `upside` and `conservative` cases
- estimates expected verified lives instead of pretending all targeted members convert
- shows a scenario range
- carries a confidence score and confidence label
- uses outcome latency and realization factors

## Why the old dataset was weak

The prior dataset had a structural problem:

- identities were generated in one pass
- campaigns were generated in another
- verifications were sampled independently from both
- time series were then generated independently again
- compliance data was separate again

That meant the UI looked polished, but the system did not behave like one world-state.

## What still needs to improve

The current simulation is a strong demo step, but it is still not a proper event-sourced synthetic insurer environment.

The next level would add:

- persistent member history over multiple windows
- campaign-to-campaign behavioral carryover
- insurer-specific books rather than one shared synthetic network
- source-specific data latency and failure patterns
- intervention effects that change future member values, not just receipt counts
- cohort decay, reward fatigue, and reactivation behavior

## Recommended next technical step for data

Build a true `simulation clock + state transition` model:

1. base member state
2. daily behavior generator
3. campaign enrollment engine
4. intervention effect engine
5. verification engine
6. KPI rollup engine
7. partner/book segmentation

That would let the demo behave more like a real insurer operating environment, not just a better mock.

## Why the old ROI model was risky

The previous model had good sales energy, but it mixed:

- literature-based intuition
- hard-coded coefficients
- direct business outcome framing
- claims-reduction style language

in a way that could easily read as false certainty.

That is dangerous in insurer meetings.

## How to use the new ROI model

Treat it as a commercialization and prioritization tool.

Good uses:

- compare candidate campaign metrics
- explain relative upside
- show sensitivity between upside and conservative cases
- frame which campaigns deserve pilot attention

Bad uses:

- imply filed actuarial support
- imply claims reduction has been proven on HealthID data
- use it as pricing authority
- imply multi-metric scenarios are additive in a simple way

## Recommended next technical step for ROI

Split the model in two layers:

- `commercial scenario model`
- `pilot evidence model`

The commercial layer should stay in-product.

The pilot evidence layer should be a separate package or notebook-driven calibration environment that can ingest:

- insurer claims baselines
- cohort definitions
- local cost assumptions
- observed engagement and verification rates
- confidence intervals and sensitivity analysis

## Recommended first agent from a systems perspective

Use the current strategy assistant as the seed of a real agent, but only once it has clear tools.

The tool set should eventually include:

- read campaign configuration
- inspect reachable cohort stats
- compare modeled scenarios
- summarize recent verification trail
- draft launch recommendation
- flag missing evidence or weak assumptions

Do not let it mutate campaign rules automatically yet.

## Build status

`npm run build` passes after these changes.

Remaining known issue:

- the main JS bundle is still too large and should be split later
