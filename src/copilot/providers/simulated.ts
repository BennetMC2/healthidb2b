import type { CopilotProvider, Message, DataContext } from '../types';

// ── Intent classification ───────────────────────────────────────────

type Intent =
  | 'campaigns_overview'
  | 'campaigns_performance'
  | 'identities_overview'
  | 'identities_tiers'
  | 'identities_demographics'
  | 'verifications_overview'
  | 'verifications_success_rate'
  | 'verifications_speed'
  | 'treasury_balance'
  | 'treasury_yield'
  | 'compliance_overview'
  | 'compliance_failures'
  | 'greeting'
  | 'help'
  | 'unknown';

const INTENT_PATTERNS: [RegExp, Intent][] = [
  // Campaigns
  [/campaign.*(overview|summary|status|how many)/i, 'campaigns_overview'],
  [/(campaign|funnel).*(perform|convert|metric|roi|result|progress)/i, 'campaigns_performance'],
  [/how.*(campaign|program)/i, 'campaigns_overview'],

  // Identities
  [/(identit|network|user|participant).*(overview|summary|how many|total|count)/i, 'identities_overview'],
  [/(tier|reputation|diamond|platinum|gold|silver|bronze)/i, 'identities_tiers'],
  [/(demograph|age|gender|region)/i, 'identities_demographics'],

  // Verifications
  [/(verif|proof).*(overview|summary|how many|total|status)/i, 'verifications_overview'],
  [/(success|pass|fail|rate|accuracy)/i, 'verifications_success_rate'],
  [/(speed|fast|time|latency|generation|ms|millisecond)/i, 'verifications_speed'],

  // Treasury
  [/(treasur|balance|budget|fund|money|spend)/i, 'treasury_balance'],
  [/(yield|return|multiply|apy|interest|accru)/i, 'treasury_yield'],
  [/(roi|return on|program roi|wellness roi)/i, 'treasury_yield'],

  // Compliance
  [/(compliance|audit|regulation|hipaa|gdpr|pii|phi|breach|risk|exposure)/i, 'compliance_overview'],
  [/(fail|error|reject|issue).*(compliance|proof|audit)/i, 'compliance_failures'],
  [/(compliance|audit).*(fail|error|issue)/i, 'compliance_failures'],

  // Recruitment / enrollment (maps to campaigns performance)
  [/(recruit|enroll|cohort)/i, 'campaigns_performance'],

  // Engagement / wellness (maps to campaigns overview)
  [/(engage|wellness|employee)/i, 'campaigns_overview'],

  // Meta
  [/^(hi|hello|hey|greetings|good morning|good afternoon)/i, 'greeting'],
  [/(help|what can you|how do i|capabilities)/i, 'help'],
];

function classifyIntent(text: string): Intent {
  for (const [pattern, intent] of INTENT_PATTERNS) {
    if (pattern.test(text)) return intent;
  }
  return 'unknown';
}

// ── Response builders ───────────────────────────────────────────────

type ResponseBuilder = (ctx: DataContext) => string;

function fmt(n: number): string {
  return n.toLocaleString('en-US');
}

function pct(n: number): string {
  return `${n}%`;
}

function usd(n: number): string {
  return `$${fmt(n)}`;
}

const RESPONSE_BUILDERS: Record<Intent, ResponseBuilder> = {
  campaigns_overview: (ctx) => {
    const c = ctx.campaigns;
    return [
      `**Campaign Overview** for ${ctx.partner.name}\n`,
      `You have **${c.total} campaigns** total:`,
      `- **${c.active}** active`,
      `- **${c.completed}** completed`,
      `- **${c.draft}** in draft`,
      c.paused > 0 ? `- **${c.paused}** paused` : null,
      '',
      `Total budget allocated: **${usd(c.totalBudget)}**`,
      `Total spent: **${usd(c.totalSpent)}** (${Math.round((c.totalSpent / c.totalBudget) * 100)}% utilized)`,
      c.topCampaign ? `\nTop performing campaign: **${c.topCampaign}**` : null,
    ].filter(Boolean).join('\n');
  },

  campaigns_performance: (ctx) => {
    const c = ctx.campaigns;
    const v = ctx.verifications;
    const utilization = c.totalBudget > 0 ? Math.round((c.totalSpent / c.totalBudget) * 100) : 0;
    return [
      `**Campaign Performance** for ${ctx.partner.name}\n`,
      `Across **${c.active} active campaigns**:`,
      `- **${fmt(v.total)}** verifications processed`,
      `- **${pct(v.successRate)}** verification success rate`,
      `- Average proof generation: **${fmt(v.avgProofTimeMs)}ms**`,
      `- Budget utilization: **${pct(utilization)}**`,
      '',
      c.topCampaign ? `Your top campaign is **${c.topCampaign}** by verified participants.` : '',
      v.successRate >= 85
        ? '\nYour verification success rate is strong — well above the 80% benchmark.'
        : '\nConsider reviewing failed verifications to improve your success rate.',
    ].filter(Boolean).join('\n');
  },

  identities_overview: (ctx) => {
    const i = ctx.identities;
    return [
      `**Network Overview**\n`,
      `The HealthID network has **${fmt(i.total)} health identities**.`,
      `- Average health score: **${i.avgHealthScore}/100**`,
      `- Top data sources: ${i.topSources.map((s) => `**${s.replace(/_/g, ' ')}**`).join(', ')}`,
      '',
      'Reputation tier distribution:',
      ...Object.entries(i.byTier)
        .sort(([, a], [, b]) => b - a)
        .map(([tier, count]) => `- ${tier.charAt(0).toUpperCase() + tier.slice(1)}: **${fmt(count)}** (${Math.round((count / i.total) * 100)}%)`),
    ].join('\n');
  },

  identities_tiers: (ctx) => {
    const i = ctx.identities;
    return [
      `**Reputation Tier Breakdown**\n`,
      ...Object.entries(i.byTier)
        .sort(([, a], [, b]) => b - a)
        .map(([tier, count]) => `- **${tier.charAt(0).toUpperCase() + tier.slice(1)}**: ${fmt(count)} identities (${Math.round((count / i.total) * 100)}%)`),
      '',
      `The network follows a power-law distribution — most identities are Bronze/Silver, with Diamond representing the most engaged and verified participants.`,
    ].join('\n');
  },

  identities_demographics: (ctx) => {
    const i = ctx.identities;
    return [
      `**Network Demographics**\n`,
      `Across **${fmt(i.total)}** identities:`,
      `- Average health score: **${i.avgHealthScore}/100**`,
      `- Top connected sources: ${i.topSources.map((s) => `**${s.replace(/_/g, ' ')}**`).join(', ')}`,
      '',
      `Demographics are collected through connected wearables and self-reported data. All demographic data is anonymized and only accessible through zero-knowledge proofs.`,
    ].join('\n');
  },

  verifications_overview: (ctx) => {
    const v = ctx.verifications;
    return [
      `**Verification Overview** for ${ctx.partner.name}\n`,
      `Total verifications: **${fmt(v.total)}**`,
      `- Verified: **${fmt(v.verified)}** (${pct(v.successRate)})`,
      `- Pending: **${fmt(v.pending)}**`,
      `- Failed: **${fmt(v.failed)}**`,
      `- Expired: **${fmt(v.expired)}**`,
      '',
      'Proof type distribution:',
      ...Object.entries(v.byProofType).map(
        ([type, count]) => `- ${type.replace(/_/g, ' ')}: **${fmt(count)}** (${Math.round((count / v.total) * 100)}%)`,
      ),
      '',
      `Average proof generation time: **${fmt(v.avgProofTimeMs)}ms**`,
    ].join('\n');
  },

  verifications_success_rate: (ctx) => {
    const v = ctx.verifications;
    const quality = v.successRate >= 90 ? 'excellent' : v.successRate >= 80 ? 'good' : 'needs attention';
    return [
      `**Verification Success Rate**\n`,
      `Your current success rate is **${pct(v.successRate)}** — rated **${quality}**.`,
      '',
      `Out of **${fmt(v.total)}** verifications:`,
      `- **${fmt(v.verified)}** passed`,
      `- **${fmt(v.failed)}** failed`,
      `- **${fmt(v.pending)}** still pending`,
      '',
      v.successRate >= 85
        ? 'Your verification pipeline is performing well. The zero-knowledge proof system is maintaining high accuracy.'
        : 'Consider reviewing campaign criteria and data source requirements to improve pass rates.',
    ].join('\n');
  },

  verifications_speed: (ctx) => {
    const v = ctx.verifications;
    const speed = v.avgProofTimeMs < 250 ? 'excellent' : v.avgProofTimeMs < 400 ? 'good' : 'typical';
    return [
      `**Verification Speed**\n`,
      `Average proof generation time: **${fmt(v.avgProofTimeMs)}ms** — rated **${speed}**.`,
      '',
      `This is compared to traditional verification methods that take **2-4 weeks** on average.`,
      `Zero-knowledge proofs enable cryptographic verification without data transfer or manual review.`,
      '',
      'Proof type breakdown:',
      ...Object.entries(v.byProofType).map(
        ([type, count]) => `- ${type.replace(/_/g, ' ')}: **${fmt(count)}** proofs`,
      ),
    ].join('\n');
  },

  treasury_balance: (ctx) => {
    const t = ctx.treasury;
    return [
      `**Treasury Balance**\n`,
      `Total budget: **${usd(t.totalBudget)}**`,
      `Available balance: **${usd(t.availableBalance)}**`,
      `Points distributed: **${fmt(t.pointsDistributed)}** HP`,
      '',
      `Yield generated: **${usd(t.yieldGenerated)}** at **${(t.yieldRate * 100).toFixed(1)}%** APY`,
      `Value multiplier: **${t.valueMultiplier}x** — every dollar you deposit generates ${t.valueMultiplier}x in verified health outcomes.`,
    ].join('\n');
  },

  treasury_yield: (ctx) => {
    const t = ctx.treasury;
    return [
      `**Treasury Yield & Returns**\n`,
      `Current yield rate: **${(t.yieldRate * 100).toFixed(1)}% APY**`,
      `Total yield generated: **${usd(t.yieldGenerated)}**`,
      `Value multiplier: **${t.valueMultiplier}x**`,
      '',
      `Your treasury earns yield on undeployed funds, which is automatically reinvested to maximize the value of your health verification budget.`,
      '',
      `Available balance earning yield: **${usd(t.availableBalance)}**`,
    ].join('\n');
  },

  compliance_overview: (ctx) => {
    const c = ctx.compliance;
    return [
      `**Compliance Overview** for ${ctx.partner.name}\n`,
      `Total compliance records: **${fmt(c.totalRecords)}**`,
      `PII access events: **${c.piiAccessEvents}** (zero — as guaranteed by ZK architecture)`,
      '',
      'Event breakdown:',
      ...Object.entries(c.byEventType)
        .sort(([, a], [, b]) => b - a)
        .map(([type, count]) => `- ${type.replace(/_/g, ' ')}: **${fmt(count)}**`),
      '',
      c.recentFailures > 0
        ? `**${c.recentFailures}** proof failures in the last 30 days — review recommended.`
        : 'No proof failures in the last 30 days — your compliance posture is clean.',
    ].join('\n');
  },

  compliance_failures: (ctx) => {
    const c = ctx.compliance;
    return [
      `**Compliance Failures**\n`,
      c.recentFailures > 0
        ? `There have been **${c.recentFailures}** proof failures in the last 30 days.`
        : 'There are **no proof failures** in the last 30 days.',
      '',
      `Total proof failures overall: **${fmt(c.byEventType['proof_failed'] || 0)}**`,
      `Total compliance records: **${fmt(c.totalRecords)}**`,
      '',
      `PII exposure: **0 events** — the zero-knowledge architecture ensures no personally identifiable information is ever accessed or stored.`,
    ].join('\n');
  },

  greeting: (ctx) => {
    return [
      `Hello! I'm your HealthID copilot for **${ctx.partner.name}**.`,
      '',
      `I can help you explore your campaigns, identity network, verifications, treasury, and compliance data. What would you like to know?`,
    ].join('\n');
  },

  help: () => {
    return [
      `**Here's what I can help with:**\n`,
      `- **Campaigns** — overview, performance metrics, funnel analysis`,
      `- **Identities** — network size, reputation tiers, demographics`,
      `- **Verifications** — success rates, proof speed, proof types`,
      `- **Treasury** — balance, yield, value multiplier`,
      `- **Compliance** — audit logs, PII exposure, proof failures`,
      '',
      `Try asking something like "How are my campaigns performing?" or "What's my verification success rate?"`,
    ].join('\n');
  },

  unknown: (ctx) => {
    return [
      `I'm not sure I understand that question. I can help you explore data for **${ctx.partner.name}** across these domains:\n`,
      `- **Campaigns** — "Give me a campaign overview"`,
      `- **Verifications** — "What's my success rate?"`,
      `- **Treasury** — "What's my treasury balance?"`,
      `- **Compliance** — "Show my compliance status"`,
      `- **Identities** — "How many identities are in the network?"`,
      '',
      `Could you rephrase your question?`,
    ].join('\n');
  },
};

// ── Typewriter streaming ────────────────────────────────────────────

const CHAR_DELAY_MS = 8;
const WORD_PAUSE_MS = 2;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Provider implementation ─────────────────────────────────────────

export class SimulatedProvider implements CopilotProvider {
  async *generateResponse(
    messages: Message[],
    context: DataContext,
  ): AsyncGenerator<string, void, undefined> {
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== 'user') return;

    const intent = classifyIntent(lastMessage.content);
    const fullText = RESPONSE_BUILDERS[intent](context);

    // Yield characters with typewriter effect
    for (let i = 0; i < fullText.length; i++) {
      const char = fullText[i];
      yield char;

      if (char === ' ') {
        await delay(WORD_PAUSE_MS);
      } else if (char === '\n') {
        await delay(CHAR_DELAY_MS * 3);
      } else {
        await delay(CHAR_DELAY_MS);
      }
    }
  }
}
