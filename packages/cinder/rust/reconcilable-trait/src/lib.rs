pub trait Reconcilable {
    type Value;
    type Unreconciled; // = Unchanged<Self, Self::Value>;
    type Reconciled;
    fn reconcile(self, new_value: Self::Value) -> Result<Self::Reconciled, Self::Unreconciled>;
}

#[derive(Debug)]
pub struct Unchanged<Source, Value> {
    pub source: Source,
    pub value: Value,
}

pub struct Nothing;

impl<Source, Value> Unchanged<Source, Value> {
    fn new(source: Source, value: Value) -> Unchanged<Source, Value> {
        Unchanged { source, value }
    }
}

impl<Source> Unchanged<Source, Nothing> {
    fn source(source: Source) -> Unchanged<Source, Nothing> {
        Unchanged::new(source, Nothing)
    }
}

impl<Value> Unchanged<Nothing, Value> {
    fn value(value: Value) -> Unchanged<Nothing, Value> {
        Unchanged::new(Nothing, value)
    }
}

pub trait SplitSource {
    type Source;
    type Other;
    fn split_source(self) -> (Self::Source, Self::Other);
}

pub trait SplitValue {
    type Value;
    type Other;
    fn split_value(self) -> (Self::Value, Self::Other);
}

impl<Source, Value> SplitSource for Unchanged<Source, Value> {
    type Source = Source;
    type Other = Unchanged<Nothing, Value>;
    fn split_source(self) -> (Self::Source, Self::Other) {
        return (self.source, Unchanged::value(self.value));
    }
}

impl<Source, Value> SplitValue for Unchanged<Source, Value> {
    type Value = Value;
    type Other = Unchanged<Source, Nothing>;
    fn split_value(self) -> (Self::Value, Self::Other) {
        return (self.value, Unchanged::source(self.source));
    }
}

pub mod mocks {
    use crate::{Reconcilable, Unchanged};

    #[derive(Debug)]
    pub enum Never {}
    #[derive(Debug)]
    pub struct AlwaysReconcileValue<Type> {
        phantom: std::marker::PhantomData<Type>,
    }

    impl<T> AlwaysReconcileValue<T> {
        pub fn new() -> AlwaysReconcileValue<T> {
            AlwaysReconcileValue {
                phantom: std::marker::PhantomData,
            }
        }
    }

    impl<T> Reconcilable for AlwaysReconcileValue<T> {
        type Value = T;
        type Unreconciled = Unchanged<Self, T>;

        type Reconciled = Self::Value;

        fn reconcile(self, new_value: Self::Value) -> Result<Self::Reconciled, Self::Unreconciled> {
            Ok(new_value)
        }
    }

    #[derive(Debug)]
    pub struct AlwaysUnreconcileValue<Type> {
        phantom: std::marker::PhantomData<Type>,
    }

    impl<T> AlwaysUnreconcileValue<T> {
        pub fn new() -> AlwaysUnreconcileValue<T> {
            AlwaysUnreconcileValue {
                phantom: std::marker::PhantomData,
            }
        }
    }

    impl<T> Reconcilable for AlwaysUnreconcileValue<T> {
        type Value = T;
        type Unreconciled = Unchanged<Self, Self::Value>;

        type Reconciled = Never;

        fn reconcile(self, new_value: Self::Value) -> Result<Self::Reconciled, Self::Unreconciled> {
            Err(Unchanged::new(self, new_value))
        }
    }
}
