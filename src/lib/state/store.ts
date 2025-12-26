import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface AppState {
  user: User | null;
  theme: 'light' | 'dark';
  sidebar: boolean;
  setUser: (user: User | null) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  toggleSidebar: () => void;
}

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set) => ({
        user: null,
        theme: 'light',
        sidebar: true,
        setUser: (user) => set({ user }),
        setTheme: (theme) => set({ theme }),
        toggleSidebar: () => set((state) => ({ sidebar: !state.sidebar })),
      }),
      { name: 'app-storage' }
    )
  )
);

interface User {
  id: string;
  email: string;
  name: string;
}
