/**
 * Configuration types for frontend
 * These types should match the Go config structures
 */

// Environment types
export type Environment = 'development' | 'staging' | 'production';

// Public configuration that can be safely exposed to frontend
export interface PublicConfig {
  app: PublicAppConfig;
  api: PublicAPIConfig;
  window: PublicWindowConfig;
}

// App configuration (public subset)
export interface PublicAppConfig {
  environment: Environment;
  name: string;
  version: string;
  debug: boolean;
}

// API configuration (public subset)
export interface PublicAPIConfig {
  timeout: number; // in milliseconds
  retryCount: number;
}

// Window configuration
export interface PublicWindowConfig {
  width: number;
  height: number;
  resizable: boolean;
  fullscreen: boolean;
}

// App info interface
export interface AppInfo {
  name: string;
  version: string;
  environment: Environment;
  debug: boolean;
}

// Configuration context type
export interface ConfigContextType {
  config: PublicConfig | null;
  appInfo: AppInfo | null;
  isLoading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  getAPIBaseURL: () => Promise<string>;
  getEnvironment: () => Promise<string>;
  isDebugMode: () => Promise<boolean>;
}

// Configuration hook return type
export interface UseConfigReturn {
  config: PublicConfig | null;
  appInfo: AppInfo | null;
  isLoading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  getAPIBaseURL: () => Promise<string>;
  getEnvironment: () => Promise<string>;
  isDebugMode: () => Promise<boolean>;
  isProduction: boolean;
  isDevelopment: boolean;
  isStaging: boolean;
}

// Environment-specific configuration
export interface EnvironmentConfig {
  apiBaseURL: string;
  apiTimeout: number;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  enableDevTools: boolean;
  enableHotReload: boolean;
}

// Feature flags interface
export interface FeatureFlags {
  enableMockAPI: boolean;
  enableAdvancedLogging: boolean;
  enablePerformanceMonitoring: boolean;
  enableExperimentalFeatures: boolean;
}

// Runtime configuration interface
export interface RuntimeConfig {
  environment: Environment;
  apiBaseURL: string;
  timeout: number;
  retryCount: number;
  debug: boolean;
  features: FeatureFlags;
}

// Configuration validation result
export interface ConfigValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Configuration update payload
export interface ConfigUpdatePayload {
  key: string;
  value: any;
  environment?: Environment;
}

// Configuration change event
export interface ConfigChangeEvent {
  key: string;
  oldValue: any;
  newValue: any;
  timestamp: string;
}

// Configuration provider props
export interface ConfigProviderProps {
  children: React.ReactNode;
  fallbackConfig?: Partial<PublicConfig>;
  onError?: (error: Error) => void;
  onConfigChange?: (event: ConfigChangeEvent) => void;
}
