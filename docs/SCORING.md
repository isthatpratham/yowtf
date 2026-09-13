# YOWTF — Scoring Specification

**Document:** `docs/SCORING.md`  
**Product:** YOWTF — Your Operating Workstation Trouble Finder  
**CLI:** `yowtf`  
**Status:** Source of Truth  
**Version:** 1.0  
**Audience:** YOWTF maintainers, contributors, reviewers, and AI coding agents

---

## 1. Purpose

This document defines how YOWTF converts diagnostic findings into a deterministic health score.

The scoring system exists to answer:

> **How healthy is the diagnosed workstation/project based on the evidence YOWTF was able to evaluate?**

This document is authoritative for score calculation.

---

# 2. Scoring Principles

The scoring system must be:

- deterministic
- explainable
- bounded
- evidence-based
- severity-aware
- transparent about unavailable diagnostics
- independent from terminal presentation
- independent from collection
- independent from CLI parsing

The same findings must always produce the same score.

---

# 3. Score Range

YOWTF uses a normalized score from:

```text
0 to 100
```

where:

```text
100 = healthiest evaluated state
0   = lowest evaluated health state
```

The score must never be below `0` or above `100`.

---

# 4. Starting Score

A scan begins with:

```text
100 points
```

Findings may reduce the score according to their defined scoring weight.

PASS findings do not increase the score above 100.

---

# 5. Score Ownership

Only the scoring layer calculates the health score.

The following must never calculate the score:

- CLI commands
- collectors
- detection rules
- terminal renderers
- JSON renderers

The canonical flow is:

```text
Evidence
   ↓
Findings
   ↓
Scoring
   ↓
Score
```

---

# 6. What Gets Scored

The score is based on evaluated diagnostic findings.

Conceptually:

```text
FAIL
WARN
```

may contribute penalties.

The following do not normally impose a health penalty by themselves:

```text
PASS
SKIPPED
UNAVAILABLE
```

An `ERROR` is handled according to the coverage rules defined below.

---

# 7. Severity Levels

The scoring system recognizes these diagnostic severities:

```text
CRITICAL
HIGH
MEDIUM
LOW
INFO
```

Severity describes impact.

It must not be confused with confidence.

---

# 8. Severity Penalties

V1 uses the following base penalties:

| Severity | Base penalty |
|---|---:|
| CRITICAL | 25 |
| HIGH | 15 |
| MEDIUM | 8 |
| LOW | 3 |
| INFO | 0 |

These values are authoritative.

A finding's penalty is determined by its severity and status.

---

# 9. Status and Scoring

The default V1 scoring behavior is:

| Status | Score effect |
|---|---:|
| PASS | 0 |
| FAIL | severity penalty |
| WARN | 50% of severity penalty |
| SKIPPED | 0 |
| UNAVAILABLE | 0 |
| ERROR | 0 |

`ERROR` does not silently become a failure.

It affects diagnostic coverage statistics and must be visible to the user where reporting supports coverage information.

---

# 10. WARN Penalty

WARN findings receive half of their severity's base penalty.

Examples:

```text
CRITICAL WARN → 12.5
HIGH WARN     → 7.5
MEDIUM WARN   → 4
LOW WARN      → 1.5
INFO WARN     → 0
```

Fractional penalties are permitted internally.

The final displayed score is rounded according to the rounding rule defined below.

---

# 11. Finding Penalty Formula

For a FAIL:

```text
penalty = baseSeverityPenalty
```

For a WARN:

```text
penalty = baseSeverityPenalty × 0.5
```

For all other statuses:

```text
penalty = 0
```

---

# 12. Confidence

Confidence is represented independently from severity.

V1 scoring does not multiply severity penalties by confidence.

Therefore:

```text
HIGH severity + LOW confidence
```

does not automatically receive a smaller penalty.

The rule itself must choose an appropriate status when evidence is uncertain.

This keeps scoring simple and prevents hidden scoring behavior.

---

# 13. Why Confidence Does Not Multiply Score

Using confidence as an automatic multiplier could create unintuitive behavior where two equally severe documented findings have different scores solely because of an internal confidence label.

YOWTF instead expects uncertainty to be represented through:

- WARN
- UNAVAILABLE
- SKIPPED
- ERROR

where appropriate.

---

# 14. Duplicate Findings

A diagnostic rule must not reduce the score multiple times because of accidental duplicate execution.

Before scoring:

```text
findings
   ↓
deduplicate by stable finding identity
   ↓
score
```

The preferred identity is the stable `ruleId`.

If a rule legitimately produces multiple findings, its catalogue entry must define how those instances are distinguished.

---

# 15. Duplicate Rule Registration

Duplicate rule registration is an engine error.

A rule registered twice must not silently produce double penalties.

The rule registry must reject duplicate rule IDs.

---

# 16. Penalty Aggregation

The total penalty is:

```text
sum(all applicable finding penalties)
```

The raw score is:

```text
100 - totalPenalty
```

The final score is clamped:

```text
finalScore = max(0, min(100, rawScore))
```

---

# 17. Score Floor

The minimum score is:

```text
0
```

Even if the sum of penalties exceeds 100:

```text
score = 0
```

---

# 18. Score Ceiling

The maximum score is:

```text
100
```

A scan with no scored problems produces:

```text
100
```

---

# 19. Example: Healthy Scan

Findings:

```text
0 FAIL
0 WARN
```

Calculation:

```text
100 - 0 = 100
```

Result:

```text
100
```

---

# 20. Example: One LOW Failure

Finding:

```text
LOW + FAIL
```

Penalty:

```text
3
```

Score:

```text
100 - 3 = 97
```

---

# 21. Example: One MEDIUM Failure

Finding:

```text
MEDIUM + FAIL
```

Penalty:

```text
8
```

Score:

```text
100 - 8 = 92
```

---

# 22. Example: One HIGH Failure

Finding:

```text
HIGH + FAIL
```

Penalty:

```text
15
```

Score:

```text
100 - 15 = 85
```

---

# 23. Example: One CRITICAL Failure

Finding:

```text
CRITICAL + FAIL
```

Penalty:

```text
25
```

Score:

```text
100 - 25 = 75
```

---

# 24. Example: WARN

Finding:

```text
MEDIUM + WARN
```

Penalty:

```text
8 × 0.5 = 4
```

Score:

```text
100 - 4 = 96
```

---

# 25. Example: Multiple Findings

Given:

```text
HIGH FAIL
MEDIUM FAIL
LOW WARN
```

Penalties:

```text
15
8
1.5
```

Total:

```text
24.5
```

Raw score:

```text
75.5
```

Final score after rounding:

```text
76
```

---

# 26. Score Rounding

The final displayed score is rounded to the nearest integer.

Conceptually:

```text
75.5 → 76
75.4 → 75
```

The score remains numerically bounded between 0 and 100.

---

# 27. Score Calculation Order

The canonical order is:

```text
1. receive normalized findings
2. remove accidental duplicates
3. determine penalty for each finding
4. sum penalties
5. subtract from 100
6. clamp to 0–100
7. round final score
8. determine score band
```

No other operation may alter the score.

---

# 28. Score Bands

YOWTF uses the following health bands:

| Score | Band |
|---:|---|
| 90–100 | EXCELLENT |
| 75–89 | GOOD |
| 60–74 | FAIR |
| 40–59 | POOR |
| 0–39 | CRITICAL |

These boundaries are authoritative.

---

# 29. Boundary Examples

```text
100 → EXCELLENT
90  → EXCELLENT
89  → GOOD
75  → GOOD
74  → FAIR
60  → FAIR
59  → POOR
40  → POOR
39  → CRITICAL
0   → CRITICAL
```

---

# 30. Score Band Independence

The score band is derived from the final score.

It must not be selected directly from the highest-severity finding.

For example:

```text
score = 74
```

means:

```text
FAIR
```

regardless of which finding caused the score.

---

# 31. Critical Finding Behavior

A CRITICAL finding does not automatically force the overall score into the CRITICAL band.

Example:

```text
100 - 25 = 75
```

A single CRITICAL failure therefore produces:

```text
75 → GOOD
```

The score communicates aggregate health.

The finding severity communicates individual impact.

Both are displayed independently.

---

# 32. Score and Finding Severity

The UI should preserve both:

```text
Overall score
+
Individual severity
```

Do not replace severity information with score bands.

---

# 33. Score and Confidence

Confidence does not directly alter the numerical score in V1.

The result should preserve confidence so the user can understand the certainty of individual findings.

---

# 34. Score and PASS

PASS findings contribute:

```text
0 penalty
```

They may still be counted in diagnostic statistics.

A PASS is evidence that a checked condition was satisfied.

---

# 35. Score and SKIPPED

SKIPPED findings/rules contribute:

```text
0 penalty
```

They must remain distinguishable from PASS.

Skipped diagnostics do not constitute evidence that the condition passed.

---

# 36. Score and UNAVAILABLE

UNAVAILABLE contributes:

```text
0 penalty
```

Unavailable evidence must not be interpreted as healthy evidence.

Coverage reporting should expose the limitation.

---

# 37. Score and ERROR

ERROR contributes:

```text
0 penalty
```

in V1.

This prevents an internal engine failure from arbitrarily destroying the user's health score.

However:

```text
ERROR ≠ PASS
```

The error must remain visible in diagnostics/coverage.

---

# 38. Coverage Statistics

A scored result should preserve diagnostic coverage information.

Conceptually:

```text
total rules
evaluated
passed
failed
warned
skipped
unavailable
errored
```

This allows the user to understand how much of the environment was actually evaluated.

---

# 39. Coverage Is Not a Score Bonus

Coverage does not add points.

For example:

```text
100% evaluated
```

does not produce:

```text
+10
```

The score remains solely a function of findings and their penalties.

---

# 40. Partial Scans

A command-specific scan may evaluate only a subset of rules.

The score represents:

```text
health of the evaluated scope
```

not necessarily the health of every aspect of the workstation.

The report should identify the scope.

---

# 41. Score Scope

Examples:

```text
yowtf runtimes
```

produces a runtime-scope score.

```text
yowtf ports
```

produces a port-scope score.

```text
yowtf
```

produces the default full applicable scan score.

The command scope must be visible in the result metadata where practical.

---

# 42. Cross-Scope Comparison

Scores from different commands should not be presented as directly equivalent unless their scope is understood.

For example:

```text
Runtime score = 95
Port score = 100
```

does not mean the machine's overall score is 97.5.

The default full scan owns the overall workstation/project health score.

---

# 43. Score Command

`yowtf score` must use the canonical scoring engine.

It must not:

- recalculate penalties differently
- ignore warnings
- invent alternate bands
- use terminal-specific scoring
- use a simplified score

---

# 44. JSON Score

JSON output should expose structured score information.

Conceptually:

```text
score
├── value
├── band
├── totalPenalty
└── coverage
```

The JSON representation must reflect the same canonical score used by terminal output.

---

# 45. Terminal Score

Terminal output may visually emphasize:

```text
score
band
```

but the numerical value must come from the canonical score.

Terminal styling must not influence scoring.

---

# 46. Score Explainability

The report should make it possible to understand score changes through findings.

Conceptually:

```text
100 starting score
      ↓
-15 HIGH failure
      ↓
-8 MEDIUM failure
      ↓
-1.5 LOW warning
      ↓
75.5
      ↓
76
```

The user should not have to reverse-engineer the scoring system.

---

# 47. Score Stability

Given identical normalized findings:

```text
same findings
→ same penalties
→ same score
→ same band
```

No external state may change the score.

---

# 48. No Randomness

The scoring engine must not use randomness.

Do not generate random:

- penalties
- weights
- identifiers
- tie-breakers

---

# 49. No Network

The scoring engine must not make network requests.

Scores are calculated entirely from local diagnostic results.

---

# 50. No Time Dependence

The score must not depend on current time unless an explicitly approved future scoring requirement introduces a time-dependent input.

Normal V1 scoring is time-independent.

---

# 51. No AI

The scoring engine must not ask an AI/LLM to determine:

```text
penalty
score
band
severity
```

Those are deterministic specification-defined operations.

---

# 52. No Collector Access

The scoring engine must not:

- inspect files
- execute commands
- inspect processes
- inspect ports
- query runtimes
- query Git
- read environment variables

It consumes findings only.

---

# 53. No Reporter Access

The scoring engine must not depend on:

- Chalk
- Ora
- Boxen
- cli-table3

It produces structured score data.

---

# 54. Scoring Input Contract

The scoring engine conceptually receives:

```text
ScoringInput
├── findings
└── scan metadata/scope
```

It should not require raw machine evidence.

---

# 55. Scoring Output Contract

The scoring engine conceptually returns:

```text
ScoreResult
├── value
├── band
├── totalPenalty
├── findingCount
└── coverage metadata where applicable
```

The exact TypeScript interface may evolve while preserving these responsibilities.

---

# 56. Score Calculation Pseudocode

Conceptually:

```text
score = 100

for each unique finding:
    if status == FAIL:
        score -= severityPenalty(severity)

    if status == WARN:
        score -= severityPenalty(severity) * 0.5

score = clamp(score, 0, 100)
score = round(score)

band = scoreBand(score)
```

No additional undocumented adjustment is permitted.

---

# 57. Severity Penalty Function

Conceptually:

```text
CRITICAL → 25
HIGH     → 15
MEDIUM   → 8
LOW      → 3
INFO     → 0
```

This mapping must remain centralized.

Do not duplicate penalty values across individual rules.

---

# 58. Rule-Level Scoring Metadata

Rules should specify severity.

They should not directly specify arbitrary score deductions.

Correct:

```text
severity = HIGH
```

Incorrect:

```text
penalty = 17
```

The scoring layer owns the mapping from severity to penalty.

---

# 59. Custom Penalties

V1 does not support arbitrary rule-specific penalties.

If a future diagnostic requires a special weighting model, `SCORING.md` must be updated before implementation.

---

# 60. Severity Changes

Changing a rule's severity can change the user's score.

Therefore severity changes are scoring-affecting changes.

They require:

- rule specification update
- score impact review
- test updates
- regression validation

---

# 61. Score Regression Tests

The scoring suite must include tests for:

- 0 findings
- one finding per severity
- WARN penalties
- multiple findings
- score floor
- score ceiling
- rounding
- every score-band boundary
- duplicate findings
- unavailable findings
- error findings
- partial scans

---

# 62. Boundary Test Matrix

At minimum:

```text
100
90
89
75
74
60
59
40
39
0
```

must map to the correct score bands.

---

# 63. Rounding Tests

At minimum:

```text
75.4 → 75
75.5 → 76
75.6 → 76
```

must be validated.

---

# 64. Penalty Floor Test

If total penalties exceed 100:

```text
raw score < 0
```

the final score must be:

```text
0
```

---

# 65. Penalty Ceiling Test

A scan with no penalties must remain:

```text
100
```

No mechanism may produce:

```text
101
```

or higher.

---

# 66. Duplicate Test

If the same finding appears twice accidentally:

```text
HIGH FAIL
HIGH FAIL
```

the scoring pipeline must prevent an accidental double penalty.

---

# 67. Status Test

Given:

```text
PASS
SKIPPED
UNAVAILABLE
ERROR
```

with no FAIL/WARN findings:

```text
score = 100
```

while coverage communicates that not all diagnostics passed.

---

# 68. Mixed Status Test

Example:

```text
PASS
FAIL HIGH
WARN LOW
UNAVAILABLE
ERROR
```

Penalties:

```text
15 + 1.5 = 16.5
```

Raw score:

```text
83.5
```

Final score:

```text
84
```

Band:

```text
GOOD
```

---

# 69. Score and Explain Command

`yowtf explain` may explain the findings responsible for score deductions.

It must use the same scoring result.

It must not create an alternate explanation score.

---

# 70. Score and Doctor Command

`yowtf doctor` may emphasize findings that caused score deductions.

The score remains calculated by the same scoring engine.

---

# 71. Score and Clean Command

Cleanup candidates do not automatically cause score penalties merely because they exist.

A cache becomes score-relevant only when an explicit diagnostic rule evaluates it as a problem.

Finding status and severity determine scoring.

---

# 72. Score and Missing Tools

A missing developer tool does not automatically reduce the score.

A documented rule must determine:

```text
whether the tool is applicable
whether absence is problematic
what severity applies
```

---

# 73. Score and Unsupported Platforms

Platform limitations do not automatically impose penalties.

Unavailable platform evidence is represented as unavailable.

---

# 74. Score and Permission Errors

Permission limitations do not automatically become failures.

If evidence cannot be collected:

```text
UNAVAILABLE
```

or an appropriate error state is used.

---

# 75. Score and Project Applicability

A project-specific issue should affect the score only when the relevant project rule applies.

An unrelated language/runtime must not reduce a project score merely because it is absent.

---

# 76. Score and Full Scan

The default scan:

```bash
yowtf
```

uses the full applicable V1 rule set.

The score represents the aggregate health of the evaluated workstation/project scope.

---

# 77. Score and Command Scope

Subcommands should calculate score using only findings produced within their defined diagnostic scope.

Do not mix unrelated command findings into a narrow command's score.

---

# 78. Score Metadata

A score result should preserve enough metadata to explain:

```text
scope
score
band
penalty
finding counts
coverage
```

Metadata must not alter the score.

---

# 79. Score Serialization

When serialized to JSON, numeric score fields must remain numeric.

Prefer:

```json
{
  "value": 84
}
```

over:

```json
{
  "value": "84/100"
}
```

Human formatting belongs to terminal reporting.

---

# 80. Score Presentation

Terminal output may display:

```text
84/100 — GOOD
```

but this is a presentation transformation of:

```text
value = 84
band = GOOD
```

---

# 81. Score and ANSI

ANSI color must never affect the numeric score.

---

# 82. Score and Verbose Mode

`--verbose` may expose penalty breakdowns.

It must not change the score.

---

# 83. Score and Quiet Mode

`--quiet` may reduce score presentation.

It must not change score calculation.

---

# 84. Score and JSON Mode

`--json` uses the same score object.

It does not execute a separate scoring implementation.

---

# 85. Scoring Architecture

The scoring boundary is:

```text
Detection Result
      ↓
Scoring Engine
      ↓
Score Result
      ↓
Reporting
```

The scoring engine is intentionally narrow.

---

# 86. Scoring Anti-Patterns

Prohibited patterns include:

### Rule-specific arithmetic

```text
rule → subtract 12 points
```

### Reporter scoring

```text
terminal formatter → calculate score
```

### CLI scoring

```text
command handler → calculate score
```

### Evidence scoring

```text
collector → calculate score
```

### Hidden modifiers

```text
score → undocumented bonus/penalty
```

---

# 87. Score Change Control

Any change to:

- severity penalties
- WARN multiplier
- score bands
- rounding
- clamping
- duplicate handling
- status treatment

requires a `SCORING.md` update before implementation.

---

# 88. Versioning Impact

Changing score behavior may alter user-visible results without changing CLI syntax.

Therefore scoring changes must be considered user-visible behavior and tested accordingly.

---

# 89. Antigravity Implementation Contract

Antigravity must:

1. Read this document before modifying scoring.
2. Never invent a penalty.
3. Never invent a score band.
4. Never add hidden score modifiers.
5. Never multiply by confidence unless this document explicitly changes.
6. Never calculate scores in rules.
7. Never calculate scores in reporters.
8. Never calculate scores in CLI handlers.
9. Preserve the 0–100 range.
10. Preserve deterministic scoring.
11. Preserve WARN behavior.
12. Preserve explicit handling of UNAVAILABLE and ERROR.
13. Preserve stable severity mappings.
14. Add boundary tests for scoring changes.
15. Update this specification before approved scoring changes.
16. Stop if scoring behavior is ambiguous.
17. Stop if another specification conflicts with scoring rules.
18. Never use AI/LLM output as runtime scoring logic.

---

# 90. Scoring Definition of Done

The scoring implementation is complete when:

- score starts at 100
- severity penalties are centralized
- FAIL penalties are correct
- WARN penalties are correct
- PASS/SKIPPED/UNAVAILABLE/ERROR handling is correct
- duplicates cannot cause accidental double penalties
- score is clamped
- score is rounded correctly
- score bands are correct
- partial scan scope is preserved
- coverage is transparent
- scoring is deterministic
- scoring is independently testable
- terminal and JSON outputs use the same score
- no collector/rule/reporter calculates the score

---

# 91. Final Scoring Definition

YOWTF V1 uses a transparent penalty model:

```text
START = 100

FAIL → subtract severity penalty
WARN → subtract half severity penalty
PASS → subtract 0
SKIPPED → subtract 0
UNAVAILABLE → subtract 0
ERROR → subtract 0

CLAMP → 0..100
ROUND → nearest integer
BAND → score range
```

Severity penalties are:

```text
CRITICAL = 25
HIGH     = 15
MEDIUM   = 8
LOW      = 3
INFO     = 0
```

Score bands are:

```text
90–100 → EXCELLENT
75–89  → GOOD
60–74  → FAIR
40–59  → POOR
0–39   → CRITICAL
```

The resulting score is an aggregate health signal—not a replacement for the underlying findings.

The findings explain **what is wrong**.

The score communicates **how healthy the evaluated scope is overall**.

---

**End of `docs/SCORING.md`**
