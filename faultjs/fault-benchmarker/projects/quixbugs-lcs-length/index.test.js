import { expect } from 'chai';
import { lcsLength } from './index';

describe('lcsLength', () => {
  it('1', () => expect(lcsLength("witch", "sandwich")).to.equal(2));
  it('2', () => expect(lcsLength("meow", "homeowner")).to.equal(4));
  it('3', () => expect(lcsLength("fun", "")).to.equal(0));
  it('4', () => expect(lcsLength("fun", "function")).to.equal(3));
  it('5', () => expect(lcsLength("cyborg", "cyber")).to.equal(3));
  it('6', () => expect(lcsLength("physics", "physics")).to.equal(7));
  it('7', () => expect(lcsLength("space age", "pace a")).to.equal(6));
  it('8', () => expect(lcsLength("flippy", "floppy")).to.equal(3));
  it('9', () => expect(lcsLength("acbdegcedbg", "begcfeubk")).to.equal(3));
});
