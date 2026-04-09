import test from "node:test";
import assert from "node:assert";
import { SemanticQualityGuard } from "../dist/guards/semantic-quality.js";
import { Severity } from "../dist/core/types.js";

const createMockContext = (overrides = {}) => ({
  stagedFiles: [],
  projectRoot: "/fake/root",
  config: {
    version: "0.5.0",
    guards: {
      semanticQuality: {
        enabled: true,
        provider: "none",
      }
    }
  },
  ...overrides
});

test("SemanticQualityGuard", async (t) => {
  const guard = new SemanticQualityGuard();

  await t.test("bypasses when completely disabled", async () => {
    const ctx = createMockContext({
      config: {
        version: "0.5.0",
        guards: {
          semanticQuality: { enabled: false }
        }
      }
    });

    const result = await guard.check(ctx);
    assert.strictEqual(result.passed, true);
    assert.strictEqual(result.findings.length, 0);
  });

  await t.test("warns when no provider configured but guard enabled", async () => {
    const ctx = createMockContext();
    const result = await guard.check(ctx);
    
    assert.strictEqual(result.passed, true);
    assert.strictEqual(result.findings.length, 1);
    assert.strictEqual(result.findings[0].severity, Severity.WARN);
    assert.match(result.findings[0].message, /no valid provider is configured/);
  });

  // Additional mock tests for direct-api could be added here
  // We avoid actual HTTP requests in unit tests.
});
