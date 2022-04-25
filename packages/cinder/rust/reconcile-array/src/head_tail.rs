use reconcilable_trait::Reconcilable;

#[derive(Debug)]
pub struct HeadTail<Head, Tail> {
    pub head: Head,
    pub tail: Tail,
}

#[derive(Debug)]
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
    type TailObject;
    fn split_tail(self) -> (Self::TailObject, Self::Tail);
}

pub trait SplitHeadTrait {
    type Head;
    type HeadObject;
    fn split_head(self) -> (Self::HeadObject, Self::Head);
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

pub trait SplitMappedHeadTrait<Head> {
    type HeadObject;
    fn split_map_head<M, R, F: FnOnce(Head) -> SplitMapped<M, R>>(
        self,
        a_fn: F,
    ) -> SplitMapped<Self::HeadObject, R>;
}

pub trait SplitMappedTailTrait<Tail> {
    type TailObject;
    fn split_map_tail<M, R, F: FnOnce(Tail) -> SplitMapped<M, R>>(
        self,
        a_fn: F,
    ) -> SplitMapped<Self::TailObject, R>;
}

pub trait MapHeadTrait<Head> {
    type HeadObject;
    fn map_head<F: FnOnce(Head) -> Self::HeadObject>(self, a_fn: F) -> Self::HeadObject;
}

pub trait MapTailTrait<Tail> {
    type TailObject;
    fn map_tail<F: FnOnce(Tail) -> Self::TailObject>(self, a_fn: F) -> Self::TailObject;
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

/*
impl<Head, T : MapHeadTrait<Head>> MergeHeadTrait<Head> for T {
    type MergedObject = T::HeadObject;
    fn merge_head(self, head: Head) -> Self::MergedObject {
        self.map_head(|| head)
    }
}

impl<Tail, T : MapTailTrait<Tail>> MergeTailTrait<Tail> for T {
    type MergedObject = T::TailObject;
    fn merge_tail(self, tail: Tail) -> Self::MergedObject {
        self.map_head(|| tail)
    }
} */

impl<Head, T: SplitMappedHeadTrait<Head>> MapHeadTrait<Head> for T {
    type HeadObject = T::HeadObject;
    fn map_head<F: FnOnce(Head) -> Self::HeadObject>(self, _a_fn: F) -> Self::HeadObject {
        self.split_map_head(|head| SplitMapped {
            mapped: head,
            reduced: Nothing,
        })
        .mapped
    }
}

impl<Tail, T: SplitMappedTailTrait<Tail>> MapTailTrait<Tail> for T {
    type TailObject = T::TailObject;
    fn map_tail<F: FnOnce(Tail) -> Self::TailObject>(self, _a_fn: F) -> Self::TailObject {
        self.split_map_tail(|tail| SplitMapped {
            mapped: tail,
            reduced: Nothing,
        })
        .mapped
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
    T::HeadObject: MergeHeadTrait<<T::Head as Reconcilable>::Unreconciled>,
{
    type Value = <T::Head as Reconcilable>::Value;
    type Reconciled = (<T::Head as Reconcilable>::Reconciled, T::HeadObject);
    type Unreconciled =
        <T::HeadObject as MergeHeadTrait<<T::Head as Reconcilable>::Unreconciled>>::MergedObject;
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
    T::TailObject: MergeTailTrait<<T::Tail as Reconcilable>::Unreconciled>,
{
    type Value = <T::Tail as Reconcilable>::Value;
    type Reconciled = (<T::Tail as Reconcilable>::Reconciled, T::TailObject);
    type Unreconciled =
        <T::TailObject as MergeTailTrait<<T::Tail as Reconcilable>::Unreconciled>>::MergedObject;
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
    type TailObject = HeadTail<Head, Nothing>;

    fn split_tail(self) -> (HeadTail<Head, Nothing>, Tail) {
        return (
            HeadTail::head(self.head),
            self.tail,
        )
    }
}

impl<Head, Tail> SplitHeadTrait for HeadTail<Head, Tail> {
    type Head = Head;
    type HeadObject = HeadTail<Nothing, Tail>;

    fn split_head(self) -> (HeadTail<Nothing, Tail>, Head) {
        return (
            HeadTail::tail(self.tail),
            self.head,
        )
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
        expect_head_tail_strings(HeadTail::new("head", "tail").merge_head_option(None::<&'_ str>).unwrap_err());
    }

    #[test]
    fn merge_head_some() {
        expect_head_tail_strings(HeadTail::tail("tail").merge_head_option(Some("head")).unwrap());
    }

    #[test]
    fn merge_tail_none() {
        expect_head_tail_strings(HeadTail::new("head", "tail").merge_tail_option(None::<&'_ str>).unwrap_err());
    }

    #[test]
    fn merge_tail_some() {
        expect_head_tail_strings(HeadTail::head("head").merge_tail_option(Some("tail")).unwrap());
    }

    #[test]
    fn split_head() {
        let (tail_only, head) = HeadTail::new("split", "tail").split_head();
        assert_eq!(head, "split");
        assert_eq!(tail_only.tail, "tail");
    }

    #[test]
    fn split_tail() {
        let (head_only, split_tail) = HeadTail::new("head", "split").split_tail();
        assert_eq!(split_tail, "split");
        assert_eq!(head_only.head, "head");
    }
}