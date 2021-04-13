async function* map<I, O>(iterable: AsyncIterable<I>, mapFn: (i: I) => O) {
  for await (const i of iterable) {
    yield await mapFn(i);
  }
}

export default map;
