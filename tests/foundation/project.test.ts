import { describe, it, expect } from 'vitest';
import { APP_NAME, APP_FULL_NAME, APP_TAGLINE, APP_VERSION } from '../../src/index.js';

describe('Project Foundation', () => {
  it('defines correct application identity constants', () => {
    expect(APP_NAME).toBe('yowtf');
    expect(APP_FULL_NAME).toBe('Your Operating Workstation Trouble Finder');
    expect(APP_TAGLINE).toBe('Yo, WTF is happening?');
    expect(APP_VERSION).toBe('0.1.0');
  });
});
