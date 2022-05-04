use crate::*;
use reconcilable_trait::Reconcilable;

#[derive(Debug)]
pub struct ComponentManager<
    IteratorGeneric: DoubleEndedIterator,
    HeadTailGeneric,
    HasNext
> {
    pub iterator: IteratorManager<IteratorGeneric, HasNext>,
    pub ends: HeadTailGeneric,
}

impl<IteratorGeneric: DoubleEndedIterator, HeadGeneric: MergeTrait<Head<IteratorGeneric::Item>>>
    ComponentManager<IteratorGeneric, HeadGeneric, Allow>
{
    pub fn repopulate_h(
        self,
    ) -> Result<
        ComponentManager<IteratorGeneric, HeadGeneric::MergedObject, Allow>,
        ComponentManager<IteratorGeneric, HeadGeneric, Nothing>,
    > {
        match self.iterator.repopulate_h() {
            Ok(result) => Ok(ComponentManager {
                iterator: result.manager,
                ends: self.ends.merge(Head(result.value)),
            }),
            Err(manager) => Err(ComponentManager {
                iterator: manager,
                ends: self.ends,
            }),
        }
    }
}

impl<IteratorGeneric: DoubleEndedIterator>
    ComponentManager<IteratorGeneric, HeadTail<Nothing, Nothing>, Allow>
{
    pub fn new(
        iterator: IteratorGeneric,
    ) -> ComponentManager<IteratorGeneric, HeadTail<Nothing, Nothing>, Allow> {
        return ComponentManager {
            iterator: IteratorManager::new(iterator),
            ends: HeadTail::nothing(),
        };
    }
}

impl<IteratorGeneric: DoubleEndedIterator, TailGeneric: MergeTrait<Tail<IteratorGeneric::Item>>>
    ComponentManager<IteratorGeneric, TailGeneric, Allow>
{
    pub fn repopulate_t(
        self,
    ) -> Result<
        ComponentManager<IteratorGeneric, TailGeneric::MergedObject, Allow>,
        ComponentManager<IteratorGeneric, TailGeneric, Nothing>,
    > {
        match self.iterator.repopulate_t() {
            Ok(result) => Ok(ComponentManager {
                iterator: result.manager,
                ends: self.ends.merge(Tail(result.value)),
            }),
            Err(manager) => Err(ComponentManager {
                iterator: manager,
                ends: self.ends,
            }),
        }
    }
}

impl<
    Value,
    IteratorGeneric : DoubleEndedIterator,
    HeadGeneric : SplitTrait<Head<IteratorGeneric::Item>>
> Reconcilable<Head<Value>> for ComponentManager<IteratorGeneric, HeadGeneric, Allow> where
    IteratorGeneric::Item : Reconcilable<Value>,
{
    type Reconciled = <IteratorGeneric::Item as Reconcilable<Value>>::Reconciled;
    type Unreconciled = <IteratorGeneric::Item as Reconcilable<Value>>::Unreconciled;

    fn reconcile(self, value: Head<Value>) -> Result<
        Self::Reconciled,
        Self::Unreconciled
    > {
        let (other, Head(head)) = self.ends.split();

        head.reconcile(value.0)
    }
}

impl<
    Value,
    IteratorGeneric : DoubleEndedIterator,
    TailGeneric : SplitTrait<Tail<IteratorGeneric::Item>>
> Reconcilable<Tail<Value>> for ComponentManager<IteratorGeneric, TailGeneric, Allow> where
    IteratorGeneric::Item : Reconcilable<Value>,
{
    type Reconciled = <IteratorGeneric::Item as Reconcilable<Value>>::Reconciled;
    type Unreconciled = <IteratorGeneric::Item as Reconcilable<Value>>::Unreconciled;

    fn reconcile(self, value: Tail<Value>) -> Result<
        Self::Reconciled,
        Self::Unreconciled
    > {
        let (other, Tail(split)) = self.ends.split();

        split.reconcile(value.0)
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

        assert_eq!(manager.repopulate_h().unwrap().reconcile(Head(4)).unwrap(), 4);
    }

    #[test]
    fn todo_reconcile_t() {
        let list = VecDeque::from([AlwaysReconcileValue::<u32>::new()]);
        let manager = ComponentManager::new(list.into_iter());

        assert_eq!(manager.repopulate_t().unwrap().reconcile(Tail(4)).unwrap(), 4);
    }

    #[test]
    fn repopulate_success() {
        let list = VecDeque::from([1, 2, 3]);
        let manager = ComponentManager::new(list.into_iter());

        let manager = manager.repopulate_t().unwrap();
        assert_eq!(manager.ends.tail, 3);

        let manager = manager.repopulate_h().unwrap();
        assert_eq!(manager.ends.head, 1);
    }
    
    #[test]
    fn repopulate_t_error_when_empty() {
        let manager = ComponentManager::new(VecDeque::<AlwaysReconcileValue::<u32>>::from([]).into_iter());

        manager.repopulate_t().unwrap_err();
    }

    #[test]
    fn repopulate_h_error_when_empty() {
        let manager = ComponentManager::new(VecDeque::<AlwaysReconcileValue::<u32>>::from([]).into_iter());

        manager.repopulate_h().unwrap_err();
    }
}
