export type { UserRole, UserProfile, AuthState } from './useAuthState';
export { useAuth } from '../useAuth';

// Re-export sub-modules for direct usage if needed
export { useAuthProfile } from './useAuthProfile';
export { useAuthSession, withTimeout } from './useAuthSession';
export { useAuthActions } from './useAuthActions';
