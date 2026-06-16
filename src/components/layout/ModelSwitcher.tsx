import { useEffect } from 'react';
import { Layers } from 'lucide-react';
import { useModelStore } from '@/stores/useModelStore';
import { useToastStore } from '@/stores/useToastStore';
import { modelTrustTone } from '@shared/models';
import type { ModelMeta } from '@shared/models';

// Trust tone → visual treatment for the badge/label (brief §3).
function toneClasses(meta: ModelMeta): string {
  switch (modelTrustTone(meta)) {
    case 'projected':
      return 'border-amber-400/30 bg-amber-400/10 text-amber-500';
    case 'exploratory':
      return 'border-fuchsia-400/30 bg-fuchsia-400/10 text-fuchsia-500';
    default:
      return 'border-accent/20 bg-accent/10 text-accent';
  }
}

function toneLabel(meta: ModelMeta): string | null {
  switch (modelTrustTone(meta)) {
    case 'projected':
      return 'Projected';
    case 'exploratory':
      return 'Exploratory — internal only';
    default:
      return null;
  }
}

// Persistent "Model: {name}" badge — travels on every screen and every export
// so an upside number can never be mistaken for the base case (brief §3).
export function ModelBadge({ className = '' }: { className?: string }) {
  const current = useModelStore((s) => s.currentModel());
  const tone = toneLabel(current);
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.08em] ${toneClasses(current)} ${className}`}
      title={current.summary}
    >
      <Layers size={11} />
      <span>Model: {current.name}</span>
      {tone && <span className="opacity-70">· {tone}</span>}
      {current.governanceStatus === 'draft' && <span className="opacity-70">· Draft</span>}
    </span>
  );
}

// The header dropdown that switches the active Model app-wide.
export default function ModelSwitcher() {
  const { models, currentModelId, setCurrentModel, hydrate, buyerContext } = useModelStore();
  const current = useModelStore((s) => s.currentModel());
  const addToast = useToastStore((s) => s.addToast);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <div className="hidden items-center gap-1.5 sm:flex">
      <select
        value={currentModelId}
        onChange={(e) => {
          setCurrentModel(e.target.value);
          // Make the re-price visible — the switch otherwise changes numbers silently.
          const next = models.find((m) => m.id === e.target.value);
          if (next) addToast({ message: `Re-priced against ${next.name}`, variant: 'default' });
        }}
        className={`h-[30px] max-w-[200px] cursor-pointer rounded border bg-base px-2 text-xs focus:outline-none ${toneClasses(current)}`}
        title={current.summary}
      >
        {models.map((m) => {
          const disabled = buyerContext && !m.selectableInBuyerContext;
          return (
            <option key={m.id} value={m.id} disabled={disabled}>
              {m.name}
              {m.confidencePosture === 'ceiling' ? ' (projected)' : ''}
              {disabled ? ' — internal' : ''}
            </option>
          );
        })}
      </select>
    </div>
  );
}
