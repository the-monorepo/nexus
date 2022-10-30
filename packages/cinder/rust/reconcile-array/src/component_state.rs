use crate::*;
use immutable_operators::*;
use reconcilable_trait::Unchanged;

#[derive(Debug)]
pub struct Allow;

/**
 * At this layer, we add the first set of reconcile specific abstractions into the mix.
 * Specifically, we add concepts of skipping/disabling reconciliation when it fails for a given value and
 * renewing the skip state when fresh state is added to the head/tail of components.
 */
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

impl<C, AllowTailGeneric, Value> Reconcilable<Tail<Value>> for ComponentState<C, AllowTailGeneric>
where
    C: Reconcilable<Value>,
    AllowTailGeneric: SplitTrait<Tail<Allow>>,
{
    type Reconciled = ComponentState<C::Reconciled, HeadTail<Allow, Allow>>;
    type Unreconciled = ComponentState<C::Unreconciled, AllowTailGeneric::Other>;
    fn reconcile(self, value: Tail<Value>) -> Result<Self::Reconciled, Self::Unreconciled> {
        match self.component.reconcile(value.0) {
            Ok(reconciled) => Ok(ComponentState {
                component: reconciled,
                skip: HeadTail::new(Allow, Allow),
            }),
            Err(unreconciled) => Err(ComponentState {
                component: unreconciled,
                skip: self.skip,
            }
            .skip_vt()),
        }
    }
}

impl<C, AllowHeadGeneric, Value> Reconcilable<Head<Value>> for ComponentState<C, AllowHeadGeneric>
where
    C: Reconcilable<Value>,
    AllowHeadGeneric: SplitTrait<Head<Allow>>,
{
    type Reconciled = ComponentState<C::Reconciled, HeadTail<Allow, Allow>>;
    type Unreconciled = ComponentState<C::Unreconciled, AllowHeadGeneric::Other>;
    fn reconcile(self, value: Head<Value>) -> Result<Self::Reconciled, Self::Unreconciled> {
        match self.component.reconcile(value.0) {
            Ok(reconciled) => Ok(ComponentState {
                component: reconciled,
                skip: HeadTail::new(Allow, Allow),
            }),
            Err(unreconciled) => Err(ComponentState {
                component: unreconciled,
                skip: self.skip,
            }
            .skip_vh()),
        }
    }
}

impl<Component, SkipGeneric> SplitTrait<Component> for ComponentState<Component, SkipGeneric> {
    type Other = ComponentState<Nothing, HeadTail<Allow, Allow>>;

    fn split(self) -> (Self::Other, Component) {
        (
            ComponentState {
                component: Nothing,
                skip: HeadTail::new(Allow, Allow),
            },
            self.component,
        )
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
    use reconcilable_trait::mocks::{AlwaysReconcileValue, AlwaysUnreconcileValue};

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
                .split_value(),
            expected_value
        );
    }

    #[test]
    fn reconcile_vh_error() {
        let expected_value = 1;
        let original = AlwaysUnreconcileValue::<u32>::new();
        assert_eq!(
            ComponentState::component(original)
                .reconcile(Head(expected_value))
                .unwrap_err()
                .split_value(),
            // TODO: Feels a little smelly. At a glance, to me, it feels like I'd expect this to fail since it's a new instance. Maybe instead we could check if re-reconciling the new component produces the same behavior as the original component value?
            Unchanged::new(AlwaysUnreconcileValue::<u32>::new(), expected_value)
        )
    }

    #[test]
    fn reconcile_vt_success() {
        let expected_value = 1;
        assert_eq!(
            ComponentState::component(AlwaysReconcileValue::<u32>::new())
                .reconcile(Tail(expected_value))
                .unwrap()
                .split_value(),
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
                .split_value(),
            Unchanged::new(AlwaysUnreconcileValue::<u32>::new(), expected_value)
        )
    }
}
