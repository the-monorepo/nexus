use crate::*;

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

impl<C, SplitHead, Value> ComponentState<C, SplitHead>
where
    C: Reconcilable<Value = Value, Unreconciled = ReconcilePayload<C, Value>>,
    SplitHead: SplitHeadTrait,
{
    pub fn reconcile_vh(
        self,
        value: Value,
    ) -> Result<
        ReconciledAndNewState<C::Reconciled, ComponentState<Nothing, SplitHead>>,
        ReconciledAndNewState<Value, ComponentState<C, SplitHead::HeadObject>>,
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
                    skip: self.skip,
                }
                .skip_vh(),
            }),
        }
    }
}

impl<C, SplitTail, Value> ComponentState<C, SplitTail>
where
    C: Reconcilable<Value = Value, Unreconciled = ReconcilePayload<C, Value>>,
    SplitTail: SplitTailTrait,
{
    pub fn reconcile_vt(
        self,
        value: Value,
    ) -> Result<
        ReconciledAndNewState<C::Reconciled, ComponentState<Nothing, SplitTail>>,
        ReconciledAndNewState<Value, ComponentState<C, SplitTail::TailObject>>,
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
                    skip: self.skip,
                }
                .skip_vt(),
            }),
        }
    }
}

impl<C, SplitHead: SplitHeadTrait> ComponentState<C, SplitHead> {
    pub fn skip_vh(self) -> ComponentState<C, SplitHead::HeadObject> {
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
    pub fn skip_vt(self) -> ComponentState<C, SplitTail::TailObject> {
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
    use super::*;

    #[test]
    fn smoke_test() {
        // TODO: Tests could be more explicit
        ComponentState::component(Nothing)
            .skip_vt()
            .skip_vh()
            .allow_vt()
            .allow_vh()
            .skip_vt()
            .skip_vh();
    }
}
