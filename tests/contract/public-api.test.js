/**
 * Public API Contract Tests — defense-in-depth
 *
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  Breaking any of these tests = semver MAJOR bump.              │
 * │  See docs/SEMVER.md for the full stability policy.             │
 * └─────────────────────────────────────────────────────────────────┘
 *
 * These tests define what library consumers rely on. They import ONLY
 * from the compiled barrel (`dist/index.js`) — the same path that
 * external consumers hit via `import { ... } from "defense-in-depth"`.
 *
 * If a future change drops a re-export, renames a symbol, or changes
 * a constructor/method signature, these tests fail before the change
 * reaches a consumer's `node_modules`.
 *
 * Spec: Issue #35
 * Supersedes: tests/public-api.test.js (PR #56, Issue #33)
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";

// ─── Import everything from the compiled barrel (consumer perspective) ───
import * as publicApi from "../../dist/index.js";

import {
  // Engine + Config (values)
  DefendEngine,
  loadConfig,
  DEFAULT_CONFIG,
  // Enums (values)
  Severity,
  EvidenceLevel,
  // Built-in guards (values)
  hollowArtifactGuard,
  ssotPollutionGuard,
  rootPollutionGuard,
  commitFormatGuard,
  branchNamingGuard,
  phaseGateGuard,
  ticketIdentityGuard,
  hitlReviewGuard,
  federationGuard,
  allBuiltinGuards,
  // Federation (values)
  createProvider,
  FileTicketProvider,
  HttpTicketProvider,
} from "../../dist/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "../../");

// ════════════════════════════════════════════════════════════════════
// §1  Engine constructability & method contracts
// ════════════════════════════════════════════════════════════════════

describe("Contract §1 — DefendEngine", () => {
  it("is constructable with projectRoot string only", () => {
    // Constructor: DefendEngine(projectRoot: string, config?: DefendConfig)
    const engine = new DefendEngine(projectRoot);
    assert.ok(engine instanceof DefendEngine);
  });

  it("is constructable with projectRoot + explicit config", () => {
    const engine = new DefendEngine(projectRoot, DEFAULT_CONFIG);
    assert.ok(engine instanceof DefendEngine);
  });

  it("use() returns 'this' for chaining", () => {
    const engine = new DefendEngine(projectRoot);
    const result = engine.use(allBuiltinGuards[0]);
    assert.strictEqual(result, engine, "engine.use() must return the engine instance");
  });

  it("useAll() returns 'this' for chaining", () => {
    const engine = new DefendEngine(projectRoot);
    const result = engine.useAll(allBuiltinGuards);
    assert.strictEqual(result, engine, "engine.useAll() must return the engine instance");
  });

  it("run() returns EngineVerdict with required shape", async () => {
    // Signature: run(stagedFiles: string[], options?: { commitMessage?, branch? })
    const engine = new DefendEngine(projectRoot);
    // Run with no guards registered → should pass trivially
    const verdict = await engine.run(["README.md"]);

    // Shape assertions — these fields are the public contract
    assert.equal(typeof verdict.passed, "boolean");
    assert.equal(typeof verdict.totalGuards, "number");
    assert.equal(typeof verdict.passedGuards, "number");
    assert.equal(typeof verdict.failedGuards, "number");
    assert.equal(typeof verdict.warnedGuards, "number");
    assert.ok(Array.isArray(verdict.results));
    assert.equal(typeof verdict.durationMs, "number");
  });

  it("run() with options passes without error", async () => {
    const engine = new DefendEngine(projectRoot);
    const verdict = await engine.run(["README.md"], {
      commitMessage: "test: contract check",
      branch: "main",
    });
    assert.equal(typeof verdict.passed, "boolean");
  });
});

// ════════════════════════════════════════════════════════════════════
// §2  Config loading
// ════════════════════════════════════════════════════════════════════

describe("Contract §2 — Config", () => {
  it("loadConfig returns DefendConfig with guards block", () => {
    const config = loadConfig(projectRoot);
    assert.equal(typeof config, "object");
    assert.ok(config.guards, "config must contain a `guards` block");
  });

  it("DEFAULT_CONFIG has version '1.0'", () => {
    assert.strictEqual(DEFAULT_CONFIG.version, "1.0");
    assert.ok(DEFAULT_CONFIG.guards);
  });

  it("loadConfig with nonexistent dir returns DEFAULT_CONFIG shape", () => {
    const config = loadConfig("/tmp/nonexistent-did-test-dir-xyz");
    assert.strictEqual(config.version, "1.0");
    assert.ok(config.guards);
  });
});

// ════════════════════════════════════════════════════════════════════
// §3  Enums — stable string values
// ════════════════════════════════════════════════════════════════════

describe("Contract §3 — Enums", () => {
  it("Severity.PASS === 'pass', WARN === 'warn', BLOCK === 'block'", () => {
    assert.strictEqual(Severity.PASS, "pass");
    assert.strictEqual(Severity.WARN, "warn");
    assert.strictEqual(Severity.BLOCK, "block");
  });

  it("EvidenceLevel has CODE, RUNTIME, INFER, HYPO", () => {
    assert.strictEqual(EvidenceLevel.CODE, "CODE");
    assert.strictEqual(EvidenceLevel.RUNTIME, "RUNTIME");
    assert.strictEqual(EvidenceLevel.INFER, "INFER");
    assert.strictEqual(EvidenceLevel.HYPO, "HYPO");
  });
});

// ════════════════════════════════════════════════════════════════════
// §4  Built-in guards
// ════════════════════════════════════════════════════════════════════

describe("Contract §4 — Built-in Guards", () => {
  const guardCases = [
    ["hollowArtifactGuard", hollowArtifactGuard, "hollowArtifact"],
    ["ssotPollutionGuard", ssotPollutionGuard, "ssotPollution"],
    ["rootPollutionGuard", rootPollutionGuard, "rootPollution"],
    ["commitFormatGuard", commitFormatGuard, "commitFormat"],
    ["branchNamingGuard", branchNamingGuard, "branchNaming"],
    ["phaseGateGuard", phaseGateGuard, "phaseGate"],
    ["ticketIdentityGuard", ticketIdentityGuard, "ticketIdentity"],
    ["hitlReviewGuard", hitlReviewGuard, "hitlReview"],
    ["federationGuard", federationGuard, "federation"],
  ];

  for (const [exportName, guard, expectedId] of guardCases) {
    it(`${exportName} satisfies the Guard interface (id, name, description, check)`, () => {
      assert.equal(typeof guard, "object");
      assert.equal(typeof guard.id, "string");
      assert.equal(typeof guard.name, "string");
      assert.equal(typeof guard.description, "string");
      assert.equal(typeof guard.check, "function");
      assert.equal(guard.id, expectedId, `${exportName}.id must be "${expectedId}"`);
    });
  }

  it("allBuiltinGuards contains 9 guards", () => {
    assert.ok(Array.isArray(allBuiltinGuards));
    assert.equal(allBuiltinGuards.length, 9);
  });

  it("every built-in guard has a unique id", () => {
    const ids = allBuiltinGuards.map((g) => g.id);
    const uniqueIds = new Set(ids);
    assert.equal(uniqueIds.size, ids.length, "Guard IDs must be unique");
  });

  it("allBuiltinGuards contains every individually-exported guard", () => {
    for (const [, guard] of guardCases) {
      assert.ok(
        allBuiltinGuards.includes(guard),
        `allBuiltinGuards must include ${guard.id}`,
      );
    }
  });
});

// ════════════════════════════════════════════════════════════════════
// §5  Federation entry points
// ════════════════════════════════════════════════════════════════════

describe("Contract §5 — Federation", () => {
  it("createProvider is a function", () => {
    assert.equal(typeof createProvider, "function");
  });

  it("FileTicketProvider is constructable", () => {
    assert.equal(typeof FileTicketProvider, "function");
    assert.equal(FileTicketProvider.name, "FileTicketProvider");
  });

  it("HttpTicketProvider is constructable", () => {
    assert.equal(typeof HttpTicketProvider, "function");
    assert.equal(HttpTicketProvider.name, "HttpTicketProvider");
  });
});

// ════════════════════════════════════════════════════════════════════
// §6  Module hygiene — no leaked internals
// ════════════════════════════════════════════════════════════════════

describe("Contract §6 — Module Shape", () => {
  it("does not leak unexpected runtime exports", () => {
    // Allow-list: every value-level export the public API ships.
    // Type-only exports are erased at runtime, so they never appear here.
    const expected = new Set([
      "DefendEngine",
      "loadConfig",
      "DEFAULT_CONFIG",
      "Severity",
      "EvidenceLevel",
      "hollowArtifactGuard",
      "ssotPollutionGuard",
      "rootPollutionGuard",
      "commitFormatGuard",
      "branchNamingGuard",
      "phaseGateGuard",
      "ticketIdentityGuard",
      "hitlReviewGuard",
      "federationGuard",
      "allBuiltinGuards",
      "createProvider",
      "FileTicketProvider",
      "HttpTicketProvider",
    ]);

    const actual = new Set(Object.keys(publicApi));

    const unexpected = [...actual].filter((k) => !expected.has(k));
    const missing = [...expected].filter((k) => !actual.has(k));

    assert.deepEqual(unexpected, [], `unexpected runtime exports leaked: ${unexpected.join(", ")}`);
    assert.deepEqual(missing, [], `expected runtime exports missing: ${missing.join(", ")}`);
  });
});
