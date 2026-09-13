import { describe, it, expect, vi } from 'vitest';
import { PassThrough } from 'stream';
import {
  isAnimationEligible,
  playBootAnimation,
  BOOT_SEQUENCE_HEADER,
  BOOT_SEQUENCE_STEPS,
  BOOT_SEQUENCE_TAGLINE,
} from '../../src/cli/animation.js';

describe('Diagnostic Boot Animation (Phase 13 UX)', () => {
  describe('isAnimationEligible', () => {
    it('returns true when running in an interactive TTY and not in json/quiet mode', () => {
      expect(isAnimationEligible({ isTTY: true })).toBe(true);
      expect(isAnimationEligible({ isTTY: true, json: false, quiet: false })).toBe(true);
    });

    it('returns false when stdout is not a TTY (CI, pipes, redirects)', () => {
      expect(isAnimationEligible({ isTTY: false })).toBe(false);
      expect(isAnimationEligible({ isTTY: false, json: false, quiet: false })).toBe(false);
    });

    it('returns false when json mode is enabled regardless of TTY', () => {
      expect(isAnimationEligible({ isTTY: true, json: true })).toBe(false);
      expect(isAnimationEligible({ isTTY: false, json: true })).toBe(false);
    });

    it('returns false when quiet mode is enabled regardless of TTY', () => {
      expect(isAnimationEligible({ isTTY: true, quiet: true })).toBe(false);
      expect(isAnimationEligible({ isTTY: false, quiet: true })).toBe(false);
    });

    it('returns false when both json and quiet are enabled', () => {
      expect(isAnimationEligible({ isTTY: true, json: true, quiet: true })).toBe(false);
    });
  });

  describe('playBootAnimation execution', () => {
    // Helper to capture output from a mock writable stream
    function createMockStream(isTTY = true) {
      const stream = new PassThrough();
      (stream as unknown as { isTTY: boolean }).isTTY = isTTY;
      let buffer = '';
      stream.on('data', (chunk) => {
        buffer += chunk.toString();
      });
      return {
        stream,
        getOutput: () => buffer,
      };
    }

    it('renders the complete boot sequence in interactive TTY mode', async () => {
      const { stream, getOutput } = createMockStream(true);

      await playBootAnimation({
        stream,
        isTTY: true,
        stepDelayMs: 0,
        color: false,
      });

      const output = getOutput();
      expect(output).toContain(BOOT_SEQUENCE_HEADER);
      for (const step of BOOT_SEQUENCE_STEPS) {
        expect(output).toContain(step);
      }
      expect(output).toContain(BOOT_SEQUENCE_TAGLINE);
    });

    it('suppresses all output when isTTY is false', async () => {
      const { stream, getOutput } = createMockStream(false);

      await playBootAnimation({
        stream,
        isTTY: false,
        stepDelayMs: 0,
      });

      expect(getOutput()).toBe('');
    });

    it('suppresses all output when json mode is enabled', async () => {
      const { stream, getOutput } = createMockStream(true);

      await playBootAnimation({
        stream,
        isTTY: true,
        json: true,
        stepDelayMs: 0,
      });

      expect(getOutput()).toBe('');
    });

    it('suppresses all output when quiet mode is enabled', async () => {
      const { stream, getOutput } = createMockStream(true);

      await playBootAnimation({
        stream,
        isTTY: true,
        quiet: true,
        stepDelayMs: 0,
      });

      expect(getOutput()).toBe('');
    });

    it('emits no ANSI color codes when color is disabled (--no-color)', async () => {
      const { stream, getOutput } = createMockStream(true);

      await playBootAnimation({
        stream,
        isTTY: true,
        color: false,
        stepDelayMs: 0,
      });

      const output = getOutput();
      // Verify no ANSI escape codes (e.g. \x1b[36m, \x1b[1m, \x1b[0m) are present
      // eslint-disable-next-line no-control-regex
      const ansiRegex = /\x1B\[[0-9;]*[mK]/g;
      expect(output).not.toMatch(ansiRegex);
      expect(output).toContain(BOOT_SEQUENCE_HEADER);
      expect(output).toContain(BOOT_SEQUENCE_TAGLINE);
    });

    it('includes ANSI styling when color is enabled', async () => {
      const { stream, getOutput } = createMockStream(true);

      await playBootAnimation({
        stream,
        isTTY: true,
        color: true,
        stepDelayMs: 0,
      });

      const output = getOutput();
      // eslint-disable-next-line no-control-regex
      const ansiRegex = /\x1B\[[0-9;]*[mK]/;
      expect(output).toMatch(ansiRegex);
      expect(output).toContain(BOOT_SEQUENCE_HEADER);
    });

    it('handles stream write errors cleanly without failing or throwing', async () => {
      const errorStream = {
        isTTY: true,
        write: vi.fn().mockImplementation(() => {
          throw new Error('EPIPE: broken pipe');
        }),
      } as unknown as NodeJS.WritableStream;

      await expect(
        playBootAnimation({
          stream: errorStream,
          isTTY: true,
          stepDelayMs: 0,
        }),
      ).resolves.toBeUndefined();
    });
  });
});
