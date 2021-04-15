import { emitter, bufferred } from '../src/index';

it(bufferred.name, async () => {
  const myEmitter = emitter<number>();
  myEmitter.push(0);

  const buffer = bufferred(myEmitter);

  myEmitter.push(1);
  myEmitter.push(2);
  myEmitter.push(3);
  const promise = Promise.all([buffer.next(), buffer.next(), buffer.next()]);

  await expect(promise).resolves.toEqual(
    [1, 2, 3].map((value) => ({ value, done: false })),
  );
});
