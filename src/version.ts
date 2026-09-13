import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

let cachedVersion: string | undefined;

/**
 * Returns the authoritative application version loaded from package.json.
 * Resolves dynamically from package.json in both source (src/) and built (dist/) environments.
 */
export function getAppVersion(): string {
  if (cachedVersion) {
    return cachedVersion;
  }

  // 1. Resolve relative to current module URL (works for both src/ and dist/)
  try {
    const directPath = fileURLToPath(new URL('../package.json', import.meta.url));
    if (fs.existsSync(directPath)) {
      const content = fs.readFileSync(directPath, 'utf8');
      const parsed = JSON.parse(content) as { name?: string; version?: string };
      if (parsed.name === 'yowtf' && typeof parsed.version === 'string') {
        cachedVersion = parsed.version;
        return cachedVersion;
      }
    }
  } catch {
    // Continue to upward search fallback
  }

  // 2. Upward directory traversal search as robust fallback
  try {
    let currentDir = path.dirname(fileURLToPath(import.meta.url));
    for (let i = 0; i < 5; i++) {
      const candidate = path.join(currentDir, 'package.json');
      if (fs.existsSync(candidate)) {
        const content = fs.readFileSync(candidate, 'utf8');
        const parsed = JSON.parse(content) as { name?: string; version?: string };
        if (parsed.name === 'yowtf' && typeof parsed.version === 'string') {
          cachedVersion = parsed.version;
          return cachedVersion;
        }
      }
      const parent = path.dirname(currentDir);
      if (parent === currentDir) break;
      currentDir = parent;
    }
  } catch {
    // Fallback if filesystem read fails
  }

  return cachedVersion ?? '0.0.0';
}

/**
 * Resets the internal version cache. Intended for testing only.
 */
export function _resetVersionCache(): void {
  cachedVersion = undefined;
}
