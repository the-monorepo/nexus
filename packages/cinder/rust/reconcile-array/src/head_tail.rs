use reconcilable_trait::Reconcilable;
use crate::*;

/**
 * Lowest level layer of reconiling an array. Pretty much all the work done in reconciling an array only requires referring to the 
 * head and the tail so we've made traits to communicate that in a generic way.
 */
#[derive(Debug, PartialEq)]
pub struct HeadTail<HeadGeneric, TailGeneric> {
    pub head: HeadGeneric,
    pub tail: TailGeneric,
}

#[derive(Debug, PartialEq)]
pub struct Nothing;

impl<HeadGeneric, TailGeneric> HeadTail<HeadGeneric, TailGeneric> {
    pub fn new(head: HeadGeneric, tail: TailGeneric) -> Self {
        HeadTail { head, tail }
    }
}

impl HeadTail<Nothing, Nothing> {
    pub fn nothing() -> HeadTail<Nothing, Nothing> {
        return HeadTail::new(Nothing, Nothing);
    }
}

/**
 * An immutable trait for popping a value out of an object
 */
pub trait SplitTrait<Value> {
    type Other;
    fn split(self) -> (Self::Other, Value);
}

/**
 * An immutable trait for adding a value int oa an object
 */
pub trait MergeTrait<Value> {
    type MergedObject;
    fn merge(self, value: Value) -> Self::MergedObject;

    fn merge_option(self, value_option: Option<Value>) -> Result<Self::MergedObject, Self>
    where
        Self: Sized,
    {
        if let Some(value) = value_option {
            Ok(self.merge(value))
        } else {
            Err(self)
        }
    }
}


pub struct SplitMapped<M, R> {
    pub mapped: M,
    pub reduced: R,
}

pub trait MapTrait<Value, MappedValue> {
    type MappedObject;
    fn map<F: FnOnce(Value) -> MappedValue>(self, wrap_value: F) -> Self::MappedObject;
}

pub trait Wrapper {
    type Wrapped<T>;
    fn wrap<T>(value: T) -> Self::Wrapped<T>;
}

/**
 * Used to identify whether to operate on the head for head tail traits
 */
#[derive(PartialEq)]
#[derive(Debug)]
pub struct Head<H = ()>(pub H);
pub const HEAD: Head<()> = Head(());

 impl<V> Wrapper for Head<V> {
    type Wrapped<T> = Head<T>;

    fn wrap<T>(value: T) -> Self::Wrapped<T> {
        return Head(value);
    }
}

impl<T> Head<T> {
    pub fn new(value: T) -> Head<T> {
        Head(value)
    }
}

/**
 * Small utility so you don't have to access Head's reconcile method directly
 */
impl<Value, H : Reconcilable<Value>> Reconcilable<Value> for Head<H> {
    type Reconciled = H::Reconciled;
    type Unreconciled = H::Unreconciled;

    fn reconcile(self, value: Value) -> Result<H::Reconciled, H::Unreconciled> {
        self.0.reconcile(value)
    }
} 
/**
 * Used to identify whether to operate on the tail for head-tail traits
 */
#[derive(PartialEq)]
#[derive(Debug)]
pub struct Tail<T = ()>(pub T);
pub const TAIL: Tail<()> = Tail(());

impl<V> Wrapper for Tail<V> {
    type Wrapped<T> = Tail<T>;

    fn wrap<T>(value: T) -> Self::Wrapped<T> {
        return Tail(value);
    }
}

impl<T> Tail<T> {
    pub fn new(value: T) -> Tail<T> {
        Tail(value)
    }
}

/**
 * Small utility so you don't have to access Tail's reconcile method directly
 */
impl<Value, T : Reconcilable<Value>> Reconcilable<Value> for Tail<T> {
    type Reconciled = T::Reconciled;
    type Unreconciled = T::Unreconciled;

    fn reconcile(self, value: Value) -> Result<T::Reconciled, T::Unreconciled> {
        self.0.reconcile(value)
    }
} 

impl<CurrentHead, HeadGeneric, TailGeneric> MergeTrait<Head<HeadGeneric>> for HeadTail<CurrentHead, TailGeneric> {
    type MergedObject = HeadTail<HeadGeneric, TailGeneric>;
    fn merge(self, head: Head<HeadGeneric>) -> HeadTail<HeadGeneric, TailGeneric> {
        HeadTail {
            head: head.0,
            tail: self.tail,
        }
    }
}

impl<CurrentTail, HeadGeneric, TailGeneric> MergeTrait<Tail<TailGeneric>> for HeadTail<HeadGeneric, CurrentTail> {
    type MergedObject = HeadTail<HeadGeneric, TailGeneric>;
    fn merge(self, tail: Tail<TailGeneric>) -> HeadTail<HeadGeneric, TailGeneric> {
        HeadTail {
            head: self.head,
            tail: tail.0,
        }
    }
}

impl<MappedValue, Value, T> MapTrait<Head<Value>, MappedValue> for T
where
    T: SplitTrait<Head<Value>>,
    T::Other: MergeTrait<Head<MappedValue>>,
{
    type MappedObject = <T::Other as MergeTrait<Head<MappedValue>>>::MergedObject;
    fn map<F: FnOnce(Head<Value>) -> MappedValue>(self, a_fn: F) -> Self::MappedObject {
        let (other, head) = self.split();
        let mapped = a_fn(head);
        other.merge(Head(mapped))
    }
}

impl<MappedValue, Value, T> MapTrait<Tail<Value>, MappedValue> for T
where
    T: SplitTrait<Tail<Value>>,
    T::Other: MergeTrait<Tail<MappedValue>>,
{
    type MappedObject = <T::Other as MergeTrait<Tail<MappedValue>>>::MergedObject;
    fn map<F: FnOnce(Tail<Value>) -> MappedValue>(self, a_fn: F) -> Self::MappedObject {
        let (other, tail) = self.split();
        let mapped = a_fn(tail);
        other.merge(Tail(mapped))
    }
}

impl<HeadGeneric, NewValue, CurrentValue> Reconcilable<Tail<NewValue>> for HeadTail<HeadGeneric, CurrentValue>
where CurrentValue: Reconcilable<NewValue>
{
    type Reconciled = HeadTail<HeadGeneric, CurrentValue::Reconciled>;
    type Unreconciled = HeadTail<HeadGeneric, CurrentValue::Unreconciled>;
    
    fn reconcile(self, new_value: Tail<NewValue>) -> Result<Self::Reconciled, Self::Unreconciled> {
        let (other, Tail(tail)) = self.split();
        
        match tail.reconcile(new_value.0) {
            Ok(reconciled) => Ok(other.merge(Tail(reconciled))),
            Err(unreconciled) => Err(other.merge(Tail(unreconciled))),
        }
    }
}

impl<TailGeneric, NewValue, CurrentValue> Reconcilable<Head<NewValue>> for HeadTail<CurrentValue, TailGeneric>
where CurrentValue: Reconcilable<NewValue>
{
    type Reconciled = HeadTail<CurrentValue::Reconciled, TailGeneric>;
    type Unreconciled = HeadTail<CurrentValue::Unreconciled, TailGeneric>;
    
    fn reconcile(self, new_value: Head<NewValue>) -> Result<Self::Reconciled, Self::Unreconciled> {
        let (other, Head(tail)) = self.split();
        
        match tail.reconcile(new_value.0) {
            Ok(reconciled) => Ok(other.merge(Head(reconciled))),
            Err(unreconciled) => Err(other.merge(Head(unreconciled))),
        }
    }
}

impl<HeadGeneric> HeadTail<HeadGeneric, Nothing> {
    pub fn head(head: HeadGeneric) -> Self {
        HeadTail {
            head,
            tail: Nothing,
        }
    }
}

impl<TailGeneric> HeadTail<Nothing, TailGeneric> {
    pub fn tail(tail: TailGeneric) -> Self {
        HeadTail {
            head: Nothing,
            tail,
        }
    }
}

impl<HeadGeneric, Value> SplitTrait<Tail<Value>> for HeadTail<HeadGeneric, Value> {
    type Other = HeadTail<HeadGeneric, Nothing>;

    fn split(self) -> (HeadTail<HeadGeneric, Nothing>, Tail<Value>) {
        return (HeadTail::head(self.head), Tail(self.tail));
    }
}

impl<Value, TailGeneric> SplitTrait<Head<Value>> for HeadTail<Value, TailGeneric> {
    type Other = HeadTail<Nothing, TailGeneric>;

    fn split(self) -> (HeadTail<Nothing, TailGeneric>, Head<Value>) {
        return (HeadTail::tail(self.tail), Head(self.head));
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use reconcilable_trait::mocks::AlwaysReconcileValue;

    fn expect_head_tail_strings<'a, 'b>(head_tail: HeadTail<&'a str, &'b str>) {
        assert_eq!(head_tail.head, "head");
        assert_eq!(head_tail.tail, "tail");
    }

    #[test]
    fn new() {
        expect_head_tail_strings(HeadTail::new("head", "tail"));
    }

    #[test]
    fn merge_head() {
        expect_head_tail_strings(HeadTail::head("head").merge(Tail("tail")));
    }

    #[test]
    fn merge_tail() {
        expect_head_tail_strings(HeadTail::tail("tail").merge(Head("head")));
    }

    #[test]
    fn merge_head_none() {
        assert_eq!(
            HeadTail::tail("tail")
                .merge_option(None::<Head<&'_ str>>)
                .unwrap_err(),
            HeadTail::tail("tail")
        );
    }

    #[test]
    fn merge_head_some() {
        expect_head_tail_strings(
            HeadTail::tail("tail")
                .merge_option(Some(Head("head")))
                .unwrap(),
        );
    }

    #[test]
    fn merge_tail_none() {
        assert_eq!(
            HeadTail::head("head")
                .merge_option(None::<Tail<&'_ str>>)
                .unwrap_err(),
            HeadTail::head("head")
        );
    }

    #[test]
    fn merge_tail_some() {
        expect_head_tail_strings(
            HeadTail::head("head")
                .merge_option(Some(Tail("tail")))
                .unwrap(),
        );
    }

    #[test]
    fn split_head() {
        let (tail_only, Head(head)) = HeadTail::new("split", "tail").split();
        assert_eq!(head, "split");
        assert_eq!(tail_only, HeadTail::tail("tail"));
    }

    #[test]
    fn split_tail() {
        let (head_only, Tail(split_tail)) = HeadTail::new("head", "split").split();
        assert_eq!(split_tail, "split");
        assert_eq!(head_only, HeadTail::head("head"));
    }

    #[test]
    fn reconcile_head() {
        let reconciled = HeadTail::new(AlwaysReconcileValue::<u32>::new(), Nothing).reconcile(Head(1)).unwrap();
        assert_eq!(reconciled, HeadTail::head(1));
    }
}
