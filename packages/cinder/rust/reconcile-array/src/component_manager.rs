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
    WrappedValue,
    EndsGeneric,
> Repopulatable<
    ComponentManager<IteratorManager<IteratorGeneric, Allow>, EndsGeneric::MergedObject>,
    ComponentManager<IteratorManager<IteratorGeneric, Nothing>, EndsGeneric>,
    IteratorGeneric::Item,
    WrappedValue
> for
    ComponentManager<BeforeIteratorManagerGeneric, EndsGeneric> where
    IteratorGeneric : DoubleEndedIterator,
    BeforeIteratorManagerGeneric : Repopulatable<
        IteratorResult<IteratorGeneric, WrappedValue>,
        IteratorManager<IteratorGeneric, Nothing>,
        IteratorGeneric::Item,
        WrappedValue,
    >,
    EndsGeneric: MergeTrait<WrappedValue>
{
    fn repopulate<F : FnOnce(IteratorGeneric::Item) -> WrappedValue>(
        self,
        wrap_with_identifier: F
    ) -> Result<
    ComponentManager<IteratorManager<IteratorGeneric, Allow>, EndsGeneric::MergedObject>,
    ComponentManager<IteratorManager<IteratorGeneric, Nothing>, EndsGeneric>
> {
        match self.iterator.repopulate(wrap_with_identifier) {
            Ok(result) => Ok(ComponentManager {
                iterator: result.manager,
                ends: self.ends.merge(result.value),
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

impl<
    Value,
    ManagerGeneric,
    EndsGeneric
> Reconcilable<Value> for ComponentManager<ManagerGeneric, EndsGeneric> where
    EndsGeneric : Reconcilable<Value>,
{
    type Reconciled = ComponentManager<ManagerGeneric, End>;
    type Unreconciled = EndsGeneric::Unreconciled;

    fn reconcile(self, value: Value) -> Result<
        Self::Reconciled,
        Self::Unreconciled
    > {
        let (other, head) = (self.ends as SplitTrait<EndsGeneric>).split();

        head.reconcile(value)
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

        assert_eq!(manager.repopulate(Head::new).unwrap().reconcile(Head(4)).unwrap(), 4);
    }

    #[test]
    fn todo_reconcile_t() {
        let list = VecDeque::from([AlwaysReconcileValue::<u32>::new()]);
        let manager = ComponentManager::new(list.into_iter());

        assert_eq!(manager.repopulate(Tail::new).unwrap().reconcile(Tail(4)).unwrap(), 4);
    }

    #[test]
    fn repopulate_success() {
        let list = VecDeque::from([1, 2, 3]);
        let manager = ComponentManager::new(list.into_iter());

        let manager = manager.repopulate(Head::new).unwrap();
        assert_eq!(manager.ends.tail, Head(3));

        let manager = manager.repopulate(Tail::new).unwrap();
        assert_eq!(manager.ends.head, Tail(1));
    }
    
    #[test]
    fn repopulate_t_error_when_empty() {
        let manager = ComponentManager::new(VecDeque::<AlwaysReconcileValue::<u32>>::from([]).into_iter());

        manager.repopulate(Tail::new).unwrap_err();
    }

    #[test]
    fn repopulate_h_error_when_empty() {
        let manager = ComponentManager::new(VecDeque::<AlwaysReconcileValue::<u32>>::from([]).into_iter());

        manager.repopulate(Head::new).unwrap_err();
    }
}
