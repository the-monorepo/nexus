import { emitter, arrayFrom } from '../src/index.ts';

it(emitter.name, async () => {
  const myEmitter = emitter<number>();

  myEmitter.push(0);

  const arrayPromise = arrayFrom(myEmitter);

  myEmitter.push(1);
  myEmitter.push(2);
  myEmitter.push(3);
  myEmitter.finish();

  await expect(arrayPromise).resolves.toEqual([0, 1, 2, 3]);
});
