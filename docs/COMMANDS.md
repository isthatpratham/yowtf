# YOWTF — Command Catalogue

**Document:** `docs/COMMANDS.md`  
**Product:** YOWTF — Your Operating Workstation Trouble Finder  
**CLI:** `yowtf`  
**Status:** Source of Truth  
**Version:** 1.0  
**Audience:** YOWTF maintainers, contributors, reviewers, and AI coding agents

---

## 1. Purpose

This document is the authoritative catalogue of public YOWTF commands.

It answers:

- Which commands exist?
- What does each command do?
- What scope does each command inspect?
- Which global options apply?
- What behavior is expected?
- What must a command never do?

`CLI-SPEC.md` defines the general CLI contract.

`COMMANDS.md` defines the command inventory and command-specific responsibilities.

If a command is not documented here, it is not a public V1 command.

---

# 2. Command Source-of-Truth Rule

The authoritative public command inventory is:

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

No other public command may be introduced without updating this document.

---

# 3. Command Design Rules

Every command must:

1. have one clearly defined primary responsibility
2. remain read-only in V1
3. use the application layer
4. use approved collectors/rules
5. return structured diagnostic results
6. use the canonical reporting layer
7. respect documented global options
8. preserve deterministic behavior
9. avoid undocumented side effects
10. be tested

---

# 4. Global Options

The following options are globally supported.

| Option | Purpose |
|---|---|
| `-h, --help` | Display help |
| `-V, --version` | Display YOWTF version |
| `--verbose` | Display additional diagnostic context |
| `--no-color` | Disable terminal colors |
| `--json` | Emit machine-readable JSON |
| `--quiet` | Reduce human-readable output |
| `--path <dir>` | Analyze the specified directory |

These options are defined in detail by `CLI-SPEC.md`.

---

# 5. Command Groups

## Core

```text
yowtf
yowtf doctor
yowtf score
yowtf explain
```

## Workstation

```text
yowtf system
yowtf disk
yowtf processes
yowtf ports
yowtf network
```

## Development Environment

```text
yowtf env
yowtf runtimes
yowtf tools
yowtf paths
yowtf versions
```

## Project

```text
yowtf project
yowtf deps
yowtf git
yowtf config
```

## Storage

```text
yowtf caches
yowtf clean
```

---

# 6. `yowtf`

## 6.1 Syntax

```bash
yowtf
```

Global options may be appended:

```bash
yowtf --json
yowtf --verbose
yowtf --no-color
yowtf --quiet
yowtf --path ./project
```

---

## 6.2 Purpose

Run the standard YOWTF health scan.

This is the primary user experience.

The default scan evaluates the full applicable V1 diagnostic scope.

---

## 6.3 Scope

The default scan may cover all applicable V1 diagnostic areas:

```text
system
disk
processes
ports
network
environment
runtimes
tools
paths
versions
project
dependencies
git
configuration
caches
```

Applicability is determined by the detection engine.

---

## 6.4 Pipeline

```text
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

---

## 6.5 Expected Result

The command produces:

- overall diagnostic result
- applicable findings
- health score
- score band
- diagnostic coverage information where supported

---

## 6.6 Restrictions

The default command must not:

- install software
- remove software
- modify files
- modify Git
- kill processes
- change PATH
- change environment variables
- transmit telemetry
- require a network connection

---

# 7. `yowtf doctor`

## 7.1 Syntax

```bash
yowtf doctor
```

---

## 7.2 Purpose

Run a diagnostic-oriented scan intended to help identify conditions requiring attention.

---

## 7.3 Scope

The command uses the applicable diagnostic engine and emphasizes actionable findings.

It may inspect workstation and project conditions within the approved V1 rule set.

---

## 7.4 Expected Result

The output should make it easy to identify:

```text
What is wrong?
Why?
How serious is it?
What evidence supports it?
What should I inspect next?
```

---

## 7.5 Scoring

If a score is presented, it must come from the canonical scoring engine.

`doctor` must not implement an alternate scoring algorithm.

---

## 7.6 Restrictions

The command is diagnostic only.

No repair is performed.

---

# 8. `yowtf score`

## 8.1 Syntax

```bash
yowtf score
```

---

## 8.2 Purpose

Present the health score for the applicable default diagnostic scope.

---

## 8.3 Scoring Source

The command must use the canonical implementation defined by:

```text
docs/SCORING.md
```

---

## 8.4 Output

The command should communicate:

```text
score
score band
scope
coverage where applicable
```

---

## 8.5 Restrictions

The command must not:

- calculate a different score
- use a different severity mapping
- ignore documented WARN penalties
- alter findings

---

# 9. `yowtf explain`

## 9.1 Syntax

```bash
yowtf explain
```

---

## 9.2 Purpose

Provide a more explanatory presentation of detected conditions.

---

## 9.3 Output Focus

The command should emphasize:

```text
Finding
  ↓
Evidence
  ↓
Impact
  ↓
Suggested next inspection
```

---

## 9.4 Source of Truth

Explanation must come from structured diagnostic results and documented rule metadata.

It must not invent technical conclusions.

---

# 10. `yowtf system`

## 10.1 Syntax

```bash
yowtf system
```

---

## 10.2 Purpose

Inspect developer-workstation system information.

---

## 10.3 Diagnostic Scope

System diagnostics may include:

```text
operating system
architecture
CPU
memory
uptime
```

and other explicitly approved system facts.

---

## 10.4 Output

The command presents relevant system evidence and applicable findings.

---

## 10.5 Safety

The command is observational.

It must not:

- change system settings
- terminate processes
- modify resource allocation
- install system software

---

# 11. `yowtf disk`

## 11.1 Syntax

```bash
yowtf disk
```

---

## 11.2 Purpose

Inspect disk/storage conditions relevant to development.

---

## 11.3 Diagnostic Scope

May include:

```text
disk capacity
available space
storage pressure
developer-related storage conditions
```

---

## 11.4 Cleanup

The command may identify storage concerns.

It does not delete anything.

---

# 12. `yowtf processes`

## 12.1 Syntax

```bash
yowtf processes
```

---

## 12.2 Purpose

Inspect currently running processes relevant to developer workstation health.

---

## 12.3 Diagnostic Scope

May include:

```text
process identity
process state
resource metadata where available
developer-related processes
potential conflicts
```

---

## 12.4 Safety

The command must never terminate or manipulate processes.

---

# 13. `yowtf ports`

## 13.1 Syntax

```bash
yowtf ports
```

---

## 13.2 Purpose

Inspect local listening ports relevant to development.

---

## 13.3 Diagnostic Scope

May include:

```text
port
address
listening state
associated process metadata where available
development-port conflicts
```

---

## 13.4 Safety

The command must not:

- kill processes
- close ports
- change firewall settings
- change network configuration

---

# 14. `yowtf network`

## 14.1 Syntax

```bash
yowtf network
```

---

## 14.2 Purpose

Inspect local network-related developer diagnostics.

---

## 14.3 V1 Boundary

Network diagnostics remain local-first.

No mandatory remote service is required.

---

## 14.4 Diagnostic Scope

May include locally observable conditions such as:

```text
local network configuration
local connectivity-related state
DNS-related local configuration where available
```

Exact rules are defined in `RULE-CATALOGUE.md`.

---

## 14.5 Safety

The command must not transmit diagnostic information to a remote service.

---

# 15. `yowtf env`

## 15.1 Syntax

```bash
yowtf env
```

---

## 15.2 Purpose

Inspect environment configuration relevant to developer workflows.

---

## 15.3 Diagnostic Scope

May include:

```text
environment variable names
presence metadata
configuration-related metadata
```

---

## 15.4 Secret Protection

The command must not dump environment secrets.

Examples of sensitive values include:

```text
API keys
tokens
passwords
credentials
private keys
```

---

## 15.5 Safety

The command must not modify environment variables.

---

# 16. `yowtf runtimes`

## 16.1 Syntax

```bash
yowtf runtimes
```

---

## 16.2 Purpose

Inspect installed development runtimes.

---

## 16.3 Runtime Targets

Potential V1 runtime targets include:

```text
Node.js
Python
Java
Go
Rust
PHP
```

The exact rule inventory determines which runtime conditions are evaluated.

---

## 16.4 Diagnostic Scope

May include:

```text
runtime presence
runtime version
executable resolution
version consistency
project/runtime compatibility
```

---

## 16.5 Missing Runtime

A runtime being absent is not automatically a failure.

A rule determines whether it is relevant and problematic.

---

## 16.6 Safety

The command must not switch, install, remove, or upgrade runtimes.

---

# 17. `yowtf tools`

## 17.1 Syntax

```bash
yowtf tools
```

---

## 17.2 Purpose

Inspect developer tools installed on the workstation.

---

## 17.3 Potential Tool Targets

Potential targets include:

```text
Git
npm
pnpm
yarn
pip
Docker
```

The authoritative individual diagnostic rules are defined in the rule catalogue.

---

## 17.4 Diagnostic Scope

May include:

```text
tool presence
tool version
executable resolution
tool consistency
```

---

## 17.5 Safety

The command must not install or update tools.

---

# 18. `yowtf paths`

## 18.1 Syntax

```bash
yowtf paths
```

---

## 18.2 Purpose

Inspect PATH and executable-resolution conditions.

---

## 18.3 Diagnostic Scope

May include:

```text
PATH entries
executable resolution
duplicate executable locations
missing expected executables
PATH-related inconsistencies
```

---

## 18.4 Platform Behavior

Path handling must respect platform-specific semantics.

Windows, macOS, and Linux must not be treated as identical path environments.

---

## 18.5 Safety

The command must not modify PATH.

---

# 19. `yowtf versions`

## 19.1 Syntax

```bash
yowtf versions
```

---

## 19.2 Purpose

Inspect version consistency across relevant developer tools and runtimes.

---

## 19.3 Diagnostic Scope

May include:

```text
multiple installed versions
executable/version mismatches
project/runtime mismatches
tool/runtime consistency
```

---

## 19.4 Version Comparison

Version-aware comparison must use appropriate structured comparison.

Lexicographic comparison is not acceptable for semantic versions.

---

## 19.5 Safety

The command must not change active versions.

---

# 20. `yowtf project`

## 20.1 Syntax

```bash
yowtf project
```

---

## 20.2 Purpose

Inspect the current project environment.

---

## 20.3 Project Root

By default, the current working directory is the analysis target.

The user may override it with:

```bash
yowtf project --path ./my-project
```

---

## 20.4 Diagnostic Scope

May include:

```text
project type
project manifests
lockfiles
runtime expectations
project configuration
dependency metadata
Git context
```

---

## 20.5 Project Boundary

Project diagnostics must remain bounded to the discovered project scope.

They must not indiscriminately inspect unrelated directories.

---

## 20.6 Safety

Project diagnostics are read-only.

---

# 21. `yowtf deps`

## 21.1 Syntax

```bash
yowtf deps
```

---

## 21.2 Purpose

Inspect dependency-related project health.

---

## 21.3 Diagnostic Scope

May include:

```text
dependency manifests
lockfiles
package-manager consistency
declared versions
reproducibility-related dependency state
```

---

## 21.4 Package Manager Behavior

The command may inspect package-manager metadata.

It must not install, update, remove, or repair dependencies.

---

## 21.5 Safety

Commands equivalent to the following are prohibited during diagnostics:

```text
npm install
pnpm install
npm update
pnpm update
pip install
```

and equivalent mutation operations.

---

# 22. `yowtf git`

## 22.1 Syntax

```bash
yowtf git
```

---

## 22.2 Purpose

Inspect Git repository health relevant to development.

---

## 22.3 Diagnostic Scope

May include:

```text
repository presence
branch state
working tree state
repository metadata
reproducibility-relevant Git conditions
```

---

## 22.4 Safety

The command must not modify Git state.

Prohibited mutation includes:

```text
git add
git commit
git reset
git checkout
git clean
git stash
```

---

# 23. `yowtf config`

## 23.1 Syntax

```bash
yowtf config
```

---

## 23.2 Purpose

Inspect relevant project/developer configuration.

---

## 23.3 Diagnostic Scope

May include:

```text
configuration presence
configuration consistency
configuration values that are safe to inspect
configuration-related project conditions
```

---

## 23.4 Secret Protection

Sensitive configuration values must not be unnecessarily exposed.

---

## 23.5 Safety

The command must not rewrite configuration.

---

# 24. `yowtf caches`

## 24.1 Syntax

```bash
yowtf caches
```

---

## 24.2 Purpose

Identify developer-tool caches and cache-related storage conditions.

---

## 24.3 Diagnostic Scope

May include:

```text
known cache locations
cache metadata
cache size where safely available
storage pressure associated with caches
```

---

## 24.4 Safety

The command must not clear caches.

---

# 25. `yowtf clean`

## 25.1 Syntax

```bash
yowtf clean
```

---

## 25.2 Purpose

Identify potential cleanup candidates.

Despite the command name, V1 is read-only.

---

## 25.3 Behavior

The command reports candidates for manual inspection.

It does not delete them.

---

## 25.4 Preview

Supported invocation:

```bash
yowtf clean --preview
```

The preview explicitly presents cleanup candidates without mutation.

---

## 25.5 Potential Categories

Potential categories include:

```text
cache
builds
dependencies
```

A category is only supported when documented by the relevant rules.

---

## 25.6 Safety

The command must never silently perform:

```text
delete
remove
clean
purge
uninstall
```

operations.

---

# 26. `--path` Across Commands

The `--path <dir>` option establishes the project analysis target where the command supports project-scoped diagnostics.

Examples:

```bash
yowtf --path ./project
yowtf project --path ./project
yowtf deps --path ./project
yowtf git --path ./project
yowtf config --path ./project
```

For purely workstation-global commands, the option must not falsely imply that machine-global diagnostics are restricted to the supplied directory.

---

# 27. Global Option Matrix

The intended option availability is:

| Command | `--help` | `--version` | `--verbose` | `--no-color` | `--json` | `--quiet` | `--path` |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| `yowtf` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `doctor` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `score` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `explain` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `system` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `disk` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `processes` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `ports` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `network` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `env` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `runtimes` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `tools` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `paths` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `versions` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `project` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `deps` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `git` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `config` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `caches` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `clean` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

`--help` and `--version` are CLI controls rather than diagnostic inputs.

---

# 28. Command Output Modes

Every diagnostic command should support the standard output modes where technically applicable:

```text
default terminal
--json
--quiet
--verbose
--no-color
```

Output mode changes presentation, not diagnostics.

---

# 29. Default Terminal Mode

Default output is intended for developers.

It may contain:

```text
headings
status indicators
findings
score
tables
explanations
```

Terminal formatting must remain readable.

---

# 30. JSON Mode

Example:

```bash
yowtf runtimes --json
```

JSON mode must:

- produce valid JSON
- use structured diagnostic results
- contain no ANSI codes
- contain no spinner output
- contain no decorative terminal formatting

---

# 31. Quiet Mode

Example:

```bash
yowtf doctor --quiet
```

Quiet mode reduces presentation noise.

It must not:

- disable diagnostics
- change findings
- change score
- invalidate JSON output

---

# 32. Verbose Mode

Example:

```bash
yowtf system --verbose
```

Verbose mode may expose additional execution context.

It must not expose secrets.

---

# 33. No-Color Mode

Example:

```bash
yowtf system --no-color
```

The output remains readable without terminal color.

---

# 34. Combined Options

Options may be combined.

Example:

```bash
yowtf doctor --json --quiet
```

The result must remain valid JSON.

Example:

```bash
yowtf runtimes --verbose --no-color
```

The result remains verbose but unstyled.

---

# 35. Invalid Option Behavior

Unknown options must fail.

Example:

```bash
yowtf --fake-option
```

must not silently continue.

---

# 36. Invalid Command Behavior

Unknown commands must fail.

Example:

```bash
yowtf banana
```

must not silently execute the default scan.

---

# 37. Missing Path Behavior

Example:

```bash
yowtf project --path ./does-not-exist
```

must report a clear error.

It must not silently use the current directory.

---

# 38. Permission Failure Behavior

If a command cannot inspect a required resource:

- report the limitation honestly
- preserve unavailable/error state
- continue with independent diagnostics where safe

Do not fabricate evidence.

---

# 39. Missing Tool Behavior

If a diagnostic target is missing:

```text
missing target
```

must remain distinguishable from:

```text
YOWTF execution failure
```

Applicability and rule semantics determine whether the missing target becomes a finding.

---

# 40. Platform Behavior

All commands must respect the supported platform model:

```text
Windows
macOS
Linux
```

Platform-specific collection belongs behind the platform architecture.

---

# 41. Command Safety Matrix

| Command | Reads system | Reads project | May inspect processes | May inspect ports | May inspect Git | May modify state |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| `yowtf` | ✓ | ✓ | ✓ | ✓ | ✓ | No |
| `doctor` | ✓ | ✓ | ✓ | ✓ | ✓ | No |
| `score` | via diagnostic result | via diagnostic result | via result | via result | via result | No |
| `explain` | via diagnostic result | via diagnostic result | via result | via result | via result | No |
| `system` | ✓ | No | No | No | No | No |
| `disk` | ✓ | optional | No | No | No | No |
| `processes` | ✓ | No | ✓ | No | No | No |
| `ports` | ✓ | No | optional association | ✓ | No | No |
| `network` | ✓ | No | No | optional | No | No |
| `env` | ✓ | optional | No | No | No | No |
| `runtimes` | ✓ | optional | No | No | No | No |
| `tools` | ✓ | optional | No | No | No | No |
| `paths` | ✓ | optional | No | No | No | No |
| `versions` | ✓ | optional | No | No | No | No |
| `project` | optional | ✓ | No | No | optional | No |
| `deps` | optional | ✓ | No | No | optional | No |
| `git` | optional | ✓ | No | No | ✓ | No |
| `config` | optional | ✓ | No | No | optional | No |
| `caches` | ✓ | optional | No | No | No | No |
| `clean` | ✓ | optional | No | No | No | No |

This table describes architectural scope, not a promise that every command will collect every listed category.

---

# 42. Command-to-Collector Relationship

Commands select diagnostic scope.

Collectors provide evidence.

For example:

```text
yowtf runtimes
      ↓
runtime collectors
      ↓
runtime evidence
      ↓
runtime rules
```

A command must not implement collector logic itself.

---

# 43. Command-to-Rule Relationship

Commands do not directly encode individual rule logic.

The application layer selects applicable rules based on command scope.

Conceptually:

```text
command
  ↓
scope
  ↓
rule selection
  ↓
evaluation
```

---

# 44. Command-to-Scoring Relationship

Commands request scoring where appropriate.

They do not calculate penalties.

The canonical flow is:

```text
command
 ↓
application
 ↓
findings
 ↓
scoring engine
 ↓
score
```

---

# 45. Command-to-Reporting Relationship

Commands select or request a reporter.

The reporter consumes structured results.

Commands must not manually construct terminal output from raw collector data.

---

# 46. Command Independence

Commands should remain independently testable.

A test for:

```text
yowtf ports
```

should not require unrelated diagnostics to execute unless the documented architecture requires shared infrastructure.

---

# 47. Full Scan vs Narrow Scan

## Full scan

```bash
yowtf
```

evaluates the full applicable V1 diagnostic scope.

## Narrow scan

```bash
yowtf ports
```

evaluates the port-related scope.

The two must not silently produce identical work.

---

# 48. Scope Transparency

Where practical, output should identify the scope being evaluated.

Examples:

```text
Scope: workstation
Scope: project
Scope: runtime
Scope: ports
```

Scope is diagnostic metadata, not a score modifier.

---

# 49. Command Performance

A command should collect only evidence relevant to its scope where practical.

Do not perform an entire workstation scan for a narrow diagnostic without a documented reason.

---

# 50. Command Determinism

For identical input state:

```text
same command
+
same options
+
same evidence
```

must produce:

```text
same findings
same score
same ordering
```

---

# 51. Command Ordering

When multiple findings are displayed, ordering must be deterministic.

The command layer must not rely on asynchronous completion order.

---

# 52. Command Errors

A command must distinguish:

```text
diagnostic finding
```

from:

```text
CLI/application failure
```

A broken workstation is not automatically a broken CLI invocation.

---

# 53. Command Exit Codes

The command layer follows the exit semantics defined by `CLI-SPEC.md`.

V1:

```text
0 → successful execution
1 → diagnostic/application failure requiring non-success result
2 → CLI usage error
```

Exact command-specific exceptions require specification updates.

---

# 54. Help Contract

Every command must appear in the appropriate help output.

Example:

```bash
yowtf --help
```

must expose the public command catalogue.

Each command must support:

```bash
yowtf <command> --help
```

---

# 55. Version Contract

Version output:

```bash
yowtf --version
```

must not execute diagnostics.

The version must correspond to the installed package.

---

# 56. No Hidden Mutation

No command in this catalogue may mutate state in V1.

The presence of a command named:

```text
clean
```

does not grant permission to delete.

The presence of:

```text
doctor
```

does not grant permission to repair.

---

# 57. No Hidden Network

No command may silently contact a remote service.

If a future command needs network access, this catalogue and the relevant specifications must explicitly change.

---

# 58. No Telemetry

No command may send:

- usage data
- machine fingerprints
- diagnostic reports
- analytics
- crash telemetry

in V1.

---

# 59. No AI

No command invokes an AI model as part of normal runtime execution.

---

# 60. No Background Daemon

YOWTF commands are invocation-based.

V1 does not start a persistent monitoring daemon.

---

# 61. No Continuous Monitoring

A command completes its scan and exits.

YOWTF V1 is not a system monitoring service.

---

# 62. Command Naming Contract

All public command names are lowercase.

No abbreviations are required.

The canonical spelling must remain stable.

---

# 63. Alias Policy

V1 has no additional public aliases.

If aliases are introduced later, they must be documented here.

---

# 64. Hidden/Experimental Commands

Experimental functionality must not appear as an undocumented public command.

If experimentation is required during development, it should remain outside the public CLI contract.

---

# 65. Command Addition Checklist

Before adding a command:

```text
[ ] User requirement exists
[ ] CLI-SPEC.md updated
[ ] COMMANDS.md updated
[ ] Scope defined
[ ] Output defined
[ ] Error behavior defined
[ ] Safety boundary defined
[ ] Relevant rules specified
[ ] Tests defined
[ ] Documentation updated
```

---

# 66. Command Removal Checklist

Before removing a command:

```text
[ ] Requirement reviewed
[ ] CLI-SPEC.md updated
[ ] COMMANDS.md updated
[ ] Help output updated
[ ] Tests updated
[ ] README reviewed
[ ] No stale references remain
```

---

# 67. Command Modification Checklist

Before changing a command:

```text
[ ] Identify affected behavior
[ ] Update owning specification
[ ] Check architecture impact
[ ] Check detection impact
[ ] Check scoring impact
[ ] Check output impact
[ ] Update tests
[ ] Validate all affected commands
```

---

# 68. Antigravity Command Contract

Antigravity must:

1. Read `CLI-SPEC.md`.
2. Read this document.
3. Treat the command inventory as authoritative.
4. Never invent a public command.
5. Never invent a command alias.
6. Never silently rename a command.
7. Never silently remove a command.
8. Never expand a command's scope without documentation.
9. Never add mutation to a diagnostic command.
10. Never add network access.
11. Never add telemetry.
12. Never add AI runtime behavior.
13. Keep command handlers thin.
14. Keep diagnostics in the application/detection layers.
15. Keep scoring in the scoring layer.
16. Keep formatting in the reporting layer.
17. Preserve global option behavior.
18. Preserve JSON purity.
19. Preserve deterministic output.
20. Add tests for command changes.
21. Update this catalogue before implementing approved command changes.
22. Stop if command requirements are ambiguous.
23. Stop if specifications conflict.
24. Never infer command behavior from a command name alone.

---

# 69. Command Definition of Done

The V1 command catalogue is implemented when:

- every listed command exists
- every command appears in help
- every command has documented scope
- every command has deterministic behavior
- global options behave consistently
- JSON output is valid
- errors are handled explicitly
- paths are handled safely
- commands remain read-only
- no hidden network behavior exists
- no telemetry exists
- no AI runtime dependency exists
- tests cover every public command
- documentation matches implementation

---

# 70. Complete V1 Command Reference

For quick reference:

```text
yowtf
```

Full/default health scan.

```text
yowtf doctor
```

Diagnostic-oriented health scan.

```text
yowtf score
```

Health score.

```text
yowtf explain
```

Detailed finding explanations.

```text
yowtf system
```

System diagnostics.

```text
yowtf disk
```

Disk/storage diagnostics.

```text
yowtf processes
```

Process diagnostics.

```text
yowtf ports
```

Port diagnostics.

```text
yowtf network
```

Local network diagnostics.

```text
yowtf env
```

Environment diagnostics.

```text
yowtf runtimes
```

Runtime diagnostics.

```text
yowtf tools
```

Developer-tool diagnostics.

```text
yowtf paths
```

PATH/executable diagnostics.

```text
yowtf versions
```

Version-consistency diagnostics.

```text
yowtf project
```

Project diagnostics.

```text
yowtf deps
```

Dependency diagnostics.

```text
yowtf git
```

Git diagnostics.

```text
yowtf config
```

Configuration diagnostics.

```text
yowtf caches
```

Cache diagnostics.

```text
yowtf clean
```

Cleanup-candidate diagnostics.

```text
yowtf clean --preview
```

Explicit cleanup-candidate preview.

---

# 71. Final Command Definition

YOWTF's command architecture is intentionally simple:

```text
COMMAND
   ↓
SCOPE
   ↓
APPLICATION USE CASE
   ↓
COLLECT
   ↓
DETECT
   ↓
EVALUATE
   ↓
SCORE
   ↓
REPORT
```

A command is an entry point into the diagnostic system—not a place to hide diagnostic logic.

Every public command must be documented, deterministic, explainable, testable, and read-only.

If it is not documented here, it is not part of YOWTF V1.

---

**End of `docs/COMMANDS.md`**
