# YOWTF — Product Requirements Document

**Your Operating Workstation Trouble Finder**

> **Tagline:** Yo, WTF is happening?

---

## 1. Document Status

**Status:** Source of Truth  
**Document:** Product Requirements Document  
**Project:** YOWTF  
**Repository:** `isthatpratham/yowtf`

This document defines the product requirements, vision, scope, goals, constraints, principles, and non-goals of YOWTF.

This document is authoritative for product-level decisions.

### Source-of-Truth Rule

YOWTF is a specification-driven project.

Implementation must conform to the documentation under `/docs`.

If implementation conflicts with the documentation:

- The documentation takes precedence.
- The implementation must be corrected.
- Undocumented behavior must not be introduced silently.
- Features must not be added merely because they appear useful.
- Existing behavior must not be changed without an explicit specification change.
- If two specification documents conflict, implementation must stop until the conflict is resolved.

The README is public-facing documentation and is not the authority over the specifications in `/docs`.

---

# 2. Product Identity

## 2.1 Name

**YOWTF**

## 2.2 Full Name

**Your Operating Workstation Trouble Finder**

## 2.3 CLI Command

```bash
yowtf
```

## 2.4 Tagline

> **Yo, WTF is happening?**

## 2.5 Product Category

Developer workstation and project health diagnostics CLI.

---

# 3. Product Vision

YOWTF is a local-first command-line tool designed to help developers understand what is wrong with their development workstation and project environment.

Modern development environments accumulate:

- multiple runtime versions
- conflicting package managers
- stale processes
- occupied ports
- large caches
- disk pressure
- environment inconsistencies
- broken PATH configuration
- project-specific problems
- configuration problems
- development-tool inconsistencies

These problems are often difficult to diagnose because the information required to understand them is distributed across the operating system, developer tooling, project files, processes, and environment.

YOWTF brings these signals together into one deterministic diagnostic experience.

Its primary question is:

> **"Yo, WTF is happening on this machine?"**

YOWTF should identify problems, explain them, provide evidence, and recommend safe next steps.

---

# 4. Problem Statement

Developers frequently encounter problems that appear mysterious:

- "Why is port 3000 already in use?"
- "Why is Node using the wrong version?"
- "Why is my disk suddenly full?"
- "Why is this project behaving differently?"
- "Why isn't this command available?"
- "Why are multiple versions of the same runtime installed?"
- "Why is my environment behaving differently from what I expect?"
- "What processes are consuming development resources?"
- "What can safely be cleaned?"
- "What is actually wrong with my workstation?"

Existing system utilities generally provide raw information.

Existing developer tools often focus on only one area.

YOWTF should provide a developer-oriented diagnostic layer that connects these signals and presents the result in a concise, understandable form.

---

# 5. Product Goals

## 5.1 Primary Goals

YOWTF V1 must:

1. Diagnose developer workstation health.
2. Diagnose relevant project/environment health.
3. Detect common development-environment problems.
4. Explain detected problems in human-readable language.
5. Provide evidence supporting findings.
6. Provide actionable recommendations.
7. Provide an overall health score.
8. Provide deterministic results for the same environment state.
9. Work locally without requiring a remote service.
10. Protect sensitive information.
11. Remain read-only by default.
12. Provide a useful terminal-first experience.
13. Support machine-readable output where specified.
14. Be usable by developers without requiring deep operating-system knowledge.

---

# 6. Product Principles

YOWTF follows these principles.

## 6.1 Local First

YOWTF should perform diagnostics locally whenever possible.

The tool should not depend on a cloud service for core functionality.

## 6.2 Read First, Change Never by Default

YOWTF is primarily a diagnostic tool.

V1 must not modify the user's system or project automatically.

Detection and recommendations are allowed.

Automatic remediation is not part of the default V1 behavior.

## 6.3 Explain, Don't Just Report

YOWTF should not merely say:

```text
Port 3000 is occupied.
```

It should provide useful context where available:

```text
Port 3000 is occupied by a Node.js process.

PID: 12345
Process: node
```

The exact information exposed is governed by the relevant technical specifications.

## 6.4 Evidence-Based Diagnostics

Every actionable finding should be backed by observable evidence whenever practical.

YOWTF must not invent causes, system state, process information, versions, or other diagnostic facts.

If YOWTF cannot determine something reliably, it must communicate uncertainty instead of pretending certainty.

## 6.5 Deterministic Behavior

Given the same relevant system/project state, YOWTF should produce deterministic findings and scoring.

Ordering must not depend on:

- filesystem traversal order
- object insertion order
- process enumeration order
- nondeterministic timing
- network responses
- random values

## 6.6 Privacy by Default

YOWTF must treat environment information and developer-machine information as potentially sensitive.

It must not expose secrets unnecessarily.

Examples include:

- environment variable values
- API keys
- access tokens
- passwords
- private credentials
- sensitive filesystem information

The detection engine should collect only the minimum information required for a diagnostic rule.

## 6.7 No Telemetry by Default

YOWTF V1 must not send diagnostic information, system information, project information, or telemetry to a remote service.

## 6.8 Developer-Oriented

YOWTF is not intended to replace general operating-system monitoring software.

Its focus is the developer workstation and the problems developers encounter while building software.

---

# 7. Target Users

## 7.1 Primary Users

YOWTF is primarily intended for:

- software developers
- students learning software development
- full-stack developers
- backend developers
- frontend developers
- DevOps engineers
- developers working across multiple projects
- developers managing multiple runtimes and toolchains

## 7.2 Secondary Users

Potential secondary users include:

- technical educators
- development teams
- support engineers
- contributors troubleshooting development environments

---

# 8. Core Use Cases

## 8.1 General Health Check

A developer wants a quick overview of their workstation.

```bash
yowtf
```

YOWTF should perform the default health scan and summarize important findings.

## 8.2 Diagnose Problems

A developer knows something is wrong but does not know what.

```bash
yowtf doctor
```

YOWTF should provide deeper diagnostic information.

## 8.3 Understand a Finding

A developer wants to understand why something was flagged.

```bash
yowtf explain
```

YOWTF should explain relevant findings and their evidence.

## 8.4 Inspect System Resources

A developer wants to understand resource-related problems.

Examples:

```bash
yowtf system
yowtf disk
yowtf processes
yowtf ports
```

## 8.5 Inspect Development Tooling

A developer wants to understand their installed development environment.

Examples:

```bash
yowtf runtimes
yowtf tools
yowtf versions
yowtf paths
```

## 8.6 Inspect Project Health

A developer wants to diagnose the current project's environment.

Examples:

```bash
yowtf project
yowtf deps
yowtf env
yowtf config
yowtf git
```

## 8.7 Find Cleanup Opportunities

A developer wants to know what is consuming unnecessary space.

```bash
yowtf clean
```

YOWTF should identify potential cleanup candidates without deleting anything by default.

---

# 9. Product Scope

YOWTF is composed of several diagnostic domains.

## 9.1 System Health

YOWTF may inspect relevant system-level information including:

- operating system
- architecture
- CPU information
- memory usage
- disk usage
- uptime
- relevant system resources

## 9.2 Development Processes

YOWTF may inspect developer-relevant running processes.

Examples include processes associated with:

- Node.js
- Python
- Java
- development servers
- databases
- development tooling

The exact supported process detection behavior is defined in the Detection Engine and Rule Catalogue.

## 9.3 Ports

YOWTF may inspect development-related listening or occupied ports.

It should help identify:

- occupied development ports
- the process associated with an occupied port where safely available
- potential conflicts affecting development

## 9.4 Runtime Environment

YOWTF may detect installed and active developer runtimes.

Potential runtime families include:

- Node.js
- Python
- Java
- Go
- Rust
- PHP

The final supported runtime list is defined by the technical specifications and rule catalogue.

## 9.5 Developer Tools

YOWTF may inspect relevant developer tools such as:

- Git
- npm
- pnpm
- yarn
- pip
- package managers
- compilers
- development utilities

The supported tool set is defined outside this document.

## 9.6 Environment

YOWTF may inspect environment configuration for diagnostic purposes.

YOWTF must never unnecessarily expose environment variable values.

Environment-related rules must follow the privacy requirements defined by the Detection Engine and Rule Catalogue.

## 9.7 Project Health

YOWTF may inspect a project's:

- package/dependency configuration
- runtime configuration
- environment requirements
- Git state
- project configuration
- generated/build artifacts
- dependency directories
- relevant metadata

## 9.8 Storage and Cleanup

YOWTF may identify:

- package caches
- build artifacts
- dependency directories
- temporary development artifacts
- other developer-related storage consumers

V1 cleanup diagnostics are read-only.

---

# 10. V1 Product Boundary

YOWTF V1 is a **diagnostic tool**, not an automated system administrator.

V1 should:

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

V1 should not automatically:

- delete files
- kill processes
- modify environment variables
- modify PATH
- install software
- uninstall software
- modify project files
- modify Git history
- modify package manifests
- modify lockfiles
- modify configuration
- change operating-system settings

Any future remediation capability must be explicitly specified before implementation.

---

# 11. Safety Requirements

## 11.1 Read-Only Default

All V1 commands must be read-only unless explicitly documented otherwise.

## 11.2 No Destructive Actions

YOWTF must not perform destructive operations implicitly.

For example:

```bash
yowtf clean
```

must not silently delete anything.

The command should report cleanup candidates.

## 11.3 No Secret Leakage

YOWTF must not display secret values discovered in:

- environment variables
- configuration files
- project files
- process arguments
- credentials

when those values are not required for the diagnostic.

## 11.4 No Automatic Network Dependency

Core diagnostics must not require an internet connection.

Network diagnostics may inspect local networking state where required, but YOWTF must not silently upload diagnostic information.

---

# 12. Offline-First Requirement

YOWTF must be capable of performing its core diagnostics without network connectivity.

The following must not require network access:

- system inspection
- runtime inspection
- process inspection
- port inspection
- filesystem inspection
- project inspection
- Git inspection
- scoring
- reporting

Any future network-dependent feature must be explicitly specified.

---

# 13. Deterministic Diagnostics

YOWTF should produce stable results.

Examples of deterministic behavior:

- findings have stable IDs
- findings have deterministic ordering
- scores are calculated using documented rules
- command output follows documented ordering
- identical input state produces equivalent results

The tool must not rely on randomness for diagnostics.

---

# 14. Health Score

YOWTF will provide a health score representing the detected health of the workstation/project environment.

The score:

- must be deterministic
- must be derived from documented findings
- must use documented severity and penalty rules
- must not be arbitrary
- must be explainable

The complete scoring model is defined in:

```text
docs/SCORING.md
```

That document is authoritative for scoring behavior.

---

# 15. Findings

YOWTF findings represent detected problems, warnings, or informational conditions.

A finding should contain enough information to answer:

1. What is wrong?
2. Why does YOWTF consider it a problem?
3. What evidence supports it?
4. What impact could it have?
5. What should the developer consider doing?

The exact finding structure is defined in:

```text
docs/DETECTION-ENGINE.md
```

and:

```text
docs/RULE-CATALOGUE.md
```

---

# 16. Command-Line Experience

YOWTF is a CLI-first product.

The default command:

```bash
yowtf
```

should provide a concise health-oriented overview.

Detailed commands should allow developers to investigate specific areas.

The complete command surface is defined in:

```text
docs/COMMANDS.md
```

The behavioral and interface contract is defined in:

```text
docs/CLI-SPEC.md
```

Those documents are authoritative for CLI behavior.

---

# 17. Output Modes

YOWTF should support human-readable terminal output.

Where specified by the CLI specification, it may also provide:

- JSON output
- quiet output
- verbose output
- color/no-color output

Output must remain deterministic.

The exact output contract belongs to:

```text
docs/CLI-SPEC.md
```

---

# 18. Project Analysis

When executed inside a project, YOWTF should be capable of understanding relevant project context.

Potential project information includes:

- project root
- project type
- package/dependency manager
- runtime metadata
- environment configuration
- Git state
- configuration files
- dependency state
- relevant filesystem information

YOWTF must not assume a project is a particular language or framework without evidence.

---

# 19. Platform Support

YOWTF is intended to support common developer operating systems.

Initial platform targets should prioritize:

- Windows
- macOS
- Linux

Platform-specific behavior must be isolated behind appropriate platform abstractions.

The implementation must not assume Unix-only behavior when equivalent cross-platform functionality is required.

The exact technical implementation belongs in:

```text
docs/ARCHITECTURE.md
```

and:

```text
docs/TECH-STACK.md
```

---

# 20. Performance Goals

YOWTF should feel fast enough for frequent developer use.

The default health scan should avoid unnecessary:

- filesystem traversal
- process spawning
- expensive computation
- repeated work
- network calls

Diagnostics should collect only the information required by enabled rules.

---

# 21. Extensibility

YOWTF should be designed so new diagnostic rules can be added without rewriting the entire application.

The detection architecture should support:

- independent rules/detectors
- rule identifiers
- categories
- severity
- evidence
- recommendations
- deterministic execution
- failure isolation

The exact architecture is defined in:

```text
docs/ARCHITECTURE.md
```

and:

```text
docs/DETECTION-ENGINE.md
```

---

# 22. Rule Governance

Every detection rule implemented in YOWTF must have a documented rule definition.

A rule must not exist only in source code.

Each rule should have:

- unique ID
- category
- description
- detection logic
- severity
- evidence requirements
- impact
- recommendation
- limitations where applicable

The authoritative rule list is:

```text
docs/RULE-CATALOGUE.md
```

---

# 23. Command Governance

Every supported YOWTF command must be documented.

A command must not exist only in source code.

Each command should have a documented:

- name
- purpose
- arguments
- options
- behavior
- output expectations
- error behavior
- safety characteristics

The authoritative command catalogue is:

```text
docs/COMMANDS.md
```

---

# 24. Non-Goals

The following are explicitly outside the core V1 product scope.

## 24.1 Full System Monitoring

YOWTF is not intended to replace:

- Task Manager
- Activity Monitor
- `top`
- `htop`
- dedicated infrastructure monitoring systems

## 24.2 Antivirus

YOWTF is not an antivirus product.

It may identify suspicious developer-environment conditions where explicitly specified, but it is not intended to provide malware detection.

## 24.3 Full Security Scanner

YOWTF is not a dedicated security scanner or penetration-testing framework.

Security-related checks must remain within explicitly documented scope.

## 24.4 Automatic Repair

YOWTF V1 does not automatically repair detected problems.

## 24.5 Package Manager Replacement

YOWTF does not replace:

- npm
- pnpm
- yarn
- pip
- apt
- brew
- chocolatey
- other package managers

## 24.6 Process Manager

YOWTF does not replace:

- PM2
- systemd
- Docker
- Kubernetes
- operating-system process managers

## 24.7 Cloud Monitoring

YOWTF V1 is not a hosted monitoring platform.

## 24.8 Telemetry Platform

YOWTF does not collect centralized telemetry in V1.

## 24.9 AI Assistant

AI is not required for core YOWTF diagnostics.

The diagnostic engine must function without an AI service.

Any future AI functionality requires an explicit specification.

---

# 25. Docker Scope

Docker is not a required dependency for YOWTF V1.

YOWTF must not require Docker to perform its core diagnostics.

Docker-specific diagnostics may be considered separately in the future but are not automatically included in V1.

---

# 26. Network Scope

YOWTF is fundamentally local-first.

The product must not require internet access for its core functionality.

Network-related diagnostics may inspect the local network environment when explicitly specified.

Remote services, cloud APIs, and external telemetry are not part of the core V1 diagnostic model.

---

# 27. Telemetry and Data Collection

YOWTF V1 collects no telemetry by default.

It must not silently transmit:

- system information
- project information
- filesystem information
- environment information
- diagnostic findings
- usage statistics

The default diagnostic flow remains local.

---

# 28. Failure Philosophy

A diagnostic failure must not necessarily terminate the entire scan.

If one subsystem cannot be inspected, YOWTF should continue with other diagnostics where safe.

Examples:

- inability to inspect one process
- unavailable runtime
- inaccessible directory
- unsupported platform feature
- malformed project metadata

The exact failure-isolation behavior is defined by the Detection Engine specification.

---

# 29. Unsupported or Unavailable Information

YOWTF must distinguish between:

- detected healthy state
- detected problem
- unavailable information
- unsupported functionality
- skipped diagnostics
- diagnostic errors

It must not turn unavailable information into fabricated findings.

---

# 30. Versioning

YOWTF follows semantic versioning.

```text
MAJOR.MINOR.PATCH
```

Version changes must follow the project's release policy.

Release automation and package publishing behavior are implementation/tooling concerns and must be defined separately.

---

# 31. Documentation Requirements

The following documents form the YOWTF specification set:

```text
docs/
├── PRD.md
├── ARCHITECTURE.md
├── TECH-STACK.md
├── CLI-SPEC.md
├── DETECTION-ENGINE.md
├── SCORING.md
├── COMMANDS.md
└── RULE-CATALOGUE.md
```

Each document is authoritative for its defined area.

The README is created after the specification set is complete.

---

# 32. Specification Change Policy

A specification must be updated before implementing behavior that changes the specification.

The correct order is:

```text
Requirement
    ↓
Specification update
    ↓
Review / approval
    ↓
Implementation
    ↓
Tests
    ↓
Validation
```

Not:

```text
Code first
    ↓
Maybe update docs later
```

---

# 33. Antigravity Implementation Rule

Antigravity and any other coding agent working on YOWTF must follow these rules:

1. Read the relevant `/docs` files before implementation.
2. Treat the documentation as the ultimate source of truth.
3. Never invent undocumented functionality.
4. Never silently expand product scope.
5. Never silently remove documented functionality.
6. Never change documented behavior because an alternative appears more convenient.
7. Never infer a requirement when the specification is ambiguous.
8. If specifications conflict, stop and report the conflict.
9. If implementation requires a specification change, update the specification first.
10. Every command must map to `COMMANDS.md`.
11. Every rule must map to `RULE-CATALOGUE.md`.
12. Every scoring behavior must map to `SCORING.md`.
13. Every architectural behavior must conform to `ARCHITECTURE.md`.
14. Every CLI behavior must conform to `CLI-SPEC.md`.
15. Tests must validate documented behavior.
16. Do not introduce dependencies, services, telemetry, network requirements, or automated mutations unless explicitly authorized by the specifications.
17. Do not modify unrelated functionality while implementing a scoped task.
18. Do not treat personal assumptions, common industry patterns, or AI-generated suggestions as requirements.
19. If something is not specified, it is not automatically approved.
20. Prefer stopping and asking for clarification over making a product-level assumption.

---

# 34. V1 Definition of Done

YOWTF V1 is considered complete only when:

- all V1 commands are documented
- all V1 rules are documented
- all V1 rules are implemented
- detection behavior matches the rule catalogue
- CLI behavior matches the CLI specification
- scoring behavior matches the scoring specification
- architecture boundaries are respected
- tests cover documented behavior
- diagnostics are read-only by default
- secrets are not unnecessarily exposed
- core functionality works offline
- deterministic behavior is preserved
- supported platforms are validated
- build and packaging succeed
- CI passes
- release validation passes

---

# 35. Final Product Definition

YOWTF is a developer-focused, local-first diagnostic CLI that answers one simple question:

> **"Yo, WTF is happening on my workstation?"**

It inspects the machine and relevant project environment, identifies problems, provides evidence and explanations, calculates a documented health score, and recommends safe next steps.

It does not silently modify the user's machine.

It does not require a cloud service.

It does not rely on AI for core diagnostics.

It does not invent information.

It does not expand its scope without specification.

Its core philosophy is:

> **Find the problem. Explain the problem. Don't become the problem.**

---

**YOWTF**

**Your Operating Workstation Trouble Finder**

*Yo, WTF is happening?*
