import { shortestPathLengths } from './index';
import expect from 'expect';

describe('shortestPathLengths', () => {
  it('1', () => {
    const graph = new Map();
    graph.set('0,2', 3);
    graph.set('0,5', 5);
    graph.set('2,1', -2);
    graph.set('2,3', 7);
    graph.set('2,4', 4);
    graph.set('3,4', -5);
    graph.set('4,5', -1);
    const lengthByPath = shortestPathLengths(6, graph);
    for (const [edge, value] of lengthByPath.keys()) {
      const [node1, node2] = edge.split(',');
      if(node1 === '3' && node2 === '3') {
        //Correct (3,3) 0  and bad (3,3) -10
        expect(value).toBe(0);
      }		
    }  
  });

  it('2', () => {
    const graph2 = new Map();
    graph2.set('0,1', 3);
    graph2.set('1,2', 5);
    graph2.set('2,3', -2);
    graph2.set('3,4', 7);
  
    const lengthByPath = shortestPathLengths(5, graph2);
    for (const [edge, value] of lengthByPath) {
      const [node1, node2] = edge.split(',');
      if(node1 === '1' && node2 === '4') {
        //Correct (1,4) 10  and bad (1,4) inf
        expect(value).toBe(10);
      }
    }		  
  });


  it('3', () => {
    const graph3 = new Map();
    graph3.set('0,1', 3);
    graph3.set('2,3', 5);
  
    const lengthByPath = shortestPathLengths(4, graph3);
    for (const [edge, value] of lengthByPath.keys()) {
      const [node1, node2] = edge.split(',');
      if(node1 === '1' && node2 === '0') {
        //Correct (1,0) inf  and bad (1,0) 3
        expect(value).toBe(Number.POSITIVE_INFINITY)
      }		
    }  
  });

  it('4', () => {
    const graph4 = new Map();
    graph4.set('0,1', 3);
    graph4.set('1,2', 5);
    graph4.set('2,0', -1);
  
    const lengthByPath = shortestPathLengths(3, graph4);
    for (const [edge, value] of lengthByPath.keys()) {
      const [node1, node2] = edge.split(',');
      if(node1==='2'&&node2==='1') {
        //Correct (2,1) 2  and bad (2,1) 1
        expect(value).toBe(2);
      }		
    }  
  });
});