import { spawn } from "node:child_process";
import { SemanticProvider, EvaluationScore } from "../../core/types.js";

interface CliProviderConfig {
  /** The base command to run, e.g., "ag", "python", "bash" */
  command?: string;
  /** Arguments to pass to the command. Supports interpolation like {{artifactPath}} */
  args?: string[];
  /** Environment variables to pass to the child process */
  env?: Record<string, string>;
  /** Optional debug mode to log stdout/stderr */
  debugMode?: boolean;
}

/**
 * CLI-First Semantic Provider
 * 
 * Instead of bringing heavy dependencies (fetch, Langchain, DSPy) into the Defense framework,
 * this provider delegates semantic evaluation to a user-configured CLI command using Unix standard streams.
 * 
 * Expected CLI output on stdout must be parseable JSON:
 * {
 *   "score": 0.0 - 1.0,
 *   "reasoning": "Explanation text",
 *   "evidenceTags": ["[HOLLOW]"]
 * }
 */
export class CliCommandSemanticProvider implements SemanticProvider {
  private command: string;
  private args: string[];
  private env: NodeJS.ProcessEnv;
  private debug: boolean;

  constructor(config: CliProviderConfig) {
    this.command = config.command || "ag"; // Default to root project CLI
    this.args = config.args || ["dspy", "evaluate-artifact", "--file", "{{artifactPath}}"];
    this.env = { ...process.env, ...(config.env || {}) };
    this.debug = config.debugMode || false;
  }

  async evaluateArtifact(content: string, criteria: string, artifactPath: string): Promise<EvaluationScore> {
    return new Promise((resolve, reject) => {
      // Interpolate arguments
      const processedArgs = this.args.map(arg => {
        return arg
          .replace("{{artifactPath}}", artifactPath)
          .replace("{{criteria}}", criteria);
      });

      if (this.debug) {
        console.log(`[CliSemanticProvider] Spawning: ${this.command} ${processedArgs.join(" ")}`);
      }

      const child = spawn(this.command, processedArgs, {
        env: this.env,
        stdio: ["pipe", "pipe", "pipe"]
      });

      let stdoutData = "";
      let stderrData = "";

      // Write content to stdin so the CLI doesn't have to read it if it prefers streams,
      // though the default args pass the file path.
      child.stdin.write(content);
      child.stdin.write("\n---\nCRITERIA:\n" + criteria + "\n");
      child.stdin.end();

      child.stdout.on("data", (data) => {
        stdoutData += data.toString();
      });

      child.stderr.on("data", (data) => {
        stderrData += data.toString();
        if (this.debug) {
          console.error(`[CliSemanticProvider] STDERR: ${data.toString()}`);
        }
      });

      child.on("close", (code) => {
        if (code !== 0) {
          return reject(new Error(`CLI semantic evaluator exited with code ${code}. Stderr: ${stderrData}`));
        }

        try {
          // Attempt to extract the JSON block from stdout (in case the CLI outputs logs before the JSON)
          const jsonMatch = stdoutData.match(/\{[\s\S]*\}/);
          if (!jsonMatch) {
            throw new Error("No JSON found in stdout.");
          }
          const parsed = JSON.parse(jsonMatch[0]);
          
          resolve({
            artifactPath,
            score: typeof parsed.score === 'number' ? parsed.score : 0,
            reasoning: parsed.reasoning || "No reasoning provided.",
            evidenceTags: Array.isArray(parsed.evidenceTags) ? parsed.evidenceTags : []
          });
        } catch (err: any) {
          reject(new Error(`Failed to parse CLI output from stdout. Output: ${stdoutData.substring(0, 500)}... Error: ${err.message}`));
        }
      });
      
      child.on("error", (error) => {
        reject(new Error(`Failed to spawn evaluator CLI: ${error.message}`));
      });
    });
  }
}
