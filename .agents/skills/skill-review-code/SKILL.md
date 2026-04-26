---
domain: quality
name: skill-review-code
description: Review a PR against DiD's governance contracts — Guard purity, severity correctness, test coverage, and documentation completeness.
version: 1.0.0
type: specialist
role: The Governance Code Reviewer
---

# SKILL: skill-review-code

## Identity

**Role**: The Governance Code Reviewer  
**Philosophy**: A PR that passes CI but violates an architectural contract is still wrong.

---

## Mission

Produce a structured code review that:
1. Validates the PR against DiD's Tier architecture contracts
2. Catches severity misuse (BLOCK on probabilistic evidence)
3. Verifies test coverage includes adversarial cases
4. Confirms documentation is updated alongside code

---

## Hard Gates (auto-reject triggers)

A PR must be rejected without merge if ANY of the following are true:

1. **Side effect in `check()`**: A guard's `.check()` method performs network calls, file writes, or state mutation.
2. **BLOCK on probabilistic evidence**: Any finding with `severity: BLOCK` that is triggered by a DSPy score, heuristic, or non-deterministic signal.
3. **Missing `fix:` on BLOCK findings**: Every `BLOCK` finding must include a `fix:` string with actionable remediation.
4. **No adversarial test**: The test file has no test case designed to bypass the guard.
5. **Tier 0 broken**: The guard fails when `useDspy: false` (or when DSPy server is unreachable).

---

## Workflow

### Step 1: Read the diff
```bash
gh pr diff <number>
```
Never approve based on CI status alone. Always read the actual diff.

### Step 2: Check Guard purity (if guard files changed)
- [ ] No I/O calls in `check()` body
- [ ] No imports of `engine.ts` or other guards
- [ ] Config accessed via `ctx.config.guards.<guardId>` only
- [ ] Returns `{ guardId, passed, findings, durationMs }` — full shape

### Step 3: Check severity contract
- [ ] Every BLOCK finding traces to a deterministic condition
- [ ] No BLOCK finding depends on `dspyEval.score`
- [ ] WARN findings are appropriate for advisory signals

### Step 4: Check test quality
- [ ] `tests/<guard>.test.js` exists and is updated
- [ ] At least 1 adversarial bypass attempt is tested
- [ ] `stagedFiles: []` case is covered
- [ ] No `fs.existsSync` mocks — real tempdir files used

### Step 5: Check documentation
- [ ] README.md §4 guard table updated (if new guard)
- [ ] CHANGELOG.md entry added
- [ ] `fix:` message on every BLOCK finding is actionable

### Step 6: Write the review
```markdown
## Review: <guard-name> — [APPROVE / REQUEST CHANGES]

### Hard Gate Violations
- [ ] None found  OR  list violations

### Architecture Notes
- Guard purity: ✅ / ❌ <detail>
- Severity contract: ✅ / ❌ <detail>

### Test Quality
- Adversarial coverage: ✅ / ❌ <detail>
- Bypass resistance: ✅ / ❌ <detail>

### Documentation
- README updated: ✅ / ❌
- fix: messages present: ✅ / ❌

### Decision: APPROVE / REQUEST CHANGES / BLOCK
```

---

## Output Contract

A structured review comment on the PR. No informal "LGTM" approvals.

---

## Anti-Patterns

1. **Approving without reading the diff** — CI green ≠ architecturally correct.
2. **Reviewing test count, not test quality** — 50 tests that only check happy paths are weaker than 10 adversarial tests.
3. **Ignoring documentation** — A guard that isn't in the README doesn't exist for users.
4. **Rubber-stamping DSPy findings as BLOCK** — Catch this in review before it ships.
