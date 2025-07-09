# GitHub Variables Setup Guide

## Overview

This project uses GitHub Variables to manage environment configuration for CI/CD builds. This approach provides better security and flexibility compared to hard-coding values in the workflow files.

## How It Works

1. **Default Values**: The application has built-in default values in the Go config loader
2. **GitHub Variables**: Override defaults by setting GitHub Variables in your repository
3. **Environment File**: CI workflow creates `.env.development` file using GitHub Variables
4. **Build Process**: Wails build uses the generated environment file

## Setting Up GitHub Variables

### 1. Navigate to Repository Settings

1. Go to your GitHub repository
2. Click on **Settings** tab
3. In the left sidebar, click **Secrets and variables** → **Actions**
4. Click on **Variables** tab

### 2. Add Variables

Click **New repository variable** and add the following variables as needed:

#### Application Configuration

| Variable Name | Description | Example Value | Required |
|---------------|-------------|---------------|----------|
| `APP_NAME` | Application display name | `CSmart Desktop App` | No |
| `APP_DEBUG` | Enable debug mode | `false` | No |

#### API Configuration

| Variable Name | Description | Example Value | Required |
|---------------|-------------|---------------|----------|
| `API_BASE_URL` | API endpoint URL | `https://api.yourcompany.com/v1` | No* |
| `API_TIMEOUT` | Request timeout in seconds | `30` | No |
| `API_RETRY_COUNT` | Number of retry attempts | `3` | No |
| `API_RETRY_DELAY` | Delay between retries (ms) | `1000` | No |

*Note: If not set, uses environment-specific defaults

#### Authentication Configuration

| Variable Name | Description | Example Value | Required |
|---------------|-------------|---------------|----------|
| `AUTH_TOKEN_EXPIRY` | Token expiry time (seconds) | `3600` | No |
| `AUTH_REFRESH_THRESHOLD` | Refresh threshold (seconds) | `300` | No |

#### Logging Configuration

| Variable Name | Description | Example Value | Required |
|---------------|-------------|---------------|----------|
| `LOG_LEVEL` | Logging level | `info` | No |
| `LOG_FORMAT` | Log format | `json` | No |
| `LOG_OUTPUT` | Log output destination | `console` | No |

#### Window Configuration

| Variable Name | Description | Example Value | Required |
|---------------|-------------|---------------|----------|
| `WINDOW_WIDTH` | Default window width | `1200` | No |
| `WINDOW_HEIGHT` | Default window height | `800` | No |
| `WINDOW_RESIZABLE` | Allow window resizing | `true` | No |
| `WINDOW_FULLSCREEN` | Start in fullscreen | `false` | No |

#### Security Configuration

| Variable Name | Description | Example Value | Required |
|---------------|-------------|---------------|----------|
| `CORS_ENABLED` | Enable CORS | `true` | No |
| `CORS_ORIGINS` | Allowed CORS origins | `https://yourapp.com` | No |
| `RATE_LIMIT_ENABLED` | Enable rate limiting | `false` | No |

#### Development Configuration

| Variable Name | Description | Example Value | Required |
|---------------|-------------|---------------|----------|
| `HOT_RELOAD` | Enable hot reload | `false` | No |
| `DEV_TOOLS` | Enable dev tools | `false` | No |
| `MOCK_API` | Use mock API | `false` | No |

## Default Values by Environment

The application provides sensible defaults based on the environment:

### Development (default)
- `API_BASE_URL`: `https://api.yourcompany.com/v1`
- `APP_DEBUG`: `true`
- `LOG_LEVEL`: `debug`

### Staging
- `API_BASE_URL`: `https://api.yourcompany.com/v1`
- `APP_DEBUG`: `true`
- `LOG_LEVEL`: `debug`

### Production
- `API_BASE_URL`: `https://api.yourcompany.com/v1`
- `APP_DEBUG`: `false`
- `LOG_LEVEL`: `info`

## Example Setup

### Minimal Setup (using defaults)
No GitHub Variables needed - the application will use built-in defaults.

### Custom API Setup
Set these GitHub Variables:
```
API_BASE_URL = https://api.yourcompany.com/v1
APP_NAME = My Custom App
LOG_LEVEL = warn
```

### Production Setup
Set these GitHub Variables:
```
API_BASE_URL = https://api.yourcompany.com/v1
APP_NAME = MyApp Production
APP_DEBUG = false
LOG_LEVEL = error
WINDOW_WIDTH = 1024
WINDOW_HEIGHT = 768
CORS_ENABLED = false
RATE_LIMIT_ENABLED = true
```

## Verification

After setting up GitHub Variables:

1. **Check Workflow**: Go to Actions tab and trigger a build
2. **View Logs**: Check the "Create environment file" step to see generated `.env.development`
3. **Verify Values**: Ensure your variables are properly included

Example log output:
```
Generated .env.development file:
APP_ENV=development
APP_VERSION=v1.0.1
API_BASE_URL=https://api.mycompany.com/v1
APP_NAME=My Custom App
LOG_LEVEL=warn
```

## Security Best Practices

### Use Secrets for Sensitive Data
For sensitive information like API keys, use **Secrets** instead of Variables:

1. Go to **Secrets and variables** → **Actions**
2. Click **Secrets** tab
3. Add sensitive values as secrets

### Environment-Specific Variables
Consider using environment-specific variable names:
- `PROD_API_BASE_URL`
- `STAGING_API_BASE_URL`
- `DEV_API_BASE_URL`

### Variable Naming
- Use UPPERCASE with underscores
- Be descriptive and consistent
- Group related variables with prefixes

## Troubleshooting

### Variable Not Applied
1. Check variable name spelling (case-sensitive)
2. Verify variable is set at repository level
3. Check workflow logs for environment file generation

### Build Fails with Missing Config
1. Ensure required variables are set
2. Check default values in `internal/config/loader.go`
3. Verify environment file is generated correctly

### Invalid Configuration
1. Check variable values match expected format
2. Verify URLs are valid and accessible
3. Check numeric values are within valid ranges

## Advanced Usage

### Multiple Environments
You can create different variable sets for different environments by using prefixes:

```bash
# Production variables
PROD_API_BASE_URL=https://api.prod.com
PROD_LOG_LEVEL=error

# Staging variables  
STAGING_API_BASE_URL=https://api.staging.com
STAGING_LOG_LEVEL=debug
```

Then modify the workflow to use environment-specific variables based on the build target.

### Dynamic Configuration
Variables can be used to dynamically configure builds for different customers or deployments without changing code.

This setup provides maximum flexibility while maintaining security and ease of use.
