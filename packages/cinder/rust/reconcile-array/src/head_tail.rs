use reconcilable_trait::Reconcilable;

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

pub trait SplitTailTrait {
    type TailGeneric;
    type Other;
    fn split_tail(self) -> (Self::Other, Self::TailGeneric);

    fn drop_tail(self) -> Self::Other
    where
        Self: Sized,
    {
        self.split_tail().0
    }
}

pub trait SplitHeadTrait {
    type HeadGeneric;
    type Other;
    fn split_head(self) -> (Self::Other, Self::HeadGeneric);

    fn drop_head(self) -> Self::Other
    where
        Self: Sized,
    {
        self.split_head().0
    }
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

impl<MappedValue, HeadGeneric, T> MapHeadTrait<HeadGeneric, MappedValue> for T
where
    T: SplitHeadTrait<HeadGeneric = HeadGeneric>,
    T::Other: MergeTrait<Head<MappedValue>>,
{
    type MappedObject = <T::Other as MergeTrait<Head<MappedValue>>>::MergedObject;
    fn map_head<F: FnOnce(HeadGeneric) -> MappedValue>(self, a_fn: F) -> Self::MappedObject {
        let (other, head) = self.split_head();
        let mapped = a_fn(head);
        other.merge(Head(mapped))
    }
}

impl<MappedValue, TailGeneric, T> MapTailTrait<TailGeneric, MappedValue> for T
where
    T: SplitTailTrait<TailGeneric = TailGeneric>,
    T::Other: MergeTrait<Tail<MappedValue>>,
{
    type MappedObject = <T::Other as MergeTrait<Tail<MappedValue>>>::MergedObject;
    fn map_tail<F: FnOnce(TailGeneric) -> MappedValue>(self, a_fn: F) -> Self::MappedObject {
        let (other, tail) = self.split_tail();
        let mapped = a_fn(tail);
        other.merge(Tail(mapped))
    }
}

pub trait ReconcileHead {
    type Value;
    type Reconciled;
    type Unreconciled;
    fn reconcile_head(self, value: Self::Value) -> Result<Self::Reconciled, Self::Unreconciled>;
}

pub trait ReconcileTail {
    type Value;
    type Reconciled;
    type Unreconciled;
    fn reconcile_tail(self, value: Self::Value) -> Result<Self::Reconciled, Self::Unreconciled>;
}

impl<T> ReconcileHead for T
where
    T: SplitHeadTrait,
    T::HeadGeneric: Reconcilable,
    T::Other: MergeTrait<Head<<T::HeadGeneric as Reconcilable>::Unreconciled>>,
{
    type Value = <T::HeadGeneric as Reconcilable>::Value;
    type Reconciled = (<T::HeadGeneric as Reconcilable>::Reconciled, T::Other);
    type Unreconciled =
        <T::Other as MergeTrait<Head<<T::HeadGeneric as Reconcilable>::Unreconciled>>>::MergedObject;
    fn reconcile_head(
        self,
        value: <T::HeadGeneric as Reconcilable>::Value,
    ) -> Result<Self::Reconciled, Self::Unreconciled> {
        let (other, head) = self.split_head();

        match head.reconcile(value) {
            Ok(reconciled) => Ok((reconciled, other)),
            Err(err) => Err(other.merge(Head(err))),
        }
    }
}

impl<T> ReconcileTail for T
where
    T: SplitTailTrait,
    T::TailGeneric: Reconcilable,
    T::Other: MergeTrait<Tail<<T::TailGeneric as Reconcilable>::Unreconciled>>,
{
    type Value = <T::TailGeneric as Reconcilable>::Value;
    type Reconciled = (<T::TailGeneric as Reconcilable>::Reconciled, T::Other);
    type Unreconciled =
        <T::Other as MergeTrait<Tail<<T::TailGeneric as Reconcilable>::Unreconciled>>>::MergedObject;
    fn reconcile_tail(
        self,
        value: <T::TailGeneric as Reconcilable>::Value,
    ) -> Result<Self::Reconciled, Self::Unreconciled> {
        let (other, tail) = self.split_tail();

        match tail.reconcile(value) {
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

impl<HeadGeneric, TailGeneric> SplitTailTrait for HeadTail<HeadGeneric, TailGeneric> {
    type TailGeneric = TailGeneric;
    type Other = HeadTail<HeadGeneric, Nothing>;

    fn split_tail(self) -> (HeadTail<HeadGeneric, Nothing>, TailGeneric) {
        return (HeadTail::head(self.head), self.tail);
    }
}

impl<HeadGeneric, TailGeneric> SplitHeadTrait for HeadTail<HeadGeneric, TailGeneric> {
    type HeadGeneric = HeadGeneric;
    type Other = HeadTail<Nothing, TailGeneric>;

    fn split_head(self) -> (HeadTail<Nothing, TailGeneric>, HeadGeneric) {
        return (HeadTail::tail(self.tail), self.head);
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
        let (tail_only, head) = HeadTail::new("split", "tail").split_head();
        assert_eq!(head, "split");
        assert_eq!(tail_only, HeadTail::tail("tail"));
    }

    #[test]
    fn split_tail() {
        let (head_only, split_tail) = HeadTail::new("head", "split").split_tail();
        assert_eq!(split_tail, "split");
        assert_eq!(head_only, HeadTail::head("head"));
    }

    #[test]
    fn drop_tail() {
        assert_eq!(HeadTail::tail("tail").drop_tail(), HeadTail::nothing());
    }

    #[test]
    fn drop_head() {
        assert_eq!(HeadTail::head("head").drop_head(), HeadTail::nothing());
    }
}
