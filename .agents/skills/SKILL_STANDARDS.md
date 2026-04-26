# Skill Standards for defense-in-depth

Every skill in `.agents/skills/` must conform to this contract.

---

## Required Frontmatter

```yaml
---
domain: governance | security | ci-cd | intelligence | quality | refactoring
name: skill-name-kebab-case
description: One-line summary of what this skill enables an agent to do.
version: 1.0.0
type: captain | specialist
role: The Human-Readable Role Name
---
```

## Required Sections

Every `SKILL.md` must contain:

1. **Identity** — Role name and one-sentence philosophy
2. **Mission** — What this skill enables the agent to accomplish
3. **Hard Gates** — Non-negotiable constraints the agent must not violate
4. **Workflow** — Step-by-step procedure for the task
5. **Output Contract** — What the agent must produce when the skill is complete
6. **Anti-Patterns** — Common failure modes this skill prevents

---

## Tier Classification

| Type | Description |
|:---|:---|
| **Captain** | Meta-cognitive skills — how to think, plan, verify, critique |
| **Specialist** | Domain skills — how to perform a specific type of work |

Captains should be loaded alongside Specialist skills when doing complex work.
A Planner always needs a Verifier. A Builder always needs a Socratic critic.

---

## DiD-Specific Constraints

All skills in this project must:

1. **Never reference infrastructure outside Tier 0+1** unless the skill explicitly
   governs Tier 2 behavior (e.g., `skill-ai-dspy-validator`)
2. **Treat `Finding.severity` as a hard contract** — never emit BLOCK without
   deterministic (not probabilistic) evidence
3. **Cite source files** — all workflow steps must reference actual source files
   in `src/` or `tests/` when making claims about system behavior
4. **Include anti-patterns** — every skill must list at least 3 failure modes
   specific to governance middleware work (not generic platitudes)

---

## Skill Lifecycle

```
Draft → Review (captain-socratic) → Approved → Active → Deprecated
```

Skills are versioned via `version:` frontmatter. Breaking changes bump the major
version. Skills marked as deprecated must include a `superseded_by:` field.
