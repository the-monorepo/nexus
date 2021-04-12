import { globToRegExp } from "https://deno.land/std/path/glob.ts";
import { walk } from 'https://deno.land/std/fs/walk.ts';
import { join } from 'https://deno.land/std/path/mod.ts';
const dirnameURL = new URL('.', import.meta.url);

const { workspaces } = JSON.parse(await Deno.readTextFile(join(dirnameURL.pathname, 'package.json')));
const iterable = walk('.', {
  match: workspaces.map(globToRegExp),
  includeFiles: false,
  includeDirs: true,
});

const imports: Record<string, string> = {
};

for await (const i of iterable) {
  const packageJson = JSON.parse(await Deno.readTextFile(join(dirnameURL.pathname, i.path, 'package.json')))
  imports[`${packageJson.name}/`] = `./${i.path}/src/`;
  imports[`${packageJson.name}`] = `./${i.path}/src/index.ts`;
}

await Deno.writeTextFile('local.import-map.json', JSON.stringify({ imports }, undefined, 2));
