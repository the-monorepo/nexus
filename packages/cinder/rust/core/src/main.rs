type Unmount<I> = Fn(I);

type Update<I> = Fn(I) -> (Update<I>, Unmount<I>);

type Mount<I, O> = Fn(I, O) -> (Update<O>, Unmount<O>);

type Blueprint<M: Mount<_, _>> {
  clone() -> Mount;
}

trait Node {

}

type Remove = Fn(Node);
trait Client {
  fn push(node: Node) -> Remove;
}

pub fn render() {

}
