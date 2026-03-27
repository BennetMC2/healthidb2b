import { create } from 'zustand';

type Theme = 'light' | 'dark';

interface ThemeStore {
  theme: Theme;
  toggleTheme: () => void;
}

const STORAGE_KEY = 'healthid_theme';

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme);
}

export function initTheme() {
  const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
  const theme = stored === 'dark' ? 'dark' : 'light';
  applyTheme(theme);
  useThemeStore.setState({ theme });
}

export const useThemeStore = create<ThemeStore>((set, get) => ({
  theme: 'light',
  toggleTheme: () => {
    const next = get().theme === 'light' ? 'dark' : 'light';
    localStorage.setItem(STORAGE_KEY, next);
    applyTheme(next);
    set({ theme: next });
  },
}));
