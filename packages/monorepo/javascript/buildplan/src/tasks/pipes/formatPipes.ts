import chalk from 'chalk';
import { Readable } from 'node:stream';
import { spawnSync } from 'node:child_process';

import { simplePipeLogger } from '../utils/simplePipeLogger';
import logger from '../utils/logger';

interface VinylFile {
  path: string;
  contents: Buffer;
}

/**
 * Format files in a gulp stream using Biome CLI.
 *
 * Uses the biome CLI for formatting/linting which:
 * - Properly reads biome.json config (including quoteStyle: 'single')
 * - Outputs ANSI colored diagnostics to terminal
 * - Handles all file types correctly
 */
export async function formatPipes(stream: Readable): Promise<Readable> {
  const l = logger.child(chalk.magentaBright('biome'));

  // Collect all files using async iteration
  const files: VinylFile[] = [];
  const loggedStream = stream.pipe(simplePipeLogger(l));

  for await (const file of loggedStream) {
    files.push(file as VinylFile);
  }

  if (files.length === 0) {
    return Readable.from([]);
  }

  // Get the file paths for biome to process
  const filePaths = files.map((f) => f.path);

  l.info(`Running biome on ${filePaths.length} files...`);

  // Run biome check --write on all files at once
  // --colors=force ensures ANSI output even when not a TTY
  const result = spawnSync(
    'npx',
    ['@biomejs/biome@1.9.0', 'check', '--write', '--colors=force', ...filePaths],
    {
      encoding: 'utf8',
      maxBuffer: 50 * 1024 * 1024,
      cwd: process.cwd(),
    },
  );

  // Output diagnostics (these will have proper ANSI colors)
  if (result.stderr) {
    process.stderr.write(result.stderr);
  }
  if (result.stdout) {
    process.stdout.write(result.stdout);
  }

  if (result.status !== null && result.status > 1) {
    l.warn(`Biome exited with code ${result.status}`);
  }

  // Biome modified the files in place on disk, so gulp.dest will
  // re-read them with the updated content
  return Readable.from(files, { objectMode: true });
}
