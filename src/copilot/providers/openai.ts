import type { CopilotProvider, Message, DataContext } from '../types';

export class OpenAIProvider implements CopilotProvider {
  async *generateResponse(
    messages: Message[],
    context: DataContext,
    options?: { signal?: AbortSignal },
  ): AsyncGenerator<string, void, undefined> {
    try {
      const response = await fetch('/api/copilot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages, context }),
        signal: options?.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        yield errorText || `API error (${response.status}).`;
        return;
      }

      if (!response.body) {
        yield 'No response body received from the copilot API.';
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        accumulated += decoder.decode(value, { stream: true });
      }

      accumulated += decoder.decode();
      yield accumulated || 'The model did not return any text.';
    } catch (error) {
      if (options?.signal?.aborted) {
        return;
      }

      console.error('[OpenAIProvider] request failed:', error);
      yield 'Connection error. Please check your API configuration and try again.';
    }
  }
}
