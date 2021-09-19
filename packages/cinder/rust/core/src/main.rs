#![no_std]
#![no_main]

trait Component<I, O> {
  fn mount(&self) -> O;
  fn update(&self, input: I);
  fn unmount(&self);
}
trait Blueprint<I, O> {
  fn create(&self) -> dyn Component<I, O>;
}

pub fn renderString(value: &str, container: ) -> Client {

}
