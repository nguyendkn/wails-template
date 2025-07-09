/**
 * Configuration Context Provider
 * Provides configuration data throughout the application
 */

import React, { createContext, useContext, useEffect, useState } from "react";
import type {
  ConfigContextType,
  PublicConfig,
  AppInfo,
  ConfigProviderProps,
} from "@/types/config";
import { GetConfig, GetAppInfo } from "@wailsjs/go/main/App";

// Create context
const ConfigContext = createContext<ConfigContextType | null>(null);

/**
 * Configuration Provider Component
 */
export const ConfigProvider: React.FC<ConfigProviderProps> = ({
  children,
  fallbackConfig,
  onError,
  onConfigChange,
}) => {
  const [config, setConfig] = useState<PublicConfig | null>(null);
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load configuration from Wails backend
  const loadConfig = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [configData, appInfoData] = await Promise.all([
        GetConfig(),
        GetAppInfo(),
      ]);

      // Convert Wails types to our types
      const convertedConfig: PublicConfig = {
        app: {
          environment: configData.app.environment as any,
          name: configData.app.name,
          version: configData.app.version,
          debug: configData.app.debug,
        },
        api: {
          timeout: configData.api.timeout,
          retryCount: configData.api.retryCount,
        },
        window: {
          width: configData.window.width,
          height: configData.window.height,
          resizable: configData.window.resizable,
          fullscreen: configData.window.fullscreen,
        },
      };

      const convertedAppInfo: AppInfo = {
        name: appInfoData.name,
        version: appInfoData.version,
        environment: appInfoData.environment as any,
        debug: appInfoData.debug,
      };

      // Store previous config for change detection
      const previousConfig = config;

      setConfig(convertedConfig);
      setAppInfo(convertedAppInfo);

      // Notify about config changes
      if (previousConfig && onConfigChange) {
        // Simple change detection - in a real app you might want more sophisticated diffing
        if (JSON.stringify(previousConfig) !== JSON.stringify(configData)) {
          onConfigChange({
            key: "config",
            oldValue: previousConfig,
            newValue: configData,
            timestamp: new Date().toISOString(),
          });
        }
      }
    } catch (err: any) {
      const errorMessage = err.message || "Failed to load configuration";
      setError(errorMessage);

      // Use fallback config if available
      if (fallbackConfig) {
        setConfig(fallbackConfig as PublicConfig);
      }

      // Notify error handler
      if (onError) {
        onError(new Error(errorMessage));
      }

      console.error("Failed to load config:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Reload configuration
  const reload = async () => {
    await loadConfig();
  };

  // Get API base URL
  const getAPIBaseURL = async (): Promise<string> => {
    const { GetAPIBaseURL } = await import("@wailsjs/go/main/App");
    return GetAPIBaseURL();
  };

  // Get environment
  const getEnvironment = async (): Promise<string> => {
    const { GetEnvironment } = await import("@wailsjs/go/main/App");
    return GetEnvironment();
  };

  // Check if debug mode is enabled
  const isDebugMode = async (): Promise<boolean> => {
    const { IsDebugMode } = await import("@wailsjs/go/main/App");
    return IsDebugMode();
  };

  // Load config on mount
  useEffect(() => {
    loadConfig();
  }, []);

  // Context value
  const contextValue: ConfigContextType = {
    config,
    appInfo,
    isLoading,
    error,
    reload,
    getAPIBaseURL,
    getEnvironment,
    isDebugMode,
  };

  return (
    <ConfigContext.Provider value={contextValue}>
      {children}
    </ConfigContext.Provider>
  );
};

/**
 * Hook to use configuration context
 */
export const useConfigContext = (): ConfigContextType => {
  const context = useContext(ConfigContext);

  if (!context) {
    throw new Error("useConfigContext must be used within a ConfigProvider");
  }

  return context;
};

/**
 * Higher-order component for configuration
 */
export const withConfig = <P extends object>(
  Component: React.ComponentType<P & { config: PublicConfig | null }>
) => {
  const WrappedComponent = (props: P) => {
    const { config } = useConfigContext();
    return <Component {...props} config={config} />;
  };

  WrappedComponent.displayName = `withConfig(${
    Component.displayName || Component.name
  })`;
  return WrappedComponent;
};

/**
 * Configuration guard component
 * Only renders children when configuration is loaded
 */
export const ConfigGuard: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showError?: boolean;
}> = ({ children, fallback, showError = true }) => {
  const { config, isLoading, error } = useConfigContext();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading configuration...</p>
        </div>
      </div>
    );
  }

  if (error && showError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <div className="text-red-500 mb-4">
            <svg
              className="w-12 h-12 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2">Configuration Error</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
          >
            Reload Application
          </button>
        </div>
      </div>
    );
  }

  if (!config && fallback) {
    return <>{fallback}</>;
  }

  if (!config) {
    return null;
  }

  return <>{children}</>;
};

/**
 * Environment-specific component renderer
 */
export const EnvironmentRenderer: React.FC<{
  development?: React.ReactNode;
  staging?: React.ReactNode;
  production?: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ development, staging, production, fallback }) => {
  const { config } = useConfigContext();

  const environment = config?.app?.environment;

  switch (environment) {
    case "development":
      return <>{development || fallback}</>;
    case "staging":
      return <>{staging || fallback}</>;
    case "production":
      return <>{production || fallback}</>;
    default:
      return <>{fallback}</>;
  }
};

/**
 * Debug-only component renderer
 */
export const DebugOnly: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ children, fallback }) => {
  const { config } = useConfigContext();

  const isDebug = config?.app?.debug;

  return <>{isDebug ? children : fallback}</>;
};
