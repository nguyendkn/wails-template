#!/bin/bash

# Build script for Wails application with environment support
# Usage: ./scripts/build.sh [environment] [options]
# Environment: development, staging, production (default: development)

set -e

# Default values
ENVIRONMENT="development"
CLEAN=false
VERBOSE=false
SKIP_FRONTEND=false
OUTPUT_DIR="build"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [environment] [options]"
    echo ""
    echo "Environments:"
    echo "  development  Build for development (default)"
    echo "  staging      Build for staging"
    echo "  production   Build for production"
    echo ""
    echo "Options:"
    echo "  --clean           Clean build directory before building"
    echo "  --verbose         Enable verbose output"
    echo "  --skip-frontend   Skip frontend build"
    echo "  --output-dir DIR  Specify output directory (default: build)"
    echo "  --help           Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 production --clean"
    echo "  $0 development --verbose"
    echo "  $0 staging --output-dir dist"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        development|staging|production)
            ENVIRONMENT="$1"
            shift
            ;;
        --clean)
            CLEAN=true
            shift
            ;;
        --verbose)
            VERBOSE=true
            shift
            ;;
        --skip-frontend)
            SKIP_FRONTEND=true
            shift
            ;;
        --output-dir)
            OUTPUT_DIR="$2"
            shift 2
            ;;
        --help)
            show_usage
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(development|staging|production)$ ]]; then
    print_error "Invalid environment: $ENVIRONMENT"
    print_error "Valid environments: development, staging, production"
    exit 1
fi

print_info "Building for environment: $ENVIRONMENT"

# Check if required tools are installed
check_dependencies() {
    print_info "Checking dependencies..."
    
    if ! command -v wails &> /dev/null; then
        print_error "Wails is not installed. Please install it first."
        print_error "Visit: https://wails.io/docs/gettingstarted/installation"
        exit 1
    fi
    
    if ! command -v go &> /dev/null; then
        print_error "Go is not installed. Please install it first."
        exit 1
    fi
    
    if ! command -v pnpm &> /dev/null; then
        print_warning "pnpm is not installed. Trying npm..."
        if ! command -v npm &> /dev/null; then
            print_error "Neither pnpm nor npm is installed. Please install one of them."
            exit 1
        fi
    fi
    
    print_success "All dependencies are available"
}

# Clean build directory
clean_build() {
    if [[ "$CLEAN" == true ]]; then
        print_info "Cleaning build directory..."
        if [[ -d "$OUTPUT_DIR" ]]; then
            rm -rf "$OUTPUT_DIR"
            print_success "Build directory cleaned"
        else
            print_info "Build directory doesn't exist, skipping clean"
        fi
    fi
}

# Set environment variables
set_environment() {
    print_info "Setting up environment variables for $ENVIRONMENT..."
    
    export APP_ENV="$ENVIRONMENT"
    
    # Load environment-specific variables
    ENV_FILE=".env.$ENVIRONMENT"
    if [[ -f "$ENV_FILE" ]]; then
        print_info "Loading environment file: $ENV_FILE"
        set -a  # automatically export all variables
        source "$ENV_FILE"
        set +a
    else
        print_warning "Environment file $ENV_FILE not found"
    fi
    
    # Set build-specific variables
    case $ENVIRONMENT in
        production)
            export CGO_ENABLED=1
            export GOOS=windows
            export GOARCH=amd64
            ;;
        staging)
            export CGO_ENABLED=1
            ;;
        development)
            export CGO_ENABLED=1
            ;;
    esac
}

# Build frontend
build_frontend() {
    if [[ "$SKIP_FRONTEND" == true ]]; then
        print_info "Skipping frontend build"
        return
    fi
    
    print_info "Building frontend..."
    cd frontend
    
    # Install dependencies
    if command -v pnpm &> /dev/null; then
        pnpm install
    else
        npm install
    fi
    
    # Build frontend
    if command -v pnpm &> /dev/null; then
        pnpm run build
    else
        npm run build
    fi
    
    cd ..
    print_success "Frontend build completed"
}

# Build application
build_app() {
    print_info "Building Wails application..."
    
    # Prepare build flags
    BUILD_FLAGS=""
    if [[ "$VERBOSE" == true ]]; then
        BUILD_FLAGS="$BUILD_FLAGS -v"
    fi
    
    # Set output directory
    BUILD_FLAGS="$BUILD_FLAGS -o $OUTPUT_DIR"
    
    # Environment-specific build flags
    case $ENVIRONMENT in
        production)
            BUILD_FLAGS="$BUILD_FLAGS -clean -ldflags '-w -s'"
            ;;
        staging)
            BUILD_FLAGS="$BUILD_FLAGS -clean"
            ;;
        development)
            BUILD_FLAGS="$BUILD_FLAGS -debug"
            ;;
    esac
    
    # Execute build
    print_info "Executing: wails build $BUILD_FLAGS"
    wails build $BUILD_FLAGS
    
    print_success "Application build completed"
}

# Post-build tasks
post_build() {
    print_info "Running post-build tasks..."
    
    # Create version info file
    VERSION_FILE="$OUTPUT_DIR/version.json"
    cat > "$VERSION_FILE" << EOF
{
  "environment": "$ENVIRONMENT",
  "version": "${APP_VERSION:-1.0.0}",
  "buildTime": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "gitCommit": "$(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')",
  "gitBranch": "$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'unknown')"
}
EOF
    
    print_success "Version info created: $VERSION_FILE"
    
    # Copy environment file to build directory
    ENV_FILE=".env.$ENVIRONMENT"
    if [[ -f "$ENV_FILE" ]]; then
        cp "$ENV_FILE" "$OUTPUT_DIR/"
        print_success "Environment file copied to build directory"
    fi
    
    # Set executable permissions (Unix-like systems)
    if [[ "$OSTYPE" != "msys" && "$OSTYPE" != "win32" ]]; then
        chmod +x "$OUTPUT_DIR"/*
        print_success "Executable permissions set"
    fi
}

# Main build process
main() {
    print_info "Starting build process for $ENVIRONMENT environment"
    print_info "Output directory: $OUTPUT_DIR"
    
    check_dependencies
    clean_build
    set_environment
    build_frontend
    build_app
    post_build
    
    print_success "Build completed successfully!"
    print_info "Build artifacts are available in: $OUTPUT_DIR"
    
    # Show build summary
    if [[ -d "$OUTPUT_DIR" ]]; then
        print_info "Build summary:"
        ls -la "$OUTPUT_DIR"
    fi
}

# Run main function
main
