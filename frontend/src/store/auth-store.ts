/**
 * Authentication Store
 * Global state management for authentication using TanStack Store
 */

import { Store } from "@tanstack/react-store";

// Note: No longer using API client for Wails app
import { AuthState } from "@/types/auth";
import { User } from "@/types/user";

/**
 * Initial authentication state
 */
const initialAuthState: AuthState = {
  isAuthenticated: false,
  user: null,
  accessToken: null,
  refreshToken: null,
  isLoading: false,
  error: null,
};

/**
 * Authentication store
 */
export const authStore = new Store(initialAuthState);

/**
 * Authentication store actions
 */
export const authActions = {
  /**
   * Set loading state
   */
  setLoading: (isLoading: boolean) => {
    authStore.setState((state) => ({
      ...state,
      isLoading,
      error: isLoading ? null : state.error,
    }));
  },

  /**
   * Set error state
   */
  setError: (error: string | null) => {
    authStore.setState((state) => ({
      ...state,
      error,
      isLoading: false,
    }));
  },

  /**
   * Clear error state
   */
  clearError: () => {
    authStore.setState((state) => ({
      ...state,
      error: null,
    }));
  },

  /**
   * Set authentication success
   */
  setAuthenticated: (user: User, accessToken: string, refreshToken: string) => {
    // Store tokens in localStorage for persistence
    try {
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
    } catch {
      // Ignore localStorage errors
    }

    // Add firstName and lastName for compatibility
    const enhancedUser = {
      ...user,
      firstName: user.name?.split(' ')[0] || user.username,
      lastName: user.name?.split(' ').slice(1).join(' ') || '',
    };

    // Update store state
    authStore.setState({
      isAuthenticated: true,
      user: enhancedUser,
      accessToken,
      refreshToken,
      isLoading: false,
      error: null,
    });
  },

  /**
   * Update user data
   */
  updateUser: (user: Partial<User>) => {
    authStore.setState((state) => ({
      ...state,
      user: state.user ? { ...state.user, ...user } : null,
    }));
  },

  /**
   * Clear authentication
   */
  logout: () => {
    // Clear tokens from localStorage
    try {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
    } catch {
      // Ignore localStorage errors
    }

    // Reset store state
    authStore.setState(initialAuthState);

    // Emit logout event for other components
    window.dispatchEvent(new CustomEvent("auth:logout"));
  },

  /**
   * Initialize authentication from stored tokens
   */
  initialize: async () => {
    authActions.setLoading(true);

    try {
      // Check if tokens exist in localStorage
      const accessToken = localStorage.getItem("accessToken");
      const refreshToken = localStorage.getItem("refreshToken");

      if (!accessToken || !refreshToken) {
        authActions.setLoading(false);
        return;
      }

      // For Wails app, we'll assume tokens are valid if they exist
      // TODO: Implement token validation with Go backend if needed
      authStore.setState({
        isAuthenticated: true,
        accessToken,
        refreshToken,
        isLoading: false,
        error: null,
        user: null, // User will be set when login is called
      });
    } catch {
      // Failed to initialize auth
      authActions.logout();
    }
  },

  /**
   * Check if user has permission
   */
  hasPermission: (_action: string, _resource: string): boolean => {
    const state = authStore.state;

    if (!state.isAuthenticated || !state.user) {
      return false;
    }

    // For now, return true for authenticated users
    // TODO: Implement proper permission checking based on API response
    return true;
  },

  /**
   * Check if user has any of the specified roles
   */
  hasRole: (...roleNames: string[]): boolean => {
    const state = authStore.state;

    if (!state.isAuthenticated || !state.user) {
      return false;
    }

    return roleNames.some((roleName) => state.user!.roles.includes(roleName));
  },

  /**
   * Get user's role names
   */
  getUserRoles: (): string[] => {
    const state = authStore.state;

    if (!state.isAuthenticated || !state.user) {
      return [];
    }

    return state.user!.roles;
  },
};

/**
 * Authentication store selectors
 */
export const authSelectors = {
  /**
   * Get current authentication state
   */
  getState: () => authStore.state,

  /**
   * Check if user is authenticated
   */
  isAuthenticated: () => authStore.state.isAuthenticated,

  /**
   * Get current user
   */
  getUser: () => authStore.state.user,

  /**
   * Get loading state
   */
  isLoading: () => authStore.state.isLoading,

  /**
   * Get error state
   */
  getError: () => authStore.state.error,

  /**
   * Get access token
   */
  getAccessToken: () => authStore.state.accessToken,
};
