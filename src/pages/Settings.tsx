import { useState, useEffect } from 'react';
import { Copy, Check, Eye, EyeOff, Save, Loader2, Globe, Webhook, Shield, Download } from 'lucide-react';
import SectionHeader from '@/components/ui/SectionHeader';
import { usePartnerStore } from '@/stores/usePartnerStore';
import { useToastStore } from '@/stores/useToastStore';
import { REGIONS } from '@/utils/constants';

export default function Settings() {
  const { currentPartner } = usePartnerStore();
  const addToast = useToastStore((s) => s.addToast);
  const [showApiKey, setShowApiKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  // Controlled form state
  const [label, setLabel] = useState(currentPartner.label);
  const [industry, setIndustry] = useState(currentPartner.industry);
  const [maxCampaigns, setMaxCampaigns] = useState(String(currentPartner.settings.maxConcurrentCampaigns));
  const [notifications, setNotifications] = useState(currentPartner.settings.notifications);
  const [proofRetention, setProofRetention] = useState(String(currentPartner.settings.dataRetention.proofRetentionDays));
  const [auditRetention, setAuditRetention] = useState(String(currentPartner.settings.dataRetention.auditLogRetentionDays));
  const [regions, setRegions] = useState(currentPartner.settings.allowedRegions);

  // Webhook state
  const [webhookUrl, setWebhookUrl] = useState('https://api.example.com/webhooks/healthid');
  const [webhookEvents, setWebhookEvents] = useState({
    verification_completed: true,
    campaign_milestone: true,
    budget_threshold: false,
    proof_failed: true,
  });

  // Audit export state
  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv');

  // Reset when partner changes
  useEffect(() => {
    setLabel(currentPartner.label);
    setIndustry(currentPartner.industry);
    setMaxCampaigns(String(currentPartner.settings.maxConcurrentCampaigns));
    setNotifications(currentPartner.settings.notifications);
    setProofRetention(String(currentPartner.settings.dataRetention.proofRetentionDays));
    setAuditRetention(String(currentPartner.settings.dataRetention.auditLogRetentionDays));
    setRegions(currentPartner.settings.allowedRegions);
  }, [currentPartner]);

  // Dirty check
  const isDirty = label !== currentPartner.label
    || industry !== currentPartner.industry
    || maxCampaigns !== String(currentPartner.settings.maxConcurrentCampaigns)
    || JSON.stringify(notifications) !== JSON.stringify(currentPartner.settings.notifications)
    || proofRetention !== String(currentPartner.settings.dataRetention.proofRetentionDays)
    || auditRetention !== String(currentPartner.settings.dataRetention.auditLogRetentionDays)
    || JSON.stringify(regions) !== JSON.stringify(currentPartner.settings.allowedRegions);

  const maskedKey = `${currentPartner.apiKeyPrefix}${'*'.repeat(32)}`;
  const fullKey = `${currentPartner.apiKeyPrefix}a3f7b2c1d4e5f6a7b8c9d0e1f2a3b4c5`;

  const handleCopy = () => {
    navigator.clipboard.writeText(fullKey);
    setCopied(true);
    addToast({ message: 'API key copied to clipboard', variant: 'success' });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      addToast({ message: 'Settings saved successfully', variant: 'success' });
    }, 300);
  };

  const handleTestWebhook = () => {
    addToast({ message: 'Webhook test sent to endpoint', variant: 'success' });
  };

  const handleExport = () => {
    addToast({ message: `Audit export generated (${exportFormat.toUpperCase()})`, variant: 'success' });
  };

  return (
    <div className="flex flex-col gap-6 max-w-[720px]">
      <div className="flex items-center justify-between">
        <SectionHeader title="Settings" description="Partner configuration and API access management." />
        {isDirty && (
          <button onClick={handleSave} disabled={saving} className="btn-primary text-xs flex-shrink-0">
            {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        )}
      </div>

      {/* Partner Profile */}
      <section className="card space-y-4">
        <span className="metric-label block">Partner Profile</span>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-2xs text-tertiary block mb-1">Partner Label</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
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
            <select value={industry} onChange={(e) => setIndustry(e.target.value as typeof industry)} className="input-field w-full">
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
              value={maxCampaigns}
              onChange={(e) => setMaxCampaigns(e.target.value)}
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

      {/* Session & Access */}
      <section className="card space-y-3">
        <div className="flex items-center gap-1.5">
          <Shield size={12} className="text-tertiary" />
          <span className="metric-label">Session & Access</span>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <span className="text-2xs text-tertiary block">Last Login</span>
            <span className="text-sm text-secondary">Today, 09:14 AM</span>
          </div>
          <div>
            <span className="text-2xs text-tertiary block">Role</span>
            <span className="inline-flex items-center gap-1 badge bg-accent-dim border-accent/20 text-accent">Admin</span>
          </div>
          <div>
            <span className="text-2xs text-tertiary block">Active Sessions</span>
            <span className="text-sm text-secondary font-mono">1</span>
          </div>
        </div>
      </section>

      {/* Webhooks */}
      <section className="card space-y-3">
        <div className="flex items-center gap-1.5">
          <Webhook size={12} className="text-tertiary" />
          <span className="metric-label">Webhooks</span>
        </div>
        <div>
          <label className="text-2xs text-tertiary block mb-1">Endpoint URL</label>
          <input
            type="text"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            className="input-field w-full font-mono text-xs"
          />
        </div>
        <div>
          <label className="text-2xs text-tertiary block mb-1.5">Event Types</label>
          <div className="space-y-1.5">
            {Object.entries(webhookEvents).map(([key, checked]) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => setWebhookEvents({ ...webhookEvents, [key]: e.target.checked })}
                  className="accent-accent w-3.5 h-3.5"
                />
                <span className="text-xs text-secondary capitalize">{key.replace(/_/g, ' ')}</span>
              </label>
            ))}
          </div>
        </div>
        <button onClick={handleTestWebhook} className="btn-ghost text-xs">
          Test Webhook
        </button>
      </section>

      {/* Notifications */}
      <section className="card space-y-3">
        <span className="metric-label block">Notifications</span>
        <div className="space-y-2">
          {[
            { key: 'verificationAlerts' as const, label: 'Verification Alerts', desc: 'Notify when verifications complete or fail' },
            { key: 'budgetAlerts' as const, label: 'Budget Alerts', desc: 'Alert when budget utilization exceeds thresholds' },
            { key: 'weeklyDigest' as const, label: 'Weekly Digest', desc: 'Summary of campaign performance and treasury activity' },
            { key: 'complianceReports' as const, label: 'Compliance Reports', desc: 'Monthly compliance and audit summaries' },
          ].map((item) => (
            <label key={item.key} className="flex items-center justify-between py-1 cursor-pointer">
              <div>
                <span className="text-sm text-primary block">{item.label}</span>
                <span className="text-2xs text-tertiary">{item.desc}</span>
              </div>
              <input
                type="checkbox"
                checked={notifications[item.key]}
                onChange={(e) => setNotifications({ ...notifications, [item.key]: e.target.checked })}
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
                value={proofRetention}
                onChange={(e) => setProofRetention(e.target.value)}
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
                value={auditRetention}
                onChange={(e) => setAuditRetention(e.target.value)}
                className="input-field w-20 font-mono"
              />
              <span className="text-2xs text-tertiary">days</span>
            </div>
          </div>
        </div>
      </section>

      {/* Allowed Regions */}
      <section className="card space-y-3">
        <div className="flex items-center gap-1.5">
          <Globe size={12} className="text-tertiary" />
          <span className="metric-label">Allowed Regions</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {REGIONS.map((region) => {
            const isActive = regions.includes(region);
            return (
              <button
                key={region}
                onClick={() => {
                  setRegions(isActive ? regions.filter((r) => r !== region) : [...regions, region]);
                }}
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

      {/* Audit Export */}
      <section className="card space-y-3">
        <div className="flex items-center gap-1.5">
          <Download size={12} className="text-tertiary" />
          <span className="metric-label">Audit Export</span>
        </div>
        <div className="flex items-center gap-3">
          <div>
            <label className="text-2xs text-tertiary block mb-1">Format</label>
            <div className="flex gap-1">
              {(['csv', 'json'] as const).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => setExportFormat(fmt)}
                  className={`px-3 py-1 text-xs font-medium rounded border transition-colors ${
                    exportFormat === fmt
                      ? 'bg-accent/10 border-accent/30 text-accent'
                      : 'bg-base border-border text-tertiary hover:text-secondary'
                  }`}
                >
                  {fmt.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <div className="pt-4">
            <button onClick={handleExport} className="btn-primary text-xs">
              <Download size={13} /> Generate Export
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
