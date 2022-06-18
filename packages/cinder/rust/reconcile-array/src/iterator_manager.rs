use crate::*;

#[derive(Debug)]
pub struct IteratorManager<IteratorGeneric: DoubleEndedIterator, HasNext> {
    pub iterator: IteratorGeneric,
    pub has_next: HasNext,
}

#[derive(Debug)]
pub struct IteratorResult<IteratorGeneric: DoubleEndedIterator, ItemGeneric> {
    pub value: ItemGeneric,
    pub manager: IteratorManager<IteratorGeneric, Allow>
}

impl<IteratorGeneric: DoubleEndedIterator> IteratorManager<IteratorGeneric, Allow> {
    fn repopulate_base<WR, F: FnOnce(&mut IteratorGeneric) -> Option<IteratorGeneric::Item>, W: FnOnce(IteratorGeneric::Item) -> WR>(
        mut self,
        next: F,
        wrap_value: W, 
    ) -> Result<IteratorResult<IteratorGeneric, WR>, IteratorManager<IteratorGeneric, Nothing>> {
        match next(&mut self.iterator) {
            Some(value) => Ok(IteratorResult {
                manager: IteratorManager {
                    iterator: self.iterator,
                    has_next: Allow,
                },
                value: wrap_value(value),
            }),
            None => Err(IteratorManager {
                iterator: self.iterator,
                has_next: Nothing,
            }),
        }
    }

    pub fn new(iterator: IteratorGeneric) -> IteratorManager<IteratorGeneric, Allow> {
        return IteratorManager {
            iterator,
            has_next: Allow,
        };
    }
}

pub trait Repopulatable<OkGeneric, FailureGeneric, ItemGeneric, ResultValue> {
    fn repopulate<F : FnOnce(ItemGeneric) -> ResultValue>(
        self,
        wrap_value: F
    ) -> Result<OkGeneric, FailureGeneric>;
}

impl<IteratorGeneric: DoubleEndedIterator> Repopulatable<
    IteratorResult<IteratorGeneric, Head<IteratorGeneric::Item>>,
    IteratorManager<IteratorGeneric, Nothing>,
    IteratorGeneric::Item,
    Head<IteratorGeneric::Item>
> for IteratorManager<IteratorGeneric, Allow> {
    fn repopulate<F : FnOnce(IteratorGeneric::Item) -> Head<IteratorGeneric::Item>>(
        self,
        wrap_value: F
    ) -> Result<IteratorResult<IteratorGeneric, Head<IteratorGeneric::Item>>, IteratorManager<IteratorGeneric, Nothing>> {
        self.repopulate_base(IteratorGeneric::next, wrap_value)
    }
}

impl<IteratorGeneric: DoubleEndedIterator> Repopulatable<
    IteratorResult<IteratorGeneric, Tail<IteratorGeneric::Item>>,
    IteratorManager<IteratorGeneric, Nothing>,
    IteratorGeneric::Item,
    Tail<IteratorGeneric::Item>
> for IteratorManager<IteratorGeneric, Allow> {
    fn repopulate<F : FnOnce(IteratorGeneric::Item) -> Tail<IteratorGeneric::Item>>(
        self,
        wrap_value: F
    ) -> Result<IteratorResult<IteratorGeneric, Tail<IteratorGeneric::Item>>, IteratorManager<IteratorGeneric, Nothing>> {
        self.repopulate_base(IteratorGeneric::next_back, wrap_value)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::VecDeque;

    #[test]
    fn to_be_named() {
        let list = VecDeque::from([1, 2, 3]);
        let manager = IteratorManager::new(list.into_iter());

        let head_result = manager.repopulate(Head::new).unwrap();
        assert_eq!(head_result.value, Head(1));

        let tail_result = head_result.manager.repopulate(Tail::new).unwrap();
        assert_eq!(tail_result.value, Tail(3));

        let last_result = tail_result.manager.repopulate(Head::new).unwrap();
        assert_eq!(last_result.value, Head(2));

        last_result.manager.repopulate(Head::new).unwrap_err();
    }
}
