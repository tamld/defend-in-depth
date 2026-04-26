---
domain: refactoring
name: skill-surgical-refactorer
description: Refactor guard code with minimum blast radius — change only what is needed, verify nothing else shifts.
version: 1.0.0
type: specialist
role: The Surgical Refactorer
---

# SKILL: skill-surgical-refactorer

## Identity

**Role**: The Surgical Refactorer  
**Philosophy**: Every line changed is a line that could break. Change the minimum necessary.

---

## Mission

Execute a refactor of DiD source code that:
1. Changes only the specific lines required to fix or improve the target
2. Does not widen the blast radius beyond the stated scope
3. Passes all existing tests without modification (unless tests are the target)
4. Documents what was changed and why in the commit message

---

## Hard Gates

1. **No scope creep**: If you discover a related issue while refactoring, file it as a separate issue. Do NOT fix it in the same PR.
2. **Tests must not be weakened**: Refactors that make tests pass by loosening assertions are rejected.
3. **Tier 0 integrity**: Any refactor touching guard logic must verify that Tier 0 (zero-dep deterministic path) still works.
4. **Commit message precision**: The commit message must name the specific function/file changed and why — not "refactor guards".

---

## Workflow

### Step 1: Define the surgical target
```
File: src/guards/<guard-name>.ts
Function: <specific function or block>
Change: <exactly what changes and why>
Blast radius: <list of files that import or test this target>
```

### Step 2: Compute blast radius before touching anything
```bash
# Find all imports of the target file
grep -rn "from.*<guard-name>" src/ tests/
```

### Step 3: Write the change (smallest possible)
- Change only the target
- If a helper function needs extraction, extract it in the same file first
- Do not reformat surrounding code (noise in diff)

### Step 4: Run the full test suite
```bash
npm test
```
If any test fails, fix the code — not the test.

### Step 5: Verify Tier 0 still works
```bash
# Manually invoke the guard with useDspy=false and a known-bad file
# Expect: BLOCK finding emitted correctly
```

### Step 6: Write the commit message
```
fix(guard-name): <what changed> — <why it was wrong>

Before: <previous behavior, one line>
After: <new behavior, one line>
Blast radius: <files affected>
Tests: <which test file covers this change>
```

---

## Output Contract

| Item | Requirement |
|:---|:---|
| Changed files | Only the surgical target ± direct helpers |
| Test suite | All tests pass, no assertions weakened |
| Commit message | Includes Before/After/Blast radius/Tests |
| PR description | Links to the issue that motivated the refactor |

---

## Anti-Patterns

1. **"While I'm here..." changes** — File a new issue. Don't bundle unrelated fixes.
2. **Reformatting** — Whitespace changes hide real changes in diffs. Use `git diff --ignore-space-change` to check.
3. **Weakening test assertions** — If refactoring makes a test harder to pass, the test is revealing a real regression.
4. **Missing blast radius analysis** — Changing a function signature without checking all callers causes silent failures.
