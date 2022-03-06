use std::iter::DoubleEndedIterator;
use std::iter::Iterator;
use std::ops::Add;

pub struct ReconcileIterator<OldComponentsIterator, NewValuesIterator>
where
    OldComponentsIterator: DoubleEndedIterator,
    NewValuesIterator: DoubleEndedIterator,
    OldComponentsIterator::Item:
        Recycler<OldComponent = OldComponentsIterator::Item, NewValue = NewValuesIterator::Item>,
{
    old_iterator: OldComponentsIterator,
    new_iterator: NewValuesIterator,
}

impl<OldComponentsIterator, NewValuesIterator>
    ReconcileIterator<OldComponentsIterator, NewValuesIterator>
where
    OldComponentsIterator: DoubleEndedIterator,
    NewValuesIterator: DoubleEndedIterator,
    OldComponentsIterator::Item:
        Recycler<OldComponent = OldComponentsIterator::Item, NewValue = NewValuesIterator::Item>,
{
    fn new(
        mut components: OldComponentsIterator,
        mut values: NewValuesIterator,
    ) -> ReconcileIterator<OldComponentsIterator, NewValuesIterator> {
        ReconcileIterator {
            old_iterator: components,
            new_iterator: values,
        }
    }
}

pub struct ReconcilePayload<Component, Value> {
    old_component: Component,
    new_value: Value,
}

pub struct DoNotRecycle<Component, Value> {
    reconcile_payload: ReconcilePayload<Component, Value>,
}

pub trait Recycler {
    type NewValue;
    type OldComponent;
    type RecycledGeneric;
    fn recycle(
        self,
        new_value: Self::NewValue,
    ) -> Result<Self::RecycledGeneric, ReconcilePayload<Self::OldComponent, Self::NewValue>>;
}

fn recycle_instruction<OldComponent, NewValue, RecycledGeneric, RecyclerGeneric>(
    recycler: RecyclerGeneric,
    new_value: NewValue,
    old_end: End,
    new_end: End,
) -> Result<Instruction<OldComponent, RecycledGeneric>, ReconcilePayload<OldComponent, NewValue>>
where
    RecyclerGeneric: Recycler<
        OldComponent = OldComponent,
        NewValue = NewValue,
        RecycledGeneric = RecycledGeneric,
    >,
{
    recycler.recycle(new_value).and_then(|recycle_result| {
        Ok(Instruction::RecycleItem(RecycleInstruction {
            position: Position {
                old: old_end,
                new: new_end,
            },
            recycle_result,
        }))
    })
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

pub struct RecycleInstruction<RecycledGeneric> {
    position: Position,
    recycle_result: RecycledGeneric,
}

pub struct RemovalInstruction<T> {
    end: End,
    component: T,
}

pub struct AddAllRemainingValuesInstruction<NewValuesIterator>
where
    NewValuesIterator: DoubleEndedIterator,
{
    first_value: NewValuesIterator::Item,
    other_values: NewValuesIterator,
}

pub struct RemoveRemainingComponentsInstruction<OldComponentsIterator>
where
    OldComponentsIterator: DoubleEndedIterator,
{
    first_component: OldComponentsIterator::Item,
    other_components: OldComponentsIterator,
}

pub enum FinalInstruction<OldComponentsIterator, NewValuesIterator>
where
    NewValuesIterator: DoubleEndedIterator,
    OldComponentsIterator: DoubleEndedIterator,
{
    RemoveAllRemainingComponents(RemoveRemainingComponentsInstruction<OldComponentsIterator>),
    AddAllRemainingValues(AddAllRemainingValuesInstruction<NewValuesIterator>),
    DoNothing(),
}

pub enum Instruction<Component, RecycledGeneric> {
    RecycleItem(RecycleInstruction<RecycledGeneric>),
    RemoveItem(RemovalInstruction<Component>),
}

struct Iterators<OldComponentsIterator, NewValuesIterator> {
    components: OldComponentsIterator,
    values: NewValuesIterator,
}

struct RecycledAndNextState<RecycledGeneric, InstructionGeneric> {
    data: RecycledGeneric,
    state: InstructionGeneric,
}

struct RemoveComponentAndNextState<ComponentGeneric, StateGeneric> {
    component: ComponentGeneric,
    state: StateGeneric,
}

struct EmptyState<OldComponentsIterator, NewValuesIterator>
where
    NewValuesIterator: DoubleEndedIterator,
    OldComponentsIterator: DoubleEndedIterator,
{
    iterators: Iterators<OldComponentsIterator, NewValuesIterator>,
}

struct CtVhState<OldComponentsIterator: DoubleEndedIterator, NewValuesIterator: DoubleEndedIterator>
{
    component_tail: OldComponentsIterator::Item,
    value_head: NewValuesIterator::Item,
    iterators: Iterators<OldComponentsIterator, NewValuesIterator>,
}

struct ChVtState<OldComponentsIterator: DoubleEndedIterator, NewValuesIterator: DoubleEndedIterator>
{
    component_head: OldComponentsIterator::Item,
    value_tail: NewValuesIterator::Item,
    iterators: Iterators<OldComponentsIterator, NewValuesIterator>,
}

struct CtVhVtState<
    OldComponentsIterator: DoubleEndedIterator,
    NewValuesIterator: DoubleEndedIterator,
> {
    component_tail: OldComponentsIterator::Item,
    value_head: NewValuesIterator::Item,
    value_tail: NewValuesIterator::Item,
    iterators: Iterators<OldComponentsIterator, NewValuesIterator>,
}

enum EmptyStateNextState<OldComponentsIterator, NewValuesIterator, RecyclerGeneric>
where
    NewValuesIterator: DoubleEndedIterator,
    OldComponentsIterator: DoubleEndedIterator,
{
    Finish(FinalInstruction<OldComponentsIterator, NewValuesIterator>),
    Recycled(
        RecycledAndNextState<RecyclerGeneric, EmptyState<OldComponentsIterator, NewValuesIterator>>,
    ),
    NoMatch(ChVhState<OldComponentsIterator, NewValuesIterator>),
}

enum ChVhNextState<
    OldComponentsIterator: DoubleEndedIterator,
    NewValuesIterator: DoubleEndedIterator,
    RecycledGeneric,
> {
    Finish(FinalInstruction<OldComponentsIterator, NewValuesIterator>),
    RecycledVtCt(
        RecycledAndNextState<RecycledGeneric, ChVhState<OldComponentsIterator, NewValuesIterator>>,
    ),
    RecycledChVt(
        RecycledAndNextState<RecycledGeneric, CtVhState<OldComponentsIterator, NewValuesIterator>>,
    ),
    RecycledCtVh(
        RecycledAndNextState<RecycledGeneric, ChVtState<OldComponentsIterator, NewValuesIterator>>,
    ),
    NoMatch(
        RemoveComponentAndNextState<
            OldComponentsIterator::Item,
            CtVhVtState<OldComponentsIterator, NewValuesIterator>,
        >,
    ),
}

struct ChVhState<OldComponentsIterator: DoubleEndedIterator, NewValuesIterator: DoubleEndedIterator>
{
    component_head: OldComponentsIterator::Item,
    value_head: NewValuesIterator::Item,
    iterators: Iterators<OldComponentsIterator, NewValuesIterator>,
}

impl<OldComponentsIterator, NewValuesIterator, RecycledGeneric>
    EmptyState<OldComponentsIterator, NewValuesIterator>
where
    NewValuesIterator: DoubleEndedIterator,
    OldComponentsIterator: DoubleEndedIterator,
    OldComponentsIterator::Item: Recycler<
        OldComponent = OldComponentsIterator::Item,
        NewValue = NewValuesIterator::Item,
        RecycledGeneric = RecycledGeneric,
    >,
{
    fn check(
        mut self,
    ) -> EmptyStateNextState<OldComponentsIterator, NewValuesIterator, RecycledGeneric> {
        let component_head_option = self.iterators.components.next();
        let value_head_option = self.iterators.values.next();
        match (component_head_option, value_head_option) {
            (Some(component_head), Some(value_head)) => match component_head.recycle(value_head) {
                Ok(data) => {
                    EmptyStateNextState::Recycled(RecycledAndNextState { data, state: self })
                }
                Err(ReconcilePayload {
                    old_component: component_head,
                    new_value: value_head,
                }) => EmptyStateNextState::NoMatch(ChVhState {
                    component_head,
                    value_head,
                    iterators: self.iterators,
                }),
            },
            (Some(component_head), None) => {
                EmptyStateNextState::Finish(FinalInstruction::RemoveAllRemainingComponents(
                    RemoveRemainingComponentsInstruction {
                        first_component: component_head,
                        other_components: self.iterators.components,
                    },
                ))
            }
            (None, Some(value_head)) => EmptyStateNextState::Finish(
                FinalInstruction::AddAllRemainingValues(AddAllRemainingValuesInstruction {
                    first_value: value_head,
                    other_values: self.iterators.values,
                }),
            ),
            (None, None) => EmptyStateNextState::Finish(FinalInstruction::DoNothing()),
        }
    }
}

impl<OldComponentsIterator, NewValuesIterator, RecycledGeneric>
    ChVhState<OldComponentsIterator, NewValuesIterator>
where
    NewValuesIterator: DoubleEndedIterator,
    OldComponentsIterator: DoubleEndedIterator,
    OldComponentsIterator::Item: Recycler<
        OldComponent = OldComponentsIterator::Item,
        NewValue = NewValuesIterator::Item,
        RecycledGeneric = RecycledGeneric,
    >,
{
    fn check(mut self) -> ChVhNextState<OldComponentsIterator, NewValuesIterator, RecycledGeneric> {
        let component_tail_option = self.iterators.components.next();
        let value_tail_option = self.iterators.values.next();
        match (component_tail_option, value_tail_option) {
            (None, None) => todo!(),
            (None, Some(_)) => todo!(),
            (Some(_), None) => todo!(),
            (Some(component_tail), Some(value_tail)) => match component_tail.recycle(value_tail) {
                Ok(data) => ChVhNextState::RecycledVtCt(RecycledAndNextState { data, state: self }),
                Err(ReconcilePayload {
                    old_component: component_tail,
                    new_value: value_tail,
                }) => match self.component_head.recycle(value_tail) {
                    Ok(data) => ChVhNextState::RecycledChVt(RecycledAndNextState {
                        data,
                        state: CtVhState {
                            iterators: self.iterators,
                            component_tail,
                            value_head: self.value_head,
                        },
                    }),
                    Err(ReconcilePayload {
                        old_component: component_head,
                        new_value: value_tail,
                    }) => match component_tail.recycle(self.value_head) {
                        Ok(data) => ChVhNextState::RecycledCtVh(RecycledAndNextState {
                            data,
                            state: ChVtState {
                                iterators: self.iterators,
                                component_head,
                                value_tail: value_tail,
                            },
                        }),
                        Err(ReconcilePayload {
                            old_component: component_tail,
                            new_value: value_head,
                        }) => ChVhNextState::NoMatch(RemoveComponentAndNextState {
                            component: component_head,
                            state: CtVhVtState {
                                component_tail,
                                value_head,
                                value_tail,
                                iterators: self.iterators,
                            },
                        }),
                    },
                },
            },
        }
    }
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
        type OldComponent = Self;

        type NewValue = &'a i32;

        type RecycledGeneric = i32;

        fn recycle(
            self,
            value: Self::NewValue,
        ) -> Result<
            Self::RecycledGeneric,
            crate::ReconcilePayload<Self::OldComponent, Self::NewValue>,
        > {
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
