/**
 * Wails Go Configuration Hooks
 * Custom hooks for configuration management using Wails Go functions
 */

import { useState, useEffect, useCallback } from 'react';
import { GetConfig, GetAPIBaseURL, GetEnvironment, IsDebugMode, GetAppInfo, ReloadConfig } from '@wailsjs/go/main/App';
import type { PublicConfig, AppInfo, UseConfigReturn, Environment } from '@/types/config';

/**
 * Hook for accessing application configuration
 */
export const useConfig = (): UseConfigReturn => {
  const [config, setConfig] = useState<PublicConfig | null>(null);
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load configuration from Wails backend
  const loadConfig = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load config and app info in parallel
      const [configData, appInfoData] = await Promise.all([
        GetConfig(),
        GetAppInfo(),
      ]);

      // Convert Wails types to our types
      const convertedConfig: PublicConfig = {
        app: {
          environment: configData.app.environment as Environment,
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
        environment: appInfoData.environment as Environment,
        debug: appInfoData.debug,
      };

      setConfig(convertedConfig);
      setAppInfo(convertedAppInfo);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to load configuration';
      setError(errorMessage);
      console.error('Failed to load config:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Reload configuration
  const reload = useCallback(async () => {
    try {
      setError(null);
      await ReloadConfig();
      await loadConfig();
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to reload configuration';
      setError(errorMessage);
      console.error('Failed to reload config:', err);
    }
  }, [loadConfig]);

  // Get API base URL
  const getAPIBaseURL = useCallback(async (): Promise<string> => {
    try {
      return await GetAPIBaseURL();
    } catch (err: any) {
      console.error('Failed to get API base URL:', err);
      throw new Error(err.message || 'Failed to get API base URL');
    }
  }, []);

  // Get environment
  const getEnvironment = useCallback(async (): Promise<string> => {
    try {
      return await GetEnvironment();
    } catch (err: any) {
      console.error('Failed to get environment:', err);
      throw new Error(err.message || 'Failed to get environment');
    }
  }, []);

  // Check if debug mode is enabled
  const isDebugMode = useCallback(async (): Promise<boolean> => {
    try {
      return await IsDebugMode();
    } catch (err: any) {
      console.error('Failed to check debug mode:', err);
      return false;
    }
  }, []);

  // Load config on mount
  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  // Computed environment flags
  const environment = config?.app?.environment || 'development';
  const isProduction = environment === 'production';
  const isDevelopment = environment === 'development';
  const isStaging = environment === 'staging';

  return {
    config,
    appInfo,
    isLoading,
    error,
    reload,
    getAPIBaseURL,
    getEnvironment,
    isDebugMode,
    isProduction,
    isDevelopment,
    isStaging,
  };
};

/**
 * Hook for accessing specific configuration values
 */
export const useConfigValue = <T>(
  getter: () => Promise<T>,
  defaultValue: T,
  deps: any[] = []
): { value: T; loading: boolean; error: string | null } => {
  const [value, setValue] = useState<T>(defaultValue);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadValue = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getter();
      setValue(result);
    } catch (err: any) {
      setError(err.message || 'Failed to load configuration value');
      console.error('Failed to load config value:', err);
    } finally {
      setLoading(false);
    }
  }, deps);

  useEffect(() => {
    loadValue();
  }, [loadValue]);

  return { value, loading, error };
};

/**
 * Hook for accessing API base URL
 */
export const useAPIBaseURL = () => {
  return useConfigValue(GetAPIBaseURL, '', []);
};

/**
 * Hook for accessing environment
 */
export const useEnvironment = () => {
  return useConfigValue(GetEnvironment, 'development' as Environment, []);
};

/**
 * Hook for accessing debug mode status
 */
export const useDebugMode = () => {
  return useConfigValue(IsDebugMode, false, []);
};

/**
 * Hook for accessing app info
 */
export const useAppInfo = () => {
  return useConfigValue(
    async () => {
      const info = await GetAppInfo();
      return info as AppInfo;
    },
    null as AppInfo | null,
    []
  );
};

/**
 * Hook for environment-specific behavior
 */
export const useEnvironmentBehavior = () => {
  const { config } = useConfig();
  const environment = config?.app?.environment || 'development';

  return {
    environment,
    isProduction: environment === 'production',
    isDevelopment: environment === 'development',
    isStaging: environment === 'staging',
    shouldShowDevTools: environment !== 'production',
    shouldEnableHotReload: environment === 'development',
    shouldEnableLogging: environment !== 'production' || config?.app?.debug,
    logLevel: environment === 'production' ? 'error' : 'debug',
  };
};

/**
 * Hook for configuration-based feature flags
 */
export const useFeatureFlags = () => {
  const { config, appInfo } = useConfig();
  const environment = config?.app?.environment || 'development';
  const debug = config?.app?.debug || false;

  return {
    enableMockAPI: environment === 'development' && debug,
    enableAdvancedLogging: environment !== 'production',
    enablePerformanceMonitoring: environment === 'production',
    enableExperimentalFeatures: environment === 'development',
    enableDevTools: environment !== 'production',
    enableHotReload: environment === 'development',
    enableErrorReporting: environment === 'production',
    enableAnalytics: environment === 'production',
  };
};

/**
 * Hook for runtime configuration validation
 */
export const useConfigValidation = () => {
  const { config, error } = useConfig();

  const validate = useCallback(() => {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config) {
      errors.push('Configuration not loaded');
      return { isValid: false, errors, warnings };
    }

    // Validate app config
    if (!config.app?.name) {
      errors.push('App name is required');
    }
    if (!config.app?.version) {
      errors.push('App version is required');
    }
    if (!config.app?.environment) {
      errors.push('App environment is required');
    }

    // Validate API config
    if (!config.api?.timeout || config.api.timeout <= 0) {
      errors.push('API timeout must be greater than 0');
    }
    if (config.api?.retryCount < 0) {
      errors.push('API retry count cannot be negative');
    }

    // Validate window config
    if (!config.window?.width || config.window.width < 400) {
      warnings.push('Window width should be at least 400px');
    }
    if (!config.window?.height || config.window.height < 300) {
      warnings.push('Window height should be at least 300px');
    }

    // Add error from hook if present
    if (error) {
      errors.push(error);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }, [config, error]);

  return validate();
};

/**
 * Hook for accessing configuration in a type-safe way
 */
export const useSafeConfig = () => {
  const { config, isLoading, error } = useConfig();

  if (isLoading) {
    return { config: null, isLoading: true, error: null };
  }

  if (error || !config) {
    return {
      config: null,
      isLoading: false,
      error: error || 'Configuration not available'
    };
  }

  return { config, isLoading: false, error: null };
};
