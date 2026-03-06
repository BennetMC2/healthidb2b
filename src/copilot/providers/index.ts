import type { CopilotProvider } from '../types';
import { SimulatedProvider } from './simulated';
import { ClaudeProvider } from './claude';

let cachedProvider: CopilotProvider | null = null;

export function getProvider(): CopilotProvider {
  if (cachedProvider) return cachedProvider;

  const providerType = import.meta.env.VITE_COPILOT_PROVIDER ?? 'simulated';

  switch (providerType) {
    case 'claude': {
      const apiKey = import.meta.env.VITE_CLAUDE_API_KEY;
      if (!apiKey) {
        console.warn('[Copilot] VITE_CLAUDE_API_KEY not set, falling back to simulated provider');
        cachedProvider = new SimulatedProvider();
      } else {
        cachedProvider = new ClaudeProvider(apiKey);
      }
      break;
    }
    default:
      cachedProvider = new SimulatedProvider();
  }

  return cachedProvider;
}
