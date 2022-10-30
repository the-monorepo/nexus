use immutable_operators::*;

pub trait Reconcilable<Value> {
    type Unreconciled; // = Unchanged<Self, Self::Value>;
    type Reconciled;
    fn reconcile(self, new_value: Value) -> Result<Self::Reconciled, Self::Unreconciled>;
}

#[derive(Debug, PartialEq)]
pub struct Unchanged<Source, Value> {
    pub source: Source,
    pub value: Value,
}

pub struct Nothing;

impl<Source, Value> Unchanged<Source, Value> {
    pub fn new(source: Source, value: Value) -> Unchanged<Source, Value> {
        Unchanged { source, value }
    }
}

impl<Source> Unchanged<Source, Nothing> {
    pub fn source(source: Source) -> Unchanged<Source, Nothing> {
        Unchanged::new(source, Nothing)
    }
}

impl<Value> Unchanged<Nothing, Value> {
    pub fn value(value: Value) -> Unchanged<Nothing, Value> {
        Unchanged::new(Nothing, value)
    }
}

#[derive(Debug, PartialEq)]
pub struct Source<T>(pub T);
#[derive(Debug, PartialEq)]
pub struct Value<T>(pub T);

impl<SourceGeneric, ValueGeneric> SplitTrait<Value<ValueGeneric>>
    for Unchanged<SourceGeneric, ValueGeneric>
{
    type Other = Unchanged<SourceGeneric, Nothing>;
    fn split(self) -> (Self::Other, Value<ValueGeneric>) {
        return (Unchanged::new(self.source, Nothing), Value(self.value));
    }
}

impl<SourceGeneric, ValueGeneric> SplitTrait<Source<SourceGeneric>>
    for Unchanged<SourceGeneric, ValueGeneric>
{
    type Other = Unchanged<Nothing, ValueGeneric>;
    fn split(self) -> (Self::Other, Source<SourceGeneric>) {
        return (Unchanged::new(Nothing, self.value), Source(self.source));
    }
}

pub mod mocks {
    use crate::{Reconcilable, Unchanged};

    #[derive(Debug, PartialEq)]
    pub enum Never {}
    #[derive(Debug, PartialEq)]
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

    impl<T> Reconcilable<T> for AlwaysReconcileValue<T> {
        type Unreconciled = Unchanged<Self, T>;

        type Reconciled = T;

        fn reconcile(self, new_value: T) -> Result<Self::Reconciled, Self::Unreconciled> {
            Ok(new_value)
        }
    }

    #[derive(Debug, PartialEq)]
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

    impl<T> Reconcilable<T> for AlwaysUnreconcileValue<T> {
        type Unreconciled = Unchanged<Self, T>;

        type Reconciled = Never;

        fn reconcile(self, new_value: T) -> Result<Self::Reconciled, Self::Unreconciled> {
            Err(Unchanged::new(self, new_value))
        }
    }
}
