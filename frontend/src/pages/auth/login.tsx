/**
 * Login Page Component
 * Handles user authentication with form validation and error handling
 */

import { useNavigate, useSearch } from "@tanstack/react-router";
import { useStore } from "@tanstack/react-store";
import { GalleryVerticalEnd } from "lucide-react";
import React, { useEffect } from "react";

import { LoginForm } from "@/components/form/login";
import { useLogin } from "@/hooks/go/use-auth";
import { authStore, authSelectors } from "@/store";
import { RouteSearchParams } from "@/types/route";
import placeholderImage from "@/assets/images/placeholder.svg";

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const search = useSearch({ strict: false });
  const redirectTo = (search as RouteSearchParams)?.redirect || "/dashboard";

  const isAuthenticated = useStore(authStore, authSelectors.isAuthenticated);
  const authError = useStore(authStore, authSelectors.getError);

  const loginMutation = useLogin();

  const handleFormSubmit = async (data: {
    username: string;
    password: string;
  }) => {
    try {
      await loginMutation.mutateAsync(data);
      navigate({ to: redirectTo });
    } catch (error) {
      // Error is handled by the mutation
      console.error("Login failed:", error);
    }
  };

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate({ to: redirectTo });
    }
  }, [isAuthenticated, navigate, redirectTo]);

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="/" className="flex items-center gap-2 font-medium">
            <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
              <GalleryVerticalEnd className="size-4" />
            </div>
            CSmart
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <LoginForm
              onSubmit={handleFormSubmit}
              isLoading={loginMutation.isPending}
              error={
                authError ||
                loginMutation.error?.message ||
                (loginMutation.error
                  ? "Login failed. Please try again."
                  : undefined)
              }
              showHeader={false}
            />
          </div>
        </div>
      </div>
      <div className="bg-muted relative hidden lg:block">
        <img
          src={placeholderImage}
          alt="Login background"
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
      </div>
    </div>
  );
};

export default LoginPage;
