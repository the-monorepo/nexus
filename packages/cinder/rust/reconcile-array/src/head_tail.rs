use reconcilable_trait::Reconcilable;

#[derive(Debug, PartialEq)]
pub struct HeadTail<Head, Tail> {
    pub head: Head,
    pub tail: Tail,
}

#[derive(Debug, PartialEq)]
pub struct Nothing;

impl<Head, Tail> HeadTail<Head, Tail> {
    pub fn new(head: Head, tail: Tail) -> Self {
        HeadTail { head, tail }
    }
}

impl HeadTail<Nothing, Nothing> {
    pub fn nothing() -> HeadTail<Nothing, Nothing> {
        return HeadTail::new(Nothing, Nothing);
    }
}

pub trait SplitTailTrait {
    type Tail;
    type Other;
    fn split_tail(self) -> (Self::Other, Self::Tail);

    fn drop_tail(self) -> Self::Other
    where
        Self: Sized,
    {
        self.split_tail().0
    }
}

pub trait SplitHeadTrait {
    type Head;
    type Other;
    fn split_head(self) -> (Self::Other, Self::Head);

    fn drop_head(self) -> Self::Other
    where
        Self: Sized,
    {
        self.split_head().0
    }
}

pub trait MergeTailTrait<Tail> {
    type MergedObject;
    fn merge_tail(self, tail: Tail) -> Self::MergedObject;

    fn merge_tail_option(self, tail_option: Option<Tail>) -> Result<Self::MergedObject, Self>
    where
        Self: Sized,
    {
        if let Some(tail) = tail_option {
            Ok(self.merge_tail(tail))
        } else {
            Err(self)
        }
    }
}

pub trait MergeHeadTrait<Head> {
    type MergedObject;
    fn merge_head(self, head: Head) -> Self::MergedObject;

    fn merge_head_option(self, head_option: Option<Head>) -> Result<Self::MergedObject, Self>
    where
        Self: Sized,
    {
        if let Some(head) = head_option {
            Ok(self.merge_head(head))
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

impl<CurrentHead, Head, Tail> MergeHeadTrait<Head> for HeadTail<CurrentHead, Tail> {
    type MergedObject = HeadTail<Head, Tail>;
    fn merge_head(self, head: Head) -> HeadTail<Head, Tail> {
        HeadTail {
            head,
            tail: self.tail,
        }
    }
}

impl<CurrentTail, Head, Tail> MergeTailTrait<Tail> for HeadTail<Head, CurrentTail> {
    type MergedObject = HeadTail<Head, Tail>;
    fn merge_tail(self, tail: Tail) -> HeadTail<Head, Tail> {
        HeadTail {
            head: self.head,
            tail,
        }
    }
}

impl<MappedValue, Head, T> MapHeadTrait<Head, MappedValue> for T
where
    T: SplitHeadTrait<Head = Head>,
    T::Other: MergeHeadTrait<MappedValue>,
{
    type MappedObject = <T::Other as MergeHeadTrait<MappedValue>>::MergedObject;
    fn map_head<F: FnOnce(Head) -> MappedValue>(self, a_fn: F) -> Self::MappedObject {
        let (other, head) = self.split_head();
        let mapped = a_fn(head);
        other.merge_head(mapped)
    }
}

impl<MappedValue, Tail, T> MapTailTrait<Tail, MappedValue> for T
where
    T: SplitTailTrait<Tail = Tail>,
    T::Other: MergeTailTrait<MappedValue>,
{
    type MappedObject = <T::Other as MergeTailTrait<MappedValue>>::MergedObject;
    fn map_tail<F: FnOnce(Tail) -> MappedValue>(self, a_fn: F) -> Self::MappedObject {
        let (other, tail) = self.split_tail();
        let mapped = a_fn(tail);
        other.merge_tail(mapped)
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
    T::Head: Reconcilable,
    T::Other: MergeHeadTrait<<T::Head as Reconcilable>::Unreconciled>,
{
    type Value = <T::Head as Reconcilable>::Value;
    type Reconciled = (<T::Head as Reconcilable>::Reconciled, T::Other);
    type Unreconciled =
        <T::Other as MergeHeadTrait<<T::Head as Reconcilable>::Unreconciled>>::MergedObject;
    fn reconcile_head(
        self,
        value: <T::Head as Reconcilable>::Value,
    ) -> Result<Self::Reconciled, Self::Unreconciled> {
        let (other, head) = self.split_head();

        match head.reconcile(value) {
            Ok(reconciled) => Ok((reconciled, other)),
            Err(err) => Err(other.merge_head(err)),
        }
    }
}

impl<T> ReconcileTail for T
where
    T: SplitTailTrait,
    T::Tail: Reconcilable,
    T::Other: MergeTailTrait<<T::Tail as Reconcilable>::Unreconciled>,
{
    type Value = <T::Tail as Reconcilable>::Value;
    type Reconciled = (<T::Tail as Reconcilable>::Reconciled, T::Other);
    type Unreconciled =
        <T::Other as MergeTailTrait<<T::Tail as Reconcilable>::Unreconciled>>::MergedObject;
    fn reconcile_tail(
        self,
        value: <T::Tail as Reconcilable>::Value,
    ) -> Result<Self::Reconciled, Self::Unreconciled> {
        let (other, tail) = self.split_tail();

        match tail.reconcile(value) {
            Ok(reconciled) => Ok((reconciled, other)),
            Err(err) => Err(other.merge_tail(err)),
        }
    }
}

impl<Head> HeadTail<Head, Nothing> {
    pub fn head(head: Head) -> Self {
        HeadTail {
            head,
            tail: Nothing,
        }
    }
}

impl<Tail> HeadTail<Nothing, Tail> {
    pub fn tail(tail: Tail) -> Self {
        HeadTail {
            head: Nothing,
            tail,
        }
    }
}

impl<Head, Tail> SplitTailTrait for HeadTail<Head, Tail> {
    type Tail = Tail;
    type Other = HeadTail<Head, Nothing>;

    fn split_tail(self) -> (HeadTail<Head, Nothing>, Tail) {
        return (HeadTail::head(self.head), self.tail);
    }
}

impl<Head, Tail> SplitHeadTrait for HeadTail<Head, Tail> {
    type Head = Head;
    type Other = HeadTail<Nothing, Tail>;

    fn split_head(self) -> (HeadTail<Nothing, Tail>, Head) {
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
        expect_head_tail_strings(HeadTail::head("head").merge_tail("tail"));
    }

    #[test]
    fn merge_tail() {
        expect_head_tail_strings(HeadTail::tail("tail").merge_head("head"));
    }

    #[test]
    fn merge_head_none() {
        assert_eq!(
            HeadTail::tail("tail")
                .merge_head_option(None::<&'_ str>)
                .unwrap_err(),
            HeadTail::tail("tail")
        );
    }

    #[test]
    fn merge_head_some() {
        expect_head_tail_strings(
            HeadTail::tail("tail")
                .merge_head_option(Some("head"))
                .unwrap(),
        );
    }

    #[test]
    fn merge_tail_none() {
        assert_eq!(
            HeadTail::head("head")
                .merge_tail_option(None::<&'_ str>)
                .unwrap_err(),
            HeadTail::head("head")
        );
    }

    #[test]
    fn merge_tail_some() {
        expect_head_tail_strings(
            HeadTail::head("head")
                .merge_tail_option(Some("tail"))
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
