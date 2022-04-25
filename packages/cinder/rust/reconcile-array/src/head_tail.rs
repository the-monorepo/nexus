use reconcilable_trait::Reconcilable;

pub struct HeadTail<Head, Tail> {
    pub head: Head,
    pub tail: Tail,
}

impl<Head, Tail> HeadTail<Head, Tail> {
    pub fn new(head: Head, tail: Tail) -> Self {
        HeadTail { head, tail }
    }
}

pub trait WithTailTrait<Tail> {
    type TailObject;
    fn merge_tail(self, tail: Tail) -> Self::TailObject;

    fn merge_tail_option(self, tail_option: Option<Tail>) -> Result<Self::TailObject, Self>
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

    fn merge_head_option(self, tail_option: Option<Tail>) -> Result<Self::MergedObject, Self>
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
        aFn: F,
    ) -> SplitMapped<Self::HeadObject, R>;
}

pub trait SplitMappedTailTrait<Tail> {
    type TailObject;
    fn split_map_tail<M, R, F: FnOnce(Tail) -> SplitMapped<M, R>>(
        self,
        aFn: F,
    ) -> SplitMapped<Self::TailObject, R>;
}

pub trait MapHeadTrait<Head> {
    type HeadObject;
    fn map_head<F: FnOnce(Head) -> Self::HeadObject>(self, aFn: F) -> Self::HeadObject;
}

pub trait MapTailTrait<Tail> {
    type TailObject;
    fn map_tail<F: FnOnce(Tail) -> Self::TailObject>(self, aFn: F) -> Self::TailObject;
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


pub struct Nothing;

impl<Head, T: SplitMappedHeadTrait<Head>> MapHeadTrait<Head> for T {
    type HeadObject = T::HeadObject;
    fn map_head<F: FnOnce(Head) -> Self::HeadObject>(self, aFn: F) -> Self::HeadObject {
        self.split_map_head(|head| SplitMapped {
            mapped: head,
            reduced: Nothing,
        })
        .mapped
    }
}

impl<Tail, T: SplitMappedTailTrait<Tail>> MapTailTrait<Tail> for T {
    type TailObject = T::TailObject;
    fn map_tail<F: FnOnce(Tail) -> Self::TailObject>(self, aFn: F) -> Self::TailObject {
        self.split_map_tail(|tail| SplitMapped {
            mapped: tail,
            reduced: Nothing,
        })
        .mapped
    }
}

pub trait ReconcileHead {
    type Value;
    type ReconciledSuccess;
    type ReconciledError;
    fn reconcile_head(self, value: Self::Value)
        -> Result<Self::ReconciledSuccess, Self::ReconciledError>;
}

pub trait ReconcileTail {
    type Value;
    type ReconciledSuccess;
    type ReconciledError;
    fn reconcile_tail(self, value: Self::Value)
        -> Result<Self::ReconciledSuccess, Self::ReconciledError>;
}

impl<T> ReconcileHead for T
where
    T: SplitHeadTrait,
    T::Head: Reconcilable,
    T::HeadObject: MergeHeadTrait<<T::Head as Reconcilable>::Unreconciled>,
{
    type Value = <T::Head as Reconcilable>::Value;
    type ReconciledSuccess = (<T::Head as Reconcilable>::Reconciled, T::HeadObject);
    type ReconciledError =
        <T::HeadObject as MergeHeadTrait<<T::Head as Reconcilable>::Unreconciled>>::MergedObject;
    fn reconcile_head(
        self,
        value: <T::Head as Reconcilable>::Value,
    ) -> Result<Self::ReconciledSuccess, Self::ReconciledError> {
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
    type ReconciledSuccess = (<T::Tail as Reconcilable>::Reconciled, T::TailObject);
    type ReconciledError =
        <T::TailObject as MergeTailTrait<<T::Tail as Reconcilable>::Unreconciled>>::MergedObject;
    fn reconcile_tail(
        self,
        value: <T::Tail as Reconcilable>::Value,
    ) -> Result<Self::ReconciledSuccess, Self::ReconciledError> {
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
