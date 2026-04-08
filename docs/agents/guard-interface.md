# Agent Contract: Guard Interface

> **For Agents:** This document outlines the constraints and expected behavior when developing new Guards.

A `Guard` in `defense-in-depth` evaluates context passed by the hook engine and returns zero or more `Finding` objects. Findings dictate if the commit/push is allowed across our Pass, Warn, Block taxonomy.

## Macro Concept

Where [Providers](./provider-interface.md) are "dirty" and "slow", Guards are **"pure"** and **"fast"**. Guards never make asynchronous calls, nor do they look up external APIs.

## Architectural Boundaries (Strict Constraints)

| Rule | Description | Enforcement |
|------|-------------|-------------|
| **[R1: Synchronous]** | Guards MUST return `Finding[]` synchronously. No promises. | TypeScript Compiler |
| **[R2: Purity]** | Guards MUST NOT perform I/O (no `fs`, no `fetch`, no shell) | Pre-commit git hooks |
| **[R3: Context Only]** | External data (e.g., ticket state) MUST be supplied via `HookContext` via a Provider | Code review |
| **[R4: Immutability]** | Guards MUST NEVER mutate `HookContext` | ES6 `Readonly<T>` types |

## Code Definition Reference

```typescript
export interface Guard {
  id: string;
  name: string;
  isEnabled: boolean;
  evaluate(context: HookContext): Finding[];
}
```

Findings must resolve to standard severities `PASS`, `WARN`, or `BLOCK`.
Guard implementations reside in `src/guards/`.
