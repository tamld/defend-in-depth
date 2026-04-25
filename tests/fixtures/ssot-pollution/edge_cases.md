# Adversarial Test Spec — ssotPollutionGuard

> Source: `src/guards/ssot-pollution.ts`
> Default protected: `.agents/, flow_state.yml, backlog.yml, transition_log.jsonl, last_violations.json`
> Matcher modes (in order): substring → `**` glob (prefix-only) → basename match (when pattern has no `/`).

## Mock audit

Pure guard — no I/O. **No mocks needed.**

## Adversarial scenarios

### Substring match (most common)
1. `.agents/rules/foo.md` → block (matches `.agents/`).
2. `nested/dir/.agents/x.md` → block (substring still matches).
3. `.agentsignore` → pass (no slash, no basename match — neither path nor basename equals `.agents/`).
4. Literal pattern `flow_state.yml` substring inside `flow_state.yml` itself → block.

### Basename match (pattern without `/`)
5. `backup/flow_state.yml` → block (basename equals `flow_state.yml`).
6. `flow_state.yml.bak` → **block** (false positive — caught by substring matcher *before* the basename check has a chance to reject). Documented caveat; see "Known false-positive cluster" below.
7. `prefix-flow_state.yml` → **block** (same false-positive cluster).
8. Pattern without slash matching deeply nested file: `deep/nested/path/backlog.yml` → block.

### Known false-positive cluster (substring matcher)

The matcher's first branch is `normalized.includes(normalizedPattern)`. Any file whose path *contains* a protected pattern as a substring is blocked, even when no path-segment boundary is present. Examples currently blocked that arguably should not be:
- `flow_state.yml.bak`, `flow_state.yml.old`, `flow_state.yml-2025-01-01`
- `prefix-flow_state.yml`, `my-flow_state.yml`
- `.agentsignore` is the *exception* — it does NOT contain the literal substring `.agents/` (no trailing slash in the file path), so it passes. The defaults that include a trailing slash (`.agents/`) accidentally avoid this issue; the bare-filename defaults do not.

A v0.7 follow-up should switch to a boundary-aware matcher (e.g. minimatch or a hand-rolled segment matcher) to eliminate this. Tests pin **current** behavior; do not "fix" them without updating the matcher in lockstep.

### `**` glob (prefix-only)
9. Pattern `secrets/**` + file `secrets/api.key` → block (prefix `secrets/`).
10. Pattern `secrets/**` + file `not-secrets/api.key` → pass.
11. Pattern `**/private/**` (prefix is empty) — guard treats this as no prefix, so the `**` branch is skipped. Falls through to substring/basename. Document this as a known limitation.

### Path normalization
12. Windows-style staged path `.agents\\rules\\x.md` → block (matcher normalizes `\\` to `/` for both file and pattern).
13. Pattern `.agents\\` → block on `.agents/x.md` (normalization symmetric).

### Empty / disabled config
14. Empty `stagedFiles` array → pass with no findings.
15. `protectedPaths: []` → pass (every file allowed).
16. Custom `protectedPaths` overrides defaults entirely (defaults are NOT merged).

### Multi-finding behavior
17. Two protected files staged → exactly two findings (one per file).
18. One file matching multiple patterns → exactly one finding (inner loop breaks on first match).

### Finding shape
19. Block findings populate `filePath` with the offending path.
20. Block findings include the matched pattern in the message.
21. Block findings include a `git reset HEAD <file>` fix suggestion.
22. `durationMs` is non-negative.

## Assertion rules

- Behavioral; assert on `passed`, `findings.length`, finding `filePath`/`message` content.
- For multi-pattern files, assert exactly one finding (anti-duplication invariant).
