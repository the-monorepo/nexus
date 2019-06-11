const recalculateStaleStarts = (values, recalculateFrom) => {
  let previousItem =
    recalculateFrom === 0
      ? { start: 0, length: 0, offset: 0 }
      : values[recalculateFrom - 1];
  for (let v = recalculateFrom; v < values.length; v++) {
    const currentItem = values[v];
    const newStart = previousItem.start + previousItem.length + currentItem.offset;
    currentItem.start = newStart;
    previousItem = currentItem;
  }
};

export const segmentTracker = () => {
  const values = [];
  // -1 means nothing needs to be recalculated
  let recalculateFrom: number = -1;
  /**
   * Precondition: recalculateFrom is not -1
   */
  return {
    addSegment: (offset: number) => {
      const internalIndex = values.length;
      const segment = {
        start: -1,
        length: 0,
        offset,
      };
      values.push(segment);
      recalculateFrom = internalIndex;
      return {
        get length() {
          return segment.length;
        },
        set length(newLength) {
          segment.length = newLength;
          recalculateFrom = internalIndex;
        },
        get start() {
          if (recalculateFrom !== -1 && internalIndex >= recalculateFrom) {
            console.log(recalculateFrom);
            recalculateStaleStarts(values, recalculateFrom);
            recalculateFrom = -1;
          }
          return segment.start;
        },
      };
    },
  };
};
