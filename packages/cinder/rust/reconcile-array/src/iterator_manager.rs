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

impl<IteratorGeneric: DoubleEndedIterator, EndWrappedGeneric> IteratorManager<IteratorGeneric, Allow> {
    fn repopulate_base<F: FnOnce(&mut IteratorGeneric) -> Option<IteratorGeneric::Item>>(
        mut self,
        next: F,
    ) -> Result<IteratorResult<IteratorGeneric, EndWrappedGeneric>, IteratorManager<IteratorGeneric, Nothing>> {
        match next(&mut self.iterator) {
            Some(value) => Ok(IteratorResult {
                manager: IteratorManager {
                    iterator: self.iterator,
                    has_next: Allow,
                },
                value: value,
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

pub trait HeadTailRepopulate<IteratorGeneric: DoubleEndedIterator, EndIdentifier> {
    fn repopulate(
        self,
    ) -> Result<IteratorResult<IteratorGeneric, EndIdentifier>, IteratorManager<IteratorGeneric, Nothing>>;
}

pub trait Repopulatable<IteratorGeneric: DoubleEndedIterator, EndIdentifier> {
    type Value;
    fn repopulate<F : Fn(IteratorGeneric::Item) -> EndIdentifier>(
        self,
        wrap_value: F
    ) -> Result<IteratorResult<IteratorGeneric, Self::Value>, IteratorManager<IteratorGeneric, Nothing>>;
}

impl<IteratorGeneric: DoubleEndedIterator> HeadTailRepopulate<IteratorGeneric, Head<()>> for IteratorManager<IteratorGeneric, Allow> {
    fn repopulate(
        self
    ) -> Result<IteratorResult<IteratorGeneric, IteratorGeneric::Item>, IteratorManager<IteratorGeneric, Nothing>> {
        self.repopulate_base(Self::next)
    }
}

impl<IteratorGeneric: DoubleEndedIterator> HeadTailRepopulate<IteratorGeneric, Tail<()>> for IteratorManager<IteratorGeneric, Allow> {
    fn repopulate(
        self
    ) -> Result<IteratorResult<IteratorGeneric, IteratorGeneric::Item>, IteratorManager<IteratorGeneric, Nothing>> {
        self.repopulate_base(IteratorGeneric::next_back)
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

        let head_result = manager.repopulate::<Head<()>>().unwrap();
        assert_eq!(head_result.value, 1);

        let tail_result = head_result.manager.repopulate::<Tail<()>>().unwrap();
        assert_eq!(tail_result.value, 3);

        let last_result = tail_result.manager.repopulate::<Head<()>>().unwrap();
        assert_eq!(last_result.value, 2);

        last_result.manager.repopulate(Head(())).unwrap_err();
    }
}
