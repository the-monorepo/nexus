import { of, arrayFrom } from '../src/index.ts';

it(of.name, () => expect(arrayFrom(of(1, 'a', 3))).resolves.toEqual([1, 'a', 3]));
