pub trait Reconcilable {
  type Value;
  type Unreconciled;
  type Reconciled;
  fn reconcile(self, new_value: Self::Value) -> Result<Self::Reconciled, Self::Unreconciled>;
}
