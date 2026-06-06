import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EVIDENCE_LIBRARY } from '../data/evidence';
import EvidenceCard from '../components/EvidenceCard';
import { STUDY_DESIGN_LABELS } from '../constants';
import type { StudyDesign } from '../types';

export default function EvidenceLibrary() {
  const navigate = useNavigate();
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [designFilter, setDesignFilter] = useState<string>('all');
  const [levelFilter, setLevelFilter] = useState<string>('all');

  const categories = ['all', ...new Set(EVIDENCE_LIBRARY.flatMap((e) => e.metricCategories))];
  const designs = ['all', ...new Set(EVIDENCE_LIBRARY.map((e) => e.studyDesign))];
  const levels = ['all', 'high', 'medium', 'low'];

  const filtered = EVIDENCE_LIBRARY.filter((e) => {
    if (categoryFilter !== 'all' && !e.metricCategories.includes(categoryFilter)) return false;
    if (designFilter !== 'all' && e.studyDesign !== designFilter) return false;
    if (levelFilter !== 'all' && e.evidenceLevel !== levelFilter) return false;
    return true;
  });

  const totalSamples = EVIDENCE_LIBRARY.reduce((sum, e) => sum + e.sampleSize, 0);

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Summary */}
      <div className="card flex items-center gap-6">
        <div>
          <div className="text-2xs text-tertiary">Total Citations</div>
          <div className="text-2xl font-semibold text-primary font-display">{EVIDENCE_LIBRARY.length}</div>
        </div>
        <div>
          <div className="text-2xs text-tertiary">Total Sample Size</div>
          <div className="text-2xl font-semibold text-primary font-display">{totalSamples.toLocaleString()}</div>
        </div>
        <div>
          <div className="text-2xs text-tertiary">High Evidence</div>
          <div className="text-2xl font-semibold text-green-500 font-display">
            {EVIDENCE_LIBRARY.filter((e) => e.evidenceLevel === 'high').length}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div>
          <label className="text-2xs text-tertiary block mb-1">Category</label>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-primary"
          >
            {categories.map((c) => (
              <option key={c} value={c}>{c === 'all' ? 'All Categories' : c.charAt(0).toUpperCase() + c.slice(1)}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-2xs text-tertiary block mb-1">Study Design</label>
          <select
            value={designFilter}
            onChange={(e) => setDesignFilter(e.target.value)}
            className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-primary"
          >
            <option value="all">All Designs</option>
            {designs.filter((d) => d !== 'all').map((d) => (
              <option key={d} value={d}>{STUDY_DESIGN_LABELS[d as StudyDesign]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-2xs text-tertiary block mb-1">Evidence Level</label>
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-primary"
          >
            {levels.map((l) => (
              <option key={l} value={l}>{l === 'all' ? 'All Levels' : l.charAt(0).toUpperCase() + l.slice(1)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Evidence cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((evidence) => (
          <EvidenceCard key={evidence.id} evidence={evidence} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-10 text-sm text-tertiary">No evidence matches the selected filters.</div>
      )}

      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/simulator/build/3')} className="btn-primary text-sm">Select Campaigns →</button>
        <button onClick={() => navigate('/simulator')} className="btn-ghost text-sm">← Overview</button>
      </div>
    </div>
  );
}
