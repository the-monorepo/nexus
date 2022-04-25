use std::iter::DoubleEndedIterator;

use reconcilable_trait::Reconcilable;

mod head_tail;
mod component_state;
use head_tail::*;
use component_state::*;

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

struct ComponentManager<IteratorGeneric: DoubleEndedIterator, HeadTailGeneric, HasNext> {
    iterator: IteratorManager<IteratorGeneric, HasNext>,
    ends: HeadTailGeneric,
}

impl<IteratorGeneric: DoubleEndedIterator, HeadGeneric: MergeHeadTrait<IteratorGeneric::Item>>
    ComponentManager<IteratorGeneric, HeadGeneric, Allow>
{
    fn repopulate_h(
        self,
    ) -> Result<
        ComponentManager<IteratorGeneric, HeadGeneric::MergedObject, Allow>,
        ComponentManager<IteratorGeneric, HeadGeneric, Nothing>,
    > {
        match self.iterator.repopulate_h() {
            Ok(result) => Ok(ComponentManager {
                iterator: result.manager,
                ends: self.ends.merge_head(result.value),
            }),
            Err(manager) => Err(ComponentManager {
                iterator: manager,
                ends: self.ends,
            }),
        }
    }
}

impl<IteratorGeneric: DoubleEndedIterator, TailGeneric: WithTailTrait<IteratorGeneric::Item>>
    ComponentManager<IteratorGeneric, TailGeneric, Allow>
{
    fn repopulate_t(
        self,
    ) -> Result<
        ComponentManager<IteratorGeneric, TailGeneric::TailObject, Allow>,
        ComponentManager<IteratorGeneric, TailGeneric, Nothing>,
    > {
        match self.iterator.repopulate_t() {
            Ok(result) => Ok(ComponentManager {
                iterator: result.manager,
                ends: self.ends.merge_tail(result.value),
            }),
            Err(manager) => Err(ComponentManager {
                iterator: manager,
                ends: self.ends,
            }),
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
