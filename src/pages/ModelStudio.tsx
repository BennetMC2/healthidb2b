import { useEffect, useMemo, useState } from 'react';
import { Layers, ShieldCheck, AlertTriangle, GitBranch, History, Check, X } from 'lucide-react';
import { useModelStore } from '@/stores/useModelStore';
import { ModelBadge } from '@/components/layout/ModelSwitcher';
import { PROVENANCE_FLAG } from '@shared/models';
import type { AssumptionItem } from '@shared/schema';
import {
  fetchModelDetail,
  patchAssumption,
  signOffModel,
  ownerForKey,
  OWNER_LABEL,
  inferProvenance,
  type ModelDetail,
  type StudioOwner,
} from '@/lib/modelStudio';

const TABS: StudioOwner[] = ['clinical', 'actuarial', 'program'];

// Model Studio — view + edit the active model's assumptions, organised by the
// three owner tabs, with provenance flags, the forward-fork diff vs the floor,
// a review checklist, edit→re-run with required rationale, and sign-off.
export default function ModelStudio() {
  const current = useModelStore((s) => s.currentModel());
  const modelId = current.id;
  const [detail, setDetail] = useState<ModelDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<StudioOwner>('clinical');
  const [editing, setEditing] = useState<AssumptionItem | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const reload = async () => {
    setLoading(true);
    const d = await fetchModelDetail(modelId);
    setDetail(d);
    setLoading(false);
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelId]);

  const rows = useMemo(
    () => (detail?.assumptions ?? []).filter((a) => ownerForKey(a.key) === tab),
    [detail, tab],
  );

  // Review checklist: unsourced (asserted) items + draft status (brief §2).
  const reviewItems = useMemo(() => {
    const a = detail?.assumptions ?? [];
    return a.filter((x) => inferProvenance(x.source) === 'asserted');
  }, [detail]);

  const isSigned = current.governanceStatus === 'signed';

  const flash = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  };

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-5">
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Layers size={18} className="text-accent" />
            <h1 className="text-lg font-semibold text-primary">Model Studio</h1>
            <ModelBadge />
          </div>
          <p className="mt-1 max-w-[640px] text-xs text-tertiary">
            {current.summary} Every number in the app is computed against the selected model. Edit an
            assumption to re-price live — each change is logged with a rationale.
          </p>
        </div>
        <SignOffButton
          signed={isSigned}
          onSign={async () => {
            const r = await signOffModel(modelId);
            if (r.ok) {
              useModelStore.setState((s) => ({
                models: s.models.map((m) => (m.id === modelId ? { ...m, governanceStatus: 'signed' } : m)),
              }));
              flash('Model signed off — now a governed floor.');
              reload();
            } else flash(r.error || 'Sign-off failed');
          }}
        />
      </div>

      {loading && <div className="py-12 text-center text-sm text-tertiary">Loading model…</div>}

      {!loading && !detail && (
        <div className="rounded border border-border bg-surface px-4 py-8 text-center text-sm text-tertiary">
          Live assumption detail needs the engine API. Run <code className="text-secondary">npm run dev</code> or
          the deployed app to view and edit assumptions.
        </div>
      )}

      {!loading && detail && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
          {/* Assumptions by owner */}
          <div className="rounded border border-border bg-surface">
            <div className="flex border-b border-border">
              {TABS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-3 py-2 text-xs font-medium transition-colors ${
                    tab === t ? 'border-b-2 border-accent text-primary' : 'text-tertiary hover:text-secondary'
                  }`}
                >
                  {OWNER_LABEL[t]}
                </button>
              ))}
            </div>
            <div className="divide-y divide-border">
              {rows.length === 0 && (
                <div className="px-4 py-6 text-center text-xs text-tertiary">No {OWNER_LABEL[tab]} assumptions.</div>
              )}
              {rows.map((row) => (
                <AssumptionRow
                  key={row.key}
                  row={row}
                  diff={detail.adjustments.find((adj) => adj.label && row.label.includes(adj.label.split(' ')[0]))}
                  editable={!isSigned && row.editable}
                  onEdit={() => setEditing(row)}
                />
              ))}
            </div>
          </div>

          {/* Side: forward diff, review checklist, change log */}
          <div className="space-y-4">
            {detail.adjustments.length > 0 && (
              <Panel title="Diff vs. floor" icon={<GitBranch size={13} className="text-amber-500" />}>
                {detail.adjustments.map((adj) => (
                  <div key={adj.path} className="border-b border-border/60 px-3 py-2 last:border-0">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="text-secondary">{adj.label}</span>
                      <span className="font-mono text-2xs text-tertiary">
                        {String(adj.fromValue)} → <span className="text-amber-500">{String(adj.toValue)}</span>
                      </span>
                    </div>
                    <p className="mt-0.5 text-2xs leading-snug text-tertiary">{adj.rationale}</p>
                  </div>
                ))}
              </Panel>
            )}

            <Panel
              title={`Review checklist (${reviewItems.length})`}
              icon={<AlertTriangle size={13} className="text-amber-500" />}
            >
              {reviewItems.length === 0 ? (
                <div className="px-3 py-3 text-2xs text-tertiary">No unsourced assumptions outstanding.</div>
              ) : (
                reviewItems.map((r) => (
                  <div key={r.key} className="border-b border-border/60 px-3 py-1.5 text-2xs last:border-0">
                    <span className="text-amber-500">🟠</span> <span className="text-secondary">{r.label}</span>
                    <span className="text-tertiary"> — no external source</span>
                  </div>
                ))
              )}
            </Panel>

            {detail.changeLog.length > 0 && (
              <Panel title={`Change log (${detail.changeLog.length})`} icon={<History size={13} className="text-accent" />}>
                {detail.changeLog.slice().reverse().map((e) => (
                  <div key={e.id} className="border-b border-border/60 px-3 py-2 text-2xs last:border-0">
                    <div className="text-secondary">
                      {e.label}: <span className="font-mono text-tertiary">{String(e.fromValue)} → {String(e.toValue)}</span>
                    </div>
                    <div className="text-tertiary">{e.rationale}</div>
                    <div className="text-tertiary/70">— {e.actor}</div>
                  </div>
                ))}
              </Panel>
            )}
          </div>
        </div>
      )}

      {editing && (
        <EditModal
          row={editing}
          onClose={() => setEditing(null)}
          onSave={async (toValue, rationale) => {
            const path = STUDIO_PATHS[editing.key];
            if (!path) {
              flash('This assumption is display-only (no engine path).');
              setEditing(null);
              return;
            }
            const r = await patchAssumption(modelId, { path, label: editing.label, toValue, rationale });
            if (r.ok) {
              flash(`${editing.label} updated — model re-prices on next run.`);
              setEditing(null);
              reload();
            } else flash(r.error || 'Edit failed');
          }}
        />
      )}

      {toast && (
        <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded border border-accent/30 bg-elevated px-3 py-2 text-xs text-secondary shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}

// Map register keys → engine dotted paths the PATCH endpoint understands. Only
// keys with a real engine path are editable; others are display-only.
const STUDIO_PATHS: Record<string, string> = {
  claimsBridgeAnnualDelta: 'economic.claimsBridge.steps.annualClaimsDeltaUSD',
  claimsBridgeApplicablePrevalence: 'economic.claimsBridge.steps.applicablePrevalence',
  claimsBridgeAttributionFactor: 'economic.claimsBridge.steps.attributionFactor',
  discountRatePct: 'economic.discounting.discountRatePct',
  valuationHorizonYears: 'economic.discounting.valuationHorizonYears',
  persistedSavingsYears: 'economic.persistedSavingsYears',
  rewardCostRatio: 'economic.rewardCostRatio',
  faderPartCreditPct: 'economic.faderPartCreditPct',
  sumAssured: 'lifeInsurance.sumAssured',
  annualPremium: 'lifeInsurance.annualPremium',
  baselineAnnualMortalityRate: 'lifeInsurance.baselineAnnualMortalityRate',
  mortalityRelativeReduction: 'lifeInsurance.mortalityMargin.relativeReductionPer1kSteps',
  mortalityAttributionFactor: 'lifeInsurance.mortalityMargin.attributionFactor',
  mortalityHighRiskRelativity: 'lifeInsurance.mortalityMargin.highRiskRelativity',
};

function Panel({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded border border-border bg-surface">
      <div className="flex items-center gap-1.5 border-b border-border px-3 py-2 text-2xs font-semibold uppercase tracking-wider text-tertiary">
        {icon}
        {title}
      </div>
      <div>{children}</div>
    </div>
  );
}

function AssumptionRow({
  row,
  diff,
  editable,
  onEdit,
}: {
  row: AssumptionItem;
  diff?: { fromValue: number | string; toValue: number | string };
  editable: boolean;
  onEdit: () => void;
}) {
  const prov = inferProvenance(row.source);
  const flag = PROVENANCE_FLAG[prov];
  return (
    <div className="px-4 py-2.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span title={flag.label}>{flag.glyph}</span>
            <span className="truncate text-xs font-medium text-secondary">{row.label}</span>
            {diff && <span className="rounded bg-amber-400/10 px-1 text-2xs text-amber-500">forked</span>}
          </div>
          <p className="mt-0.5 line-clamp-2 text-2xs leading-snug text-tertiary">{row.source}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <div className="text-right">
            <div className="font-mono text-xs text-primary">{String(row.value)}</div>
            <div className="text-[10px] text-tertiary">{row.unit}</div>
          </div>
          {editable ? (
            <button
              onClick={onEdit}
              className="rounded border border-border px-2 py-1 text-2xs text-tertiary hover:border-accent/40 hover:text-secondary"
            >
              Edit
            </button>
          ) : (
            <span className="w-[34px]" />
          )}
        </div>
      </div>
    </div>
  );
}

function SignOffButton({ signed, onSign }: { signed: boolean; onSign: () => void }) {
  if (signed) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1.5 text-xs text-emerald-500">
        <ShieldCheck size={13} /> Signed floor
      </span>
    );
  }
  return (
    <button
      onClick={onSign}
      className="inline-flex items-center gap-1.5 rounded border border-accent/40 bg-accent/10 px-2.5 py-1.5 text-xs text-accent hover:bg-accent/20"
    >
      <ShieldCheck size={13} /> Sign off this model
    </button>
  );
}

function EditModal({
  row,
  onClose,
  onSave,
}: {
  row: AssumptionItem;
  onClose: () => void;
  onSave: (toValue: number | string, rationale: string) => void;
}) {
  const numeric = typeof row.value === 'number';
  const [value, setValue] = useState(String(row.value));
  const [rationale, setRationale] = useState('');
  const valid = rationale.trim().length > 3 && value.trim().length > 0 && (!numeric || !Number.isNaN(Number(value)));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-[440px] rounded-lg border border-border bg-surface p-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-primary">Edit · {row.label}</h3>
          <button onClick={onClose} className="text-tertiary hover:text-secondary">
            <X size={16} />
          </button>
        </div>
        <label className="mb-1 block text-2xs uppercase tracking-wider text-tertiary">New value ({row.unit})</label>
        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          inputMode={numeric ? 'decimal' : 'text'}
          className="mb-3 w-full rounded border border-border bg-base px-2 py-1.5 font-mono text-sm text-primary focus:border-accent/40 focus:outline-none"
        />
        <label className="mb-1 block text-2xs uppercase tracking-wider text-tertiary">Rationale (required)</label>
        <textarea
          value={rationale}
          onChange={(e) => setRationale(e.target.value)}
          rows={3}
          placeholder="Why this value? Source, analogy, or assumption being made."
          className="mb-3 w-full resize-none rounded border border-border bg-base px-2 py-1.5 text-xs text-secondary focus:border-accent/40 focus:outline-none"
        />
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="rounded border border-border px-3 py-1.5 text-xs text-tertiary hover:text-secondary">
            Cancel
          </button>
          <button
            disabled={!valid}
            onClick={() => onSave(numeric ? Number(value) : value, rationale.trim())}
            className="inline-flex items-center gap-1.5 rounded bg-accent px-3 py-1.5 text-xs font-medium text-white disabled:opacity-40"
          >
            <Check size={13} /> Apply & re-price
          </button>
        </div>
      </div>
    </div>
  );
}
