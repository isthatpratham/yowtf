/**
 * Detection Layer foundational interfaces and engine.
 * Detectors evaluate structured evidence to produce deterministic findings.
 * Reference: docs/ARCHITECTURE.md Section 5.6 and docs/DETECTION-ENGINE.md.
 */

export * from './types.js';
export * from './registry.js';
export * from './engine.js';
export * from './rules/all.js';
export * from './rules/system/index.js';
export * from './rules/disk/index.js';
export * from './rules/processes/index.js';
export * from './rules/ports/index.js';
export * from './rules/network/index.js';
export * from './rules/environment/index.js';
export * from './rules/runtimes/index.js';
export * from './rules/tools/index.js';
export * from './rules/paths/index.js';
export * from './rules/versions/index.js';
export * from './rules/project/index.js';
export * from './rules/dependencies/index.js';
export * from './rules/git/index.js';
export * from './rules/configuration/index.js';
export * from './rules/caches/index.js';
