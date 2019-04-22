const Test = ({ awesome, children}) => (
  <div class={awesome}>
    Rawr! {children.map((test) => <div rawr={test}/>)}
  </div>
);