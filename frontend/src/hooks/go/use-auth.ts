/**
 * Wails Go Authentication Hooks
 * Custom hooks for authentication using Wails Go functions
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Login } from "@wailsjs/go/main/App";
import { main } from "@wailsjs/go/models";

import { authActions } from "@/store";
import { useErrorHandler } from "../ui/use-error-handler";
import { useNotifications } from "../ui/use-notifications";
import type { AuthResponse } from "@/types/auth";

/**
 * Login mutation hook using Wails Go function
 */
export const useLogin = () => {
  const queryClient = useQueryClient();
  const { handleApiError } = useErrorHandler();
  const { success } = useNotifications();

  return useMutation({
    mutationFn: async (credentials: { username: string; password: string }): Promise<AuthResponse> => {
      try {
        // Call Wails Go function
        const response: main.LoginResponse = await Login(credentials.username, credentials.password);

        // Check if login was successful
        if (!response.success) {
          throw new Error(response.message || "Login failed");
        }

        // Transform response to match our AuthResponse interface
        const authResponse: AuthResponse = {
          user: {
            id: response.data.user.id,
            username: response.data.user.username,
            name: response.data.user.name,
            email: response.data.user.email,
            gender: response.data.user.gender,
            roles: response.data.user.roles,
            scopes: response.data.user.scopes,
            created_at: response.data.user.created_at,
            current_tenant_id: response.data.user.current_tenant_id,
            // Add compatibility fields
            firstName: response.data.user.name?.split(' ')[0] || response.data.user.username,
            lastName: response.data.user.name?.split(' ').slice(1).join(' ') || '',
            isActive: true,
          },
          access_token: response.data.access_token,
          refresh_token: response.data.refresh_token,
          expires_in: response.data.expires_in,
          token_type: response.data.token_type,
        };

        return authResponse;
      } catch (error: any) {
        // Handle Wails errors
        throw new Error(error.message || "Login failed");
      }
    },
    onSuccess: (data) => {
      // Update authentication store
      authActions.setAuthenticated(
        data.user,
        data.access_token,
        data.refresh_token
      );

      // Set user data in cache
      queryClient.setQueryData(['auth', 'user'], data.user);

      // Show success notification
      success(`Welcome back, ${data.user.name || data.user.username}!`, "Login Successful");
    },
    onError: (error: Error) => {
      authActions.setError(error.message || "Login failed");
      handleApiError(error as any, {
        context: "Login",
        showNotification: true,
      });
    },
  });
};

/**
 * Register mutation hook (placeholder for future implementation)
 */
export const useRegister = () => {
  const { handleApiError } = useErrorHandler();
  const { success } = useNotifications();

  return useMutation({
    mutationFn: async (_userData: any): Promise<AuthResponse> => {
      // TODO: Implement register function in Go backend
      throw new Error("Register function not implemented yet");
    },
    onSuccess: (data) => {
      // Update authentication store
      authActions.setAuthenticated(
        data.user,
        data.access_token,
        data.refresh_token
      );

      // Show success notification
      success(
        `Welcome, ${data.user.name || data.user.username}! Your account has been created.`,
        "Registration Successful"
      );
    },
    onError: (error: Error) => {
      authActions.setError(error.message || "Registration failed");
      handleApiError(error as any, {
        context: "Registration",
        showNotification: true,
      });
    },
  });
};

/**
 * Logout mutation hook
 */
export const useLogout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<void> => {
      // For now, just clear local state
      // TODO: Implement logout function in Go backend if needed
    },
    onSuccess: () => {
      // Clear authentication store
      authActions.logout();

      // Clear all cached data
      queryClient.clear();
    },
    onError: () => {
      // Force logout even on error
      authActions.logout();
      queryClient.clear();
    },
  });
};
