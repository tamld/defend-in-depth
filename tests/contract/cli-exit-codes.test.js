/**
 * CLI Exit Code Contract Tests — defense-in-depth
 *
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  Breaking any of these tests = semver MAJOR bump.              │
 * │  See docs/SEMVER.md for the full stability policy.             │
 * └─────────────────────────────────────────────────────────────────┘
 *
 * Exit code contract:
 *   0 — Success / All guards pass
 *   1 — At least one guard BLOCKs (verify), or system precondition fails (init)
 *
 * These tests spawn the compiled CLI binary as a subprocess — the same
 * way end-users and CI pipelines invoke it. They verify exit codes only,
 * not output formatting (which is a UX concern, not a contract).
 *
 * Spec: Issue #35
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { execSync, spawnSync } from "node:child_process";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cliPath = path.resolve(__dirname, "../../dist/cli/index.js");
const projectRoot = path.resolve(__dirname, "../../");

/**
 * Spawn the CLI in a subprocess, capturing stdout/stderr/exit code.
 * NO_COLOR=1 strips ANSI for predictable assertions.
 */
function runCli(args, cwd = projectRoot) {
  return spawnSync("node", [cliPath, ...args], {
    cwd,
    encoding: "utf8",
    timeout: 15000,
    env: { ...process.env, NO_COLOR: "1", NO_HINTS: "1" },
  });
}

// ════════════════════════════════════════════════════════════════════
// §7  CLI init exit codes
// ════════════════════════════════════════════════════════════════════

describe("Contract §7 — CLI init", () => {
  it("exits 0 in a valid git repo", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "did-contract-init-"));
    try {
      // init requires a .git directory
      execSync("git init", { cwd: tmpDir, encoding: "utf8" });
      const result = runCli(["init"], tmpDir);
      assert.strictEqual(result.status, 0, `init must exit 0; stderr: ${result.stderr}`);
      assert.ok(
        fs.existsSync(path.join(tmpDir, "defense.config.yml")),
        "init must create defense.config.yml",
      );
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("exits 1 when not in a git repo", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "did-contract-init-nogit-"));
    try {
      const result = runCli(["init"], tmpDir);
      assert.strictEqual(result.status, 1, "init must exit 1 outside a git repo");
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});

// ════════════════════════════════════════════════════════════════════
// §8  CLI doctor exit codes
// ════════════════════════════════════════════════════════════════════

describe("Contract §8 — CLI doctor", () => {
  it("exits 0 on healthy repo", () => {
    const result = runCli(["doctor"]);
    assert.strictEqual(result.status, 0, `doctor must exit 0; stderr: ${result.stderr}`);
  });
});

// ════════════════════════════════════════════════════════════════════
// §9  CLI verify exit codes
// ════════════════════════════════════════════════════════════════════

describe("Contract §9 — CLI verify", () => {
  it("exits 0 when all guards pass", () => {
    // Use an isolated tmpDir with a controlled config to avoid the project's
    // own hollowArtifact ("TODO" in README.md) and hitlReview (main branch)
    // guards from interfering.
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "did-contract-pass-"));
    try {
      execSync("git init", { cwd: tmpDir, encoding: "utf8" });
      execSync("git checkout -b feat/test-branch", { cwd: tmpDir, encoding: "utf8" });

      // Minimal config: only rootPollution with README.md allowed
      fs.writeFileSync(
        path.join(tmpDir, "defense.config.yml"),
        [
          'version: "1.0"',
          "guards:",
          "  hollowArtifact:",
          "    enabled: false",
          "  ssotPollution:",
          "    enabled: false",
          "  rootPollution:",
          "    enabled: true",
          "    allowedRootFiles:",
          '      - "README.md"',
          "    allowedRootPatterns: []",
          "  commitFormat:",
          "    enabled: false",
          "  hitlReview:",
          "    enabled: false",
        ].join("\n"),
        "utf-8",
      );

      // A file that's on the allowlist and won't trigger any guard
      fs.writeFileSync(path.join(tmpDir, "README.md"), "# Clean project\n\nNo placeholders here.");

      const result = runCli(["verify", "--files", "README.md"], tmpDir);
      assert.strictEqual(result.status, 0, `verify must exit 0 on pass; stdout: ${result.stdout}`);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("exits 1 when a guard blocks", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "did-contract-block-"));
    try {
      // Set up a minimal git repo with rootPollution enabled
      execSync("git init", { cwd: tmpDir, encoding: "utf8" });

      // Config that enables rootPollution with a tight allowlist
      fs.writeFileSync(
        path.join(tmpDir, "defense.config.yml"),
        [
          'version: "1.0"',
          "guards:",
          "  hollowArtifact:",
          "    enabled: false",
          "  ssotPollution:",
          "    enabled: false",
          "  rootPollution:",
          "    enabled: true",
          "    allowedRootFiles:",
          '      - "README.md"',
          "    allowedRootPatterns: []",
          "  commitFormat:",
          "    enabled: false",
        ].join("\n"),
        "utf-8",
      );

      // Create a file NOT on the allowlist — should trigger rootPollution BLOCK
      fs.writeFileSync(path.join(tmpDir, "rogue-file.txt"), "this triggers block");

      const result = runCli(["verify", "--files", "rogue-file.txt"], tmpDir);
      assert.strictEqual(result.status, 1, `verify must exit 1 on BLOCK; stdout: ${result.stdout}`);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});
