# Adversarial Test Spec — phaseGateGuard

> Source: `src/guards/phase-gate.ts`
> Default plan file: `implementation_plan.md`
> Default source patterns: `["src/", "lib/", "app/"]`

## Mock audit

The guard uses `fs.existsSync` against `path.join(ctx.projectRoot, planFile)`. Tests use a **real temp directory** (Node's `os.tmpdir()`) instead of mocking `fs`, matching the existing `tests/hollow-artifact.test.js` pattern. No network or other globals.

## Adversarial scenarios

### No source files staged
1. Empty `stagedFiles` → pass (no plan check).
2. Only doc files staged (`README.md`, `docs/x.md`) → pass.
3. Only test files staged (`tests/foo.test.js`) → pass.

### Source files staged + plan present
4. `src/foo.ts` + `implementation_plan.md` exists in projectRoot → pass.
5. `lib/x.js` + plan exists → pass.
6. `app/a.ts` + plan exists → pass.

### Source files staged + plan missing
7. `src/foo.ts` + no plan file → block.
8. Block message names the missing plan file path.
9. Block message lists at most the first 5 source files (truncation for many sources).

### `isSourceFile` matcher edge cases
10. `srcs/foo.ts` (similar prefix without trailing slash boundary) → does NOT match (`.startsWith("src/")` is false).
11. `SRC/foo.ts` (case mismatch) → does NOT match (case-sensitive `startsWith`).
12. Backslash-normalized path `src\\foo.ts` → matches (matcher normalizes `\\` to `/`).
13. Pattern containing `**` is currently stripped before matching (`replace(/\\*\\*/g, "")`); document the resulting behavior — `src/**/inner` becomes `src//inner`, which only matches `src//inner...`. Pin behavior; do not "fix" without updating the matcher.

### Custom config
14. Custom `planFile: "PLAN.md"` + `PLAN.md` exists → pass.
15. Custom `planFile: "docs/PLAN.md"` + nested file exists → pass.
16. Custom `sourcePatterns: ["packages/"]` + only files outside that prefix → pass.

### Finding shape
17. Block findings include a `fix` suggestion mentioning the plan file.
18. `durationMs` is non-negative.
19. `guardId` is `"phaseGate"`.

## Assertion rules

- Behavioral; assert on `passed`, message substrings, `findings.length`.
- Use `fs.mkdtempSync` + `afterEach` cleanup pattern from `tests/hollow-artifact.test.js`.
- Never write outside the per-test temp dir.
