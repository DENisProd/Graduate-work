export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeStore {
  theme: ThemeMode;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

export interface ThemeConfig {
  defaultTheme: ThemeMode;
  storageKey: string;
  attribute: string;
}



