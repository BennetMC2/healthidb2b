import { X, Activity, Shield, Database, Users, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ReputationBadge } from '@/components/ui/Badge';
import LiveProofButton from '@/components/proof/LiveProofButton';
import { formatNumber, formatRelativeTime } from '@/utils/format';
import { DATA_SOURCE_LABELS, REPUTATION_TIER_LABELS } from '@/utils/constants';
import type { HealthIdentity } from '@/types';

interface IdentityDetailDrawerProps {
  identity: HealthIdentity | null;
  onClose: () => void;
}

export default function IdentityDetailDrawer({ identity, onClose }: IdentityDetailDrawerProps) {
  return (
    <AnimatePresence>
      {identity && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-40 bg-primary/20 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          {/* Drawer */}
          <motion.div
            className="fixed right-0 top-0 bottom-0 z-50 w-[min(380px,92vw)] bg-surface border-l border-border shadow-lg overflow-auto scrollbar-thin"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border sticky top-0 bg-surface z-10">
              <div className="flex items-center gap-2">
                <Shield size={14} className="text-accent" />
                <span className="text-sm font-semibold text-primary">Identity Detail</span>
              </div>
              <button onClick={onClose} className="w-6 h-6 flex items-center justify-center rounded text-tertiary hover:text-secondary hover:bg-hover transition-colors">
                <X size={14} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Identity ID */}
              <div>
                <span className="text-2xs text-tertiary block mb-0.5">Anonymized ID</span>
                <span className="font-mono text-sm text-accent">{identity.anonymizedId}</span>
              </div>

              {/* Health Score + Trust Tier */}
              <div className="grid grid-cols-2 gap-3">
                <div className="card-elevated">
                  <div className="flex items-center gap-1 mb-1">
                    <Activity size={11} className="text-accent" />
                    <span className="text-2xs text-tertiary">Health Score</span>
                  </div>
                  <span className={`font-mono text-xl font-bold ${
                    identity.healthScore >= 80 ? 'text-health-excellent' :
                    identity.healthScore >= 60 ? 'text-health-good' :
                    identity.healthScore >= 40 ? 'text-health-moderate' : 'text-health-poor'
                  }`}>
                    {identity.healthScore}
                  </span>
                </div>
                <div className="card-elevated">
                  <div className="flex items-center gap-1 mb-1">
                    <Shield size={11} className="text-accent" />
                    <span className="text-2xs text-tertiary">Trust Tier</span>
                  </div>
                  <ReputationBadge tier={identity.reputationTier} />
                  <div className="text-2xs text-tertiary mt-0.5">{REPUTATION_TIER_LABELS[identity.reputationTier]}</div>
                </div>
              </div>

              {/* Demographics */}
              <div className="card-elevated">
                <div className="flex items-center gap-1 mb-2">
                  <Users size={11} className="text-tertiary" />
                  <span className="text-2xs text-tertiary">Demographics</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <span className="text-2xs text-tertiary block">Age</span>
                    <span className="text-xs text-secondary">{identity.demographics.ageRange}</span>
                  </div>
                  <div>
                    <span className="text-2xs text-tertiary block">Gender</span>
                    <span className="text-xs text-secondary capitalize">{identity.demographics.gender}</span>
                  </div>
                  <div>
                    <span className="text-2xs text-tertiary block">Region</span>
                    <span className="text-xs text-secondary">{identity.demographics.region}</span>
                  </div>
                </div>
              </div>

              {/* Risk Cohort */}
              <div>
                <span className="text-2xs text-tertiary block mb-1">Risk Cohort</span>
                <span className="badge bg-accent-dim border-accent/20 text-accent">{identity.riskCohort}</span>
              </div>

              {/* Connected Sources */}
              <div>
                <div className="flex items-center gap-1 mb-1.5">
                  <Database size={11} className="text-tertiary" />
                  <span className="text-2xs text-tertiary">Connected Sources ({identity.connectedSources.length})</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {identity.connectedSources.map((src) => (
                    <span key={src} className="badge bg-elevated border-border text-secondary">
                      {DATA_SOURCE_LABELS[src]}
                    </span>
                  ))}
                </div>
              </div>

              {/* Verification History */}
              <div className="grid grid-cols-3 gap-3">
                <div className="card-elevated text-center">
                  <span className="font-mono text-lg font-bold text-primary">{formatNumber(identity.verificationCount)}</span>
                  <span className="text-2xs text-tertiary block">Verifications</span>
                </div>
                <div className="card-elevated text-center">
                  <span className="font-mono text-lg font-bold text-primary">{identity.enrolledCampaigns}</span>
                  <span className="text-2xs text-tertiary block">Campaigns</span>
                </div>
                <div className="card-elevated text-center">
                  <div className="flex items-center justify-center gap-0.5">
                    <Calendar size={10} className="text-tertiary" />
                  </div>
                  <span className="text-2xs text-secondary block mt-0.5">
                    {identity.lastVerified ? formatRelativeTime(identity.lastVerified) : 'Never'}
                  </span>
                  <span className="text-2xs text-tertiary block">Last Verified</span>
                </div>
              </div>

              {/* Live Proof Button */}
              <div className="pt-2 border-t border-border">
                <LiveProofButton variant="primary" size="sm" className="w-full justify-center" />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
