package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
	"wails-template/internal/config"
)

// LoginRequest represents the login request payload
type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

// LoginData represents the data field in login response
type LoginData struct {
	AccessToken  string `json:"access_token"`
	ExpiresIn    int    `json:"expires_in"`
	TokenType    string `json:"token_type"`
	RefreshToken string `json:"refresh_token"`
	User         User   `json:"user"`
}

// LoginResponse represents the API response structure
type LoginResponse struct {
	Code       string    `json:"code"`
	Success    bool      `json:"success"`
	StatusCode int       `json:"statusCode"`
	Message    string    `json:"message"`
	Data       LoginData `json:"data"`
}

// User represents the user object from API
type User struct {
	ID              string   `json:"id"`
	Username        string   `json:"username"`
	Name            string   `json:"name"`
	Email           string   `json:"email"`
	Gender          string   `json:"gender"`
	Roles           []string `json:"roles"`
	Scopes          []string `json:"scopes"`
	CreatedAt       string   `json:"created_at"`
	CurrentTenantID string   `json:"current_tenant_id"`
}

// App struct
type App struct {
	ctx    context.Context
	config *config.Config
}

// NewApp creates a new App application struct
func NewApp() *App {
	cfg, err := config.LoadConfig()
	if err != nil {
		panic(fmt.Sprintf("Failed to load config: %v", err))
	}

	return &App{
		config: cfg,
	}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

// Greet returns a greeting for the given name
func (a *App) Greet(name string) string {
	return fmt.Sprintf("Hello %s, It's show time!", name)
}

// Login performs authentication with the external API
func (a *App) Login(username, password string) (*LoginResponse, error) {
	// Create login request payload
	loginReq := LoginRequest{
		Username: username,
		Password: password,
	}

	// Convert to JSON
	jsonData, err := json.Marshal(loginReq)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal login request: %v", err)
	}

	// Build login URL from config
	loginURL := fmt.Sprintf("%s/identity/login", a.config.API.BaseURL)

	// Create HTTP request
	req, err := http.NewRequest("POST", loginURL, bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %v", err)
	}

	// Set headers
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("User-Agent", a.config.API.UserAgent)

	// Create HTTP client with timeout from config
	client := &http.Client{
		Timeout: a.config.API.Timeout,
	}

	// Send request with retry logic
	var resp *http.Response
	var lastErr error

	for attempt := 0; attempt <= a.config.API.RetryCount; attempt++ {
		resp, lastErr = client.Do(req)
		if lastErr == nil && resp.StatusCode < 500 {
			break // Success or client error (don't retry)
		}

		if attempt < a.config.API.RetryCount {
			// Wait before retry
			time.Sleep(a.config.API.RetryDelay)
		}
	}

	if lastErr != nil {
		return nil, fmt.Errorf("failed to send request after %d attempts: %v", a.config.API.RetryCount+1, lastErr)
	}
	defer resp.Body.Close()

	// Read response body
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %v", err)
	}

	// Parse response
	var loginResp LoginResponse
	if err := json.Unmarshal(body, &loginResp); err != nil {
		return nil, fmt.Errorf("failed to parse response: %v", err)
	}

	// Check if login was successful
	if !loginResp.Success {
		return nil, fmt.Errorf("login failed: %s", loginResp.Message)
	}

	return &loginResp, nil
}

// GetConfig returns the public configuration for frontend
func (a *App) GetConfig() *config.PublicConfig {
	return config.GetPublicConfig()
}

// GetAPIBaseURL returns the API base URL
func (a *App) GetAPIBaseURL() string {
	return a.config.API.BaseURL
}

// GetEnvironment returns the current environment
func (a *App) GetEnvironment() string {
	return string(a.config.App.Environment)
}

// IsDebugMode returns whether debug mode is enabled
func (a *App) IsDebugMode() bool {
	return a.config.App.Debug
}

// GetAppInfo returns basic app information
func (a *App) GetAppInfo() map[string]any {
	return map[string]any{
		"name":        a.config.App.Name,
		"version":     a.config.App.Version,
		"environment": a.config.App.Environment,
		"debug":       a.config.App.Debug,
	}
}

// ReloadConfig reloads the configuration (useful for development)
func (a *App) ReloadConfig() error {
	cfg, err := config.ReloadConfig()
	if err != nil {
		return err
	}
	a.config = cfg
	return nil
}
