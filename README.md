<p align="center">
  <img src="images/white-logo.png" alt="YOWTF — Your Operating Workstation Trouble Finder" width="500">
</p>

<p align="center">
 <strong>Your Operating Workstation Trouble Finder
</p>

> **Yo, WTF is happening?**

YOWTF is a **local-first, read-only developer workstation and project health diagnostic CLI**.

It looks at your machine, development environment, project configuration, runtimes, tools, ports, dependencies, Git state, storage, and other developer-facing signals — then explains what may be wrong, why it matters, and where to look next.

No telemetry.  
No cloud dashboard.  
No AI required.  
No automatic fixes.  
No modifying your project.

Just run it.

```bash
yowtf
```

---

## Why YOWTF?

Every developer eventually hits one of these:

- "Why is Node using the wrong version?"
- "Why is this port already occupied?"
- "Why does this project work on my machine but not theirs?"
- "Why is my disk suddenly full?"
- "Which Node/Python/Git installation is actually being used?"
- "Why does this command work in one terminal but not another?"
- "Why is this project using a different package manager?"
- "Why did this build suddenly become painfully slow?"
- "What the hell is wrong with this machine?"

Usually, the answer is buried somewhere between:

```text
PATH
environment variables
runtime versions
duplicate installations
ports
processes
disk usage
project configuration
dependency metadata
lockfiles
Git state
developer caches
```

YOWTF brings those signals together into one deterministic diagnostic workflow.

---

# ✨ What YOWTF Does

YOWTF follows a structured diagnostic pipeline:

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

It doesn't just dump system information.

It turns collected evidence into **findings**.

Each finding can contain:

- rule ID
- category
- status
- severity
- confidence
- explanation
- evidence
- impact
- remediation hint

The goal is simple:

> **Don't just tell the developer what exists. Tell them what deserves attention and why.**

---

# 🚀 Features

## 🖥️ Workstation Diagnostics

Inspect developer-facing system health:

- operating system
- architecture
- memory
- CPU pressure
- uptime
- disk space
- developer storage

---

## ⚙️ Process Diagnostics

Identify potentially problematic development processes:

- high CPU processes
- high memory processes
- zombie/defunct processes where supported
- suspicious duplicate development processes

YOWTF **never kills processes**.

---

## 🔌 Port Diagnostics

Understand what is listening on your machine:

- development port conflicts
- duplicate listeners
- unexpected development-service exposure
- ports whose owning process cannot be identified

YOWTF does not terminate anything.

---

## 🌐 Network Diagnostics

Inspect local network configuration relevant to development:

- network interface availability
- DNS configuration
- proxy configuration
- route information

YOWTF does not require a remote monitoring service.

---

## 🔐 Environment Diagnostics

Inspect environment metadata without dumping sensitive values.

Examples:

- empty PATH entries
- duplicate PATH entries
- shell/PATH mismatches
- suspicious secret-like environment variable names

### Privacy by default

YOWTF does **not** need to print:

```text
API_KEY=...
DATABASE_PASSWORD=...
TOKEN=...
SECRET=...
```

When environment inspection is required, YOWTF works primarily with **names and metadata**, not secret values.

---

## 🧩 Runtime Diagnostics

Detect runtime-related problems across applicable projects:

- Node.js
- Python
- Java
- other supported runtime contexts defined by the V1 rule set

Examples:

```text
runtime.version.mismatch
runtime.node.unpinned
runtime.python.unpinned
```

---

## 🛠️ Developer Tool Diagnostics

Inspect important developer tooling:

- Git
- package managers
- Docker when relevant
- executable resolution
- tool conflicts

This is particularly useful when your machine has accumulated multiple installations over time.

---

## 🛣️ PATH Diagnostics

PATH problems are classic developer-machine problems.

YOWTF can identify:

- missing expected executables
- multiple executable installations
- invalid PATH entries
- PATH-order shadowing

For example:

```text
node
 ├── C:\Program Files\nodejs\node.exe
 └── C:\Users\you\AppData\Roaming\npm\node.exe
```

If PATH ordering means the wrong executable wins, YOWTF can surface that relationship.

---

## 📦 Project Diagnostics

YOWTF can inspect a project for issues involving:

- project manifests
- lockfiles
- runtime policies
- project-root ambiguity
- package-manager expectations
- environment configuration

Run against the current directory:

```bash
yowtf project
```

Or explicitly target another directory:

```bash
yowtf --path ./my-project project
```

---

## 📚 Dependency Diagnostics

YOWTF can detect problems such as:

- missing lockfiles
- dependency metadata mismatches
- package-manager mismatches
- inconsistent local dependency state

YOWTF does **not** reinstall dependencies for you.

---

## 🌿 Git Diagnostics

Inspect local Git state:

- repository availability
- dirty working tree
- untracked files
- branch divergence

YOWTF does not:

```text
commit
reset
stash
checkout
pull
push
```

It observes.

---

## 🧹 Cache & Storage Diagnostics

Find developer storage pressure caused by recognized:

- caches
- build artifacts
- dependency-related directories
- other supported developer storage locations

The `clean` command is intentionally diagnostic.

It helps you decide what is safe to review.

It does **not** silently delete things.

---

# 📊 Health Score

YOWTF produces a health score from:

```text
0 → 100
```

Higher is better.

The V1 scoring model starts at:

```text
100
```

and applies penalties based on finding severity.

| Severity | Penalty |
| -------- | ------: |
| CRITICAL |      25 |
| HIGH     |      15 |
| MEDIUM   |       8 |
| LOW      |       3 |
| INFO     |       0 |

A `FAIL` finding receives its full severity penalty.

A `WARN` finding receives 50% of its severity penalty.

`PASS`, `SKIPPED`, `UNAVAILABLE`, and `ERROR` findings do not directly reduce the score.

The score is clamped to:

```text
0–100
```

### Score bands

|  Score | Health       |
| -----: | ------------ |
| 90–100 | 🟢 EXCELLENT |
|  75–89 | GOOD         |
|  60–74 | FAIR         |
|  40–59 | POOR         |
|   0–39 | CRITICAL     |

### Important

The score is **not** a security rating.

It is a deterministic diagnostic health indicator for the scope YOWTF evaluated.

Coverage and score are separate concepts.

A partial scan may still have a valid score for its evaluated scope.

---

# 🔎 Findings

A typical diagnostic finding is conceptually represented as:

```text
Rule
 ├── ID
 ├── Category
 ├── Status
 ├── Severity
 ├── Confidence
 ├── Title
 ├── Summary
 ├── Evidence
 ├── Impact
 └── Remediation Hint
```

Example:

```text
[HIGH] runtime.version.mismatch

Node.js 18.x is active, but the project requires Node.js >=20.

Why it matters:
The project may fail to build or behave differently from
environments using the required runtime.

What to do:
Use the project's documented Node.js version.
```

The exact terminal presentation is defined by the CLI/reporting specifications.

---

# 🧠 Deterministic by Design

YOWTF does not ask an AI model:

> "Does this machine look healthy?"

The diagnostic engine uses explicit rules.

That means the same evidence should produce the same result.

```text
Evidence
   ↓
Rule
   ↓
Finding
   ↓
Score
```

No hidden model.

No probabilistic health score.

No remote recommendation engine.

---

# 🔒 Privacy

YOWTF is designed around data minimization.

### By default

YOWTF:

- runs locally
- does not require an account
- does not require a backend
- does not send telemetry
- does not upload scan results
- does not require a cloud dashboard
- does not intentionally expose environment secret values

### YOWTF does not silently collect:

```text
telemetry
analytics
usage tracking
cloud diagnostics
remote machine inventory
```

The product is intentionally local-first.

---

# 🧱 Read-Only by Default

YOWTF is a diagnostic tool, not a repair tool.

It does not automatically:

```text
delete files
install software
uninstall software
modify PATH
modify environment variables
kill processes
modify project files
modify dependencies
modify Git state
commit changes
reset repositories
```

If YOWTF tells you:

```text
Your cache is huge.
```

it doesn't immediately delete the cache.

If it tells you:

```text
Your Node version is wrong.
```

it doesn't change your Node installation.

You stay in control.

---

# 🌍 Cross-Platform

V1 targets:

- Windows
- macOS
- Linux

Not every operating system exposes the same diagnostics.

YOWTF therefore distinguishes between:

```text
PASS
FAIL
WARN
SKIPPED
UNAVAILABLE
ERROR
```

An unavailable platform capability is not automatically treated as a failure.

---

# 📦 Installation

YOWTF is distributed through npm.

Install globally:

```bash
npm install -g @isthatpratham/yowtf
```

Or with pnpm:

```bash
pnpm add -g @isthatpratham/yowtf
```

Then:

```bash
yowtf
```

Check the installed version:

```bash
yowtf --version
```

---

# ⚡ Quick Start

From a project directory:

```bash
yowtf
```

For the full health-oriented diagnostic workflow:

```bash
yowtf doctor
```

Check the score:

```bash
yowtf score
```

Understand the findings:

```bash
yowtf explain
```

Inspect a specific area:

```bash
yowtf runtimes
yowtf ports
yowtf processes
yowtf env
yowtf git
yowtf deps
```

---

# 🧰 Commands

YOWTF V1 exposes the following commands:

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

---

# 📖 Command Overview

| Command           | Purpose                                  |
| ----------------- | ---------------------------------------- |
| `yowtf`           | Full/default diagnostic scan             |
| `yowtf doctor`    | Health-oriented diagnostic scan          |
| `yowtf score`     | Show health score                        |
| `yowtf explain`   | Explain detected findings                |
| `yowtf system`    | System diagnostics                       |
| `yowtf disk`      | Disk/storage diagnostics                 |
| `yowtf processes` | Process diagnostics                      |
| `yowtf ports`     | Port diagnostics                         |
| `yowtf network`   | Local network diagnostics                |
| `yowtf env`       | Environment diagnostics                  |
| `yowtf runtimes`  | Runtime diagnostics                      |
| `yowtf tools`     | Developer tool diagnostics               |
| `yowtf paths`     | PATH/executable diagnostics              |
| `yowtf versions`  | Version conflict/requirement diagnostics |
| `yowtf project`   | Project diagnostics                      |
| `yowtf deps`      | Dependency diagnostics                   |
| `yowtf git`       | Git diagnostics                          |
| `yowtf config`    | Configuration diagnostics                |
| `yowtf caches`    | Developer cache diagnostics              |
| `yowtf clean`     | Cleanup candidate diagnostics            |

---

# 🎛️ Global Options

All commands support the documented global options where applicable.

```text
-h, --help
-V, --version
--verbose
--no-color
--json
--quiet
--path <dir>
```

### Examples

JSON output:

```bash
yowtf --json
```

Verbose output:

```bash
yowtf --verbose
```

Disable colors:

```bash
yowtf --no-color
```

Quiet mode:

```bash
yowtf --quiet
```

Analyze another project:

```bash
yowtf --path ./some-project
```

---

# 🤖 JSON Output

YOWTF supports machine-readable output.

```bash
yowtf --json
```

This is intended for:

- scripts
- CI workflows
- local automation
- debugging
- future integrations

When JSON mode is active, terminal decoration must not contaminate the machine-readable output.

---

# 🚦 Exit Codes

YOWTF V1 defines:

| Code | Meaning                                                               |
| ---: | --------------------------------------------------------------------- |
|  `0` | Successful execution with no blocking CLI/application error           |
|  `1` | Diagnostic/application failure requiring a non-success process result |
|  `2` | CLI usage error                                                       |

Diagnostic findings and process exit behavior are governed by the CLI specification.

---

# 🧪 Example Workflow

Imagine a project requiring Node.js 20.

Your machine resolves:

```text
Node.js 18.20.x
```

YOWTF might identify:

```text
runtime.version.mismatch
```

and explain:

```text
Project requirement:
Node.js >= 20

Resolved runtime:
Node.js 18.20.x

Impact:
The project may fail to build or behave differently
from environments using the required runtime.
```

Instead of blindly changing your environment, YOWTF gives you enough evidence to investigate.

---

# 🧩 V1 Rule Catalogue

YOWTF V1 defines **60 diagnostic rules** across 15 categories.

```text
System
Disk
Processes
Ports
Network
Environment
Runtimes
Tools
Paths
Versions
Project
Dependencies
Git
Configuration
Caches
```

Examples include:

```text
system.memory.pressure
disk.space.low
process.resource.hog
port.development.conflict
environment.path.empty-entry
runtime.node.unpinned
tool.executable.shadowing
path.order.shadowing
version.runtime.conflict
project.lockfile.missing
dependency.lockfile.mismatch
git.working-tree.dirty
config.required.value.missing
cache.storage.large
```

The complete authoritative rule inventory is maintained in:

```text
docs/RULE-CATALOGUE.md
```

---

# 🏗️ Architecture

YOWTF is structured as a layered diagnostic system.

```text
┌──────────────────────────────┐
│             CLI              │
├──────────────────────────────┤
│        Application           │
├──────────────────────────────┤
│           Domain             │
├──────────────────────────────┤
│         Collection           │
├──────────────────────────────┤
│          Platform            │
├──────────────────────────────┤
│         Detection            │
├──────────────────────────────┤
│          Scoring             │
├──────────────────────────────┤
│         Reporting            │
└──────────────────────────────┘
```

The conceptual flow is:

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

The architecture is designed so that:

- collectors collect evidence
- rules evaluate evidence
- scoring calculates health
- reporting renders results
- CLI handles user interaction

These concerns remain separated.

---

# 🛠️ Technology

YOWTF V1 uses:

- Node.js 20+
- TypeScript
- pnpm
- Commander
- Chalk
- Ora
- Boxen
- cli-table3
- tsup
- Vitest
- ESLint
- Prettier
- Git
- GitHub Actions
- npm

The project intentionally does **not** require:

- a database
- a backend
- a frontend framework
- a cloud service
- an AI service
- telemetry infrastructure
- a mandatory network service

---

# 📁 Project Structure

The implementation follows the architecture specification.

Conceptually:

```text
yowtf/
├── docs/
│   ├── PRD.md
│   ├── ARCHITECTURE.md
│   ├── TECH-STACK.md
│   ├── CLI-SPEC.md
│   ├── DETECTION-ENGINE.md
│   ├── SCORING.md
│   ├── COMMANDS.md
│   └── RULE-CATALOGUE.md
│
├── src/
│   ├── cli/
│   ├── application/
│   ├── domain/
│   ├── collection/
│   ├── platform/
│   ├── detection/
│   ├── scoring/
│   └── reporting/
│
├── tests/
├── package.json
├── tsconfig.json
├── tsup.config.ts
└── README.md
```

The exact implementation structure is governed by:

```text
docs/ARCHITECTURE.md
```

---

# 🧪 Development

Clone the repository:

```bash
git clone https://github.com/isthatpratham/yowtf.git
cd yowtf
```

Install dependencies:

```bash
pnpm install
```

Run tests:

```bash
pnpm test
```

Run the test suite in watch mode:

```bash
pnpm test --watch
```

Build:

```bash
pnpm build
```

Run linting:

```bash
pnpm lint
```

Format code:

```bash
pnpm format
```

The exact development workflow is governed by the project documentation.

---

# 🧬 Documentation

The `/docs` directory is the project's technical source of truth.

### Product

```text
docs/PRD.md
```

Defines what YOWTF is, why it exists, scope, goals, non-goals, and V1 definition of done.

### Architecture

```text
docs/ARCHITECTURE.md
```

Defines system structure, layers, boundaries, data flow, and architectural invariants.

### Technology

```text
docs/TECH-STACK.md
```

Defines the approved technology stack and dependency policy.

### CLI

```text
docs/CLI-SPEC.md
```

Defines public CLI behavior.

### Detection

```text
docs/DETECTION-ENGINE.md
```

Defines evidence, collectors, rules, findings, applicability, evaluation, and detection behavior.

### Scoring

```text
docs/SCORING.md
```

Defines the numerical health-score model.

### Commands

```text
docs/COMMANDS.md
```

Defines the complete V1 command catalogue.

### Rules

```text
docs/RULE-CATALOGUE.md
```

Defines the complete V1 diagnostic rule inventory.

---

# 📜 Documentation Is the Source of Truth

YOWTF follows a strict documentation-first development model.

The hierarchy is:

```text
Specification
    ↓
Implementation
    ↓
Tests
    ↓
README
```

If implementation conflicts with the specification:

> **The implementation is wrong.**

If README conflicts with the specification:

> **The README is wrong.**

If two specifications conflict:

> **Stop and resolve the conflict before implementation.**

Undocumented behavior is not automatically approved behavior.

---

# 🤖 AI Coding Agent Policy

YOWTF is designed to be friendly to AI-assisted development without allowing AI to silently define the product.

AI coding agents must:

- read the relevant documentation first
- follow the documented architecture
- use only documented commands
- use only documented rules
- use documented thresholds
- preserve stable rule IDs
- add tests
- avoid undocumented dependencies
- avoid undocumented network behavior
- avoid undocumented mutations
- avoid silent scope expansion

The rule is simple:

> **AI may implement the specification. AI does not become the specification.**

---

# 🧪 Testing Philosophy

Tests are part of the product contract.

YOWTF tests should cover:

- collectors
- platform adapters
- project discovery
- rule evaluation
- rule applicability
- threshold boundaries
- scoring
- command behavior
- output modes
- error handling
- privacy behavior
- read-only guarantees
- regression cases

For threshold-based rules, boundary cases matter.

For example:

```text
79.9%
80.0%
80.1%
```

should not accidentally produce the same result when the specification defines different outcomes.

---

# 🔐 Safety Philosophy

YOWTF is deliberately conservative.

When evidence is unavailable:

```text
don't invent
```

When applicability is uncertain:

```text
don't assume
```

When a condition cannot be proven:

```text
don't claim certainty
```

When a repair could alter user state:

```text
don't perform it
```

This makes YOWTF useful as a diagnostic layer without turning it into an unpredictable system-management tool.

---

# 🚫 What YOWTF Is Not

YOWTF is **not**:

- an antivirus
- a full security scanner
- a system monitor
- a process manager
- a package manager
- a cloud observability platform
- a telemetry platform
- an automatic repair utility
- an AI assistant
- a remote monitoring service

It is a **developer workstation and project diagnostic tool**.

---

# 🌐 Network Philosophy

YOWTF is local-first.

The V1 diagnostic engine does not depend on a cloud backend.

Network-related diagnostics concern local configuration and developer-relevant network state where specified.

YOWTF does not silently turn a local scan into a remote data-upload operation.

---

# 🐳 Docker

Docker is not a mandatory runtime dependency for YOWTF V1.

Docker-related diagnostics may be applicable when a project explicitly uses Docker/container metadata.

YOWTF does not require Docker merely to run.

---

# 🗺️ Roadmap

The V1 foundation focuses on:

```text
Local diagnostics
Read-only analysis
Deterministic rules
Cross-platform support
Project health
Workstation health
Explainable findings
Health scoring
CLI usability
```

Future functionality may be considered independently, but new capabilities require explicit specification.

Potential future areas may include:

- additional diagnostic rules
- broader ecosystem detection
- richer machine-readable output
- expanded platform coverage
- additional project ecosystem support
- optional integrations

Nothing becomes part of the product merely because it appears on a roadmap.

---

# 🤝 Contributing

Contributions are welcome.

Before changing the code:

1. Read the relevant documentation.
2. Understand the existing behavior.
3. Identify the owning specification.
4. Make the smallest appropriate change.
5. Add/update tests.
6. Run validation.
7. Update documentation when behavior changes.

For a new diagnostic rule:

```text
Requirement
   ↓
RULE-CATALOGUE.md
   ↓
Detection implementation
   ↓
Tests
   ↓
Registration
   ↓
Command integration
   ↓
Validation
```

Do not add hidden rules.

---

# 📝 Commit Convention

The project follows Conventional Commits.

Examples:

```text
feat: add runtime diagnostics
fix: correct PATH normalization
docs: clarify scoring behavior
test: add lockfile mismatch coverage
refactor: simplify rule registry
chore: update dependencies
```

Release behavior follows the project's semantic-versioning configuration.

---

# 📦 Release Philosophy

YOWTF uses semantic versioning.

In general:

```text
MAJOR → breaking changes
MINOR → new compatible functionality
PATCH → compatible fixes
```

Rule IDs and documented behavior are treated as compatibility-sensitive surfaces.

---

# 🧭 Design Principles

YOWTF is built around a small set of principles:

### Local-first

Your machine is the primary source of diagnostic evidence.

### Read-only

Diagnose first. Let the developer decide what to change.

### Deterministic

The same evidence should produce the same result.

### Evidence-based

Findings should be explainable from collected evidence.

### Privacy by default

Collect the minimum information necessary.

### Developer-oriented

Focus on problems developers actually encounter.

### No silent magic

Undocumented behavior is not a feature.

---

# 💬 Philosophy

A developer workstation is an ecosystem.

Over time it collects:

```text
runtimes
tools
PATH entries
package managers
dependencies
caches
ports
processes
environment variables
configuration
projects
Git repositories
```

Eventually something breaks.

And when it does, developers often start checking random things manually.

YOWTF's job is to make that investigation structured.

Not:

> "Here are 400 lines of system information. Good luck."

But:

> **"Yo, WTF is happening?"**

followed by:

```text
What was detected.
Why it matters.
How confident we are.
What evidence supports it.
Where you should look next.
```

---

# ⭐ Why the Name?

Because sometimes developer tooling needs to say what everyone is already thinking.

**YOWTF**

**Your Operating Workstation Trouble Finder**

```text
Yo, WTF is happening?
```

Serious diagnostics.

Questionable branding.

---

# License

YOWTF is licensed under the MIT License.

See the [LICENSE](LICENSE) file for the full license text.

---

# 🔗 Project

GitHub:

https://github.com/isthatpratham/yowtf

---

# 📚 Documentation Map

```text
README.md
   │
   ├── docs/PRD.md
   │      Product requirements
   │
   ├── docs/ARCHITECTURE.md
   │      System architecture
   │
   ├── docs/TECH-STACK.md
   │      Technology contract
   │
   ├── docs/CLI-SPEC.md
   │      CLI behavior
   │
   ├── docs/DETECTION-ENGINE.md
   │      Detection architecture
   │
   ├── docs/SCORING.md
   │      Health scoring
   │
   ├── docs/COMMANDS.md
   │      Command catalogue
   │
   └── docs/RULE-CATALOGUE.md
          V1 diagnostic rules
```

---

# 🧠 Final Word

YOWTF isn't trying to manage your machine.

It isn't trying to replace your package manager.

It isn't trying to be an antivirus.

It isn't trying to upload your workstation to some dashboard.

It simply asks:

```text
What is happening?
What looks wrong?
Why does it matter?
How certain are we?
What should I investigate?
```

And then gives you the evidence.

```text
┌─────────────────────────────────────┐
│                                     │
│       YOWTF                         │
│       Your Operating Workstation    │
│       Trouble Finder                │
│                                     │
│       Yo, WTF is happening?         │
│                                     │
└─────────────────────────────────────┘
```

**Local. Read-only. Deterministic. Developer-first.**

That's YOWTF.
