# Adversarial Test Spec — hollowArtifactGuard (Phase 3 hardening)

> Source: `src/guards/hollow-artifact.ts`
> Pre-PR coverage: line 92 / **branch 75** / **funcs 71**.
> Existing happy-path coverage at `tests/hollow-artifact.test.js`. This spec adds **adversarial** scenarios.

## Mock audit

The guard reads files via `fs.existsSync` + `fs.readFileSync`. Tests use real temp dirs (same pattern as the existing file). DSPy is exercised through `ctx.semanticEvals` — no live HTTP required.

## Adversarial scenarios

### Pattern-evasion (Happy Path Complacency target)

Per `.agents/contracts/jules.md`, LLMs tend to write nominal-case tests. These intentionally adversarial inputs catch evasion attempts:

1. **Zero-instead-of-O substitution** — `T0DO` (digit zero) — should **NOT** match the default `\bTODO\b` pattern. Documents the limitation that the default regex is ASCII-literal; users wanting to catch this need to add a custom pattern.
2. **Greek-letter lookalike** — `TΟDO` (uppercase Greek omicron `Ο`, U+039F) — also **NOT** caught by default. Same documented limitation.
3. **Zero-width-space splitting** — `T\u200BODO` — **NOT** caught (regex sees `T`, `\u200B`, `O`, `D`, `O`, no word boundary line up). Documented limitation.
4. **Newline split** — `T\nODO` — **NOT** caught (regex is single-line by default and `\bTODO\b` needs contiguous letters).
5. **Lowercase variants** — `todo`, `tbd`, `placeholder` — **caught** (default uses `i` flag).
6. **Nested in code comments** — `// TODO: x`, `<!-- TODO -->`, `# TODO:` — **caught** (regex doesn't care about syntax).
7. **String literal embedding** — `"This is just the word TODO in a string"` — **caught** (regex doesn't parse strings).
8. **Multi-byte content** with Vietnamese diacritics — file contains substantive Vietnamese text + the literal `TODO` — **caught**, file flagged.
9. **CJK** content — file contains Chinese characters + `TBD` — **caught**.
10. **Emoji prefix** — `🚧 TODO 🚧` — **caught**.

### Custom pattern configuration

11. Custom pattern catches `T0DO` via `T0DO|T[ΟO]DO` — verifies custom regex is honored.
12. Empty `patterns: []` array → falls back to defaults? No — `config?.patterns` is truthy when `[]`, and `.map(...)` on empty array returns `[]`. **Pinned current behavior:** with empty patterns, no patterns are checked; only length-based checks remain. Document as a footgun.
13. Multiple custom patterns — first match wins (no double-count per file).

### Length / stripping checks

14. **Only headers** (e.g. `# Title\n\n## Subtitle\n`) — `stripBoilerplate` returns "" → BLOCK finding "contains only headers/frontmatter with zero substantive content".
15. **Only frontmatter** (`---\nname: x\n---\n`) — same BLOCK.
16. **Headers + just blank lines** — same BLOCK.
17. **Just under minContentLength** (49 chars after stripping with default 50) → WARN.
18. **Just at minContentLength** (50 chars) → no length finding.
19. Custom `minContentLength: 10` lowers the bar — files between 10 and 49 chars no longer warn.

### File-system edges

20. File listed in `stagedFiles` but does NOT exist on disk → silently skipped, no finding.
21. File path with extension outside `extensions` filter → not checked at all.
22. Custom `extensions: [".rst"]` → only `.rst` files checked.

### Multi-finding semantics

23. Two hollow files staged → exactly two BLOCK findings (one per file).
24. Single file matching multiple patterns → exactly one BLOCK finding (`break` after first match).
25. File with both pattern hit AND length issue → both findings appear (BLOCK + WARN); guard returns `passed: false`.

### DSPy adversarial paths

26. File **passed** all deterministic checks but DSPy returns `null` (network failure) → no DSPy finding emitted.
27. File **passed** all deterministic checks, DSPy returns score `0.4999...` → WARN finding (boundary < 0.5).
28. File **failed** a BLOCK pattern → DSPy is **skipped entirely** for that file (no double-warning even if score is low).
29. DSPy `useDspy: true` + extension `.exe` (not in semantic whitelist) → DSPy not run for that file.
30. DSPy `feedback` undefined → message ends with empty string fallback (no crash).

## Assertion rules

- Behavioral; assert on `passed`, finding `severity` + `message` substrings, `findings.length`.
- Use `fs.mkdtempSync` with cleanup in `afterEach`.
- Use the `node:test` `describe`/`it` API consistently (existing file uses `t.test` — new file should NOT mix).
- Document each "should NOT match" case as a **known limitation** — these are pinned, not bugs to fix in this PR.
