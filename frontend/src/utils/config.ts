/**
 * Configuration utilities for frontend
 * Provides fallback values and validation for configuration
 */

import type { PublicConfig, Environment, ConfigValidationResult } from '@/types/config';

// Default fallback configuration
export const DEFAULT_CONFIG: PublicConfig = {
  app: {
    environment: 'development',
    name: 'CSmart Wails App',
    version: '1.0.0',
    debug: true,
  },
  api: {
    timeout: 30000, // 30 seconds in milliseconds
    retryCount: 3,
  },
  window: {
    width: 1200,
    height: 800,
    resizable: true,
    fullscreen: false,
  },
};

// Environment-specific defaults
export const ENVIRONMENT_DEFAULTS: Record<Environment, Partial<PublicConfig>> = {
  development: {
    app: {
      environment: 'development',
      name: 'CSmart Wails App',
      version: '1.0.0',
      debug: true,
    },
    api: {
      timeout: 30000,
      retryCount: 3,
    },
  },
  staging: {
    app: {
      environment: 'staging',
      name: 'CSmart Wails App',
      version: '1.0.0',
      debug: true,
    },
    api: {
      timeout: 20000,
      retryCount: 3,
    },
  },
  production: {
    app: {
      environment: 'production',
      name: 'CSmart Wails App',
      version: '1.0.0',
      debug: false,
    },
    api: {
      timeout: 15000,
      retryCount: 2,
    },
  },
};

/**
 * Merges configuration with fallback values
 */
export const mergeWithDefaults = (config: Partial<PublicConfig> | null): PublicConfig => {
  if (!config) {
    return DEFAULT_CONFIG;
  }

  const environment = config.app?.environment || 'development';
  const envDefaults = ENVIRONMENT_DEFAULTS[environment];

  return {
    app: {
      ...DEFAULT_CONFIG.app,
      ...envDefaults.app,
      ...config.app,
    },
    api: {
      ...DEFAULT_CONFIG.api,
      ...envDefaults.api,
      ...config.api,
    },
    window: {
      ...DEFAULT_CONFIG.window,
      ...envDefaults.window,
      ...config.window,
    },
  };
};

/**
 * Validates configuration values
 */
export const validateConfig = (config: PublicConfig | null): ConfigValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!config) {
    errors.push('Configuration is null or undefined');
    return { isValid: false, errors, warnings };
  }

  // Validate app configuration
  if (!config.app) {
    errors.push('App configuration is missing');
  } else {
    if (!config.app.name || config.app.name.trim() === '') {
      errors.push('App name is required');
    }
    if (!config.app.version || config.app.version.trim() === '') {
      errors.push('App version is required');
    }
    if (!config.app.environment) {
      errors.push('App environment is required');
    } else if (!['development', 'staging', 'production'].includes(config.app.environment)) {
      errors.push('Invalid app environment');
    }
  }

  // Validate API configuration
  if (!config.api) {
    errors.push('API configuration is missing');
  } else {
    if (!config.api.timeout || config.api.timeout <= 0) {
      errors.push('API timeout must be greater than 0');
    } else if (config.api.timeout < 5000) {
      warnings.push('API timeout is very low (< 5 seconds)');
    } else if (config.api.timeout > 120000) {
      warnings.push('API timeout is very high (> 2 minutes)');
    }

    if (config.api.retryCount < 0) {
      errors.push('API retry count cannot be negative');
    } else if (config.api.retryCount > 10) {
      warnings.push('API retry count is very high (> 10)');
    }
  }

  // Validate window configuration
  if (!config.window) {
    errors.push('Window configuration is missing');
  } else {
    if (!config.window.width || config.window.width < 400) {
      warnings.push('Window width should be at least 400px');
    }
    if (!config.window.height || config.window.height < 300) {
      warnings.push('Window height should be at least 300px');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

/**
 * Gets environment-specific configuration
 */
export const getEnvironmentConfig = (environment: Environment): Partial<PublicConfig> => {
  return ENVIRONMENT_DEFAULTS[environment] || ENVIRONMENT_DEFAULTS.development;
};

/**
 * Checks if the current environment is production
 */
export const isProduction = (config: PublicConfig | null): boolean => {
  return config?.app?.environment === 'production';
};

/**
 * Checks if the current environment is development
 */
export const isDevelopment = (config: PublicConfig | null): boolean => {
  return config?.app?.environment === 'development';
};

/**
 * Checks if the current environment is staging
 */
export const isStaging = (config: PublicConfig | null): boolean => {
  return config?.app?.environment === 'staging';
};

/**
 * Checks if debug mode is enabled
 */
export const isDebugMode = (config: PublicConfig | null): boolean => {
  return config?.app?.debug === true;
};

/**
 * Gets the API timeout in milliseconds
 */
export const getAPITimeout = (config: PublicConfig | null): number => {
  return config?.api?.timeout || DEFAULT_CONFIG.api.timeout;
};

/**
 * Gets the API retry count
 */
export const getAPIRetryCount = (config: PublicConfig | null): number => {
  return config?.api?.retryCount || DEFAULT_CONFIG.api.retryCount;
};

/**
 * Sanitizes configuration for logging (removes sensitive data)
 */
export const sanitizeConfigForLogging = (config: PublicConfig | null): Record<string, any> => {
  if (!config) {
    return { error: 'Configuration is null' };
  }

  return {
    app: {
      environment: config.app.environment,
      name: config.app.name,
      version: config.app.version,
      debug: config.app.debug,
    },
    api: {
      timeout: config.api.timeout,
      retryCount: config.api.retryCount,
    },
    window: {
      width: config.window.width,
      height: config.window.height,
      resizable: config.window.resizable,
      fullscreen: config.window.fullscreen,
    },
  };
};

/**
 * Creates a configuration object with safe defaults
 */
export const createSafeConfig = (partialConfig?: Partial<PublicConfig>): PublicConfig => {
  const merged = mergeWithDefaults(partialConfig || null);
  const validation = validateConfig(merged);

  if (!validation.isValid) {
    console.warn('Configuration validation failed, using defaults:', validation.errors);
    return DEFAULT_CONFIG;
  }

  if (validation.warnings.length > 0) {
    console.warn('Configuration warnings:', validation.warnings);
  }

  return merged;
};

/**
 * Configuration error handler
 */
export class ConfigError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: any
  ) {
    super(message);
    this.name = 'ConfigError';
  }
}

/**
 * Handles configuration loading errors gracefully
 */
export const handleConfigError = (error: any): PublicConfig => {
  console.error('Configuration loading failed:', error);

  // Log the error details for debugging
  if (error instanceof ConfigError) {
    console.error('Config Error Code:', error.code);
    console.error('Config Error Details:', error.details);
  }

  // Return safe default configuration
  return DEFAULT_CONFIG;
};

/**
 * Validates that required configuration is available
 */
export const ensureRequiredConfig = (config: PublicConfig | null): PublicConfig => {
  if (!config) {
    throw new ConfigError('Configuration is required but not available', 'CONFIG_MISSING');
  }

  const validation = validateConfig(config);
  if (!validation.isValid) {
    throw new ConfigError(
      'Configuration validation failed',
      'CONFIG_INVALID',
      validation.errors
    );
  }

  return config;
};

/**
 * Configuration cache for performance
 */
class ConfigCache {
  private cache = new Map<string, any>();
  private ttl = 5 * 60 * 1000; // 5 minutes

  set(key: string, value: any): void {
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
    });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) {
      return null;
    }

    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  clear(): void {
    this.cache.clear();
  }
}

export const configCache = new ConfigCache();
