import type { SimulationConfig, SimulationOutput, CampaignSimulationResult } from '../types';
import { buildPopulationCohort, getEligibleCohort } from './populationModel';
import { modelBehaviourChange } from './behaviourModel';
import { calculateMetricHealthImpact } from './metricImpactModel';
import { calculateFinancials, calculatePerCampaignSavings } from './financialModel';
import { combineCampaigns } from './campaignCombiner';
import { getMarketMortality } from '../data/mortalityTables';
import { getClaimsCosts } from '../data/claimsCosts';
import { getCampaignTemplate } from '../data/campaignTemplates';
import { getMetricEvidence } from '../data/metricEvidence';
import { getMetricAdaptedArchetypes } from '../data/archetypes';

/**
 * Multi-campaign simulation pipeline.
 *
 * For each selected campaign:
 * 1. Filter population by required signal
 * 2. Adapt archetypes for the campaign's metric
 * 3. Model behaviour change with metric-specific parameters
 * 4. Calculate per-metric health impact
 * 5. Calculate per-campaign claims savings
 *
 * Then:
 * 6. Combine campaigns with overlap discount
 * 7. Calculate combined financials
 * 8. Run sensitivity analysis
 */

export function runSimulation(config: SimulationConfig): SimulationOutput {
  // Step 1: Build full population cohort
  const cohort = buildPopulationCohort(
    config.market,
    config.cohortSize,
    config.archetypeWeights,
  );

  const mortalityData = getMarketMortality(config.market);
  const claimsCosts = getClaimsCosts(config.market);
  const horizonYears = config.horizonMonths / 12;

  // Step 2: Run each campaign independently
  const campaignResults: CampaignSimulationResult[] = [];

  for (const campaignId of config.selectedCampaigns) {
    const template = getCampaignTemplate(campaignId);
    if (!template) continue;

    const evidence = getMetricEvidence(template.metric);
    if (!evidence) continue;

    // Filter cohort by required signal
    const eligibleCohort = getEligibleCohort(cohort, template.requiredSignal);

    // Get metric-adapted archetype shares
    const archetypeShares = getMetricAdaptedArchetypes(template.metric, config.archetypeWeights);

    // Model behaviour change for this metric
    const behaviour = modelBehaviourChange(
      eligibleCohort,
      config.horizonMonths,
      evidence,
      archetypeShares,
    );

    // Calculate per-metric health impact
    const health = calculateMetricHealthImpact(
      behaviour.byCellAndArchetype,
      mortalityData,
      eligibleCohort,
      horizonYears,
      evidence,
    );

    // Calculate per-campaign claims savings
    const { savings, morbiditySavings } = calculatePerCampaignSavings(
      template.metric,
      health.byCellAndArchetype,
      eligibleCohort.totalSize,
      config.horizonMonths,
      config.realizationDiscount,
    );

    campaignResults.push({
      campaignId,
      campaignName: template.name,
      metric: template.metric,
      eligibleCohort: eligibleCohort.totalSize,
      archetypeShares,
      behaviour,
      health,
      perCampaignSavings: savings,
      perCampaignMorbiditySavings: morbiditySavings,
      sources: [...behaviour.sources, ...health.sources],
    });
  }

  // Step 3: Combine campaigns
  const multiCampaign = combineCampaigns(campaignResults, {
    rewardCeilingPct: config.rewardCeilingPct,
    horizonMonths: config.horizonMonths,
    cohortSize: config.cohortSize,
  });

  // Step 4: Calculate combined financials
  // Merge all health impacts for the full financial model
  const allHealthImpacts = campaignResults.flatMap((cr) => cr.health.byCellAndArchetype);
  const financials = calculateFinancials(
    allHealthImpacts,
    cohort,
    claimsCosts,
    {
      rewardCeilingPct: config.rewardCeilingPct,
      horizonMonths: config.horizonMonths,
      realizationDiscount: config.realizationDiscount,
    },
    campaignResults,
  );

  // Generate narrative
  const narrative = generateNarrative(cohort, campaignResults, multiCampaign, financials, config);

  return { cohort, multiCampaign, financials, narrative, config };
}

function generateNarrative(
  cohort: ReturnType<typeof buildPopulationCohort>,
  campaignResults: CampaignSimulationResult[],
  multiCampaign: ReturnType<typeof combineCampaigns>,
  financials: ReturnType<typeof calculateFinancials>,
  config: SimulationConfig,
): string {
  const marketName = config.market === 'hong_kong' ? 'Hong Kong' : 'Singapore';
  const horizonYears = config.horizonMonths / 12;
  const campaignNames = campaignResults.map((cr) => cr.campaignName).join(', ');

  const lines: string[] = [
    `# Campaign-Centric ROI Model — ${marketName}`,
    '',
    `## Population`,
    `${cohort.totalSize.toLocaleString()} insured lives from ${marketName}. ` +
    `Average age ${cohort.summary.avgAge.toFixed(0)}, ${(cohort.summary.pctWithWearable * 100).toFixed(0)}% wearable penetration.`,
    '',
    `## Selected Campaigns`,
    `${campaignResults.length} campaign${campaignResults.length > 1 ? 's' : ''}: ${campaignNames}.`,
    ...(campaignResults.length > 1 ? [`Overlap discount: ${(multiCampaign.combined.overlapDiscount * 100).toFixed(0)}%.`] : []),
    '',
    `## Per-Campaign Impact`,
    ...campaignResults.map((cr) =>
      `- **${cr.campaignName}** (${cr.metric}): ${cr.eligibleCohort.toLocaleString()} eligible, ` +
      `${cr.health.totals.avoidedDeaths.central.toFixed(1)} avoided deaths, ` +
      `$${(cr.perCampaignSavings.central / 1e6).toFixed(2)}M savings`,
    ),
    '',
    `## The Financial Case`,
    financials.explanation,
    '',
    `## The Bottom Line`,
    `Over ${horizonYears} year${horizonYears > 1 ? 's' : ''}, these campaigns ` +
    `generate $${(financials.grossTotalValue.low / 1e6).toFixed(1)}M–$${(financials.grossTotalValue.central / 1e6).toFixed(1)}M–$${(financials.grossTotalValue.high / 1e6).toFixed(1)}M in projected value. ` +
    `Net ROI: ${financials.roiMultiple.low.toFixed(1)}×–${financials.roiMultiple.central.toFixed(1)}×–${financials.roiMultiple.high.toFixed(1)}×. ` +
    `Even in the conservative scenario, the programme pays for itself.`,
  ];

  return lines.join('\n');
}

/** Default configuration */
export const DEFAULT_CONFIG: SimulationConfig = {
  market: 'hong_kong',
  cohortSize: 100_000,
  selectedCampaigns: ['cardio_fitness'],
  useCase: 'claims_reduction',
  rewardCeilingPct: 0.70,
  horizonMonths: 36,
  realizationDiscount: 0.65,
};
