const parser = require('@babel/parser');
const fs = require('fs');
const result = parser.parse(fs.readFileSync('./test.js', 'utf8'), { plugins: ['jsx']});
console.log(JSON.stringify(result, undefined, 2));