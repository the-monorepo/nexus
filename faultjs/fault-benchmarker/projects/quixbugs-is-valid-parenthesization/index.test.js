import { isValidParenthesization } from './index';
import expect from 'expect';

describe('isValidParenthesization', () => {
  it('1', () => expect(isValidParenthesization("((()()))()")).toBe(true));
  it('2', () => expect(isValidParenthesization(")()(")).toBe(false));
  it('3', () => expect(isValidParenthesization("((")).toBe(false));
})