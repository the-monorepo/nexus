use std::iter::DoubleEndedIterator;
use std::iter::Iterator;

pub struct ReconcileIterator<OldComponentsIterator, NewValuesIterator>
where
    OldComponentsIterator: DoubleEndedIterator,
    NewValuesIterator: DoubleEndedIterator,
{
    old_iterator: OldComponentsIterator,
    new_iterator: NewValuesIterator,
    new_head: Option<NewValuesIterator::Item>,
    new_tail: Option<NewValuesIterator::Item>,
    old_head: Option<OldComponentsIterator::Item>,
    old_tail: Option<OldComponentsIterator::Item>,
}

struct ReconcilePayload<Component, Value> {
    old_component: Component,
    new_value: Value,
}

pub struct DoNotRecycle<Component, Value> {
    reconcile_payload: ReconcilePayload<Component, Value>,
}

pub struct Recycled<Component, Value, Updater: FnOnce(Component, Value) -> Component> {
    reconcile_payload: ReconcilePayload<Component, Value>,
    update: Updater,
}

pub trait Recycler {
    type OldComponent;
    type NewValue;
    type Update: FnOnce(Self::OldComponent, Self::NewValue) -> Self::OldComponent;
    fn recycle(
        self,
        new_value: Self::NewValue,
    ) -> Result<
        Recycled<Self::OldComponent, Self::NewValue, Self::Update>,
        DoNotRecycle<Self::OldComponent, Self::NewValue>,
    >;
}

fn recycle_instruction<OldComponent, NewValue, Update, RecyclerGeneric>(
    recycler: RecyclerGeneric,
    new_value: NewValue,
    old_end: End,
    new_end: End,
) -> Result<Instruction<OldComponent, NewValue, Update>, DoNotRecycle<OldComponent, NewValue>>
where
    Update: FnOnce(OldComponent, NewValue) -> OldComponent,
    RecyclerGeneric: Recycler<OldComponent = OldComponent, NewValue = NewValue, Update = Update>,
{
    recycler.recycle(new_value).and_then(|recycle_result| {
        Ok(Instruction::RecycleItem(RecycleInstruction {
            old: old_end,
            new: new_end,
            recycle_result,
        }))
    })
}

pub enum End {
    Head,
    Tail,
}

pub struct RecycleInstruction<
    OldComponent,
    NewValue,
    Update: FnOnce(OldComponent, NewValue) -> OldComponent,
> {
    old: End,
    new: End,
    recycle_result: Recycled<OldComponent, NewValue, Update>,
}

pub struct RemovalInstruction<T> {
    component: T,
}

pub enum Instruction<Component, NewValue, Update: FnOnce(Component, NewValue) -> Component> {
    RecycleItem(RecycleInstruction<Component, NewValue, Update>),
    RemoveItem(RemovalInstruction<Component>),
    AddAllRemainingValues(),
    RemoveAllRemainingComponents(),
}

impl<OldComponentsIterator: DoubleEndedIterator, NewValuesIterator: DoubleEndedIterator>
    ReconcileIterator<OldComponentsIterator, NewValuesIterator>
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

impl<OldComponentsIterator, NewValuesIterator> Iterator
    for ReconcileIterator<OldComponentsIterator, NewValuesIterator>
where
    OldComponentsIterator: DoubleEndedIterator,
    NewValuesIterator: DoubleEndedIterator,
    OldComponentsIterator::Item:
        Recycler<OldComponent = OldComponentsIterator::Item, NewValue = NewValuesIterator::Item>,
{
    type Item = Instruction<
        OldComponentsIterator::Item,
        NewValuesIterator::Item,
        <OldComponentsIterator::Item as Recycler>::Update,
    >;

    fn next(&mut self) -> Option<Self::Item> {
        let new_head_item_option = self.new_head_take();
        let old_head_item_option = self.old_head_take();

        match (old_head_item_option, new_head_item_option) {
            (Some(old_head_item), Some(new_head_item)) => {
                match recycle_instruction(old_head_item, new_head_item, End::Head, End::Head) {
                    Ok(instruction) => Some(instruction),
                    Err(DoNotRecycle {
                        reconcile_payload:
                            ReconcilePayload {
                                old_component: old_head_item,
                                new_value: new_head_item,
                            },
                    }) => {
                        let new_tail_item_option = self.new_tail_take();
                        if let Some(new_tail_item) = new_tail_item_option {
                            let old_tail_item_option = self.old_tail_take();
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
                                    Err(DoNotRecycle {
                                        reconcile_payload:
                                            ReconcilePayload {
                                                old_component: old_tail_item,
                                                new_value: new_tail_item,
                                            },
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
                                        Err(DoNotRecycle {
                                            reconcile_payload:
                                                ReconcilePayload {
                                                    old_component: old_tail_item,
                                                    new_value: new_head_item,
                                                },
                                        }) => match recycle_instruction(
                                            old_head_item,
                                            new_tail_item,
                                            End::Tail,
                                            End::Head,
                                        ) {
                                            Ok(instruction) => {
                                                self.old_tail = Some(old_tail_item);
                                                self.new_head = Some(new_head_item);

                                                return Some(instruction);
                                            }
                                            Err(DoNotRecycle {
                                                reconcile_payload:
                                                    ReconcilePayload {
                                                        old_component: old_head_item,
                                                        new_value: new_tail_item,
                                                    },
                                            }) => {
                                                self.old_tail = Some(old_tail_item);
                                                self.new_head = Some(new_head_item);
                                                self.new_tail = Some(new_tail_item);

                                                return Some(Instruction::RemoveItem(
                                                    RemovalInstruction {
                                                        component: old_head_item,
                                                    },
                                                ));
                                            }
                                        },
                                    },
                                }
                            } else {
                                // There's only one component and target value left. They don't match. Remove the component. Target value will be added in the next iteration.
                                // TODO: We can technically yield two values here. Check if we can use this knowledge to speed things up.
                                self.new_head = Some(new_head_item);
                                return Some(Instruction::RemoveItem(RemovalInstruction {
                                    component: old_head_item,
                                }));
                            }
                        } else {
                            // At this point we know there's only one target value left. We already know it doesn't match the head component so delete the head component.
                            self.new_head = Some(new_head_item);
                            return Some(Instruction::RemoveItem(RemovalInstruction {
                                component: old_head_item,
                            }));
                        }
                    }
                }
            }
            (Some(_), None) => Some(Instruction::AddAllRemainingValues()),
            (None, Some(_)) => Some(Instruction::RemoveAllRemainingComponents()),
            (None, None) => None,
        }
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
