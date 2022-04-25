use crate::*;

#[derive(Debug)]
pub struct ComponentManager<IteratorGeneric: DoubleEndedIterator, HeadTailGeneric, HasNext> {
  pub iterator: IteratorManager<IteratorGeneric, HasNext>,
  pub ends: HeadTailGeneric,
}

impl<IteratorGeneric: DoubleEndedIterator, HeadGeneric: MergeHeadTrait<IteratorGeneric::Item>>
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
              ends: self.ends.merge_head(result.value),
          }),
          Err(manager) => Err(ComponentManager {
              iterator: manager,
              ends: self.ends,
          }),
      }
  }
}

impl<IteratorGeneric: DoubleEndedIterator> ComponentManager<IteratorGeneric, HeadTail<Nothing, Nothing>, Allow> {
  pub fn new(iterator: IteratorGeneric) -> ComponentManager<IteratorGeneric, HeadTail<Nothing, Nothing>, Allow> {
    return ComponentManager {
      iterator: IteratorManager::new(iterator),
      ends: HeadTail::nothing()
    }
  }
}

impl<IteratorGeneric: DoubleEndedIterator, TailGeneric: MergeTailTrait<IteratorGeneric::Item>>
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
              ends: self.ends.merge_tail(result.value),
          }),
          Err(manager) => Err(ComponentManager {
              iterator: manager,
              ends: self.ends,
          }),
      }
  }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::VecDeque;

    #[test]
    fn todo() {  
      let list = VecDeque::from([1, 2, 3]);  
      ComponentManager::new(list.into_iter());
    }
}
