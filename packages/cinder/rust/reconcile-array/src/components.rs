use crate::*;
use immutable_operators::*;
use reconcilable_trait::Reconcilable;

pub type Components<CH, CT, HeadSkipState, TailSkipState> =
    HeadTail<ComponentState<CH, HeadSkipState>, ComponentState<CT, TailSkipState>>;

#[cfg(test)]
mod tests {
    use reconcilable_trait::mocks::AlwaysReconcileValue;

    use super::*;

    #[test]
    fn reconcile_chvh() {
        let expected_value = 3;
        let components: Components<
            AlwaysReconcileValue<i32>,
            Nothing,
            HeadTail<Allow, Allow>,
            HeadTail<Allow, Allow>,
        > = HeadTail::new(
            ComponentState::component(AlwaysReconcileValue::<i32>::new()),
            ComponentState::component(Nothing),
        );

        let Head(head_state) = components
            .reconcile(Head(Head(expected_value)))
            .unwrap()
            .split_value();

        assert_eq!(head_state.split_value(), expected_value);
    }
}
