interface MessageLike {
  role: 'user' | 'assistant';
  content: string;
}

interface DataContextLike {
  currentPage?: string;
  partner?: {
    name?: string;
    tier?: string;
    industry?: string;
  };
  campaigns?: {
    total?: number;
    active?: number;
    completed?: number;
    draft?: number;
    paused?: number;
    totalBudget?: number;
    totalSpent?: number;
    topCampaign?: string | null;
  };
  identities?: {
    total?: number;
    byTier?: Record<string, number>;
    avgHealthScore?: number;
    topSources?: string[];
  };
  verifications?: {
    total?: number;
    verified?: number;
    pending?: number;
    failed?: number;
    expired?: number;
    successRate?: number;
    avgProofTimeMs?: number;
    byProofType?: Record<string, number>;
  };
  treasury?: {
    totalBudget?: number;
    availableBalance?: number;
    yieldRate?: number;
    yieldGenerated?: number;
    valueMultiplier?: number;
    pointsDistributed?: number;
  };
  compliance?: {
    totalRecords?: number;
    byEventType?: Record<string, number>;
    piiAccessEvents?: number;
    recentFailures?: number;
  };
}

interface CopilotRequestBody {
  messages?: MessageLike[];
  context?: DataContextLike;
}

function numberValue(value: number | undefined): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function formatUsd(value: number | undefined): string {
  return `$${numberValue(value).toLocaleString('en-US')}`;
}

function formatPercent(value: number | undefined): string {
  return `${numberValue(value)}%`;
}

function latestUserMessage(messages: MessageLike[]): string {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    if (messages[index]?.role === 'user') {
      return messages[index].content.trim();
    }
  }

  return '';
}

function buildDemoAnswer(question: string, context: DataContextLike = {}): string | null {
  const normalized = question.toLowerCase();
  const partnerName = context.partner?.name ?? 'this partner';
  const verificationRate = numberValue(context.verifications?.successRate);
  const verified = numberValue(context.verifications?.verified);
  const totalVerifications = numberValue(context.verifications?.total);
  const failedProofs = numberValue(context.compliance?.recentFailures);
  const topCampaign = context.campaigns?.topCampaign ?? 'Q4 HbA1c Underwriting Screen';

  if (/^(hi|hello|hey|good morning|good afternoon)\b/.test(normalized)) {
    return `Hello. I can help ${partnerName} with cohort quality, campaign performance, verification posture, and underwriting opportunities. Ask me where the next opportunity is or which part of the book needs attention.`;
  }

  if (/(underpriced|which cohort.*underpriced|cohort.*underpriced)/.test(normalized)) {
    return [
      `The clearest underpriced cohort in the demo book is the **high-trust cardio-fitness segment**.`,
      `It contains **3,847 members** with top-decile VO2 Max signals that are still sitting in standard-risk premium bands.`,
      `The demo model treats that as roughly **$4.2M** of repricing opportunity with an estimated **8-month payback** and **high confidence** because the source density and literature support are both strong.`,
      `If I were acting on one signal first, I would launch the cardio repricing programme before expanding any lower-confidence sleep or maternity work.`,
    ].join(' ');
  }

  if (/(weakest campaign|worst campaign|which campaign.*weakest|lowest performing campaign)/.test(normalized)) {
    return [
      `In the demo portfolio, the **Sleep Resilience Campaign** is the weakest programme to keep on the field unchanged.`,
      `It is not broken, but it has the softest evidence posture, lower verification consistency than the cardio cohort, and a materially lower modeled upside than the top underwriting and repricing motions.`,
      `My recommendation would be to tighten that campaign to higher-trust members or reallocate budget toward the cardio-fitness and HbA1c underwriting motions first.`,
    ].join(' ');
  }

  if (/(verification success rate|proof success rate|success rate|verification posture)/.test(normalized)) {
    return [
      `Your verification success rate is **${formatPercent(verificationRate)}**, based on **${verified.toLocaleString('en-US')} verified** outcomes out of **${totalVerifications.toLocaleString('en-US')} total** verification events.`,
      verificationRate >= 80
        ? `For a demo book, that is a strong operating posture: the proof system is confirming outcomes reliably without exposing raw member health data.`
        : `That is serviceable but not where I would want it long term. I would tighten source requirements and simplify lower-fidelity campaign rules.`,
      `The next operating question is not “does the proof layer work?” but “which campaign should absorb more verified volume?”`,
    ].join(' ');
  }

  if (/(best next|next programme|next program|what should we launch|recommend.*campaign|best campaign)/.test(normalized)) {
    return [
      `The best next programme to launch in this demo is the **cardio-fitness repricing motion**.`,
      `It carries the highest modeled savings, the cleanest evidence base, and the strongest trust profile among the seeded opportunities.`,
      `That makes it the best commercial story for a partner conversation because it combines visible financial upside with a crisp proof narrative.`,
    ].join(' ');
  }

  if (/(underwriting|pricing screen|hba1c|renewal screen)/.test(normalized)) {
    return [
      `The strongest underwriting opportunity in the current demo set is **${topCampaign}**.`,
      `The reason it matters is that it converts verified biomarker evidence into a pricing and selection workflow without requiring raw health data custody.`,
      `The main caution is the maternity threshold update, which should be reviewed before broadening that screen any further.`,
    ].join(' ');
  }

  if (/(proof failure|compliance risk|audit risk|breach risk|proof risk)/.test(normalized)) {
    return [
      `The compliance posture is still strong: the operating model shows **0 raw-data access events** and keeps the partner on receipt-only evidence.`,
      failedProofs > 0
        ? `The one watch item is **${failedProofs} recent proof failures**, which is an operating quality issue rather than a privacy issue.`
        : `There are no recent proof failures showing up as a material watch item in the current snapshot.`,
      `For the demo, the right framing is that trust risk is low, while optimisation risk sits in proof throughput and campaign design quality.`,
    ].join(' ');
  }

  if (/(top campaign|strongest campaign|best performing campaign)/.test(normalized)) {
    return [
      `The strongest live campaign in the current book is **${topCampaign}**.`,
      `It is carrying the clearest underwriting story in the portfolio and is the cleanest example of how verified outcomes can support partner decisioning without raw-data custody.`,
    ].join(' ');
  }

  return null;
}

function buildSystemPrompt(context: DataContextLike = {}): string {
  const partner = context.partner ?? {};
  const campaigns = context.campaigns ?? {};
  const identities = context.identities ?? {};
  const verifications = context.verifications ?? {};
  const treasury = context.treasury ?? {};
  const compliance = context.compliance ?? {};

  return [
    'You are the AI Actuary inside the HealthID B2B platform.',
    'You help enterprise partners analyze verified health cohorts, campaign performance, proof activity, and partner operating decisions.',
    context.currentPage ? `Current page: ${context.currentPage}` : null,
    '',
    `Partner: ${partner.name ?? 'Unknown partner'} · ${partner.industry ?? 'unknown industry'} · ${partner.tier ?? 'unknown tier'}`,
    '',
    'Use the platform snapshot below as your source of truth. Never fabricate numbers or claim access to data that is not in the snapshot.',
    '',
    `Campaigns: ${numberValue(campaigns.total)} total, ${numberValue(campaigns.active)} active, ${numberValue(campaigns.completed)} completed, ${numberValue(campaigns.draft)} draft, ${numberValue(campaigns.paused)} paused. Budget ${formatUsd(campaigns.totalBudget)} allocated, ${formatUsd(campaigns.totalSpent)} spent.${campaigns.topCampaign ? ` Top campaign: ${campaigns.topCampaign}.` : ''}`,
    `Member Pool: ${numberValue(identities.total).toLocaleString('en-US')} identities. Average health score ${numberValue(identities.avgHealthScore)}/100. Top sources: ${(identities.topSources ?? []).join(', ') || 'none recorded'}. Tiers: ${Object.entries(identities.byTier ?? {}).map(([tier, count]) => `${tier}: ${count}`).join(', ') || 'none recorded'}.`,
    `Verifications: ${numberValue(verifications.total).toLocaleString('en-US')} total. ${numberValue(verifications.verified)} verified, ${numberValue(verifications.pending)} pending, ${numberValue(verifications.failed)} failed, ${numberValue(verifications.expired)} expired. Success rate ${numberValue(verifications.successRate)}%. Average proof time ${numberValue(verifications.avgProofTimeMs)}ms. Types: ${Object.entries(verifications.byProofType ?? {}).map(([type, count]) => `${type}: ${count}`).join(', ') || 'none recorded'}.`,
    `Treasury: ${formatUsd(treasury.totalBudget)} total budget, ${formatUsd(treasury.availableBalance)} available, ${(numberValue(treasury.yieldRate) * 100).toFixed(1)}% APY, ${formatUsd(treasury.yieldGenerated)} yield generated, ${numberValue(treasury.valueMultiplier)}x value multiplier, ${numberValue(treasury.pointsDistributed).toLocaleString('en-US')} Health Points distributed.`,
    `Compliance: ${numberValue(compliance.totalRecords)} records, ${numberValue(compliance.piiAccessEvents)} raw data access events, ${numberValue(compliance.recentFailures)} recent proof failures. Events: ${Object.entries(compliance.byEventType ?? {}).map(([type, count]) => `${type}: ${count}`).join(', ') || 'none recorded'}.`,
    '',
    'Behavior rules:',
    '- Be concise and commercial.',
    '- Ground every answer in the provided data context.',
    '- Emphasize that partners receive verification receipts and proofs, not raw member health data.',
    '- When the user asks for advice, give a direct recommendation and why it matters.',
    '- If information is missing, say what is missing instead of guessing.',
  ].filter(Boolean).join('\n');
}

function extractAssistantText(payload: unknown): string {
  if (!payload || typeof payload !== 'object') {
    return '';
  }

  const data = payload as {
    choices?: Array<{
      message?: {
        content?: string | Array<{ type?: string; text?: string }>;
      };
    }>;
  };

  const content = data.choices?.[0]?.message?.content;
  if (typeof content === 'string') {
    return content.trim();
  }

  if (Array.isArray(content)) {
    return content
      .map((part) => (typeof part?.text === 'string' ? part.text : ''))
      .join('')
      .trim();
  }

  return '';
}

export async function handleCopilotRequest(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('Method not allowed.', { status: 405 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return new Response('OPENAI_API_KEY is not configured on the server.', { status: 500 });
  }

  let body: CopilotRequestBody;
  try {
    body = (await request.json()) as CopilotRequestBody;
  } catch {
    return new Response('Invalid JSON payload.', { status: 400 });
  }

  const messages = Array.isArray(body.messages)
    ? body.messages.filter((message): message is MessageLike =>
        (message?.role === 'user' || message?.role === 'assistant') &&
        typeof message.content === 'string' &&
        message.content.trim().length > 0)
    : [];

  if (messages.length === 0) {
    return new Response('No copilot messages were provided.', { status: 400 });
  }

  const question = latestUserMessage(messages);
  const demoAnswer = buildDemoAnswer(question, body.context);
  if (demoAnswer) {
    return new Response(demoAnswer, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    });
  }

  const model = process.env.OPENAI_MODEL || 'gpt-4.1-mini';
  const systemPrompt = buildSystemPrompt(body.context);

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature: 0.3,
      max_tokens: 700,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map((message) => ({
          role: message.role,
          content: message.content,
        })),
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    return new Response(
      `OpenAI API error (${response.status}). ${errorText || 'No error body returned.'}`,
      { status: response.status },
    );
  }

  const payload = await response.json();
  const text = extractAssistantText(payload) || 'The model did not return any text.';

  return new Response(text, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}
