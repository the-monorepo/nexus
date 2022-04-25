pub struct HeadTail<Head, Tail> {
    head: Head,
    tail: Tail,
}

impl<Head, Tail> HeadTail<Head, Tail> {
    fn new(head: Head, tail: Tail) -> Self {
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
    mapped: M,
    reduced: R,
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
