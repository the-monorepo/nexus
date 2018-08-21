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
  isDevPackage: boolean;
  sections?: Sections;
}

export interface ReadmeContents extends ManualReadmeContents {
  title: string;
  packageJson: {
    name: string;
    description?: string;
  };
}
function genReadme({ title, packageJson, isDevPackage, sections = {} }: ReadmeContents) {
  const { examples, howTo, development = '' } = sections;
  // TODO: Also add peer dependencies
  const yarnSaveFlag = isDevPackage ? ' --dev' : '';
  const npmSaveFlag = isDevPackage ? ' --save-dev' : ' --save';
  let md = '';
  md += `# ${title}\n`;
  md += '\n';
  if (packageJson.description) {
    md += `${packageJson.description}\n`;
    md += '\n';
  }
  md += '## Installation\n';
  md += '\n';
  md += `\`npm install${npmSaveFlag} ${packageJson.name}\`\n`;
  md += 'or\n';
  md += `\`yarn add${yarnSaveFlag} ${packageJson.name}\`\n`;
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

function packageNameToTitle(packageName: string) {
  // Replaces - with a space and capitalises each word
  return packageName
    .replace(/@by-example\//, '')
    .replace('-', ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
}

export function genReadmeFromPackageDir(
  packageDir: string,
  contents: ManualReadmeContents,
) {
  const packageJson = readPackageJson(packageDir);
  const title = packageNameToTitle(packageJson.name);

  const readmeText = genReadme({
    title,
    packageJson,
    ...contents,
  });
  return readmeText;
}
