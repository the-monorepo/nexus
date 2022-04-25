use crate::*;

pub struct IteratorManager<IteratorGeneric: DoubleEndedIterator, HasNext> {
  pub iterator: IteratorGeneric,
  pub has_next: HasNext,
}

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
