# Adversarial Test Spec — commitFormatGuard

> Source: `src/guards/commit-format.ts`
> Default pattern: `/^(feat|fix|chore|docs|refactor|test|style|perf|ci)(\(.*\))?(!)?\:\s.+/`
> Behavior: only the first line of `commitMessage` is checked.

## Mock audit

Pure guard — no I/O, no clocks, no env. **No mocks needed.**

## Adversarial scenarios

### Default pattern — accepted forms
1. `feat: add login` → pass.
2. `fix(api): null guard` → pass.
3. `chore!: drop node 16` → pass (breaking-change `!`).
4. `feat(scope)!: x` → pass (scope + breaking).
5. `docs(): empty scope` → pass (`\(.*\)` allows empty).
6. `feat: ✨ unicode in subject` → pass.

### Default pattern — rejected forms
7. `wip: hack` → block (type not in allowed list).
8. `feat add login` → block (missing colon-space).
9. `feat:no-space-after-colon` → block.
10. `: missing type` → block.
11. `(scope): missing type` → block.
12. `feat: ` (empty body) → block (`.+` requires ≥1 char after the space).
13. `Feat: case mismatch` → block (regex case-sensitive by default).

### Multi-line handling
14. `feat: ok\n\nlong body here` → pass (only first line is checked).
15. `body line one\n\nfeat: nope` → block (first line is "body line one").
16. Whitespace-only first line `   \n\nfeat: ok` → block (subject trims to "").

### Whitespace tolerance on subject
17. `  feat: trim leading  ` → pass (`.trim()` strips before regex test).
18. Tab-prefixed `\tfeat: x` → pass.

### Custom config
19. `pattern` override `^WIP\s.+` + message `WIP foo` → pass.
20. `types` override `["wip", "exp"]` (no `pattern` override) — message stays validated against DEFAULT_PATTERN; the `types` list is only echoed in the failure message. Document this behavior.
21. Empty `pattern: ""` → falls back to DEFAULT_PATTERN (truthy guard).

### Missing context
22. `commitMessage` undefined → pass (early return).
23. `commitMessage: ""` → pass (early return on falsy check).

### Finding shape
24. Block findings include the offending subject (truncated subject string).
25. Block findings include the allowed types list (default 9 types or custom).
26. Block findings expose a `git commit --amend` fix suggestion.
27. `durationMs` is non-negative.

## Assertion rules

- Behavioral; no snapshot of the full result (durationMs is non-deterministic).
- For multi-line messages, assert the regex was applied to the first line only.
