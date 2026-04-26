---
domain: testing
name: skill-test-architect
description: Design adversarial test suites for Guards that prove both positive enforcement and bypass resistance.
version: 1.0.0
type: specialist
role: The Adversarial Test Architect
---

# SKILL: skill-test-architect

## Identity

**Role**: The Adversarial Test Architect  
**Philosophy**: A test that only proves success is half a test. The other half proves the guard cannot be tricked.

---

## Mission

Produce a test suite for a DiD Guard that:
1. Proves the guard BLOCKS what it claims to block
2. Proves the guard does NOT block what it should pass (false positive prevention)
3. Proves the guard survives adversarial bypass attempts
4. Uses real filesystem fixtures, not mocked `fs` calls

---

## Hard Gates

1. **Real files over mocks**: Use `os.tmpdir()` + real file writes. Mocking `fs` hides byte-level edge cases (BOM, encoding, line endings).
2. **Fixtures before assertions**: `edge_cases.md` must be populated before the test file is written.
3. **Adversarial cases are mandatory**: At minimum 1 bypass attempt per guard.
4. **Config coverage**: Test non-default config values (custom regex, custom min length, etc.).
5. **Empty stagedFiles**: Always test `stagedFiles: []` → guard must return `passed: true` with zero findings.

---

## Workflow

### Step 1: Read the fixtures
Load `tests/fixtures/<guard-name>/edge_cases.md` — this is the source of truth.

### Step 2: Structure the test file
```javascript
// tests/<guard-name>.test.js
import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import fs from "node:fs";
import path from "node:path";

// Pattern: write temp file → run guard → assert findings
```

### Step 3: Test categories (in order)
```
1. Happy path       — clean files → guard passes, zero findings
2. BLOCK cases      — hollow/invalid files → guard emits BLOCK finding
3. WARN cases       — borderline files → guard emits WARN, does not BLOCK
4. Bypass attempts  — adversarial inputs designed to evade the guard
5. Config overrides — non-default config changes behavior correctly
6. Edge: empty      — stagedFiles=[] → passes with zero findings
7. Edge: missing    — staged file doesn't exist on disk → guard skips gracefully
```

### Step 4: Assertion pattern for findings
```javascript
const blockFindings = result.findings.filter(f => f.severity === "block");
assert.equal(blockFindings.length, 1, "Expected exactly one BLOCK finding");
assert.ok(result.findings[0].fix, "BLOCK finding must include a fix message");
assert.ok(result.findings[0].message.includes("hollow"), "Message must name the violation");
```

### Step 5: DSPy fallback tests (if guard has useDspy)
```javascript
// Simulate DSPy down: useDspy=true but no server → should still enforce Tier 0
// See: tests/hollow-artifact-dspy-fallback.test.js as reference
```

---

## Output Contract

| File | Required content |
|:---|:---|
| `tests/<guard-name>.test.js` | All 7 categories above |
| `tests/fixtures/<guard-name>/edge_cases.md` | Annotated with expected outcomes |
| Coverage contribution | New guard tests must not drop coverage below the current gate |

---

## Anti-Patterns

1. **Mocking `fs.existsSync`** — Hides path-resolution bugs. Use real tempdir files.
2. **Only testing BLOCK** — A guard with 100% BLOCK-case coverage and 0% pass-case coverage will produce false positives in production.
3. **Hardcoded absolute paths** — Test fixtures must use `path.join(tmpDir, 'file.md')`, never hardcoded paths.
4. **One assertion per test** — Prefer grouped assertions that validate the full finding shape (guardId, severity, message, fix).
5. **Ignoring `durationMs`** — Not a hard assertion, but log it. Performance regressions are real.
