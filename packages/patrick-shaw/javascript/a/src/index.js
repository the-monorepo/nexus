const { resolve } = require('node:path')
const { readFile } = require('node:fs/promises');

module.exports = {
    printVersion: async () => {
        const text = await readFile(resolve(__dirname, '../package.json'), { encoding: 'utf-8' });

        const data = JSON.parse(text);

        console.log(`${data.name}@${data.version}`)
    }
};

module.exports.printVersion();