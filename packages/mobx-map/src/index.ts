import { isObservableArray, observable, action } from 'mobx';
export default function map(arr, mapFn) {
  if (isObservableArray(arr)) {
    const result = observable.array();
    arr.observe(
      action(changeData => {
        switch (changeData.type) {
          case 'splice':
            result.splice(
              changeData.index,
              changeData.removedCount,
              ...changeData.added.map((value, index) =>
                mapFn(value, index + changeData.index),
              ),
            );
            break;
          case 'update':
            result.splice(
              changeData.index,
              1,
              mapFn(changeData.newValue, changeData.index),
            );
            break;
        }
      }),
      true,
    );
    return result;
  }
  return arr.map(mapFn);
}
