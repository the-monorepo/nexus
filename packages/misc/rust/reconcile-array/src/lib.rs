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

struct HeadTail<Head, Tail> {
    head: Head,
    tail: Tail,
}

impl<Head, Tail> HeadTail<Head, Tail> {
    fn new(head: Head, tail: Tail) -> Self {
        HeadTail { head, tail }
    }
}

impl<Head> HeadTail<Head, Nothing> {
    fn head(head: Head) -> Self {
        HeadTail {
            head,
            tail: Nothing,
        }
    }

    fn with_tail<Tail>(self, tail: Tail) -> HeadTail<Head, Tail> {
      HeadTail { head: self.head, tail }
    }


    fn with_tail_option<Tail>(self, tail_option: Option<Tail>) -> Result<HeadTail<Head, Tail>, Self> {
      if let Some(tail) = tail_option {
        Ok(HeadTail {
          head: self.head,
          tail,
        })
      } else {
        Err(self)
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

    fn with_head<Head>(self, head: Head) -> HeadTail<Head, Tail> {
      HeadTail { head,tail: self.tail }
    }

    fn with_head_option<Head>(self, head_option: Option<Head>) -> Result<HeadTail<Head, Tail>, Self> {
      if let Some(head) = head_option {
        Ok(HeadTail {
          head,
          tail: self.tail,
        })
      } else {
        Err(self)
      }
    }
}

struct IteratorManager<IteratorGeneric : DoubleEndedIterator, HasNext> {
  iterator: IteratorGeneric,
  has_next: HasNext,
}

struct HeadTailManager<IteratorGeneric : DoubleEndedIterator, H, T, HasNext> {
  iterator: IteratorManager<IteratorGeneric, HasNext>,
  ends: HeadTail<H, T>,
}

impl<IteratorGeneric : DoubleEndedIterator, H> IteratorManager<IteratorGeneric, Allow> {
  fn repopulate_t(self) -> Result<HeadTailManager<IteratorGeneric, H, IteratorGeneric::Item, Allow>, HeadTailManager<IteratorGeneric, H, Nothing, Nothing>> {
    match self.iterator.next_back() {
      Ok(head) => Ok()
    }
  }
}

impl<IteratorGeneric : DoubleEndedIterator, T> HeadTailManager<IteratorGeneric, Nothing, T, Slloe> {
  fn repopulate_h(self) -> Result<HeadTailManager<IteratorGeneric, IteratorGeneric::Item, T, Allow>, HeadTailManager<IteratorGeneric, H, Nothing, Nothing>> {
    self.ends.with_head_option(self.iterator.next_back())
  }
}

struct ComponentState<C, CVh, CVt> {
  component: C,
  skip: HeadTail<CVh, CVt>,
}

impl<CH, CT> HeadTail<CH, CT>
where
    CH: Recycler<Component = CH>,
{
    fn recycle_head(
        self,
        value: CH::Value,
    ) -> Result<RecycledAndNewState<CH::RecycledGeneric, HeadTail<Nothing, CT>>, (Self, CH::Value)>
    {
        self.head
            .recycle(value)
            .map(|data| RecycledAndNewState {
                data,
                state: HeadTail::tail(self.tail),
            })
            .map_err(|payload| {
                (
                    HeadTail::new(payload.old_component, self.tail),
                    payload.new_value,
                )
            })
    }
}

impl<CH, CT> HeadTail<CH, CT>
where
    CT: Recycler<Component = CT>,
{
    fn recycle_tail(
        self,
        value: CT::Value,
    ) -> Result<RecycledAndNewState<CT::RecycledGeneric, HeadTail<CH, Nothing>>, (Self, CT::Value)>
    {
        self.tail
            .recycle(value)
            .map(|data| RecycledAndNewState {
                data,
                state: HeadTail::head(self.head),
            })
            .map_err(|payload| {
                (
                    HeadTail::new(self.head, payload.old_component),
                    payload.new_value,
                )
            })
    }
}

impl<CH, CT> HeadTail<CH, CT> {
    fn with_values<VH, VT>(self, head: HeadTail<VH, VT>) -> ReconcileData<CH, CT, VH, VT> {
        ReconcileData {
            components: self,
            values: head,
        }
    }
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

struct ReconcileData<CH, CT, VH, VT> {
    components: HeadTail<CH, CT>,
    values: HeadTail<VH, VT>,
}

impl<CH, CT, VH, VT> ReconcileData<CH, CT, VH, VT>
where
    CH: Recycler<Component = CH, Value = VH>,
{
    fn recycle_chvh(
        self,
    ) -> Result<
        RecycledAndNewState<CH::RecycledGeneric, ReconcileData<Nothing, CT, Nothing, VT>>,
        ReconcileData<CH::Component, CT, CH::Value, VT>,
    > {
        self.components
            .recycle_head(self.values.head)
            .map(|recycled| {
                recycled.map_state(move |components| ReconcileData {
                    components,
                    values: HeadTail::tail(self.values.tail),
                })
            })
            .map_err(|(components, value_head)| {
                components.with_values(HeadTail::new(value_head, self.values.tail))
            })
    }
}

impl<CH, CT, VH, VT> ReconcileData<CH, CT, VH, VT>
where
    CH: Recycler<Component = CH, Value = VT>,
{
    fn recycle_chvt(
        self,
    ) -> Result<
        RecycledAndNewState<CH::RecycledGeneric, ReconcileData<Nothing, CT, VH, Nothing>>,
        ReconcileData<CH::Component, CT, VH, CH::Value>,
    > {
        self.components
            .recycle_head(self.values.tail)
            .map(|recycled| {
                recycled.map_state(move |components| ReconcileData {
                    components,
                    values: HeadTail::head(self.values.head),
                })
            })
            .map_err(|(components, value_tail)| {
                components.with_values(HeadTail::new(self.values.head, value_tail))
            })
    }
}

impl<CH, CT, VH, VT> ReconcileData<CH, CT, VH, VT>
where
    CT: Recycler<Component = CT, Value = VH>,
{
    fn recycle_ctvh(
        self,
    ) -> Result<
        RecycledAndNewState<CT::RecycledGeneric, ReconcileData<CH, Nothing, Nothing, VT>>,
        ReconcileData<CH, CT::Component, CT::Value, VT>,
    > {
        self.components
            .recycle_tail(self.values.head)
            .map(|recycled| {
                recycled.map_state(move |components| ReconcileData {
                    components,
                    values: HeadTail::tail(self.values.tail),
                })
            })
            .map_err(|(components, value_head)| {
                components.with_values(HeadTail::new(value_head, self.values.tail))
            })
    }
}

impl<CH, CT, VH, VT> ReconcileData<CH, CT, VH, VT>
where
    CT: Recycler<Component = CT, Value = VT>,
{
    fn recycle_ctvt(
        self,
    ) -> Result<
        RecycledAndNewState<CT::RecycledGeneric, ReconcileData<CH, Nothing, VH, Nothing>>,
        ReconcileData<CH, CT::Component, VH, CT::Value>,
    > {
        self.components
            .recycle_tail(self.values.tail)
            .map(|recycled| {
                recycled.map_state(move |components| ReconcileData {
                    components,
                    values: HeadTail::head(self.values.head),
                })
            })
            .map_err(|(components, value_tail)| {
                components.with_values(HeadTail::new(self.values.head, value_tail))
            })
    }
}

struct ComponentValue<C, V> {
    component: C,
    value: V,
}

impl<C, V> ComponentValue<C, V> {
    fn new(component: C, value: V) -> ComponentValue<C, V> {
        ComponentValue { component, value }
    }
}


struct Skip;
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
> {
  components: HeadTailManager<ComponentsIterator, ComponentState<CH, Chvh, Chvt>, ComponentState<CT, Ctvh, Ctvt>>,
  values: HeadTailManager<ValuesIterator, VH, VT>,
}

impl<
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
    > ReconcileState<ComponentsIterator, ValuesIterator, CH, CT, VH, VT, Chvh, Chvt, Ctvh, Ctvt>
{
    fn new(
        iterators: Iterators<ComponentsIterator, ValuesIterator>,
        ends: ReconcileData<CH, CT, VH, VT>,
        skip: SkipState<Chvh, Chvt, Ctvh, Ctvt>,
    ) -> ReconcileState<ComponentsIterator, ValuesIterator, CH, CT, VH, VT, Chvh, Chvt, Ctvh, Ctvt>
    {
        ReconcileState {
            iterators,
            ends,
            skip,
        }
    }
}

impl<
        NextGeneric,
        FinishedGeneric,
        RS1: Next<NextGeneric = NextGeneric, Finished = FinishedGeneric>,
        RS2: Next<NextGeneric = NextGeneric, Finished = FinishedGeneric>,
    > Next
    for Result<RS1, RS2>
{
  type NextGeneric = NextGeneric;
  type Finished = FinishedGeneric;
    fn next(
        self,
    ) -> Result<NextGeneric, FinishedGeneric>
    {
        self.map_or_else(|r| r.next(), |r| r.next())
    }
}

trait IncompleteReconcileNext {
  type RecycledGeneric;
  fn next_recycler(self) -> Result<
    RecycledAndNewState<Self::RecycledGeneric, RecyclerNext>,
    RemoveAndNextState<Self::RecycledGeneric, >,
  >;
};

impl<
        ComponentsIterator: DoubleEndedIterator,
        ValuesIterator: DoubleEndedIterator,
        CH,
        CT,
        VH,
        VT,
        Chvt,
        Ctvh,
        Ctvt,
    >
    Next<
        ComponentsIterator,
        ValuesIterator,
        CH::RecycledGeneric,
        Result<
            ReconcileState<
                ComponentsIterator,
                ValuesIterator,
                Nothing,
                CT,
                Nothing,
                VT,
                Allow,
                Allow,
                Allow,
                Ctvt,
            >,
            ReconcileState<
                ComponentsIterator,
                ValuesIterator,
                CH,
                CT,
                VH,
                VT,
                Skip,
                Chvt,
                Ctvh,
                Ctvt,
            >,
        >,
    >
    for ReconcileState<ComponentsIterator, ValuesIterator, CH, CT, VH, VT, Allow, Chvt, Ctvh, Ctvt>
where
    CH: Recycler<Component = CH, Value = VH>,
{
    type ComponentsIterator: DoubleEndedIterator;
    fn next(
        self,
    ) -> ReconcileInstruction<
        ComponentsIterator,
        ValuesIterator,
        CH::RecycledGeneric,
        Result<
            ReconcileState<
                ComponentsIterator,
                ValuesIterator,
                Nothing,
                CT,
                Nothing,
                VT,
                Allow,
                Allow,
                Allow,
                Ctvt,
            >,
            ReconcileState<
                ComponentsIterator,
                ValuesIterator,
                CH::Component,
                CT,
                CH::Value,
                VT,
                Skip,
                Chvt,
                Ctvh,
                Ctvt,
            >,
        >,
    > {
        match self.ends.recycle_chvh() {
            Ok(recycled) => Ok(ReconcileInstruction::RecycledItem(recycled.map_state(
                |ends| ReconcileState::new(self.iterators, ends, self.skip.new_ch().new_vh()),
            ))),
            Err(ends) => todo!()/*Err(ReconcileState::new(self.iterators, ends, self.skip.skip_chvh()).next())*/
        }
    }
}

struct RemoveAndNextState<Component, State> {
    component: Component,
    state: State,
}

pub enum ReconcileInstruction<
    ComponentsIterator: DoubleEndedIterator,
    ValuesIterator: DoubleEndedIterator,
    RecycledGeneric,
    Next,
> {
    FinishWithEmpty(Data<ComponentsIterator, ValuesIterator, Nothing, Nothing, Nothing, Nothing>),
    FinishWithC(
        Data<
            ComponentsIterator,
            ValuesIterator,
            ComponentsIterator::Item,
            Nothing,
            Nothing,
            Nothing,
        >,
    ),
    FinishWithCV(
        Data<
            ComponentsIterator,
            ValuesIterator,
            ComponentsIterator::Item,
            Nothing,
            ValuesIterator::Item,
            Nothing,
        >,
    ),
    FinishWithChCtV(
        Data<
            ComponentsIterator,
            ValuesIterator,
            ComponentsIterator::Item,
            ComponentsIterator::Item,
            ValuesIterator::Item,
            Nothing,
        >,
    ),
    FinishWithV(
        Data<ComponentsIterator, ValuesIterator, Nothing, Nothing, ValuesIterator::Item, Nothing>,
    ),
    FinishWithCVhVt(
        Data<
            ComponentsIterator,
            ValuesIterator,
            ComponentsIterator::Item,
            Nothing,
            ValuesIterator::Item,
            ValuesIterator::Item,
        >,
    ),
    RecycledItem(RecycledAndNewState<RecycledGeneric, Next>),
    RemoveItem(RemoveAndNextState<ComponentsIterator::Item, Next>),
}

struct NextReduced<F, R> {
  finished: F,
  reduced: R,
}

struct NextResult<Item, NextGeneric> {
  item: Item,
  next: NextGeneric,
}

trait RecursiveNext {
  type Item;
  type Finished;
  fn next(
      self,
  ) -> Result<NextResult<Self::Item, Self>, Self::Finished>;

  fn reduce_until_finished<R, F : Fn(R, Self::Item) -> R>(
    self,
    reducer : F,
    initial: R,
  ) -> NextReduced<Self::Finished, R> {
    let mut next_result = self.next();
    let mut reduced = initial;

    while let Ok(cont) = next_result {
      reduced = reducer(reduced, cont.item);
      next_result = cont.next.next();
    }

    let Err(finished) = next_result;

    return NextReduced {
      reduced,
      finished
    }
  }
}


trait NextReconiliationInstruction<
  ComponentsIterator,
  ValuesIterator,
> where
ComponentsIterator : DoubleEndedIterator,
ValuesIterator : DoubleEndedIterator,
ComponentsIterator::Item : Recycler<Component = ComponentsIterator::Item, Value = ValuesIterator::Item> {
  type NextGeneric;
  fn next(
      self,
  ) -> ReconcileInstruction<ComponentsIterator, ValuesIterator, <ComponentsIterator::Item as Recycler>::RecycledGeneric, Self::NextGeneric>;
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
