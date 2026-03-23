import { create } from 'zustand';
import type { Message, DataContext } from '@/copilot/types';
import { buildDataContext } from '@/copilot/context';
import { getProvider } from '@/copilot/providers';
import { usePartnerStore } from './usePartnerStore';

interface CopilotStore {
  messages: Message[];
  isStreaming: boolean;
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
}

let messageCounter = 0;

function createMessage(role: 'user' | 'assistant', content: string): Message {
  return {
    id: `msg_${++messageCounter}`,
    role,
    content,
    timestamp: Date.now(),
  };
}

// Track active stream so we can cancel on new message
let activeAbort: AbortController | null = null;

export const useCopilotStore = create<CopilotStore>((set, get) => ({
  messages: [],
  isStreaming: false,

  clearMessages: () => set({ messages: [] }),

  sendMessage: async (content: string) => {
    if (get().isStreaming) return;

    // Cancel any previous stream
    if (activeAbort) {
      activeAbort.abort();
      activeAbort = null;
    }

    const abort = new AbortController();
    activeAbort = abort;

    // Add user message
    const userMsg = createMessage('user', content);
    set((s) => ({ messages: [...s.messages, userMsg], isStreaming: true }));

    // Build context from current partner + current page
    const partner = usePartnerStore.getState().currentPartner;
    const context: DataContext = buildDataContext(partner, window.location.pathname);

    // Create assistant message placeholder
    const assistantMsg = createMessage('assistant', '');
    set((s) => ({ messages: [...s.messages, assistantMsg] }));

    try {
      const provider = getProvider();
      const allMessages = get().messages;
      const stream = provider.generateResponse(allMessages, context);

      let accumulated = '';
      for await (const chunk of stream) {
        if (abort.signal.aborted) break;
        accumulated += chunk;
        // Update the last message in place
        set((s) => {
          const msgs = [...s.messages];
          const lastIdx = msgs.length - 1;
          msgs[lastIdx] = { ...msgs[lastIdx], content: accumulated };
          return { messages: msgs };
        });
      }
    } catch {
      // If aborted or error, set a fallback message
      if (!abort.signal.aborted) {
        set((s) => {
          const msgs = [...s.messages];
          const lastIdx = msgs.length - 1;
          msgs[lastIdx] = {
            ...msgs[lastIdx],
            content: 'Sorry, something went wrong. Please try again.',
          };
          return { messages: msgs };
        });
      }
    } finally {
      if (activeAbort === abort) {
        activeAbort = null;
      }
      set({ isStreaming: false });
    }
  },
}));
