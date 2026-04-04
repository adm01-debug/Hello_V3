export type { UserRole, UserProfile, AuthState } from './auth/useAuthState';
export { useAuth } from './useAuth';
export default useAuth;

// Re-export sub-modules for direct usage if needed
export { useAuthProfile } from './auth/useAuthProfile';
export { useAuthSession, withTimeout } from './auth/useAuthSession';
export { useAuthActions } from './auth/useAuthActions';
