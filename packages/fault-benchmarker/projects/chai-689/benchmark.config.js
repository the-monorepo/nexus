module.exports = {
  testMatch: './test/*.js',
  setupFiles: ['./babel', './test/bootstrap'],
  env: {
    ...process.env,
    NODE_ENV: 'test'
  },
}