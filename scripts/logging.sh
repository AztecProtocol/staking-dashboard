#!/bin/bash
# Centralized logging functions for bootstrap scripts
# Source this file in your script: source "$(git rev-parse --show-toplevel)/scripts/logging.sh"

# Detect if colors should be enabled (terminal or GitHub Actions)
if [ -t 1 ] || [ "${GITHUB_ACTIONS:-}" = "true" ]; then
    COLOR_BLUE=$(printf '\033[34m')
    COLOR_GREEN=$(printf '\033[32m')
    COLOR_RESET=$(printf '\033[0m')
else
    COLOR_BLUE=""
    COLOR_GREEN=""
    COLOR_RESET=""
fi

# Log a step that's about to start (blue)
log_step() {
    printf "%b%s%b\n" "$COLOR_BLUE" "$1" "$COLOR_RESET"
}

# Log a successful completion (green)
log_success() {
    printf "%b%s%b\n" "$COLOR_GREEN" "$1" "$COLOR_RESET"
}

# Log informational messages (no color)
log_info() {
    printf "%s\n" "$1"
}

