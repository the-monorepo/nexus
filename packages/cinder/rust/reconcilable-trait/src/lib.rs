pub trait Reconcilable {
    type Value;
    type Unreconciled; // = Unchanged<Self, Self::Value>;
    type Reconciled;
    fn reconcile(self, new_value: Self::Value) -> Result<Self::Reconciled, Self::Unreconciled>;
}

pub struct Unchanged<Source, Value> {
    pub source: Source,
    pub value: Value,
}
