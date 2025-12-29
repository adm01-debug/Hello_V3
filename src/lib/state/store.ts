import { create } from 'zustand';
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
}

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  timestamp: number;
}

interface AppState {
  // User state
  user: User | null;
  isAuthenticated: boolean;
  
  // UI state
  theme: 'light' | 'dark' | 'auto';
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  
  // Notifications
  notifications: Notification[];
  
  // Loading states
  loading: {
    global: boolean;
    [key: string]: boolean;
  };
  
  // Error state
  error: string | null;
}

interface AppActions {
  // User actions
  setUser: (user: User | null) => void;
  logout: () => void;
  
  // Theme actions
  setTheme: (theme: 'light' | 'dark' | 'auto') => void;
  toggleTheme: () => void;
  
  // Sidebar actions
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebarCollapsed: () => void;
  
  // Notification actions
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  
  // Loading actions
  setLoading: (key: string, loading: boolean) => void;
  setGlobalLoading: (loading: boolean) => void;
  
  // Error actions
  setError: (error: string | null) => void;
  clearError: () => void;
  
  // Reset
  reset: () => void;
}

const initialState: AppState = {
  user: null,
  isAuthenticated: false,
  theme: 'auto',
  sidebarOpen: true,
  sidebarCollapsed: false,
  notifications: [],
  loading: {
    global: false,
  },
  error: null,
};

export const useAppStore = create<AppState & AppActions>()(
  devtools(
    persist(
      subscribeWithSelector(
        immer((set, get) => ({
          ...initialState,
          
          // User actions
          setUser: (user) =>
            set((state) => {
              state.user = user;
              state.isAuthenticated = !!user;
            }),
          
          logout: () =>
            set((state) => {
              state.user = null;
              state.isAuthenticated = false;
            }),
          
          // Theme actions
          setTheme: (theme) =>
            set((state) => {
              state.theme = theme;
            }),
          
          toggleTheme: () =>
            set((state) => {
              state.theme = state.theme === 'dark' ? 'light' : 'dark';
            }),
          
          // Sidebar actions
          toggleSidebar: () =>
            set((state) => {
              state.sidebarOpen = !state.sidebarOpen;
            }),
          
          setSidebarOpen: (open) =>
            set((state) => {
              state.sidebarOpen = open;
            }),
          
          toggleSidebarCollapsed: () =>
            set((state) => {
              state.sidebarCollapsed = !state.sidebarCollapsed;
            }),
          
          // Notification actions
          addNotification: (notification) =>
            set((state) => {
              const id = `${Date.now()}-${Math.random()}`;
              state.notifications.push({
                ...notification,
                id,
                timestamp: Date.now(),
              });
              
              // Auto-remove after 5 seconds
              setTimeout(() => {
                set((state) => {
                  state.notifications = state.notifications.filter(
                    (n) => n.id !== id
                  );
                });
              }, 5000);
            }),
          
          removeNotification: (id) =>
            set((state) => {
              state.notifications = state.notifications.filter(
                (n) => n.id !== id
              );
            }),
          
          clearNotifications: () =>
            set((state) => {
              state.notifications = [];
            }),
          
          // Loading actions
          setLoading: (key, loading) =>
            set((state) => {
              state.loading[key] = loading;
            }),
          
          setGlobalLoading: (loading) =>
            set((state) => {
              state.loading.global = loading;
            }),
          
          // Error actions
          setError: (error) =>
            set((state) => {
              state.error = error;
            }),
          
          clearError: () =>
            set((state) => {
              state.error = null;
            }),
          
          // Reset
          reset: () => set(initialState),
        }))
      ),
      {
        name: 'app-storage',
        partialize: (state) => ({
          theme: state.theme,
          sidebarCollapsed: state.sidebarCollapsed,
        }),
      }
    ),
    { name: 'AppStore' }
  )
);

// Selectors
export const selectUser = (state: AppState & AppActions) => state.user;
export const selectIsAuthenticated = (state: AppState & AppActions) => state.isAuthenticated;
export const selectTheme = (state: AppState & AppActions) => state.theme;
export const selectSidebarOpen = (state: AppState & AppActions) => state.sidebarOpen;
export const selectNotifications = (state: AppState & AppActions) => state.notifications;
export const selectLoading = (key: string) => (state: AppState & AppActions) => 
  state.loading[key] || false;
export const selectError = (state: AppState & AppActions) => state.error;

// Subscribe to auth changes
if (typeof window !== 'undefined') {
  useAppStore.subscribe(
    (state) => state.isAuthenticated,
    (isAuthenticated) => {
      console.log('Auth state changed:', isAuthenticated);
    }
  );
}

export default useAppStore;
