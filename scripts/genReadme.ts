/*function section(title, content) {
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

export interface ReadmeContents { 
  title: string;
  packageName: string;
  dev: boolean;
  sections?: Sections
}

export function genReadme({ title, packageName, dev, sections = {} }: ReadmeContents) {
  const { examples, howTo, development = '' } = sections;
  const yarnSaveFlag = dev ? ' --dev' : '';
  const npmSaveFlag = dev ? ' --save-dev': ' --save';
  let md = '';
  md += `# ${title}\n`;
  md += '\n';
  md += '## Installation\n';
  md += '\n';
  md += `npm install${npmSaveFlag} ${packageName}\n`;
  md += 'or\n';
  md += `yarn add${yarnSaveFlag} ${packageName}\n`;
  md += '\n';
  md += section('How to use it', howToSection);
  md += section('Examples', examplesSection);
  md += section('Development', developmentSection += )
  md += '## Development\n';
  return md;
}*/
