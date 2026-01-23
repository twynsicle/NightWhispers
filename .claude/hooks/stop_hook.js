#!/usr/bin/env node
// Stop hook - runs type-check and lint before Claude stops
// Uses exit code 2 with stderr to block Claude and show errors

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Setup logging
const LOG_DIR = path.join('.claude', 'tmp');
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}
const LOG_FILE = path.join(LOG_DIR, 'stop_hook.log');

function log(message) {
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
  fs.appendFileSync(LOG_FILE, `[${timestamp}] ${message}\n`);
}

function runCommand(command) {
  try {
    const output = execSync(command, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true
    });
    return { success: true, output };
  } catch (error) {
    return { success: false, output: error.stdout || '', stderr: error.stderr || '' };
  }
}

async function main() {
  log('=== Stop hook triggered ===');

  // Read stdin for hook data
  let hookData = '';
  try {
    hookData = fs.readFileSync(0, 'utf8');
    log(`Input data: ${hookData}`);
  } catch (e) {
    log('No stdin data');
  }

  // Check for stop_hook_active to prevent infinite loops
  try {
    const parsed = JSON.parse(hookData);
    if (parsed.stop_hook_active === true) {
      log('stop_hook_active is true, allowing stop to prevent infinite loop');
      process.exit(0);
    }
  } catch (e) {
    // Not valid JSON, continue
  }

  // Run format first (auto-fixes, no blocking needed)
  log('Running format...');
  runCommand('npm run format --silent');

  // Run type-check
  log('Running type-check...');
  const typeResult = runCommand('npm run type-check');
  log(`Type-check success: ${typeResult.success}`);

  // Run lint
  log('Running lint...');
  const lintResult = runCommand('npm run lint');
  log(`Lint success: ${lintResult.success}`);

  // Collect errors
  const errors = [];

  if (!typeResult.success) {
    errors.push('=== TypeScript Errors ===');
    errors.push(typeResult.output || typeResult.stderr);
    log('Type errors found');
  }

  if (!lintResult.success) {
    errors.push('=== ESLint Errors ===');
    errors.push(lintResult.output || lintResult.stderr);
    log('Lint errors found');
  }

  if (errors.length > 0) {
    const errorMessage = `Fix these issues before completing:\n\n${errors.join('\n\n')}`;
    log(`Blocking with exit code 2`);

    // Write to stderr and exit with code 2 to block
    process.stderr.write(errorMessage);
    process.exit(2);
  }

  // All checks passed
  log('All checks passed, allowing stop');
  process.exit(0);
}

main().catch(err => {
  log(`Error: ${err.message}`);
  process.exit(0); // Don't block on hook errors
});
