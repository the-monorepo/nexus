import { defaultCompareFn } from '../src/index';
it.skip(defaultCompareFn.name, () => {
  expect(defaultCompareFn(0, 0)).to.equal(0);
  expect(defaultCompareFn('0', 0)).to.equal(0);
  expect(defaultCompareFn(0, '0')).to.equal(0);
  expect(defaultCompareFn(0, true)).to.be.at.most(-1);
  expect(defaultCompareFn(false, 0)).to.be.at.least(-1);
  expect(defaultCompareFn(1, 0)).to.equal(1);
  expect(defaultCompareFn(0, 1)).to.equal(-1);
  expect(defaultCompareFn(100, 1)).to.be.at.least(1);
  expect(defaultCompareFn(100, 2)).to.be.at.most(-1);
  expect(defaultCompareFn('aab', 'aac')).to.be.at.most(-1);
});
