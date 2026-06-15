import { create } from 'zustand';
import type { ModelSummary } from '@shared/models';
import { isBuyerSelectable } from '@shared/models';
import {
  FLOOR_ECONOMICS,
  MODEL_ECONOMICS_FALLBACK,
  deriveEconomics,
  type EconomicsConfig,
  type ModelEconomics,
} from '@/lib/economicsConfig';

// Front-page model switcher state (Assumptions Studio brief §3). The active
// Model drives every number in the app: its id is sent to the engine on each
// simulation request, and the "Model: {name}" badge travels on every screen.
//
// The store ships a fallback list mirroring the server registry so the static
// demo works with no API, then hydrates from GET /api/models when the live
// server is reachable.

export const DEFAULT_MODEL_ID = 'model-1-evidence-floor';

const FALLBACK_MODELS: ModelSummary[] = [
  {
    id: 'model-1-evidence-floor',
    name: 'Evidence Floor',
    basis: 'evidence',
    governanceStatus: 'signed',
    confidencePosture: 'floor',
    visibility: 'buyer_facing',
    version: '1.0.0',
    owner: 'HealthID actuarial',
    signedBy: 'HealthID actuarial',
    summary: 'Published-evidence, regulator-anchored assumptions. The conservative case every number can clear.',
    selectableInBuyerContext: true,
  },
  {
    id: 'model-2-forward-upside',
    name: 'Forward / Upside',
    basis: 'forward',
    governanceStatus: 'draft',
    confidencePosture: 'ceiling',
    visibility: 'buyer_facing',
    parentModelId: 'model-1-evidence-floor',
    version: '1.0.0-forward',
    owner: 'HealthID actuarial',
    summary: 'A labelled forward fork of the Evidence Floor — higher attribution and persistence, every lever rationalised.',
    selectableInBuyerContext: true,
  },
  {
    id: 'model-3-ai-sandbox',
    name: 'AI Sandbox (exploratory)',
    basis: 'ai',
    governanceStatus: 'draft',
    confidencePosture: 'ceiling',
    visibility: 'internal_only',
    parentModelId: 'model-1-evidence-floor',
    version: '0.0.1-ai',
    owner: 'HealthID research',
    summary: 'Internal-only AI-projected stress-test set. Not selectable in buyer-facing contexts.',
    selectableInBuyerContext: false,
  },
];

interface ModelStore {
  models: ModelSummary[];
  currentModelId: string;
  // The active model's campaign economics — every actuarial number reads this.
  economics: EconomicsConfig;
  // Realization scalar vs. the floor (Model 1 == 1). Used to scale seeded/static
  // display numbers (e.g. the AI Actuary cards' Monte-Carlo book value) so they
  // also move with the selected model.
  modelScalar: number;
  // Buyer/demo context gates internal_only models out of the switcher.
  buyerContext: boolean;
  setCurrentModel: (id: string) => void;
  hydrate: () => Promise<void>;
  hydrateEconomics: (id: string) => Promise<void>;
  currentModel: () => ModelSummary;
}

// Resolve a model's economics: baked fallback immediately (so the static demo
// re-prices on switch), then overridden by the engine when reachable.
function fallbackModel(id: string): ModelEconomics {
  return MODEL_ECONOMICS_FALLBACK[id] ?? MODEL_ECONOMICS_FALLBACK[DEFAULT_MODEL_ID];
}

export const useModelStore = create<ModelStore>((set, get) => ({
  models: FALLBACK_MODELS,
  currentModelId: DEFAULT_MODEL_ID,
  economics: FLOOR_ECONOMICS,
  modelScalar: 1,
  buyerContext: true,
  currentModel: () => {
    const { models, currentModelId } = get();
    return models.find((m) => m.id === currentModelId) || models[0];
  },
  setCurrentModel: (id) => {
    const { models, buyerContext } = get();
    const target = models.find((m) => m.id === id);
    // Guard: an internal_only / non-buyer-selectable model can never become the
    // active model in a buyer-facing session (brief §3).
    if (!target) return;
    if (buyerContext && !isBuyerSelectable(target)) return;
    // Re-price immediately from the baked fallback, then refine from the engine.
    const fm = fallbackModel(id);
    set({ currentModelId: id, economics: deriveEconomics(fm), modelScalar: fm.modelScalar });
    get().hydrateEconomics(id);
  },
  hydrate: async () => {
    get().hydrateEconomics(get().currentModelId);
    try {
      const res = await fetch('/api/models');
      if (!res.ok) return;
      const data = (await res.json()) as { models?: ModelSummary[] };
      if (Array.isArray(data.models) && data.models.length) {
        set({ models: data.models });
      }
    } catch {
      // Static demo / offline — keep the fallback list.
    }
  },
  hydrateEconomics: async (id) => {
    try {
      const res = await fetch(`/api/economics?modelId=${encodeURIComponent(id)}`);
      if (!res.ok) return;
      const model = (await res.json()) as ModelEconomics;
      if (model && typeof model.modelScalar === 'number') {
        // Only apply if still the active model (avoid races on rapid switches).
        if (get().currentModelId === id) set({ economics: deriveEconomics(model), modelScalar: model.modelScalar });
      }
    } catch {
      // Offline — keep the fallback economics already applied.
    }
  },
}));
