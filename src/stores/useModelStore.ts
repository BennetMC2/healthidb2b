import { create } from 'zustand';
import type { ModelSummary } from '@shared/models';
import { isBuyerSelectable } from '@shared/models';

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
  // Buyer/demo context gates internal_only models out of the switcher.
  buyerContext: boolean;
  setCurrentModel: (id: string) => void;
  hydrate: () => Promise<void>;
  currentModel: () => ModelSummary;
}

export const useModelStore = create<ModelStore>((set, get) => ({
  models: FALLBACK_MODELS,
  currentModelId: DEFAULT_MODEL_ID,
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
    set({ currentModelId: id });
  },
  hydrate: async () => {
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
}));
