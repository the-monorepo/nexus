use crate::*;
use immutable_operators::*;
use reconcilable_trait::Reconcilable;

/**
 * Handles the repopulation as well as tracking of whether to pop/shift off more component values
 */
#[derive(Debug)]
pub struct ComponentManager<IteratorManagerGeneric, HeadTailGeneric> {
    pub iterator: IteratorManagerGeneric,
    pub ends: HeadTailGeneric,
}

impl<IteratorGeneric, BeforeIteratorManagerGeneric, EndIdentifier: Wrapper, EndsGeneric>
    Repopulatable<EndIdentifier> for ComponentManager<BeforeIteratorManagerGeneric, EndsGeneric>
where
    IteratorGeneric: DoubleEndedIterator,
    BeforeIteratorManagerGeneric: Repopulatable<
        EndIdentifier,
        OkGeneric = iterator_manager::IteratorResult<IteratorGeneric, IteratorGeneric::Item>,
        FailureGeneric = iterator_manager::IteratorManager<IteratorGeneric, Nothing>,
    >,
    EndsGeneric: MergeTrait<EndIdentifier::Wrapped<IteratorGeneric::Item>>,
{
    type OkGeneric =
        ComponentManager<IteratorManager<IteratorGeneric, Allow>, EndsGeneric::MergedObject>;
    type FailureGeneric = ComponentManager<IteratorManager<IteratorGeneric, Nothing>, EndsGeneric>;
    fn repopulate(
        self,
        identifier: EndIdentifier,
    ) -> Result<
        ComponentManager<IteratorManager<IteratorGeneric, Allow>, EndsGeneric::MergedObject>,
        ComponentManager<IteratorManager<IteratorGeneric, Nothing>, EndsGeneric>,
    > {
        match self.iterator.repopulate(identifier) {
            Ok(result) => Ok(ComponentManager {
                iterator: result.manager,
                ends: self.ends.merge(EndIdentifier::wrap(result.value)),
            }),
            Err(manager) => Err(ComponentManager {
                iterator: manager,
                ends: self.ends,
            }),
        }
    }
}

impl<IteratorGeneric: DoubleEndedIterator> From<IteratorGeneric>
    for ComponentManager<IteratorManager<IteratorGeneric, Allow>, HeadTail<Nothing, Nothing>>
{
    fn from(iterator: IteratorGeneric) -> Self {
        ComponentManager {
            iterator: IteratorManager::new(iterator),
            ends: HeadTail::nothing(),
        }
    }
}

enum ManagerReconcileFailureState<E, U> {
    Empty(E),
    Unreconciled(U),
}

impl<Value, ManagerGeneric, EndsGeneric> Reconcilable<Value>
    for ComponentManager<ManagerGeneric, EndsGeneric>
where
    EndsGeneric: Reconcilable<Value>,
{
    type Unreconciled = ComponentManager<ManagerGeneric, EndsGeneric::Unreconciled>;
    type Reconciled = ComponentManager<ManagerGeneric, EndsGeneric::Reconciled>;

    fn reconcile(self, value: Value) -> Result<Self::Reconciled, Self::Unreconciled> {
        let result = self.ends.reconcile(value);

        match result {
            Ok(reconciled) => Ok(ComponentManager {
                iterator: self.iterator,
                ends: reconciled,
            }),
            Err(unreconciled) => Err(ComponentManager {
                iterator: self.iterator,
                ends: unreconciled,
            }),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use reconcilable_trait::mocks::AlwaysReconcileValue;
    use std::collections::VecDeque;

    #[test]
    fn todo_reconcile_h() {
        let list = VecDeque::from([AlwaysReconcileValue::<i32>::new()]);
        let manager = ComponentManager::from(list.into_iter());

        let (_, Head(val)) = manager
            .repopulate(HEAD)
            .unwrap()
            .reconcile(Head(4))
            .unwrap()
            .ends
            .split();

        assert_eq!(val, 4);
    }

    #[test]
    fn todo_reconcile_t() {
        let list = VecDeque::from([AlwaysReconcileValue::<i32>::new()]);
        let manager = ComponentManager::from(list.into_iter());

        let (_, Head(val)) = manager
            .repopulate(HEAD)
            .unwrap()
            .reconcile(Head(4))
            .unwrap()
            .ends
            .split();

        assert_eq!(val, 4);
    }

    #[test]
    fn repopulate_success() {
        let list = VecDeque::from([1, 2, 3]);
        let manager = ComponentManager::from(list.into_iter());

        let manager = manager.repopulate(TAIL).unwrap();
        assert_eq!(manager.ends.tail, 3);

        let manager = manager.repopulate(HEAD).unwrap();
        assert_eq!(manager.ends.head, 1);
    }

    #[test]
    fn repopulate_t_error_when_empty() {
        let manager =
            ComponentManager::from(VecDeque::<AlwaysReconcileValue<i32>>::from([]).into_iter());

        manager.repopulate(TAIL).unwrap_err();
    }

    #[test]
    fn repopulate_h_error_when_empty() {
        let manager =
            ComponentManager::from(VecDeque::<AlwaysReconcileValue<i32>>::from([]).into_iter());

        manager.repopulate(HEAD).unwrap_err();
    }
}
