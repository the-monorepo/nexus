import { emitter } from '../src/index';

it(emitter.name, async () => {
  const myEmitter = emitter<number>();

  myEmitter.push(0);

  const promise = Promise.all([myEmitter.next(), myEmitter.next(), myEmitter.next()]);

  myEmitter.push(1);
  myEmitter.push(2);
  myEmitter.push(3);

  await expect(promise).resolves.toEqual(
    [0, 1, 2].map((value) => ({ value, done: false })),
  );
});
