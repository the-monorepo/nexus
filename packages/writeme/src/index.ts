import { join } from 'path';
import { pathExists } from 'fs-extra';

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
  private?: string;
  description?: string;
}

const suffixedVersionRegex = /\d+\.\d+\.\d+-/;

function genReadme({
  name,
  version,
  isDevPackage,
  description,
  sections = {},
  ...other
}: ReadmeContents) {
  const title = packageNameToTitle(name);
  const { examples, howTo, development = '' } = sections;
  if (!name) {
    throw new Error(`Name was ${name}`);
  }
  if (!version) {
    throw new Error(`${name} does not have a version`);
  }
  const installPackageName = version.match(suffixedVersionRegex)
    ? `${name}@${version}`
    : name;

  let md = '';
  md += `# ${title}\n`;
  md += '\n';
  if (description) {
    md += `${description}\n`;
    md += '\n';
  }
  md += '## Installation\n';
  md += '\n';
  if (other.private !== true) {
    // TODO: Also add peer dependencies
    const yarnSaveFlag = isDevPackage ? ' --dev' : '';
    const npmSaveFlag = isDevPackage ? ' --save-dev' : ' --save';

    md += `\`npm install${npmSaveFlag} ${installPackageName}\`\n`;
    md += 'or\n';
    md += `\`yarn add${yarnSaveFlag} ${installPackageName}\`\n`;
    md += '\n';
  }
  md += section('How to use it', howTo);
  md += section('Examples', examples);
  md += section('Development', development);
  return md;
}

function readPackageJson(packageDir) {
  const packageJson = require(join(packageDir, 'package.json'));
  return packageJson;
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
export async function genReadmeFromPackageDir(
  packageDir: string,
  missingConfigHandle: MissingFileCallback = () => ({}),
) {
  async function readConfig() {
    const configPath = join(packageDir, 'writeme.config');
    async function getConfigModule() {
      if (await pathExists(`${configPath}.js`)) {
        return require(configPath);
      } else {
        return await Promise.resolve(missingConfigHandle(configPath));
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
  const packageJson = readPackageJson(packageDir);
  const contents = await readConfig();
  const readmeText = genReadme({
    ...packageJson,
    ...contents,
  });
  return readmeText;
}
export default genReadmeFromPackageDir;
