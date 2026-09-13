# YOWTF — Architecture Specification

**Document:** `docs/ARCHITECTURE.md`  
**Product:** YOWTF — Your Operating Workstation Trouble Finder  
**CLI:** `yowtf`  
**Status:** Source of Truth  
**Version:** 1.0  
**Audience:** YOWTF maintainers, contributors, reviewers, and AI coding agents

---

## 1. Purpose

This document defines the technical architecture of YOWTF.

It specifies:

- architectural layers
- module responsibilities
- data flow
- dependency direction
- domain boundaries
- detection architecture
- platform abstraction
- command/application separation
- reporting separation
- error handling boundaries
- extensibility rules
- testing boundaries
- implementation constraints

This document is authoritative for architectural decisions.

If implementation conflicts with this document, the implementation is considered incorrect unless this document is explicitly changed first.

---

# 2. Architectural Source-of-Truth Rule

YOWTF follows a documentation-first development model.

The authority hierarchy is:

1. Product Requirements Document
2. Architecture Specification
3. Technology Stack Specification
4. CLI Specification
5. Detection Engine Specification
6. Scoring Specification
7. Command Catalogue
8. Rule Catalogue
9. README
10. Implementation

Lower-level artifacts must not silently override higher-level specifications.

If two specifications conflict:

- stop implementation
- report the conflict
- resolve the specification first
- then implement

AI-generated suggestions, framework conventions, tutorials, examples, and assumptions are not product requirements.

---

# 3. Product Architecture

YOWTF is a local-first diagnostic CLI.

The high-level architecture is:

```text
┌─────────────────────────────────────────────┐
│                  User / CLI                 │
└──────────────────────┬──────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────┐
│              CLI / Command Layer             │
│  command parsing • flags • exit behavior    │
└──────────────────────┬──────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────┐
│             Application Layer                │
│ orchestration • scan lifecycle • use cases │
└──────────────────────┬──────────────────────┘
                       │
             ┌─────────┴─────────┐
             ▼                   ▼
┌──────────────────────┐ ┌─────────────────────┐
│ Collection / Platform│ │ Detection / Rules   │
│ system • process •   │ │ evidence → finding  │
│ filesystem • tools   │ │                     │
└──────────┬───────────┘ └──────────┬──────────┘
           │                        │
           └────────────┬───────────┘
                        ▼
              ┌─────────────────────┐
              │ Evaluation / Domain │
              │ findings • severity │
              │ confidence • health │
              └──────────┬──────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │ Scoring Layer       │
              │ health calculation  │
              └──────────┬──────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │ Reporting Layer     │
              │ terminal • JSON     │
              └─────────────────────┘
```

The architecture is intentionally pipeline-oriented.

YOWTF should collect facts first, reason about those facts second, calculate health third, and present results last.

---

# 4. Core Architectural Principles

## 4.1 Local-first

All normal diagnostics execute locally.

The architecture must not require:

- a remote backend
- a cloud service
- an external API
- telemetry infrastructure
- a hosted database

for normal operation.

---

## 4.2 Read-only by default

Diagnostic operations must not modify the user's:

- source code
- project configuration
- dependency manifests
- lockfiles
- environment files
- Git history
- installed packages
- system configuration

The architecture must make accidental mutation difficult.

---

## 4.3 Deterministic diagnostics

Given substantially identical machine and project state, the same detector should produce the same result.

Detectors must not depend on:

- random values
- network responses
- hidden mutable state
- undocumented heuristics
- AI-generated decisions

---

## 4.4 Evidence before conclusions

Rules must reason from collected evidence.

The preferred flow is:

```text
Environment
    ↓
Collector
    ↓
Evidence
    ↓
Rule
    ↓
Finding
```

A rule must not directly perform unrelated system discovery when the required collector already exists.

---

## 4.5 Separation of concerns

The following concerns must remain separate:

- command parsing
- application orchestration
- collection
- detection
- evaluation
- scoring
- rendering
- platform-specific behavior

---

## 4.6 Platform isolation

Operating-system-specific implementation must not leak throughout the application.

Platform-specific behavior belongs behind platform interfaces or adapters.

---

## 4.7 Explainability

Every actionable finding should be traceable to evidence.

The architecture should preserve enough information for the reporting layer to explain:

- what was detected
- why it matters
- what evidence supports it
- how severe it is
- what the user can inspect or do next

---

# 5. Architectural Layers

YOWTF uses the following logical layers.

## 5.1 CLI Layer

Responsible for:

- command registration
- argument parsing
- option parsing
- help text
- version output
- command dispatch
- CLI-level exit behavior

The CLI layer must not contain diagnostic business logic.

---

## 5.2 Application Layer

Responsible for:

- orchestrating scans
- invoking collectors
- invoking detectors
- invoking evaluation
- invoking scoring
- selecting reporting mode
- coordinating command-specific use cases

The application layer coordinates work but should not contain individual diagnostic rules.

---

## 5.3 Domain Layer

Responsible for core concepts such as:

- evidence
- findings
- severity
- confidence
- diagnostic status
- health score
- categories
- rule metadata
- scan results

Domain objects should remain independent of terminal rendering and operating-system APIs.

---

## 5.4 Collection Layer

Responsible for gathering raw facts from the environment.

Examples include:

- operating-system information
- CPU information
- memory information
- disk information
- process information
- port information
- environment variable names
- executable resolution
- runtime versions
- developer tool versions
- project files
- Git state
- dependency metadata

Collectors gather facts.

Collectors do not decide whether a fact is good or bad.

---

## 5.5 Platform Layer

Responsible for operating-system-specific implementations.

Examples:

```text
Windows
macOS
Linux
```

Platform implementations may differ internally while exposing a common application-facing interface.

---

## 5.6 Detection Layer

Responsible for converting evidence into diagnostic findings.

A detector/rule:

```text
reads evidence
     ↓
evaluates condition
     ↓
produces finding or no finding
```

Detection logic belongs here.

---

## 5.7 Scoring Layer

Responsible for converting evaluated findings into a health score.

Scoring must not:

- inspect the terminal
- parse human-readable output
- run shell commands
- perform network calls
- directly discover machine state

It operates on domain-level evaluation results.

---

## 5.8 Reporting Layer

Responsible for presentation.

Examples:

- terminal report
- JSON output
- concise/quiet output
- verbose diagnostic output

Reporting must not alter diagnostic results.

---

# 6. Dependency Direction

Dependencies should point inward toward stable abstractions.

Preferred dependency direction:

```text
CLI
 ↓
Application
 ↓
Domain

Application
 ↓
Collection / Detection / Scoring / Reporting interfaces

Platform
 ↓
Collection interfaces

Reporting
 ↓
Domain results
```

The domain must not depend on:

- Commander
- Chalk
- Ora
- Boxen
- cli-table3
- Node process globals
- terminal formatting
- platform shell commands

Similarly, detection rules must not depend on terminal rendering.

---

# 7. Proposed Source Tree

The following structure defines the intended architectural boundary.

```text
src/
├── cli/
│   ├── commands/
│   ├── options/
│   └── cli.ts
│
├── application/
│   ├── use-cases/
│   ├── orchestrators/
│   └── services/
│
├── domain/
│   ├── evidence/
│   ├── findings/
│   ├── scoring/
│   ├── rules/
│   └── scan/
│
├── detection/
│   ├── engine/
│   ├── rules/
│   └── registry/
│
├── collection/
│   ├── system/
│   ├── processes/
│   ├── ports/
│   ├── network/
│   ├── runtimes/
│   ├── tools/
│   ├── environment/
│   ├── project/
│   ├── dependencies/
│   ├── git/
│   └── storage/
│
├── platform/
│   ├── interfaces/
│   ├── windows/
│   ├── macos/
│   └── linux/
│
├── scoring/
│   └── ...
│
├── reporting/
│   ├── terminal/
│   ├── json/
│   └── formatters/
│
└── shared/
    ├── errors/
    ├── result/
    └── utilities/
```

This is an architectural target, not permission to create empty modules without an approved use.

A directory should exist because it owns a real responsibility.

---

# 8. Scan Pipeline

The canonical diagnostic pipeline is:

```text
DISCOVER
   ↓
COLLECT
   ↓
DETECT
   ↓
EVALUATE
   ↓
SCORE
   ↓
EXPLAIN
   ↓
REPORT
```

## 8.1 DISCOVER

Determine what can be analyzed.

Examples:

- current working directory
- project root
- project type
- available files
- supported platform
- available tools

Discovery must establish scope before expensive collection.

---

## 8.2 COLLECT

Gather raw facts.

Examples:

```text
Node version
Python version
Git version
PATH entries
Listening ports
Memory state
Disk state
Project manifests
Lockfiles
Git state
```

Collection should prefer structured APIs where practical.

---

## 8.3 DETECT

Run applicable rules against evidence.

Rules should be independently executable.

A rule should declare:

- unique identifier
- category
- description
- severity metadata
- required evidence
- evaluation behavior

Exact rule metadata is governed by `RULE-CATALOGUE.md`.

---

## 8.4 EVALUATE

Convert rule output into normalized findings.

A finding should have a stable structure.

Conceptually:

```text
Finding
├── ruleId
├── category
├── severity
├── status
├── confidence
├── title
├── summary
├── evidence
└── remediationHint
```

Exact schema is defined by the detection and scoring specifications.

---

## 8.5 SCORE

Calculate an overall health score from evaluated findings.

The scoring layer consumes normalized findings.

Exact scoring behavior belongs exclusively to `SCORING.md`.

---

## 8.6 EXPLAIN

Prepare human-readable explanation data.

Explanation is not a second detection engine.

It should expose the reasoning already produced by detection/evaluation.

---

## 8.7 REPORT

Render results according to the requested output mode.

Rendering must be deterministic for the same result set and output options.

---

# 9. Evidence Model

Evidence is the bridge between collection and detection.

Conceptual model:

```text
Evidence
├── source
├── type
├── value
├── availability
└── metadata
```

Evidence may represent:

- system facts
- process facts
- filesystem facts
- project facts
- tool facts
- runtime facts
- environment metadata
- Git facts

Sensitive values must not be collected merely because they are technically available.

For environment inspection, YOWTF should prefer variable names and metadata rather than secret values.

---

# 10. Collector Architecture

Collectors should follow a common conceptual interface.

```text
Collector
├── identifier
├── supported platforms
├── required capabilities
└── collect()
```

A collector should:

1. execute its narrow responsibility
2. return structured evidence
3. handle unavailable information safely
4. avoid producing findings
5. avoid rendering
6. avoid modifying state

### Example

Incorrect:

```text
collectNodeVersion()
→ checks Node version
→ prints warning
→ calculates score
```

Correct:

```text
collectNodeVersion()
→ returns Node version evidence

nodeVersionRule()
→ evaluates evidence

scoring()
→ evaluates finding impact

terminalReporter()
→ presents result
```

---

# 11. Detector Architecture

Rules are independent diagnostic units.

Conceptual structure:

```text
Rule
├── metadata
├── applicability
├── evidence requirements
└── evaluate()
```

Rules must be:

- deterministic
- explainable
- independently testable
- narrowly scoped
- side-effect free

A rule must not:

- modify files
- install software
- kill processes
- change environment variables
- alter Git state
- make network calls unless a future specification explicitly authorizes a specific diagnostic requiring it

V1 rules are governed by `RULE-CATALOGUE.md`.

---

# 12. Rule Registry

Rules should be registered through a centralized registry.

Conceptually:

```text
Rule Registry
    ↓
Applicable Rules
    ↓
Rule Execution
```

The registry provides:

- stable rule discovery
- rule lookup
- rule metadata
- filtering
- testing support

Rule identifiers must be unique.

A rule must not be silently registered twice.

---

# 13. Rule Applicability

Not every rule applies to every machine or project.

Applicability should be explicit.

Examples:

```text
Node-specific rule
→ applicable only when Node evidence exists

Git-specific rule
→ applicable only inside a Git repository

Python-specific rule
→ applicable only when Python/project Python evidence exists
```

Unsupported or unavailable information must not automatically become a failure.

The system must distinguish between:

```text
PASS
FAIL
WARN
SKIPPED
UNAVAILABLE
ERROR
```

The exact status model is frozen by the Detection Engine specification.

---

# 14. Platform Architecture

YOWTF targets:

- Windows
- macOS
- Linux

Platform-specific operations must be isolated.

Conceptually:

```text
Application
    ↓
Platform Interface
    ↓
┌──────────┬──────────┬──────────┐
│ Windows  │  macOS   │  Linux   │
│ Adapter  │ Adapter  │ Adapter  │
└──────────┴──────────┴──────────┘
```

The application must not contain scattered operating-system checks such as:

```text
if Windows...
if macOS...
if Linux...
```

unless the check is genuinely required at the boundary.

Prefer capability-based abstraction.

---

# 15. Shell and Process Execution

Some diagnostics require executing installed commands.

Examples may include:

- Git
- Node
- Python
- package managers
- other developer tools

Shell execution must be:

- explicit
- bounded
- non-interactive
- safely argumentized
- timeout-aware
- error-aware

Never construct commands from untrusted user-controlled strings without proper argument handling.

The process execution abstraction should hide platform-specific process APIs from higher layers.

---

# 16. Filesystem Architecture

Filesystem access belongs behind filesystem/collection abstractions where practical.

Requirements:

- respect configured scan scope
- avoid unnecessary traversal
- avoid following dangerous symlink cycles
- handle inaccessible paths
- handle large files safely
- avoid modifying files
- avoid reading sensitive contents unnecessarily

Project discovery should identify relevant metadata without indiscriminately reading the entire repository.

---

# 17. Environment Inspection

YOWTF may inspect environment metadata required for diagnostics.

Default principle:

```text
inspect names
not secrets
```

The architecture should prevent accidental exposure of:

- API keys
- access tokens
- passwords
- private keys
- credentials

Environment collectors should explicitly define which information they collect.

No collector may dump the entire environment to output.

---

# 18. Project Boundary

When YOWTF runs against a project, project discovery establishes a bounded project context.

Conceptually:

```text
Working Directory
       ↓
Project Discovery
       ↓
Project Context
       ├── project type
       ├── manifests
       ├── lockfiles
       ├── configuration
       ├── Git metadata
       └── relevant project facts
```

Project analysis must remain separate from global workstation analysis.

This distinction allows YOWTF to answer:

```text
Is my machine healthy?
```

and:

```text
Is this project likely to behave consistently on my machine?
```

without conflating the two.

---

# 19. Command Architecture

Commands are application entry points.

The command layer should:

1. parse input
2. validate options
3. construct the appropriate use-case request
4. invoke the application layer
5. select presentation mode
6. map final status to CLI exit behavior

Commands must not contain individual diagnostic rules.

Example:

```text
yowtf runtimes
      ↓
CLI command
      ↓
Runtime diagnostic use case
      ↓
Collectors
      ↓
Rules
      ↓
Findings
      ↓
Scoring / result
      ↓
Reporter
```

Every public command must be documented in `COMMANDS.md`.

---

# 20. Reporting Architecture

Reporting consumes results.

It does not generate them.

Conceptually:

```text
Diagnostic Result
       ↓
Reporter
   ┌───┴────┐
   ▼        ▼
Terminal   JSON
```

Terminal reporting may support:

- human-readable summaries
- findings
- severity indicators
- explanations
- score
- progress indicators where appropriate

JSON reporting must contain machine-readable structured data and must not depend on terminal formatting.

---

# 21. Output Purity

When machine-readable output is requested, diagnostic output must remain machine-readable.

Do not mix:

```text
spinner
ASCII decoration
debug logs
ANSI escape sequences
```

into JSON output.

Human-facing presentation belongs to terminal mode.

---

# 22. Application Orchestration

The application layer owns scan lifecycle.

Conceptual orchestration:

```text
ScanRequest
    ↓
Discover
    ↓
Collect
    ↓
Run Applicable Rules
    ↓
Normalize Findings
    ↓
Calculate Score
    ↓
Build Diagnostic Result
    ↓
Return Result
```

The orchestrator should not know the internal logic of every rule.

It should coordinate components through stable interfaces.

---

# 23. Result Object

The complete scan should produce a structured result.

Conceptually:

```text
ScanResult
├── metadata
├── scope
├── evidence summary
├── findings
├── score
├── statistics
└── execution status
```

This result becomes the single source consumed by reporting.

This prevents terminal output and JSON output from having separate diagnostic logic.

---

# 24. Error Architecture

YOWTF distinguishes between:

### Expected diagnostic limitation

Example:

```text
A tool is not installed.
```

This should normally become an unavailable/skipped condition where appropriate.

### Rule evaluation failure

A detector failed while evaluating valid evidence.

This should be represented explicitly and must not silently become a PASS.

### Collector failure

A collector could not obtain evidence.

The application should preserve this state so affected rules can respond appropriately.

### Fatal application failure

The CLI itself cannot perform the requested operation.

Examples:

- invalid invocation
- unrecoverable internal failure
- invalid configuration

Fatal errors may result in a non-zero process exit.

Exact exit-code behavior belongs to `CLI-SPEC.md`.

---

# 25. Failure Isolation

A single unavailable diagnostic should not unnecessarily terminate the entire scan.

Preferred behavior:

```text
Collector A → success
Collector B → success
Collector C → unavailable
Collector D → success
                  ↓
            continue scan
```

If one rule fails:

```text
Rule A → pass
Rule B → fail
Rule C → error
Rule D → pass
```

the system should preserve the error and continue where safe.

The implementation must not hide errors merely to produce a cleaner score.

---

# 26. Concurrency

Parallel collection may be used when it provides a measurable benefit and does not compromise:

- determinism
- resource usage
- output ordering
- safety
- error handling

Parallel execution must not cause nondeterministic user-visible ordering.

If concurrency is introduced, results must be normalized into a stable order before reporting.

---

# 27. Caching

Caching is not a default architectural requirement.

Any future caching must explicitly define:

- what is cached
- cache lifetime
- invalidation
- storage location
- privacy implications
- deterministic behavior
- CLI controls

No undocumented cache should be introduced.

---

# 28. Network Boundary

YOWTF is local-first and offline-first.

Normal V1 diagnostics must not require network access.

The architecture must not introduce:

- telemetry endpoints
- analytics services
- remote configuration
- mandatory update checks
- cloud scoring

A future network-dependent feature requires explicit specification approval.

---

# 29. Mutation Boundary

YOWTF V1 is diagnostic.

No architectural component should perform automatic repair.

Forbidden by default:

```text
npm install
pip install
brew install
apt install
winget install
kill process
delete files
edit configuration
modify environment variables
modify Git state
```

A future mutation feature must be specified separately and explicitly approved.

---

# 30. Privacy Boundary

The architecture follows data minimization.

YOWTF should collect only information necessary for the selected diagnostics.

Do not collect or transmit:

- source code unnecessarily
- secret values
- credentials
- personal files
- unrelated filesystem contents
- telemetry data

Local diagnostic results should remain local unless a future feature explicitly changes this rule.

---

# 31. Deterministic Ordering

User-visible collections should have stable ordering.

Examples:

- rules sorted by stable rule identifier
- findings sorted by defined severity/order
- tools sorted deterministically
- JSON arrays produced deterministically

This matters for:

- reproducibility
- snapshots
- tests
- debugging
- CI usage

---

# 32. Extensibility Model

YOWTF is intended to support additional diagnostics without rewriting the core engine.

A new diagnostic should generally require:

```text
1. Define requirement
2. Add/update specification
3. Define evidence
4. Add collector if needed
5. Add rule
6. Register rule
7. Add tests
8. Update catalogue
9. Validate output
```

Adding a rule should not require modifying unrelated rules.

---

# 33. New Platform Process

Adding a new platform must follow:

```text
Requirement
    ↓
Architecture review
    ↓
Platform interface definition
    ↓
Platform adapter
    ↓
Collector integration
    ↓
Rule compatibility
    ↓
Tests
    ↓
Documentation
```

Platform-specific behavior must not be added through scattered ad-hoc conditionals.

---

# 34. Testing Architecture

Tests should exist at multiple levels.

## Unit tests

Test:

- domain objects
- collectors
- individual rules
- scoring functions
- formatters

## Integration tests

Test:

- collector + detector integration
- command + application flow
- project discovery
- platform adapters

## CLI tests

Test:

- commands
- options
- exit behavior
- output modes
- error handling

## Regression tests

Every fixed production bug should receive a regression test where practical.

---

# 35. Test Isolation

Tests must not depend on the developer's actual machine state unless explicitly designed as environment tests.

Prefer fixtures and controlled evidence.

A detector should be testable with synthetic evidence:

```text
Given evidence X
When rule Y evaluates
Then finding Z is produced
```

This makes rules deterministic and portable.

---

# 36. Configuration Boundary

Configuration behavior must be explicitly documented.

No hidden configuration should be introduced.

If configuration is supported, its:

- location
- format
- precedence
- defaults
- validation
- environment interaction

must be defined in the relevant specification.

---

# 37. Logging and Debugging

Diagnostic reporting and internal debugging are separate concerns.

Normal output should not expose internal implementation details unnecessarily.

Debug logging, if supported, must:

- be explicitly enabled
- remain local
- avoid secrets
- avoid changing diagnostic conclusions
- avoid contaminating JSON output

---

# 38. Performance Architecture

YOWTF should be responsive for normal developer repositories.

Performance-sensitive operations include:

- filesystem traversal
- process enumeration
- port inspection
- runtime/tool discovery
- project discovery

The architecture should avoid:

- duplicate filesystem scans
- duplicate command execution
- unnecessary full-file reads
- repeated expensive detection work

Optimization must not violate correctness or documented behavior.

---

# 39. Anti-Patterns

The following architectural patterns are prohibited unless explicitly approved.

### God command

```text
command.ts
→ discovers everything
→ runs every rule
→ calculates score
→ prints everything
```

### Rule doing collection

```text
rule.ts
→ runs shell command
→ reads filesystem
→ evaluates condition
→ prints result
```

### Reporter doing detection

```text
reporter.ts
→ decides whether finding exists
```

### Scoring doing collection

```text
score.ts
→ executes commands
→ reads machine state
```

### Platform leakage

```text
random module
→ Windows shell command
→ macOS command
→ Linux command
```

without a platform abstraction.

### Silent mutation

```text
diagnostic
→ automatically fixes problem
```

These patterns undermine determinism, testability, and trust.

---

# 40. Architectural Invariants

The following must remain true:

1. YOWTF is local-first.
2. YOWTF V1 is read-only.
3. Normal V1 diagnostics do not require network access.
4. Collection gathers facts.
5. Rules evaluate evidence.
6. Scoring evaluates findings.
7. Reporting presents results.
8. CLI commands orchestrate use cases rather than implement diagnostic logic.
9. Platform-specific behavior is isolated.
10. Sensitive environment values are not unnecessarily collected.
11. Diagnostic results are structured before presentation.
12. Human output and machine output are separate presentation concerns.
13. Rules are independently testable.
14. User-visible ordering is deterministic.
15. Undocumented behavior is not automatically permitted.
16. Architectural changes require specification updates first.

---

# 41. Relationship With Other Specifications

This document does not define every product detail.

Use:

| Topic | Source of truth |
|---|---|
| Product goals and boundaries | `PRD.md` |
| Architecture | `ARCHITECTURE.md` |
| Dependencies and technology choices | `TECH-STACK.md` |
| CLI syntax and behavior | `CLI-SPEC.md` |
| Detection engine behavior | `DETECTION-ENGINE.md` |
| Score calculation | `SCORING.md` |
| Complete command inventory | `COMMANDS.md` |
| Complete rule inventory | `RULE-CATALOGUE.md` |
| Public project introduction | `README.md` |

If this document references a behavior owned by another specification, that specification controls the detailed behavior.

---

# 42. Change Control

Before changing architecture:

1. Identify the requirement.
2. Determine which specification owns the requirement.
3. Update the specification.
4. Review downstream impact.
5. Update affected specifications.
6. Implement the change.
7. Add or update tests.
8. Validate the complete system.

Do not:

- implement first and document later
- silently alter architecture
- add an abstraction without a real responsibility
- add a dependency merely for convenience
- introduce a new service without explicit approval

---

# 43. Antigravity Implementation Contract

When an AI coding agent works on YOWTF, it must:

1. Read the relevant documents before editing code.
2. Treat this architecture as authoritative for architecture.
3. Never invent undocumented modules or behavior.
4. Never silently expand scope.
5. Never silently remove documented behavior.
6. Keep dependency direction intact.
7. Keep collection separate from detection.
8. Keep detection separate from scoring.
9. Keep scoring separate from reporting.
10. Keep platform-specific logic isolated.
11. Preserve deterministic behavior.
12. Preserve read-only behavior.
13. Avoid network access unless explicitly authorized.
14. Avoid telemetry.
15. Avoid automatic repair.
16. Add tests for architectural behavior where appropriate.
17. Update documentation when architecture changes.
18. Stop and report if specifications conflict.
19. Stop and request clarification when implementation requires an undocumented architectural decision.
20. Do not treat AI suggestions, common patterns, or framework defaults as authorization.

---

# 44. Definition of Architectural Completion

The architecture is considered implemented when:

- all approved layers exist
- dependency direction is respected
- command logic is separated from diagnostics
- collectors are separated from rules
- rules are separated from scoring
- scoring is separated from reporting
- platform behavior is isolated
- diagnostic results are structured
- output modes consume the same result model
- failure handling is explicit
- deterministic ordering is preserved
- tests cover architectural boundaries
- documentation matches implementation

---

# 45. Final Architectural Definition

YOWTF is a **local-first, deterministic, read-only diagnostic pipeline** built around a strict separation between:

```text
CLI
 ↓
Application
 ↓
Collection
 ↓
Evidence
 ↓
Detection
 ↓
Evaluation
 ↓
Scoring
 ↓
Explanation
 ↓
Reporting
```

The architecture exists to make YOWTF:

- trustworthy
- explainable
- deterministic
- testable
- cross-platform
- privacy-conscious
- extensible
- safe to run on developer machines

The system should answer:

> **“What is wrong with this workstation or project, what evidence proves it, how much does it matter, and what should I inspect next?”**

without silently changing the environment it is diagnosing.

---

**End of `docs/ARCHITECTURE.md`**
