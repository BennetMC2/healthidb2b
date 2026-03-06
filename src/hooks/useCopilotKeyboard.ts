import { useEffect } from 'react';

const COPILOT_INPUT_ID = 'copilot-input';

export function useCopilotKeyboard() {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Cmd+K (Mac) or Ctrl+K (Windows/Linux) → focus copilot input
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById(COPILOT_INPUT_ID)?.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);
}

export { COPILOT_INPUT_ID };
