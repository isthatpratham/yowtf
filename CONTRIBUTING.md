# Contributing to YOWTF

Thank you for your interest in contributing to **YOWTF (Your Operating Workstation Trouble Finder)**!

YOWTF is a local-first, read-only developer workstation and project health diagnostic CLI. To maintain product integrity, determinism, and safety, all contributions must adhere to the principles and guidelines outlined below.

---

## 1. Core Principles & Non-Negotiable Invariants

Before writing or modifying any code, keep these invariants in mind:

1. **Local-First**: YOWTF operates entirely on the local workstation. No cloud backends, no telemetry, and no network dependencies are permitted for normal operation.
2. **Strictly Read-Only**: YOWTF diagnoses; it never mutates. It does not install/uninstall software, delete files, kill processes, edit project files, change Git state, or modify environment variables. Even `yowtf clean` is strictly diagnostic (surfacing cleanup candidates for user review).
3. **Deterministic Evaluation**: Given identical system and project evidence, diagnostic rules and health scores must always produce the exact same findings and numerical results. No probabilistic models or AI at runtime.
4. **Data Minimization & Privacy**: Never dump secrets, tokens, passwords, or sensitive environment variable values. Output names and metadata rather than raw sensitive data.
5. **Clear Separation of Concerns**:
   - **CLI (`src/cli/`)**: Command parsing, option validation, and process exit codes. No diagnostic logic.
   - **Application (`src/application/`)**: Use-case orchestration (`ScanOrchestratorService`, `SystemCollectionService`, `ProjectDiscoveryService`).
   - **Domain (`src/domain/`)**: Pure domain entities, types, and model definitions.
   - **Collection (`src/collection/`)**: Gathers facts/evidence about the workstation and project. Does not evaluate rules.
   - **Platform (`src/platform/`)**: OS abstraction layer. Platform-specific execution is encapsulated here.
   - **Detection (`src/detection/`)**: Evaluates evidence against pure, deterministic diagnostic rules to yield findings.
   - **Scoring (`src/scoring/`)**: Computes the 0–100 health score and deduction explanations.
   - **Reporting (`src/reporting/`)**: Formats results for terminal display or machine-readable JSON.

---

## 2. Prerequisites

To build and run YOWTF locally, you need:

- **Node.js**: `>= 20.0.0`
- **pnpm**: `>= 9.0.0`
- **Git**

---

## 3. Getting Started

1. Clone the repository:

   ```bash
   git clone https://github.com/isthatpratham/yowtf.git
   cd yowtf
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Build the project:

   ```bash
   pnpm run build
   ```

4. Run the local CLI:
   ```bash
   node dist/cli.js --help
   # or
   node dist/cli.js
   ```

---

## 4. Development Workflow

The following scripts are available in `package.json`:

| Command                 | Purpose                                                |
| ----------------------- | ------------------------------------------------------ |
| `pnpm dev`              | Build in watch mode using `tsup`                       |
| `pnpm run build`        | Compile TypeScript and generate bundles in `dist/`     |
| `pnpm test`             | Run the full test suite with Vitest                    |
| `pnpm run test:watch`   | Run tests in interactive watch mode                    |
| `pnpm run typecheck`    | Run TypeScript compiler type-checking (`tsc --noEmit`) |
| `pnpm run lint`         | Check code with ESLint                                 |
| `pnpm run lint:fix`     | Automatically fix linting issues where possible        |
| `pnpm run format:check` | Verify formatting with Prettier                        |
| `pnpm run format`       | Format code with Prettier                              |

---

## 5. Quality Gates

Before opening a pull request or submitting changes, all quality gates must pass:

```bash
pnpm test
pnpm run typecheck
pnpm run lint
pnpm run format:check
pnpm run build
```

Every PR must maintain:

- **100% test pass rate** with unit and integration coverage for new/modified behavior.
- **Zero TypeScript errors** under strict type-checking settings.
- **Zero ESLint warnings or errors**.
- **100% Prettier formatting compliance**.
- **Clean production build** producing valid ESM outputs and type declarations in `dist/`.

---

## 6. Proposing Changes

### Adding a New Diagnostic Rule

All diagnostic rules are catalogued and specified in `docs/RULE-CATALOGUE.md`. To propose a new rule:

1. Update `docs/RULE-CATALOGUE.md` with the rule specification (ID, category, description, severity, conditions, remediation).
2. Implement the rule in `src/detection/rules/` implementing the `DiagnosticRule` interface.
3. Register the rule in `src/detection/rules/index.ts`.
4. Add comprehensive unit tests in `tests/detection/` testing boundary conditions, positive matches, and negative matches.
5. Verify determinism and run all quality gates.

### Documentation & Specifications

YOWTF adheres to a documentation-first model:

```text
Specification (docs/) -> Implementation (src/) -> Tests (tests/) -> README.md
```

If implementation and documentation conflict, the authoritative specifications under `docs/` govern. Do not introduce undocumented commands, options, or behaviors.

### Commit Messages

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` New features or commands (must be backed by documentation).
- `fix:` Bug fixes or diagnostic corrections.
- `docs:` Documentation improvements.
- `test:` Adding or updating tests.
- `refactor:` Code refactoring without changing behavior.
- `chore:` Tooling, dependency, or configuration updates.

---

## 7. License

By contributing to YOWTF, you agree that your contributions will be licensed under the project's [MIT License](LICENSE).
