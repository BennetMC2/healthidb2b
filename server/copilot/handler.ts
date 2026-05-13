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
    return `Hello. I can help ${partnerName} turn verified wearable signals into priced campaign decisions. Ask me which signal to act on, where modifiable risk is building, or how to price Health Points against expected book value.`;
  }

  if (/(underpriced|which cohort.*underpriced|cohort.*underpriced)/.test(normalized)) {
    return [
      `The stronger campaign question is not underpricing; it is **which modifiable risk is worth funding**.`,
      `The best current answer is **Cardio Fitness Activation**: 3,847 addressable members show low or declining VO2 Max signals but are still active enough to respond to an 8-week intervention.`,
      `I would price it at **650 Health Points per member**, cap the initial budget at **$58K**, and target verified Zone 2 consistency plus a positive VO2 Max trend.`,
      `Expected book impact: **$4.2M** value opportunity, **4.2x ROI**, **3.3% claims reduction**, and **8-month payback**.`,
    ].join(' ');
  }

  if (/(weakest campaign|worst campaign|which campaign.*weakest|lowest performing campaign)/.test(normalized)) {
    return [
      `The weakest campaign to launch unchanged is **Resting Heart Rate Improvement**.`,
      `It is still worth testing, but it has emerging confidence, a narrower cohort of 946 members, and a lower expected ROI than VO2 Max, HRV, or Sleep Regularity.`,
      `I would keep it as a controlled pilot: 600 Health Points per member over 90 days, focused on activity consistency and a 3 bpm resting heart rate improvement.`,
      `The campaign to scale first is **Cardio Fitness Activation**, not resting heart rate.`,
    ].join(' ');
  }

  if (/(verification success rate|proof success rate|success rate|verification posture)/.test(normalized)) {
    return [
      `Your verification success rate is **${formatPercent(verificationRate)}**, based on **${verified.toLocaleString('en-US')} verified** outcomes out of **${totalVerifications.toLocaleString('en-US')} total** verification events.`,
      verificationRate >= 80
        ? `For a demo book, that is a strong operating posture: the proof system is confirming outcomes reliably without exposing raw member health data.`
        : `That is serviceable but not where I would want it long term. I would tighten source requirements and simplify lower-fidelity campaign rules.`,
      `The next operating question is which wearable campaign should absorb more verified volume: VO2 Max, HRV, sleep, or resting heart rate.`,
    ].join(' ');
  }

  if (/(best next|next programme|next program|what should we launch|recommend.*campaign|best campaign|wearable campaign|modifiable risk|biggest risk)/.test(normalized)) {
    return [
      `Launch **Cardio Fitness Activation** first.`,
      `It targets VO2 Max, which is the strongest modifiable wearable signal in the current demo book: 3,847 members, high confidence, 650 Health Points per member, $58K initial reward budget, and $4.2M expected book value.`,
      `The campaign mechanic is simple: reward 8 weeks of verified Zone 2 activity consistency and a positive VO2 Max trend.`,
      `Second priority is **HRV Recovery**, because it catches recovery drift before it becomes more expensive claims risk.`,
    ].join(' ');
  }

  if (/(vo2|cardio|fitness)/.test(normalized)) {
    return [
      `For VO2 Max, I would run **Cardio Fitness Activation**.`,
      `Target 3,847 addressable members with low or declining cardio-fitness signals who still have enough activity baseline to respond.`,
      `Price the campaign at **650 Health Points per member** over **8 weeks**. Reward verified Zone 2 activity consistency and a positive VO2 Max trend.`,
      `Expected impact: **$4.2M** book value, **4.2x ROI**, **3.3% claims reduction**, and **-140 bps morbidity shift**.`,
    ].join(' ');
  }

  if (/(hrv|recovery|stress)/.test(normalized)) {
    return [
      `For HRV, I would run **HRV Recovery**.`,
      `The target is 1,204 members with sustained HRV decline, rising training stress, and inconsistent recovery windows.`,
      `Reward 21 verified recovery days across sleep consistency, lighter movement, and stabilised resting heart rate.`,
      `Expected impact: **$1.8M** book value, **3.4x ROI**, and **12-month payback**. This is prevention: stop manageable recovery drift before it becomes claims risk.`,
    ].join(' ');
  }

  if (/(sleep|sleep debt|regularity)/.test(normalized)) {
    return [
      `For sleep, I would run **Sleep Regularity**.`,
      `The target is 2,186 members with persistent sleep debt or irregular sleep timing across the last 45 days.`,
      `Reward 30 nights with verified sleep regularity and at least 6.5 hours average sleep duration.`,
      `Expected impact: **$1.25M** book value, **3.1x ROI**, and **11-month payback**. It is broad, but Health Points pricing needs discipline so the partner does not over-reward low-value behaviour.`,
    ].join(' ');
  }

  if (/(resting heart|heart rate|rhr)/.test(normalized)) {
    return [
      `For resting heart rate, I would keep **Resting Heart Rate Improvement** as a controlled pilot.`,
      `The target is 946 members with elevated or worsening resting heart rate and enough device coverage to verify improvement.`,
      `Reward 12 active weeks with verified activity consistency and a 3 bpm resting heart rate improvement.`,
      `Expected impact: **$840K** book value, **2.7x ROI**, and **14-month payback**. It is useful, but not the first campaign I would scale.`,
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
      `The strongest campaign play is **Cardio Fitness Activation**.`,
      `It has the best combination of scale, addressability, Health Points economics, and evidence quality: 3,847 members, 650 HP/member, $58K budget, $4.2M expected book value, and 4.2x ROI.`,
      `The top existing campaign in the broader platform snapshot is still **${topCampaign}**, but this cockpit is now prioritising wearable-led campaign plays.`,
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
    'You help enterprise partners turn verified wearable signals into priced campaign decisions that improve expected book value.',
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
    '- Frame wearable-led campaigns around modifiable risk, Health Points pricing, expected behavior change, and book value impact.',
    '- Prioritize VO2 Max, HRV, sleep regularity, and resting heart rate when asked about campaign opportunities.',
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
