export const customElement = (elementName: string) => {
  return (target) => {
    const { kind, elements } = target;
    return {
      kind,
      elements,
      finisher(clazz: { new(): HTMLElement }) {
        window.customElements.define(elementName, clazz);
      }
    }
  }
};
