import chalk from 'chalk';
import { Readable } from 'node:stream';
import { Biome } from '@biomejs/js-api/nodejs';

import { simplePipeLogger } from '../utils/simplePipeLogger';
import logger from '../utils/logger';

interface VinylFile {
  path: string;
  contents: Buffer;
}

// Singleton Biome instance and project key - created lazily
let biomeInstance: Biome | null = null;
let projectKey: string | null = null;

function getBiome(): { biome: Biome; projectKey: string } {
  if (!biomeInstance || !projectKey) {
    biomeInstance = new Biome();
    const project = biomeInstance.openProject(process.cwd());
    projectKey = project.projectKey;
  }
  return { biome: biomeInstance, projectKey };
}

/**
 * Format a single file using Biome's JS API
 */
function formatFile(
  biome: Biome,
  projectKey: string,
  file: VinylFile,
  l: ReturnType<typeof logger.child>,
): VinylFile {
  const content = file.contents.toString('utf8');
  const filePath = file.path;

  try {
    // Format the content
    const formatted = biome.formatContent(projectKey, content, { filePath });

    // Also run lint with fixes
    const linted = biome.lintContent(projectKey, formatted.content, { filePath });

    // Use the fixed content if available, otherwise use formatted
    const finalContent = linted.content || formatted.content;

    // Print any diagnostics
    if (linted.diagnostics.length > 0) {
      const diagnosticsOutput = biome.printDiagnostics(linted.diagnostics, {
        filePath,
        fileSource: content,
      });
      if (diagnosticsOutput) {
        process.stderr.write(diagnosticsOutput);
      }
    }

    // Update file contents
    file.contents = Buffer.from(finalContent, 'utf8');
  } catch (error) {
    l.warn(`Failed to format ${filePath}:`, error);
    // Return original file on error
  }

  return file;
}

/**
 * Async generator that yields formatted files from the input stream.
 * Modern streaming approach using async iterators.
 */
async function* formatFilesIterator(
  files: AsyncIterable<VinylFile>,
  biome: Biome,
  projectKey: string,
  l: ReturnType<typeof logger.child>,
): AsyncGenerator<VinylFile> {
  for await (const file of files) {
    yield formatFile(biome, projectKey, file, l);
  }
}

/**
 * Converts an async iterable to a readable stream.
 */
function asyncIterableToStream<T>(iterable: AsyncIterable<T>): Readable {
  return Readable.from(iterable, { objectMode: true });
}

/**
 * Format files in a gulp stream using Biome.
 * Uses @biomejs/js-api for in-process formatting (no subprocess overhead).
 */
export async function formatPipes(stream: Readable): Promise<Readable> {
  const l = logger.child(chalk.magentaBright('biome'));

  // Initialize Biome
  const { biome, projectKey: key } = getBiome();

  // Pipe through the simple logger first
  const loggedStream = stream.pipe(simplePipeLogger(l));

  // Use modern async iteration for processing
  const formattedFiles = formatFilesIterator(loggedStream, biome, key, l);

  // Convert back to a stream for gulp compatibility
  return asyncIterableToStream(formattedFiles);
}
