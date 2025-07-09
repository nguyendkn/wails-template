/**
 * Theme types
 */
export type Theme = "light" | "dark" | "system";

/**
 * Application configuration
 */
export interface AppConfig {
  apiBaseUrl: string;
  environment: "development" | "staging" | "production";
  version: string;
  features: {
    [key: string]: boolean;
  };
}
