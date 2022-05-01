use crate::*;

#[derive(Debug)]
pub struct IteratorManager<IteratorGeneric: DoubleEndedIterator, HasNext> {
    pub iterator: IteratorGeneric,
    pub has_next: HasNext,
}

#[derive(Debug)]
pub struct IteratorResult<IteratorGeneric: DoubleEndedIterator> {
    pub value: IteratorGeneric::Item,
    pub manager: IteratorManager<IteratorGeneric, Allow>,
}

impl<IteratorGeneric: DoubleEndedIterator> IteratorManager<IteratorGeneric, Allow> {
    pub fn repopulate<F: FnOnce(&mut IteratorGeneric) -> Option<IteratorGeneric::Item>>(
        mut self,
        next: F,
    ) -> Result<IteratorResult<IteratorGeneric>, IteratorManager<IteratorGeneric, Nothing>> {
        match next(&mut self.iterator) {
            Some(value) => Ok(IteratorResult {
                manager: IteratorManager {
                    iterator: self.iterator,
                    has_next: Allow,
                },
                value,
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

    pub fn repopulate_t(
        self,
    ) -> Result<IteratorResult<IteratorGeneric>, IteratorManager<IteratorGeneric, Nothing>> {
        self.repopulate(IteratorGeneric::next_back)
    }

    pub fn repopulate_h(
        self,
    ) -> Result<IteratorResult<IteratorGeneric>, IteratorManager<IteratorGeneric, Nothing>> {
        self.repopulate(IteratorGeneric::next)
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

        let head_result = manager.repopulate_h().unwrap();
        assert_eq!(head_result.value, 1);

        let tail_result = head_result.manager.repopulate_t().unwrap();
        assert_eq!(tail_result.value, 3);

        let last_result = tail_result.manager.repopulate_h().unwrap();
        assert_eq!(last_result.value, 2);

        last_result.manager.repopulate_h().unwrap_err();
    }
}
