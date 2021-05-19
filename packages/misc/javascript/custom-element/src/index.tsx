export const customElement = (elementName: string) => {
  return (target) => {
    const { kind, elements } = target;
    return {
      kind,
      elements,
      finisher(clazz: { new (): HTMLElement }) {
        globalThis.customElements.define(elementName, clazz);
      },
    };
  };
};
