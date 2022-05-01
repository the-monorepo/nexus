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

impl<C, SplitHead> ComponentState<C, SplitHead>
where
    C: Reconcilable,
    C::Unreconciled: SplitSource,
    <C::Unreconciled as SplitSource>::Other: SplitValue,
    SplitHead: SplitHeadTrait,
{
    pub fn reconcile_vh(
        self,
        value: C::Value,
    ) -> Result<
        ReconciledAndNewState<C::Reconciled, ComponentState<Nothing, SplitHead>>,
        ReconciledAndNewState<
            <<C::Unreconciled as SplitSource>::Other as SplitValue>::Value,
            ComponentState<<C::Unreconciled as SplitSource>::Source, SplitHead::Other>,
        >,
    > {
        match self.component.reconcile(value) {
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

impl<C, SplitTail> ComponentState<C, SplitTail>
where
    C: Reconcilable,
    C::Unreconciled: SplitSource,
    <C::Unreconciled as SplitSource>::Other: SplitValue,
    SplitTail: SplitTailTrait,
{
    pub fn reconcile_vt(
        self,
        value: C::Value,
    ) -> Result<
        ReconciledAndNewState<C::Reconciled, ComponentState<Nothing, SplitTail>>,
        ReconciledAndNewState<
            <<C::Unreconciled as SplitSource>::Other as SplitValue>::Value,
            ComponentState<<C::Unreconciled as SplitSource>::Source, SplitTail::Other>,
        >,
    > {
        match self.component.reconcile(value) {
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

impl<SkipGeneric> ComponentState<Nothing, SkipGeneric> {
    pub fn merge<C>(self, component: C) -> ComponentState<C, HeadTail<Allow, Allow>> {
        // TODO: Should technically not create a totally separate component. Make use of traits to fix this
        ComponentState::component(component)
    }
}

impl<C, SplitHead: SplitHeadTrait> ComponentState<C, SplitHead> {
    pub fn skip_vh(self) -> ComponentState<C, SplitHead::Other> {
        ComponentState {
            component: self.component,
            skip: self.skip.drop_head(),
        }
    }
}

impl<C, MergeHead: MergeHeadTrait<Allow>> ComponentState<C, MergeHead> {
    pub fn allow_vh(self) -> ComponentState<C, MergeHead::MergedObject> {
        ComponentState {
            component: self.component,
            skip: self.skip.merge_head(Allow),
        }
    }
}

impl<C, SplitTail: SplitTailTrait> ComponentState<C, SplitTail> {
    pub fn skip_vt(self) -> ComponentState<C, SplitTail::Other> {
        ComponentState {
            component: self.component,
            skip: self.skip.drop_tail(),
        }
    }
}

impl<C, MergeTail: MergeTailTrait<Allow>> ComponentState<C, MergeTail> {
    pub fn allow_vt(self) -> ComponentState<C, MergeTail::MergedObject> {
        ComponentState {
            component: self.component,
            skip: self.skip.merge_tail(Allow),
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
                .reconcile_vh(expected_value)
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
                .reconcile_vh(expected_value)
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
                .reconcile_vt(expected_value)
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
                .reconcile_vt(expected_value)
                .unwrap_err()
                .data,
                expected_value
        )
    }
}
