package config

import (
	"fmt"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/go-playground/validator/v10"
	"github.com/joho/godotenv"
)

var (
	validate *validator.Validate
	instance *Config
)

func init() {
	validate = validator.New()

	// Register custom validators
	validate.RegisterValidation("semver", validateSemver)
}

// LoadConfig loads configuration from environment variables and .env files
func LoadConfig() (*Config, error) {
	if instance != nil {
		return instance, nil
	}

	// Determine environment
	env := Environment(getEnv("APP_ENV", "development"))

	// Validate environment file exists
	if err := CheckEnvironmentFile(env); err != nil {
		fmt.Printf("Warning: %v\n", err)
	}

	// Load environment file based on APP_ENV
	envFile := fmt.Sprintf(".env.%s", env)
	if _, err := os.Stat(envFile); err == nil {
		if err := godotenv.Load(envFile); err != nil {
			return nil, fmt.Errorf("failed to load %s: %w", envFile, err)
		}
	}

	// Also try to load .env file as fallback
	if _, err := os.Stat(".env"); err == nil {
		godotenv.Load(".env")
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
	return AppConfig{
		Environment: Environment(getEnv("APP_ENV", "development")),
		Name:        getEnv("APP_NAME", "CSmart Wails App"),
		Version:     getEnv("APP_VERSION", "1.0.0"),
		Debug:       getBoolEnv("APP_DEBUG", true),
		HotReload:   getBoolEnv("HOT_RELOAD", true),
		DevTools:    getBoolEnv("DEV_TOOLS", true),
		MockAPI:     getBoolEnv("MOCK_API", false),
	}
}

func loadAPIConfig() APIConfig {
	return APIConfig{
		BaseURL:     getEnv("API_BASE_URL", ""),
		Timeout:     getDurationEnv("API_TIMEOUT", 30*time.Second),
		RetryCount:  getIntEnv("API_RETRY_COUNT", 3),
		RetryDelay:  getDurationEnv("API_RETRY_DELAY", 1*time.Second),
		UserAgent:   getEnv("API_USER_AGENT", "CSmart-Wails/1.0"),
		MaxIdleConn: getIntEnv("API_MAX_IDLE_CONN", 10),
	}
}

func loadAuthConfig() AuthConfig {
	return AuthConfig{
		TokenExpiry:        getDurationEnv("AUTH_TOKEN_EXPIRY", 3600*time.Second),
		RefreshThreshold:   getDurationEnv("AUTH_REFRESH_THRESHOLD", 300*time.Second),
		MaxLoginAttempts:   getIntEnv("AUTH_MAX_LOGIN_ATTEMPTS", 5),
		LockoutDuration:    getDurationEnv("AUTH_LOCKOUT_DURATION", 15*time.Minute),
		SessionTimeout:     getDurationEnv("AUTH_SESSION_TIMEOUT", 24*time.Hour),
		RememberMeDuration: getDurationEnv("AUTH_REMEMBER_ME_DURATION", 30*24*time.Hour),
	}
}

func loadLogConfig() LogConfig {
	return LogConfig{
		Level:      LogLevel(getEnv("LOG_LEVEL", "debug")),
		Format:     LogFormat(getEnv("LOG_FORMAT", "json")),
		Output:     LogOutput(getEnv("LOG_OUTPUT", "console")),
		FilePath:   getEnv("LOG_FILE_PATH", "logs/app.log"),
		MaxSize:    getIntEnv("LOG_MAX_SIZE", 100),
		MaxBackups: getIntEnv("LOG_MAX_BACKUPS", 3),
		MaxAge:     getIntEnv("LOG_MAX_AGE", 28),
		Compress:   getBoolEnv("LOG_COMPRESS", true),
	}
}

func loadDatabaseConfig() DatabaseConfig {
	return DatabaseConfig{
		Host:         getEnv("DB_HOST", "localhost"),
		Port:         getIntEnv("DB_PORT", 5432),
		Name:         getEnv("DB_NAME", "csmart"),
		Username:     getEnv("DB_USERNAME", ""),
		Password:     getEnv("DB_PASSWORD", ""),
		SSLMode:      getEnv("DB_SSL_MODE", "disable"),
		MaxOpenConns: getIntEnv("DB_MAX_OPEN_CONNS", 25),
		MaxIdleConns: getIntEnv("DB_MAX_IDLE_CONNS", 5),
		ConnLifetime: getDurationEnv("DB_CONN_LIFETIME", 5*time.Minute),
	}
}

func loadSecurityConfig() SecurityConfig {
	corsOrigins := getEnv("CORS_ORIGINS", "")
	var origins []string
	if corsOrigins != "" {
		origins = strings.Split(corsOrigins, ",")
		for i, origin := range origins {
			origins[i] = strings.TrimSpace(origin)
		}
	}

	return SecurityConfig{
		CORSEnabled:      getBoolEnv("CORS_ENABLED", true),
		CORSOrigins:      origins,
		RateLimitEnabled: getBoolEnv("RATE_LIMIT_ENABLED", false),
		RateLimitRPS:     getIntEnv("RATE_LIMIT_RPS", 100),
		RateLimitBurst:   getIntEnv("RATE_LIMIT_BURST", 200),
		CSRFEnabled:      getBoolEnv("CSRF_ENABLED", false),
		CSRFSecret:       getEnv("CSRF_SECRET", ""),
	}
}

func loadWindowConfig() WindowConfig {
	return WindowConfig{
		Width:       getIntEnv("WINDOW_WIDTH", 1200),
		Height:      getIntEnv("WINDOW_HEIGHT", 800),
		Resizable:   getBoolEnv("WINDOW_RESIZABLE", true),
		Fullscreen:  getBoolEnv("WINDOW_FULLSCREEN", false),
		Maximized:   getBoolEnv("WINDOW_MAXIMIZED", false),
		Minimized:   getBoolEnv("WINDOW_MINIMIZED", false),
		AlwaysOnTop: getBoolEnv("WINDOW_ALWAYS_ON_TOP", false),
	}
}

func loadCacheConfig() CacheConfig {
	return CacheConfig{
		Enabled:            getBoolEnv("CACHE_ENABLED", false),
		TTL:                getDurationEnv("CACHE_TTL", 3600*time.Second),
		MaxSize:            getIntEnv("CACHE_MAX_SIZE", 100),
		MaxItems:           getIntEnv("CACHE_MAX_ITEMS", 10000),
		CompressionEnabled: getBoolEnv("COMPRESSION_ENABLED", false),
		EvictionPolicy:     getEnv("CACHE_EVICTION_POLICY", "lru"),
	}
}

// Helper functions for environment variable parsing
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getIntEnv(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intValue, err := strconv.Atoi(value); err == nil {
			return intValue
		}
	}
	return defaultValue
}

func getBoolEnv(key string, defaultValue bool) bool {
	if value := os.Getenv(key); value != "" {
		if boolValue, err := strconv.ParseBool(value); err == nil {
			return boolValue
		}
	}
	return defaultValue
}

func getDurationEnv(key string, defaultValue time.Duration) time.Duration {
	if value := os.Getenv(key); value != "" {
		// Try parsing as duration string first (e.g., "30s", "5m")
		if duration, err := time.ParseDuration(value); err == nil {
			return duration
		}
		// Try parsing as seconds
		if seconds, err := strconv.Atoi(value); err == nil {
			return time.Duration(seconds) * time.Second
		}
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
