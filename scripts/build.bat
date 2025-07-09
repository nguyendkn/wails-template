@echo off
setlocal enabledelayedexpansion

REM Build script for Wails application with environment support (Windows)
REM Usage: scripts\build.bat [environment] [options]
REM Environment: development, staging, production (default: development)

REM Default values
set ENVIRONMENT=development
set CLEAN=false
set VERBOSE=false
set SKIP_FRONTEND=false
set OUTPUT_DIR=build

REM Parse command line arguments
:parse_args
if "%~1"=="" goto :start_build
if "%~1"=="development" (
    set ENVIRONMENT=development
    shift
    goto :parse_args
)
if "%~1"=="staging" (
    set ENVIRONMENT=staging
    shift
    goto :parse_args
)
if "%~1"=="production" (
    set ENVIRONMENT=production
    shift
    goto :parse_args
)
if "%~1"=="--clean" (
    set CLEAN=true
    shift
    goto :parse_args
)
if "%~1"=="--verbose" (
    set VERBOSE=true
    shift
    goto :parse_args
)
if "%~1"=="--skip-frontend" (
    set SKIP_FRONTEND=true
    shift
    goto :parse_args
)
if "%~1"=="--output-dir" (
    set OUTPUT_DIR=%~2
    shift
    shift
    goto :parse_args
)
if "%~1"=="--help" (
    goto :show_usage
)
echo [ERROR] Unknown option: %~1
goto :show_usage

:show_usage
echo Usage: %0 [environment] [options]
echo.
echo Environments:
echo   development  Build for development (default)
echo   staging      Build for staging
echo   production   Build for production
echo.
echo Options:
echo   --clean           Clean build directory before building
echo   --verbose         Enable verbose output
echo   --skip-frontend   Skip frontend build
echo   --output-dir DIR  Specify output directory (default: build)
echo   --help           Show this help message
echo.
echo Examples:
echo   %0 production --clean
echo   %0 development --verbose
echo   %0 staging --output-dir dist
exit /b 0

:start_build
echo [INFO] Building for environment: %ENVIRONMENT%

REM Check dependencies
echo [INFO] Checking dependencies...
where wails >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Wails is not installed. Please install it first.
    echo [ERROR] Visit: https://wails.io/docs/gettingstarted/installation
    exit /b 1
)

where go >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Go is not installed. Please install it first.
    exit /b 1
)

where pnpm >nul 2>&1
if errorlevel 1 (
    echo [WARNING] pnpm is not installed. Trying npm...
    where npm >nul 2>&1
    if errorlevel 1 (
        echo [ERROR] Neither pnpm nor npm is installed. Please install one of them.
        exit /b 1
    )
    set USE_NPM=true
) else (
    set USE_NPM=false
)

echo [SUCCESS] All dependencies are available

REM Clean build directory
if "%CLEAN%"=="true" (
    echo [INFO] Cleaning build directory...
    if exist "%OUTPUT_DIR%" (
        rmdir /s /q "%OUTPUT_DIR%"
        echo [SUCCESS] Build directory cleaned
    ) else (
        echo [INFO] Build directory doesn't exist, skipping clean
    )
)

REM Set environment variables
echo [INFO] Setting up environment variables for %ENVIRONMENT%...
set APP_ENV=%ENVIRONMENT%

REM Load environment-specific variables
set ENV_FILE=.env.%ENVIRONMENT%
if exist "%ENV_FILE%" (
    echo [INFO] Loading environment file: %ENV_FILE%
    for /f "usebackq tokens=1,2 delims==" %%a in ("%ENV_FILE%") do (
        if not "%%a"=="" if not "%%a:~0,1%"=="#" (
            set %%a=%%b
        )
    )
) else (
    echo [WARNING] Environment file %ENV_FILE% not found
)

REM Set build-specific variables
if "%ENVIRONMENT%"=="production" (
    set CGO_ENABLED=1
    set GOOS=windows
    set GOARCH=amd64
)
if "%ENVIRONMENT%"=="staging" (
    set CGO_ENABLED=1
)
if "%ENVIRONMENT%"=="development" (
    set CGO_ENABLED=1
)

REM Build frontend
if "%SKIP_FRONTEND%"=="true" (
    echo [INFO] Skipping frontend build
) else (
    echo [INFO] Building frontend...
    cd frontend
    
    REM Install dependencies
    if "%USE_NPM%"=="true" (
        npm install
    ) else (
        pnpm install
    )
    
    if errorlevel 1 (
        echo [ERROR] Frontend dependency installation failed
        exit /b 1
    )
    
    REM Build frontend
    if "%USE_NPM%"=="true" (
        npm run build
    ) else (
        pnpm run build
    )
    
    if errorlevel 1 (
        echo [ERROR] Frontend build failed
        exit /b 1
    )
    
    cd ..
    echo [SUCCESS] Frontend build completed
)

REM Build application
echo [INFO] Building Wails application...

REM Prepare build flags
set BUILD_FLAGS=
if "%VERBOSE%"=="true" (
    set BUILD_FLAGS=%BUILD_FLAGS% -v
)

REM Set output directory
set BUILD_FLAGS=%BUILD_FLAGS% -o %OUTPUT_DIR%

REM Environment-specific build flags
if "%ENVIRONMENT%"=="production" (
    set BUILD_FLAGS=%BUILD_FLAGS% -clean -ldflags "-w -s"
)
if "%ENVIRONMENT%"=="staging" (
    set BUILD_FLAGS=%BUILD_FLAGS% -clean
)
if "%ENVIRONMENT%"=="development" (
    set BUILD_FLAGS=%BUILD_FLAGS% -debug
)

REM Execute build
echo [INFO] Executing: wails build %BUILD_FLAGS%
wails build %BUILD_FLAGS%

if errorlevel 1 (
    echo [ERROR] Application build failed
    exit /b 1
)

echo [SUCCESS] Application build completed

REM Post-build tasks
echo [INFO] Running post-build tasks...

REM Create version info file
set VERSION_FILE=%OUTPUT_DIR%\version.json
(
echo {
echo   "environment": "%ENVIRONMENT%",
echo   "version": "%APP_VERSION%",
echo   "buildTime": "%date% %time%",
echo   "platform": "windows"
echo }
) > "%VERSION_FILE%"

echo [SUCCESS] Version info created: %VERSION_FILE%

REM Copy environment file to build directory
if exist "%ENV_FILE%" (
    copy "%ENV_FILE%" "%OUTPUT_DIR%\"
    echo [SUCCESS] Environment file copied to build directory
)

echo [SUCCESS] Build completed successfully!
echo [INFO] Build artifacts are available in: %OUTPUT_DIR%

REM Show build summary
if exist "%OUTPUT_DIR%" (
    echo [INFO] Build summary:
    dir "%OUTPUT_DIR%"
)

endlocal
