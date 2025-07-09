# Configuration Management

This document describes the configuration management system for the Wails application.

## Overview

The application uses a comprehensive configuration system that supports:
- Environment-specific configurations
- Type-safe configuration with validation
- Security best practices
- Hot reload support in development
- Centralized configuration management

## Configuration Files

### File Structure

```
config.ini         # Single configuration file for all environments
config.ini.example # Template file
```

### Configuration Sections

#### Application Configuration

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `APP_ENV` | string | `development` | Application environment |
| `APP_NAME` | string | `CSmart Wails App` | Application name |
| `APP_VERSION` | string | `1.0.0` | Application version |
| `APP_DEBUG` | boolean | `true` | Enable debug mode |

#### API Configuration

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `API_BASE_URL` | string | `https://your-domain.com/api/v3.1` | API base URL |
| `API_TIMEOUT` | duration | `30s` | API request timeout |
| `API_RETRY_COUNT` | int | `3` | Number of retry attempts |
| `API_RETRY_DELAY` | duration | `1s` | Delay between retries |
| `API_USER_AGENT` | string | `CSmart-Wails/1.0` | User agent string |

#### Authentication Configuration

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `AUTH_TOKEN_EXPIRY` | duration | `3600s` | Token expiration time |
| `AUTH_REFRESH_THRESHOLD` | duration | `300s` | Token refresh threshold |
| `AUTH_MAX_LOGIN_ATTEMPTS` | int | `5` | Maximum login attempts |
| `AUTH_LOCKOUT_DURATION` | duration | `15m` | Account lockout duration |

#### Logging Configuration

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `LOG_LEVEL` | string | `debug` | Logging level (debug, info, warn, error) |
| `LOG_FORMAT` | string | `json` | Log format (json, text) |
| `LOG_OUTPUT` | string | `console` | Log output (console, file, both) |
| `LOG_FILE_PATH` | string | `logs/app.log` | Log file path |

#### Security Configuration

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `CORS_ENABLED` | boolean | `true` | Enable CORS |
| `CORS_ORIGINS` | string | `http://localhost:5173,http://localhost:34115` | Allowed CORS origins (comma-separated) |
| `RATE_LIMIT_ENABLED` | boolean | `false` | Enable rate limiting |
| `RATE_LIMIT_RPS` | int | `100` | Requests per second limit |
| `CSRF_ENABLED` | boolean | `false` | Enable CSRF protection |

#### Window Configuration

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `WINDOW_WIDTH` | int | `1200` | Window width |
| `WINDOW_HEIGHT` | int | `800` | Window height |
| `WINDOW_RESIZABLE` | boolean | `true` | Allow window resizing |
| `WINDOW_FULLSCREEN` | boolean | `false` | Start in fullscreen |

## Usage

### Backend (Go)

```go
// Load configuration
config, err := config.LoadConfig()
if err != nil {
    log.Fatal("Failed to load config:", err)
}

// Access configuration values
apiURL := config.API.BaseURL
timeout := config.API.Timeout
debug := config.App.Debug
```

### Frontend (TypeScript)

```typescript
import { useConfig } from '@/hooks/go/use-config';

function MyComponent() {
  const { config, isLoading, error } = useConfig();
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <div>
      <h1>{config?.app.name}</h1>
      <p>Environment: {config?.app.environment}</p>
    </div>
  );
}
```

### Using Config Context

```typescript
import { ConfigProvider, useConfigContext } from '@/contexts/config-context';

function App() {
  return (
    <ConfigProvider>
      <MyApp />
    </ConfigProvider>
  );
}

function MyApp() {
  const { config, getAPIBaseURL } = useConfigContext();
  
  const handleAPICall = async () => {
    const baseURL = await getAPIBaseURL();
    // Use baseURL for API calls
  };
  
  return <div>...</div>;
}
```

## Environment-Specific Configurations

### Development
- Debug mode enabled
- Hot reload enabled
- Dev tools enabled
- Localhost API URLs allowed
- Relaxed security settings

### Staging
- Debug mode enabled (for testing)
- Production-like API URLs
- Enhanced logging
- Moderate security settings

### Production
- Debug mode disabled
- Dev tools disabled
- HTTPS-only API URLs
- SSL required for database
- Strict security settings
- Rate limiting enabled

## Security Considerations

### Sensitive Data
- Never commit sensitive data to version control
- Use environment variables for secrets
- Mask sensitive values in logs
- Use secure storage for production secrets

### Validation
- All configuration is validated on load
- Type safety enforced with TypeScript/Go types
- Environment-specific validation rules
- Security warnings for misconfigurations

### Best Practices
1. Use different configurations for each environment
2. Validate all configuration values
3. Provide sensible defaults
4. Document all configuration options
5. Use secure defaults for production

## Build System Integration

### Environment-Specific Builds

```bash
# Development build
./scripts/build.sh development

# Staging build  
./scripts/build.sh staging --clean

# Production build
./scripts/build.sh production --clean
```

### Wails Integration

The build system automatically:
- Loads the correct environment file
- Sets environment variables
- Validates configuration
- Applies security defaults

## Troubleshooting

### Common Issues

1. **Configuration not loading**
   - Check if environment file exists
   - Verify file permissions
   - Check for syntax errors in .env file

2. **Validation errors**
   - Review error messages in console
   - Check required fields are set
   - Verify data types match expectations

3. **Security warnings**
   - Review security validation output
   - Update configuration for production
   - Check CORS and SSL settings

### Debug Mode

Enable debug mode to see detailed configuration loading:

```bash
APP_DEBUG=true wails dev
```

### Configuration Validation

Use the validation utilities to check configuration:

```typescript
import { validateConfig } from '@/utils/config';

const validation = validateConfig(config);
if (!validation.isValid) {
  console.error('Config errors:', validation.errors);
}
```

## API Reference

### Go Functions

- `LoadConfig()` - Load configuration from environment
- `GetConfig()` - Get loaded configuration instance
- `ReloadConfig()` - Reload configuration
- `GetPublicConfig()` - Get frontend-safe configuration

### Frontend Hooks

- `useConfig()` - Main configuration hook
- `useAPIBaseURL()` - Get API base URL
- `useEnvironment()` - Get current environment
- `useDebugMode()` - Check if debug mode is enabled
- `useFeatureFlags()` - Get feature flags based on environment

### Utilities

- `mergeWithDefaults()` - Merge config with defaults
- `validateConfig()` - Validate configuration
- `sanitizeConfigForLogging()` - Remove sensitive data for logging

## Migration Guide

### From Hard-coded Values

1. Identify hard-coded configuration values
2. Add corresponding configuration keys to INI sections
3. Update code to use configuration system
4. Test with different environments

### Adding New Configuration

1. Add to configuration file (config.ini)
2. Update Go config types
3. Update TypeScript types
4. Add validation rules
5. Update documentation

## Examples

See the `examples/` directory for complete configuration examples for different scenarios.

## Quick Start

1. **Copy configuration template**:
   ```bash
   cp config.ini.example config.ini
   ```

2. **Update configuration values**:
   ```ini
   # Edit config.ini
   [api]
   base_url = https://your-api-domain.com/api/v3.1

   [app]
   name = Your App Name
   ```

3. **Run application**:
   ```bash
   wails dev
   ```

4. **Verify configuration**:
   - Check console for validation messages
   - Use debug mode to see loaded config
   - Test API connectivity

## Configuration Checklist

### Development Setup
- [ ] Copy .env.example to .env.development
- [ ] Set API_BASE_URL to development API
- [ ] Enable debug mode (APP_DEBUG=true)
- [ ] Configure logging (LOG_LEVEL=debug)
- [ ] Test configuration loading

### Staging Setup
- [ ] Create .env.staging file
- [ ] Set staging API URL
- [ ] Configure appropriate timeouts
- [ ] Enable security features
- [ ] Test with staging data

### Production Setup
- [ ] Create .env.production file
- [ ] Set production API URL (HTTPS only)
- [ ] Disable debug mode (APP_DEBUG=false)
- [ ] Enable all security features
- [ ] Configure SSL for database
- [ ] Set appropriate timeouts
- [ ] Enable rate limiting
- [ ] Test thoroughly before deployment
