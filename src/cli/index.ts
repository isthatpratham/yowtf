#!/usr/bin/env node
import { runCli } from './cli.js';

runCli()
  .then((exitCode) => {
    if (exitCode !== 0) {
      process.exit(exitCode);
    }
  })
  .catch(() => {
    process.exit(1);
  });
