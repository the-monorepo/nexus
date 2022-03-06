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

pub struct AddAllRemainingValuesInstruction<NewValuesIterator, DataGeneric>
where
    NewValuesIterator: DoubleEndedIterator,
{
    data: DataGeneric,
    first_value: NewValuesIterator::Item,
    other_values: NewValuesIterator,
}

pub struct RemoveRemainingComponentsInstruction<OldComponentsIterator, DataGeneric>
where
    OldComponentsIterator: DoubleEndedIterator,
{
    data: DataGeneric,
    first_component: OldComponentsIterator::Item,
    other_components: OldComponentsIterator,
}

pub struct DoNothingInstruction<DataGeneric> {
  data: DataGeneric
}

pub enum FinalInstruction<OldComponentsIterator, NewValuesIterator, DataGeneric>
where
    NewValuesIterator: DoubleEndedIterator,
    OldComponentsIterator: DoubleEndedIterator,
{
    RemoveAllRemainingComponents(RemoveRemainingComponentsInstruction<OldComponentsIterator, DataGeneric>),
    AddAllRemainingValues(AddAllRemainingValuesInstruction<NewValuesIterator, DataGeneric>),
    DoNothing(DoNothingInstruction<DataGeneric>),
}

pub enum Instruction<Component, RecycledGeneric> {
    RecycleItem(RecycleInstruction<RecycledGeneric>),
    RemoveItem(RemovalInstruction<Component>),
}

impl<OldComponentsIterator, NewValuesIterator, RecyclerGeneric>
    ReconcileIterator<OldComponentsIterator, NewValuesIterator>
where
    OldComponentsIterator: DoubleEndedIterator,
    NewValuesIterator: DoubleEndedIterator,
    OldComponentsIterator::Item: Recycler<
        OldComponent = OldComponentsIterator::Item,
        NewValue = NewValuesIterator::Item,
        RecycledGeneric = RecyclerGeneric,
    >,
{
    fn recycle_instructions<
        D,
        ForEachGeneric: Fn(Instruction<OldComponentsIterator::Item, RecyclerGeneric>, D) -> D,
    >(
        mut self,
        aFn: ForEachGeneric,
        initial: D,
    ) -> FinalInstruction<OldComponentsIterator, NewValuesIterator, D> {
        let mut new_head: Option<NewValuesIterator::Item> = self.new_iterator.next();
        let mut new_tail: Option<NewValuesIterator::Item> = self.new_iterator.next_back();
        let mut old_head: Option<OldComponentsIterator::Item> = self.old_iterator.next();
        let mut old_tail: Option<OldComponentsIterator::Item> = self.old_iterator.next_back();

        println!("{:?} {:?}", old_head.is_some(), new_head.is_some());
        let mut data = initial;

        loop {
            let old_head_item_option = old_head.take().or_else(|| self.old_iterator.next());
            let new_head_item_option = new_head.take().or_else(|| self.new_iterator.next());
            match (old_head_item_option, new_head_item_option) {
                (Some(old_head_item), Some(new_head_item)) => {
                    match recycle_instruction(old_head_item, new_head_item, End::Head, End::Head) {
                        Ok(instruction) => data = aFn(instruction, data),
                        Err(ReconcilePayload {
                            old_component: old_head_item,
                            new_value: new_head_item,
                        }) => {
                            let new_tail_item_option =
                                new_tail.take().or_else(|| self.new_iterator.next_back());
                            println!("new tail {:?}", new_tail_item_option.is_some());
                            if let Some(new_tail_item) = new_tail_item_option {
                                let old_tail_item_option =
                                    old_tail.take().or_else(|| self.old_iterator.next_back());
                                println!("old tail {:?}", old_tail_item_option.is_some());
                                if let Some(old_tail_item) = old_tail_item_option {
                                    match recycle_instruction(
                                        old_tail_item,
                                        new_tail_item,
                                        End::Tail,
                                        End::Tail,
                                    ) {
                                        Ok(instruction) => {
                                            new_head = Some(new_head_item);
                                            old_head = Some(old_head_item);
                                            data = aFn(instruction, data);
                                        }
                                        Err(ReconcilePayload {
                                            old_component: old_tail_item,
                                            new_value: new_tail_item,
                                        }) => match recycle_instruction(
                                            old_tail_item,
                                            new_head_item,
                                            End::Tail,
                                            End::Head,
                                        ) {
                                            Ok(instruction) => {
                                                old_head = Some(old_head_item);
                                                new_tail = Some(new_tail_item);
                                                data = aFn(instruction, data);
                                            }
                                            Err(ReconcilePayload {
                                                old_component: old_tail_item,
                                                new_value: new_head_item,
                                            }) => {
                                                match recycle_instruction(
                                                    old_head_item,
                                                    new_tail_item,
                                                    End::Head,
                                                    End::Tail,
                                                ) {
                                                    Ok(instruction) => {
                                                        old_tail = Some(old_tail_item);
                                                        new_head = Some(new_head_item);

                                                        data = aFn(instruction, data);
                                                    }
                                                    Err(ReconcilePayload {
                                                        old_component: old_head_item,
                                                        new_value: new_tail_item,
                                                    }) => {
                                                        old_tail = Some(old_tail_item);
                                                        new_head = Some(new_head_item);
                                                        new_tail = Some(new_tail_item);

                                                        data = aFn(
                                                            Instruction::RemoveItem(
                                                                RemovalInstruction {
                                                                    component: old_head_item,
                                                                    end: End::Head,
                                                                },
                                                            ),
                                                            data,
                                                        );
                                                    }
                                                }
                                            }
                                        },
                                    }
                                } else {
                                    // There's only one component and target value left. They don't match. Remove the component. Target value will be added in the next iteration.
                                    // TODO: We can technically yield two values here. Check if we can use this knowledge to speed things up.
                                    new_head = Some(new_head_item);
                                    new_tail = Some(new_tail_item);
                                    data = aFn(
                                        Instruction::RemoveItem(RemovalInstruction {
                                            component: old_head_item,
                                            end: End::Head,
                                        }),
                                        data,
                                    );
                                }
                            } else {
                                // At this point we know there's only one target value left. We already know it doesn't match the head component so delete the head component.
                                new_head = Some(new_head_item);
                                data = aFn(
                                    Instruction::RemoveItem(RemovalInstruction {
                                        component: old_head_item,
                                        end: End::Head,
                                    }),
                                    data,
                                );
                            }
                        }
                    }
                }
                (Some(component), None) => {
                    return FinalInstruction::RemoveAllRemainingComponents(RemoveRemainingComponentsInstruction {
                      data,
                      first_component: component,
                      other_components: self.old_iterator
                    });
                }
                (None, Some(value)) => {
                    return FinalInstruction::AddAllRemainingValues(AddAllRemainingValuesInstruction {
                      data,
                      first_value: value,
                      other_values: self.new_iterator,
                    });
                }
                (None, None) => {
                    return FinalInstruction::DoNothing(DoNothingInstruction {
                      data
                    });
                }
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use std::collections::{vec_deque, VecDeque};

    use crate::{
        DoNotRecycle, End, Instruction, ReconcileIterator, ReconcilePayload, Recycler,
        RemovalInstruction, FinalInstruction,
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
          },
          FinalInstruction::RemoveAllRemainingComponents(instruction) => instruction.data.reconciled,
          FinalInstruction::DoNothing(instruction) => instruction.data.reconciled
        };

        assert_eq!(reconciled, [2, 6, 4, 5, 8])
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
    const firstToRemoveMarker = results[oldHead]!.data.first;
    const lastToRemoveMarker =
      newTail + 1 < newLength ? newRenderResults[newTail + 1]!.data.first : before;
    removeUntilBefore(container, firstToRemoveMarker, lastToRemoveMarker);
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
