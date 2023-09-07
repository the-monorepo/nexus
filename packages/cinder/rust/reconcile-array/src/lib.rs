use std::iter::DoubleEndedIterator;

use reconcilable_trait::Reconcilable;

mod component_manager;
mod component_state;
mod components;
mod head_tail;
mod iterator_manager;
use component_manager::*;
use component_state::*;
use components::*;
use head_tail::*;
use iterator_manager::*;

#[derive(PartialEq)]
pub enum End {
    Head,
    Tail,
}

pub struct Position {
    old: End,
    new: End,
}

#[derive(Debug)]
pub struct ReconciledAndNewState<Reconciled, StateGeneric> {
    data: Reconciled,
    state: StateGeneric,
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
    ComponentsManagerGeneric,
    ValuesManagerGeneric,
    CH,
    CT,
    VH,
    VT,
    HeadSkipState,
    TailSkipState,
> {
    components: ComponentManager<
        ComponentsManagerGeneric,
        Components<CH, CT, HeadSkipState, TailSkipState>,
    >,
    values: ComponentManager<ValuesManagerGeneric, HeadTail<VH, VT>>,
}
