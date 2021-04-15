import { of, arrayFrom } from '../src/index';

it(of.name, () => expect(arrayFrom(of(1, 2, 3))).resolves.toEqual([1, 2, 3]));
