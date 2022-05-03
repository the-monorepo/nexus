use reconcilable_trait::Reconcilable;
use crate::*;

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

pub trait SplitTrait<Value> {
    type Other;
    fn split(self) -> (Self::Other, Value);
}

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

pub trait MapHeadTrait<Head, MappedValue> {
    type MappedObject;
    fn map_head<F: FnOnce(Head) -> MappedValue>(self, a_fn: F) -> Self::MappedObject;
}


pub trait MapTailTrait<Tail, MappedValue> {
    type MappedObject;
    fn map_tail<F: FnOnce(Tail) -> MappedValue>(self, a_fn: F) -> Self::MappedObject;
}

pub struct Head<H>(pub H);

pub struct Tail<T>(pub T);

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

impl<MappedValue, Value, T> MapHeadTrait<Value, MappedValue> for T
where
    T: SplitTrait<Head<Value>>,
    T::Other: MergeTrait<Head<MappedValue>>,
{
    type MappedObject = <T::Other as MergeTrait<Head<MappedValue>>>::MergedObject;
    fn map_head<F: FnOnce(Value) -> MappedValue>(self, a_fn: F) -> Self::MappedObject {
        let (other, Head(head)) = self.split();
        let mapped = a_fn(head);
        other.merge(Head(mapped))
    }
}

impl<MappedValue, Value, T> MapTailTrait<Value, MappedValue> for T
where
    T: SplitTrait<Tail<Value>>,
    T::Other: MergeTrait<Tail<MappedValue>>,
{
    type MappedObject = <T::Other as MergeTrait<Tail<MappedValue>>>::MergedObject;
    fn map_tail<F: FnOnce(Value) -> MappedValue>(self, a_fn: F) -> Self::MappedObject {
        let (other, Tail(tail)) = self.split();
        let mapped = a_fn(tail);
        other.merge(Tail(mapped))
    }
}

impl<T, Value> ComponentReconcilable<Head<Value>> for T
where
    T: SplitTrait<Head<Value>>,
    Value: Reconcilable<Value>,
    T::Other: MergeTrait<Head<<Value as Reconcilable<Value>>::Unreconciled>>,
{
    type Reconciled = (<Value as Reconcilable<Value>>::Reconciled, T::Other);
    type Unreconciled =
        <T::Other as MergeTrait<Head<<Value as Reconcilable<Value>>::Unreconciled>>>::MergedObject;
    fn reconcile(
        self,
        value: Head<Value>,
    ) -> Result<Self::Reconciled, Self::Unreconciled> {
        let (other, Head(head)) = self.split();

        match head.reconcile(value.0) {
            Ok(reconciled) => Ok((reconciled, other)),
            Err(err) => Err(other.merge(Head(err))),
        }
    }
}

impl<T, Value> ComponentReconcilable<Tail<Value>> for T
where
    T: SplitTrait<Tail<Value>>,
    Value: Reconcilable<Value>,
    T::Other: MergeTrait<Tail<<Value as Reconcilable<Value>>::Unreconciled>>,
{
    type Reconciled = (<Value as Reconcilable<Value>>::Reconciled, T::Other);
    type Unreconciled =
        <T::Other as MergeTrait<Tail<<Value as Reconcilable<Value>>::Unreconciled>>>::MergedObject;
    fn reconcile(
        self,
        value: Tail<Value>,
    ) -> Result<Self::Reconciled, Self::Unreconciled> {
        let (other, Tail(tail)) = self.split();

        match tail.reconcile(value.0) {
            Ok(reconciled) => Ok((reconciled, other)),
            Err(err) => Err(other.merge(Tail(err))),
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
}
