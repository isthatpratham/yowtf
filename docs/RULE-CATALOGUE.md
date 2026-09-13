# YOWTF — Rule Catalogue

**Document:** `docs/RULE-CATALOGUE.md`  
**Product:** YOWTF — Your Operating Workstation Trouble Finder  
**CLI:** `yowtf`  
**Status:** Source of Truth  
**Version:** 1.0  
**Audience:** YOWTF maintainers, contributors, reviewers, and AI coding agents

---

## 1. Purpose

This document is the authoritative catalogue of diagnostic rules for YOWTF V1.

It defines:

- every approved V1 rule
- stable rule identifiers
- rule categories
- applicability
- required evidence
- evaluation condition
- status behavior
- severity
- confidence
- explanation
- remediation guidance
- platform support
- command scope
- testing requirements

If a rule is not listed here, it is not a V1 YOWTF rule.

---

# 2. Rule Catalogue Authority

This document answers:

> **What diagnostic rules exist in YOWTF V1?**

`DETECTION-ENGINE.md` answers:

> **How are rules executed?**

`SCORING.md` answers:

> **How do rule findings affect the score?**

`COMMANDS.md` answers:

> **Which commands expose which diagnostic scopes?**

---

# 3. Rule Design Principles

Every rule must be:

- deterministic
- evidence-based
- explainable
- independently testable
- read-only
- narrowly scoped
- platform-aware
- privacy-conscious

Rules must not invent evidence.

Rules must not modify user state.

---

# 4. Rule Identifier Contract

Every rule has a unique stable ID.

IDs use lowercase dot-separated naming.

Examples:

```text
system.memory.pressure
runtime.node.unpinned
git.working-tree.dirty
```

Rule IDs must remain stable across compatible releases.

Changing an existing rule ID is a user-visible compatibility change.

---

# 5. Rule Metadata Contract

Every rule entry contains:

```text
ID
Name
Category
Purpose
Commands
Platforms
Applicability
Required Evidence
Condition
PASS behavior
FAIL behavior
WARN behavior
UNAVAILABLE behavior
ERROR behavior
Severity
Confidence
Explanation
Remediation Hint
Tests
```

---

# 6. Severity Contract

V1 severity values are:

```text
CRITICAL
HIGH
MEDIUM
LOW
INFO
```

The severity mapping is defined by `SCORING.md`.

Rules declare severity.

Rules do not directly calculate penalties.

---

# 7. Confidence Contract

V1 confidence values are:

```text
HIGH
MEDIUM
LOW
```

Confidence describes certainty.

Confidence does not directly modify numerical score.

---

# 8. Status Contract

V1 rule outcomes are:

```text
PASS
FAIL
WARN
SKIPPED
UNAVAILABLE
ERROR
```

Rules must use these semantics consistently.

---

# 9. Platform Contract

Supported V1 platforms:

```text
Windows
macOS
Linux
```

A platform-specific rule must not report FAIL on an unsupported platform merely because the platform implementation is absent.

---

# 10. Evidence Contract

Rules consume normalized evidence.

Rules should not directly perform collection when an appropriate collector exists.

Evidence may include:

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

---

# 11. Rule Applicability Contract

A rule applies only when its documented applicability conditions are satisfied.

Not applicable:

```text
≠ FAIL
```

Missing evidence:

```text
≠ PASS
```

---

# 12. Catalogue Summary

The initial V1 catalogue contains **60 rules** across the following categories:

| Category | Rules |
|---|---:|
| System | 5 |
| Disk | 4 |
| Processes | 4 |
| Ports | 4 |
| Network | 4 |
| Environment | 4 |
| Runtimes | 6 |
| Tools | 5 |
| Paths | 4 |
| Versions | 4 |
| Project | 4 |
| Dependencies | 4 |
| Git | 4 |
| Configuration | 2 |
| Caches | 2 |
| **Total** | **60** |

The rules below are the complete V1 inventory.

---

# 13. SYSTEM RULES

---

## SYS-001 — `system.memory.pressure`

**Name:** High Memory Pressure

**Category:** System

**Commands:**

```text
yowtf
yowtf doctor
yowtf system
```

**Platforms:**

```text
Windows
macOS
Linux
```

**Purpose:**

Identify unusually high current memory utilization that may affect developer workload stability.

**Required evidence:**

```text
total memory
available/free memory
memory utilization
```

**Applicability:**

Applicable when memory metrics can be collected.

**Condition:**

- PASS when utilization is below the warning threshold.
- WARN when utilization reaches the documented warning threshold.
- FAIL when utilization reaches the documented failure threshold.
- UNAVAILABLE when required memory evidence cannot be collected.

**V1 thresholds:**

```text
WARN ≥ 80%
FAIL ≥ 90%
```

**Severity:**

```text
WARN → MEDIUM
FAIL → HIGH
```

**Confidence:**

HIGH when the platform reports reliable memory metrics.

**Explanation:**

Explain that sustained high memory utilization can cause slowdowns, swapping, or application instability.

**Remediation hint:**

Inspect memory-heavy applications and current developer workloads.

**Safety:**

No process is terminated.

**Tests:**

Test:

```text
79.9% → PASS
80.0% → WARN
89.9% → WARN
90.0% → FAIL
```

---

## SYS-002 — `system.cpu.pressure`

**Name:** High CPU Pressure

**Category:** System

**Commands:**

```text
yowtf
yowtf doctor
yowtf system
```

**Platforms:**

Windows, macOS, Linux

**Purpose:**

Identify sustained/high current CPU utilization that may affect developer workflows.

**Required evidence:**

```text
CPU utilization
```

**Applicability:**

Applicable when CPU utilization can be collected.

**Condition:**

```text
< 85% → PASS
85%–94.9% → WARN
≥ 95% → FAIL
```

**Severity:**

```text
WARN → MEDIUM
FAIL → HIGH
```

**Confidence:**

HIGH when reliable CPU utilization evidence exists.

**Explanation:**

High CPU utilization may indicate a compute-heavy workload competing with development tools.

**Remediation hint:**

Inspect resource-heavy processes.

**Tests:**

Boundary tests at:

```text
84.9%
85.0%
94.9%
95.0%
```

---

## SYS-003 — `system.uptime.short`

**Name:** Recently Restarted System

**Category:** System

**Commands:**

```text
yowtf
yowtf system
```

**Platforms:**

Windows, macOS, Linux

**Purpose:**

Identify systems that have been running for a very short period.

**Required evidence:**

```text
system uptime
```

**Applicability:**

Applicable when uptime is available.

**Condition:**

```text
uptime < 1 hour → WARN
uptime ≥ 1 hour → PASS
```

**Severity:**

```text
WARN → LOW
```

**Confidence:**

HIGH.

**Explanation:**

A recently restarted workstation may have background services and development tools that have not fully returned to their normal operating state.

**Remediation hint:**

Allow normal services and development tools to initialize before interpreting transient issues.

**Tests:**

```text
59m → WARN
60m → PASS
```

---

## SYS-004 — `system.architecture.mismatch`

**Name:** Architecture Mismatch

**Category:** System

**Commands:**

```text
yowtf
yowtf system
yowtf runtimes
```

**Platforms:**

Windows, macOS, Linux

**Purpose:**

Identify a relevant mismatch between detected operating-system architecture and an explicitly required project/runtime architecture.

**Required evidence:**

```text
OS architecture
relevant project/runtime architecture requirement
```

**Applicability:**

Only when an explicit architecture requirement exists.

**Condition:**

```text
matching architecture → PASS
mismatch → FAIL
missing requirement → SKIPPED
```

**Severity:**

```text
FAIL → HIGH
```

**Confidence:**

HIGH when both architectures are explicit.

**Explanation:**

Explain the detected architecture mismatch and the affected project/runtime.

**Remediation hint:**

Inspect the project's architecture requirements and installed runtime/tool architecture.

---

## SYS-005 — `system.platform.supported`

**Name:** Supported Operating System

**Category:** System

**Commands:**

```text
yowtf
yowtf system
```

**Platforms:**

All runtime platforms; evaluates against YOWTF's supported platform list.

**Purpose:**

Determine whether YOWTF is running on a supported operating system.

**Required evidence:**

```text
operating system
```

**Condition:**

```text
supported → PASS
unsupported → UNAVAILABLE
```

**Severity:**

No failure penalty.

**Confidence:**

HIGH.

**Explanation:**

Identify whether the current operating system has official V1 diagnostic support.

**Remediation hint:**

Run YOWTF on a supported platform for full diagnostics.

---

# 14. DISK RULES

---

## DISK-001 — `disk.space.low`

**Name:** Low Disk Space

**Category:** Disk

**Commands:**

```text
yowtf
yowtf doctor
yowtf disk
```

**Platforms:**

Windows, macOS, Linux

**Purpose:**

Identify low available disk space.

**Required evidence:**

```text
total capacity
available capacity
free percentage
```

**Condition:**

```text
free ≥ 15% → PASS
free 10%–14.9% → WARN
free < 10% → FAIL
```

**Severity:**

```text
WARN → MEDIUM
FAIL → HIGH
```

**Confidence:**

HIGH.

**Explanation:**

Low free space can affect builds, package managers, caches, logs, and operating-system behavior.

**Remediation hint:**

Inspect large files, build artifacts, and developer caches.

---

## DISK-002 — `disk.developer-storage.pressure`

**Name:** Developer Storage Pressure

**Category:** Disk

**Commands:**

```text
yowtf
yowtf disk
yowtf caches
yowtf clean
```

**Platforms:**

Windows, macOS, Linux

**Purpose:**

Identify excessive storage consumption by known developer-related directories.

**Required evidence:**

```text
known developer cache/build/dependency directory sizes
```

**Applicability:**

Only when supported developer locations can be identified safely.

**Condition:**

```text
developer storage below threshold → PASS
developer storage reaches threshold → WARN
developer storage reaches severe threshold → FAIL
```

**V1 thresholds:**

```text
WARN ≥ 20 GB
FAIL ≥ 50 GB
```

**Severity:**

```text
WARN → LOW
FAIL → MEDIUM
```

**Confidence:**

MEDIUM unless all relevant storage locations are known.

**Explanation:**

Explain that developer artifacts are consuming substantial local storage.

**Remediation hint:**

Review cleanup candidates before deleting anything.

---

## DISK-003 — `disk.project.location.unavailable`

**Name:** Project Storage Location Unavailable

**Category:** Disk

**Commands:**

```text
yowtf
yowtf project
yowtf disk
```

**Platforms:**

Windows, macOS, Linux

**Purpose:**

Identify when the project target cannot be inspected because its storage location is unavailable.

**Required evidence:**

```text
project path
filesystem accessibility
```

**Condition:**

```text
accessible → PASS
inaccessible → UNAVAILABLE
```

**Severity:**

No penalty.

**Confidence:**

HIGH.

**Explanation:**

Explain that YOWTF could not inspect the target path.

**Remediation hint:**

Check path existence and permissions.

---

## DISK-004 — `disk.filesystem.readonly`

**Name:** Read-Only Project Filesystem

**Category:** Disk

**Commands:**

```text
yowtf
yowtf doctor
yowtf project
yowtf disk
```

**Platforms:**

Windows, macOS, Linux

**Purpose:**

Identify when the project filesystem is read-only where this can affect normal development workflows.

**Required evidence:**

```text
project path
filesystem mount/read-only metadata
```

**Applicability:**

Only when reliable read-only filesystem information is available.

**Condition:**

```text
writable → PASS
read-only → WARN
```

**Severity:**

```text
WARN → MEDIUM
```

**Confidence:**

HIGH when filesystem state is explicit.

**Explanation:**

A read-only project location can prevent tools from creating builds, dependencies, generated files, or other expected development artifacts.

**Remediation hint:**

Inspect filesystem permissions and mount configuration.

---

# 15. PROCESS RULES

---

## PROC-001 — `process.resource.hog`

**Name:** Resource-Heavy Process

**Category:** Processes

**Commands:**

```text
yowtf
yowtf doctor
yowtf processes
```

**Platforms:**

Windows, macOS, Linux

**Purpose:**

Identify a process consuming unusually high CPU resources.

**Required evidence:**

```text
process CPU utilization
process identity
```

**Condition:**

```text
< 80% → PASS
80%–94.9% → WARN
≥ 95% → FAIL
```

**Severity:**

```text
WARN → LOW
FAIL → MEDIUM
```

**Confidence:**

HIGH when process metrics are available.

**Explanation:**

Explain which process is consuming substantial CPU.

**Remediation hint:**

Inspect whether the process is expected for the current workload.

**Safety:**

Never terminate the process.

---

## PROC-002 — `process.memory.hog`

**Name:** Memory-Heavy Process

**Category:** Processes

**Commands:**

```text
yowtf
yowtf doctor
yowtf processes
```

**Platforms:**

Windows, macOS, Linux

**Purpose:**

Identify a process consuming unusually high memory.

**Required evidence:**

```text
process memory usage
process identity
```

**Condition:**

A process using:

```text
≥ 10% of total physical memory → WARN
≥ 20% of total physical memory → FAIL
```

**Severity:**

```text
WARN → LOW
FAIL → MEDIUM
```

**Confidence:**

HIGH.

**Explanation:**

Explain that the identified process is consuming substantial system memory.

**Remediation hint:**

Inspect whether the process is expected and whether its workload can be reduced.

---

## PROC-003 — `process.development.zombie`

**Name:** Zombie/Defunct Development Process

**Category:** Processes

**Commands:**

```text
yowtf
yowtf processes
```

**Platforms:**

Linux where reliable process state is available.

**Purpose:**

Identify defunct/zombie processes associated with development workflows.

**Required evidence:**

```text
process state
process identity
```

**Condition:**

```text
no relevant zombie → PASS
relevant zombie detected → WARN
```

**Severity:**

```text
WARN → LOW
```

**Confidence:**

HIGH.

**Explanation:**

Explain that a defunct process remains in the process table.

**Remediation hint:**

Inspect the parent process and the development tool that created it.

**Platform behavior:**

Non-Linux platforms return NOT_APPLICABLE/SKIPPED.

---

## PROC-004 — `process.development.duplicate`

**Name:** Duplicate Development Process

**Category:** Processes

**Commands:**

```text
yowtf
yowtf processes
```

**Platforms:**

Windows, macOS, Linux

**Purpose:**

Identify unusually duplicated development processes that may indicate accidental duplicate servers/watchers.

**Required evidence:**

```text
process names
command metadata where safely available
process count
```

**Applicability:**

Only for explicitly recognized development process patterns.

**Condition:**

```text
normal count → PASS
suspicious duplicate count → WARN
```

**Severity:**

```text
WARN → LOW
```

**Confidence:**

MEDIUM.

**Explanation:**

Explain that multiple instances of a development process were detected.

**Remediation hint:**

Inspect whether the duplicate instances are intentional.

---

# 16. PORT RULES

---

## PORT-001 — `port.development.conflict`

**Name:** Development Port Conflict

**Category:** Ports

**Commands:**

```text
yowtf
yowtf doctor
yowtf ports
```

**Platforms:**

Windows, macOS, Linux

**Purpose:**

Identify a known development port already occupied by another process.

**Required evidence:**

```text
listening port
associated process
recognized development port
```

**Condition:**

```text
no conflict → PASS
conflict → WARN
```

**Severity:**

```text
WARN → MEDIUM
```

**Confidence:**

HIGH when port ownership is known.

**Explanation:**

Explain which process currently occupies the relevant development port.

**Remediation hint:**

Inspect the owning process and project configuration.

**Safety:**

Do not terminate the process.

---

## PORT-002 — `port.duplicate.listener`

**Name:** Duplicate Listener Detection

**Category:** Ports

**Commands:**

```text
yowtf
yowtf ports
```

**Platforms:**

Windows, macOS, Linux

**Purpose:**

Identify multiple relevant listeners competing for the same expected endpoint where the operating system permits distinguishable bindings.

**Required evidence:**

```text
local address
port
process
listener metadata
```

**Condition:**

```text
normal → PASS
conflicting listeners → WARN
```

**Severity:**

```text
WARN → MEDIUM
```

**Confidence:**

HIGH.

**Explanation:**

Explain the conflicting listeners.

**Remediation hint:**

Inspect listener bindings and project configuration.

---

## PORT-003 — `port.unexpected.exposure`

**Name:** Unexpected Local Port Exposure

**Category:** Ports

**Commands:**

```text
yowtf
yowtf ports
```

**Platforms:**

Windows, macOS, Linux

**Purpose:**

Identify development-related services listening on a broad local interface when the project appears to expect local-only access.

**Required evidence:**

```text
listen address
port
process
project context where available
```

**Applicability:**

Only when project/tool context provides an explicit local-only expectation.

**Condition:**

```text
local-only binding → PASS
broader binding → WARN
```

**Severity:**

```text
WARN → MEDIUM
```

**Confidence:**

MEDIUM.

**Explanation:**

Explain that a development service is listening beyond the expected local-only scope.

**Remediation hint:**

Inspect the server's bind/listen configuration.

---

## PORT-004 — `port.process.unavailable`

**Name:** Port Owner Unavailable

**Category:** Ports

**Commands:**

```text
yowtf
yowtf ports
```

**Platforms:**

Windows, macOS, Linux

**Purpose:**

Represent a listening port for which the owning process cannot be identified.

**Required evidence:**

```text
listening port
ownership lookup result
```

**Condition:**

```text
owner known → PASS
owner unavailable → UNAVAILABLE
```

**Severity:**

No penalty.

**Confidence:**

HIGH.

**Explanation:**

Explain that the port is observable but ownership information could not be retrieved.

**Remediation hint:**

Inspect the port using platform-specific tools with appropriate permissions.

---

# 17. NETWORK RULES

---

## NET-001 — `network.interface.unavailable`

**Name:** Network Interface Information Unavailable

**Category:** Network

**Commands:**

```text
yowtf
yowtf network
```

**Platforms:**

Windows, macOS, Linux

**Purpose:**

Represent inability to collect local network interface information.

**Required evidence:**

```text
network interface metadata
```

**Condition:**

```text
available → PASS
unavailable → UNAVAILABLE
```

**Severity:**

No penalty.

**Confidence:**

HIGH.

---

## NET-002 — `network.dns.configuration.missing`

**Name:** DNS Configuration Missing

**Category:** Network

**Commands:**

```text
yowtf
yowtf network
```

**Platforms:**

Windows, macOS, Linux

**Purpose:**

Identify a local network configuration with no usable DNS server information where the platform exposes such configuration.

**Required evidence:**

```text
DNS configuration
network interface state
```

**Condition:**

```text
usable DNS configuration → PASS
no usable DNS configuration → WARN
```

**Severity:**

```text
WARN → MEDIUM
```

**Confidence:**

HIGH when platform configuration is explicit.

**Explanation:**

Explain that DNS configuration may prevent developer tools from resolving hostnames.

**Remediation hint:**

Inspect active network adapter DNS configuration.

---

## NET-003 — `network.proxy.configuration.suspicious`

**Name:** Suspicious Proxy Configuration

**Category:** Network

**Commands:**

```text
yowtf
yowtf network
yowtf env
```

**Platforms:**

Windows, macOS, Linux

**Purpose:**

Identify proxy configuration that appears incomplete or malformed.

**Required evidence:**

```text
proxy configuration metadata
proxy variable names/format
```

**Applicability:**

Only when proxy configuration is explicitly present.

**Condition:**

```text
valid → PASS
malformed/incomplete → WARN
```

**Severity:**

```text
WARN → LOW
```

**Confidence:**

MEDIUM.

**Privacy:**

Do not expose proxy credentials.

---

## NET-004 — `network.route.configuration.unavailable`

**Name:** Local Route Information Unavailable

**Category:** Network

**Commands:**

```text
yowtf
yowtf network
```

**Platforms:**

Windows, macOS, Linux

**Purpose:**

Represent inability to obtain local route information required by applicable network diagnostics.

**Required evidence:**

```text
routing metadata
```

**Condition:**

```text
available → PASS
unavailable → UNAVAILABLE
```

**Severity:**

No penalty.

**Confidence:**

HIGH.

---

# 18. ENVIRONMENT RULES

---

## ENV-001 — `environment.path.empty-entry`

**Name:** Empty PATH Entry

**Category:** Environment

**Commands:**

```text
yowtf
yowtf env
yowtf paths
```

**Platforms:**

Windows, macOS, Linux

**Purpose:**

Identify empty PATH entries that can create platform-specific command-resolution behavior.

**Required evidence:**

```text
PATH entries
```

**Condition:**

```text
no empty entry → PASS
empty entry detected → WARN
```

**Severity:**

```text
WARN → LOW
```

**Confidence:**

HIGH.

**Explanation:**

Explain that empty PATH entries can create ambiguous or unintended executable resolution.

**Remediation hint:**

Inspect PATH construction and remove unintended empty entries.

---

## ENV-002 — `environment.secret.exposure`

**Name:** Potential Secret in Environment Metadata

**Category:** Environment

**Commands:**

```text
yowtf
yowtf env
```

**Platforms:**

Windows, macOS, Linux

**Purpose:**

Identify environment variable names that strongly suggest credentials or secrets are present.

**Required evidence:**

```text
environment variable names only
```

**Applicability:**

Applicable when environment variable names are available.

**Condition:**

```text
no suspicious secret-like names → PASS
suspicious secret-like names → WARN
```

**Severity:**

```text
WARN → MEDIUM
```

**Confidence:**

MEDIUM.

**Privacy:**

Never display the variable's value.

**Explanation:**

Explain that a secret-like environment variable exists and may deserve review.

**Remediation hint:**

Review whether sensitive values are appropriately scoped and managed.

---

## ENV-003 — `environment.path.duplicate`

**Name:** Duplicate PATH Entry

**Category:** Environment

**Commands:**

```text
yowtf
yowtf env
yowtf paths
```

**Platforms:**

Windows, macOS, Linux

**Purpose:**

Identify duplicate normalized PATH entries.

**Required evidence:**

```text
PATH entries
normalized paths
```

**Condition:**

```text
no duplicates → PASS
duplicates → WARN
```

**Severity:**

```text
WARN → LOW
```

**Confidence:**

HIGH.

**Explanation:**

Duplicate PATH entries can make environment configuration harder to reason about.

**Remediation hint:**

Review duplicate PATH entries.

---

## ENV-004 — `environment.shell.path-mismatch`

**Name:** Shell Environment PATH Mismatch

**Category:** Environment

**Commands:**

```text
yowtf
yowtf env
yowtf paths
```

**Platforms:**

Windows, macOS, Linux

**Purpose:**

Identify a detectable mismatch between the shell environment PATH and the expected user/system PATH configuration.

**Required evidence:**

```text
current process PATH
platform PATH metadata where available
```

**Applicability:**

Only where the platform exposes a reliable comparison.

**Condition:**

```text
consistent → PASS
mismatch → WARN
comparison unavailable → UNAVAILABLE
```

**Severity:**

```text
WARN → MEDIUM
```

**Confidence:**

MEDIUM.

**Explanation:**

Explain that the current shell may resolve tools differently from the expected environment.

**Remediation hint:**

Inspect shell initialization and PATH configuration.

---

# 19. RUNTIME RULES

---

## RUN-001 — `runtime.node.unavailable`

**Name:** Node.js Runtime Unavailable

**Category:** Runtimes

**Commands:**

```text
yowtf
yowtf doctor
yowtf runtimes
```

**Platforms:**

Windows, macOS, Linux

**Purpose:**

Represent inability to determine the Node.js runtime where Node.js is required by the current diagnostic scope.

**Required evidence:**

```text
Node executable resolution
Node version
project context where relevant
```

**Applicability:**

Applicable to Node-related project scopes.

**Condition:**

```text
Node available → PASS
Node unavailable → UNAVAILABLE
```

**Severity:**

No direct penalty.

---

## RUN-002 — `runtime.node.unpinned`

**Name:** Node.js Version Not Pinned

**Category:** Runtimes

**Commands:**

```text
yowtf
yowtf doctor
yowtf runtimes
yowtf project
```

**Platforms:**

Windows, macOS, Linux

**Purpose:**

Identify a Node.js project without an explicit runtime-version policy.

**Required evidence:**

```text
project manifest
runtime configuration files
package metadata
```

**Applicability:**

Applicable to Node.js projects.

**Condition:**

```text
explicit runtime policy → PASS
no explicit runtime policy → FAIL
```

**Severity:**

```text
FAIL → MEDIUM
```

**Confidence:**

HIGH when all supported runtime policy locations were checked.

**Explanation:**

An unpinned runtime can cause different Node.js versions to be used across developer machines.

**Remediation hint:**

Define an explicit Node.js version policy using a project-supported mechanism.

---

## RUN-003 — `runtime.python.unavailable`

**Name:** Python Runtime Unavailable

**Category:** Runtimes

**Commands:**

```text
yowtf
yowtf runtimes
```

**Platforms:**

Windows, macOS, Linux

**Purpose:**

Represent inability to determine Python runtime availability for an applicable Python scope.

**Required evidence:**

```text
Python executable resolution
Python version
project context where relevant
```

**Applicability:**

Python-related projects/scopes only.

**Condition:**

```text
available → PASS
unavailable → UNAVAILABLE
```

**Severity:**

No direct penalty.

---

## RUN-004 — `runtime.python.unpinned`

**Name:** Python Version Not Pinned

**Category:** Runtimes

**Commands:**

```text
yowtf
yowtf doctor
yowtf runtimes
yowtf project
```

**Platforms:**

Windows, macOS, Linux

**Purpose:**

Identify a Python project without an explicit Python runtime policy.

**Required evidence:**

```text
Python project metadata
runtime policy files
```

**Applicability:**

Python projects only.

**Condition:**

```text
explicit runtime policy → PASS
no explicit runtime policy → FAIL
```

**Severity:**

```text
FAIL → MEDIUM
```

**Confidence:**

HIGH when supported policy locations are checked.

**Explanation:**

Different Python versions can change dependency behavior and runtime compatibility.

**Remediation hint:**

Define the project's Python version policy.

---

## RUN-005 — `runtime.java.unavailable`

**Name:** Java Runtime Unavailable

**Category:** Runtimes

**Commands:**

```text
yowtf
yowtf runtimes
```

**Platforms:**

Windows, macOS, Linux

**Purpose:**

Represent unavailable Java runtime information for an applicable Java scope.

**Required evidence:**

```text
Java executable resolution
Java version
project context
```

**Applicability:**

Java-related projects/scopes only.

**Condition:**

```text
available → PASS
unavailable → UNAVAILABLE
```

**Severity:**

No direct penalty.

---

## RUN-006 — `runtime.version.mismatch`

**Name:** Runtime Version Mismatch

**Category:** Runtimes

**Commands:**

```text
yowtf
yowtf doctor
yowtf runtimes
yowtf versions
```

**Platforms:**

Windows, macOS, Linux

**Purpose:**

Identify a runtime version that conflicts with an explicit project requirement.

**Required evidence:**

```text
resolved runtime version
project runtime requirement
```

**Applicability:**

Only when an explicit runtime requirement exists.

**Condition:**

```text
satisfies requirement → PASS
does not satisfy requirement → FAIL
```

**Severity:**

```text
FAIL → HIGH
```

**Confidence:**

HIGH.

**Explanation:**

Explain the installed/resolved runtime version and required version range.

**Remediation hint:**

Use the project's documented runtime version.

---

# 20. TOOL RULES

---

## TOOL-001 — `tool.git.unavailable`

**Name:** Git Unavailable

**Category:** Tools

**Commands:**

```text
yowtf
yowtf tools
yowtf git
```

**Platforms:**

Windows, macOS, Linux

**Purpose:**

Represent inability to resolve Git when a Git scope requires it.

**Required evidence:**

```text
Git executable resolution
Git version
```

**Applicability:**

Git-related project/scopes.

**Condition:**

```text
available → PASS
unavailable → UNAVAILABLE
```

**Severity:**

No direct penalty.

---

## TOOL-002 — `tool.package-manager.mismatch`

**Name:** Package Manager Mismatch

**Category:** Tools

**Commands:**

```text
yowtf
yowtf doctor
yowtf tools
yowtf project
yowtf deps
```

**Platforms:**

Windows, macOS, Linux

**Purpose:**

Identify when project metadata indicates one package manager while another appears to be the active/resolved package manager.

**Required evidence:**

```text
project package-manager metadata
lockfile identity
resolved package-manager executable
```

**Applicability:**

Applicable to supported package-manager projects.

**Condition:**

```text
consistent → PASS
mismatch → WARN
insufficient evidence → UNAVAILABLE
```

**Severity:**

```text
WARN → MEDIUM
```

**Confidence:**

HIGH when project metadata is explicit.

**Explanation:**

Different package managers can resolve dependencies differently.

**Remediation hint:**

Use the package manager specified by the project.

---

## TOOL-003 — `tool.package-manager.missing`

**Name:** Required Package Manager Missing

**Category:** Tools

**Commands:**

```text
yowtf
yowtf doctor
yowtf tools
yowtf deps
```

**Platforms:**

Windows, macOS, Linux

**Purpose:**

Identify when a project explicitly requires a package manager that cannot be resolved.

**Required evidence:**

```text
project package-manager requirement
executable resolution
```

**Applicability:**

Only when the project explicitly identifies a package manager.

**Condition:**

```text
available → PASS
missing → FAIL
```

**Severity:**

```text
FAIL → HIGH
```

**Confidence:**

HIGH.

**Explanation:**

Explain that the project identifies a package manager that is not available on the current PATH.

**Remediation hint:**

Install/use the project's documented package manager manually.

YOWTF does not install it.

---

## TOOL-004 — `tool.docker.unavailable`

**Name:** Docker Unavailable

**Category:** Tools

**Commands:**

```text
yowtf
yowtf tools
```

**Platforms:**

Windows, macOS, Linux

**Purpose:**

Represent Docker availability when Docker is explicitly relevant to the detected project.

**Required evidence:**

```text
Docker executable
project/container metadata
```

**Applicability:**

Docker-related projects only.

**Condition:**

```text
available → PASS
unavailable → UNAVAILABLE
```

**Severity:**

No direct penalty.

---

## TOOL-005 — `tool.executable.shadowing`

**Name:** Executable Shadowing

**Category:** Tools

**Commands:**

```text
yowtf
yowtf doctor
yowtf tools
yowtf paths
yowtf versions
```

**Platforms:**

Windows, macOS, Linux

**Purpose:**

Identify multiple executable locations for the same developer tool where PATH ordering can determine which version is used.

**Required evidence:**

```text
executable resolution
PATH locations
tool identity
version metadata where available
```

**Condition:**

```text
single expected executable → PASS
multiple conflicting executable locations → WARN
```

**Severity:**

```text
WARN → MEDIUM
```

**Confidence:**

HIGH when executable paths and versions are known.

**Explanation:**

Explain that multiple installations can make tool resolution unpredictable.

**Remediation hint:**

Inspect PATH ordering and remove unintended duplicate installations.

---

# 21. PATH RULES

---

## PATH-001 — `path.executable.missing`

**Name:** Expected Executable Missing

**Category:** Paths

**Commands:**

```text
yowtf
yowtf doctor
yowtf paths
yowtf tools
```

**Platforms:**

Windows, macOS, Linux

**Purpose:**

Identify an explicitly required executable that cannot be resolved.

**Required evidence:**

```text
expected executable
PATH
resolution result
project/tool requirement
```

**Applicability:**

Only when a project/tool explicitly requires the executable.

**Condition:**

```text
resolved → PASS
not resolved → FAIL
```

**Severity:**

```text
FAIL → HIGH
```

**Confidence:**

HIGH.

---

## PATH-002 — `path.executable.multiple`

**Name:** Multiple Executable Resolutions

**Category:** Paths

**Commands:**

```text
yowtf
yowtf paths
yowtf versions
```

**Platforms:**

Windows, macOS, Linux

**Purpose:**

Identify multiple installations of the same executable available through PATH resolution.

**Required evidence:**

```text
executable locations
tool identity
```

**Condition:**

```text
single → PASS
multiple → WARN
```

**Severity:**

```text
WARN → LOW
```

**Confidence:**

HIGH.

---

## PATH-003 — `path.entry.invalid`

**Name:** Invalid PATH Entry

**Category:** Paths

**Commands:**

```text
yowtf
yowtf env
yowtf paths
```

**Platforms:**

Windows, macOS, Linux

**Purpose:**

Identify PATH entries that are syntactically or structurally invalid.

**Required evidence:**

```text
PATH entries
filesystem metadata
platform path semantics
```

**Condition:**

```text
valid entries → PASS
invalid entries → WARN
```

**Severity:**

```text
WARN → LOW
```

**Confidence:**

HIGH when filesystem validation is available.

---

## PATH-004 — `path.order.shadowing`

**Name:** PATH Order Shadowing

**Category:** Paths

**Commands:**

```text
yowtf
yowtf doctor
yowtf paths
yowtf versions
```

**Platforms:**

Windows, macOS, Linux

**Purpose:**

Identify PATH ordering where an unintended executable precedes the project's expected executable.

**Required evidence:**

```text
expected executable
resolved executable
all matching executable paths
project/tool expectation
```

**Applicability:**

Only when an explicit expected executable/tool version is known.

**Condition:**

```text
expected resolution → PASS
unexpected earlier executable → WARN
```

**Severity:**

```text
WARN → MEDIUM
```

**Confidence:**

HIGH.

---

# 22. VERSION RULES

---

## VER-001 — `version.runtime.conflict`

**Name:** Runtime Version Conflict

**Category:** Versions

**Commands:**

```text
yowtf
yowtf runtimes
yowtf versions
```

**Platforms:**

Windows, macOS, Linux

**Purpose:**

Identify conflicting versions of the same runtime available on the workstation.

**Required evidence:**

```text
runtime executable locations
runtime versions
PATH resolution
```

**Condition:**

```text
no relevant conflict → PASS
conflicting versions → WARN
```

**Severity:**

```text
WARN → MEDIUM
```

**Confidence:**

HIGH when executable paths and versions are known.

---

## VER-002 — `version.tool.conflict`

**Name:** Developer Tool Version Conflict

**Category:** Versions

**Commands:**

```text
yowtf
yowtf tools
yowtf versions
```

**Platforms:**

Windows, macOS, Linux

**Purpose:**

Identify multiple versions of a developer tool that may be selected differently depending on PATH.

**Required evidence:**

```text
tool executable locations
tool versions
PATH resolution
```

**Condition:**

```text
no conflict → PASS
conflict → WARN
```

**Severity:**

```text
WARN → MEDIUM
```

**Confidence:**

HIGH.

---

## VER-003 — `version.project.runtime.unsatisfied`

**Name:** Project Runtime Requirement Unsatisfied

**Category:** Versions

**Commands:**

```text
yowtf
yowtf doctor
yowtf versions
yowtf project
```

**Platforms:**

Windows, macOS, Linux

**Purpose:**

Identify when a resolved runtime version does not satisfy an explicit project requirement.

**Required evidence:**

```text
resolved runtime version
project version requirement
```

**Condition:**

```text
satisfied → PASS
unsatisfied → FAIL
```

**Severity:**

```text
FAIL → HIGH
```

**Confidence:**

HIGH.

---

## VER-004 — `version.tool.outdated`

**Name:** Developer Tool Version Below Project Requirement

**Category:** Versions

**Commands:**

```text
yowtf
yowtf tools
yowtf versions
```

**Platforms:**

Windows, macOS, Linux

**Purpose:**

Identify a developer tool version that is below an explicit project requirement.

**Required evidence:**

```text
resolved tool version
explicit project/tool minimum version
```

**Applicability:**

Only when a minimum version is explicitly defined.

**Condition:**

```text
meets minimum → PASS
below minimum → FAIL
```

**Severity:**

```text
FAIL → MEDIUM
```

**Confidence:**

HIGH.

---

# 23. PROJECT RULES

---

## PROJ-001 — `project.manifest.missing`

**Name:** Project Manifest Missing

**Category:** Project

**Commands:**

```text
yowtf
yowtf project
```

**Platforms:**

Windows, macOS, Linux

**Purpose:**

Identify a project-like directory that lacks the manifest expected for its detected project type.

**Required evidence:**

```text
project discovery
project type indicators
manifest presence
```

**Applicability:**

Only when project type can be determined with sufficient confidence.

**Condition:**

```text
expected manifest exists → PASS
expected manifest missing → WARN
```

**Severity:**

```text
WARN → MEDIUM
```

**Confidence:**

MEDIUM.

---

## PROJ-002 — `project.lockfile.missing`

**Name:** Project Lockfile Missing

**Category:** Project

**Commands:**

```text
yowtf
yowtf doctor
yowtf project
yowtf deps
```

**Platforms:**

Windows, macOS, Linux

**Purpose:**

Identify a dependency-managed project without an expected lockfile.

**Required evidence:**

```text
project manifest
package-manager identity
lockfile presence
```

**Applicability:**

Only for project ecosystems where a lockfile is expected.

**Condition:**

```text
lockfile present → PASS
lockfile absent → FAIL
```

**Severity:**

```text
FAIL → HIGH
```

**Confidence:**

HIGH when package-manager expectations are explicit.

**Explanation:**

A missing lockfile can allow dependency resolution to differ between environments.

**Remediation hint:**

Use the project's documented dependency workflow to generate and commit the appropriate lockfile.

YOWTF does not generate it automatically.

---

## PROJ-003 — `project.runtime.policy.missing`

**Name:** Project Runtime Policy Missing

**Category:** Project

**Commands:**

```text
yowtf
yowtf project
yowtf runtimes
```

**Platforms:**

Windows, macOS, Linux

**Purpose:**

Identify a recognized project without an explicit runtime version policy.

**Required evidence:**

```text
project type
runtime policy files/metadata
```

**Applicability:**

Recognized runtime-managed projects.

**Condition:**

```text
policy present → PASS
policy missing → WARN
```

**Severity:**

```text
WARN → MEDIUM
```

**Confidence:**

HIGH when supported policy locations were checked.

---

## PROJ-004 — `project.root.ambiguous`

**Name:** Ambiguous Project Root

**Category:** Project

**Commands:**

```text
yowtf
yowtf project
```

**Platforms:**

Windows, macOS, Linux

**Purpose:**

Identify situations where multiple plausible project roots are detected and the target cannot be resolved confidently.

**Required evidence:**

```text
directory hierarchy
project markers
```

**Condition:**

```text
single clear root → PASS
multiple ambiguous roots → WARN
```

**Severity:**

```text
WARN → LOW
```

**Confidence:**

HIGH when ambiguity is structural.

**Explanation:**

Explain which project markers caused ambiguity.

**Remediation hint:**

Run YOWTF with an explicit `--path`.

---

# 24. DEPENDENCY RULES

---

## DEP-001 — `dependency.lockfile.missing`

**Name:** Dependency Lockfile Missing

**Category:** Dependencies

**Commands:**

```text
yowtf
yowtf doctor
yowtf deps
```

**Platforms:**

Windows, macOS, Linux

**Purpose:**

Identify a dependency-managed project without its expected lockfile.

**Required evidence:**

```text
manifest
dependency ecosystem
lockfile
```

**Condition:**

```text
present → PASS
missing → FAIL
```

**Severity:**

```text
FAIL → HIGH
```

**Confidence:**

HIGH.

---

## DEP-002 — `dependency.lockfile.mismatch`

**Name:** Dependency Lockfile Mismatch

**Category:** Dependencies

**Commands:**

```text
yowtf
yowtf doctor
yowtf deps
```

**Platforms:**

Windows, macOS, Linux

**Purpose:**

Identify an apparent mismatch between dependency manifest and lockfile metadata where reliable comparison is available.

**Required evidence:**

```text
manifest dependency metadata
lockfile dependency metadata
```

**Condition:**

```text
consistent → PASS
mismatch → FAIL
comparison unavailable → UNAVAILABLE
```

**Severity:**

```text
FAIL → HIGH
```

**Confidence:**

HIGH when comparison is complete.

**Explanation:**

Explain that dependency declarations and lockfile state do not appear synchronized.

**Remediation hint:**

Review the dependency workflow and regenerate/update the lockfile manually.

---

## DEP-003 — `dependency.package-manager.mismatch`

**Name:** Dependency Package Manager Mismatch

**Category:** Dependencies

**Commands:**

```text
yowtf
yowtf deps
yowtf tools
```

**Platforms:**

Windows, macOS, Linux

**Purpose:**

Identify project metadata that points to one package manager while dependency metadata indicates another.

**Required evidence:**

```text
package-manager declaration
lockfile identity
manifest metadata
```

**Condition:**

```text
consistent → PASS
mismatch → WARN
```

**Severity:**

```text
WARN → MEDIUM
```

**Confidence:**

HIGH.

---

## DEP-004 — `dependency.directory.inconsistent`

**Name:** Dependency Directory Inconsistency

**Category:** Dependencies

**Commands:**

```text
yowtf
yowtf deps
yowtf project
```

**Platforms:**

Windows, macOS, Linux

**Purpose:**

Identify a dependency directory state that is inconsistent with the detected dependency metadata.

**Required evidence:**

```text
manifest
lockfile
dependency directory metadata
```

**Applicability:**

Only where the ecosystem provides reliable metadata for comparison.

**Condition:**

```text
consistent → PASS
inconsistent → WARN
comparison unavailable → UNAVAILABLE
```

**Severity:**

```text
WARN → MEDIUM
```

**Confidence:**

MEDIUM.

**Explanation:**

Explain that local dependency state may not correspond to project dependency metadata.

**Remediation hint:**

Review the project's documented dependency installation workflow.

YOWTF does not reinstall dependencies.

---

# 25. GIT RULES

---

## GIT-001 — `git.repository.missing`

**Name:** Git Repository Missing

**Category:** Git

**Commands:**

```text
yowtf
yowtf git
yowtf project
```

**Platforms:**

Windows, macOS, Linux

**Purpose:**

Identify a project that appears to be version-controlled but has no detectable Git repository metadata.

**Required evidence:**

```text
project markers
Git metadata
```

**Applicability:**

Only when project context indicates Git is expected.

**Condition:**

```text
repository exists → PASS
expected repository missing → WARN
```

**Severity:**

```text
WARN → MEDIUM
```

**Confidence:**

MEDIUM.

---

## GIT-002 — `git.working-tree.dirty`

**Name:** Dirty Working Tree

**Category:** Git

**Commands:**

```text
yowtf
yowtf doctor
yowtf git
```

**Platforms:**

Windows, macOS, Linux

**Purpose:**

Identify uncommitted working-tree changes.

**Required evidence:**

```text
Git status
```

**Applicability:**

Git repositories.

**Condition:**

```text
clean → PASS
dirty → WARN
```

**Severity:**

```text
WARN → LOW
```

**Confidence:**

HIGH.

**Explanation:**

Explain that local modifications exist.

**Remediation hint:**

Review the working tree before comparing behavior across environments.

**Safety:**

No Git mutation is performed.

---

## GIT-003 — `git.untracked.files`

**Name:** Untracked Files Present

**Category:** Git

**Commands:**

```text
yowtf
yowtf git
```

**Platforms:**

Windows, macOS, Linux

**Purpose:**

Identify untracked files in a project repository.

**Required evidence:**

```text
Git status
untracked file metadata
```

**Applicability:**

Git repositories.

**Condition:**

```text
none → PASS
present → WARN
```

**Severity:**

```text
WARN → LOW
```

**Confidence:**

HIGH.

**Explanation:**

Untracked files may contain local configuration, generated files, or other state not shared through version control.

**Remediation hint:**

Review untracked files and determine whether they should be committed or ignored.

---

## GIT-004 — `git.branch.divergence`

**Name:** Branch Divergence

**Category:** Git

**Commands:**

```text
yowtf
yowtf git
```

**Platforms:**

Windows, macOS, Linux

**Purpose:**

Identify a branch with local commits ahead/behind its tracked upstream where reliable local Git metadata is available.

**Required evidence:**

```text
current branch
upstream metadata
local commit relationship
```

**Applicability:**

Only when an upstream relationship is available.

**Condition:**

```text
aligned → PASS
diverged/ahead/behind → WARN
upstream unavailable → UNAVAILABLE
```

**Severity:**

```text
WARN → LOW
```

**Confidence:**

HIGH.

**Privacy:**

Do not contact remote servers solely to determine this state.

Use already available local Git metadata.

---

# 26. CONFIGURATION RULES

---

## CFG-001 — `config.environment.file.missing`

**Name:** Expected Environment Configuration Missing

**Category:** Configuration

**Commands:**

```text
yowtf
yowtf config
yowtf project
```

**Platforms:**

Windows, macOS, Linux

**Purpose:**

Identify a project that explicitly documents or structurally requires an environment configuration file that is absent.

**Required evidence:**

```text
project configuration
expected file metadata
file presence
```

**Applicability:**

Only when the project explicitly indicates that the file is expected.

**Condition:**

```text
present → PASS
missing → WARN
```

**Severity:**

```text
WARN → MEDIUM
```

**Confidence:**

HIGH when requirement is explicit.

**Privacy:**

Do not print file contents.

---

## CFG-002 — `config.required.value.missing`

**Name:** Required Configuration Metadata Missing

**Category:** Configuration

**Commands:**

```text
yowtf
yowtf config
yowtf env
```

**Platforms:**

Windows, macOS, Linux

**Purpose:**

Identify an explicitly required configuration key whose presence can be safely checked without exposing its value.

**Required evidence:**

```text
required key metadata
configuration key names
environment variable names
```

**Applicability:**

Only when the project explicitly defines the required key.

**Condition:**

```text
present → PASS
missing → FAIL
```

**Severity:**

```text
FAIL → HIGH
```

**Confidence:**

HIGH.

**Privacy:**

Check presence only; never expose secret values.

---

# 27. CACHE RULES

---

## CACHE-001 — `cache.storage.large`

**Name:** Large Developer Cache

**Category:** Caches

**Commands:**

```text
yowtf
yowtf caches
yowtf clean
```

**Platforms:**

Windows, macOS, Linux

**Purpose:**

Identify a known developer cache whose size is unusually large.

**Required evidence:**

```text
known cache path
cache size
```

**Applicability:**

Only for safely recognized cache locations.

**Condition:**

```text
< 10 GB → PASS
10–49.9 GB → WARN
≥ 50 GB → FAIL
```

**Severity:**

```text
WARN → LOW
FAIL → MEDIUM
```

**Confidence:**

HIGH when cache path and size are reliable.

**Explanation:**

Explain that the cache consumes significant local storage.

**Remediation hint:**

Review the cache as a cleanup candidate.

YOWTF does not delete it.

---

## CACHE-002 — `cache.build.artifact.large`

**Name:** Large Build Artifact

**Category:** Caches

**Commands:**

```text
yowtf
yowtf caches
yowtf clean
```

**Platforms:**

Windows, macOS, Linux

**Purpose:**

Identify unusually large recognized build-output directories.

**Required evidence:**

```text
recognized build directory
directory size
project context
```

**Applicability:**

Only for recognized project/build-output locations.

**Condition:**

```text
< 5 GB → PASS
5–19.9 GB → WARN
≥ 20 GB → FAIL
```

**Severity:**

```text
WARN → LOW
FAIL → MEDIUM
```

**Confidence:**

MEDIUM.

**Explanation:**

Explain that build output is consuming substantial local storage.

**Remediation hint:**

Review whether the build output can be regenerated before manual cleanup.

---

# 28. Rule Count Verification

The V1 catalogue contains exactly:

```text
System       5
Disk         4
Processes    4
Ports        4
Network      4
Environment  4
Runtimes     6
Tools        5
Paths        4
Versions     4
Project      4
Dependencies 4
Git          4
Configuration 2
Caches       2
----------------
Total       60
```

The implementation must not silently contain additional undocumented rules.

---

# 29. Rule-to-Command Coverage

Every rule must be reachable from at least one documented command.

Rules should not exist solely as dead implementation.

A rule can be shared across commands.

---

# 30. Default Scan Rule Coverage

The default:

```bash
yowtf
```

should evaluate all applicable V1 rules.

Applicability may cause individual rules to become:

```text
SKIPPED
UNAVAILABLE
```

rather than PASS/FAIL.

---

# 31. Narrow Command Coverage

Narrow commands should evaluate rules belonging to their diagnostic scope.

Examples:

```text
yowtf runtimes
→ runtime/version rules

yowtf ports
→ port rules

yowtf git
→ Git rules
```

Cross-category rules may be used when explicitly required by the command's documented purpose.

---

# 32. Duplicate Concept Rule

Some rules may detect closely related conditions.

Examples:

```text
project.lockfile.missing
dependency.lockfile.missing
```

These rules must not be executed in a way that creates redundant penalties for the same underlying condition unless their distinct purposes justify it.

The implementation must define deduplication/ownership where overlap exists.

---

# 33. Rule Ownership

Where two rules cover the same underlying evidence, each must have a distinct user-facing purpose.

Do not add a second rule merely to duplicate an existing finding under another name.

---

# 34. Rule Threshold Governance

Thresholds in this document are authoritative.

Examples:

```text
memory WARN = 80%
memory FAIL = 90%

disk WARN = 10% free
disk PASS = 15% free
```

Threshold changes require a specification update.

---

# 35. Threshold Boundary Testing

Every threshold-based rule must test:

```text
just below
exact threshold
just above
```

This prevents off-by-one and floating-point interpretation errors.

---

# 36. Platform Testing

Platform-specific rules require platform-aware tests.

At minimum:

```text
Windows
macOS
Linux
```

must not be assumed to expose identical evidence.

Rules must correctly produce:

```text
PASS
FAIL
WARN
SKIPPED
UNAVAILABLE
```

according to platform capabilities.

---

# 37. Privacy Testing

Rules involving:

- environment
- configuration
- credentials
- proxy metadata

must include tests verifying that sensitive values are not emitted.

---

# 38. Read-Only Testing

The rule suite must verify that rule execution does not:

- modify files
- modify Git
- install packages
- kill processes
- modify environment variables
- modify PATH

---

# 39. Rule Regression Testing

Every production detection bug should result in a regression test where practical.

The regression should reproduce the evidence that caused the bug.

---

# 40. Rule Documentation Requirement

A rule implementation without a catalogue entry is incomplete.

A catalogue entry without implementation is a planned/unimplemented rule and must not be silently treated as released functionality.

---

# 41. Rule Status Lifecycle

Rules may have these lifecycle states internally:

```text
SPECIFIED
IMPLEMENTED
TESTED
RELEASED
```

Only released rules belong in the shipped V1 rule registry.

---

# 42. Rule Registration Requirement

Every released rule must:

1. have a catalogue entry
2. have a unique ID
3. be registered
4. have tests
5. be reachable from an appropriate command
6. conform to the detection engine contract

---

# 43. Rule Removal Requirement

When a rule is removed:

- remove registry entry
- update this catalogue
- update tests
- update affected documentation
- verify no stale rule references remain

---

# 44. Rule Modification Requirement

Changes to any of the following require review:

```text
ID
applicability
required evidence
condition
severity
confidence
status behavior
threshold
explanation
remediation hint
platform support
command scope
```

---

# 45. No Hidden Rules

The following are prohibited:

```text
undocumented rule
temporary production rule
AI-generated hidden rule
debug-only rule exposed in production
duplicate rule ID
```

---

# 46. No Dynamic Rule Generation

V1 rules are statically defined.

The runtime must not generate new diagnostic rules from:

- AI
- remote configuration
- network responses
- arbitrary project text

---

# 47. No User-Provided Rule Execution

V1 does not define a plugin/user-rule system.

User-defined rules require a separate specification.

---

# 48. No Remote Rule Updates

The V1 rule set is packaged with YOWTF.

The runtime must not download rule definitions from a server.

---

# 49. Rule Versioning

Rule IDs remain stable.

If the semantics of a rule change materially, the change must be documented and tested.

A major semantic change may require a new rule ID depending on compatibility impact.

---

# 50. Rule Severity Governance

Severity changes are scoring changes.

Changing:

```text
LOW → HIGH
```

can materially alter the user's score.

Such changes require updates to:

```text
RULE-CATALOGUE.md
SCORING.md tests
release notes where appropriate
```

---

# 51. Rule Confidence Governance

Confidence changes must be reviewed because they alter the user's interpretation of certainty.

Confidence must not be used to hide insufficient evidence.

---

# 52. Rule Explanation Governance

Explanations must remain evidence-grounded.

Do not make broad claims such as:

```text
"This will definitely break your project."
```

unless the rule's evidence actually proves that condition.

Prefer:

```text
"This can cause..."
```

for risk-oriented findings.

---

# 53. Rule Remediation Governance

Remediation hints are guidance.

They must not imply that YOWTF performed the action.

Incorrect:

```text
Fixed Node version.
```

Correct:

```text
Inspect the project's Node.js version policy.
```

---

# 54. Rule Interaction With Scoring

Rules provide:

```text
status
severity
confidence
```

Scoring converts them into penalties according to `SCORING.md`.

Rules must not contain numeric score deductions.

---

# 55. Rule Interaction With Reporting

Rules provide structured data.

Reporting decides:

```text
layout
color
tables
boxes
verbosity
JSON representation
```

Rules must not print terminal output.

---

# 56. Rule Interaction With Collection

Collectors provide evidence.

Rules consume evidence.

Rules must not duplicate collection logic unnecessarily.

---

# 57. Rule Interaction With Platform Layer

Platform-specific evidence is collected through platform abstractions.

Rules should consume normalized evidence.

Rules should not contain arbitrary OS shell commands.

---

# 58. Rule Interaction With CLI

CLI commands determine diagnostic scope.

Rules do not parse:

```text
--json
--quiet
--verbose
--no-color
```

These are presentation concerns.

---

# 59. Rule Interaction With Project Discovery

Project discovery establishes:

```text
project root
project type
project markers
```

Rules use this context for applicability.

---

# 60. Rule Interaction With Privacy

Rules must follow data minimization.

A rule should request only the evidence necessary to evaluate its condition.

---

# 61. Rule Execution Order

Rule execution order must not change the meaning of results.

Rules should be independent.

Final findings are normalized into deterministic ordering before reporting.

---

# 62. Rule Parallelization

Rules may be evaluated concurrently when safe.

Concurrent execution must not change:

- findings
- severity
- score
- ordering
- error semantics

---

# 63. Rule Failure Isolation

If one rule returns ERROR:

```text
other independent rules continue
```

where safe.

The error remains visible.

---

# 64. Rule Unavailability

When required evidence cannot be collected:

```text
UNAVAILABLE
```

must be used where applicable.

Do not fabricate:

```text
PASS
```

---

# 65. Rule Skipping

Rules may be skipped when:

- not applicable
- outside command scope
- explicitly excluded by documented behavior

Skipping must be distinguishable from passing.

---

# 66. Rule False Positive Policy

When evidence is insufficient:

```text
do not FAIL
```

Prefer:

```text
WARN
UNAVAILABLE
```

where the rule specification supports those outcomes.

---

# 67. Rule False Negative Policy

Clear evidence of a documented violation must produce the specified failure/warning.

Do not weaken a rule simply to make the score look better.

---

# 68. Rule Safety Contract

No rule may:

```text
delete
install
uninstall
update
repair
kill
modify
commit
reset
stash
send
upload
```

as part of normal V1 detection.

---

# 69. Rule Catalogue and README

README may summarize notable rules.

README does not replace this catalogue.

If README and this document disagree:

```text
RULE-CATALOGUE.md wins
```

---

# 70. Rule Catalogue and Architecture

Architecture defines how rules execute.

This document defines which rules exist.

A new rule must fit the architecture.

Architecture changes require `ARCHITECTURE.md` updates.

---

# 71. Rule Catalogue and Technology

Rules must use the approved stack from `TECH-STACK.md`.

A rule must not introduce a new framework or dependency without approval.

---

# 72. Rule Catalogue and CLI

Commands expose rule scopes.

A rule must not silently create a new public command.

If a new command is needed:

```text
CLI-SPEC.md
COMMANDS.md
```

must be updated.

---

# 73. Rule Catalogue and Scoring

Scoring is centralized.

Rules declare severity.

Scoring defines penalty.

---

# 74. Rule Catalogue Change Process

The required process is:

```text
Problem identified
      ↓
Rule requirement
      ↓
Rule catalogue entry
      ↓
Evidence definition
      ↓
Applicability
      ↓
Condition
      ↓
Severity/confidence
      ↓
Implementation
      ↓
Tests
      ↓
Registration
      ↓
Validation
```

---

# 75. AI Coding Agent Contract

Antigravity must:

1. Read `DETECTION-ENGINE.md`.
2. Read `SCORING.md`.
3. Read this catalogue before implementing a rule.
4. Never invent a rule ID.
5. Never invent a threshold.
6. Never invent severity.
7. Never invent applicability.
8. Never invent evidence requirements.
9. Never add an undocumented rule.
10. Never modify a rule's semantics without updating this document.
11. Never add rule-specific score arithmetic.
12. Never let a rule mutate user state.
13. Never expose environment secrets.
14. Never use AI at runtime to determine rule outcomes.
15. Never use network data as an undocumented rule input.
16. Preserve stable rule IDs.
17. Add tests for every rule.
18. Add boundary tests for thresholds.
19. Add regression tests for fixed detection bugs.
20. Stop when evidence requirements are ambiguous.
21. Stop when two rules overlap without a defined ownership model.
22. Stop when specifications conflict.
23. Never treat common developer practice as an undocumented requirement.
24. Update the catalogue before implementation when an approved rule changes.

---

# 76. V1 Rule Inventory — Quick Reference

```text
SYSTEM
system.memory.pressure
system.cpu.pressure
system.uptime.short
system.architecture.mismatch
system.platform.supported

DISK
disk.space.low
disk.developer-storage.pressure
disk.project.location.unavailable
disk.filesystem.readonly

PROCESSES
process.resource.hog
process.memory.hog
process.development.zombie
process.development.duplicate

PORTS
port.development.conflict
port.duplicate.listener
port.unexpected.exposure
port.process.unavailable

NETWORK
network.interface.unavailable
network.dns.configuration.missing
network.proxy.configuration.suspicious
network.route.configuration.unavailable

ENVIRONMENT
environment.path.empty-entry
environment.secret.exposure
environment.path.duplicate
environment.shell.path-mismatch

RUNTIMES
runtime.node.unavailable
runtime.node.unpinned
runtime.python.unavailable
runtime.python.unpinned
runtime.java.unavailable
runtime.version.mismatch

TOOLS
tool.git.unavailable
tool.package-manager.mismatch
tool.package-manager.missing
tool.docker.unavailable
tool.executable.shadowing

PATHS
path.executable.missing
path.executable.multiple
path.entry.invalid
path.order.shadowing

VERSIONS
version.runtime.conflict
version.tool.conflict
version.project.runtime.unsatisfied
version.tool.outdated

PROJECT
project.manifest.missing
project.lockfile.missing
project.runtime.policy.missing
project.root.ambiguous

DEPENDENCIES
dependency.lockfile.missing
dependency.lockfile.mismatch
dependency.package-manager.mismatch
dependency.directory.inconsistent

GIT
git.repository.missing
git.working-tree.dirty
git.untracked.files
git.branch.divergence

CONFIGURATION
config.environment.file.missing
config.required.value.missing

CACHES
cache.storage.large
cache.build.artifact.large
```

---

# 77. Final Rule Definition

The YOWTF V1 rule set is a fixed, documented collection of deterministic diagnostic rules.

The fundamental contract is:

```text
Evidence
   ↓
Applicability
   ↓
Rule
   ↓
Status + Severity + Confidence
   ↓
Finding
   ↓
Scoring
```

Every shipped rule must be explainable from evidence.

Every score-affecting rule must have a defined severity.

Every threshold must be documented.

Every rule must be testable.

Every rule must be read-only.

Every rule must be known to the catalogue.

If it is not documented here, it is not a YOWTF V1 rule.

---

**End of `docs/RULE-CATALOGUE.md`**
