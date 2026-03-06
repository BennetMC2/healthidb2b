import type { CopilotProvider, Message, DataContext } from '../types';

/**
 * Claude API provider — stub for future implementation.
 *
 * To activate:
 * 1. Set VITE_COPILOT_PROVIDER=claude in .env
 * 2. Set VITE_CLAUDE_API_KEY in .env
 * 3. Implement the SSE streaming logic below
 *
 * The generateResponse method returns an AsyncGenerator<string> that yields
 * text deltas from the Claude API's SSE stream, making it a drop-in
 * replacement for the SimulatedProvider.
 */
export class ClaudeProvider implements CopilotProvider {
  constructor(private apiKey: string) {} // eslint-disable-line

  async *generateResponse(
    _messages: Message[],
    _context: DataContext,
  ): AsyncGenerator<string, void, undefined> {
    void this.apiKey; // Will be used when Claude API is implemented
    // TODO: Implement Claude API streaming
    //
    // 1. Build system prompt from DataContext:
    //    const systemPrompt = buildSystemPrompt(_context);
    //
    // 2. Convert messages to Claude format:
    //    const claudeMessages = _messages.map(m => ({
    //      role: m.role,
    //      content: m.content,
    //    }));
    //
    // 3. Call Claude API with streaming:
    //    const response = await fetch('https://api.anthropic.com/v1/messages', {
    //      method: 'POST',
    //      headers: {
    //        'Content-Type': 'application/json',
    //        'x-api-key': this.apiKey,
    //        'anthropic-version': '2023-06-01',
    //      },
    //      body: JSON.stringify({
    //        model: 'claude-sonnet-4-6-20250514',
    //        max_tokens: 1024,
    //        system: systemPrompt,
    //        messages: claudeMessages,
    //        stream: true,
    //      }),
    //    });
    //
    // 4. Parse SSE stream and yield text deltas:
    //    const reader = response.body.getReader();
    //    for await (const chunk of readSSEStream(reader)) {
    //      if (chunk.type === 'content_block_delta') {
    //        yield chunk.delta.text;
    //      }
    //    }

    yield 'Claude API provider is not yet configured. ';
    yield 'Set VITE_COPILOT_PROVIDER=claude and VITE_CLAUDE_API_KEY in your .env file.';
  }
}
