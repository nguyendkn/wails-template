package config

import "time"

// Environment represents the application environment
type Environment string

const (
	Development Environment = "development"
	Staging     Environment = "staging"
	Production  Environment = "production"
)

// LogLevel represents logging levels
type LogLevel string

const (
	LogLevelDebug LogLevel = "debug"
	LogLevelInfo  LogLevel = "info"
	LogLevelWarn  LogLevel = "warn"
	LogLevelError LogLevel = "error"
)

// LogFormat represents log output formats
type LogFormat string

const (
	LogFormatJSON LogFormat = "json"
	LogFormatText LogFormat = "text"
)

// LogOutput represents where logs should be written
type LogOutput string

const (
	LogOutputConsole LogOutput = "console"
	LogOutputFile    LogOutput = "file"
	LogOutputBoth    LogOutput = "both"
)

// Config represents the complete application configuration
type Config struct {
	App      AppConfig      `json:"app"`
	API      APIConfig      `json:"api"`
	Auth     AuthConfig     `json:"auth"`
	Log      LogConfig      `json:"log"`
	Database DatabaseConfig `json:"database"`
	Security SecurityConfig `json:"security"`
	Window   WindowConfig   `json:"window"`
	Cache    CacheConfig    `json:"cache"`
}

// AppConfig contains application-level configuration
type AppConfig struct {
	Environment Environment `json:"environment" validate:"required,oneof=development staging production"`
	Name        string      `json:"name" validate:"required,min=1,max=100"`
	Version     string      `json:"version" validate:"required,semver"`
	Debug       bool        `json:"debug"`
	HotReload   bool        `json:"hotReload"`
	DevTools    bool        `json:"devTools"`
	MockAPI     bool        `json:"mockApi"`
}

// APIConfig contains API-related configuration
type APIConfig struct {
	BaseURL     string        `json:"baseUrl" validate:"required,url"`
	Timeout     time.Duration `json:"timeout" validate:"required"`
	RetryCount  int           `json:"retryCount" validate:"min=0,max=10"`
	RetryDelay  time.Duration `json:"retryDelay"`
	UserAgent   string        `json:"userAgent"`
	MaxIdleConn int           `json:"maxIdleConn" validate:"min=1,max=100"`
}

// AuthConfig contains authentication configuration
type AuthConfig struct {
	TokenExpiry        time.Duration `json:"tokenExpiry" validate:"required,min=300s,max=86400s"`
	RefreshThreshold   time.Duration `json:"refreshThreshold" validate:"required,min=60s,max=3600s"`
	MaxLoginAttempts   int           `json:"maxLoginAttempts" validate:"min=1,max=10"`
	LockoutDuration    time.Duration `json:"lockoutDuration" validate:"min=1m,max=24h"`
	SessionTimeout     time.Duration `json:"sessionTimeout" validate:"min=5m,max=24h"`
	RememberMeDuration time.Duration `json:"rememberMeDuration" validate:"min=1h,max=720h"`
}

// LogConfig contains logging configuration
type LogConfig struct {
	Level      LogLevel  `json:"level" validate:"required,oneof=debug info warn error"`
	Format     LogFormat `json:"format" validate:"required,oneof=json text"`
	Output     LogOutput `json:"output" validate:"required,oneof=console file both"`
	FilePath   string    `json:"filePath"`
	MaxSize    int       `json:"maxSize" validate:"min=1,max=1000"`   // MB
	MaxBackups int       `json:"maxBackups" validate:"min=0,max=100"` // files
	MaxAge     int       `json:"maxAge" validate:"min=1,max=365"`     // days
	Compress   bool      `json:"compress"`
}

// DatabaseConfig contains database configuration
type DatabaseConfig struct {
	Host         string        `json:"host" validate:"required"`
	Port         int           `json:"port" validate:"required,min=1,max=65535"`
	Name         string        `json:"name" validate:"required,min=1,max=100"`
	Username     string        `json:"username"`
	Password     string        `json:"password"`
	SSLMode      string        `json:"sslMode" validate:"oneof=disable require verify-ca verify-full"`
	MaxOpenConns int           `json:"maxOpenConns" validate:"min=1,max=100"`
	MaxIdleConns int           `json:"maxIdleConns" validate:"min=1,max=100"`
	ConnLifetime time.Duration `json:"connLifetime" validate:"min=1m,max=24h"`
}

// SecurityConfig contains security-related configuration
type SecurityConfig struct {
	CORSEnabled      bool     `json:"corsEnabled"`
	CORSOrigins      []string `json:"corsOrigins"`
	RateLimitEnabled bool     `json:"rateLimitEnabled"`
	RateLimitRPS     int      `json:"rateLimitRps" validate:"min=1,max=10000"`
	RateLimitBurst   int      `json:"rateLimitBurst" validate:"min=1,max=1000"`
	CSRFEnabled      bool     `json:"csrfEnabled"`
	CSRFSecret       string   `json:"csrfSecret"`
}

// WindowConfig contains window-specific configuration
type WindowConfig struct {
	Width       int  `json:"width" validate:"required,min=400,max=4000"`
	Height      int  `json:"height" validate:"required,min=300,max=3000"`
	Resizable   bool `json:"resizable"`
	Fullscreen  bool `json:"fullscreen"`
	Maximized   bool `json:"maximized"`
	Minimized   bool `json:"minimized"`
	AlwaysOnTop bool `json:"alwaysOnTop"`
}

// CacheConfig contains caching configuration
type CacheConfig struct {
	Enabled            bool          `json:"enabled"`
	TTL                time.Duration `json:"ttl" validate:"min=1s,max=24h"`
	MaxSize            int           `json:"maxSize" validate:"min=1,max=10000"`      // MB
	MaxItems           int           `json:"maxItems" validate:"min=100,max=1000000"` // items
	CompressionEnabled bool          `json:"compressionEnabled"`
	EvictionPolicy     string        `json:"evictionPolicy" validate:"oneof=lru lfu fifo"`
}

// PublicConfig represents configuration that can be safely exposed to frontend
type PublicConfig struct {
	App    PublicAppConfig    `json:"app"`
	API    PublicAPIConfig    `json:"api"`
	Window PublicWindowConfig `json:"window"`
}

// PublicAppConfig contains non-sensitive app configuration
type PublicAppConfig struct {
	Environment Environment `json:"environment"`
	Name        string      `json:"name"`
	Version     string      `json:"version"`
	Debug       bool        `json:"debug"`
}

// PublicAPIConfig contains non-sensitive API configuration
type PublicAPIConfig struct {
	Timeout    time.Duration `json:"timeout"`
	RetryCount int           `json:"retryCount"`
}

// PublicWindowConfig contains window configuration for frontend
type PublicWindowConfig struct {
	Width      int  `json:"width"`
	Height     int  `json:"height"`
	Resizable  bool `json:"resizable"`
	Fullscreen bool `json:"fullscreen"`
}
