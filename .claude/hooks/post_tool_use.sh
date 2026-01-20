#!/bin/bash
# Post-edit hook to run linting checks on modified files

# Read the tool use JSON from stdin
TOOL_DATA=$(cat)

# Extract file_path from the tool parameters
FILE_PATH=$(echo "$TOOL_DATA" | grep -o '"file_path"[[:space:]]*:[[:space:]]*"[^"]*"' | sed 's/"file_path"[[:space:]]*:[[:space:]]*"\([^"]*\)"/\1/')

# Only check TypeScript/TSX/JavaScript files
if [[ "$FILE_PATH" =~ \.(ts|tsx|js|jsx)$ ]]; then
  # Get workspace root (C:\workspace\storychat)
  WORKSPACE_ROOT="C:\workspace\storychat"

  # Get relative path from workspace root
  RELATIVE_PATH="${FILE_PATH#$WORKSPACE_ROOT/}"
  RELATIVE_PATH="${RELATIVE_PATH#$WORKSPACE_ROOT\\}"

  # Skip if file doesn't exist or is in node_modules
  if [[ ! -f "$FILE_PATH" ]] || [[ "$RELATIVE_PATH" == *"node_modules"* ]]; then
    exit 0
  fi

  # Run eslint on the specific file (suppress output to avoid noise)
  npx eslint --quiet "$RELATIVE_PATH" 2>/dev/null

  LINT_EXIT=$?

  if [ $LINT_EXIT -ne 0 ]; then
    # Return warning but don't block
    echo '{"action":"allow","context":"⚠️ Linting issues detected in '"$RELATIVE_PATH"'. Run `npm run lint:fix` to auto-fix."}'
    exit 0
  fi
fi
