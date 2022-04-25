use std::iter::DoubleEndedIterator;

mod head_tail;
use head_tail::*;

pub struct ReconcilePayload<Component, Value> {
    old_component: Component,
    new_value: Value,
}

pub trait Reconcilable {
    type Value;
    type Unreconciled;
    type Reconciled;
    fn reconcile(self, new_value: Self::Value) -> Result<Self::Reconciled, Self::Unreconciled>;
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

pub struct RecycledAndNewState<Reconciled, InstructionGeneric> {
    data: Reconciled,
    state: InstructionGeneric,
}

struct Nothing;

struct Pair<V, O> {
    taken: V,
    other: O,
}

trait RecycleHead {
    type Value;
    type RecycledSuccess;
    type RecycledError;
    fn recycle_head(self, value: Self::Value)
        -> Result<Self::RecycledSuccess, Self::RecycledError>;
}

trait RecycleTail {
    type Value;
    type RecycledSuccess;
    type RecycledError;
    fn recycle_tail(self, value: Self::Value)
        -> Result<Self::RecycledSuccess, Self::RecycledError>;
}

impl<T> RecycleHead for T
where
    T: SplitHeadTrait,
    T::Head: Reconcilable,
    T::HeadObject: MergeHeadTrait<<T::Head as Reconcilable>::NotReconciled>,
{
    type Value = <T::Head as Reconcilable>::Value;
    type RecycledSuccess = (<T::Head as Reconcilable>::Reconciled, T::HeadObject);
    type RecycledError =
        <T::HeadObject as MergeHeadTrait<<T::Head as Reconcilable>::NotReconciled>>::MergedObject;
    fn recycle_head(
        self,
        value: <T::Head as Reconcilable>::Value,
    ) -> Result<Self::RecycledSuccess, Self::RecycledError> {
        let (other, head) = self.split_head();

        match head.reconcile(value) {
            Ok(recycled) => Ok((recycled, other)),
            Err(err) => Err(other.merge_head(head)),
        }
    }
}

impl<T> RecycleTail for T
where
    T: SplitTailTrait,
    T::Tail: Reconcilable,
    T::TailObject: MergeTailTrait<<T::Tail as Reconcilable>::NotReconciled>,
{
    type Value = <T::Tail as Reconcilable>::Value;
    type RecycledSuccess = (<T::Tail as Reconcilable>::Reconciled, T::TailObject);
    type RecycledError =
        <T::TailObject as MergeTailTrait<<T::Tail as Reconcilable>::NotReconciled>>::MergedObject;
    fn recycle_tail(
        self,
        value: <T::Tail as Reconcilable>::Value,
    ) -> Result<Self::RecycledSuccess, Self::RecycledError> {
        let (other, tail) = self.split_tail();

        match tail.reconcile(value) {
            Ok(recycled) => Ok((recycled, other)),
            Err(err) => Err(other.merge_tail(tail)),
        }
    }
}

impl<Head> HeadTail<Head, Nothing> {
    fn head(head: Head) -> Self {
        HeadTail {
            head,
            tail: Nothing,
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
}

impl<CurrentHead, Head, Tail> MergeHeadTrait<Head> for HeadTail<CurrentHead, Tail> {
    type MergedObject = HeadTail<Head, Tail>;
    fn merge_head(self, head: Head) -> HeadTail<Head, Tail> {
        HeadTail {
            head,
            tail: self.tail,
        }
    }
}

impl<CurrentTail, Head, Tail> MergeTailTrait<Tail> for HeadTail<Head, CurrentTail> {
    type MergedObject = HeadTail<Head, Tail>;
    fn merge_tail(self, tail: Tail) -> HeadTail<Head, Tail> {
        HeadTail {
            head: self.head,
            tail,
        }
    }
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

impl<CVh, CVt> ComponentState<Nothing, CVh, CVt> {
    fn component<C>(component: C) -> ComponentState<C, Allow, Allow> {
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
    C: Reconcilable<Value = Value>,
{
    fn recycle_vh(
        self,
        value: Value,
    ) -> Result<
        RecycledAndNewState<C::Reconciled, ComponentState<Nothing, Allow, CVt>>,
        ComponentState<C, Nothing, CVt>,
    > {
        match self.component.reconcile(value) {
            Ok(recycled) => Ok(RecycledAndNewState {
                data: recycled,
                state: ComponentState {
                    component: Nothing,
                    skip: self.skip,
                },
            }),
            Err(err) => Err(ComponentState {
                component: self.component,
                skip: self.skip.merge_head(Nothing),
            }),
        }
    }
}

impl<C, CVh, Value> ComponentState<C, CVh, Allow>
where
    C: Reconcilable<Value = Value>,
{
    fn recycle_vt(
        self,
        value: Value,
    ) -> Result<
        RecycledAndNewState<C::Reconciled, ComponentState<Nothing, CVh, Allow>>,
        ComponentState<C, CVh, Nothing>,
    > {
        match self.component.reconcile(value) {
            Ok(recycled) => Ok(RecycledAndNewState {
                data: recycled,
                state: ComponentState {
                    component: Nothing,
                    skip: self.skip,
                },
            }),
            Err(err) => Err(ComponentState {
                component: self.component,
                skip: self.skip.merge_tail(Nothing),
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
    RecycledItem(Reconciled),
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

#[cfg(test)]
mod tests {
    use std::collections::{vec_deque, VecDeque};

    use crate::{
        DoNotRecycle, End, FinalInstruction, Instruction, ReconcileIterator, ReconcilePayload,
        Reconcilable, RemovalInstruction,
    };

    struct TestUpdater {
        component: u16,
        value: u16,
    }

    impl<'a> Reconcilable for &'a i32 {
        type Component = Self;

        type Value = &'a i32;

        type Reconciled = i32;

        fn reconcile(
            self,
            value: Self::Value,
        ) -> Result<Self::Reconciled, crate::ReconcilePayload<Self::Component, Self::Value>>
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
