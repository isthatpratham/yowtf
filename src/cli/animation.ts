import { Chalk } from 'chalk';

export interface BootAnimationOptions {
  readonly json?: boolean;
  readonly quiet?: boolean;
  readonly color?: boolean;
  readonly isTTY?: boolean;
  readonly stream?: NodeJS.WritableStream;
  readonly stepDelayMs?: number;
}

export const BOOT_SEQUENCE_HEADER = 'YOWTF // INITIALIZING';
export const BOOT_SEQUENCE_STEPS = [
  '> loading diagnostic engine...',
  '> preparing collectors...',
  '> preparing detection rules...',
  '> preparing reporting pipeline...',
  '> ready.',
] as const;
export const BOOT_SEQUENCE_TAGLINE = 'Yo, WTF is happening?';

/**
 * Determines whether the boot animation is eligible to run.
 * Animation is skipped for non-TTY environments (CI, pipes, scripts),
 * machine-readable JSON mode, and quiet mode.
 */
export function isAnimationEligible(options: BootAnimationOptions = {}): boolean {
  if (options.json || options.quiet) {
    return false;
  }

  const stream = options.stream ?? process.stdout;
  const isTTY = options.isTTY ?? Boolean((stream as { isTTY?: boolean }).isTTY);

  return isTTY;
}

/**
 * Plays the diagnostic boot animation.
 * Strictly presentation-layer behavior:
 * - 200-600ms total duration in interactive terminals
 * - Skipped in non-TTY, --json, and --quiet
 * - Emits plain text (no ANSI color codes) when color is disabled (--no-color)
 * - Timing can be bypassed (e.g. stepDelayMs = 0) for instant deterministic tests
 */
export async function playBootAnimation(options: BootAnimationOptions = {}): Promise<void> {
  if (!isAnimationEligible(options)) {
    return;
  }

  const stream = options.stream ?? process.stdout;
  const useColor = options.color !== false;
  const c = new Chalk({ level: useColor ? 2 : 0 });
  const delayMs = options.stepDelayMs ?? 50;

  const sleep = (ms: number) =>
    ms > 0 ? new Promise((resolve) => setTimeout(resolve, ms)) : Promise.resolve();

  try {
    // 1. Initial header
    stream.write(`${c.cyan.bold(BOOT_SEQUENCE_HEADER)}\n\n`);

    // 2. Sequential boot steps
    for (const step of BOOT_SEQUENCE_STEPS) {
      if (delayMs > 0) {
        await sleep(delayMs);
      }
      if (step === '> ready.') {
        stream.write(`${c.green(step)}\n`);
      } else {
        stream.write(`${c.dim(step)}\n`);
      }
    }

    // 3. Concluding tagline
    if (delayMs > 0) {
      await sleep(delayMs);
    }
    stream.write(`\n${c.bold(BOOT_SEQUENCE_TAGLINE)}\n\n`);
  } catch {
    // If stream write fails, fail silently without disrupting diagnostic execution
  }
}
