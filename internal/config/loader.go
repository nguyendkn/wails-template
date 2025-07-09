package config

import (
	"fmt"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/go-playground/validator/v10"
	"gopkg.in/ini.v1"
)

var (
	validate  *validator.Validate
	instance  *Config
	iniConfig *ini.File
)

func init() {
	validate = validator.New()

	// Register custom validators
	validate.RegisterValidation("semver", validateSemver)
}

// LoadConfig loads configuration from INI files
func LoadConfig() (*Config, error) {
	if instance != nil {
		return instance, nil
	}

	// Determine environment from environment variable or default
	env := Environment(os.Getenv("APP_ENV"))
	if env == "" {
		env = "development"
	}

	// Load single INI configuration file
	var err error
	iniConfig, err = ini.Load("config.ini")
	if err != nil {
		return nil, fmt.Errorf("failed to load configuration file config.ini: %w", err)
	}

	config := &Config{
		App:      loadAppConfig(),
		API:      loadAPIConfig(),
		Auth:     loadAuthConfig(),
		Log:      loadLogConfig(),
		Database: loadDatabaseConfig(),
		Security: loadSecurityConfig(),
		Window:   loadWindowConfig(),
		Cache:    loadCacheConfig(),
	}

	// Validate configuration structure
	if err := validate.Struct(config); err != nil {
		return nil, fmt.Errorf("configuration validation failed: %w", err)
	}

	// Validate environment-specific requirements
	envValidator := NewEnvironmentValidator(env)
	if envErrors := envValidator.ValidateEnvironment(config); len(envErrors) > 0 {
		for _, err := range envErrors {
			fmt.Printf("Environment Validation Error: %s\n", err)
		}
		// Don't fail on environment validation errors, just warn
	}

	// Validate security settings
	secValidator := NewSecurityValidator(config)
	if secWarnings := secValidator.ValidateSecuritySettings(); len(secWarnings) > 0 {
		for _, warning := range secWarnings {
			fmt.Printf("Security Warning: %s\n", warning)
		}
	}

	// Post-validation adjustments
	if err := postValidationAdjustments(config); err != nil {
		return nil, fmt.Errorf("post-validation adjustments failed: %w", err)
	}

	instance = config
	return config, nil
}

// GetConfig returns the loaded configuration instance
func GetConfig() *Config {
	if instance == nil {
		panic("configuration not loaded. Call LoadConfig() first")
	}
	return instance
}

// ReloadConfig reloads the configuration
func ReloadConfig() (*Config, error) {
	instance = nil
	return LoadConfig()
}

// GetPublicConfig returns configuration safe for frontend consumption
func GetPublicConfig() *PublicConfig {
	config := GetConfig()
	return &PublicConfig{
		App: PublicAppConfig{
			Environment: config.App.Environment,
			Name:        config.App.Name,
			Version:     config.App.Version,
			Debug:       config.App.Debug,
		},
		API: PublicAPIConfig{
			Timeout:    config.API.Timeout,
			RetryCount: config.API.RetryCount,
		},
		Window: PublicWindowConfig{
			Width:      config.Window.Width,
			Height:     config.Window.Height,
			Resizable:  config.Window.Resizable,
			Fullscreen: config.Window.Fullscreen,
		},
	}
}

func loadAppConfig() AppConfig {
	// Environment can be overridden by APP_ENV environment variable
	env := os.Getenv("APP_ENV")
	if env == "" {
		env = getConfigValue("app", "environment", "development")
	}

	return AppConfig{
		Environment: Environment(env),
		Name:        getConfigValue("app", "name", "CSmart Wails App"),
		Version:     getConfigValue("app", "version", "1.0.0"),
		Debug:       getConfigBool("app", "debug", true),
		HotReload:   getConfigBool("development", "hot_reload", true),
		DevTools:    getConfigBool("development", "dev_tools", true),
		MockAPI:     getConfigBool("development", "mock_api", false),
	}
}

func loadAPIConfig() APIConfig {
	return APIConfig{
		BaseURL:     getConfigValue("api", "base_url", ""),
		Timeout:     getConfigDuration("api", "timeout", 30*time.Second),
		RetryCount:  getConfigInt("api", "retry_count", 3),
		RetryDelay:  getConfigDuration("api", "retry_delay", 1*time.Second),
		UserAgent:   getConfigValue("api", "user_agent", "CSmart-Wails/1.0"),
		MaxIdleConn: getConfigInt("api", "max_idle_conn", 10),
	}
}

func loadAuthConfig() AuthConfig {
	return AuthConfig{
		TokenExpiry:        getConfigDuration("auth", "token_expiry", 3600*time.Second),
		RefreshThreshold:   getConfigDuration("auth", "refresh_threshold", 300*time.Second),
		MaxLoginAttempts:   getConfigInt("auth", "max_login_attempts", 5),
		LockoutDuration:    getConfigDuration("auth", "lockout_duration", 15*time.Minute),
		SessionTimeout:     getConfigDuration("auth", "session_timeout", 24*time.Hour),
		RememberMeDuration: getConfigDuration("auth", "remember_me_duration", 30*24*time.Hour),
	}
}

func loadLogConfig() LogConfig {
	return LogConfig{
		Level:      LogLevel(getConfigValue("log", "level", "debug")),
		Format:     LogFormat(getConfigValue("log", "format", "json")),
		Output:     LogOutput(getConfigValue("log", "output", "console")),
		FilePath:   getConfigValue("log", "file_path", "logs/app.log"),
		MaxSize:    getConfigInt("log", "max_size", 100),
		MaxBackups: getConfigInt("log", "max_backups", 3),
		MaxAge:     getConfigInt("log", "max_age", 28),
		Compress:   getConfigBool("log", "compress", true),
	}
}

func loadDatabaseConfig() DatabaseConfig {
	return DatabaseConfig{
		Host:         getConfigValue("database", "host", "localhost"),
		Port:         getConfigInt("database", "port", 5432),
		Name:         getConfigValue("database", "name", "csmart"),
		Username:     getConfigValue("database", "username", ""),
		Password:     getConfigValue("database", "password", ""),
		SSLMode:      getConfigValue("database", "ssl_mode", "disable"),
		MaxOpenConns: getConfigInt("database", "max_open_conns", 25),
		MaxIdleConns: getConfigInt("database", "max_idle_conns", 5),
		ConnLifetime: getConfigDuration("database", "conn_lifetime", 5*time.Minute),
	}
}

func loadSecurityConfig() SecurityConfig {
	corsOrigins := getConfigValue("security", "cors_origins", "")
	var origins []string
	if corsOrigins != "" {
		origins = strings.Split(corsOrigins, ",")
		for i, origin := range origins {
			origins[i] = strings.TrimSpace(origin)
		}
	}

	return SecurityConfig{
		CORSEnabled:      getConfigBool("security", "cors_enabled", true),
		CORSOrigins:      origins,
		RateLimitEnabled: getConfigBool("security", "rate_limit_enabled", false),
		RateLimitRPS:     getConfigInt("security", "rate_limit_rps", 100),
		RateLimitBurst:   getConfigInt("security", "rate_limit_burst", 200),
		CSRFEnabled:      getConfigBool("security", "csrf_enabled", false),
		CSRFSecret:       getConfigValue("security", "csrf_secret", ""),
	}
}

func loadWindowConfig() WindowConfig {
	return WindowConfig{
		Width:       getConfigInt("window", "width", 1200),
		Height:      getConfigInt("window", "height", 800),
		Resizable:   getConfigBool("window", "resizable", true),
		Fullscreen:  getConfigBool("window", "fullscreen", false),
		Maximized:   getConfigBool("window", "maximized", false),
		Minimized:   getConfigBool("window", "minimized", false),
		AlwaysOnTop: getConfigBool("window", "always_on_top", false),
	}
}

func loadCacheConfig() CacheConfig {
	return CacheConfig{
		Enabled:            getConfigBool("cache", "enabled", false),
		TTL:                getConfigDuration("cache", "ttl", 3600*time.Second),
		MaxSize:            getConfigInt("cache", "max_size", 100),
		MaxItems:           getConfigInt("cache", "max_items", 10000),
		CompressionEnabled: getConfigBool("cache", "compression_enabled", false),
		EvictionPolicy:     getConfigValue("cache", "eviction_policy", "lru"),
	}
}

// Helper functions for INI configuration parsing
func getConfigValue(section, key, defaultValue string) string {
	if iniConfig == nil {
		return defaultValue
	}
	sec := iniConfig.Section(section)
	if sec == nil {
		return defaultValue
	}
	return sec.Key(key).MustString(defaultValue)
}

func getConfigInt(section, key string, defaultValue int) int {
	if iniConfig == nil {
		return defaultValue
	}
	sec := iniConfig.Section(section)
	if sec == nil {
		return defaultValue
	}
	return sec.Key(key).MustInt(defaultValue)
}

func getConfigBool(section, key string, defaultValue bool) bool {
	if iniConfig == nil {
		return defaultValue
	}
	sec := iniConfig.Section(section)
	if sec == nil {
		return defaultValue
	}
	return sec.Key(key).MustBool(defaultValue)
}

func getConfigDuration(section, key string, defaultValue time.Duration) time.Duration {
	if iniConfig == nil {
		return defaultValue
	}
	sec := iniConfig.Section(section)
	if sec == nil {
		return defaultValue
	}
	value := sec.Key(key).String()
	if value == "" {
		return defaultValue
	}

	// Try parsing as duration string first (e.g., "30s", "5m")
	if duration, err := time.ParseDuration(value); err == nil {
		return duration
	}
	// Try parsing as seconds
	if seconds, err := strconv.Atoi(value); err == nil {
		return time.Duration(seconds) * time.Second
	}
	return defaultValue
}

// postValidationAdjustments performs any necessary adjustments after validation
func postValidationAdjustments(config *Config) error {
	// Ensure log directory exists
	if config.Log.Output == LogOutputFile || config.Log.Output == LogOutputBoth {
		logDir := filepath.Dir(config.Log.FilePath)
		if err := os.MkdirAll(logDir, 0755); err != nil {
			return fmt.Errorf("failed to create log directory: %w", err)
		}
	}

	// Set user agent if not provided
	if config.API.UserAgent == "" {
		config.API.UserAgent = fmt.Sprintf("%s/%s", config.App.Name, config.App.Version)
	}

	return nil
}

// validateSemver validates semantic version format
func validateSemver(fl validator.FieldLevel) bool {
	version := fl.Field().String()
	// Simple semver validation (major.minor.patch)
	parts := strings.Split(version, ".")
	if len(parts) != 3 {
		return false
	}
	for _, part := range parts {
		if _, err := strconv.Atoi(part); err != nil {
			return false
		}
	}
	return true
}
