use std::iter::DoubleEndedIterator;

use reconcilable_trait::Reconcilable;

mod head_tail;
use head_tail::*;

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

struct HeadTailManager<IteratorGeneric: DoubleEndedIterator, HeadTailGeneric, HasNext> {
    iterator: IteratorManager<IteratorGeneric, HasNext>,
    ends: HeadTailGeneric,
}

impl<IteratorGeneric: DoubleEndedIterator, HeadGeneric: MergeHeadTrait<IteratorGeneric::Item>>
    HeadTailManager<IteratorGeneric, HeadGeneric, Allow>
{
    fn repopulate_h(
        self,
    ) -> Result<
        HeadTailManager<IteratorGeneric, HeadGeneric::MergedObject, Allow>,
        HeadTailManager<IteratorGeneric, HeadGeneric, Nothing>,
    > {
        match self.iterator.repopulate_h() {
            Ok(result) => Ok(HeadTailManager {
                iterator: result.manager,
                ends: self.ends.merge_head(result.value),
            }),
            Err(manager) => Err(HeadTailManager {
                iterator: manager,
                ends: self.ends,
            }),
        }
    }
}

impl<IteratorGeneric: DoubleEndedIterator, TailGeneric: WithTailTrait<IteratorGeneric::Item>>
    HeadTailManager<IteratorGeneric, TailGeneric, Allow>
{
    fn repopulate_t(
        self,
    ) -> Result<
        HeadTailManager<IteratorGeneric, TailGeneric::TailObject, Allow>,
        HeadTailManager<IteratorGeneric, TailGeneric, Nothing>,
    > {
        match self.iterator.repopulate_t() {
            Ok(result) => Ok(HeadTailManager {
                iterator: result.manager,
                ends: self.ends.merge_tail(result.value),
            }),
            Err(manager) => Err(HeadTailManager {
                iterator: manager,
                ends: self.ends,
            }),
        }
    }
}

impl<C> ComponentState<C, Allow, Allow> {
    fn component(component: C) -> ComponentState<C, Allow, Allow> {
        ComponentState {
            component,
            skip: HeadTail::new(Allow, Allow),
        }
    }
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

impl<C, CVt, Value> ComponentState<C, Allow, CVt>
where
    C: Reconcilable<Value = Value, Unreconciled = ReconcilePayload<C, Value>>,
{
    fn reconcile_vh(
        self,
        value: Value,
    ) -> Result<
        ReconciledAndNewState<C::Reconciled, ComponentState<Nothing, Allow, CVt>>,
        ReconciledAndNewState<Value, ComponentState<C, Nothing, CVt>>,
    > {
        match self.component.reconcile(value) {
            Ok(reconciled) => Ok(ReconciledAndNewState {
                data: reconciled,
                state: ComponentState {
                    component: Nothing,
                    skip: self.skip,
                },
            }),
            Err(err) => Err(ReconciledAndNewState {
                data: err.new_value,
                state: ComponentState {
                    component: err.old_component,
                    skip: self.skip.merge_head(Nothing),
                },
            }),
        }
    }
}

impl<C, CVh, Value> ComponentState<C, CVh, Allow>
where
    C: Reconcilable<Value = Value, Unreconciled = ReconcilePayload<C, Value>>,
{
    fn reconcile_vt(
        self,
        value: Value,
    ) -> Result<
        ReconciledAndNewState<C::Reconciled, ComponentState<Nothing, CVh, Allow>>,
        ReconciledAndNewState<Value, ComponentState<C, CVh, Nothing>>,
    > {
        match self.component.reconcile(value) {
            Ok(reconciled) => Ok(ReconciledAndNewState {
                data: reconciled,
                state: ComponentState {
                    component: Nothing,
                    skip: self.skip,
                },
            }),
            Err(err) => Err(ReconciledAndNewState {
                data: err.new_value,
                state: ComponentState {
                    component: err.old_component,
                    skip: self.skip.merge_tail(Nothing),
                },
            }),
        }
    }
}

impl<C, CVt> ComponentState<C, Allow, CVt> {
    fn skip_vh(self) -> ComponentState<C, Nothing, CVt> {
        ComponentState {
            component: self.component,
            skip: self.skip.merge_head(Nothing),
        }
    }
}

impl<C, CVt> ComponentState<C, Nothing, CVt> {
    fn allow_vh(self) -> ComponentState<C, Allow, CVt> {
        ComponentState {
            component: self.component,
            skip: self.skip.merge_head(Allow),
        }
    }
}

impl<C, CVh> ComponentState<C, CVh, Allow> {
    fn skip_vt(self) -> ComponentState<C, CVh, Nothing> {
        ComponentState {
            component: self.component,
            skip: self.skip.merge_tail(Nothing),
        }
    }
}

impl<C, CVh> ComponentState<C, CVh, Nothing> {
    fn allow_vt(self) -> ComponentState<C, CVh, Allow> {
        ComponentState {
            component: self.component,
            skip: self.skip.merge_tail(Allow),
        }
    }
}

impl ComponentState<Nothing, Nothing, Nothing> {
    fn new_component<C>(self, component: C) -> ComponentState<C, Allow, Allow> {
        ComponentState::component(component)
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

struct ComponentState<C, CVh, CVt> {
    component: C,
    skip: HeadTail<CVh, CVt>,
}

struct Components<CH, CT, ChVh, ChVt, CtVh, CtVt> {
    head_tail: HeadTail<ComponentState<CH, ChVh, ChVt>, ComponentState<CT, CtVh, CtVt>>,
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
        Components<CH, CT, Chvh, Chvt, Ctvh, Ctvt>,
        ComponentsHasNext,
    >,
    values: HeadTailManager<ValuesIterator, HeadTail<VH, VT>, ValuesHasNext>,
}
