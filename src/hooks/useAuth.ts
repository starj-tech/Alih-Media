// Re-export from AuthContext for backward compatibility
// All components now share the same global auth state
export { useAuthContext as useAuth } from '@/contexts/AuthContext';
