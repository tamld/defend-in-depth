# Configuration Guide

> This guide relies on `defense.config.yml` which is generated in your project root after running `npx defense-in-depth init`.

## Built-in Guards

| Guard | Default | Severity | What It Catches |
|:---|:---:|:---:|:---|
| **Hollow Artifact** | ✅ ON | BLOCK | Files with only `TODO`, `TBD`, empty templates |
| **Hollow Artifact** (DSPy) | ❌ OFF | WARN | Semantic quality below threshold (opt-in) |
| **SSoT Pollution** | ✅ ON | BLOCK | Config/state files modified in feature branches |
| **Root Pollution** | ✅ ON | BLOCK | Unapproved files or folders created in the project root |
| **HITL Review** | ✅ ON | BLOCK | Direct commits/pushes to protected branches (main) |
| **Commit Format** | ✅ ON | WARN | Non-conventional commit messages |
| **Branch Naming** | ❌ OFF | WARN | Branch names not matching pattern |
| **Phase Gate** | ❌ OFF | BLOCK | Code committed without a plan file |
| **Ticket Identity** | ❌ OFF | WARN | Commit references a conflicting ticket |

### Severity Levels

| Level | Emoji | Effect |
|:---|:---:|:---|
| **PASS** | 🟢 | No issues found |
| **WARN** | ⚠️ | Issues flagged, commit allowed |
| **BLOCK** | 🔴 | Commit rejected, must fix first |

---

## Configuration Schema

The `defense.config.yml` file configures the behavior of the built-in guards.

```yaml
version: "1.0"

guards:
  # Prevents hollow template files
  hollowArtifact:
    enabled: true
    extensions: [".md", ".json", ".yml", ".yaml"]
    minContentLength: 50
    # v0.5 DSPy Semantic Evaluation (opt-in)
    useDspy: false
    dspyEndpoint: "http://localhost:8080/evaluate"
    dspyTimeoutMs: 5000

  # Protects Single Source of Truth files from casual edits
  ssotPollution:
    enabled: true
    protectedPaths:
      - ".agents/"
      - "records/"

  # Prevents unauthorized files in the root ecosystem directory
  rootPollution:
    enabled: true
    allowedRootFiles: ["README.md", "defense.config.yml", "package.json"]

  # Blocks direct commits to protected branches like main natively
  hitlReview:
    enabled: true
    protectedBranches: ["main", "master"]

  # Enforces Conventional Commits syntax
  commitFormat:
    enabled: true
    pattern: "^(feat|fix|chore|docs|refactor|test|style|perf|ci)(\\(.+\\))?:\\s.+"

  # Enforces Branch naming rules
  branchNaming:
    enabled: false
    pattern: "^(feat|fix|chore|docs)/[a-z0-9-]+$"

  # Enforces TDD / Execution Plan gates
  phaseGate:
    enabled: false
    planFiles: ["implementation_plan.md", "design_spec.md"]

  # Enforces Ticket Identity (TKID) non-contradiction
  ticketIdentity:
    enabled: false
    tkidPattern: "TK-[0-9A-Z-]+"
    severity: "warn"
    provider: "file"           # Pluggable state resolution
    providerConfig:
      ticketFile: "TICKET.md"
```

## DSPy Semantic Evaluation (v0.5)

The `hollowArtifact` guard can optionally use [DSPy](https://dspy.ai)'s LLM-as-Judge to evaluate artifact quality beyond simple pattern matching. DSPy is an open-source framework by [Stanford NLP](https://github.com/stanfordnlp/dspy) (MIT License).

### How It Works

1. **Deterministic checks run first** (patterns, content length) — these are always free and instant.
2. **If `useDspy: true`**, files that pass deterministic checks are sent to a DSPy HTTP endpoint for semantic scoring.
3. **Scores below 0.5** produce a `WARN` (never `BLOCK`) — zero-infrastructure default is preserved.
4. **If the DSPy service is down**, the guard degrades gracefully with a warning log and continues.

### Configuration Fields

| Field | Type | Default | Description |
|:---|:---|:---|:---|
| `useDspy` | boolean | `false` | Enable DSPy semantic evaluation |
| `dspyEndpoint` | string | `http://localhost:8080/evaluate` | URL of DSPy evaluator service |
| `dspyTimeoutMs` | number | `5000` | Request timeout in milliseconds |

### Setting Up the DSPy Service

A reference implementation is provided in [`examples/dspy-evaluator/`](../../examples/dspy-evaluator/).

**Quick start with Ollama (free, local):**
```bash
ollama pull llama3.2:3b
cd examples/dspy-evaluator
pip install -r requirements.txt
python evaluator.py
```

**With Google Gemini (free tier):**
```bash
DSPY_PROVIDER=gemini DSPY_API_KEY=your_key python evaluator.py
```

### Supported Providers

| Provider | Cost | Best For |
|:---|:---|:---|
| Ollama (local) | Free | Development, CI |
| Google Gemini | Free tier / pay-per-token | Best free cloud option |
| OpenAI | Pay-per-token | Production |
| Anthropic | Pay-per-token | Premium quality |

See the [evaluator README](../../examples/dspy-evaluator/README.md) for full provider configuration.
