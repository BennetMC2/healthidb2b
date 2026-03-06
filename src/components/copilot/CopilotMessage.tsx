import type { Message } from '@/copilot/types';

interface CopilotMessageProps {
  message: Message;
}

/** Minimal markdown: **bold**, `code`, newlines → <br/>, - list items */
function renderMarkdown(text: string) {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Empty line → spacer
    if (line.trim() === '') {
      elements.push(<div key={i} className="h-2" />);
      continue;
    }

    // List item
    const listMatch = line.match(/^- (.+)$/);
    if (listMatch) {
      elements.push(
        <div key={i} className="flex gap-1.5 pl-1">
          <span className="text-tertiary select-none">-</span>
          <span>{inlineFormat(listMatch[1])}</span>
        </div>,
      );
      continue;
    }

    // Regular line
    elements.push(<div key={i}>{inlineFormat(line)}</div>);
  }

  return elements;
}

/** Inline formatting: **bold** and `code` */
function inlineFormat(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*(.+?)\*\*|`(.+?)`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    // Text before match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    if (match[2]) {
      // Bold
      parts.push(
        <span key={key++} className="font-semibold text-primary">
          {match[2]}
        </span>,
      );
    } else if (match[3]) {
      // Code
      parts.push(
        <code
          key={key++}
          className="rounded bg-hover px-1 py-0.5 font-mono text-2xs text-accent"
        >
          {match[3]}
        </code>,
      );
    }

    lastIndex = match.index + match[0].length;
  }

  // Remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length === 1 ? parts[0] : parts;
}

export default function CopilotMessage({ message }: CopilotMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-lg px-3 py-2 text-xs leading-relaxed ${
          isUser
            ? 'bg-accent/15 text-primary'
            : 'bg-elevated text-secondary'
        }`}
      >
        {isUser ? message.content : renderMarkdown(message.content)}
      </div>
    </div>
  );
}
