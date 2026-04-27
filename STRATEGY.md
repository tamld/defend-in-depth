# 📋 STRATEGY.md — Strategic Metadata for defense-in-depth

> **For any agent reading this:** This document tells you WHERE this project is going,
> WHAT has been decided, and HOW to contribute without conflicting with the plan.

---

## Mission

*For the complete philosophical foundation — the three cognitive branches, the DO/DON'T mandates, and the growth flywheel — see [COGNITIVE_TREE.md](.agents/philosophy/COGNITIVE_TREE.md).*

**defense-in-depth** is a governance middleware layer that bridges AI coding agents
into human/enterprise operational workflows.

- **AI** handles: artifact generation, execution plans, mechanical checks
- **Humans** handle: business logic, ground truth, architecture decisions
- **defense-in-depth** handles: the gap between them (validation, enforcement, growth)

---

## Strategic Pillars

### 1. Progressive Enhancement Architecture

The governance core **must** work with zero dependencies. Each optional layer
**compounds** capability without making it mandatory.

```
Tier 0 — Deterministic Core (always available, zero deps)
  Regex guards, length heuristics, CI gates, git hooks
  → No network, no config, no prerequisites
  → Guarantees: BLOCK/WARN on known patterns, everywhere

Tier 1 — Optional Intelligence (plug in what you need)
  DSPy semantic eval, quality gate, semantic search
  → Single opt-in flag per feature, graceful degrade
  → Guarantees: Better signal when available; Tier 0 holds when not

Tier 2 — Agent Skills (plug in how you govern)
  .agents/skills — lazy-loaded behavioral guidelines for AI contributors
  → Never mandatory, never in the runtime path
  → Guarantees: Consistent governance behavior across agents
```

| Decision | Rationale |
|:---|:---|
| Tier 0 never changes | Core guards are dependency-free and cross-platform by design |
| Tier 1 is opt-in | DSPy, federation, telemetry — each requires an explicit config flag |
| Tier 2 is lazy-loaded | Skills are read by agents, not executed by the engine |
| No dep is "free" | Every dependency must justify its blast radius against Tier 0 integrity |
| Pluggable Providers | External systems (Jira, Linear, parent projects) via adapters, never core |

> **Project tagline**: *"Zero to excellent: works out of the box, compounds with context."*

**Implication for agents:** Tier 0 is inviolable. When adding capability,
first ask which Tier it belongs to. Tier 1 features must have `useDspy`/`enabled`
guards. Tier 2 assets (skills, rules) must be lazy-loadable markdown — never
imported by TypeScript source.


### 2. Guard Pipeline Architecture

| Decision | Rationale |
|:---|:---|
| Pluggable `Guard` interface | Users can add custom validators |
| Pure functions only | No side effects → deterministic, testable |
| Engine runs guards sequentially | Predictable order, clear error attribution |
| PASS/WARN/BLOCK severity | Simple tri-state for clear decisions |

**Implication for agents:** Every new check = new guard file. No checking logic
inside the engine or CLI.

### 3. Trust-but-Verify (Evidence System)

| Decision | Rationale |
|:---|:---|
| `EvidenceLevel` enum (`CODE`/`RUNTIME`/`INFER`/`HYPO`) | Forces agents to tag how they verified |
| `Finding.evidence` field | Guards can attach proof level |
| Future: `Lesson.wrongApproach` + `correctApproach` | Án Lệ (case law) records concrete context |

**Implication for agents:** When reporting findings, ALWAYS specify evidence level.
Untagged findings are treated as `HYPO`.

### 4. HITL as Supreme Rule

| Decision | Rationale |
|:---|:---|
| Guards never auto-merge PRs | Human judgment is irreplaceable for semantics |
| Automated Gateways as first-pass reviewer | Reduces human review burden, not replaces it |
| Phase gates require plan files | Prevents "code first, think later" |

**Implication for agents:** You are NOT autonomous. You propose. Humans approve.
*For automated first-pass reviews, refer to internal operational rules like [rule-coderabbit-integration.md](.agents/rules/rule-coderabbit-integration.md) to handle feedback metadata.*

### 5. Growth Engine (Future)

| Decision | Rationale |
|:---|:---|
| `Lesson` type with recall-friendly fields | Growth requires searchable memory |
| `searchTerms` + `tags` + `relatedLessons` | Enables semantic recall across projects |
| `GrowthMetric` tracking | Measures learning velocity over time |
| `wrongApproach` is MANDATORY in lessons | Generic lessons are useless |

**Implication for agents:** When recording lessons, be SPECIFIC. "Always test code"
is rejected. "Guard X missed BOM-prefixed files because regex lacked BOM strip" is accepted.

### 6. Prebuilt Agent Configs (Meta Prompting Materialized)

| File | Platform | Purpose |
|:---|:---|:---|
| `GEMINI.md` | Gemini CLI | Bootstrap chain + cognitive framework |
| `CLAUDE.md` | Claude Code / Antigravity | Bootstrap chain + memory priming |
| `.cursorrules` | Cursor AI | Comment-based ruleset |

**Implication:** Any AI agent entering this project has ZERO onboarding friction.
They immediately receive: laws, coding standards, quick reference, and cognitive framework.
This is meta-prompting — not telling agents what to do, but teaching them how to teach themselves.

### 7. Meta Layers (Vision — Published as Types)

| Layer | Type | What it measures |
|:---|:---|:---|
| 0: Guards | `Guard`, `Finding` | Is this commit clean? (SHIPPED v0.1) |
| 1: Memory | `Lesson`, `GrowthMetric` | What did we learn? (SHIPPED v0.4) |
| 2: Meta Memory | `LessonOutcome`, `RecallMetric`, `RecallEvent`, `FeedbackEvent`, `GuardF1Metric` | Are lessons recalled and helpful? (SHIPPED MVP v0.7-rc.1; aggregation/F1 deferred to v1.1.x Track B) |
| 3: Meta Growth | `MetaGrowthSnapshot` | Is the growth system improving? (DESIGNED v1.1.x — gated on Track A4 adoption exit) |
| F: Federation guards | `FederationGuardConfig`, `HttpTicketProvider` | Parent↔child governance enforcement (SHIPPED v0.6) |
| F: Telemetry Sync | `FederationPayload` | Bidirectional Internal ↔ OSS data flow (DESIGNED v0.9) |

All types are published in `src/core/types.ts` — compiled, documented, importable.
See `docs/vision/meta-architecture.md` for the full vision.

---

## Roadmap (Tactical)

| Phase | Version | Focus | Key Types |
|:---|:---:|:---|:---|
| **Foundation** | v0.1 | Core guards + CLI + OSS + prebuilt configs | `Guard`, `Severity`, `Finding` |
| **Ecosystem** | v0.2 | `.agents/` scaffold + 19 rules + 5 skills | `GuardContext`, config schema |
| **Identity** | v0.3 | Ticket-aware guards (TKID Lite) | `TicketRef` |
| **Memory** | v0.4 | Lesson recording + growth metrics | `Lesson`, `GrowthMetric` |
| **Intelligence** | v0.5 | DSPy adapter + semantic evaluation | `EvaluationScore` |
| **Federation** | v0.6 | Parent↔child governance guards | `FederationGuardConfig`, `HttpTicketProvider` |
| **Progressive Discovery + Path A memory loop** | v0.7-rc.1 | Discovery UX (Persona A → B bridge) + `LessonOutcome` MVP | `Hint`, `HintState`, `LessonOutcome`, `RecallMetric`, `RecallEvent`, `FeedbackEvent`, `GuardF1Metric` |
| **Progressive Enhancement** | v0.7† | Philosophy reframe + `.agents/skills` + lazy-load docs | (scaffold only — no new types) |
| **Track A1–A4 — Adoption track** | v0.7.x → v1.0 | Docs reconcile, guard breadth bump, API freeze, `npm latest` promo, 30-day bake. Gates Track B. | (no new types — release engineering) |
| **Stable** | v1.0 | Public API freeze + `npm latest` GA | All types frozen |
| **Meta Growth** | v1.1.x | F1 aggregator + Injection (Án Lệ) + Dedup + Forgetting + Quality Gate. Gated on Track A4 exit (≥10 external users + ≥100 captured events). | `MetaGrowthSnapshot` |
| **Telemetry Sync / Enterprise** | v0.9 (renumber after v1.1.x lands) | Bidirectional Internal ↔ OSS data flow, Federation hardening | `FederationPayload` |

**Status Update (v0.4)**: Foundation (v0.1), Ecosystem (v0.2), Identity (v0.3) shipped. Memory Layer & Root Pollution Guard (v0.4) **shipped**:

- `TicketRef` added to `GuardContext` — engine extracts TKID from branch name, commit message, or directory name.
- `TicketIdentityGuard` enforces non-contradiction: if branch declares TKID `TK-xxx`, commit must not reference a *different* ticket. Severity: `WARN` (advisory, not blocking).
- **Key architectural insight**: Git worktree IS the Dependency Injection mechanism. `DefendEngine(projectRoot)` receives CWD as the scope boundary. All git operations (`branch`, `staged files`, `config`) resolve relative to this root. When an AAOS worktree (`.worktrees/TK-xxx/`) is the CWD, identity and isolation come free from Git. When a standalone project is the CWD, the same code works without modification. **Zero lock-in by design.**
- **Lesson**: `.worktrees` path was initially hardcoded in `extractTicketRef` — removed. Branch name is the canonical TKID source; directory name is a generic fallback.
- **Review Ecosystem Enhancement**: End-user Gateway profiles should align with AAOS guidelines, integrating assertive architectural analysis and preserving the Git-ignored `.agents/records/reviews/` flow.

**Status Update (v0.5)**: Foundation (v0.1), Ecosystem (v0.2), Identity (v0.3), and Memory (v0.4) shipped. Intelligence (v0.5) **shipped**:

- `EvaluationScore` type already published in `src/core/types.ts` since v0.1.
- `hollowArtifact` guard enhanced with opt-in DSPy semantic evaluation (`useDspy: true`, `dspyEndpoint`, `dspyTimeoutMs`).
- New `eval` CLI subcommand for standalone artifact quality analysis with DSPy.
- **Shared DSPy Client** (`src/core/dspy-client.ts`): Extracted and generalized to serve as the universal DSPy integration point across ALL DiD layers. Supports `artifact`, `lesson`, `search`, and `recall` evaluation types.
- **Lesson Quality Gate** (v0.5.1): `recordLesson()` now optionally evaluates lesson quality via DSPy before persisting. Generic lessons (score < 0.5) are REJECTED. CLI: `--quality-gate` flag.
- **Semantic Lesson Search** (v0.5.2): `searchLessons()` supports DSPy-powered semantic ranking, replacing `String.includes()` for dramatically better recall. Falls back to string matching when DSPy unavailable. CLI: `--semantic` flag.
- **Guard F1 Metrics**: `GuardF1Metric` type + `computeF1()` utility for measuring guard precision, recall, and F1 score. Applies Information Retrieval scoring to the guard pipeline.
- **Key architectural insight**: DSPy is integrated as an enhancement OF the existing guard, not a separate evaluation subsystem. Zero-infrastructure default is preserved — DSPy is fully opt-in and degrades gracefully when the service is unreachable. Tagline: **"Works without AI. Excels WITH AI."**

Each phase builds on the previous. Agents MUST NOT implement future-phase features unless explicitly tasked.

**Status Update (v0.6)**: Foundation through Intelligence (v0.1–v0.5) shipped. Federation (v0.6) **shipped**:

- **Federation Guard** (`federationGuard`): Pure guard that cross-validates child project execution against parent ticket lifecycle phase. Configurable `blockedParentPhases`, severity modes (`block`/`warn`).
- **HttpTicketProvider**: Network-aware provider using `globalThis.fetch` with `AbortController` for timeout enforcement. Enables cross-project federation via REST endpoints.
- **Engine enrichment pipeline**: `enrichParentTicket()` resolves parent state as a second-stage enrichment BEFORE the guard pipeline runs, preserving guard purity.
- **Graceful degradation**: All provider failures (timeout, network error, 404) degrade to WARN findings, never crash the pipeline.
- **Key architectural insight**: Guard purity is enforced by architecture, not discipline. The engine's enrichment phase handles ALL I/O. Guards only read `ctx.ticket.*` fields. This eliminates an entire class of provider-crash-kills-pipeline bugs.
- **Bugs caught by TDD**: (1) `FileTicketProvider` leaked empty-string `parentId` through `!= null` check. (2) `HttpTicketProvider` silently dropped `parentId` from JSON responses. Both caught by edge/integration tests before release.
- **Test suite**: 99 tests total, 37 federation-specific (17 guard unit, 8 HTTP provider, 6 file provider, 6 engine integration).

**Multi-Agent Operations (v0.6.1)**: Established formal strategy for leveraging external AI tools alongside operational agents:

- **Agent taxonomy**: Operational Agents (Main Agent — human-commanded, core builders) vs External Agents (Jules, CodeRabbit — third-party tools leveraged for optimization).
- **Jules Integration**: External async builder for routine tasks (tests, bug fixes, docs). Constrained by `.agents/contracts/jules.md`. NOT a core dependency.
- **CodeRabbit Hardening**: External PR reviewer. `.coderabbit.yaml` expanded with path instructions for `tests/**`, `docs/**`, `.agents/**`.
- **Key clarification**: This multi-agent setup is DiD's **internal development strategy** for optimizing its own workflow. It is NOT a requirement imposed on DiD package users.
- **Architectural insight**: The distinction between "operational agent" (trusted, human-commanded) and "external agent" (constrained, config-bounded) is itself a defense-in-depth principle applied to AI governance.

**Status Update (v0.6.2)**: Test & Operational Hardening **shipped** (Preparing for v0.7):

- **Test Hardening Track**: Massive expansion of test coverage. Added adversarial scenarios and explicit mock audits for `DefendEngine`, `hollowArtifactGuard`, `phaseGateGuard`, `branchNamingGuard`, `commitFormatGuard`, and `ssotPollutionGuard` (PRs 7, 8, 9).
- **CLI Subprocess Tests**: Added ground-truth End-to-End CLI tests using `spawnSync` against the compiled binary (PR 10).
- **Coverage Gate**: Implemented strict CI coverage thresholds using native Node.js `--experimental-test-coverage` to enforce an immutable floor, ratcheting upwards with test additions (PR 12).
- **Documentation Semantics**: Explicit `fail-fast-policy.md` added to clearly document engine behavior (collect-all vs fail-fast) ensuring strict system contracts (PR 11).
- **Server-Side Enforcement**: Composite GitHub Action created to enforce governance rules server-side. Eliminates the gap of users bypassing local git hooks with `--no-verify`.
- **Key architectural insight**: System robustness isn't just code; it's proven through deterministic, adversarial CI gates. We established a strict ceiling for dependencies by enforcing everything in purely native Node APIs.

**Status Update (v0.7†) — Progressive Enhancement Architecture (Parallel Track)**:

- **Philosophy Evolution**: Pillar #1 reframed from "Zero-Infrastructure" (a capability ceiling) to **"Progressive Enhancement Architecture"** — three-tier model where Tier 0 remains zero-dep, Tier 1 is opt-in intelligence, and Tier 2 is lazy-loaded agent skills.
- **Project tagline**: *"Zero to excellent: works out of the box, compounds with context."* Replaces the previous *"Works without AI. Excels WITH AI."*
- **`.agents/skills/` scaffold shipped**: 7 specialist skills for governance middleware work: `skill-guard-governance` (DiD-specific), `skill-threat-modeling-expert`, `skill-test-architect`, `skill-review-code`, `skill-surgical-refactorer`, `skill-devops-github-actions`, `skill-ai-dspy-validator`.
- **Lazy-load documentation architecture**: `docs/index.md` as central navigation map; per-file "Read this when / Skip if / Related" headers on all dev-guide files.
- **Agent bootstrap updated**: GEMINI.md, CLAUDE.md, and AGENTS.md updated to route agents to skills first; memory primer updated with Tier model.
- **Key architectural insight**: Captain skills (AAOS-specific) are intentionally excluded — they couple to AAOS orchestration vocabulary that external agents (Devin, Jules, CodeRabbit) do not understand. Only portable, self-contained specialist skills are shipped.
- **Design decision**: This track carries no TypeScript changes. Zero test suite impact. All changes are in `.agents/`, `docs/`, and agent config files.

**Status Update (v0.7-rc.1) — Progressive Discovery & Path A memory loop (SHIPPED)**:

Released as [v0.7.0-rc.1](https://github.com/tamld/defense-in-depth/releases/tag/v0.7.0-rc.1) via PRs [#27](https://github.com/tamld/defense-in-depth/pull/27) (LessonOutcome MVP), [#28](https://github.com/tamld/defense-in-depth/pull/28) (Progressive Discovery hints + doctor/verify wiring) and [#31](https://github.com/tamld/defense-in-depth/pull/31) (release).

- **Persona Realignment**: Acknowledged that ~80% of users are Solo Devs (Persona A) needing zero-config guards, while advanced features (DSPy, Lessons) serve AI Teams (Persona B) and Enterprise (Persona C).
- **Progressive Discovery (shipped)**: `did doctor` and post-verify hints surface Persona B features without forcing Solo Dev users to opt in.
- **Path A memory loop (shipped, MVP)**: `did feedback` records `LessonOutcome` events; outcome scanner produces `RecallMetric` and `GuardF1Metric` from accumulated events. **MVP scope only**: aggregation, dedup, forgetting, the Injection contract (Án Lệ with `wrongApproach` + `correctApproach`), and the Quality Gate are deferred to **Track B (v1.1.x)** per [`docs/vision/meta-growth-roadmap.md`](docs/vision/meta-growth-roadmap.md).
- **Adoption track gate**: Track B is **hard-gated** behind Track A4 exit (≥10 external users + ≥100 captured events). Phases A1–A4 (issues #40–#42, plus the API pillar #33–#39 tracked under umbrella #42) MUST land before any Track B work begins.
- **Telemetry Sync / Enterprise (`FederationPayload`)**: deferred until after v1.0 GA + Track A4 exit; renumbering to follow v1.1.x cadence.

---

