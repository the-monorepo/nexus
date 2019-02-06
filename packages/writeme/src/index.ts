import { join, relative } from 'path';
import { pathExists } from 'fs-extra';
import { writeFile, readFile } from 'mz/fs';
import schema from 'hook-schema';
import { mergeHookOptions } from 'hook-schema';
import globby from 'globby';

function section(title, content) {
  let md = '';
  if (content) {
    md += `## ${title}\n`;
    md += '\n';
    md += content;
    md += '\n';
  }
  return md;
}

export interface Sections {
  examples?: string;
  howTo?: string;
  development?: string;
}

export interface ManualReadmeContents {
  isDevPackage?: boolean;
  sections?: Sections;
}

export interface ReadmeContents extends ManualReadmeContents {
  title: string;
  name: string;
  version: string;
  description?: string;
  private?: boolean;
  peerDependencies?: { [s: string]: string };
}

const suffixedVersionRegex = /\d+\.\d+\.\d+-/;

function packageInstallation(command, flag, packageNames) {
  let md = '';
  md += '```bash\n';
  md += `${command}${flag} ${packageNames.join(' ')}\n`;
  md += '```\n';
  return md;
}

function installationInstructions(isDevPackage, allDependenciesToInstall) {
  const yarnSaveFlag = isDevPackage ? ' --dev' : '';
  const npmSaveFlag = isDevPackage ? ' --save-dev' : ' --save';
  let md = '';
  md += packageInstallation('npm install', npmSaveFlag, allDependenciesToInstall);
  md += 'or\n';
  md += packageInstallation('yarn add', yarnSaveFlag, allDependenciesToInstall);
  md += '\n';
  return md;
}

function genReadme({
  name,
  version,
  isDevPackage,
  description,
  sections = {},
  peerDependencies = {},
  ...other
}: ReadmeContents) {
  const title = packageNameToTitle(name);
  const { examples, howTo, development = '' } = sections;
  if (!name) {
    throw new Error(`Name was ${name}`);
  }

  let md = '';
  md += `# ${title}\n`;
  md += '\n';
  if (description) {
    md += `${description}\n`;
    md += '\n';
  }
  if (other.private !== true) {
    if (!version) {
      throw new Error(`${name} does not have a version`);
    }
    md += '## Installation\n';
    md += '\n';
    const installPackageName = version.match(suffixedVersionRegex)
      ? `${name}@${version}`
      : name;

    const peerDependenciesToInstall = Object.keys(peerDependencies);
    const allDependenciesToInstall = [installPackageName].concat(
      ...Array.from(peerDependenciesToInstall),
    );

    md += installationInstructions(isDevPackage, allDependenciesToInstall);
  }
  md += section('How to use it', howTo);
  md += section('Examples', examples);
  md += section('Development', development);
  return md;
}

async function readPackageJson(packageDir) {
  const packageJsonText = await readFile(join(packageDir, 'package.json'), {
    encoding: 'utf-8',
  });
  return JSON.parse(packageJsonText);
}

/**
 * Removes @ scopes, replaces "-"" with a space and capitalises each word
 */
function packageNameToTitle(packageName: string) {
  return packageName
    .replace(/^@[^\/]+\//, '')
    .replace(/-+/, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
}

export type MissingFileCallback = (configPath: string) => any;

const genReadmeFromPackageDirHookSchema = {
  readConfig: null,
  readPackageJson: null,
  genReadme: null,
};

const withGenReadmeFromPackageDirHooks = schema(genReadmeFromPackageDirHookSchema);
export type GenReadmeFromPackageDirHooks = Parameters<
  typeof withGenReadmeFromPackageDirHooks
>[0];

export async function genReadmeFromPackageDir(
  packageDir: string,
  hooks: GenReadmeFromPackageDirHooks,
) {
  const h = withGenReadmeFromPackageDirHooks(hooks);
  const context: any = { packageDir };
  async function readConfig() {
    context.configRequirePath = join(packageDir, 'writeme.config');
    context.configPath = `${context.configRequirePath}.js`;
    async function getConfigModule() {
      if (await pathExists(context.configPath)) {
        return require(context.configPath);
      } else {
        return null;
      }
    }
    const configModule = await getConfigModule();
    const configModuleType = typeof configModule;
    if (configModuleType === 'function') {
      return await Promise.resolve(configModule());
    } else {
      return configModule;
    }
  }
  await h.before.readPackageJson(context);
  const packageJson = await readPackageJson(context.packageDir);
  context.packageJson = packageJson;
  await h.after.readPackageJson(context);

  await h.before.readConfig(context);
  const config = await readConfig();
  context.config = config;
  await h.after.readConfig(context);

  const writemeOptions = {
    ...context.packageJson,
    ...context.config,
  };

  context.writemeOptions = writemeOptions;
  if (context.writemeOptions.workspaces) {
    context.globPaths = context.writemeOptions.workspaces.map(glob =>
      join(context.packageDir, glob),
    );

    const paths = await globby(context.globPaths, { onlyFiles: false });

    for (const path of paths) {
      await genReadmeFromPackageDir(path, hooks);
    }
  }

  await h.before.genReadme(context);
  const readmeText = genReadme(context.writemeOptions);
  context.readmeText = readmeText;
  await h.after.genReadme(context);

  return readmeText;
}

const writeReadmeFromPackageDirHookSchema = {
  ...genReadmeFromPackageDirHookSchema,
  writeReadme: null,
};
const withWriteReadmeFromPackageDirHooks = schema(writeReadmeFromPackageDirHookSchema);
export type WriteReadmeFromPackageDirHooks = Parameters<
  typeof withWriteReadmeFromPackageDirHooks
>[0];

export async function writeReadmeFromPackageDir(
  packageDir: string,
  hooks: WriteReadmeFromPackageDirHooks,
) {
  const h = withWriteReadmeFromPackageDirHooks(hooks);
  await genReadmeFromPackageDir(
    packageDir,
    mergeHookOptions(
      [
        {
          after: {
            async genReadme(context) {
              await h.before.writeReadme(context);
              await writeFile(join(packageDir, 'README.md'), context.readmeText, {
                encoding: 'utf-8',
              });
              await h.after.writeReadme(context);
            },
          },
        },
        h,
      ],
      genReadmeFromPackageDirHookSchema,
    ),
  );
}
export default genReadmeFromPackageDir;
