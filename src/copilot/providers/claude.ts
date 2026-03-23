import type { CopilotProvider, Message, DataContext } from '../types';

function buildSystemPrompt(context: DataContext): string {
  const { partner, campaigns, identities, verifications, treasury, compliance } = context;

  return `You are a concise, data-driven copilot embedded in the HealthID B2B platform. You help enterprise partners analyze their health verification data.

Current partner: ${partner.name} (${partner.industry} industry, ${partner.tier} tier)
${context.currentPage ? `Current page: ${context.currentPage}` : ''}

DATA SNAPSHOT (use these numbers in your responses):

CAMPAIGNS: ${campaigns.total} total (${campaigns.active} active, ${campaigns.completed} completed, ${campaigns.draft} draft, ${campaigns.paused} paused). Budget: $${campaigns.totalBudget.toLocaleString()} allocated, $${campaigns.totalSpent.toLocaleString()} spent.${campaigns.topCampaign ? ` Top campaign: ${campaigns.topCampaign}.` : ''}

IDENTITIES: ${identities.total.toLocaleString()} in the open pool. Avg health score: ${identities.avgHealthScore}/100. Top sources: ${identities.topSources.join(', ')}. Tiers: ${Object.entries(identities.byTier).map(([t, c]) => `${t}: ${c}`).join(', ')}.

VERIFICATIONS: ${verifications.total.toLocaleString()} total. ${verifications.verified} verified (${verifications.successRate}% success), ${verifications.pending} pending, ${verifications.failed} failed, ${verifications.expired} expired. Avg proof time: ${verifications.avgProofTimeMs}ms. Types: ${Object.entries(verifications.byProofType).map(([t, c]) => `${t}: ${c}`).join(', ')}.

TREASURY: $${treasury.totalBudget.toLocaleString()} total, $${treasury.availableBalance.toLocaleString()} available. Yield: ${(treasury.yieldRate * 100).toFixed(1)}% APY ($${treasury.yieldGenerated.toLocaleString()} generated). Value multiplier: ${treasury.valueMultiplier}x. ${treasury.pointsDistributed.toLocaleString()} Health Points distributed.

COMPLIANCE: ${compliance.totalRecords} records. PII access events: ${compliance.piiAccessEvents}. Recent proof failures (30d): ${compliance.recentFailures}. Events: ${Object.entries(compliance.byEventType).map(([t, c]) => `${t}: ${c}`).join(', ')}.

INSTRUCTIONS:
- Keep responses concise (3-8 sentences). Use markdown formatting with **bold** for key metrics.
- Ground every claim in the data above. Do not fabricate numbers.
- When discussing zero-knowledge proofs, emphasize that no raw health data is transmitted — only cryptographic proof receipts.
- Proactively surface insights and recommendations based on the data.
- If the user asks something outside the platform's domain, politely redirect to what you can help with.`;
}

/**
 * Reads an SSE stream from a ReadableStreamDefaultReader and yields parsed events.
 */
async function* readSSEStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
): AsyncGenerator<{ type: string; delta?: { type: string; text: string } }, void, undefined> {
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6).trim();
        if (data === '[DONE]') return;
        try {
          yield JSON.parse(data);
        } catch {
          // Skip malformed JSON lines
        }
      }
    }
  }
}

export class ClaudeProvider implements CopilotProvider {
  constructor(private apiKey: string) {}

  async *generateResponse(
    messages: Message[],
    context: DataContext,
  ): AsyncGenerator<string, void, undefined> {
    const systemPrompt = buildSystemPrompt(context);

    // Convert to Claude message format, filtering empty messages
    const claudeMessages = messages
      .filter((m) => m.content.trim().length > 0)
      .map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

    // Ensure messages alternate and start with user
    if (claudeMessages.length === 0 || claudeMessages[0].role !== 'user') {
      yield 'Please ask a question to get started.';
      return;
    }

    try {
      const response = await fetch('/api/anthropic/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1024,
          system: systemPrompt,
          messages: claudeMessages,
          stream: true,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[ClaudeProvider] API error:', response.status, errorText);
        yield `API error (${response.status}). Check your API key and try again.`;
        return;
      }

      if (!response.body) {
        yield 'No response body received from API.';
        return;
      }

      const reader = response.body.getReader();

      for await (const event of readSSEStream(reader)) {
        if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
          yield event.delta.text;
        }
      }
    } catch (err) {
      console.error('[ClaudeProvider] Stream error:', err);
      yield 'Connection error. Please check your network and try again.';
    }
  }
}
