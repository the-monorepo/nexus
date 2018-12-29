use crate::*;
use reconcilable_trait::Reconcilable;

/**
 * Handles the repopulation as well as tracking of whether to pop/shift off more component values
 */
#[derive(Debug)]
pub struct ComponentManager<
    ManagerGeneric,
    HeadTailGeneric
> {
    pub iterator: ManagerGeneric,
    pub ends: HeadTailGeneric,
}

impl<
    IteratorGeneric,
    BeforeIteratorManagerGeneric,
    EndIdentifier : Wrapper,
    EndsGeneric,
> Repopulatable<
    EndIdentifier
> for
    ComponentManager<BeforeIteratorManagerGeneric, EndsGeneric> where
    IteratorGeneric : DoubleEndedIterator,
    BeforeIteratorManagerGeneric : Repopulatable<
        EndIdentifier,
        OkGeneric = iterator_manager::IteratorResult<IteratorGeneric, IteratorGeneric::Item>,
        FailureGeneric = iterator_manager::IteratorManager<IteratorGeneric, Nothing>
    >,
    EndsGeneric: MergeTrait<EndIdentifier::Wrapped<IteratorGeneric::Item>>
{
    type OkGeneric = ComponentManager<IteratorManager<IteratorGeneric, Allow>, EndsGeneric::MergedObject>;
    type FailureGeneric = ComponentManager<IteratorManager<IteratorGeneric, Nothing>, EndsGeneric>;
    fn repopulate(
        self,
        identifier: EndIdentifier
    ) -> Result<
    ComponentManager<IteratorManager<IteratorGeneric, Allow>, EndsGeneric::MergedObject>,
    ComponentManager<IteratorManager<IteratorGeneric, Nothing>, EndsGeneric>
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

impl<IteratorGeneric : DoubleEndedIterator>
    ComponentManager<IteratorManager<IteratorGeneric, Allow>, HeadTail<Nothing, Nothing>>
{
    pub fn new(
        iterator: IteratorGeneric,
    ) -> ComponentManager<IteratorManager<IteratorGeneric, Allow>, HeadTail<Nothing, Nothing>> {
        return ComponentManager {
            iterator: IteratorManager::new(iterator),
            ends: HeadTail::nothing(),
        };
    }
}

enum ManagerReconcileFailureState<E, U> {
    Empty(E),
    Unreconciled(U),
}

impl<
    Value,
    ManagerGeneric,
    EndsGeneric
> Reconcilable<Value> for ComponentManager<ManagerGeneric, EndsGeneric> where
    EndsGeneric : Reconcilable<Value>
{
    type Unreconciled = ComponentManager<ManagerGeneric, EndsGeneric::Unreconciled>;
    type Reconciled =  ComponentManager<ManagerGeneric, EndsGeneric::Reconciled>;

    fn reconcile(self, value: Value) -> Result<
        Self::Reconciled,
        Self::Unreconciled
    > {
        let result = self.ends.reconcile(value);
        
        match result {
            Ok(reonciled) => {
                todo!();
            }
            Err(unreconciled) => {
                todo!();
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::VecDeque;
    use reconcilable_trait::mocks::AlwaysReconcileValue;
    
    #[test]
    fn todo_reconcile_h() {
        let list = VecDeque::from([AlwaysReconcileValue::<u32>::new()]);
        let manager = ComponentManager::new(list.into_iter());

        assert_eq!(manager.repopulate(HEAD).unwrap().reconcile(Head(4)).unwrap(), 4);
    }

    #[test]
    fn todo_reconcile_t() {
        let list = VecDeque::from([AlwaysReconcileValue::<u32>::new()]);
        let manager = ComponentManager::new(list.into_iter());

        assert_eq!(manager.repopulate(TAIL).unwrap().reconcile(Tail(4)).unwrap(), 4);
    }

    #[test]
    fn repopulate_success() {
        let list = VecDeque::from([1, 2, 3]);
        let manager = ComponentManager::new(list.into_iter());

        let manager = manager.repopulate(TAIL).unwrap();
        assert_eq!(manager.ends.tail, 3);

        let manager = manager.repopulate(HEAD).unwrap();
        assert_eq!(manager.ends.head, 1);
    }
    
    #[test]
    fn repopulate_t_error_when_empty() {
        let manager = ComponentManager::new(VecDeque::<AlwaysReconcileValue::<u32>>::from([]).into_iter());

        manager.repopulate(TAIL).unwrap_err();
    }

    #[test]
    fn repopulate_h_error_when_empty() {
        let manager = ComponentManager::new(VecDeque::<AlwaysReconcileValue::<u32>>::from([]).into_iter());

        manager.repopulate(HEAD).unwrap_err();
    }
}
