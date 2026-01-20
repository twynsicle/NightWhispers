#!/bin/bash
# Post-edit hook to run linting checks on modified files

# Use Unix-style path for Git Bash compatibility
WORKSPACE_ROOT="C:\\workspace\\storychat"
LOG_FILE="$WORKSPACE_ROOT/debug-hook.txt"
TIMESTAMP=$(date "+%Y-%m-%d %H:%M:%S")

# Read the tool use JSON from stdin
TOOL_DATA=$(cat)

# Extract file_path using grep and sed (no jq dependency)
FILE_PATH=$(echo "$TOOL_DATA" | grep -o '"file_path":"[^"]*"' | sed 's/"file_path":"\(.*\)"/\1/' | sed 's/\\\\/\\/g')

# Default values for log
LOG_FILENAME="${FILE_PATH:-"No file_path"}"
LINT_RESULT="Skipped"

# Helper function to write to log
log_info() {
  echo "[$TIMESTAMP] File: $LOG_FILENAME" >> "$LOG_FILE"
  echo "Lint Output:" >> "$LOG_FILE"
  echo "$LINT_RESULT" >> "$LOG_FILE"
  echo "----------------------------------------" >> "$LOG_FILE"
}

# If no file_path found, log and exit
if [[ -z "$FILE_PATH" ]]; then
  log_info
  exit 0
fi

# Only check TypeScript/TSX/JavaScript files
if [[ "$FILE_PATH" =~ \.(ts|tsx|js|jsx)$ ]]; then
  # Get relative path from workspace root (handle both Unix and Windows paths)
  RELATIVE_PATH="${FILE_PATH#$WORKSPACE_ROOT}"
  RELATIVE_PATH="${RELATIVE_PATH#/}"  # Remove leading slash if present
  RELATIVE_PATH="${RELATIVE_PATH#\\}" # Remove leading backslash if present

  # Skip if file doesn't exist or is in node_modules
  if [[ ! -f "$FILE_PATH" ]] || [[ "$RELATIVE_PATH" == *"node_modules"* ]]; then
    LINT_RESULT="Skipped (file missing or node_modules)"
    log_info
    exit 0
  fi

  # Run Prettier to format the file first (suppress output to avoid noise)
  npx prettier --write "$RELATIVE_PATH" 2>/dev/null

  # Run eslint and capture output (include warnings)
  LINT_OUTPUT=$(npx eslint "$RELATIVE_PATH" 2>&1)
  LINT_EXIT=$?
  LINT_RESULT="$LINT_OUTPUT"

  log_info

  if [ $LINT_EXIT -ne 0 ]; then
    # Escape for JSON and truncate to 500 chars (escape quotes and newlines)
    ESCAPED_OUTPUT=$(echo "$LINT_OUTPUT" | sed 's/\\/\\\\/g; s/"/\\"/g; s/$/\\n/g' | tr -d '\n' | cut -c1-500)
    # Use correct PostToolUse format: decision + reason prompts Claude
    echo "{\"decision\":\"block\",\"reason\":\"⚠️ ESLint issues in $RELATIVE_PATH: $ESCAPED_OUTPUT\"}"
    exit 0
  fi
else
  LINT_RESULT="Skipped (not a TS/JS file)"
  log_info
fi

# Allow by default
exit 0