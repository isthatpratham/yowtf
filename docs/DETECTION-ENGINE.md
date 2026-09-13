# YOWTF — Detection Engine Specification

**Document:** `docs/DETECTION-ENGINE.md`  
**Product:** YOWTF — Your Operating Workstation Trouble Finder  
**CLI:** `yowtf`  
**Status:** Source of Truth  
**Version:** 1.0  
**Audience:** YOWTF maintainers, contributors, reviewers, and AI coding agents

---

## 1. Purpose

This document defines the authoritative detection engine for YOWTF.

It specifies how YOWTF transforms collected machine/project facts into deterministic, explainable diagnostic findings.

The detection engine is responsible for:

```text
Evidence
   ↓
Applicability
   ↓
Rule evaluation
   ↓
Normalized finding
```

It is not responsible for:

- terminal rendering
- CLI parsing
- score presentation
- modifying the user's environment
- installing software
- automatic repair
- network telemetry

---

# 2. Detection Philosophy

YOWTF detects problems using evidence-based rules.

The fundamental model is:

```text
COLLECT FACTS
      ↓
NORMALIZE FACTS
      ↓
CHECK RULE APPLICABILITY
      ↓
EVALUATE RULE
      ↓
PRODUCE FINDING
```

A rule must never invent evidence.

If required evidence is unavailable, the rule must represent that state explicitly.

---

# 3. Core Detection Principles

The detection engine must be:

1. deterministic
2. evidence-based
3. explainable
4. side-effect free
5. independently testable
6. platform-aware
7. failure-tolerant
8. privacy-conscious
9. extensible
10. explicit about uncertainty

---

# 4. Detection Boundary

The detection engine begins after collection has produced structured evidence.

```text
CLI
 ↓
Application
 ↓
Discovery
 ↓
Collection
 ↓
┌─────────────────────────┐
│    DETECTION ENGINE     │
│                         │
│ applicability           │
│ rule selection          │
│ evaluation              │
│ finding normalization   │
└────────────┬────────────┘
             ↓
         Scoring
```

The detection engine must not reach backward into the CLI.

---

# 5. Evidence Is the Input

Rules operate on structured evidence.

Conceptually:

```text
EvidenceSet
├── system
├── disk
├── processes
├── ports
├── network
├── environment
├── runtimes
├── tools
├── paths
├── project
├── dependencies
├── git
├── configuration
└── storage
```

Not every scan contains every evidence category.

Availability depends on:

- command
- platform
- project
- permissions
- installed tools
- collector success

---

# 6. Evidence Requirements

Every rule must declare what evidence it needs.

Conceptually:

```text
Rule
├── id
├── category
├── applicability
├── requiredEvidence
├── evaluate
└── metadata
```

This allows the engine to determine whether a rule can run before evaluation.

---

# 7. Evidence Availability

Evidence must distinguish at least:

```text
AVAILABLE
UNAVAILABLE
FAILED
NOT_APPLICABLE
```

These states must not be silently collapsed.

For example:

```text
Python is absent
```

is different from:

```text
Python collector crashed
```

and both are different from:

```text
Python is irrelevant to this project
```

---

# 8. Evidence Integrity

Collectors must preserve evidence integrity.

Evidence should identify:

- source
- type
- normalized value
- availability
- optional metadata

The detector must treat collected evidence as authoritative for that scan.

Rules must not mutate evidence.

---

# 9. Evidence Normalization

Raw operating-system output should be normalized before rule evaluation where practical.

Examples:

```text
"v20.11.1"
      ↓
NodeVersion(20, 11, 1)
```

```text
"C:\Program Files\nodejs\node.exe"
      ↓
normalized executable path
```

```text
"git version 2.46.0"
      ↓
GitVersion(2, 46, 0)
```

Rules should consume structured values rather than repeatedly parsing raw command output.

---

# 10. Rule Definition

A diagnostic rule is a small, independently testable unit.

Conceptually:

```text
Rule
├── id
├── name
├── category
├── description
├── applicability
├── requiredEvidence
├── severity
├── evaluate()
└── explanation metadata
```

The exact catalogue of rules is defined in `RULE-CATALOGUE.md`.

---

# 11. Rule Identifier

Every rule must have a unique stable identifier.

Recommended conceptual format:

```text
<category>.<subject>.<condition>
```

Example:

```text
runtime.node.unpinned
```

Rule IDs must:

- be unique
- remain stable across patch releases
- be human-readable
- be safe for JSON
- be suitable for tests

Changing a rule ID is a compatibility-sensitive change.

---

# 12. Rule Categories

Rules are grouped by diagnostic area.

Conceptual categories include:

```text
system
disk
process
port
network
environment
runtime
tool
path
version
project
dependency
git
config
cache
```

The authoritative rule inventory belongs to `RULE-CATALOGUE.md`.

---

# 13. Rule Applicability

Before evaluating a rule, the engine determines whether it applies.

Applicability may depend on:

- operating system
- project type
- available evidence
- installed tool
- project files
- command scope
- feature requirements

A rule that does not apply must not report a failure.

---

# 14. Applicability Examples

### Node project

A Node-specific project rule may apply when:

```text
package.json exists
```

### Git rule

A Git repository rule may apply when:

```text
.git exists
```

### Python rule

A Python-specific rule may apply when:

```text
Python project evidence exists
```

The exact applicability conditions belong to each rule's catalogue entry.

---

# 15. Applicability vs Failure

Never confuse:

```text
NOT APPLICABLE
```

with:

```text
FAIL
```

Example:

```text
Java version mismatch
```

does not mean the machine is broken when the current project is not Java-related.

---

# 16. Rule Evaluation

A rule receives:

```text
normalized evidence
+
rule definition
```

and produces a normalized evaluation.

Conceptually:

```text
evaluate(rule, evidence)
        ↓
RuleEvaluation
```

The evaluation must be deterministic.

---

# 17. Evaluation States

The engine uses the following conceptual states:

```text
PASS
FAIL
WARN
SKIPPED
UNAVAILABLE
ERROR
```

## PASS

The evaluated condition satisfies the rule.

## FAIL

The evidence demonstrates a condition requiring attention.

## WARN

The condition is potentially problematic but does not meet the threshold for failure.

## SKIPPED

The rule was intentionally not executed because its conditions were not relevant or execution was excluded.

## UNAVAILABLE

Required evidence could not be obtained or the capability is unavailable.

## ERROR

The rule could not complete evaluation due to an unexpected evaluation problem.

---

# 18. PASS

A PASS means:

```text
required evidence was sufficient
+
rule condition was satisfied
```

A PASS must not be emitted when required evidence is missing.

---

# 19. FAIL

A FAIL means:

```text
required evidence was available
+
rule condition was violated
```

The finding should include evidence sufficient to explain the failure.

---

# 20. WARN

WARN is appropriate when:

- evidence indicates a potential problem
- the condition is below a hard failure threshold
- uncertainty exists but the result remains actionable

WARN must not be used as a generic replacement for missing evidence.

---

# 21. SKIPPED

SKIPPED indicates intentional non-execution.

Examples:

```text
rule excluded by command scope
rule not relevant to detected project
rule disabled by documented configuration
```

The exact mechanisms for explicit rule selection/configuration must be defined elsewhere before implementation.

---

# 22. UNAVAILABLE

UNAVAILABLE means the diagnostic could not obtain required capability/evidence.

Examples:

```text
permission denied
tool absent
platform capability unavailable
collector could not access required information
```

UNAVAILABLE must not be presented as a false failure.

---

# 23. ERROR

ERROR means the engine encountered an unexpected failure while evaluating a rule.

An ERROR must not be converted silently into PASS.

It must remain distinguishable for:

- debugging
- reporting
- testing
- reliability analysis

---

# 24. Finding Model

A normalized finding conceptually contains:

```text
Finding
├── ruleId
├── category
├── status
├── severity
├── confidence
├── title
├── summary
├── evidence
├── impact
└── remediationHint
```

Exact scoring semantics are defined in `SCORING.md`.

---

# 25. Finding Identity

A finding is identified primarily by:

```text
ruleId
```

If one rule can legitimately produce multiple findings, the rule specification must define how instances are distinguished.

Do not generate random finding identifiers unless explicitly required.

---

# 26. Finding Title

Finding titles must be:

- concise
- understandable
- deterministic
- non-judgmental
- derived from the rule definition

A title should communicate the problem without requiring internal rule knowledge.

---

# 27. Finding Summary

The summary explains:

```text
what happened
```

It should be short enough for terminal display.

It must not claim facts unsupported by evidence.

---

# 28. Finding Evidence

Evidence explains:

```text
why the rule produced this result
```

Evidence should be:

- structured where possible
- safe to display
- relevant
- minimal

Never expose secrets merely to make a finding more convincing.

---

# 29. Finding Impact

Impact communicates:

```text
why this condition matters
```

Examples:

- reproducibility risk
- development workflow disruption
- resource pressure
- configuration inconsistency
- local conflict

Impact must be grounded in the rule definition.

---

# 30. Remediation Hint

A remediation hint tells the user what to inspect or consider next.

It is not an automatic repair.

Example:

```text
Inspect the project's runtime version policy.
```

Do not output commands that modify the user's system unless a future specification explicitly authorizes them.

---

# 31. Confidence

Confidence communicates how strongly the evidence supports the conclusion.

The engine should distinguish:

```text
HIGH
MEDIUM
LOW
```

where confidence is required by the rule.

Confidence is not severity.

Example:

```text
HIGH confidence + LOW severity
```

is valid.

---

# 32. Severity vs Confidence

These concepts must remain independent.

### Severity

How important the condition is.

### Confidence

How certain YOWTF is that the condition exists.

Do not use confidence as a hidden severity multiplier unless explicitly defined by `SCORING.md`.

---

# 33. Rule Determinism

A rule must return the same result when given the same normalized evidence.

Rules must not depend on:

- random numbers
- network state
- wall-clock time unless the rule explicitly requires time-based evidence
- process timing races where avoidable
- terminal output
- external AI decisions

---

# 34. Rule Purity

A rule should be functionally pure with respect to the supplied evidence.

It must not:

- edit files
- install packages
- kill processes
- alter environment variables
- modify Git
- mutate global state
- send network requests

---

# 35. Collector vs Rule Responsibility

Correct:

```text
Collector:
"Node executable resolves to X."

Rule:
"Executable X conflicts with project expectation Y."
```

Incorrect:

```text
Rule:
"Run shell command, inspect files, parse output, decide, print warning."
```

Collection and reasoning remain separate.

---

# 36. Rule Execution Context

The engine may provide a rule with:

```text
EvidenceSet
ScanContext
RuleDefinition
```

`ScanContext` may contain bounded metadata such as:

- platform
- project root
- command scope
- scan mode

It must not become an unrestricted escape hatch for arbitrary filesystem or process access.

---

# 37. Command Scope

The engine must know which diagnostic scope the current command requested.

For example:

```text
yowtf runtimes
```

should activate runtime-relevant rules.

```text
yowtf ports
```

should activate port-relevant rules.

The default command may activate the complete applicable V1 rule set.

---

# 38. Rule Selection

Rule selection should consider:

```text
command scope
+
platform
+
project context
+
available evidence
+
rule applicability
```

Only applicable rules should execute.

---

# 39. Rule Registry

The engine uses a rule registry.

Conceptually:

```text
Rule Registry
├── register(rule)
├── get(ruleId)
├── list()
└── select(context)
```

Registration must reject duplicate rule IDs.

---

# 40. Registry Determinism

The registry must produce stable rule ordering.

Ordering may use:

1. explicit rule order
2. stable rule identifier

The implementation must not rely on incidental object/property ordering for user-visible diagnostics.

---

# 41. Rule Isolation

A failing rule must not automatically terminate unrelated rule execution.

Example:

```text
Rule A → PASS
Rule B → ERROR
Rule C → PASS
```

The engine should preserve all three results when safe.

---

# 42. Rule Error Handling

Unexpected exceptions from rules must be captured at the engine boundary.

The resulting state should be:

```text
ERROR
```

with safe diagnostic metadata.

The engine must not:

- swallow the error and report PASS
- crash the entire scan unnecessarily
- expose secrets in an exception message

---

# 43. Collector Failure Handling

Collector failures should be represented in evidence availability.

Example:

```text
Collector:
Node executable lookup failed
```

Affected rule:

```text
UNAVAILABLE
```

if it cannot evaluate safely.

Do not fabricate a value.

---

# 44. Missing Evidence

When required evidence is missing:

```text
Do not guess.
Do not infer a failure.
Do not fabricate a default.
```

The rule should return an appropriate unavailable/skipped state according to its applicability.

---

# 45. Partial Evidence

If some evidence is available and some is missing, the rule may evaluate only when the remaining evidence is sufficient.

Otherwise:

```text
UNAVAILABLE
```

or another explicitly documented state must be returned.

---

# 46. Evidence Privacy

Detection must not require sensitive values unless a documented rule genuinely needs them.

For environment diagnostics:

```text
variable name
+
presence/type metadata
```

is preferred over:

```text
secret value
```

The detector must not log complete environment objects.

---

# 47. Secret Redaction

If a collector produces a sensitive value because it is technically required, downstream diagnostic output must redact it.

Redaction behavior must be deterministic.

Examples of sensitive data include:

```text
API keys
tokens
passwords
private keys
credentials
```

The default architecture should avoid collecting them entirely.

---

# 48. Platform Rules

A rule may declare supported platforms.

Conceptually:

```text
platforms:
  windows
  macos
  linux
```

If a rule is platform-specific and the current platform does not match:

```text
NOT_APPLICABLE
```

It must not report FAIL.

---

# 49. Version Comparison

Version-based rules must use structured version comparison.

Do not compare version strings lexicographically.

Incorrect:

```text
"10" < "9"
```

Correct behavior must parse version components according to the relevant versioning scheme.

The exact supported version schemes are defined by the applicable rule specifications.

---

# 50. Semantic Versioning

Where a diagnostic concerns semantic versions, use semantic-version-aware comparison.

For example:

```text
20.10.0
20.11.0
20.11.1
```

must be compared numerically by version semantics rather than string ordering.

---

# 51. Path Comparison

Path-based rules must account for platform path semantics.

Consider:

- path separators
- drive letters
- case behavior
- normalization
- executable resolution

Do not assume POSIX path behavior on Windows.

---

# 52. Process Detection

Process rules should operate on normalized process evidence.

They must not:

- kill processes
- pause processes
- modify priority
- send signals except where a future explicitly approved diagnostic requires it

V1 process diagnostics are observational.

---

# 53. Port Detection

Port rules operate on normalized port evidence.

They may identify:

- listening state
- local address
- port number
- associated process metadata where available

They must not modify network configuration.

---

# 54. Filesystem Detection

Filesystem-related rules should use normalized filesystem evidence.

Avoid reading entire files when metadata is sufficient.

Rules should not modify files.

---

# 55. Project Detection

Project rules may inspect project metadata such as:

- manifests
- lockfiles
- configuration
- directory structure
- version declarations

They must use bounded project scope.

---

# 56. Git Detection

Git rules may inspect Git state.

They must remain read-only.

No rule may:

```text
git add
git commit
git reset
git checkout
git clean
git stash
```

as part of normal V1 detection.

---

# 57. Dependency Detection

Dependency rules may inspect:

- manifests
- lockfiles
- package manager metadata
- declared versions
- reproducibility-relevant project state

They must not install or update dependencies.

---

# 58. Rule Metadata

Each catalogue entry should define at minimum:

```text
Rule ID
Name
Category
Purpose
Applicability
Required evidence
Evaluation condition
Status behavior
Severity
Confidence behavior
Explanation
Remediation hint
Platforms
```

The catalogue is the authoritative rule inventory.

---

# 59. Rule Lifecycle

A rule moves through:

```text
PROPOSED
   ↓
SPECIFIED
   ↓
IMPLEMENTED
   ↓
TESTED
   ↓
RELEASED
```

Only specified rules may be implemented.

---

# 60. Rule Addition Process

To add a rule:

1. define the problem
2. define evidence requirements
3. define applicability
4. define evaluation condition
5. define status behavior
6. define severity
7. define confidence
8. define explanation
9. define remediation hint
10. add catalogue entry
11. implement collector changes if necessary
12. implement rule
13. add tests
14. run regression suite
15. validate output

---

# 61. Rule Removal Process

Removing a rule requires:

1. specification update
2. catalogue update
3. implementation removal
4. test removal/update
5. regression validation
6. documentation review

Do not leave orphaned rule registrations.

---

# 62. Rule Modification

Changing a rule's:

- ID
- applicability
- evaluation semantics
- severity
- confidence behavior
- evidence requirements

is a specification change.

It must not be treated as a casual refactor.

---

# 63. False Positive Control

YOWTF prioritizes trustworthy diagnostics.

A rule should prefer:

```text
uncertain → WARN/UNAVAILABLE
```

over:

```text
uncertain → FAIL
```

when evidence is insufficient for a strong conclusion.

False positives reduce trust in the entire tool.

---

# 64. False Negative Control

Avoiding false positives does not justify ignoring clear evidence.

When evidence conclusively demonstrates a documented problem:

```text
FAIL
```

should be returned according to the rule's defined semantics.

---

# 65. Rule Thresholds

Thresholds must be explicit.

Examples:

```text
disk free < defined threshold
```

or:

```text
runtime version outside supported range
```

must use documented values.

Do not invent thresholds during implementation.

---

# 66. No Magic Numbers

Diagnostic thresholds must not be hidden inside code.

If a threshold affects user-visible behavior, it must be:

- specified
- named
- tested
- traceable to the relevant rule

---

# 67. Rule Testing

Every rule must have tests for:

- PASS
- FAIL
- relevant WARN cases
- unavailable evidence where applicable
- not-applicable conditions
- boundary conditions
- platform-specific behavior where applicable
- false-positive regressions

---

# 68. Evidence Fixture Testing

Rules should be tested using controlled evidence fixtures.

Example:

```text
Given:
Node version = 18.x
Project requirement = 20.x

When:
runtime rule evaluates

Then:
FAIL
```

Tests should not require the developer to actually have Node 18 installed.

---

# 69. Boundary Testing

Version and threshold rules require boundary tests.

Test:

```text
below threshold
exact threshold
above threshold
```

Where versions are involved, test:

```text
lower version
minimum supported version
higher version
multiple major versions
```

---

# 70. Regression Testing

Every confirmed false positive or false negative should result in a regression test where practical.

Regression tests must remain part of the suite.

---

# 71. Performance

The detection engine should avoid repeated expensive work.

If multiple rules require the same evidence:

```text
collect once
reuse evidence
```

Do not execute the same external command separately for every rule unless necessary.

---

# 72. Rule Execution Cost

Rules should be lightweight.

Expensive collection belongs to collectors, not individual rules.

A rule should generally perform computation against already-collected evidence.

---

# 73. Concurrency

Rules may be evaluated concurrently if:

- evidence is immutable
- rules are independent
- ordering is normalized afterward
- error isolation remains intact
- resource usage is bounded

Parallel execution must not make user-visible results nondeterministic.

---

# 74. Result Ordering

Final findings must have deterministic ordering.

Recommended ordering hierarchy:

```text
severity
category
ruleId
```

or another explicitly frozen ordering.

The exact final ordering must remain consistent across runs.

---

# 75. Duplicate Findings

The engine must prevent accidental duplicate findings.

Duplicate output can occur when:

- a rule is registered twice
- the same rule is executed twice
- command scopes overlap incorrectly

The engine must normalize execution to prevent this.

---

# 76. Rule Dependencies

Rules should be independent whenever practical.

If one rule genuinely depends on another diagnostic result, that dependency must be explicitly documented.

Avoid chains such as:

```text
Rule A
  ↓
Rule B
  ↓
Rule C
```

when all three can reason from shared evidence.

---

# 77. Collector Dependencies

If a rule requires a collector:

```text
Rule
 ↓
Required Evidence
 ↓
Collector
```

The application layer should ensure required evidence is available before evaluation.

Rules should not directly instantiate collectors.

---

# 78. Detection Context

A scan context may contain:

```text
platform
project root
command
scan mode
available capabilities
```

It must remain bounded.

Do not put arbitrary mutable global state into scan context.

---

# 79. No Global Mutable State

The detection engine must avoid global mutable state.

Rules should not communicate through hidden module-level variables.

All important inputs should be explicit.

---

# 80. Explainability Contract

For every FAIL or WARN finding, where applicable, the engine should preserve:

```text
condition
+
evidence
+
impact
+
next action
```

This allows reporting to explain rather than merely label.

---

# 81. Diagnostic Honesty

The engine must never claim:

```text
verified
```

when evidence is unavailable.

It must never claim:

```text
healthy
```

when the relevant diagnostic could not run.

It must never claim:

```text
fixed
```

because V1 performs no automatic repair.

---

# 82. No AI Reasoning in Detection

V1 rules are deterministic.

Do not use an LLM to decide:

```text
PASS
FAIL
WARN
```

The runtime result must come from explicit rule logic.

---

# 83. No Network Reasoning

V1 detection must not depend on remote responses.

If a future rule requires network data, it must be explicitly specified and must define:

- endpoint
- privacy behavior
- failure behavior
- offline behavior
- timeout
- deterministic implications

---

# 84. No Automatic Remediation

Detection ends at:

```text
finding
+
explanation
+
optional remediation hint
```

It does not continue into automatic repair.

---

# 85. Detection Engine API Boundary

The application layer should interact with the engine through a narrow interface.

Conceptually:

```text
detect(
  evidenceSet,
  scanContext
)
→ DetectionResult
```

The exact TypeScript interface may evolve during implementation, but the architectural responsibility must remain stable.

---

# 86. Detection Result

The detection engine should return:

```text
DetectionResult
├── findings
├── executedRules
├── skippedRules
├── unavailableRules
└── errors
```

This gives the application layer visibility into diagnostic coverage without requiring it to inspect internal rule state.

---

# 87. Coverage Transparency

The system should make it possible to distinguish:

```text
100 rules evaluated
```

from:

```text
50 rules evaluated
20 skipped
30 unavailable
```

A high score must not imply that every diagnostic ran successfully.

---

# 88. Score Boundary

The detection engine produces findings.

The scoring engine calculates health.

Therefore:

```text
Detection Engine
      ↓
Findings
      ↓
Scoring Engine
```

Detection rules must not directly mutate the global health score.

---

# 89. Reporting Boundary

The detection engine must not:

- print terminal output
- use Chalk
- use Ora
- use Boxen
- use cli-table3

It returns structured data.

---

# 90. Logging Boundary

Rules should not directly print logs.

If diagnostic execution logging is required, it should be handled through an application/infrastructure mechanism that respects CLI output mode.

---

# 91. Security Boundary

The detection engine is not a full cybersecurity scanner.

It may identify developer-environment conditions that are relevant to health/reproducibility.

It must not silently expand into:

- malware detection
- vulnerability scanning
- penetration testing
- credential auditing
- offensive security tooling

Such functionality requires a separate product specification.

---

# 92. V1 Detection Boundary

V1 focuses on developer workstation/project health.

The engine may support diagnostics across:

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

Exact rules are defined in the rule catalogue.

---

# 93. Unsupported Diagnostics

When a diagnostic capability is not supported:

```text
do not fabricate a result
```

Represent the limitation through the documented status model.

---

# 94. Platform Capability Matrix

The implementation should maintain an explicit understanding of platform capability.

Conceptually:

| Capability | Windows | macOS | Linux |
|---|---|---|---|
| System information | supported | supported | supported |
| Process inspection | supported | supported | supported |
| Port inspection | supported | supported | supported |
| Filesystem inspection | supported | supported | supported |
| Runtime inspection | supported | supported | supported |
| Tool inspection | supported | supported | supported |

Individual capabilities may have limitations.

Those limitations must be documented rather than hidden.

---

# 95. Platform Degradation

If a platform cannot provide a particular diagnostic:

```text
supported scan
+
unavailable capability
=
honest partial result
```

Do not convert platform limitations into false failures.

---

# 96. Detection Engine and CLI Modes

The engine should be unaware of presentation modes such as:

```text
--json
--quiet
--no-color
```

Those options affect reporting.

The engine receives only the diagnostic scope/context necessary to determine what to evaluate.

---

# 97. Detection Engine and Paths

Path normalization should happen before rules where possible.

Rules should receive normalized path evidence.

They should not each implement their own platform-specific path normalization.

---

# 98. Detection Engine and Time

Time-dependent diagnostics are discouraged in V1.

If a rule genuinely requires current time:

- the dependency must be explicit
- tests must control time
- results must remain explainable

Do not use current time merely to create dynamic-looking output.

---

# 99. Detection Engine and Randomness

Randomness is prohibited in diagnostic evaluation.

Do not use random IDs or random thresholds in rule logic.

---

# 100. Detection Engine and Environment Mutation

The detection engine must assume that the environment is immutable during the scan.

It must not modify it.

---

# 101. Detection Engine and Caches

Rules may inspect cache metadata when relevant.

They must not clear caches.

Cleanup remains a reporting/diagnostic candidate operation in V1.

---

# 102. Detection Engine and Project Scope

Project-scoped rules must not unexpectedly traverse unrelated directories.

The project root is the primary boundary.

Traversal rules must follow the discovery/collection specifications.

---

# 103. Detection Engine and Symlinks

Rules should rely on normalized filesystem evidence and the safe traversal behavior defined by the collection layer.

Rules must not independently implement unsafe recursive traversal.

---

# 104. Detection Engine and Large Files

Rules should not directly read large files when metadata/evidence already exists.

Collection should enforce file-size and traversal boundaries.

---

# 105. Detection Engine and Permissions

Permission errors must remain distinguishable from negative evidence.

Example:

```text
Could not inspect directory
```

does not mean:

```text
directory is healthy
```

and does not automatically mean:

```text
directory is broken
```

It means evidence is unavailable.

---

# 106. Detection Engine and Git Safety

All Git inspection must be read-only.

Rules may query repository state.

Rules may not modify repository state.

---

# 107. Detection Engine and Process Safety

Process inspection is observational.

Rules may identify processes.

Rules may not terminate, suspend, reprioritize, or otherwise manipulate processes.

---

# 108. Detection Engine and Port Safety

Port inspection is observational.

Rules may report conflicts.

Rules may not automatically free ports.

---

# 109. Detection Engine and Dependency Safety

Dependency inspection is observational.

Rules may identify dependency conditions.

Rules may not install, update, remove, or repair dependencies.

---

# 110. Detection Engine and Runtime Safety

Runtime inspection is observational.

Rules may identify version/path/configuration conditions.

Rules may not switch the user's active runtime.

---

# 111. Detection Engine and Tool Safety

Tool inspection is observational.

Rules may identify missing or inconsistent tools.

Rules may not install or upgrade them.

---

# 112. Detection Engine and Configuration Safety

Configuration inspection is observational.

Rules may identify configuration concerns.

Rules may not rewrite configuration.

---

# 113. Detection Engine and Environment Safety

Environment inspection is observational.

Rules may identify missing or suspicious environment metadata.

Rules may not modify environment variables.

---

# 114. Detection Engine and Storage Safety

Storage inspection is observational.

Rules may identify cleanup candidates.

Rules may not delete storage.

---

# 115. Rule Catalogue Ownership

`RULE-CATALOGUE.md` owns the complete list of rules.

This document owns the engine behavior.

Therefore:

```text
DETECTION-ENGINE.md
→ how rules execute

RULE-CATALOGUE.md
→ which rules exist
```

---

# 116. Scoring Ownership

`SCORING.md` owns score calculation.

This document owns finding generation.

Therefore:

```text
Detection Engine
→ finding

Scoring Engine
→ score
```

---

# 117. CLI Ownership

`CLI-SPEC.md` owns:

- command syntax
- flags
- exit behavior
- presentation behavior

The detection engine must not redefine CLI behavior.

---

# 118. Architecture Ownership

`ARCHITECTURE.md` owns:

- layer boundaries
- dependency direction
- component responsibilities

This document provides detection-specific detail within those boundaries.

---

# 119. Technology Ownership

`TECH-STACK.md` owns technology choices.

The detection engine must use the approved technology stack.

It must not introduce a separate framework for rules.

---

# 120. AI Coding Agent Contract

Antigravity must:

1. Read this document before modifying detection behavior.
2. Read `RULE-CATALOGUE.md` before adding or changing rules.
3. Never invent a rule.
4. Never invent a threshold.
5. Never invent severity.
6. Never invent applicability.
7. Never guess missing evidence.
8. Never turn unavailable evidence into PASS.
9. Never turn uncertainty into FAIL without specification support.
10. Keep collectors separate from rules.
11. Keep rules deterministic.
12. Keep rules side-effect free.
13. Keep scoring separate from detection.
14. Keep reporting separate from detection.
15. Preserve stable rule IDs.
16. Add regression tests for detection bugs.
17. Update the rule catalogue when rule behavior changes.
18. Stop if a rule requirement is ambiguous.
19. Stop if specifications conflict.
20. Never use AI/LLM output as runtime diagnostic truth.

---

# 121. Detection Change Control

Any change to detection semantics follows:

```text
Requirement
    ↓
Rule specification
    ↓
Evidence definition
    ↓
Applicability definition
    ↓
Evaluation definition
    ↓
Catalogue update
    ↓
Implementation
    ↓
Tests
    ↓
Regression validation
```

No semantic detection change should be implemented as an undocumented refactor.

---

# 122. Detection Definition of Done

The detection engine is complete when:

- evidence is structured
- evidence availability is explicit
- rules declare applicability
- rules declare evidence requirements
- rules evaluate deterministically
- findings are normalized
- severity is preserved
- confidence is preserved
- explanations are preserved
- errors are isolated
- duplicate findings are prevented
- ordering is deterministic
- rules are independently testable
- platform differences are handled explicitly
- sensitive values are protected
- no rule mutates user state
- rule inventory is documented

---

# 123. Final Detection Engine Definition

YOWTF's detection engine is the deterministic reasoning layer between collected evidence and scored findings.

Its job is simple:

```text
Given trustworthy evidence,
apply explicitly defined rules,
produce trustworthy findings.
```

It must never guess, silently repair, hide uncertainty, or invent conclusions.

The engine exists to make YOWTF's central promise credible:

> **If YOWTF says something is wrong, there should be evidence explaining why.**

---

**End of `docs/DETECTION-ENGINE.md`**
