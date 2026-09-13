import { describe, it, expect } from 'vitest';
import { createProgram, APP_NAME, APP_VERSION } from '../../src/cli/cli.js';

describe('CLI Foundation', () => {
  it('creates program with correct name and version', () => {
    const program = createProgram();
    expect(program.name()).toBe(APP_NAME);
    expect(program.version()).toBe(APP_VERSION);
  });

  it('contains expected program description and tagline', () => {
    const program = createProgram();
    expect(program.description()).toContain('Your Operating Workstation Trouble Finder');
    expect(program.description()).toContain('Yo, WTF is happening?');
  });
});
