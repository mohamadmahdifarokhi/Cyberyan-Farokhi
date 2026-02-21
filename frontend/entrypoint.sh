#!/bin/sh
# Frontend Docker Container Entrypoint Script
# Logs startup information before starting the Expo dev server

set -e

# ANSI color codes
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to log with timestamp
log_info() {
    echo "[$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")] [INFO] $1"
}

log_warn() {
    echo "[$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")] ${YELLOW}[WARN]${NC} $1"
}

# Print startup banner
echo ""
echo "${GREEN}╔═══════════════════════════════════════════════════════════╗${NC}"
echo "${GREEN}║                                                           ║${NC}"
echo "${GREEN}║           Frontend Development Container                  ║${NC}"
echo "${GREEN}║                                                           ║${NC}"
echo "${GREEN}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Log application information
log_info "Application: frontend"
log_info "Version: 1.0.0"
log_info "Environment: ${REACT_APP_ENV:-development}"

# Log Node.js and npm versions
log_info "Node.js version: $(node --version)"
log_info "npm version: $(npm --version)"

# Log environment configuration (redact sensitive data)
echo ""
log_info "Environment Configuration:"
log_info "  API Base URL: ${REACT_APP_API_BASE_URL:-not set}"
log_info "  API Timeout: ${REACT_APP_API_TIMEOUT:-not set}"
log_info "  Debug Mode: ${REACT_APP_DEBUG_MODE:-false}"

# Log logging configuration
echo ""
log_info "Logging Configuration:"
log_info "  Log Level: ${LOG_LEVEL:-INFO}"
log_info "  Enable Debug Logs: ${ENABLE_DEBUG_LOGS:-false}"
log_info "  Silent Mode: ${SILENT_MODE:-false}"
log_info "  Log API Requests: ${LOG_API_REQUESTS:-true}"
log_info "  Log Component Lifecycle: ${LOG_COMPONENT_LIFECYCLE:-false}"
log_info "  Log Performance: ${LOG_PERFORMANCE:-true}"

# Log Expo dev server information
echo ""
log_info "Expo Dev Server Configuration:"
log_info "  Port: 19006 (web)"
log_info "  Metro Bundler Port: 8082"
log_info "  Access URLs will be displayed after server starts"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    log_warn "node_modules directory not found. Dependencies may need to be installed."
fi

# Log startup completion
echo ""
log_info "Starting Expo development server..."
log_info "$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ") [INFO] Starting compilation"
echo ""

# Execute the main command (passed as arguments to this script)
exec "$@"
