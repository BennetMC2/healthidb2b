import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
import { useCopilotStore } from '@/stores/useCopilotStore';
import { usePartnerStore } from '@/stores/usePartnerStore';
import { useCopilotKeyboard, COPILOT_INPUT_ID } from '@/hooks/useCopilotKeyboard';
import { getPageSuggestions } from '@/copilot/suggestions';
import CopilotMessage from './CopilotMessage';

interface CopilotPanelProps {
  onClose?: () => void;
}

export default function CopilotPanel({ onClose }: CopilotPanelProps = {}) {
  useCopilotKeyboard();

  const { messages, isStreaming, sendMessage, clearMessages } = useCopilotStore();
  const partner = usePartnerStore((s) => s.currentPartner);
  const location = useLocation();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const suggestions = getPageSuggestions(location.pathname, partner.industry);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || isStreaming) return;
    setInput('');
    sendMessage(text);
  }

  function handleSuggestionClick(prompt: string) {
    if (isStreaming) return;
    sendMessage(prompt);
  }

  return (
    <div className="h-full bg-surface flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-5 w-5 items-center justify-center rounded bg-accent/20">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
          </div>
          <span className="text-xs font-semibold text-primary">Copilot</span>
          <span className="text-2xs text-tertiary">
            {partner.label}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {onClose && (
            <button
              onClick={onClose}
              className="rounded p-1 text-tertiary transition-colors hover:bg-hover hover:text-secondary"
              title="Close"
            >
              <X size={14} />
            </button>
          )}
          {messages.length > 0 && (
            <button
              onClick={clearMessages}
              className="rounded p-1 text-tertiary transition-colors hover:bg-hover hover:text-secondary"
              title="Clear conversation"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" />
              </svg>
            </button>
          )}
          <span className="rounded bg-hover px-1.5 py-0.5 text-2xs text-tertiary">
            {navigator.platform.includes('Mac') ? '\u2318K' : 'Ctrl+K'}
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-3">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-4">
            <div className="text-center">
              <p className="text-xs font-medium text-primary">
                Ask about your data
              </p>
              <p className="mt-1 text-2xs text-tertiary">
                Explore campaigns, identities, verifications, treasury, and compliance.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-1.5">
              {suggestions.map((s) => (
                <button
                  key={s.label}
                  onClick={() => handleSuggestionClick(s.prompt)}
                  className="rounded-full border border-border px-2.5 py-1 text-2xs text-secondary transition-colors hover:border-accent/40 hover:text-primary"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {messages.map((msg) => (
              <CopilotMessage key={msg.id} message={msg} />
            ))}
            {isStreaming && messages[messages.length - 1]?.content === '' && (
              <div className="flex justify-start">
                <div className="flex gap-1 rounded-lg bg-elevated px-3 py-2">
                  <span className="h-1.5 w-1.5 animate-flow-pulse rounded-full bg-tertiary" />
                  <span className="h-1.5 w-1.5 animate-flow-pulse rounded-full bg-tertiary" style={{ animationDelay: '200ms' }} />
                  <span className="h-1.5 w-1.5 animate-flow-pulse rounded-full bg-tertiary" style={{ animationDelay: '400ms' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            id={COPILOT_INPUT_ID}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isStreaming ? 'Responding...' : 'Ask a question...'}
            disabled={isStreaming}
            className="flex-1 bg-transparent text-xs text-primary placeholder:text-tertiary outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isStreaming || !input.trim()}
            className="flex h-6 w-6 items-center justify-center rounded bg-accent text-base transition-opacity disabled:opacity-30"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4z" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}
