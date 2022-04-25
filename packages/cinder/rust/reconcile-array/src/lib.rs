use std::iter::DoubleEndedIterator;

use reconcilable_trait::Reconcilable;

mod head_tail;
mod component_state;
mod iterator_manager;
mod component_manager;
use head_tail::*;
use component_state::*;
use iterator_manager::*;
use component_manager::*;

pub struct ReconcilePayload<Component, Value> {
    old_component: Component,
    new_value: Value,
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

pub struct ReconciledAndNewState<Reconciled, InstructionGeneric> {
    data: Reconciled,
    state: InstructionGeneric,
}

struct Pair<V, O> {
    taken: V,
    other: O,
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
pub enum ReconcileInstruction<Component, Reconciled> {
    ReconciledItem(Reconciled),
    RemoveItem(Component),
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

trait RecursiveNext<Item, Finished, Next: RecursiveNext<Item, Finished, Next>> {
    fn next(self) -> Result<NextResult<Item, Next>, Finished>
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

struct Components<CH, CT, ChVh, ChVt, CtVh, CtVt> {
    head_tail: HeadTail<ComponentState<CH, ChVh, ChVt>, ComponentState<CT, CtVh, CtVt>>,
}

impl<CH, CT, ChVh, ChVt, CtVh, CtVt> MergeHeadTrait<CH>
  for Components<Nothing, CT, ChVh, ChVt, CtVh, CtVt>
{
  type MergedObject = Components<CH, CT, Allow, Allow, CtVh, CtVt>;
  fn merge_head(self, head: CH) -> Self::MergedObject {
      let component = ComponentState::component(head);
      let head_tail = self.head_tail.merge_head(component);
      let components = Components { head_tail };
      components
  }
}

impl<CH, CT, ChVh, ChVt, CtVh, CtVt> MergeTailTrait<CT>
  for Components<CH, Nothing, ChVh, ChVt, CtVh, CtVt>
{
  type MergedObject = Components<CH, CT, ChVh, ChVt, Allow, Allow>;
  fn merge_tail(self, tail: CT) -> Self::MergedObject {
      Components {
          head_tail: self.head_tail.merge_tail(ComponentState::component(tail)),
      }
  }
}

impl<D, S> ReconciledAndNewState<D, S> {
    fn map_state<ReturnGeneric, F: FnOnce(S) -> ReturnGeneric>(
        self,
        mapper: F,
    ) -> ReconciledAndNewState<D, ReturnGeneric> {
        ReconciledAndNewState {
            data: self.data,
            state: mapper(self.state),
        }
    }
}

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
    components: ComponentManager<
        ComponentsIterator,
        Components<CH, CT, Chvh, Chvt, Ctvh, Ctvt>,
        ComponentsHasNext,
    >,
    values: ComponentManager<ValuesIterator, HeadTail<VH, VT>, ValuesHasNext>,
}
