import { createBlueprint, componentResult, renderValue, FC } from '@cinder/core';

let currentHooks: any[] | undefined = undefined;
let currentHookIndex = 0;
const requestRerender: undefined | ((...vars: any[]) => any) = undefined;

export type HookDefinition = {
  mount();
  update();
  unmount();
};

const isSame = (previousData, currentData) => {
  if (previousData.length !== currentData.length) {
    return false;
  }

  for (let i = 0; i < previousData.length; i++) {
    if (previousData[i] !== currentData[i]) {
      return false;
    }
  }

  return true;
};

class UseEffectHook implements HookDefinition {
  private unmountCallback;
  constructor(private readonly callback, private readonly currentDependencies) {}

  mount() {
    this.unmountCallback = this.callback();
  }

  update(previousData) {
    if (isSame(this.currentDependencies, previousData)) {
      return;
    }
    this.unmountCallback();
    this.unmountCallback = this.callback();
  }

  unmount() {
    this.unmountCallback();
  }
}

export const useEffect = (callback, dependencies) => {
  currentHooks.push(new UseEffectHook(callback, dependencies));
  currentHookIndex++;
};

export const useState = (initialValue) => {
  const [previousState, setState] = (() => {
    if (previousHooks === undefined) {
      const previousHook = previousHooks[currentHookIndex];
      currentHooks[currentHookIndex] = previousHook;
      return previousHook;
    } else {
      const hook = [
        initialValue,
        (value) => {
          hook[0] = value;
          requestRerender();
        },
      ];
      currentHooks[currentHookIndex] = hook;
      return hook;
    }
  })();
  currentHookIndex++;
  return [previousState, setState];
};

const runComponent = (Component, props) => {
  const previousHooks = currentHooks;
  const previousIndex = currentHookIndex;

  currentHooks = [];
  currentHookIndex = 0;
  const componentResult = Component(props);
  currentHooks = previousHooks;
  currentHookIndex = previousIndex;

  return {
    componentResult,
    hooks: currentHooks,
  };
};

export const withHooks = <P, FCR>(Component: FC<P, FCR>): FC<P, any> => {
  const blueprint = createBlueprint(
    ({ props }, container, before) => {
      const { componentResult, hooks } = runComponent(Component, props);

      renderValue(previousValue, componentResult, container, before);
      return { previousResult: componentResult, hooks };
    },
    (state, { props }, container, before) => {
      const { componentResult, hooks } = runComponent(Component, props);
      state.previousResult = componentResult;
      state.hooks = hooks;

      renderOrReuseComponentResult(
        state.previousResult,
        componentResult,
        container,
        before,
      );
    },
  );

  const hookedComponent: FC<P, any> = (props: P) => {
    return componentResult(blueprint, { Component, props });
  };

  return hookedComponent;
};
