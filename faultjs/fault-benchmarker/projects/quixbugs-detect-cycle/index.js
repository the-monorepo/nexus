export const detectCycle = (node) => {
  let hare = node;
  let tortoise = node;

  while(true) {
    if(hare.successor === undefined) {
      return false;
    }

    tortoise = tortoise.successor;
    hare = hare.successor.successor;
    if (hare === tortoise) {
      return true;
    }
  }
}

/*
export const detectCycle = (node) => {
  let hare = node;
  let tortoise = node;

  while(true) {
    if(hare === undefined || hare.successor === undefined) {
      return false;
    }

    tortoise = tortoise.successor;
    hare = hare.successor.successor;
    if (hare === tortoise) {
      return true;
    }
  }
}
*/