# Agent Contract: TicketStateProvider Interface

> **For Agents:** This document outlines the constraints and expected behavior when dealing with Providers.

A `TicketStateProvider` runs **first** during the hook lifecycle to enrich the ticket context.

## Architectural Boundaries (Strict Constraints)

| Rule | Description | Enforcement |
|------|-------------|-------------|
| **[R1: Scope]** | Only `TicketStateProvider` classes may perform I/O (fetch, fs.read) | Linter / Review Gate |
| **[R2: Recovery]**| All implementations MUST wrap `async` calls in `try/catch` and return `undefined` on error | Runtime Failure if missed |
| **[R3: Timeout]** | Implementations MUST use `Promise.race` with max `1000ms` bound | UX degradation if missed |
| **[R4: Mutation]**| `resolve()` MUST NEVER mutate external state (No POST/PUT, No Write) | Pure function audit |

## Code Definition Reference

```typescript
export interface TicketStateProvider {
  name: string;
  resolve(ticketId: string): Promise<TicketRef | undefined>;
}
```

Implementations must reside inside `src/federation/` and be exported and registered inside `src/federation/index.ts`.
