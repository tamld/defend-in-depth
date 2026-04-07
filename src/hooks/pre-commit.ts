/**
 * Pre-commit hook generator.
 *
 * Generates a bash script that calls `defense-in-depth verify`
 * on staged files before allowing the commit.
 */

export function generatePreCommitHook(): string {
  return `#!/bin/sh
# defense-in-depth pre-commit hook
# Auto-generated — do not edit manually.
# To regenerate: npx defense-in-depth init

# Get list of staged files
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACMR)

if [ -z "$STAGED_FILES" ]; then
  exit 0
fi

# Run defense-in-depth verify on staged files
npx defense-in-depth verify --hook pre-commit --files $STAGED_FILES

EXIT_CODE=$?

if [ $EXIT_CODE -ne 0 ]; then
  echo ""
  echo "❌ Pre-commit blocked by defense-in-depth."
  echo "   Fix the issues above, then try again."
  echo ""
  exit 1
fi

exit 0
`;
}
