import { useState } from 'react';
import { Copy, Check, Eye, EyeOff } from 'lucide-react';
import SectionHeader from '@/components/ui/SectionHeader';
import { usePartnerStore } from '@/stores/usePartnerStore';
import { REGIONS } from '@/utils/constants';

export default function Settings() {
  const { currentPartner } = usePartnerStore();
  const [showApiKey, setShowApiKey] = useState(false);
  const [copied, setCopied] = useState(false);

  const maskedKey = `${currentPartner.apiKeyPrefix}${'*'.repeat(32)}`;
  const fullKey = `${currentPartner.apiKeyPrefix}a3f7b2c1d4e5f6a7b8c9d0e1f2a3b4c5`;

  const handleCopy = () => {
    navigator.clipboard.writeText(fullKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-6 max-w-[720px]">
      <SectionHeader title="Settings" description="Partner configuration and API access management." />

      {/* Partner Profile */}
      <section className="card space-y-4">
        <span className="metric-label block">Partner Profile</span>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-2xs text-tertiary block mb-1">Partner Label</label>
            <input
              type="text"
              defaultValue={currentPartner.label}
              className="input-field w-full"
            />
          </div>
          <div>
            <label className="text-2xs text-tertiary block mb-1">Tier</label>
            <div className="input-field w-full bg-elevated cursor-not-allowed text-tertiary capitalize">
              {currentPartner.tier}
            </div>
          </div>
          <div>
            <label className="text-2xs text-tertiary block mb-1">Industry</label>
            <select defaultValue={currentPartner.industry} className="input-field w-full">
              <option value="insurance">Insurance</option>
              <option value="pharma">Pharma</option>
              <option value="employer">Employer</option>
              <option value="research">Research</option>
              <option value="healthcare">Healthcare</option>
            </select>
          </div>
          <div>
            <label className="text-2xs text-tertiary block mb-1">Max Concurrent Campaigns</label>
            <input
              type="number"
              defaultValue={currentPartner.settings.maxConcurrentCampaigns}
              className="input-field w-full font-mono"
            />
          </div>
        </div>
      </section>

      {/* API Key */}
      <section className="card space-y-3">
        <span className="metric-label block">API Key</span>
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 bg-base border border-border rounded px-2 py-1.5">
            <code className="text-xs font-mono text-secondary flex-1 select-all">
              {showApiKey ? fullKey : maskedKey}
            </code>
            <button
              onClick={() => setShowApiKey(!showApiKey)}
              className="text-tertiary hover:text-secondary transition-colors"
            >
              {showApiKey ? <EyeOff size={13} /> : <Eye size={13} />}
            </button>
          </div>
          <button onClick={handleCopy} className="btn-ghost px-2">
            {copied ? <Check size={13} className="text-success" /> : <Copy size={13} />}
          </button>
        </div>
        <p className="text-2xs text-tertiary">
          Use this key to authenticate API requests. Keep it confidential.
        </p>
      </section>

      {/* Notifications */}
      <section className="card space-y-3">
        <span className="metric-label block">Notifications</span>
        <div className="space-y-2">
          {[
            { key: 'verificationAlerts', label: 'Verification Alerts', desc: 'Notify when verifications complete or fail' },
            { key: 'budgetAlerts', label: 'Budget Alerts', desc: 'Alert when budget utilization exceeds thresholds' },
            { key: 'weeklyDigest', label: 'Weekly Digest', desc: 'Summary of campaign performance and treasury activity' },
            { key: 'complianceReports', label: 'Compliance Reports', desc: 'Monthly compliance and audit summaries' },
          ].map((item) => (
            <label key={item.key} className="flex items-center justify-between py-1 cursor-pointer">
              <div>
                <span className="text-sm text-primary block">{item.label}</span>
                <span className="text-2xs text-tertiary">{item.desc}</span>
              </div>
              <input
                type="checkbox"
                defaultChecked={currentPartner.settings.notifications[item.key as keyof typeof currentPartner.settings.notifications]}
                className="accent-accent w-4 h-4"
              />
            </label>
          ))}
        </div>
      </section>

      {/* Data Retention */}
      <section className="card space-y-3">
        <span className="metric-label block">Data Retention</span>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-2xs text-tertiary block mb-1">Proof Retention</label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                defaultValue={currentPartner.settings.dataRetention.proofRetentionDays}
                className="input-field w-20 font-mono"
              />
              <span className="text-2xs text-tertiary">days</span>
            </div>
          </div>
          <div>
            <label className="text-2xs text-tertiary block mb-1">Audit Log Retention</label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                defaultValue={currentPartner.settings.dataRetention.auditLogRetentionDays}
                className="input-field w-20 font-mono"
              />
              <span className="text-2xs text-tertiary">days</span>
            </div>
          </div>
        </div>
      </section>

      {/* Allowed Regions */}
      <section className="card space-y-3">
        <span className="metric-label block">Allowed Regions</span>
        <div className="flex flex-wrap gap-2">
          {REGIONS.map((region) => {
            const isActive = currentPartner.settings.allowedRegions.includes(region);
            return (
              <button
                key={region}
                className={`badge cursor-pointer ${
                  isActive
                    ? 'bg-accent/10 border-accent/30 text-accent'
                    : 'bg-elevated border-border text-tertiary'
                }`}
              >
                {region}
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
