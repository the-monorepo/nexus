use crate::*;

pub struct Components<CH, CT, HeadSkipState, TailSkipState> {
    head_tail: HeadTail<ComponentState<CH, HeadSkipState>, ComponentState<CT, TailSkipState>>,
}

impl<CH, CT, HeadSkipState, TailSkipState> MergeHeadTrait<CH>
    for Components<Nothing, CT, HeadSkipState, TailSkipState>
{
    type MergedObject = Components<CH, CT, HeadTail<Allow, Allow>, TailSkipState>;
    fn merge_head(self, head: CH) -> Self::MergedObject {
        Components {
            head_tail: HeadTail::new(self.head_tail.head.merge(head), self.head_tail.tail),
        }
    }
}

impl<CH, CT, HeadSkipState, TailSkipState> MergeTailTrait<CT>
    for Components<CH, Nothing, HeadSkipState, TailSkipState>
{
    type MergedObject = Components<CH, CT, HeadSkipState, HeadTail<Allow, Allow>>;
    fn merge_tail(self, tail: CT) -> Self::MergedObject {
        Components {
            head_tail: HeadTail::new(self.head_tail.head, self.head_tail.tail.merge(tail)),
        }
    }
}
