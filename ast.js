const parser = require('@babel/parser');
const { readFile } = require('mz/fs');
async function run() {
  const content = await readFile('./test.js', 'utf8');
  console.log(JSON.stringify(
    parser.parse(content, { plugins: [
      'jsx'
    ]}),
    undefined,
    2
  ));
}
run();