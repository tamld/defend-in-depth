# Adversarial Test Spec — branchNamingGuard

> Source: `src/guards/branch-naming.ts`
> Default pattern: `/^(feat|fix|chore|docs)\/.+/`
> Default exempt: `main, master, develop, staging, HEAD`

## Mock audit

The guard is **pure** — no I/O, no `Date.now()`, no `process.env`. Only `performance.now()` is called for timing. **No mocks needed**.

## Adversarial scenarios

### Default pattern
1. `feat/x`, `fix/x`, `chore/x`, `docs/x` → pass (allowed types).
2. `refactor/x`, `test/x`, `perf/x` → block (NOT in default 4 types — common pitfall).
3. `feat/` (empty suffix) → block (`.+` requires ≥1 char).
4. `feat//double-slash` → pass (`.+` matches anything after the slash, including a slash).
5. `FEAT/x` (uppercase) → block (regex is case-sensitive, default).
6. `feat-no-slash` → block.
7. `prefix/feat/x` → block (regex anchored at start).
8. Branch containing whitespace `feat/with space` → pass (whitespace allowed in `.+`).
9. Unicode segment `feat/旧-bug` → pass.

### Exempt list
10. `main`, `master`, `develop`, `staging`, `HEAD` → pass (exempt regardless of pattern).
11. `main-fix` → block (NOT exempt — substring of "main" doesn't match the Set).
12. `MAIN` (case variant) → block (Set lookup is case-sensitive).
13. Empty `ctx.branch` (undefined / `""`) → pass (early return).

### Custom pattern via config
14. Pattern `^release/v\d+\.\d+\.\d+$` + branch `release/v1.2.3` → pass.
15. Same pattern + branch `release/v1.2` → block (incomplete semver).
16. Empty pattern `""` → matches everything (`new RegExp("")` is `//`) → pass for any branch.
17. Pattern with anchors that don't compile → currently propagates the `SyntaxError`. Documented behavior: invalid regex in user config is a programmer error.

### Severity & finding shape
18. Block findings include the violating branch name in `message`.
19. Block findings include a `fix` field with a `git branch -m` suggestion.
20. `durationMs` is non-negative on every result.

## Assertion rules

- Behavioral: assert on `passed`, `findings.length`, `findings[0].severity`, `findings[0].message` substrings.
- NEVER snapshot the entire result — it includes `durationMs` which is non-deterministic.
