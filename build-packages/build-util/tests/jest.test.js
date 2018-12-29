const transpilation = require('../src');
describe('jest', () => {
  it('empty', () => {
    // Just want to make sure it doesn't crash
    transpilation.jest.settings();
  });
});
