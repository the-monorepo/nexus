const elementComponent = (html, attributes, children) => {
	const template = document.createElement('template');
  template.innerHTML = html;
  return {
    
  };
};

const component = (html, attributes, children) => ({
	const template = document.createElement('template');
	template.innerHTML = html;
	return { template, attributes, children };
});


function attributeReaction(element, data, attributeName) {
  return reaction(() => data[attributeName], (value) => element.setAttribute(attributeName, value));
}

function childrenReaction(marker, childrenCallback) {
  let afterMarker = marker.nextSibling;
  let unmount;
  const dispose = reaction(childrenCallback, (renderInfo) => {
    if (unmount) {
      unmount.dispose();
    }
    render(marker.parentNode, renderInfo, marker);
  });
  return {
    dispose: () => {
      if (unmount.dispose) {
        unmount.dispose();
      }
      dispose();
      removeFromUntilBefore(marker, afterMarker);
    }
  }
}

const Test = (props) => (
  <div class={props.somethingClass}><span yay={something1} $yay={something2} $$yay={something3}></span>Rawr {repeat(props.list, (val) => <div>{val}</div>)}</div>
);

const Test = (props) => (
  React.createElement(
    'div',
    { class: props.somethingClass },
    'Rawr ',
    props.list.map((val) => (
      React.createElement(
        'div',
        undefined,
        val
      )
    ))
  )
);

const component$1 = mbx.elementComponent(
  '<div><!----></div>',
);
// Translates to:
const component$2 = mbx.elementComponent(
  '<div>Rawr <!----></div>',
);
const Test = (props) => {
  (() => {
    const root$1 = component$2.init();
    const span$1 = root$1.children[1];
    const marker$1 = root$1.children[2];
    
    return mbx.renderComponent(
      root$1,
      mbx.fields(div$1,
        mbx.attribute('class', () => props.class),
      ),
      mbx.fields(span$1,
        mbx.attribute('yay', () => props.something1),
        mbx.property('yay', () => props.something2),
        mbx.event('yay', () => props.something3),
      ),
      mbx.children(marker$1, 
        () => mbx.repeat(props.list, (val) => {
          const root$1 = component$1.init();
          const marker$1 = root$1.children[0];
          
          return mbx.componentReactions(
            mbx.children(marker$1, mbx.child(() => val))
          );
        })   
      )
    );  
  })();
};

const template$1 = document.createElement('template');
const component$1 = component('<div>Rawr <!----></div>');
const Test = ({ children, somethingClass }) => {
	const fragment = document.importNode(template$1, true);
	const root = fargment.firstChild;
	const el$1 = root.children[1];
	reaction(
    () => somethingClass,
    () => el$1.setAttribute('somethingClass', somethingClass)
  );
	render(el$1, () => props.children);
}


component('<div>Rawr <!----></div>', ){ 
	init: (clonedElement, thisArg) => {
		const child$1 = clonedElement.children[1];
		render(clonedElement, );
	},
	template: m
}

const template$2 = document.createElement('template');
template$2.innerHTML = 'Hello';










const Something = ({ children }) => <div>{children}</div>;

const component$1 = elementComponent('<div><!----></div>');
const Something = (props) => {
  const div$1 = component$1.create();
  return mbx.dynamicSections(
    mbx.children(div$1, () => props.children)
  );
}

const Rawr = ({ spanMessage1, spanMessage2, spanClass, something }) => (
  <div>
    Rawr
    <Something something={something}>
      <span class={spanClass}>{spanMessage1}{spanMessage2}</span>
    </Something>
  </div>
);

const component$2 = elementComponent('<div>Rawr<!----></div>');
const component$3 = elementComponent('<span><!----></span>');
const Rawr = (props) => {
  const div$1 = component$2.create();
  const placeholder$1 = div$1.children[1];

  const root$1 = component$3.create();
  const span$1 = root$1.children[0];
  const marker$2 = span$1.children[0];
  
  return mbx.dynamicNode(
    root$1,
    mbx.subComponent(
      placeholder$1,
      Something,
      root$1,
      mbx.attribute('something', () => something)
    ),
    mbx.children(marker$2, () => props.children)
  );
};