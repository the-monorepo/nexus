use std::iter::DoubleEndedIterator;
use std::iter::Iterator;

pub struct ReconcilePayload<Component, Value> {
    old_component: Component,
    new_value: Value,
}

pub trait Recycler {
    type Value;
    type Component;
    type RecycledGeneric;
    fn recycle(
        self,
        new_value: Self::Value,
    ) -> Result<Self::RecycledGeneric, ReconcilePayload<Self::Component, Self::Value>>;
}
#[derive(PartialEq)]
pub enum End {
    Head,
    Tail,
}

pub struct Position {
    old: End,
    new: End,
}

pub struct RecycledAndNewState<RecycledGeneric, InstructionGeneric> {
    data: RecycledGeneric,
    state: InstructionGeneric,
}

struct Nothing;

pub struct HeadTail<Head, Tail> {
    head: Head,
    tail: Tail,
}

impl<Head, Tail> HeadTail<Head, Tail> {
    fn new(head: Head, tail: Tail) -> Self {
        HeadTail { head, tail }
    }
}

trait TailTrait<Tail, TailObject> {
    fn with_tail(self, tail: Tail) -> TailObject;

    fn with_tail_option(self, tail_option: Option<Tail>) -> Result<TailObject, Self>
    where
        Self: Sized,
    {
        if let Some(tail) = tail_option {
            Ok(self.with_tail(tail))
        } else {
            Err(self)
        }
    }
}

trait HeadTrait<Head, HeadObject> {
    fn with_head(self, head: Head) -> HeadObject;

    fn with_head_option(self, head_option: Option<Head>) -> Result<HeadObject, Self>
    where
        Self: Sized,
    {
        if let Some(head) = head_option {
            Ok(self.with_head(head))
        } else {
            Err(self)
        }
    }
}

impl<Head> HeadTail<Head, Nothing> {
    fn head(head: Head) -> Self {
        HeadTail {
            head,
            tail: Nothing,
        }
    }
}

impl<Tail> HeadTail<Nothing, Tail> {
    fn tail(tail: Tail) -> Self {
        HeadTail {
            head: Nothing,
            tail,
        }
    }
}

impl<CurrentHead, Head, Tail> HeadTrait<Head, HeadTail<Head, Tail>>
    for HeadTail<CurrentHead, Tail>
{
    fn with_head(self, head: Head) -> HeadTail<Head, Tail> {
        HeadTail {
            head,
            tail: self.tail,
        }
    }
}
impl<CurrentTail, Head, Tail> TailTrait<Tail, HeadTail<Head, Tail>>
    for HeadTail<Head, CurrentTail>
{
    fn with_tail(self, tail: Tail) -> HeadTail<Head, Tail> {
        HeadTail {
            head: self.head,
            tail,
        }
    }
}

struct IteratorManager<IteratorGeneric: DoubleEndedIterator, HasNext> {
    iterator: IteratorGeneric,
    has_next: HasNext,
}

struct IteratorResult<IteratorGeneric: DoubleEndedIterator> {
    value: IteratorGeneric::Item,
    manager: IteratorManager<IteratorGeneric, Allow>,
}

impl<IteratorGeneric: DoubleEndedIterator> IteratorManager<IteratorGeneric, Allow> {
    fn repopulate<F: FnOnce(&mut IteratorGeneric) -> Option<IteratorGeneric::Item>>(
        mut self,
        next: F,
    ) -> Result<IteratorResult<IteratorGeneric>, IteratorManager<IteratorGeneric, Nothing>> {
        match next(&mut self.iterator) {
            Some(value) => Ok(IteratorResult {
                manager: IteratorManager {
                    iterator: self.iterator,
                    has_next: Allow,
                },
                value,
            }),
            None => Err(IteratorManager {
                iterator: self.iterator,
                has_next: Nothing,
            }),
        }
    }

    fn repopulate_t(
        self,
    ) -> Result<IteratorResult<IteratorGeneric>, IteratorManager<IteratorGeneric, Nothing>> {
        self.repopulate(IteratorGeneric::next_back)
    }

    fn repopulate_h(
        self,
    ) -> Result<IteratorResult<IteratorGeneric>, IteratorManager<IteratorGeneric, Nothing>> {
        self.repopulate(IteratorGeneric::next)
    }
}

struct HeadTailManager<IteratorGeneric: DoubleEndedIterator, H, T, HasNext> {
    iterator: IteratorManager<IteratorGeneric, HasNext>,
    ends: HeadTail<H, T>,
}

fn map_ends_for_repopulate<
    IteratorGeneric: DoubleEndedIterator,
    H,
    T,
    H2,
    T2,
    M: FnOnce(HeadTail<H, T>, IteratorGeneric::Item) -> HeadTail<H2, T2>,
>(
    result: Result<IteratorResult<IteratorGeneric>, IteratorManager<IteratorGeneric, Nothing>>,
    ends: HeadTail<H, T>,
    map_end: M,
) -> Result<
    HeadTailManager<IteratorGeneric, H2, T2, Allow>,
    HeadTailManager<IteratorGeneric, H, T, Nothing>,
> {
    match result {
        Ok(result) => Ok(HeadTailManager {
            ends: map_end(ends, result.value),
            iterator: result.manager,
        }),
        Err(manager) => Err(HeadTailManager {
            ends,
            iterator: manager,
        }),
    }
}

impl<CVh, CVt> ComponentState<Nothing, CVh, CVt> {
    fn new_component<C>(component: C) -> ComponentState<C, Allow, Allow> {
        ComponentState {
            component,
            skip: HeadTail::new(Allow, Allow),
        }
    }
}

impl<C, CVt> ComponentState<C, Allow, CVt> {
    fn skip_vh(self) -> ComponentState<C, Nothing, CVt> {
        ComponentState {
            component: self.component,
            skip: self.skip.with_head(Nothing),
        }
    }
}

impl<C, CVt> ComponentState<C, Nothing, CVt> {
    fn allow_vh(self) -> ComponentState<C, Allow, CVt> {
        ComponentState {
            component: self.component,
            skip: self.skip.with_head(Allow),
        }
    }
}

impl<C, CVh> ComponentState<C, CVh, Allow> {
    fn skip_vt(self) -> ComponentState<C, CVh, Nothing> {
        ComponentState {
            component: self.component,
            skip: self.skip.with_tail(Nothing),
        }
    }
}

impl<C, CVh> ComponentState<C, CVh, Nothing> {
    fn allow_vt(self) -> ComponentState<C, CVh, Allow> {
        ComponentState {
            component: self.component,
            skip: self.skip.with_tail(Allow),
        }
    }
}

pub struct RemoveAndNextState<Component, State> {
    component: Component,
    state: State,
}

pub struct Data<
    ComponentsIterator: DoubleEndedIterator,
    ValuesIterator: DoubleEndedIterator,
    RemainingItems,
> {
    components: ComponentsIterator,
    values: ValuesIterator,
    remaining_items: RemainingItems,
}
pub enum ReconcileInstruction<Component, RecycledGeneric, Next> {
    RecycledItem(RecycledAndNewState<RecycledGeneric, Next>),
    RemoveItem(RemoveAndNextState<Component, Next>),
}

pub enum Finished<ComponentsIterator: DoubleEndedIterator, ValuesIterator: DoubleEndedIterator> {
    Empty(Data<ComponentsIterator, ValuesIterator, ()>),
    C(Data<ComponentsIterator, ValuesIterator, ComponentsIterator::Item>),
    CV(Data<ComponentsIterator, ValuesIterator, (ComponentsIterator::Item, ValuesIterator::Item)>),
    ChCtV(
        Data<
            ComponentsIterator,
            ValuesIterator,
            (
                HeadTail<ComponentsIterator::Item, ComponentsIterator::Item>,
                ValuesIterator::Item,
            ),
        >,
    ),
    V(Data<ComponentsIterator, ValuesIterator, ValuesIterator::Item>),
    CVhVt(
        Data<
            ComponentsIterator,
            ValuesIterator,
            (
                ComponentsIterator::Item,
                HeadTail<ValuesIterator::Item, ValuesIterator::Item>,
            ),
        >,
    ),
}

struct NextReduced<F, R> {
    finished: F,
    reduced: R,
}

struct NextResult<Item, NextGeneric> {
    item: Item,
    next: NextGeneric,
}

trait RecursiveNext<Item, Finished> {
    fn next(self) -> Result<NextResult<Item, Self>, Finished>
    where
        Self: Sized;

    fn reduce_until_finished<R, F: Fn(R, Item) -> R>(
        self,
        reducer: F,
        initial: R,
    ) -> NextReduced<Finished, R>
    where
        Self: Sized,
    {
        let mut next_result = self.next();
        let mut reduced = initial;

        loop {
            match next_result {
                Ok(cont) => {
                    reduced = reducer(reduced, cont.item);
                    next_result = cont.next.next();
                }
                Err(finished) => return NextReduced { reduced, finished },
            }
        }
    }
}

enum Void {}

struct ComponentState<C, CVh, CVt> {
    component: C,
    skip: HeadTail<CVh, CVt>,
}

impl<D, S> RecycledAndNewState<D, S> {
    fn map_state<ReturnGeneric, F: FnOnce(S) -> ReturnGeneric>(
        self,
        mapper: F,
    ) -> RecycledAndNewState<D, ReturnGeneric> {
        RecycledAndNewState {
            data: self.data,
            state: mapper(self.state),
        }
    }
}

struct Allow;
struct ReconcileState<
    ComponentsIterator: DoubleEndedIterator,
    ValuesIterator: DoubleEndedIterator,
    CH,
    CT,
    VH,
    VT,
    Chvh,
    Chvt,
    Ctvh,
    Ctvt,
    ComponentsHasNext,
    ValuesHasNext,
> {
    components: HeadTailManager<
        ComponentsIterator,
        ComponentState<CH, Chvh, Chvt>,
        ComponentState<CT, Ctvh, Ctvt>,
        ComponentsHasNext,
    >,
    values: HeadTailManager<ValuesIterator, VH, VT, ValuesHasNext>,
}

impl<
    ComponentsIterator: DoubleEndedIterator,
    ValuesIterator: DoubleEndedIterator,
    CT,
    VT,
    Chvt,
    Ctvh,
    Ctvt,
    ComponentsHasNext,
    ValuesHasNext,
    Next 
> RecursiveNext<ReconcileInstruction<ComponentsIterator::Item, <ComponentsIterator::Item as Recycler>::RecycledGeneric, Next>, Finished<ComponentsIterator, ValuesIterator>> for ReconcileState<
    ComponentsIterator,
    ValuesIterator,
    ComponentsIterator::Item,
    CT,
    ValuesIterator::Item,
    VT,
    Allow,
    Chvt,
    Ctvh,
    Ctvt,
    ComponentsHasNext,
    ValuesHasNext
> where ComponentsIterator::Item : Recycler<Component = ComponentsIterator::Item, Value = ValuesIterator::Item> {
    
}

#[cfg(test)]
mod tests {
    use std::collections::{vec_deque, VecDeque};

    use crate::{
        DoNotRecycle, End, FinalInstruction, Instruction, ReconcileIterator, ReconcilePayload,
        Recycler, RemovalInstruction,
    };

    struct TestUpdater {
        component: u16,
        value: u16,
    }

    impl<'a> Recycler for &'a i32 {
        type Component = Self;

        type Value = &'a i32;

        type RecycledGeneric = i32;

        fn recycle(
            self,
            value: Self::Value,
        ) -> Result<Self::RecycledGeneric, crate::ReconcilePayload<Self::Component, Self::Value>>
        {
            if self == value {
                return Ok(self + value);
            }

            return Err(ReconcilePayload {
                old_component: self,
                new_value: value,
            });
        }
    }

    #[test]
    fn it_works() {
        let components = [1, 2, 3, 4];
        const values: [i32; 5] = [1, 3, 2, 5, 4];

        let iter = ReconcileIterator::new(components.iter(), values.iter());

        struct MyData {
            reconciled: [i32; 5],
            tail: usize,
            head: usize,
        }

        let reconciled = [0; values.len()];
        let tail = reconciled.len() - 1;
        let head = 0;
        let mut data = MyData {
            reconciled,
            tail,
            head,
        };

        todo!();
        /*
        let output = iter.recycle_instructions(
            |instruction, data| match instruction {
                Instruction::RecycleItem(recycled) => {
                    let old_index = if recycled.position.new == End::Head {
                        let old_index = data.head;
                        data.head += 1;
                        old_index
                    } else {
                        let old_index = data.tail;
                        data.tail -= 1;
                        old_index
                    };
                    data.reconciled[old_index] = recycled.recycle_result;

                    return data;
                }
                Instruction::RemoveItem(_) => data,
            },
            &mut data,
        );

        let reconciled = match output {
            FinalInstruction::AddAllRemainingValues(instruction) => {
                let data = instruction.data;
                data.reconciled[head] = *instruction.first_value;
                data.head += 1;
                for value in instruction.other_values {
                    data.reconciled[head] = *value;
                    data.head += 1;
                }

                data.reconciled
            }
            FinalInstruction::RemoveAllRemainingComponents(instruction) => {
                instruction.data.reconciled
            }
            FinalInstruction::DoNothing(instruction) => instruction.data.reconciled,
        };

        assert_eq!(reconciled, [2, 6, 4, 5, 8])*/
    }
}
/*
export const updateComponentResultsArray = <C, V, N extends Node>(
  newComponentResults: ComponentResult<C, V, N>[],
  results: (RenderResult<C, N> | null)[],
  oldHead: number,
  newHead: number,
  oldLength: number,
  newLength: number,
  container: Node,
  before: Node | null,
): RenderResult<C, N>[] => {
  const newRenderResults: RenderResult<C, N>[] = new Array(newLength);

  // Head and tail pointers to old parts and new values
  let oldTail = oldLength - 1;
  let newTail = newLength - 1;

  while (oldHead <= oldTail && newHead <= newTail) {
    if (results[oldHead] === null) {
      // `null` means old part at head has already been used
      // below; skip
      oldHead++;
    } else if (results[oldTail] === null) {
      // `null` means old part at tail has already been used
      // below; skip
      oldTail--;
    } else if (results[oldHead]!.id === newComponentResults[newHead].blueprint.id) {
      // Old head matches new head; update in place
      newRenderResults[newHead] = renderOrReuseComponentResult(
        newComponentResults[newHead],
        results[oldHead]!,
        container,
        oldHead + 1 >= oldLength ? before : results[oldHead + 1]!.data.first,
      )!;
      oldHead++;
      newHead++;
    } else if (results[oldTail]!.id === newComponentResults[newTail].blueprint.id) {
      // Old tail matches new tail; update in place
      newRenderResults[newTail] = renderOrReuseComponentResult(
        newComponentResults[newTail],
        results[oldTail]!,
        container,
        oldTail + 1 >= oldLength ? before : results[oldTail + 1]!.data.first,
      )!;
      oldTail--;
      newTail--;
    } else if (results[oldHead]!.id === newComponentResults[newTail].blueprint.id) {
      // Old head matches new tail; update and move to new tail
      newRenderResults[newTail] = renderOrReuseComponentResult(
        newComponentResults[newTail],
        results[oldHead]!,
        container,
        newTail + 1 < newLength ? newRenderResults[newTail + 1].data.first : before,
      )!;
      newTail--;
      oldHead++;
    } else if (results[oldTail]!.id === newComponentResults[newHead].blueprint.id) {
      // Old tail matches new head; update and move to new head
      newRenderResults[newTail] = renderOrReuseComponentResult(
        newComponentResults[newHead],
        results[oldTail]!,
        container,
        results[oldHead]!.data.first,
      )!;
      newHead++;
      oldTail++;
    } else {
      const oldNextMarker =
        oldHead + 1 < oldLength ? results[oldHead + 1]!.data.first : before;
      removeUntilBefore(container, results[oldHead]!.data.first, oldNextMarker);
      oldHead++;
    }
  }

  if (oldHead <= oldTail) {
    const firstCtRemoveMarker = results[oldHead]!.data.first;
    const lastCtRemoveMarker =
      newTail + 1 < newLength ? newRenderResults[newTail + 1]!.data.first : before;
    removeUntilBefore(container, firstCtRemoveMarker, lastCtRemoveMarker);
  } else {
    // Add parts for any remaining new values
    const insertAdditionalPartsBefore =
      newTail + 1 < newLength ? newRenderResults[newTail + 1].data.first : before;
    let i = newHead;
    while (i <= newTail) {
      newRenderResults[i] = renderComponentResultNoSet(
        newComponentResults[i],
        container,
        insertAdditionalPartsBefore,
      );
      i++;
    }
  }
  return newRenderResults;
};
*/
