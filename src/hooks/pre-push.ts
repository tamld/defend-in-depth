/**
 * Pre-push hook generator.
 *
 * Second defense layer — catches issues that slip past pre-commit.
 * Focuses on branch naming and commit format.
 */

export function generatePrePushHook(): string {
  return `#!/bin/sh
# defense-in-depth pre-push hook
# Auto-generated — do not edit manually.
# To regenerate: npx defense-in-depth init

# Run defense-in-depth verify for push-time checks
npx defense-in-depth verify --hook pre-push

EXIT_CODE=$?

if [ $EXIT_CODE -ne 0 ]; then
  echo ""
  echo "❌ Pre-push blocked by defense-in-depth."
  echo "   Fix the issues above, then try again."
  echo ""
  exit 1
fi

exit 0
`;
}
