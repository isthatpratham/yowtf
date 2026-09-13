/**
 * Platform Layer foundational interfaces and implementations.
 * Provides isolated adapters for operating-system-specific mechanisms.
 * Reference: docs/ARCHITECTURE.md Section 5.5 and docs/TECH-STACK.md Section 40.
 */

export * from './types.js';
export * from './command.js';
export * from './windows.js';
export * from './macos.js';
export * from './linux.js';
export * from './unsupported.js';
export * from './detector.js';
