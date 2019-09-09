import { defaultSortFn } from '../src/index';
it(defaultSortFn.name, () => {
  expect(defaultSortFn(0,0)).to.equal(0);
  expect(defaultSortFn('0',0)).to.equal(0);
  expect(defaultSortFn(0,'0')).to.equal(0);
  expect(defaultSortFn(0, true)).to.be.at.most(-1);
  expect(defaultSortFn(false, 0)).to.be.at.least(-1);
  expect(defaultSortFn(1, 0)).to.equal(1);
  expect(defaultSortFn(0, 1)).to.equal(-1);
  expect(defaultSortFn(100, 1)).to.be.at.least(1);
  expect(defaultSortFn(100, 2)).to.be.at.least(1);
  expect(defaultSortFn("aab", "aac")).to.be.at.most(-1);
});