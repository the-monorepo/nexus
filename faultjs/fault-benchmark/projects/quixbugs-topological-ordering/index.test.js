import expect from 'expect';
import { topologicalOrdering } from './index';

const node = (value) => {
  return {
    value,
    incomingNodes: [],
    outgoingNodes: [],
  };
}

describe('rpnEval', () => {
  it('1', () => {
    const five = node(5)
    const seven = node(7)
    const three = node(3)
    const eleven = node(11)
    const eight = node(8)
    const two = node(2)
    const nine = node(9)
    const ten = node(10)
  
    five.outgoingNodes = [eleven]
    seven.outgoingNodes = [eleven, eight]
    three.outgoingNodes = [eight, ten]
    eleven.incomingNodes = [five, seven]
    eleven.outgoingNodes = [two, nine, ten]
    eight.incomingNodes = [seven, three]
    eight.outgoingNodes = [nine]
    two.incomingNodes = [eleven]
    nine.incomingNodes = [eleven, eight]
    ten.incomingNodes = [eleven, three]  
    
    expect(topologicalOrdering([five, seven, three, eleven, eight, two, nine, ten])).toEqual([five, seven, three, eleven, eight, ten, two, nine]);
  })

  it('2', () => {
    const five = node(5)
    const zero = node(0)
    const four = node(4)
    const one = node(0)
    const two = node(2);
    const three = node(3);
  
    five.outgoingNodes = [two, zero]
    four.outgoingNodes = [zero, one]
    two.incomingNodes = [five]
    two.outgoingNodes = [three]
    zero.incomingNodes = [five, four]
    one.incomingNodes = [four, three]
    three.incomingNodes = [two]
    three.outgoingNodes = [one]  

    expect(topologicalOrdering([zero, one, two, three, four, five])).toEqual([four, five, zero, two, three, one])
  });


  it('3', () => {
    
    const milk = node("3/4 cup milk")
    const egg = node("1 egg")
    const oil = node("1 Tbl oil")
    const mix = node("1 cup mix")
    const syrup = node("heat syrup")
    const griddle = node("heat griddle")
    const pour = node("pour 1/4 cup")
    const turn = node("turn when bubbly")
    const eat = node("eat")
  
    milk.outgoingNodes = [mix]
    egg.outgoingNodes = [mix]
    oil.outgoingNodes = [mix]
    mix.incomingNodes = [milk, egg, oil]
    mix.outgoingNodes = [syrup, pour]
    griddle.outgoingNodes = [pour]
    pour.incomingNodes = [mix, griddle]
    pour.outgoingNodes = [turn]
    turn.incomingNodes = [pour]
    turn.outgoingNodes = [eat]
    syrup.incomingNodes = [mix]
    syrup.outgoingNodes = [eat]
    eat.incomingNodes = [syrup, turn]
    
    expect(topologicalOrdering([milk, egg, oil, mix, syrup, griddle, pour, turn, eat])).toEqual([milk, egg, oil, griddle, mix, pour, syrup, turn, eat]);
  });
});
