package config

import (
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"os"
	"regexp"
	"strings"
)

// SecurityValidator provides security validation for configuration
type SecurityValidator struct {
	config *Config
}

// NewSecurityValidator creates a new security validator
func NewSecurityValidator(config *Config) *SecurityValidator {
	return &SecurityValidator{config: config}
}

// ValidateSecuritySettings validates security-related configuration
func (sv *SecurityValidator) ValidateSecuritySettings() []string {
	var warnings []string

	// Validate CORS settings
	if sv.config.Security.CORSEnabled {
		if len(sv.config.Security.CORSOrigins) == 0 {
			warnings = append(warnings, "CORS is enabled but no origins are specified")
		} else {
			for _, origin := range sv.config.Security.CORSOrigins {
				if !isValidOrigin(origin) {
					warnings = append(warnings, fmt.Sprintf("Invalid CORS origin: %s", origin))
				}
			}
		}
	}

	// Validate CSRF settings
	if sv.config.Security.CSRFEnabled {
		if sv.config.Security.CSRFSecret == "" {
			warnings = append(warnings, "CSRF is enabled but no secret is provided")
		} else if len(sv.config.Security.CSRFSecret) < 32 {
			warnings = append(warnings, "CSRF secret should be at least 32 characters long")
		}
	}

	// Validate rate limiting
	if sv.config.Security.RateLimitEnabled {
		if sv.config.Security.RateLimitRPS <= 0 {
			warnings = append(warnings, "Rate limiting is enabled but RPS is not positive")
		}
		if sv.config.Security.RateLimitBurst <= 0 {
			warnings = append(warnings, "Rate limiting is enabled but burst is not positive")
		}
	}

	// Check for production security requirements
	if sv.config.App.Environment == Production {
		warnings = append(warnings, sv.validateProductionSecurity()...)
	}

	return warnings
}

// validateProductionSecurity validates production-specific security requirements
func (sv *SecurityValidator) validateProductionSecurity() []string {
	var warnings []string

	// Debug mode should be disabled in production
	if sv.config.App.Debug {
		warnings = append(warnings, "Debug mode should be disabled in production")
	}

	// Dev tools should be disabled in production
	if sv.config.App.DevTools {
		warnings = append(warnings, "Dev tools should be disabled in production")
	}

	// CORS should be properly configured in production
	if sv.config.Security.CORSEnabled {
		for _, origin := range sv.config.Security.CORSOrigins {
			if strings.Contains(origin, "localhost") || strings.Contains(origin, "127.0.0.1") {
				warnings = append(warnings, "Localhost origins should not be allowed in production")
			}
		}
	}

	// Database SSL should be enabled in production
	if sv.config.Database.SSLMode == "disable" {
		warnings = append(warnings, "Database SSL should be enabled in production")
	}

	// API timeout should be reasonable in production
	if sv.config.API.Timeout.Seconds() > 60 {
		warnings = append(warnings, "API timeout is very high for production environment")
	}

	return warnings
}

// SanitizeConfig removes or masks sensitive information from config
func (sv *SecurityValidator) SanitizeConfig() *Config {
	sanitized := *sv.config

	// Mask sensitive database information
	if sanitized.Database.Password != "" {
		sanitized.Database.Password = "***MASKED***"
	}

	// Mask CSRF secret
	if sanitized.Security.CSRFSecret != "" {
		sanitized.Security.CSRFSecret = "***MASKED***"
	}

	return &sanitized
}

// GenerateSecureSecret generates a cryptographically secure secret
func GenerateSecureSecret(length int) (string, error) {
	if length < 16 {
		return "", fmt.Errorf("secret length must be at least 16 characters")
	}

	bytes := make([]byte, length)
	if _, err := rand.Read(bytes); err != nil {
		return "", fmt.Errorf("failed to generate secure random bytes: %w", err)
	}

	return base64.URLEncoding.EncodeToString(bytes)[:length], nil
}

// isValidOrigin validates CORS origin format
func isValidOrigin(origin string) bool {
	if origin == "*" {
		return true // Wildcard is valid but not recommended for production
	}

	// Basic URL validation
	urlPattern := regexp.MustCompile(`^https?://[a-zA-Z0-9.-]+(:[0-9]+)?$`)
	return urlPattern.MatchString(origin)
}

// SecureConfigLoader provides secure configuration loading
type SecureConfigLoader struct {
	validator *SecurityValidator
}

// NewSecureConfigLoader creates a new secure config loader
func NewSecureConfigLoader() *SecureConfigLoader {
	return &SecureConfigLoader{}
}

// LoadSecureConfig loads configuration with security validation
func (scl *SecureConfigLoader) LoadSecureConfig() (*Config, error) {
	// Load base configuration
	config, err := LoadConfig()
	if err != nil {
		return nil, fmt.Errorf("failed to load base configuration: %w", err)
	}

	// Create validator
	scl.validator = NewSecurityValidator(config)

	// Validate security settings
	warnings := scl.validator.ValidateSecuritySettings()
	if len(warnings) > 0 {
		for _, warning := range warnings {
			fmt.Printf("Security Warning: %s\n", warning)
		}
	}

	// Apply security defaults if needed
	if err := scl.applySecurityDefaults(config); err != nil {
		return nil, fmt.Errorf("failed to apply security defaults: %w", err)
	}

	return config, nil
}

// applySecurityDefaults applies secure defaults for missing security configuration
func (scl *SecureConfigLoader) applySecurityDefaults(config *Config) error {
	// Generate CSRF secret if enabled but not provided
	if config.Security.CSRFEnabled && config.Security.CSRFSecret == "" {
		secret, err := GenerateSecureSecret(64)
		if err != nil {
			return fmt.Errorf("failed to generate CSRF secret: %w", err)
		}
		config.Security.CSRFSecret = secret
		fmt.Println("Generated secure CSRF secret")
	}

	// Set secure defaults for production
	if config.App.Environment == Production {
		// Disable debug features
		config.App.Debug = false
		config.App.DevTools = false
		config.App.HotReload = false

		// Enable security features
		if !config.Security.RateLimitEnabled {
			config.Security.RateLimitEnabled = true
			config.Security.RateLimitRPS = 100
			config.Security.RateLimitBurst = 200
		}

		// Ensure SSL for database
		if config.Database.SSLMode == "disable" {
			config.Database.SSLMode = "require"
		}
	}

	return nil
}

// EnvironmentValidator validates environment-specific requirements
type EnvironmentValidator struct {
	environment Environment
}

// NewEnvironmentValidator creates a new environment validator
func NewEnvironmentValidator(env Environment) *EnvironmentValidator {
	return &EnvironmentValidator{environment: env}
}

// ValidateEnvironment validates environment-specific configuration requirements
func (ev *EnvironmentValidator) ValidateEnvironment(config *Config) []string {
	var errors []string

	switch ev.environment {
	case Development:
		errors = append(errors, ev.validateDevelopment(config)...)
	case Staging:
		errors = append(errors, ev.validateStaging(config)...)
	case Production:
		errors = append(errors, ev.validateProduction(config)...)
	}

	return errors
}

// validateDevelopment validates development environment requirements
func (ev *EnvironmentValidator) validateDevelopment(config *Config) []string {
	var errors []string

	// Development should have debug enabled
	if !config.App.Debug {
		errors = append(errors, "Debug mode should be enabled in development")
	}

	// Check for localhost API URLs
	if !strings.Contains(config.API.BaseURL, "localhost") && !strings.Contains(config.API.BaseURL, "127.0.0.1") && !strings.Contains(config.API.BaseURL, "test") {
		errors = append(errors, "Development should typically use localhost or test API URLs")
	}

	return errors
}

// validateStaging validates staging environment requirements
func (ev *EnvironmentValidator) validateStaging(config *Config) []string {
	var errors []string

	// Staging should not use localhost
	if strings.Contains(config.API.BaseURL, "localhost") || strings.Contains(config.API.BaseURL, "127.0.0.1") {
		errors = append(errors, "Staging should not use localhost API URLs")
	}

	// Staging should have reasonable timeouts
	if config.API.Timeout.Seconds() < 10 {
		errors = append(errors, "API timeout is too low for staging environment")
	}

	return errors
}

// validateProduction validates production environment requirements
func (ev *EnvironmentValidator) validateProduction(config *Config) []string {
	var errors []string

	// Production must not have debug enabled
	if config.App.Debug {
		errors = append(errors, "Debug mode must be disabled in production")
	}

	// Production must not have dev tools enabled
	if config.App.DevTools {
		errors = append(errors, "Dev tools must be disabled in production")
	}

	// Production must use HTTPS API URLs
	if !strings.HasPrefix(config.API.BaseURL, "https://") {
		errors = append(errors, "Production must use HTTPS API URLs")
	}

	// Production should have SSL enabled for database
	if config.Database.SSLMode == "disable" {
		errors = append(errors, "Database SSL must be enabled in production")
	}

	// Production should have rate limiting enabled
	if !config.Security.RateLimitEnabled {
		errors = append(errors, "Rate limiting should be enabled in production")
	}

	return errors
}

// CheckEnvironmentFile validates that the correct environment file exists
func CheckEnvironmentFile(env Environment) error {
	envFile := fmt.Sprintf(".env.%s", env)
	if _, err := os.Stat(envFile); os.IsNotExist(err) {
		return fmt.Errorf("environment file %s does not exist", envFile)
	}
	return nil
}
