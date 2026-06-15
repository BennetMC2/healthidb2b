import type { AssumptionItem } from '@shared/schema';
import type { ModelAdjustment, ModelChangeLogEntry, ModelMeta, ProvenanceType } from '@shared/models';

// Client helpers for the Model Studio (talks to the /api/models endpoints).

export interface ModelDetail {
  meta: ModelMeta;
  adjustments: ModelAdjustment[];
  assumptions: AssumptionItem[];
  changeLog: ModelChangeLogEntry[];
}

export async function fetchModelDetail(modelId: string): Promise<ModelDetail | null> {
  try {
    const res = await fetch(`/api/models/${encodeURIComponent(modelId)}`);
    if (!res.ok) return null;
    return (await res.json()) as ModelDetail;
  } catch {
    return null;
  }
}

export async function patchAssumption(
  modelId: string,
  body: { path: string; label: string; toValue: number | string; rationale: string },
): Promise<{ ok: boolean; error?: string; entry?: ModelChangeLogEntry }> {
  try {
    const res = await fetch(`/api/models/${encodeURIComponent(modelId)}/assumptions`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data?.error || 'edit failed' };
    return { ok: true, entry: data.entry };
  } catch {
    return { ok: false, error: 'network error' };
  }
}

export async function signOffModel(modelId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`/api/models/${encodeURIComponent(modelId)}/signoff`, { method: 'POST' });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data?.error || 'sign-off failed' };
    return { ok: true };
  } catch {
    return { ok: false, error: 'network error' };
  }
}

// --- presentation helpers -----------------------------------------------------

// The three owner tabs from the expert spec (brief §2). Maps an assumption key
// to its owning discipline.
export type StudioOwner = 'clinical' | 'actuarial' | 'program';

export function ownerForKey(key: string): StudioOwner {
  const k = key.toLowerCase();
  if (k.startsWith('mortality') || k.startsWith('claimsbridge') || k.includes('attribution') || k.includes('prevalence')) {
    return 'clinical';
  }
  if (
    k.startsWith('reward') || k.startsWith('costbasis') || k.startsWith('groupproductivity') ||
    k.startsWith('wearable') || k.includes('market')
  ) {
    return 'program';
  }
  return 'actuarial';
}

export const OWNER_LABEL: Record<StudioOwner, string> = {
  clinical: 'Clinical (CMO)',
  actuarial: 'Actuarial',
  program: 'Program',
};

// Heuristic provenance classification from the assumption's source text. The
// assumption register carries a free-text `source`; until provenance is stored
// structurally, we infer the flag from cues (literature citations vs. proxy
// mappings vs. unsourced assertions).
export function inferProvenance(source: string): ProvenanceType {
  const s = source.toLowerCase();
  if (/replace with|illustrative|hook|prototype|default(?!s)/.test(s) && !/\b(19|20)\d\d\b/.test(s)) {
    return 'asserted';
  }
  if (/proxy|mapped|analog|stand-in|pending|disclosed/.test(s)) return 'proxy';
  if (/\b(19|20)\d\d\b|rct|meta-analysis|cohort|jama|nejm|lancet|qje|cdc|kff|meps|study|evidence/.test(s)) {
    return 'literature';
  }
  return 'asserted';
}
