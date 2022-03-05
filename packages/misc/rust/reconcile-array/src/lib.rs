use std::iter::DoubleEndedIterator;
use std::iter::Iterator;

pub struct ReconcileIterator<OldComponentsIterator, NewValuesIterator>
where
    OldComponentsIterator: DoubleEndedIterator,
    NewValuesIterator: DoubleEndedIterator,
    OldComponentsIterator::Item:
        Recycler<OldComponent = OldComponentsIterator::Item, NewValue = NewValuesIterator::Item>,
{
    old_iterator: OldComponentsIterator,
    new_iterator: NewValuesIterator,
    new_head: Option<NewValuesIterator::Item>,
    new_tail: Option<NewValuesIterator::Item>,
    old_head: Option<OldComponentsIterator::Item>,
    old_tail: Option<OldComponentsIterator::Item>,
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
        let old_head = components.next();
        let old_tail = components.next_back();
        let new_head = values.next();
        let new_tail = values.next_back();
        ReconcileIterator {
            old_iterator: components,
            new_iterator: values,
            old_head,
            old_tail,
            new_head,
            new_tail,
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
) -> Result<
    Instruction<OldComponent, NewValue, RecycledGeneric>,
    ReconcilePayload<OldComponent, NewValue>,
>
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

pub enum Instruction<Component, NewValue, RecycledGeneric> {
    RecycleItem(RecycleInstruction<RecycledGeneric>),
    RemoveItem(RemovalInstruction<Component>),
    AddAllRemainingValues(NewValue),
    RemoveAllRemainingComponents(Component),
}

impl<OldComponentsIterator: DoubleEndedIterator, NewValuesIterator: DoubleEndedIterator>
    ReconcileIterator<OldComponentsIterator, NewValuesIterator>
where
    OldComponentsIterator::Item:
        Recycler<OldComponent = OldComponentsIterator::Item, NewValue = NewValuesIterator::Item>,
{
    fn new_head_take(&mut self) -> Option<NewValuesIterator::Item> {
        self.new_head.take().or_else(|| self.new_iterator.next())
    }

    fn new_tail_take(&mut self) -> Option<NewValuesIterator::Item> {
        self.new_tail
            .take()
            .or_else(|| self.new_iterator.next_back())
    }

    fn old_head_take(&mut self) -> Option<OldComponentsIterator::Item> {
        self.old_head.take().or_else(|| self.old_iterator.next())
    }

    fn old_tail_take(&mut self) -> Option<OldComponentsIterator::Item> {
        self.old_tail
            .take()
            .or_else(|| self.old_iterator.next_back())
    }
}

impl<OldComponentsIterator, NewValuesIterator, RecyclerGeneric> Iterator
    for ReconcileIterator<OldComponentsIterator, NewValuesIterator>
where
    OldComponentsIterator: DoubleEndedIterator,
    NewValuesIterator: DoubleEndedIterator,
    OldComponentsIterator::Item: Recycler<
        OldComponent = OldComponentsIterator::Item,
        NewValue = NewValuesIterator::Item,
        RecycledGeneric = RecyclerGeneric,
    >,
{
    type Item = Instruction<
        OldComponentsIterator::Item,
        NewValuesIterator::Item,
        <OldComponentsIterator::Item as Recycler>::RecycledGeneric,
    >;

    fn next(&mut self) -> Option<Self::Item> {
        println!("\nnext");
        let new_head_item_option = self.new_head_take();
        let old_head_item_option = self.old_head_take();
        println!("{:?} {:?}", old_head_item_option.is_some(), new_head_item_option.is_some());

        match (old_head_item_option, new_head_item_option) {
            (Some(old_head_item), Some(new_head_item)) => {
                match recycle_instruction(old_head_item, new_head_item, End::Head, End::Head) {
                    Ok(instruction) => Some(instruction),
                    Err(ReconcilePayload {
                        old_component: old_head_item,
                        new_value: new_head_item,
                    }) => {
                        let new_tail_item_option = self.new_tail_take();
                        println!("new tail {:?}", new_tail_item_option.is_some());
                        if let Some(new_tail_item) = new_tail_item_option {
                            let old_tail_item_option = self.old_tail_take();
                            println!("old tail {:?}", old_tail_item_option.is_some());
                            if let Some(old_tail_item) = old_tail_item_option {

                                match recycle_instruction(
                                    old_tail_item,
                                    new_tail_item,
                                    End::Tail,
                                    End::Tail,
                                ) {
                                    Ok(instruction) => {
                                        self.new_head = Some(new_head_item);
                                        self.old_head = Some(old_head_item);
                                        return Some(instruction);
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
                                            self.old_head = Some(old_head_item);
                                            self.new_tail = Some(new_tail_item);
                                            return Some(instruction);
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
                                                    self.old_tail = Some(old_tail_item);
                                                    self.new_head = Some(new_head_item);

                                                    return Some(instruction);
                                                }
                                                Err(ReconcilePayload {
                                                    old_component: old_head_item,
                                                    new_value: new_tail_item,
                                                }) => {
                                                    self.old_tail = Some(old_tail_item);
                                                    self.new_head = Some(new_head_item);
                                                    self.new_tail = Some(new_tail_item);

                                                    return Some(Instruction::RemoveItem(
                                                        RemovalInstruction {
                                                            component: old_head_item,
                                                            end: End::Head,
                                                        },
                                                    ));
                                                }
                                            }
                                        }
                                    },
                                }
                            } else {
                                // There's only one component and target value left. They don't match. Remove the component. Target value will be added in the next iteration.
                                // TODO: We can technically yield two values here. Check if we can use this knowledge to speed things up.
                                self.new_head = Some(new_head_item);
                                self.new_tail = Some(new_tail_item);
                                return Some(Instruction::RemoveItem(RemovalInstruction {
                                    component: old_head_item,
                                    end: End::Head,
                                }));
                            }
                        } else {
                            // At this point we know there's only one target value left. We already know it doesn't match the head component so delete the head component.
                            self.new_head = Some(new_head_item);
                            return Some(Instruction::RemoveItem(RemovalInstruction {
                                component: old_head_item,
                                end: End::Head,
                            }));
                        }
                    }
                }
            }
            (Some(component), None) => Some(Instruction::RemoveAllRemainingComponents(component)),
            (None, Some(value)) => Some(Instruction::AddAllRemainingValues(value)),
            (None, None) => None,
        }
    }
}

#[cfg(test)]
mod tests {
    use std::collections::{vec_deque, VecDeque};

    use crate::{
        DoNotRecycle, End, Instruction, ReconcileIterator, ReconcilePayload, Recycler,
        RemovalInstruction,
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

        let mut iter = ReconcileIterator::new(
          components.iter(),
          values.iter()
        );

        let mut reconciled = [0; values.len()];
        let mut tail = reconciled.len() - 1;
        let mut head = 0;

        for instruction in iter {
            match instruction {
                Instruction::RecycleItem(recycled) => {
                  let old_index = if recycled.position.new == End::Head {
                      let old_index = head;
                      head += 1;
                      old_index
                  } else {
                      let old_index = tail;
                      tail -= 1;
                      old_index
                  };
                  reconciled[old_index] = recycled.recycle_result;
                },
                Instruction::RemoveItem(_) => {
                },
                Instruction::AddAllRemainingValues(first) => {
                  reconciled[head] = *first;
                },
                Instruction::RemoveAllRemainingComponents(_) => {

                },
            }
        }

        assert_eq!(reconciled, [2,6,4, 5,8])
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
