import { describe, it, expect, vi } from 'vitest';
import { createProgram, runCli } from '../../src/cli/cli.js';

describe('Command Registration', () => {
  const AUTHORITATIVE_SUBCOMMANDS = [
    'doctor',
    'score',
    'explain',
    'system',
    'disk',
    'processes',
    'ports',
    'network',
    'env',
    'runtimes',
    'tools',
    'paths',
    'versions',
    'project',
    'deps',
    'git',
    'config',
    'caches',
    'clean',
  ];

  it('registers all 19 public subcommands', () => {
    const program = createProgram();
    const registeredNames = program.commands.map((cmd) => cmd.name());

    for (const expected of AUTHORITATIVE_SUBCOMMANDS) {
      expect(registeredNames).toContain(expected);
    }
  });

  it('does not register undocumented commands or aliases', () => {
    const program = createProgram();
    const registeredNames = program.commands.map((cmd) => cmd.name());

    expect(registeredNames.sort()).toEqual([...AUTHORITATIVE_SUBCOMMANDS].sort());

    for (const cmd of program.commands) {
      expect(cmd.aliases()).toHaveLength(0);
    }
  });

  it('provides descriptions for every public command', () => {
    const program = createProgram();

    for (const cmd of program.commands) {
      expect(cmd.description()).toBeTruthy();
      expect(cmd.description().length).toBeGreaterThan(5);
    }
  });

  it('registers --preview option on clean command', () => {
    const program = createProgram();
    const cleanCmd = program.commands.find((cmd) => cmd.name() === 'clean');

    expect(cleanCmd).toBeDefined();
    const optionNames = cleanCmd?.options.map((opt) => opt.long);
    expect(optionNames).toContain('--preview');
  });

  it('executes command-level --help with exit code 0 for each command', async () => {
    const stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    try {
      for (const cmdName of AUTHORITATIVE_SUBCOMMANDS) {
        const exitCode = await runCli(['node', 'yowtf', cmdName, '--help']);
        expect(exitCode).toBe(0);
      }
    } finally {
      stdoutSpy.mockRestore();
    }
  });
});
