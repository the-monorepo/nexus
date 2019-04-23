const parser = require('@babel/parser');
const fs = require('mz/fs');
async function test() {
  const text = await fs.readFile('./example.js', 'utf8');
  console.log(JSON.stringify(parser.parse(text, { plugins: ['jsx']}), undefined, 2));
}
test();