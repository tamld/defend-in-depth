---
domain: governance
name: skill-guard-governance
description: The canonical skill for designing, implementing, testing, and registering a new Guard in defense-in-depth.
version: 1.0.0
type: specialist
role: The Guard Architect
---

# SKILL: skill-guard-governance

## Identity

**Role**: The Guard Architect  
**Philosophy**: A Guard is a formalized threat model. Before writing code, write the threat.

---

## Mission

Design and ship a new Guard that:
1. Catches a specific class of governance violation
2. Is deterministic, pure, and testable in isolation
3. Has adversarial test fixtures before any implementation code
4. Is registered in the engine and documented in README + STRATEGY

---

## Hard Gates

> These constraints are non-negotiable. Violating any one = the Guard is rejected.

1. **Pure function contract**: Guards must NOT perform I/O inside `.check()`.
   All file reads, network calls, and enrichment belong in the engine's
   pre-pipeline phase. Source: `src/core/engine.ts` enrichment pattern.

2. **Severity contract**:
   - `BLOCK` = deterministic violation. Regex match, schema fail, etc. Never probabilistic.
   - `WARN` = advisory signal. DSPy score, heuristic, soft policy. Always WARN.
   - A guard that emits BLOCK based on LLM output is architecturally invalid.

3. **Tier 0 by default**: The core check path (no `useDspy`, no network) must
   work without any external dependencies. Optional enhancements are Tier 1.

4. **Test fixtures before code**: The `tests/fixtures/<guard-name>/edge_cases.md`
   file must exist and contain at least 5 adversarial cases BEFORE `src/guards/*.ts`
   is written.

5. **Single responsibility**: One guard = one threat category. Do not bundle
   "hollow artifact" + "wrong ticket" into one guard. Split them.

---

## Workflow

### Phase 1: Threat Identification
1. Describe the governance violation in one sentence: *"An agent can bypass X by doing Y."*
2. Check existing guards (`ls src/guards/`) — does one already cover this?
3. Check `STRATEGY.md` roadmap — is this scheduled for a future version?
4. Write the threat description in `tests/fixtures/<guard-name>/edge_cases.md`

### Phase 2: Contract Design
1. Define the `guardId` (kebab-case, e.g., `hollow-artifact`)
2. Map the violation to severity: is it always a BLOCK, or always a WARN?
3. Define the config schema shape (what goes in `defense.config.yml`?)
4. Define what `ctx.stagedFiles` entries trigger the guard

### Phase 3: Adversarial Fixtures (BEFORE CODE)
In `tests/fixtures/<guard-name>/edge_cases.md`, document:
- 3 cases that MUST trigger BLOCK
- 2 cases that MUST trigger WARN
- 2 cases that MUST pass cleanly (false positive prevention)
- 1 adversarial bypass attempt (how would a bad actor evade this guard?)

### Phase 4: Implementation
```
src/guards/<guard-name>.ts
```
Template structure:
```typescript
import type { Guard, GuardContext, GuardResult, Finding } from "../core/types.js";
import { Severity } from "../core/types.js";

export const myGuard: Guard = {
  id: "my-guard",
  name: "Human Readable Name",
  description: "One-line: what it catches and why.",

  async check(ctx: GuardContext): Promise<GuardResult> {
    const start = performance.now();
    const findings: Finding[] = [];
    const config = ctx.config.guards.myGuard;

    for (const relPath of ctx.stagedFiles) {
      // Tier 0 deterministic checks here
      // Tier 1 (DSPy) checks ONLY if: useDspy=true AND file passed Tier 0
    }

    return {
      guardId: "my-guard",
      passed: !findings.some(f => f.severity === Severity.BLOCK),
      findings,
      durationMs: performance.now() - start,
    };
  },
};
```

### Phase 5: Registration
1. Add to `src/core/engine.ts` guard list (follow existing pattern)
2. Add config type to `src/core/types.ts` (follow `HollowArtifactConfig` pattern)
3. Add default config in `src/core/config-loader.ts`

### Phase 6: Tests
File: `tests/<guard-name>.test.js`

Must cover:
- [ ] Each BLOCK case from fixtures
- [ ] Each WARN case from fixtures
- [ ] Each clean-pass case from fixtures
- [ ] The adversarial bypass attempt
- [ ] Config override (non-default `minContentLength` etc.)
- [ ] Empty `stagedFiles` array (no files staged → guard should pass cleanly)

### Phase 7: Documentation
- [ ] Add row to README.md §4 Built-in Guards table
- [ ] Add `fix:` message to every BLOCK finding (user-actionable)
- [ ] Update CHANGELOG.md

---

## Output Contract

When this skill is complete, you must have produced:

| File | Status |
|:---|:---|
| `tests/fixtures/<guard-name>/edge_cases.md` | ✅ Written FIRST |
| `src/guards/<guard-name>.ts` | ✅ Pure, no I/O in check() |
| `src/core/types.ts` — config type added | ✅ |
| `src/core/engine.ts` — guard registered | ✅ |
| `src/core/config-loader.ts` — defaults added | ✅ |
| `tests/<guard-name>.test.js` | ✅ Adversarial coverage |
| `README.md` — guard table updated | ✅ |
| `CHANGELOG.md` — entry added | ✅ |

---

## Anti-Patterns

1. **"I'll add tests later"** — Fixtures must exist before implementation. This is not optional.
2. **Mixing severity** — A guard that sometimes emits BLOCK based on a heuristic score is broken. BLOCK is deterministic or it is nothing.
3. **Side effects in check()** — Reading files inside `.check()` is acceptable. Writing files, making network calls, or modifying state is not.
4. **Over-coupling to engine internals** — Guards must only read `ctx.*`. They must never import `engine.ts` or call other guards.
5. **Missing `fix:` field on BLOCK findings** — Every BLOCK must tell the user exactly how to fix it. "Fix the file" is not a fix.

---

## Related

- [`docs/dev-guide/fail-fast-policy.md`](../../docs/dev-guide/fail-fast-policy.md) — Engine behavior contract
- [`src/core/types.ts`](../../src/core/types.ts) — `Guard`, `Finding`, `Severity` interfaces
- [`src/guards/hollow-artifact.ts`](../../src/guards/hollow-artifact.ts) — Reference implementation
- [`tests/hollow-artifact-adversarial.test.js`](../../tests/hollow-artifact-adversarial.test.js) — Reference test pattern
