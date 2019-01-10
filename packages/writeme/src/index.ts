import { join } from 'path';

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
  packageJson: {
    name: string;
    description?: string;
    version: string;
  };
}

const suffixedVersionRegex = /\d+\.\d+\.\d+-/;

function genReadme({ title, packageJson, isDevPackage, sections = {} }: ReadmeContents) {
  const { examples, howTo, development = '' } = sections;
  // TODO: Also add peer dependencies
  const yarnSaveFlag = isDevPackage ? ' --dev' : '';
  const npmSaveFlag = isDevPackage ? ' --save-dev' : ' --save';
  if (!packageJson.name) {
    throw new Error('Package does not have a name');
  }
  if (!packageJson.version) {
    throw new Error(`${packageJson.name} does not have a version`);
  }
  const installPackageName = packageJson.version.match(suffixedVersionRegex)
    ? `${packageJson.name}@${packageJson.version}`
    : packageJson.name;

  let md = '';
  md += `# ${title}\n`;
  md += '\n';
  if (packageJson.description) {
    md += `${packageJson.description}\n`;
    md += '\n';
  }
  md += '## Installation\n';
  md += '\n';
  md += `\`npm install${npmSaveFlag} ${installPackageName}\`\n`;
  md += 'or\n';
  md += `\`yarn add${yarnSaveFlag} ${installPackageName}\`\n`;
  md += '\n';
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
    .replace(/@byexample\//, '')
    .replace('-', ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
}

export type MissingFileCallback = (configPath: string) => any;
export async function genReadmeFromPackageDir(
  packageDir: string,
  missingConfigHandle: MissingFileCallback = () => ({}),
) {
  async function readConfig() {
    const configPath = join(packageDir, 'writeme.config');
    try {
      return await Promise.resolve(require(configPath));
    } catch {
      return Promise.resolve(missingConfigHandle(configPath));
    }
  }
  const packageJson = readPackageJson(packageDir);
  const title = packageNameToTitle(packageJson.name);
  const contents = await readConfig();
  const readmeText = genReadme({
    title,
    packageJson,
    ...contents,
  });
  return readmeText;
}
export default genReadmeFromPackageDir;
