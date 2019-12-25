import expect from 'expect';
import { minimumSpanningTree } from './index';

describe('reverseLinkedList', () => {
  it('1', () => {  
    const edge11 = [1, 2, 10];
    const edge12 = [2, 3, 15];
    const edge13 = [3, 4, 10];
    const edge14 = [1, 4, 10];
  
    const graph = [edge11, edge12, edge13, edge14];
  
    expect([...minimumSpanningTree(graph)].sort()).toEqual([edge11, edge13, edge14].sort());
  });

  it('2', () => {
    const edge21 = [1, 2, 6];
    const edge22 = [1, 3, 1];
    const edge23 = [1, 4, 5];
    const edge24 = [2, 3, 5];
    const edge25 = [2, 5, 3];
    const edge26 = [3, 4, 5];
    const edge27 = [3, 5, 6];
    const edge28 = [3, 6, 4];
    const edge29 = [4, 6, 2];
    const edge210 = [5, 6, 6];

    const graph = [edge21, edge22, edge23, edge24, edge25, edge26, edge27, edge28, edge29, edge210];

    expect([...minimumSpanningTree(graph)].sort()).toEqual([edge25, edge22, edge24, edge29, edge28].sort());
  });

  it('3', () => {
    const edge31 = [1, 2, 6];
    const edge32 = [1, 3, 1];
    const edge33 = [2, 4, 2];

    const graph = [edge31, edge32, edge33];

    expect([...minimumSpanningTree(graph)].sort()).toEqual([edge31, edge32, edge33].sort());
  });
});
