class Mapper<I, O> implements AsyncIterableIterator<O> {
  constructor(private readonly iterator: AsyncIterator<I>, private readonly mapFn: (i: I) => O) {

  }

  async next() {
    const i = await this.iterator.next();
    if(i.done) {
      return i;
    }

    return { value: this.mapFn(i.value), done: false };
  }

  [Symbol.asyncIterator](): AsyncIterableIterator<O> {
    return this;
  }
}

const map = <I, O>(iterable: AsyncIterable<I>, mapFn: (i: I) => O) => {
  return new Mapper(iterable[Symbol.asyncIterator](), mapFn);
};

export default map;
