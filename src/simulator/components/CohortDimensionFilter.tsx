import type { CohortDefinition, Market, ProductType, DeviceClass, EngagementTier, BaselineRisk } from '../types';
import { MARKET_LABELS, PRODUCT_TYPE_LABELS, DEVICE_CLASS_LABELS, ENGAGEMENT_TIER_LABELS, BASELINE_RISK_LABELS } from '../constants';

interface CohortDimensionFilterProps {
  definition: CohortDefinition;
  onChange: (definition: CohortDefinition) => void;
}

export default function CohortDimensionFilter({ definition, onChange }: CohortDimensionFilterProps) {
  function update<K extends keyof CohortDefinition>(key: K, value: CohortDefinition[K]) {
    onChange({ ...definition, [key]: value });
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {/* Market */}
      <div>
        <label className="text-2xs text-tertiary block mb-1">Market</label>
        <select
          value={definition.market}
          onChange={(e) => update('market', e.target.value as Market)}
          className="w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-primary"
        >
          {Object.entries(MARKET_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {/* Product Type */}
      <div>
        <label className="text-2xs text-tertiary block mb-1">Product Type</label>
        <select
          value={definition.productType}
          onChange={(e) => update('productType', e.target.value as ProductType)}
          className="w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-primary"
        >
          {Object.entries(PRODUCT_TYPE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {/* Age Range */}
      <div>
        <label className="text-2xs text-tertiary block mb-1">Age Range</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={18}
            max={100}
            value={definition.ageRange[0]}
            onChange={(e) => update('ageRange', [Number(e.target.value), definition.ageRange[1]])}
            className="w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-primary"
          />
          <span className="text-tertiary text-sm">-</span>
          <input
            type="number"
            min={18}
            max={100}
            value={definition.ageRange[1]}
            onChange={(e) => update('ageRange', [definition.ageRange[0], Number(e.target.value)])}
            className="w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-primary"
          />
        </div>
      </div>

      {/* Baseline Risk */}
      <div>
        <label className="text-2xs text-tertiary block mb-1">Baseline Risk</label>
        <select
          value={definition.baselineRisk}
          onChange={(e) => update('baselineRisk', e.target.value as BaselineRisk)}
          className="w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-primary"
        >
          {Object.entries(BASELINE_RISK_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {/* Device Class */}
      <div>
        <label className="text-2xs text-tertiary block mb-1">Device Class</label>
        <select
          value={definition.deviceClass}
          onChange={(e) => update('deviceClass', e.target.value as DeviceClass)}
          className="w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-primary"
        >
          {Object.entries(DEVICE_CLASS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {/* Engagement Tier */}
      <div>
        <label className="text-2xs text-tertiary block mb-1">Engagement Tier</label>
        <select
          value={definition.engagementTier ?? ''}
          onChange={(e) => update('engagementTier', (e.target.value || undefined) as EngagementTier | undefined)}
          className="w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-primary"
        >
          <option value="">Any</option>
          {Object.entries(ENGAGEMENT_TIER_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {/* Clinical Data */}
      <div>
        <label className="text-2xs text-tertiary block mb-1">Clinical Data Required</label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={definition.hasClinicalData ?? false}
            onChange={(e) => update('hasClinicalData', e.target.checked)}
            className="rounded border-border"
          />
          <span className="text-sm text-secondary">Require lab results</span>
        </label>
      </div>

      {/* Data Richness */}
      <div>
        <label className="text-2xs text-tertiary block mb-1">Min Data Richness: {Math.round((definition.minDataRichness ?? 0) * 100)}%</label>
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round((definition.minDataRichness ?? 0) * 100)}
          onChange={(e) => update('minDataRichness', Number(e.target.value) / 100)}
          className="w-full"
        />
      </div>

      {/* Motivation Level */}
      <div>
        <label className="text-2xs text-tertiary block mb-1">Motivation Level: {Math.round((definition.motivationLevel ?? 0.5) * 100)}%</label>
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round((definition.motivationLevel ?? 0.5) * 100)}
          onChange={(e) => update('motivationLevel', Number(e.target.value) / 100)}
          className="w-full"
        />
      </div>
    </div>
  );
}
