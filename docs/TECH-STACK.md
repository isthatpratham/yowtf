# YOWTF — Technology Stack Specification

**Document:** `docs/TECH-STACK.md`  
**Product:** YOWTF — Your Operating Workstation Trouble Finder  
**CLI:** `yowtf`  
**Status:** Source of Truth  
**Version:** 1.0  
**Audience:** YOWTF maintainers, contributors, reviewers, and AI coding agents

---

## 1. Purpose

This document freezes the technology choices for YOWTF V1.

It defines:

- runtime
- programming language
- package manager
- CLI framework
- terminal UI dependencies
- build tooling
- test tooling
- linting
- formatting
- package publishing
- source layout expectations
- dependency policy
- supported runtime environments

This document is authoritative for technology choices.

If implementation conflicts with this document, the implementation is incorrect unless this document is explicitly updated first.

---

# 2. Technology Philosophy

YOWTF is intentionally a small, local-first CLI.

Technology choices must optimize for:

1. reliability
2. portability
3. maintainability
4. deterministic behavior
5. fast startup
6. developer experience
7. minimal dependency surface
8. straightforward npm distribution

YOWTF should not introduce technology merely because it is fashionable or convenient.

Every dependency must have a clear responsibility.

---

# 3. Runtime

## 3.1 Node.js

**Required runtime:** Node.js 20+

Node.js is the execution runtime for YOWTF.

The implementation must support Node.js 20 and later compatible versions unless a future specification changes the minimum runtime.

---

## 3.2 Runtime Requirements

The CLI must:

- run directly through Node.js
- not require Python
- not require Java
- not require Docker
- not require a database
- not require a browser
- not require a remote service

Optional diagnostics may inspect whether other runtimes exist on the user's machine, but those runtimes are not YOWTF execution requirements.

---

# 4. Programming Language

## 4.1 TypeScript

**Language:** TypeScript

YOWTF source code must be written in TypeScript.

TypeScript is used for:

- CLI implementation
- application orchestration
- domain models
- collectors
- detection rules
- scoring
- reporting
- platform adapters
- tests

JavaScript may appear only where required by tooling/configuration or generated artifacts.

---

# 5. TypeScript Standards

The project should use strict TypeScript settings.

The compiler configuration should prioritize:

- strict type checking
- explicit boundaries
- predictable module behavior
- safe null handling
- maintainable imports

Avoid weakening TypeScript strictness merely to make an implementation compile.

Type assertions must not be used as a substitute for correct types.

---

# 6. Package Manager

## 6.1 pnpm

**Package manager:** pnpm

pnpm is the authoritative package manager for development.

The repository should contain the appropriate pnpm lockfile.

Developers and AI agents should prefer:

```bash
pnpm install
pnpm add
pnpm remove
pnpm run
```

over equivalent commands from other package managers.

---

# 7. Package Distribution

YOWTF is distributed through npm.

The published package provides the `yowtf` executable.

The package must expose the CLI through the npm `bin` field.

Conceptually:

```json
{
  "bin": {
    "yowtf": "..."
  }
}
```

The exact package metadata is finalized in the implementation and release configuration while remaining consistent with this document.

---

# 8. Package Naming

The package name must be unique and available for publication.

The CLI command is:

```text
yowtf
```

The repository identity and npm package identity may differ if npm naming constraints require it.

A package rename must not silently change the user-facing CLI command.

---

# 9. CLI Framework

## 9.1 Commander

**CLI framework:** Commander

Commander is responsible for:

- command definitions
- positional arguments
- options
- help generation
- command dispatch

Commander must not contain YOWTF diagnostic logic.

---

# 10. Terminal Output

YOWTF uses dedicated terminal libraries for presentation.

The approved V1 stack is:

- **Chalk** — terminal colors
- **Ora** — terminal spinners/progress indication where appropriate
- **Boxen** — boxed terminal presentation where appropriate
- **cli-table3** — tabular terminal output where appropriate

These libraries belong to the reporting/UI boundary.

They must not leak into:

- domain models
- detection rules
- scoring
- collectors

---

# 11. Chalk

Chalk is used for terminal styling.

Use it for:

- severity indicators
- emphasis
- status presentation
- headings
- readable terminal output

Do not store Chalk-formatted strings inside domain results.

Domain data must remain unformatted.

---

# 12. Ora

Ora may be used for terminal progress/spinner behavior.

Spinner behavior must:

- never alter diagnostic results
- never appear in JSON mode
- never leak ANSI control sequences into machine-readable output
- degrade safely when the output environment does not support interactive terminal behavior

Progress presentation is a UI concern, not a diagnostic concern.

---

# 13. Boxen

Boxen may be used for visually distinct terminal summaries.

It must remain a presentation dependency.

No core application logic may depend on Boxen.

---

# 14. cli-table3

cli-table3 may be used for structured terminal tables.

Tables should be generated from already-evaluated domain/application results.

The table renderer must not independently calculate findings or scores.

---

# 15. Build Tool

## 15.1 tsup

**Build tool:** tsup

tsup is used to package the TypeScript source into distributable JavaScript.

The build should produce the executable package artifact required by npm.

The build configuration must preserve runtime behavior required by the CLI.

---

# 16. Build Requirements

The production build must:

- compile TypeScript
- generate distributable JavaScript
- preserve the CLI entry point
- produce package-consumable output
- avoid shipping unnecessary development artifacts

The build must be reproducible.

---

# 17. Testing Framework

## 17.1 Vitest

**Test framework:** Vitest

Vitest is the authoritative test framework.

It is used for:

- unit tests
- detector tests
- collector tests
- scoring tests
- application tests
- CLI/integration tests where appropriate
- regression tests

---

# 18. Test Philosophy

Tests should verify documented behavior.

Tests must not define undocumented product behavior merely because an implementation happens to behave a certain way.

Preferred pattern:

```text
Specification
     ↓
Implementation
     ↓
Test
```

not:

```text
Implementation
     ↓
Whatever behavior appeared
     ↓
Test it
```

---

# 19. Test Categories

The project should support:

### Unit tests

For isolated components.

Examples:

- rule evaluation
- scoring
- domain transformations
- parsers
- formatters

### Integration tests

For interactions between components.

Examples:

- collector → rule
- discovery → collection
- application → reporting

### CLI tests

For:

- commands
- options
- exit codes
- output modes
- error behavior

### Regression tests

For previously identified bugs.

---

# 20. ESLint

**Linting:** ESLint

ESLint is used to enforce code-quality rules.

Linting should catch:

- invalid patterns
- unsafe constructs
- unused code
- consistency violations
- maintainability problems

Lint rules must support the architecture rather than obscure it.

---

# 21. Prettier

**Formatting:** Prettier

Prettier is the authoritative code formatter.

Formatting should be automated rather than manually negotiated.

Developers and AI agents should not introduce custom formatting conventions that conflict with Prettier.

---

# 22. Source Control

**Source control:** Git

The repository is managed through Git.

Git-related diagnostics are part of YOWTF's product scope, but YOWTF itself must not modify Git state during normal diagnostic execution.

---

# 23. GitHub

GitHub is the expected repository and CI/CD platform.

It may host:

- source code
- issues
- pull requests
- GitHub Actions
- release automation

YOWTF's runtime does not depend on GitHub being available.

---

# 24. CI

GitHub Actions is the intended CI platform.

CI should validate at minimum:

- installation
- type checking
- linting
- formatting
- tests
- build

The exact workflow configuration is an implementation concern, but CI must enforce the documented quality gates.

---

# 25. Release Automation

YOWTF uses automated release practices compatible with npm distribution.

The release system may use semantic versioning and Conventional Commits.

Release automation must not bypass:

- tests
- build validation
- package integrity checks

The exact release workflow is governed by repository configuration and must remain consistent with this document.

---

# 26. Semantic Versioning

YOWTF follows Semantic Versioning:

```text
MAJOR.MINOR.PATCH
```

Conceptually:

```text
MAJOR → breaking changes
MINOR → backward-compatible features
PATCH → backward-compatible fixes
```

Versioning rules must be applied consistently across package metadata and releases.

---

# 27. Conventional Commits

Commit messages should follow Conventional Commits.

Typical categories include:

```text
feat
fix
docs
style
refactor
test
chore
ci
perf
revert
```

The release configuration determines which commit categories contribute to version changes.

Commit conventions must not be treated as a substitute for product requirements.

---

# 28. Runtime Dependencies

The V1 runtime dependency surface should remain intentionally small.

Approved core dependencies are:

| Dependency | Responsibility |
|---|---|
| Commander | CLI parsing and command registration |
| Chalk | terminal styling |
| Ora | terminal progress/spinners |
| Boxen | terminal summary presentation |
| cli-table3 | terminal tables |

Dependencies should be added only when their responsibility cannot be reasonably fulfilled by existing approved tooling or the Node.js standard library.

---

# 29. Development Dependencies

The development toolchain includes:

| Tool | Responsibility |
|---|---|
| TypeScript | compilation/type checking |
| tsup | production bundling |
| Vitest | testing |
| ESLint | linting |
| Prettier | formatting |

Additional development dependencies require an explicit architectural/technology justification.

---

# 30. Node.js Standard Library

YOWTF should prefer the Node.js standard library for low-level system integration where practical.

Relevant built-in modules may include:

- `fs`
- `fs/promises`
- `path`
- `os`
- `child_process`
- `process`
- `util`
- `url`
- `crypto` only where a documented need exists

The standard library should be preferred over adding a dependency for trivial functionality.

---

# 31. No Database

YOWTF V1 does not use a database.

No requirement exists for:

- PostgreSQL
- SQLite
- MongoDB
- Redis
- local embedded databases

Diagnostic state is calculated from the current environment and project state.

---

# 32. No Backend

YOWTF V1 has no application backend.

There is no:

```text
API server
REST backend
GraphQL backend
cloud service
```

required for normal operation.

---

# 33. No Frontend Framework

YOWTF V1 does not use:

- React
- Vue
- Angular
- Next.js
- browser UI frameworks

YOWTF is a terminal application.

---

# 34. No AI Dependency

YOWTF V1 does not require:

- OpenAI APIs
- local LLMs
- AI agents
- embeddings
- vector databases
- cloud inference

Diagnostics must be deterministic and rule-based.

AI may be used externally during development, but AI is not part of the runtime architecture.

---

# 35. No Telemetry Dependency

YOWTF V1 does not use:

- analytics SDKs
- telemetry SDKs
- crash-reporting SaaS
- usage tracking
- remote diagnostics

The runtime dependency graph must not introduce telemetry indirectly.

---

# 36. No Mandatory Network Dependency

YOWTF V1 must work without network connectivity.

Do not add dependencies whose normal initialization requires:

- internet access
- DNS
- cloud authentication
- remote configuration

unless explicitly authorized by a future specification.

---

# 37. Docker

Docker is not required to run YOWTF V1.

YOWTF does not require:

```text
docker run ...
docker compose ...
container runtime
```

for normal usage.

Docker-related diagnostics may be added as a product feature only where specified.

Docker must not become a runtime dependency.

---

# 38. Package Manager Detection

YOWTF may diagnose developer package managers such as npm, pnpm, yarn, pip, and others where explicitly defined by the command/rule specifications.

These are **targets of diagnosis**, not runtime dependencies of YOWTF.

For example:

```text
YOWTF runtime
    ↓
Node.js

YOWTF diagnostic
    ↓
may inspect npm/pnpm/yarn
```

---

# 39. Runtime Detection

YOWTF may inspect installed runtimes such as:

- Node.js
- Python
- Java
- Go
- Rust
- PHP

The exact supported runtime catalogue is defined outside this document.

Detection targets must not become mandatory YOWTF dependencies.

---

# 40. Platform Support

The intended V1 operating systems are:

```text
Windows
macOS
Linux
```

Node.js provides the primary cross-platform runtime.

Platform-specific system information must be implemented through the architecture defined in `ARCHITECTURE.md`.

---

# 41. Platform-Specific Dependencies

Platform-specific native packages should be avoided unless required.

Before adding a native dependency, verify:

1. Node.js standard library cannot reasonably provide the capability.
2. The capability is explicitly required.
3. The dependency supports all intended platforms or has documented alternatives.
4. Installation remains practical for npm users.
5. CI can validate it.
6. The dependency does not introduce unwanted network or telemetry behavior.

---

# 42. Environment Compatibility

The CLI should behave safely in:

- interactive terminals
- non-interactive terminals
- CI environments
- redirected output
- piped output
- JSON consumers

Interactive presentation must not be assumed.

---

# 43. JSON Output

JSON output is a presentation feature, not a separate application pipeline.

The same structured diagnostic result should feed:

```text
Terminal reporter
JSON reporter
```

Do not implement independent diagnostic logic for JSON mode.

---

# 44. No ANSI in JSON

When JSON mode is selected:

- no Chalk formatting
- no spinner output
- no Boxen decorations
- no terminal table formatting
- no ANSI escape sequences

The output must be valid machine-readable JSON.

---

# 45. Configuration Technology

No configuration framework is required by default.

If YOWTF introduces persistent configuration, the format and storage mechanism must be explicitly specified before implementation.

Do not add a configuration library simply because other CLI tools use one.

---

# 46. Environment Variables

Environment variables may be used for documented CLI/runtime configuration where explicitly specified.

Undocumented environment variables must not silently alter diagnostic behavior.

Environment variable handling must not expose secret values.

---

# 47. Dependency Security

Dependencies should be:

- maintained
- necessary
- minimally scoped
- reviewed before adoption

Avoid dependencies with large transitive trees when a small standard-library implementation is sufficient.

Dependency upgrades should be tested against the full suite.

---

# 48. Dependency Addition Policy

Before adding a dependency, answer:

1. What exact capability does it provide?
2. Is that capability required by an approved specification?
3. Can Node.js provide it adequately?
4. Can an existing dependency provide it?
5. Does it affect startup time?
6. Does it affect package size?
7. Does it support Windows/macOS/Linux?
8. Does it introduce network behavior?
9. Does it introduce telemetry?
10. Does it introduce security or maintenance risk?

If the answer does not justify the dependency, do not add it.

---

# 49. Dependency Removal Policy

A dependency may be removed when:

- it is unused
- its responsibility has been eliminated
- Node.js standard library replaces it
- an approved dependency replaces it
- it conflicts with product constraints

Removal must include:

- code cleanup
- lockfile update
- test validation
- documentation update if required

---

# 50. Build Artifact Policy

Generated artifacts must not be treated as source.

The source of truth remains TypeScript source and repository configuration.

Typical generated content may include:

```text
dist/
coverage/
```

Generated artifacts should be excluded from source control unless explicitly required by the distribution workflow.

---

# 51. Package Contents

The npm package should contain only what users need to execute the CLI and what package metadata requires.

Avoid shipping:

- test fixtures
- development scripts
- internal documentation
- coverage output
- unnecessary source artifacts

unless explicitly required.

---

# 52. Startup Performance

CLI startup should remain lightweight.

Avoid:

- loading unnecessary modules for every invocation
- initializing expensive collectors before command dispatch
- network initialization
- heavyweight runtime frameworks

Command-specific functionality should be loaded only where useful when practical.

---

# 53. Determinism and Dependencies

Dependencies must not compromise deterministic diagnostics.

Avoid runtime behavior that depends on:

- remote metadata
- current web content
- random external services
- undocumented package state

If a dependency produces nondeterministic output, normalize it before it reaches the diagnostic result where practical.

---

# 54. Technology-to-Architecture Mapping

| Architectural responsibility | Technology |
|---|---|
| CLI parsing | Commander |
| Language | TypeScript |
| Runtime | Node.js 20+ |
| Package manager | pnpm |
| Terminal colors | Chalk |
| Progress/spinners | Ora |
| Terminal boxes | Boxen |
| Terminal tables | cli-table3 |
| Build | tsup |
| Testing | Vitest |
| Linting | ESLint |
| Formatting | Prettier |
| Source control | Git |
| CI | GitHub Actions |
| Distribution | npm |

This table is authoritative for V1 technology selection.

---

# 55. Technology Restrictions

The following are not part of YOWTF V1 unless explicitly approved:

- React
- Vue
- Angular
- Next.js
- Express
- Fastify
- NestJS
- PostgreSQL
- MongoDB
- Redis
- Docker as a runtime requirement
- Kubernetes
- cloud databases
- cloud APIs
- AI APIs
- telemetry SDKs
- hosted monitoring platforms

This list prevents accidental architecture drift.

---

# 56. Technology Change Process

Changing a core technology requires:

```text
Problem identified
      ↓
Requirement established
      ↓
Impact analysis
      ↓
TECH-STACK.md update
      ↓
Affected specifications updated
      ↓
Implementation
      ↓
Tests
      ↓
CI validation
```

Do not replace a technology because an AI agent prefers another library.

---

# 57. AI Coding Agent Rules

Antigravity and other coding agents must:

1. Read `TECH-STACK.md` before changing dependencies.
2. Use approved technologies where applicable.
3. Not introduce a new dependency without authorization.
4. Not replace a specified technology for convenience.
5. Not switch package managers.
6. Not introduce a backend.
7. Not introduce a database.
8. Not introduce a frontend framework.
9. Not introduce AI runtime dependencies.
10. Not introduce telemetry.
11. Not introduce mandatory network access.
12. Preserve Node.js 20+ compatibility.
13. Preserve pnpm as the package manager.
14. Preserve TypeScript as the implementation language.
15. Preserve Vitest for testing.
16. Preserve ESLint and Prettier.
17. Preserve tsup unless the specification is changed.
18. Update this document before implementing an approved technology change.
19. Stop if a requested feature cannot be implemented within the approved stack without an architectural decision.
20. Never interpret a library's popularity as permission to add it.

---

# 58. Technology Definition of Done

The V1 technology foundation is complete when:

- Node.js 20+ is supported
- TypeScript is configured
- pnpm is configured
- Commander is integrated
- terminal presentation dependencies are integrated where required
- tsup produces the production build
- Vitest executes the test suite
- ESLint validates source
- Prettier formats source
- npm packaging works
- CI validates the project
- no undocumented runtime dependency exists
- no mandatory network dependency exists
- no telemetry dependency exists
- platform support is preserved

---

# 59. Final Technology Definition

YOWTF V1 is a **TypeScript + Node.js 20+ CLI distributed through npm**, developed with **pnpm**, built with **tsup**, tested with **Vitest**, linted with **ESLint**, formatted with **Prettier**, and presented through **Commander + Chalk + Ora + Boxen + cli-table3**.

The stack is intentionally small.

The technology exists to support the architecture—not to become the architecture.

---

**End of `docs/TECH-STACK.md`**
