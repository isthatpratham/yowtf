import type { DiagnosticRule } from '../types.js';
import { systemRules } from './system/index.js';
import { diskRules } from './disk/index.js';
import { processRules } from './processes/index.js';
import { portRules } from './ports/index.js';
import { networkRules } from './network/index.js';
import { environmentRules } from './environment/index.js';
import { runtimeRules } from './runtimes/index.js';
import { toolRules } from './tools/index.js';
import { pathRules } from './paths/index.js';
import { versionRules } from './versions/index.js';
import { projectRules } from './project/index.js';
import { dependencyRules } from './dependencies/index.js';
import { gitRules } from './git/index.js';
import { configRules } from './configuration/index.js';
import { cacheRules } from './caches/index.js';

/**
 * The authoritative, closed V1 diagnostic rule set for YOWTF.
 * Order matches docs/RULE-CATALOGUE.md Section 76.
 * Contains exactly 60 rules across 15 categories.
 */
export const allV1Rules: readonly DiagnosticRule[] = Object.freeze([
  // 1. System (5)
  ...systemRules,
  // 2. Disk (4)
  ...diskRules,
  // 3. Processes (4)
  ...processRules,
  // 4. Ports (4)
  ...portRules,
  // 5. Network (4)
  ...networkRules,
  // 6. Environment (4)
  ...environmentRules,
  // 7. Runtimes (6)
  ...runtimeRules,
  // 8. Tools (5)
  ...toolRules,
  // 9. Paths (4)
  ...pathRules,
  // 10. Versions (4)
  ...versionRules,
  // 11. Project (4)
  ...projectRules,
  // 12. Dependencies (4)
  ...dependencyRules,
  // 13. Git (4)
  ...gitRules,
  // 14. Configuration (2)
  ...configRules,
  // 15. Caches (2)
  ...cacheRules,
]);
