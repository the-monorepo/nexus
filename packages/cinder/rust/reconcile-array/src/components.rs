use crate::*;

pub struct Components<CH, CT, HeadSkipState, TailSkipState> {
    head_tail: HeadTail<ComponentState<CH, HeadSkipState>, ComponentState<CT, TailSkipState>>,
}

impl<CH, CT, HeadSkipState, TailSkipState> MergeTrait<Head<CH>>
    for Components<Nothing, CT, HeadSkipState, TailSkipState>
{
    type MergedObject = Components<CH, CT, HeadTail<Allow, Allow>, TailSkipState>;
    fn merge(self, head: Head<CH>) -> Self::MergedObject {
        Components {
            head_tail: self.head_tail.map_head(|component| component.merge(head.0)),
        }
    }
}

impl<CH, CT, HeadSkipState, TailSkipState> MergeTrait<Tail<CT>>
    for Components<CH, Nothing, HeadSkipState, TailSkipState>
{
    type MergedObject = Components<CH, CT, HeadSkipState, HeadTail<Allow, Allow>>;
    fn merge(self, tail: Tail<CT>) -> Self::MergedObject {
        Components {
            head_tail: self.head_tail.map_tail(|component| component.merge(tail.0)),
        }
    }
}
