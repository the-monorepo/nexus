use crate::*;

#[derive(Debug)]
pub struct Allow;

#[derive(Debug)]
pub struct ComponentState<C, CVh, CVt> {
  component: C,
  skip: HeadTail<CVh, CVt>,
}

impl<C> ComponentState<C, Allow, Allow> {
  pub fn component(component: C) -> ComponentState<C, Allow, Allow> {
      ComponentState {
          component,
          skip: HeadTail::new(Allow, Allow),
      }
  }
}

impl<C, CVt, Value> ComponentState<C, Allow, CVt>
where
  C: Reconcilable<Value = Value, Unreconciled = ReconcilePayload<C, Value>>,
{
  pub fn reconcile_vh(
      self,
      value: Value,
  ) -> Result<
      ReconciledAndNewState<C::Reconciled, ComponentState<Nothing, Allow, CVt>>,
      ReconciledAndNewState<Value, ComponentState<C, Nothing, CVt>>,
  > {
      match self.component.reconcile(value) {
          Ok(reconciled) => Ok(ReconciledAndNewState {
              data: reconciled,
              state: ComponentState {
                  component: Nothing,
                  skip: self.skip,
              },
          }),
          Err(err) => Err(ReconciledAndNewState {
              data: err.new_value,
              state: ComponentState {
                  component: err.old_component,
                  skip: self.skip.drop_head(),
              },
          }),
      }
  }
}

impl<C, CVh, Value> ComponentState<C, CVh, Allow>
where
  C: Reconcilable<Value = Value, Unreconciled = ReconcilePayload<C, Value>>,
{
  pub fn reconcile_vt(
      self,
      value: Value,
  ) -> Result<
      ReconciledAndNewState<C::Reconciled, ComponentState<Nothing, CVh, Allow>>,
      ReconciledAndNewState<Value, ComponentState<C, CVh, Nothing>>,
  > {
      match self.component.reconcile(value) {
          Ok(reconciled) => Ok(ReconciledAndNewState {
              data: reconciled,
              state: ComponentState {
                  component: Nothing,
                  skip: self.skip,
              },
          }),
          Err(err) => Err(ReconciledAndNewState {
              data: err.new_value,
              state: ComponentState {
                  component: err.old_component,
                  skip: self.skip.drop_tail(),
              },
          }),
      }
  }
}

impl<C, CVt> ComponentState<C, Allow, CVt> {
  pub fn skip_vh(self) -> ComponentState<C, Nothing, CVt> {
      ComponentState {
          component: self.component,
          skip: self.skip.drop_head(),
      }
  }
}

impl<C, CVt> ComponentState<C, Nothing, CVt> {
  pub fn allow_vh(self) -> ComponentState<C, Allow, CVt> {
      ComponentState {
          component: self.component,
          skip: self.skip.merge_head(Allow),
      }
  }
}

impl<C, CVh> ComponentState<C, CVh, Allow> {
  pub fn skip_vt(self) -> ComponentState<C, CVh, Nothing> {
      ComponentState {
          component: self.component,
          skip: self.skip.drop_tail(),
      }
  }
}

impl<C, CVh> ComponentState<C, CVh, Nothing> {
  pub fn allow_vt(self) -> ComponentState<C, CVh, Allow> {
      ComponentState {
          component: self.component,
          skip: self.skip.merge_tail(Allow),
      }
  }
}

impl ComponentState<Nothing, Nothing, Nothing> {
  pub fn new_component<C>(self, component: C) -> ComponentState<C, Allow, Allow> {
      ComponentState::component(component)
  }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn smoke_test() {
      // TODO: Tests could be more explicit
      ComponentState::component(Nothing)
          .skip_vt()
          .skip_vh()
          .new_component("replaced")
          .skip_vt()
          .skip_vh()
          .allow_vt()
          .allow_vh();
    }
}
