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

impl<IteratorGeneric: DoubleEndedIterator, TailGeneric: WithTailTrait<IteratorGeneric::Item>>
  ComponentManager<IteratorGeneric, TailGeneric, Allow>
{
  pub fn repopulate_t(
      self,
  ) -> Result<
      ComponentManager<IteratorGeneric, TailGeneric::TailObject, Allow>,
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