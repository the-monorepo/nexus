use std::iter::DoubleEndedIterator;
use std::iter::Iterator;

pub struct ReconcilePayload<Component, Value> {
    old_component: Component,
    new_value: Value,
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
#[derive(PartialEq)]
pub enum End {
    Head,
    Tail,
}

pub struct Position {
    old: End,
    new: End,
}

pub struct RecycledAndNewState<RecycledGeneric, InstructionGeneric> {
    data: RecycledGeneric,
    state: InstructionGeneric,
}

struct Nothing;

pub struct HeadTail<Head, Tail> {
    head: Head,
    tail: Tail,
}

impl<Head, Tail> HeadTail<Head, Tail> {
    fn new(head: Head, tail: Tail) -> Self {
        HeadTail { head, tail }
    }
}

trait WithTailTrait<Tail> {
    type TailObject;
    fn with_tail(self, tail: Tail) -> Self::TailObject;

    fn with_tail_option(self, tail_option: Option<Tail>) -> Result<Self::TailObject, Self>
    where
        Self: Sized,
    {
        if let Some(tail) = tail_option {
            Ok(self.with_tail(tail))
        } else {
            Err(self)
        }
    }
}

/*trait HeadWithTailTrait<Head, Tail> : WithHeadTrait<Head> + WithTailTrait<Tail>
{
}*/

trait WithHeadTrait<Head> {
    type HeadObject;
    fn with_head(self, head: Head) -> Self::HeadObject;

    fn with_head_option(self, head_option: Option<Head>) -> Result<Self::HeadObject, Self>
    where
        Self: Sized,
    {
        if let Some(head) = head_option {
            Ok(self.with_head(head))
        } else {
            Err(self)
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

impl<CurrentHead, Head, Tail> WithHeadTrait<Head>
    for HeadTail<CurrentHead, Tail>
{
    type HeadObject = HeadTail<Head, Tail>;
    fn with_head(self, head: Head) -> HeadTail<Head, Tail> {
        HeadTail {
            head,
            tail: self.tail,
        }
    }
}
impl<CurrentTail, Head, Tail> WithTailTrait<Tail>
    for HeadTail<Head, CurrentTail>
{
    type TailObject = HeadTail<Head, Tail>;
    fn with_tail(self, tail: Tail) -> HeadTail<Head, Tail> {
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

impl<IteratorGeneric : DoubleEndedIterator, HeadTailGeneric, HasNext> HeadTailManager<IteratorGeneric, HeadTailGeneric, HasNext> {
    fn recycle_vh(self) {
        self.
    }
}

impl<IteratorGeneric : DoubleEndedIterator, HeadGeneric : WithHeadTrait<IteratorGeneric::Item>> HeadTailManager<IteratorGeneric, HeadGeneric, Allow> {
    fn repopulate_h(
        self,
    ) -> Result<HeadTailManager<IteratorGeneric, HeadGeneric::HeadObject, Allow>, HeadTailManager<IteratorGeneric, HeadGeneric, Nothing>> {
        match self.iterator.repopulate_h() {
            Ok(result) => Ok(HeadTailManager {
                iterator: result.manager,
                ends: self.ends.with_head(result.value),
            }),
            Err(manager) => Err(HeadTailManager {
                iterator: manager,
                ends: self.ends,
            }),
        }
    }
}

impl<IteratorGeneric : DoubleEndedIterator, TailGeneric : WithTailTrait<IteratorGeneric::Item>> HeadTailManager<IteratorGeneric, TailGeneric, Allow> {
    fn repopulate_t(
        self,
    ) -> Result<HeadTailManager<IteratorGeneric, TailGeneric::TailObject, Allow>, HeadTailManager<IteratorGeneric, TailGeneric, Nothing>>  {
        match self.iterator.repopulate_t() {
            Ok(result) => Ok(HeadTailManager {
                iterator: result.manager,
                ends: self.ends.with_tail(result.value),
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

impl<
    CH,
    CT,
    ChVh,
    ChVt,
    CtVh,
    CtVt,
> WithHeadTrait<CH> for Components<Nothing, CT, ChVh, ChVt, CtVh, CtVt> {
    type HeadObject = Components<CH, CT, Allow, Allow, CtVh, CtVt>;
    fn with_head(self, head: CH) {
        Components {
            head_tail: self.head_tail.with_head(ComponentState::component(head))
        }
    }
}

impl<
    CH,
    CT,
    ChVh,
    ChVt,
    CtVh,
    CtVt,
> WithTailTrait<CT> for Components<CH, Nothing, ChVh, ChVt, CtVh, CtVt> {
    type TailObject = Components<CH, CT, ChVh, ChVt, Allow, Allow>;
    fn with_tail(self, tail: CT) {
        Components {
            head_tail: self.head_tail.with_tail(ComponentState::component(tail))
        }
    }
}

impl<C, CVt, Value> ComponentState<C, Allow, CVt>
where
    C: Recycler<Value = Value>,
{
    fn recycle_vh(
        self,
        value: Value,
    ) -> Result<
        RecycledAndNewState<C::RecycledGeneric, ComponentState<Nothing, Allow, CVt>>,
        ComponentState<C, Nothing, CVt>,
    > {
        match self.component.recycle(value) {
            Ok(recycled) => Ok(RecycledAndNewState {
                data: recycled,
                state: ComponentState {
                    component: Nothing,
                    skip: self.skip,
                },
            }),
            Err(err) => Err(ComponentState {
                component: self.component,
                skip: self.skip.with_head(Nothing),
            }),
        }
    }
}

impl<C, CVh, Value> ComponentState<C, CVh, Allow>
where
    C: Recycler<Value = Value>,
{
    fn recycle_vt(
        self,
        value: Value,
    ) -> Result<
        RecycledAndNewState<C::RecycledGeneric, ComponentState<Nothing, CVh, Allow>>,
        ComponentState<C, CVh, Nothing>,
    > {
        match self.component.recycle(value) {
            Ok(recycled) => Ok(RecycledAndNewState {
                data: recycled,
                state: ComponentState {
                    component: Nothing,
                    skip: self.skip,
                },
            }),
            Err(err) => Err(ComponentState {
                component: self.component,
                skip: self.skip.with_tail(Nothing),
            }),
        }
    }
}

impl<C, CVt> ComponentState<C, Allow, CVt> {
    fn skip_vh(self) -> ComponentState<C, Nothing, CVt> {
        ComponentState {
            component: self.component,
            skip: self.skip.with_head(Nothing),
        }
    }
}

impl<C, CVt> ComponentState<C, Nothing, CVt> {
    fn allow_vh(self) -> ComponentState<C, Allow, CVt> {
        ComponentState {
            component: self.component,
            skip: self.skip.with_head(Allow),
        }
    }
}

impl<C, CVh> ComponentState<C, CVh, Allow> {
    fn skip_vt(self) -> ComponentState<C, CVh, Nothing> {
        ComponentState {
            component: self.component,
            skip: self.skip.with_tail(Nothing),
        }
    }
}

impl<C, CVh> ComponentState<C, CVh, Nothing> {
    fn allow_vt(self) -> ComponentState<C, CVh, Allow> {
        ComponentState {
            component: self.component,
            skip: self.skip.with_tail(Allow),
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
pub enum ReconcileInstruction<Component, RecycledGeneric> {
    RecycledItem(RecycledGeneric),
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

impl<
        ComponentsIterator: DoubleEndedIterator,
        ValuesIterator: DoubleEndedIterator,
        Next,
        CT,
        VT,
        Chvt,
        Ctvh,
        Ctvt,
        ComponentsHasNext,
        ValuesHasNext,
    >
    ReconcileState<
        ComponentsIterator,
        ValuesIterator,
        ComponentsIterator::Item,
        CT,
        ValuesIterator::Item,
        VT,
        Allow,
        Chvt,
        Ctvh,
        Ctvt,
        ComponentsHasNext,
        ValuesHasNext,
    >
where
    ComponentsIterator::Item:
        Recycler<Component = ComponentsIterator::Item, Value = ValuesIterator::Item>,
    Next: RecursiveNext<
        ReconcileInstruction<
            ComponentsIterator::Item,
            <ComponentsIterator::Item as Recycler>::RecycledGeneric,
        >,
        Finished<ComponentsIterator, ValuesIterator>,
        Next,
    >,
{
    fn recycle_vh(self) -> Result<
        NextResult<
            ReconcileInstruction<
                <ComponentsIterator as Iterator>::Item,
                <<ComponentsIterator as Iterator>::Item as Recycler>::RecycledGeneric,
            >,
            Next,
        >,
        Finished<ComponentsIterator, ValuesIterator>,
    > {
        match self.components.ends.head.recycle_vh(self.values.ends.head) {
            Ok(recycled) => Ok(NextResult {
                item: ReconcileInstruction::RecycledItem(recycled.data),
                next: ReconcileState {
                    components: HeadTailManager {
                        iterator: self.components.iterator,
                        ends: HeadTail {
                            head: recycled.state,
                            tail: self.components.ends.tail,
                        },
                    },
                    values: HeadTailManager {
                        iterator: self.values.iterator,
                        ends: HeadTail {
                            head: Nothing,
                            tail: self.values.ends.tail,
                        },
                    },
                },
            }),
            Err(err) => todo!(),
        }   
    }
}


impl<
    ComponentsIterator: DoubleEndedIterator,
    ValuesIterator: DoubleEndedIterator,
    Next,
    CT,
    VH,
    VT,
    Chvh,
    Chvt,
    Ctvh,
    Ctvt,
    ValuesHasNext,
>
    RecursiveNext<
        ReconcileInstruction<
            ComponentsIterator::Item,
            <ComponentsIterator::Item as Recycler>::RecycledGeneric,
        >,
        Finished<ComponentsIterator, ValuesIterator>,
        Next,
    >
    for ReconcileState<
        ComponentsIterator,
        ValuesIterator,
        Nothing,
        CT,
        VH,
        VT,
        Chvh,
        Chvt,
        Ctvh,
        Ctvt,
        Allow,
        ValuesHasNext,
    >
where
    ComponentsIterator::Item:
        Recycler<Component = ComponentsIterator::Item, Value = ValuesIterator::Item>,
    Next: RecursiveNext<
        ReconcileInstruction<
            ComponentsIterator::Item,
            <ComponentsIterator::Item as Recycler>::RecycledGeneric,
        >,
        Finished<ComponentsIterator, ValuesIterator>,
        Next,
    >,
{
    fn next(self) -> Result<NextResult<ReconcileInstruction<
            ComponentsIterator::Item,
            <ComponentsIterator::Item as Recycler>::RecycledGeneric,
        >, Next>, Finished<ComponentsIterator, ValuesIterator>>
    where
        Self: Sized {
        todo!()
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
