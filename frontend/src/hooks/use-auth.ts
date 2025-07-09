/**
 * Authentication Hook
 * Custom hook for managing authentication state and actions
 */

import { useStore } from "@tanstack/react-store";
import { useNavigate } from "@tanstack/react-router";
import { useCallback } from "react";

import { authStore, authActions, authSelectors } from "@/store";
import type { User } from "@/types";

export interface UseAuthReturn {
  // State
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  logout: () => void;
  clearError: () => void;

  // Utilities
  hasRole: (role: string) => boolean;
  hasPermission: (permission: string) => boolean;
  requireAuth: () => boolean;
}

/**
 * Authentication hook
 * Provides authentication state and actions
 */
export const useAuth = (): UseAuthReturn => {
  const navigate = useNavigate();

  // Get authentication state from store
  const isAuthenticated = useStore(authStore, authSelectors.isAuthenticated);
  const user = useStore(authStore, authSelectors.getUser);
  const isLoading = useStore(authStore, authSelectors.isLoading);
  const error = useStore(authStore, authSelectors.getError);

  /**
   * Logout user and redirect to login page
   */
  const logout = useCallback(() => {
    authActions.logout();
    navigate({ to: "/login" });
  }, [navigate]);

  /**
   * Clear authentication error
   */
  const clearError = useCallback(() => {
    authActions.clearError();
  }, []);

  /**
   * Check if user has specific role
   */
  const hasRole = useCallback(
    (role: string): boolean => {
      if (!user || !user.roles) return false;
      return user.roles.includes(role);
    },
    [user]
  );

  /**
   * Check if user has specific permission
   */
  const hasPermission = useCallback(
    (_permission: string): boolean => {
      if (!user) return false;
      // For now, return true for authenticated users
      // TODO: Implement proper permission checking
      return true;
    },
    [user]
  );

  /**
   * Require authentication - redirect to login if not authenticated
   */
  const requireAuth = useCallback((): boolean => {
    if (!isAuthenticated) {
      navigate({
        to: "/login",
        search: { redirect: window.location.pathname },
      });
      return false;
    }
    return true;
  }, [isAuthenticated, navigate]);

  return {
    // State
    isAuthenticated,
    user,
    isLoading,
    error,

    // Actions
    logout,
    clearError,

    // Utilities
    hasRole,
    hasPermission,
    requireAuth,
  };
};

/**
 * Hook for requiring authentication
 * Automatically redirects to login if not authenticated
 */
export const useRequireAuth = () => {
  const { requireAuth } = useAuth();
  return requireAuth();
};
