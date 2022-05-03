use crate::*;
use reconcilable_trait::{SplitSource, SplitValue, Unchanged};

#[derive(Debug)]
pub struct Allow;

#[derive(Debug)]
pub struct ComponentState<C, SkipGeneric> {
    component: C,
    skip: SkipGeneric,
}

impl<C> ComponentState<C, HeadTail<Allow, Allow>> {
    pub fn component(component: C) -> ComponentState<C, HeadTail<Allow, Allow>> {
        ComponentState {
            component,
            skip: HeadTail::new(Allow, Allow),
        }
    }
}

pub trait ComponentReconcilable<Value> {
    type Unreconciled; // = Unchanged<Self, Self::Value>;
    type Reconciled;
    fn reconcile(self, new_value: Value) -> Result<Self::Reconciled, Self::Unreconciled>;
}


impl<C, SplitHead, Value> ComponentReconcilable<Head<Value>> for ComponentState<C, SplitHead>
where
    C: Reconcilable<Value>,
    C::Unreconciled: SplitSource,
    <C::Unreconciled as SplitSource>::Other: SplitValue,
    SplitHead: SplitTrait<Head<Allow>>,
{
    type Reconciled = ReconciledAndNewState<C::Reconciled, ComponentState<Nothing, SplitHead>>;
    type Unreconciled = ReconciledAndNewState<
    <<C::Unreconciled as SplitSource>::Other as SplitValue>::Value,
    ComponentState<<C::Unreconciled as SplitSource>::Source, SplitHead::Other>,
>;
    fn reconcile(
        self,
        value: Head<Value>,
    ) -> Result<
        Self::Reconciled,
        Self::Unreconciled,
    > {
        match self.component.reconcile(value.0) {
            Ok(reconciled) => Ok(ReconciledAndNewState {
                data: reconciled,
                state: ComponentState {
                    component: Nothing,
                    skip: self.skip,
                },
            }),
            Err(err) => {
                let (source, err) = err.split_source();
                let (value, _) = err.split_value();
                return Err(ReconciledAndNewState {
                    data: value,
                    state: ComponentState {
                        component: source,
                        skip: self.skip,
                    }
                    .skip_vh(),
                });
            }
        }
    }
}

impl<C, SplitTail, Value> ComponentReconcilable<Tail<Value>> for ComponentState<C, SplitTail>
where
    C: Reconcilable<Value>,
    C::Unreconciled: SplitSource,
    <C::Unreconciled as SplitSource>::Other: SplitValue,
    SplitTail: SplitTrait<Tail<Allow>>,
{
    type Reconciled = ReconciledAndNewState<C::Reconciled, ComponentState<Nothing, SplitTail>>;
    type Unreconciled = ReconciledAndNewState<
    <<C::Unreconciled as SplitSource>::Other as SplitValue>::Value,
    ComponentState<<C::Unreconciled as SplitSource>::Source, SplitTail::Other>,
>;
    fn reconcile(
        self,
        value: Tail<Value>,
    ) -> Result<
        Self::Reconciled,
        Self::Unreconciled,
    > {
        match self.component.reconcile(value.0) {
            Ok(reconciled) => Ok(ReconciledAndNewState {
                data: reconciled,
                state: ComponentState {
                    component: Nothing,
                    skip: self.skip,
                },
            }),
            Err(err) => {
                let (source, err) = err.split_source();
                let (value, _) = err.split_value();
                return Err(ReconciledAndNewState {
                    data: value,
                    state: ComponentState {
                        component: source,
                        skip: self.skip,
                    }
                    .skip_vt(),
                });
            }
        }
    }
}

impl<Component, SkipGeneric> MergeTrait<Component> for ComponentState<Nothing, SkipGeneric> {
    type MergedObject = ComponentState<Component, HeadTail<Allow, Allow>>;
    fn merge(self, component: Component) -> ComponentState<Component, HeadTail<Allow, Allow>> {
        ComponentState::component(component)
    }
}

impl<C, SplitHead: SplitTrait<Head<Allow>>> ComponentState<C, SplitHead> {
    pub fn skip_vh(self) -> ComponentState<C, SplitHead::Other> {
        let (skip, Head(_)) = self.skip.split();
        ComponentState {
            component: self.component,
            skip,
        }
    }
}

impl<C, MergeHead: MergeTrait<Head<Allow>>> ComponentState<C, MergeHead> {
    pub fn allow_vh(self) -> ComponentState<C, MergeHead::MergedObject> {
        ComponentState {
            component: self.component,
            skip: self.skip.merge(Head(Allow)),
        }
    }
}

impl<C, SplitTail: SplitTrait<Tail<Allow>>> ComponentState<C, SplitTail> {
    pub fn skip_vt(self) -> ComponentState<C, SplitTail::Other> {
        let (skip, Tail(_)) = self.skip.split();
        ComponentState {
            component: self.component,
            skip,
        }
    }
}

impl<C, MergeTail: MergeTrait<Tail<Allow>>> ComponentState<C, MergeTail> {
    pub fn allow_vt(self) -> ComponentState<C, MergeTail::MergedObject> {
        ComponentState {
            component: self.component,
            skip: self.skip.merge(Tail(Allow)),
        }
    }
}

#[cfg(test)]
mod tests {
    use reconcilable_trait::mocks::{ AlwaysReconcileValue, AlwaysUnreconcileValue };

    use super::*;

    #[test]
    fn skip_smoke_test() {
        // TODO: Tests could be more explicit
        ComponentState::component(Nothing)
            .skip_vt()
            .skip_vh()
            .allow_vt()
            .allow_vh()
            .skip_vt()
            .skip_vh();
    }

    #[test]
    fn reconcile_vh_success() {
        let expected_value = 1;
        assert_eq!(
            ComponentState::component(AlwaysReconcileValue::<u32>::new())
                .reconcile(Head(expected_value))
                .unwrap()
                .data,
            expected_value
        );
    }

    #[test]
    fn reconcile_vh_error() {
        let expected_value = 1;
        assert_eq!(
            ComponentState::component(AlwaysUnreconcileValue::<u32>::new())
                .reconcile(Head(expected_value))
                .unwrap_err()
                .data,
            expected_value
        )
    }

    #[test]
    fn reconcile_vt_success() {
        let expected_value = 1;
        assert_eq!(
            ComponentState::component(AlwaysReconcileValue::<u32>::new())
                .reconcile(Tail(expected_value))
                .unwrap()
                .data,
                expected_value
        )
    }

    #[test]
    fn reconcile_vt_error() {
        let expected_value = 1;
        assert_eq!(
            ComponentState::component(AlwaysUnreconcileValue::<u32>::new())
                .reconcile(Tail(expected_value))
                .unwrap_err()
                .data,
                expected_value
        )
    }
}
