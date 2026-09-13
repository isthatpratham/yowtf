# YOWTF — CLI Specification

**Document:** `docs/CLI-SPEC.md`  
**Product:** YOWTF — Your Operating Workstation Trouble Finder  
**CLI:** `yowtf`  
**Status:** Source of Truth  
**Version:** 1.0  
**Audience:** YOWTF maintainers, contributors, reviewers, and AI coding agents

---

## 1. Purpose

This document is the authoritative specification for the YOWTF command-line interface.

It defines:

- executable behavior
- command hierarchy
- commands
- arguments
- options
- global flags
- defaults
- output modes
- command behavior
- exit codes
- errors
- help behavior
- version behavior
- path handling
- JSON behavior
- quiet/verbose behavior
- CLI consistency rules

This document is authoritative for CLI behavior.

If implementation differs from this document, implementation is incorrect unless this document is explicitly updated first.

---

# 2. CLI Identity

**Product:** YOWTF

**Full name:** Your Operating Workstation Trouble Finder

**Executable:**

```text
yowtf
```

**Tagline:**

```text
Yo, WTF is happening?
```

---

# 3. CLI Philosophy

YOWTF's CLI must be:

- predictable
- fast
- readable
- scriptable
- deterministic
- local-first
- read-only
- explicit
- safe

The CLI should provide useful information without requiring the user to understand YOWTF's internal architecture.

---

# 4. Invocation Model

The general invocation form is:

```text
yowtf [command] [options]
```

A command may have:

- positional arguments
- command-specific options
- global options

Global options may be available to all commands unless explicitly restricted.

---

# 5. Default Invocation

Running:

```bash
yowtf
```

performs the default workstation/project health scan.

The default scan is the primary YOWTF experience.

Conceptually:

```text
yowtf
  ↓
Discover
  ↓
Collect
  ↓
Detect
  ↓
Evaluate
  ↓
Score
  ↓
Explain
  ↓
Report
```

The default invocation must not modify the machine or project.

---

# 6. Command Categories

YOWTF commands are grouped conceptually into:

### Core diagnostics

```text
yowtf
yowtf doctor
yowtf score
yowtf explain
```

### Workstation diagnostics

```text
yowtf system
yowtf disk
yowtf processes
yowtf ports
yowtf network
```

### Development environment diagnostics

```text
yowtf env
yowtf runtimes
yowtf tools
yowtf paths
yowtf versions
```

### Project diagnostics

```text
yowtf project
yowtf deps
yowtf git
yowtf config
```

### Storage/maintenance diagnostics

```text
yowtf caches
yowtf clean
```

The exact behavior of each command is defined below.

---

# 7. Global Options

The following global options are part of the V1 CLI contract.

| Option | Meaning |
|---|---|
| `-h, --help` | Show help |
| `-V, --version` | Show version |
| `--verbose` | Enable additional diagnostic output |
| `--no-color` | Disable terminal colors |
| `--json` | Emit machine-readable JSON |
| `--quiet` | Reduce human-readable output |
| `--path <dir>` | Analyze the specified directory |

The CLI must preserve these meanings consistently.

---

# 8. `--help`

Usage:

```bash
yowtf --help
```

or:

```bash
yowtf -h
```

The CLI must display:

- product name
- available commands
- available global options
- concise descriptions
- usage syntax

Help output must not execute the diagnostic scan.

---

# 9. Command Help

Every public command must support:

```bash
yowtf <command> --help
```

The command help must explain:

- command purpose
- usage
- positional arguments
- command-specific options
- relevant global options

Example:

```bash
yowtf runtimes --help
```

must not run runtime diagnostics.

---

# 10. `--version`

Usage:

```bash
yowtf --version
```

or:

```bash
yowtf -V
```

The command prints the installed YOWTF version.

Version output must not execute a health scan.

The reported version must correspond to the installed package version.

---

# 11. `--no-color`

Usage:

```bash
yowtf --no-color
```

Effect:

- disables ANSI color styling
- does not change findings
- does not change score
- does not change diagnostic logic

This option affects presentation only.

---

# 12. `--json`

Usage:

```bash
yowtf --json
```

Effect:

- emits machine-readable JSON
- suppresses human-only terminal decorations
- does not change diagnostics
- does not change scoring
- does not change rule behavior

JSON mode must not include:

- spinner characters
- ANSI escape sequences
- decorative boxes
- terminal tables
- human-readable log prefixes

---

# 13. `--quiet`

Usage:

```bash
yowtf --quiet
```

Effect:

- minimizes normal human-facing output
- retains essential result information according to command behavior
- does not disable diagnostics
- does not change score
- does not alter findings

`--quiet` is a presentation option.

---

# 14. `--verbose`

Usage:

```bash
yowtf --verbose
```

Effect:

- exposes additional diagnostic context
- may expose collection/detection execution details
- does not alter diagnostic conclusions

Verbose mode must not expose secret values.

---

# 15. `--path`

Usage:

```bash
yowtf --path <dir>
```

Example:

```bash
yowtf --path ./my-project
```

The specified directory becomes the project analysis target.

The path must be resolved safely.

The CLI must report an actionable error if the path:

- does not exist
- is not accessible
- is not a directory

The CLI must not modify the supplied directory.

---

# 16. Path Resolution

Relative paths are resolved from the current working directory.

Example:

```bash
yowtf --path ./project
```

means:

```text
<current-working-directory>/project
```

Absolute paths may be supplied.

The CLI should normalize paths before passing them to the application layer.

---

# 17. Unknown Commands

An unknown command must:

1. report that the command is unknown
2. provide useful CLI guidance
3. return a non-zero exit status

It must not silently run the default scan.

Example:

```bash
yowtf something
```

must not behave as:

```bash
yowtf
```

---

# 18. Unknown Options

Unknown options must be rejected.

The CLI must not silently ignore an unrecognized option.

Example:

```bash
yowtf --this-does-not-exist
```

must produce a CLI error and non-zero exit status.

---

# 19. Missing Option Values

Options requiring values must reject missing values.

Example:

```bash
yowtf --path
```

must result in a clear CLI error.

The CLI must not interpret the next unrelated token as an implicit path without following the defined argument grammar.

---

# 20. Core Command: `yowtf`

Usage:

```bash
yowtf
```

Purpose:

Run the standard YOWTF health scan.

The default scan may include applicable workstation and project diagnostics.

The scan must respect:

- global options
- current project scope
- supported platform
- rule applicability

---

# 21. `yowtf doctor`

Usage:

```bash
yowtf doctor
```

Purpose:

Run a diagnostic-oriented health scan intended to identify problems requiring attention.

The command should emphasize:

- failures
- warnings
- affected areas
- evidence
- recommended next inspection

It remains read-only.

---

# 22. `yowtf score`

Usage:

```bash
yowtf score
```

Purpose:

Present the YOWTF health score.

The score is calculated from the same diagnostic model used by the standard scan.

This command must not implement a separate scoring algorithm.

The exact scoring formula is defined in `SCORING.md`.

---

# 23. `yowtf explain`

Usage:

```bash
yowtf explain
```

Purpose:

Explain detected problems in greater detail.

The command should focus on:

- finding
- reason
- evidence
- impact
- remediation guidance where defined

Explanation must be derived from diagnostic results.

It must not invent new findings.

---

# 24. `yowtf system`

Usage:

```bash
yowtf system
```

Purpose:

Inspect workstation-level system information.

Potential diagnostic areas include:

- operating system
- architecture
- CPU
- memory
- uptime
- other explicitly supported system facts

This command is diagnostic, not a full system monitoring application.

---

# 25. `yowtf disk`

Usage:

```bash
yowtf disk
```

Purpose:

Inspect storage health and disk-related developer-environment conditions.

The command may identify:

- disk capacity
- available space
- relevant storage conditions
- developer-related storage pressure

It must not delete anything.

---

# 26. `yowtf processes`

Usage:

```bash
yowtf processes
```

Purpose:

Inspect running processes relevant to developer workstation diagnostics.

The command may identify:

- processes
- resource information where available
- developer processes
- potentially conflicting processes

The command must not terminate processes.

---

# 27. `yowtf ports`

Usage:

```bash
yowtf ports
```

Purpose:

Inspect network ports relevant to local development.

The command may identify:

- listening ports
- processes associated with ports where available
- potentially relevant development-port conflicts

It must not alter firewall rules or terminate processes.

---

# 28. `yowtf network`

Usage:

```bash
yowtf network
```

Purpose:

Inspect local network-related diagnostic conditions.

V1 network diagnostics must remain local-first.

No mandatory external connectivity check may be introduced unless explicitly specified elsewhere.

The command must not silently transmit diagnostic information.

---

# 29. `yowtf env`

Usage:

```bash
yowtf env
```

Purpose:

Inspect environment configuration relevant to development.

The command must prioritize metadata and variable names.

It must not dump secret values.

Sensitive information must not be displayed merely because it exists in the environment.

---

# 30. `yowtf runtimes`

Usage:

```bash
yowtf runtimes
```

Purpose:

Inspect installed development runtimes.

Supported runtime targets are defined by the applicable product/rule specifications.

Potential runtime targets include:

```text
Node.js
Python
Java
Go
Rust
PHP
```

The presence or absence of a runtime is not automatically a failure.

Applicability must be determined by diagnostic rules.

---

# 31. `yowtf tools`

Usage:

```bash
yowtf tools
```

Purpose:

Inspect installed developer tools.

Potential tool targets include:

```text
Git
npm
pnpm
yarn
pip
Docker
```

The exact supported tool inventory is defined by `COMMANDS.md` and `RULE-CATALOGUE.md` together with implementation-approved updates.

---

# 32. `yowtf paths`

Usage:

```bash
yowtf paths
```

Purpose:

Inspect executable/path resolution relevant to development.

The command may identify:

- missing expected executables
- duplicate executable locations
- PATH-related inconsistencies
- resolution mismatches

It must not automatically modify PATH.

---

# 33. `yowtf versions`

Usage:

```bash
yowtf versions
```

Purpose:

Inspect version consistency among developer tools and runtimes.

The command may identify:

- multiple versions
- conflicting executable resolution
- mismatched runtime/tool versions
- project/environment version discrepancies

It must report evidence rather than silently changing versions.

---

# 34. `yowtf project`

Usage:

```bash
yowtf project
```

Purpose:

Inspect the current project environment.

Project diagnostics may include:

- project type
- manifests
- lockfiles
- project runtime expectations
- project configuration
- dependency metadata
- Git context

The command must remain read-only.

---

# 35. `yowtf deps`

Usage:

```bash
yowtf deps
```

Purpose:

Inspect project dependency health.

Potential diagnostic areas include:

- dependency manifest state
- lockfile presence
- package-manager consistency
- dependency metadata
- reproducibility-related conditions

YOWTF must not install, update, or remove dependencies.

---

# 36. `yowtf git`

Usage:

```bash
yowtf git
```

Purpose:

Inspect Git repository health relevant to developer workflow.

Potential areas include:

- repository state
- branch information
- working tree state
- repository metadata
- reproducibility-relevant Git conditions

The command must not modify Git state.

---

# 37. `yowtf config`

Usage:

```bash
yowtf config
```

Purpose:

Inspect project/developer configuration relevant to diagnostics.

The command must distinguish:

- valid configuration
- suspicious configuration
- unavailable configuration
- configuration that requires user inspection

It must not silently rewrite configuration.

---

# 38. `yowtf caches`

Usage:

```bash
yowtf caches
```

Purpose:

Identify developer-tool caches and storage conditions.

The command is diagnostic.

It may identify cleanup candidates but must not delete them.

---

# 39. `yowtf clean`

Usage:

```bash
yowtf clean
```

Purpose:

Identify potential cleanup candidates.

Despite the command name, V1 remains read-only.

Therefore:

```bash
yowtf clean
```

does not delete files.

It reports candidates that the user may inspect manually.

---

# 40. `yowtf clean --preview`

Usage:

```bash
yowtf clean --preview
```

Purpose:

Explicitly preview cleanup candidates.

This option does not perform mutation.

The output should communicate:

- category
- location where safe to display
- estimated relevance/size where available
- reason it is considered a candidate

---

# 41. Clean Categories

Where category filtering is implemented, supported categories must be explicitly documented.

Conceptual categories include:

```text
cache
builds
dependencies
```

No category may be added silently.

---

# 42. Command Consistency

All diagnostic commands must follow the same high-level model:

```text
CLI
 ↓
Application use case
 ↓
Collectors
 ↓
Rules
 ↓
Evaluation
 ↓
Scoring/result
 ↓
Reporter
```

A command must not create a second diagnostic architecture.

---

# 43. Command Scope

A command should perform only the diagnostics represented by its documented purpose.

For example:

```text
yowtf runtimes
```

must not unexpectedly perform a full repository scan simply because a full scan is convenient internally.

Shared infrastructure may be reused, but user-visible scope must remain command-specific.

---

# 44. Shared Global Options

Global presentation options should behave consistently across commands:

```text
--help
--version
--verbose
--no-color
--json
--quiet
--path
```

A command may reject an option only if its semantics genuinely do not apply and that exception is documented.

---

# 45. Option Precedence

Explicit CLI arguments take precedence over implicit defaults.

Conceptually:

```text
explicit CLI option
        ↓
command default
        ↓
application default
```

Undocumented configuration sources must not override explicit CLI input.

---

# 46. JSON Contract

JSON output must represent structured diagnostic data.

At minimum, the result should conceptually contain:

```text
{
  metadata,
  scope,
  findings,
  score,
  statistics,
  status
}
```

The exact JSON schema must remain aligned with the application/domain result model.

No terminal-only field should be required to interpret the JSON result.

---

# 47. JSON Determinism

For the same input state and command options:

- object semantics must remain stable
- arrays must use deterministic ordering
- findings must use stable identifiers
- score must be identical

JSON must not include timestamps or random identifiers unless explicitly specified as metadata that does not affect diagnostic equivalence.

---

# 48. Exit Codes

YOWTF must use non-zero exit status when the CLI invocation itself fails.

The final diagnostic exit-code mapping must distinguish CLI/application failure from diagnostic findings where appropriate.

The authoritative mapping is:

| Exit code | Meaning |
|---:|---|
| `0` | Successful execution with no blocking CLI/application error |
| `1` | Diagnostic/application failure requiring a non-success process result |
| `2` | CLI usage error such as invalid command or option |

Diagnostic findings do not automatically imply a CLI parsing failure.

The implementation must preserve this distinction.

---

# 49. Exit Code Principle

A health problem is not the same thing as a CLI failure.

For example:

```text
machine has warnings
```

is not equivalent to:

```text
yowtf --invalid-option
```

The CLI must preserve this distinction.

If future CI-oriented exit semantics are required, they must be explicitly added to this specification.

---

# 50. Interrupt Handling

The CLI should respond safely to user interruption.

Examples:

```text
Ctrl+C
SIGINT
```

An interrupted scan must not:

- modify user state
- leave mutation operations running
- corrupt output where avoidable

The process should terminate with an appropriate non-success status.

---

# 51. Terminal Detection

YOWTF must not assume an interactive terminal.

When output is:

- piped
- redirected
- executed in CI

interactive-only presentation should be disabled or degraded safely.

JSON mode always takes precedence over terminal decoration.

---

# 52. Color Precedence

If:

```bash
yowtf --json --no-color
```

is used, JSON mode remains machine-readable and contains no ANSI styling.

If:

```bash
yowtf --no-color
```

is used, terminal content remains readable without color.

No diagnostic result changes because of color settings.

---

# 53. Quiet Precedence

If:

```bash
yowtf --quiet
```

is used, reduce presentation noise.

If:

```bash
yowtf --quiet --json
```

is used, JSON remains valid JSON.

Quiet mode must not truncate required machine-readable fields.

---

# 54. Verbose Precedence

Verbose mode may expose more diagnostic execution context.

However:

```text
verbose ≠ secret dump
```

Verbose output must continue to respect privacy requirements.

Verbose mode must not alter the findings or score.

---

# 55. Error Message Requirements

CLI errors should be:

- concise
- actionable
- human-readable
- deterministic
- free of secrets

Where appropriate, an error should explain:

1. what failed
2. why it failed
3. what the user can do next

Do not expose raw stack traces during normal operation unless explicitly requested through debugging behavior.

---

# 56. Invalid Path Errors

For:

```bash
yowtf --path ./missing
```

the CLI should clearly indicate that the target cannot be analyzed.

It must not silently fall back to the current directory.

---

# 57. Permission Errors

If a target is inaccessible:

- report the limitation
- continue only where safe and meaningful
- do not fabricate evidence
- do not claim a successful inspection

---

# 58. Unsupported Platform

If YOWTF is executed on an unsupported platform:

- identify the platform limitation
- avoid pretending diagnostics succeeded
- return an appropriate non-success result where required

The CLI must not silently emulate another platform.

---

# 59. Missing Tools

A missing diagnostic target must not automatically be treated as an application failure.

Example:

```text
Python is not installed.
```

may be valid diagnostic evidence.

The application should distinguish:

```text
tool unavailable
```

from:

```text
YOWTF itself failed
```

---

# 60. Command Aliases

No undocumented aliases are part of V1.

If an alias is added, it must be documented in this file.

The canonical command names remain:

```text
doctor
score
explain
system
disk
processes
ports
network
env
runtimes
tools
paths
versions
project
deps
git
config
caches
clean
```

---

# 61. Command Naming Rules

Commands must:

- be lowercase
- be easy to type
- represent a clear diagnostic area
- avoid ambiguous abbreviations
- avoid platform-specific terminology where possible

New commands require specification approval.

---

# 62. No Hidden Commands

Internal/debug functionality must not accidentally become a public command.

A command is public only when:

1. documented here
2. registered intentionally
3. tested
4. included in help output where appropriate

---

# 63. No Silent Command Expansion

Do not turn:

```text
yowtf ports
```

into:

```text
system + network + processes + ports + project
```

unless that behavior is explicitly documented.

Internal reuse is allowed.

Unexpected user-visible scope expansion is not.

---

# 64. Command Output Structure

Human-readable diagnostic commands should generally communicate:

```text
1. what was checked
2. overall state
3. important findings
4. evidence
5. score where applicable
6. next inspection/remediation guidance where defined
```

Exact visual layout is owned by the reporting implementation/specification.

---

# 65. Finding Severity

The CLI may present findings using severity levels defined by the detection/scoring specifications.

The CLI must not redefine severity semantics.

It only presents the normalized severity.

---

# 66. Finding Status

The CLI may present statuses such as:

```text
PASS
FAIL
WARN
SKIPPED
UNAVAILABLE
ERROR
```

The exact domain semantics are defined by `DETECTION-ENGINE.md`.

The CLI must not invent additional statuses without updating the owning specification.

---

# 67. Score Presentation

When a score is displayed, it must be taken from the canonical scoring layer.

The CLI must not calculate:

```text
score = ...
```

inside a formatter or command handler.

---

# 68. Explainability Output

For findings that support explanation, the CLI should make it possible to understand:

```text
Problem
→ Evidence
→ Why it matters
→ Suggested next action
```

The wording must come from structured result data or documented templates.

The reporter must not invent technical claims.

---

# 69. Command-to-Specification Mapping

| Command | Primary responsibility |
|---|---|
| `yowtf` | Full/default health scan |
| `yowtf doctor` | Diagnostic-oriented scan |
| `yowtf score` | Health score |
| `yowtf explain` | Finding explanations |
| `yowtf system` | System diagnostics |
| `yowtf disk` | Disk/storage diagnostics |
| `yowtf processes` | Process diagnostics |
| `yowtf ports` | Port diagnostics |
| `yowtf network` | Network diagnostics |
| `yowtf env` | Environment diagnostics |
| `yowtf runtimes` | Runtime diagnostics |
| `yowtf tools` | Developer tool diagnostics |
| `yowtf paths` | PATH/executable diagnostics |
| `yowtf versions` | Version consistency diagnostics |
| `yowtf project` | Project diagnostics |
| `yowtf deps` | Dependency diagnostics |
| `yowtf git` | Git diagnostics |
| `yowtf config` | Configuration diagnostics |
| `yowtf caches` | Cache diagnostics |
| `yowtf clean` | Cleanup candidate diagnostics |

---

# 70. CLI Safety Rules

The CLI must not:

- install software
- uninstall software
- update packages
- delete files
- kill processes
- edit source files
- edit project configuration
- modify Git state
- modify PATH
- modify environment variables
- send telemetry
- require a cloud account

unless a future specification explicitly changes the V1 boundary.

---

# 71. CLI Performance

The CLI should avoid performing unnecessary work.

For command-specific execution:

```text
yowtf runtimes
```

should not collect unrelated information solely because the default scan can collect it.

Shared collection may be reused where relevant.

---

# 72. Command Testing Requirements

Every public command must have tests covering, as applicable:

- successful invocation
- help
- invalid options
- output mode
- path handling
- error behavior
- exit status
- deterministic output

Every documented global option must have coverage.

---

# 73. Documentation Requirements

Adding a public CLI command requires updating:

1. `CLI-SPEC.md`
2. `COMMANDS.md`
3. relevant tests
4. README if the public command list is exposed there

No command should be implemented first and documented later.

---

# 74. AI Coding Agent Contract

Antigravity must:

1. Read `CLI-SPEC.md` before changing CLI behavior.
2. Preserve every documented command.
3. Preserve command names.
4. Preserve documented options.
5. Preserve option meanings.
6. Preserve documented exit-code semantics.
7. Reject undocumented command additions.
8. Reject undocumented aliases.
9. Reject undocumented global flags.
10. Keep diagnostic logic outside command handlers.
11. Keep JSON output machine-readable.
12. Keep `--no-color` free of ANSI styling.
13. Keep `--quiet` presentation-only.
14. Keep `--verbose` from exposing secrets.
15. Preserve read-only behavior.
16. Preserve path safety.
17. Add tests for CLI changes.
18. Update CLI documentation before implementing approved behavior changes.
19. Stop if a requested CLI behavior conflicts with another specification.
20. Never infer a command's behavior from its name alone.

---

# 75. CLI Change Control

Before adding or changing a command:

```text
Requirement
    ↓
CLI specification update
    ↓
COMMANDS.md update
    ↓
Affected architecture review
    ↓
Implementation
    ↓
Tests
    ↓
Validation
```

If the change affects scoring, detection, architecture, or technology, update those specifications too.

---

# 76. Final CLI Contract

The canonical YOWTF CLI is:

```text
yowtf
yowtf doctor
yowtf score
yowtf explain
yowtf system
yowtf disk
yowtf processes
yowtf ports
yowtf network
yowtf env
yowtf runtimes
yowtf tools
yowtf paths
yowtf versions
yowtf project
yowtf deps
yowtf git
yowtf config
yowtf caches
yowtf clean
```

with the global options:

```text
-h, --help
-V, --version
--verbose
--no-color
--json
--quiet
--path <dir>
```

The CLI is a safe interface over YOWTF's diagnostic engine.

It is not itself the diagnostic engine.

---

**End of `docs/CLI-SPEC.md`**
