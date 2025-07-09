/**
 * Route Guard Components
 * Components for protecting routes and handling authentication
 */

import React, { useEffect } from "react";
import { useNavigate, useLocation } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";

import { useAuth } from "@/hooks/use-auth";
import { ProtectedLayout } from "@/components/layout/protected-layout";
import { UnProtectedLayout } from "@/components/layout/unprotected-layout";

interface RouteGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requiredRoles?: string[];
  requiredPermissions?: string[];
  fallbackPath?: string;
}

/**
 * Loading component for authentication checks
 */
const AuthLoadingSpinner: React.FC = () => {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="text-sm text-muted-foreground">
          Checking authentication...
        </p>
      </div>
    </div>
  );
};

/**
 * Unauthorized access component
 */
const UnauthorizedAccess: React.FC<{ message?: string }> = ({
  message = "You don't have permission to access this page.",
}) => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-destructive">403</h1>
        <h2 className="text-xl font-semibold">Access Denied</h2>
        <p className="text-muted-foreground max-w-md">{message}</p>
        <div className="space-x-2">
          <button
            onClick={() => navigate({ to: "/" })}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Go Home
          </button>
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 border border-input rounded-md hover:bg-accent"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Route Guard Component
 * Protects routes based on authentication and authorization requirements
 */
export const RouteGuard: React.FC<RouteGuardProps> = ({
  children,
  requireAuth = false,
  requiredRoles = [],
  requiredPermissions = [],
  fallbackPath = "/login",
}) => {
  const { isAuthenticated, user, isLoading, hasRole, hasPermission } =
    useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // If authentication is required but user is not authenticated
    if (requireAuth && !isLoading && !isAuthenticated) {
      const currentPath = location.pathname;
      navigate({
        to: fallbackPath,
        search: { redirect: currentPath },
      });
      return;
    }

    // If user is authenticated but accessing auth pages, redirect to dashboard
    if (
      isAuthenticated &&
      !requireAuth &&
      ["/login", "/register"].includes(location.pathname)
    ) {
      navigate({ to: "/dashboard" });
      return;
    }
  }, [
    isAuthenticated,
    isLoading,
    requireAuth,
    navigate,
    location.pathname,
    fallbackPath,
  ]);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return <AuthLoadingSpinner />;
  }

  // If authentication is required but user is not authenticated
  if (requireAuth && !isAuthenticated) {
    return <AuthLoadingSpinner />;
  }

  // Check role requirements
  if (requireAuth && isAuthenticated && requiredRoles.length > 0) {
    const hasRequiredRole = requiredRoles.some((role) => hasRole(role));
    if (!hasRequiredRole) {
      return (
        <UnauthorizedAccess
          message={`You need one of the following roles: ${requiredRoles.join(
            ", "
          )}`}
        />
      );
    }
  }

  // Check permission requirements
  if (requireAuth && isAuthenticated && requiredPermissions.length > 0) {
    const hasRequiredPermission = requiredPermissions.some((permission) =>
      hasPermission(permission)
    );
    if (!hasRequiredPermission) {
      return (
        <UnauthorizedAccess
          message={`You need one of the following permissions: ${requiredPermissions.join(
            ", "
          )}`}
        />
      );
    }
  }

  return <>{children}</>;
};

/**
 * Protected Route Component
 * Wrapper that combines RouteGuard with ProtectedLayout
 */
export const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  requiredRoles?: string[];
  requiredPermissions?: string[];
}> = ({ children, requiredRoles, requiredPermissions }) => {
  return (
    <RouteGuard
      requireAuth={true}
      requiredRoles={requiredRoles}
      requiredPermissions={requiredPermissions}
    >
      <ProtectedLayout>{children}</ProtectedLayout>
    </RouteGuard>
  );
};

/**
 * Public Route Component
 * Wrapper that combines RouteGuard with UnProtectedLayout
 */
export const PublicRoute: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  return (
    <RouteGuard requireAuth={false}>
      <UnProtectedLayout>{children}</UnProtectedLayout>
    </RouteGuard>
  );
};

/**
 * Auth Route Component
 * Special wrapper for authentication pages (login, register)
 * Redirects to dashboard if already authenticated
 */
export const AuthRoute: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  return (
    <RouteGuard requireAuth={false}>
      <div className="min-h-screen bg-background">{children}</div>
    </RouteGuard>
  );
};
