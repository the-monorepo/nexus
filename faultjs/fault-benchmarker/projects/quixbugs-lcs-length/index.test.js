import expect from 'expect';
import { lcsLength } from './index';

describe('lcsLength', () => {
  it('1', () => expect(lcsLength("witch", "sandwich")).toBe(2));
  it('2', () => expect(lcsLength("meow", "homeowner")).toBe(4));
  it('3', () => expect(lcsLength("fun", "")).toBe(0));
  it('4', () => expect(lcsLength("fun", "function")).toBe(3));
  it('5', () => expect(lcsLength("cyborg", "cyber")).toBe(3));
  it('6', () => expect(lcsLength("physics", "physics")).toBe(7));
  it('7', () => expect(lcsLength("space age", "pace a")).toBe(6));
  it('8', () => expect(lcsLength("flippy", "floppy")).toBe(3));
  it('9', () => expect(lcsLength("acbdegcedbg", "begcfeubk")).toBe(3));
});
