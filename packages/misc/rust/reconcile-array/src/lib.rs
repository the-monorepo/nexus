use std::iter::DoubleEndedIterator;
use std::iter::Iterator;
use std::ops::Add;

pub struct ReconcileIterator<ComponentsIterator, ValuesIterator>
where
    ComponentsIterator: DoubleEndedIterator,
    ValuesIterator: DoubleEndedIterator,
    ComponentsIterator::Item:
        Recycler<Component = ComponentsIterator::Item, Value = ValuesIterator::Item>,
{
    old_iterator: ComponentsIterator,
    new_iterator: ValuesIterator,
}

impl<ComponentsIterator, ValuesIterator> ReconcileIterator<ComponentsIterator, ValuesIterator>
where
    ComponentsIterator: DoubleEndedIterator,
    ValuesIterator: DoubleEndedIterator,
    ComponentsIterator::Item:
        Recycler<Component = ComponentsIterator::Item, Value = ValuesIterator::Item>,
{
    fn new(
        mut components: ComponentsIterator,
        mut values: ValuesIterator,
    ) -> ReconcileIterator<ComponentsIterator, ValuesIterator> {
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
    type Value;
    type Component;
    type RecycledGeneric;
    fn recycle(
        self,
        new_value: Self::Value,
    ) -> Result<Self::RecycledGeneric, ReconcilePayload<Self::Component, Self::Value>>;
}

fn recycle_instruction<Component, Value, RecycledGeneric, RecyclerGeneric>(
    recycler: RecyclerGeneric,
    new_value: Value,
    old_end: End,
    new_end: End,
) -> Result<Instruction<Component, RecycledGeneric>, ReconcilePayload<Component, Value>>
where
    RecyclerGeneric:
        Recycler<Component = Component, Value = Value, RecycledGeneric = RecycledGeneric>,
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

pub struct AddAllRemainingValuesInstruction<ValuesIterator>
where
    ValuesIterator: DoubleEndedIterator,
{
    first_value: ValuesIterator::Item,
    other_values: ValuesIterator,
}

pub struct RemoveRemainingComponentsInstruction<ComponentsIterator>
where
    ComponentsIterator: DoubleEndedIterator,
{
    first_component: ComponentsIterator::Item,
    other_components: ComponentsIterator,
}

pub enum FinalInstruction<ComponentsIterator, ValuesIterator>
where
    ValuesIterator: DoubleEndedIterator,
    ComponentsIterator: DoubleEndedIterator,
{
    RemoveAllRemainingComponents(RemoveRemainingComponentsInstruction<ComponentsIterator>),
    AddAllRemainingValues(AddAllRemainingValuesInstruction<ValuesIterator>),
    DoNothing(),
}

pub enum Instruction<Component, RecycledGeneric> {
    RecycleItem(RecycleInstruction<RecycledGeneric>),
    RemoveItem(RemovalInstruction<Component>),
}

struct Iterators<ComponentsIterator, ValuesIterator> {
    components: ComponentsIterator,
    values: ValuesIterator,
}

struct RecycledAndNextState<RecycledGeneric, InstructionGeneric> {
    data: RecycledGeneric,
    state: InstructionGeneric,
}

struct RemoveComponentAndNextState<ComponentGeneric, StateGeneric> {
    component: ComponentGeneric,
    state: StateGeneric,
}

struct EmptyState<ComponentsIterator, ValuesIterator>
where
    ValuesIterator: DoubleEndedIterator,
    ComponentsIterator: DoubleEndedIterator,
{
    iterators: Iterators<ComponentsIterator, ValuesIterator>,
}

struct CtVhState<ComponentsIterator: DoubleEndedIterator, ValuesIterator: DoubleEndedIterator> {
    component_tail: ComponentsIterator::Item,
    value_head: ValuesIterator::Item,
    iterators: Iterators<ComponentsIterator, ValuesIterator>,
}

struct ChVtState<ComponentsIterator: DoubleEndedIterator, ValuesIterator: DoubleEndedIterator> {
    component_head: ComponentsIterator::Item,
    value_tail: ValuesIterator::Item,
    iterators: Iterators<ComponentsIterator, ValuesIterator>,
}

struct CtVhVtState<ComponentsIterator: DoubleEndedIterator, ValuesIterator: DoubleEndedIterator> {
    component_tail: ComponentsIterator::Item,
    value_head: ValuesIterator::Item,
    value_tail: ValuesIterator::Item,
    iterators: Iterators<ComponentsIterator, ValuesIterator>,
}

enum EmptyStateNextState<ComponentsIterator, ValuesIterator, RecyclerGeneric>
where
    ValuesIterator: DoubleEndedIterator,
    ComponentsIterator: DoubleEndedIterator,
{
    Finish(FinalInstruction<ComponentsIterator, ValuesIterator>),
    Recycled(RecycledAndNextState<RecyclerGeneric, EmptyState<ComponentsIterator, ValuesIterator>>),
    NoMatch(ChVhState<ComponentsIterator, ValuesIterator>),
}

enum ChVhNextState<
    ComponentsIterator: DoubleEndedIterator,
    ValuesIterator: DoubleEndedIterator,
    RecycledGeneric,
> {
    Finish(FinalInstruction<ComponentsIterator, ValuesIterator>),
    RecycledVtCt(
        RecycledAndNextState<RecycledGeneric, ChVhState<ComponentsIterator, ValuesIterator>>,
    ),
    RecycledChVt(
        RecycledAndNextState<RecycledGeneric, CtVhState<ComponentsIterator, ValuesIterator>>,
    ),
    RecycledCtVh(
        RecycledAndNextState<RecycledGeneric, ChVtState<ComponentsIterator, ValuesIterator>>,
    ),
    NoMatch(
        RemoveComponentAndNextState<
            ComponentsIterator::Item,
            CtVhVtState<ComponentsIterator, ValuesIterator>,
        >,
    ),
}

struct ChVhState<ComponentsIterator: DoubleEndedIterator, ValuesIterator: DoubleEndedIterator> {
    component_head: ComponentsIterator::Item,
    value_head: ValuesIterator::Item,
    iterators: Iterators<ComponentsIterator, ValuesIterator>,
}

impl<ComponentsIterator, ValuesIterator, RecycledGeneric>
    EmptyState<ComponentsIterator, ValuesIterator>
where
    ValuesIterator: DoubleEndedIterator,
    ComponentsIterator: DoubleEndedIterator,
    ComponentsIterator::Item: Recycler<
        Component = ComponentsIterator::Item,
        Value = ValuesIterator::Item,
        RecycledGeneric = RecycledGeneric,
    >,
{
    fn check(mut self) -> EmptyStateNextState<ComponentsIterator, ValuesIterator, RecycledGeneric> {
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

impl<ComponentsIterator, ValuesIterator, RecycledGeneric>
    ChVhState<ComponentsIterator, ValuesIterator>
where
    ValuesIterator: DoubleEndedIterator,
    ComponentsIterator: DoubleEndedIterator,
    ComponentsIterator::Item: Recycler<
        Component = ComponentsIterator::Item,
        Value = ValuesIterator::Item,
        RecycledGeneric = RecycledGeneric,
    >,
{
    fn check(mut self) -> ChVhNextState<ComponentsIterator, ValuesIterator, RecycledGeneric> {
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
