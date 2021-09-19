type Unmount<I> = Fn(I);

type Update<I> = Fn(I) -> (Update<I>, Unmount<I>);

type Mount<I, O> = Fn(I, O) -> (Update<O>, Unmount<O>);

trait Blueprint<M: Mount<_, _>> {
  fn clone() -> M;
}

trait Node {

}

type Remove = Fn(Node);
trait Client {
  fn push(node: Node) -> Remove;
}

pub fn renderString(value: &str, container: ) -> Client {

}
