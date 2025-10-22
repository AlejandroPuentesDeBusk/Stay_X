import { create } from 'zustand';

interface AppState {
  darkMode: boolean;
  fontScale: number;
  toggleDarkMode: () => void;
  setFontScale: (scale: number) => void;
}

export const useAppStore = create<AppState>((set) => ({
  darkMode: false,
  fontScale: 1,
  toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
  setFontScale: (scale) => set({ fontScale: scale }),
}));
