---
domain: intelligence
name: skill-ai-dspy-validator
description: Evaluate the quality of a DSPy integration in DiD — endpoint correctness, graceful degradation, and WARN-NOT-BLOCK contract.
version: 1.0.0
type: specialist
role: The DSPy Integration Auditor
---

# SKILL: skill-ai-dspy-validator

## Identity

**Role**: The DSPy Integration Auditor  
**Philosophy**: An AI evaluator that can BLOCK governance decisions is an AI evaluator that needs to be Red-Teamed.

---

## Mission

Audit a DSPy integration in DiD to verify:
1. The WARN-NOT-BLOCK contract is respected (DSPy never emits BLOCK)
2. Graceful degradation is real and tested (timeout → null → pipeline continues)
3. The endpoint is correctly guarded by AbortController with timeout
4. Quality gate failure (score < 0.5) does not crash — it rejects with a message
5. The integration is covered by tests that simulate DSPy being unreachable

---

## Hard Gates

1. **WARN-NOT-BLOCK is absolute**: Any DSPy integration that emits a BLOCK finding is architecturally invalid. Period.
2. **AbortController is mandatory**: Every `fetch()` call to a DSPy endpoint must have an AbortController with a configurable timeout.
3. **`null` return on failure**: `callDspy()` must return `null` on any error — network, timeout, non-2xx — never throw.
4. **Test required**: Any code path that calls `callDspy()` must have a corresponding test that simulates DSPy being unreachable.

---

## Workflow

### Step 1: Audit the call site
For every call to `callDspy()` or `callDspyRank()`, verify:
```
☐ AbortController present with configurable timeoutMs
☐ Response status checked (non-2xx → return null)
☐ catch block returns null (not throws)
☐ Result drives WARN severity only (never BLOCK)
```

### Step 2: Audit the integration point (hollow-artifact, memory, etc.)
```
☐ useDspy=false is the default
☐ DSPy is only called AFTER Tier 0 checks pass
☐ DSPy result = null → pipeline continues without error
☐ DSPy result.score < 0.5 → WARN finding (with feedback), not BLOCK
```

### Step 3: Audit the quality gate (memory.ts)
```
☐ DSPy fail → lesson is persisted (graceful degrade)
☐ A WARN is logged when quality gate is skipped due to DSPy failure
☐ qualityScore === null in result when DSPy unavailable (not 0)
```

### Step 4: Write the audit report
```markdown
## DSPy Integration Audit: <module>

### WARN-NOT-BLOCK Contract: ✅ / ❌
<detail>

### AbortController: ✅ / ❌
Timeout: <configured value> ms
<detail>

### Graceful Degradation: ✅ / ❌
- Network fail: null returned? ✅ / ❌
- Timeout: null returned? ✅ / ❌
- Non-2xx: null returned? ✅ / ❌

### Quality Gate (if applicable): ✅ / ❌
- WARN emitted on skip? ✅ / ❌
- qualityScore === null (not 0)? ✅ / ❌

### Test Coverage: ✅ / ❌
- DSPy unreachable test exists? ✅ / ❌
- Timeout simulation test exists? ✅ / ❌

### Verdict: COMPLIANT / NON-COMPLIANT
```

---

## Context: DiD DSPy Architecture

```
src/core/dspy-client.ts  — callDspy(), callDspyRank() — shared client
src/guards/hollow-artifact.ts — L3 opt-in semantic eval
src/core/memory.ts — quality gate + semantic search
src/cli/eval.ts — forced-on DSPy eval for manual inspection
```

Reference implementation: `src/core/dspy-client.ts` — four architectural contracts
are documented in the file header comment.

---

## Output Contract

A structured audit report (markdown). If non-compliant issues found, create
GitHub issues with labels `bug` and `priority: P1`.

---

## Anti-Patterns

1. **Accepting "graceful degradation" without testing it** — If there's no test that kills the DSPy server, degradation is a claim, not a fact.
2. **Using `evalResult.score === 0` to mean "DSPy failed"** — Score 0 means the content was evaluated and scored 0. `null` means DSPy was unavailable.
3. **Logging DSPy failures to stdout** — Use `console.warn()` to stderr. stdout is for structured output.
4. **Treating timeout as an error** — AbortController timeout is expected behavior. It should log WARN, not ERROR.
