import * as fs from "node:fs";
import * as path from "node:path";
import { Guard, GuardContext, GuardResult, Finding, Severity, EvidenceLevel, SemanticProvider } from "../core/types.js";

/**
 * BaseSemanticGuard wrapper that enforces timeouts and graceful degradation
 * for external DSPy/LLM semantic providers.
 */
export class SemanticQualityGuard implements Guard {
  readonly id = "semantic-quality";
  readonly name = "Semantic Quality Evaluator";
  readonly description = "Uses a semantic provider to evaluate artifact quality and rationale.";

  private provider: SemanticProvider | null = null;

  private async getProvider(config: any): Promise<SemanticProvider | null> {
    if (this.provider) return this.provider;

    const providerType = config?.provider || "none";
    if (providerType === "none") return null;

    if (providerType === "cli-command") {
      const { CliCommandSemanticProvider } = await import("../providers/semantic/cli-command.js");
      this.provider = new CliCommandSemanticProvider(config?.providerConfig || {});
      return this.provider;
    }

    return null;
  }

  async check(ctx: GuardContext): Promise<GuardResult> {
    const config = ctx.config.guards.semanticQuality;
    if (!config || !config.enabled) {
      return { guardId: this.id, passed: true, findings: [], durationMs: 0 };
    }

    const startTime = Date.now();
    const findings: Finding[] = [];

    const provider = await this.getProvider(config);
    if (!provider) {
      return {
        guardId: this.id,
        passed: true,
        findings: [{
          guardId: this.id,
          severity: Severity.WARN,
          message: `Semantic verification is enabled but no valid provider is configured.`,
          evidence: EvidenceLevel.INFER
        }],
        durationMs: Date.now() - startTime
      };
    }

    const mdFiles = ctx.stagedFiles.filter(f => f.endsWith(".md"));
    if (mdFiles.length === 0) {
      return { guardId: this.id, passed: true, findings, durationMs: Date.now() - startTime };
    }

    const minScore = config.minScoreThreshold || 0.7;
    const timeoutMs = config.timeoutMs || 15000;

    // We prepare context
    let criteria = `Evaluate if this artifact is high quality, non-hollow, and contains substantive rationale.`;
    if (ctx.ticket?.id) {
      criteria += ` Ensure it satisfies the context for ticket ${ctx.ticket.id}.`;
    }

    for (const file of mdFiles) {
      const fullPath = path.join(ctx.projectRoot, file);
      if (!fs.existsSync(fullPath)) continue;

      const content = fs.readFileSync(fullPath, "utf-8");
      
      try {
        // Enforce the timeout wrap
        const evaluatePromise = provider.evaluateArtifact(content, criteria, file);
        const timeoutPromise = new Promise((resolve, reject) => {
          setTimeout(() => reject(new Error("Semantic evaluation timed out")), timeoutMs);
        });

        const scoreObj = await Promise.race([evaluatePromise, timeoutPromise]) as any;
        
        if (scoreObj.score < minScore) {
          findings.push({
            guardId: this.id,
            severity: Severity.WARN, // Soft fail by default for semantic
            message: `Semantic evaluation failed for ${file} (Score: ${scoreObj.score}). Reason: ${scoreObj.reasoning}`,
            filePath: file,
            evidence: EvidenceLevel.RUNTIME
          });
        }
      } catch (error: any) {
        findings.push({
          guardId: this.id,
          severity: Severity.WARN,
          message: `Semantic provider failed gracefully: ${error.message || error}`,
          filePath: file,
          evidence: EvidenceLevel.INFER
        });
      }
    }

    return {
      guardId: this.id,
      passed: true, // Always pass, semantic is currently non-blocking in phase 1 
      findings,
      durationMs: Date.now() - startTime
    };
  }
}
