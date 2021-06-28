/* eslint-disable require-atomic-updates */
import { writeFile } from 'fs/promises';
import { readJson } from '@pshaw/fs';

import { join, relative, resolve } from 'path';

import { pathExists } from 'fs-extra';
import globby from 'globby';

import { fromSchema, HookOptionsOf } from 'hook-schema';

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

export type Sections = {
  examples?: string;
  howTo?: string;
  development?: string;
};

export type Projects = {
  overrides: Project[];
} & Project;

export type PackageOptions = {
  dir: string;
  title: string;
  name: string;
  version: string;
  description?: string;
  projects?: Project[];
  private?: boolean;
  peerDependencies?: { [s: string]: string };
  isDevPackage?: boolean;
  sections?: Sections;
};

const suffixedVersionRegex = /\d+\.\d+\.\d+-/;

/**
 * Removes @ scopes, replaces "-"" with a space and capitalises each word
 */
function packageNameToTitle(packageName: string) {
  return packageName
    .replace(/^@[^/]+\//, '')
    .replace(/-+/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

function getTitle(options) {
  return options.title ? options.title : packageNameToTitle(options.name);
}

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

export type Project = {
  category: string;
  description?: string;
  packages: PackageOptions[];
  [s: string]: any;
};

function packagesToProjectMd(packages: PackageOptions[], rootDir: string) {
  let md = 'Version | Package | Description\n';
  md += '--- | --- | ---\n';
  for (const packageOptions of packages) {
    const relativePackageLink = join(
      relative(resolve(rootDir), resolve(packageOptions.dir)),
      'README.md',
    ).replace(/\\+/g, '/');

    md += `${packageOptions.version} | [\`${
      packageOptions.name
    }\`](${relativePackageLink}) | ${
      packageOptions.description ? packageOptions.description : ''
    }\n`;
  }
  return `${md}\n`;
}

function projectOptionsToMd(projects: Project[], rootDir: string): string {
  let md = '';
  for (const project of projects) {
    const filteredPackages = project.packages
      .filter((packageOptions) => packageOptions && !packageOptions.private)
      .sort((a, b) => (a.name < b.name ? -1 : a.name === b.name ? 0 : 1));
    if (filteredPackages.length <= 0) {
      continue;
    }
    if (project.category) {
      md += `### ${project.category}\n`;
    }
    md += packagesToProjectMd(filteredPackages, rootDir);
  }

  return section('Packages', md);
}

function genReadme({
  name,
  dir,
  version,
  isDevPackage,
  description,
  projects,
  sections = {},
  peerDependencies = {},
  ...other
}: PackageOptions) {
  const title = getTitle({ name, ...other });
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
  if (projects) {
    md += projectOptionsToMd(projects, dir);
  }
  md += section('How to use it', howTo);
  md += section('Examples', examples);
  md += section('Development', development);
  md += '---\n';
  md +=
    'This documentation was generated using [writeme](https://www.npmjs.com/package/@writeme/core)\n';
  return md;
}

async function readPackageJson(packageDir) {
  return await readJson(join(packageDir, 'package.json'));
}

export type MissingFileCallback = (configPath: string) => any;

const genReadmeFromPackageDirSchema = {
  readConfig: null,
  readPackageJson: null,
  genReadme: null,
};
const errorSchema = {
  error: null,
};

const genReadmeFromPackageDirHookUtil = fromSchema(
  genReadmeFromPackageDirSchema,
  errorSchema,
);
export type GenReadmeFromPackageDirHooks = HookOptionsOf<
  typeof genReadmeFromPackageDirHookUtil
>;

function getProjects(writemeOptions) {
  if (writemeOptions.projects === null) {
    return null;
  } else if (!writemeOptions.projects) {
    if (!writemeOptions.workspaces) {
      return null;
    }
    return {
      test: writemeOptions.workspaces,
    };
  } else if (!writemeOptions.projects.test) {
    if (!writemeOptions.workspaces) {
      throw new Error(
        "Projects object does not have 'test' field, nor does package.json have 'workspaces'",
      );
    }
    return {
      ...writemeOptions.projects,
      test: writemeOptions.workspaces,
    };
  }
  return writemeOptions.projects;
}

function testToGlobs(test: string | string[]) {
  if (typeof test === 'string') {
    return [test];
  } else {
    return test;
  }
}

async function testToPaths(packageDir: string, test: string | string[]) {
  if (!test) {
    throw new Error("'test' was undefined");
  }
  // TODO: Hack cause globby doesn't work properly on absolute paths
  const relativePackageDir = toRelativeFromCwd(packageDir);
  const joinedGlobs = testToGlobs(test).map((glob) => join(relativePackageDir, glob));
  const filePaths = await globby(joinedGlobs, {
    onlyDirectories: true,
    expandDirectories: false,
  });
  return filePaths;
}

const toRelativeFromCwd = (dir) => {
  const path = relative(dir, process.cwd());
  if (path === '') {
    return '.';
  }
  return path;
};

export async function genReadmeFromPackageDir(
  packageDir: string,
  hooks: GenReadmeFromPackageDirHooks,
) {
  const h = genReadmeFromPackageDirHookUtil.withNoops(hooks);
  const context: any = { packageDir };
  async function readConfig() {
    context.configRequirePath = resolve(context.packageDir, 'writeme.config');
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
  try {
    await h.before.readPackageJson(context);
    context.packageJson = await readPackageJson(context.packageDir);
    await h.after.readPackageJson(context);

    await h.before.readConfig(context);
    context.config = await readConfig();
    await h.after.readConfig(context);
    context.writemeOptions = {
      ...context.packageJson,
      workspaces:
        context.packageJson.workspaces == null
          ? undefined
          : Array.isArray(context.packageJson.workspaces)
          ? context.packageJson.workspaces
          : context.packageJson.workspaces.packages,
      ...context.config,
      dir: packageDir,
    };

    const projectsConfig = getProjects(context.writemeOptions);
    if (projectsConfig) {
      const overrideProjects: any[] = projectsConfig.overrides
        ? await Promise.all(
            projectsConfig.overrides.map(async (project) => ({
              ...project,
              testPaths: await testToPaths(packageDir, project.test),
            })),
          )
        : [];
      const defaultPaths = await testToPaths(packageDir, projectsConfig.test);
      const allProjects = [
        {
          ...projectsConfig,
          testPaths: defaultPaths.filter(
            (path) =>
              !overrideProjects.some((project) => project.testPaths.includes(path)),
          ),
        },
      ].concat(overrideProjects);

      const expandedProjectsConfig = await Promise.all(
        allProjects.map(async (project) => {
          const packages = await Promise.all(
            project.testPaths.map(async (path) => {
              let writemeOptions;
              const nestedHooks = genReadmeFromPackageDirHookUtil.merge([
                {
                  after: {
                    async genReadme(innerContext) {
                      writemeOptions = innerContext.writemeOptions;
                    },
                  },
                },
                h,
              ]);
              await genReadmeFromPackageDir(path, nestedHooks);
              return writemeOptions;
            }),
          );
          return {
            ...project,
            packages,
          };
        }),
      );
      // TODO: Going a little overboard with the mutability here...
      context.writemeOptions.projects = expandedProjectsConfig;
    }

    await h.before.genReadme(context);
    context.readmeText = genReadme(context.writemeOptions);
    await h.after.genReadme(context);
  } catch (err) {
    await h.on.error(err);
  }
}

const writeReadmeFromPackageDirHookSchema = {
  ...genReadmeFromPackageDirSchema,
  writeReadme: null,
};
const writeReadmeFromPackageDirUtil = fromSchema(
  writeReadmeFromPackageDirHookSchema,
  errorSchema,
);
export type WriteReadmeFromPackageDirPlugin = HookOptionsOf<
  typeof writeReadmeFromPackageDirUtil
>;

const writeReadmeFromPackageDir = async (
  packageDir: string,
  plugins: WriteReadmeFromPackageDirPlugin[] | WriteReadmeFromPackageDirPlugin,
) => {
  const pluginList = Array.isArray(plugins) ? plugins : [plugins];
  const h = writeReadmeFromPackageDirUtil.merge(pluginList);
  await genReadmeFromPackageDir(
    packageDir,
    writeReadmeFromPackageDirUtil.merge([
      {
        after: {
          async genReadme(context) {
            await h.before.writeReadme(context);
            await writeFile(join(context.packageDir, 'README.md'), context.readmeText, {
              encoding: 'utf-8',
            });
            await h.after.writeReadme(context);
          },
        },
      },
      h,
    ]),
  );
};
export default writeReadmeFromPackageDir;
