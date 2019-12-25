import { shortestPaths } from './index';
import expect from 'expect';

describe('shortestPaths', () => {
  it('1', () => {
    const graph = new Map();
    graph.set("AC", 3);
		graph.set("AF", 5);
		graph.set("CB", -2);
		graph.set("CD", 7);
		graph.set("CE", 4);
		graph.set("DE", -5);
		graph.set("EF", -1);
    
    const weightByNode = shortestPaths("A", graph);
    const result = [...weightByNode]
      .sort();

    expect([['A', 0], ['B', 1], ['C', 3], ['D', 10], ['E', 5], ['F', 4]]).toEqual(result);
  });

  it('2', () => {
    const graph = new Map();
		graph.set("AB", 1);
		graph.set("BC", 2);
		graph.set("CD", 3);
		graph.set("DE", -1);
		graph.set("EF", 4);

    const weightByNode = shortestPaths("A", graph);
    const result = [...weightByNode]
      .sort();

    expect([['A', 0], ['B', 1], ['C', 3], ['D', 6], ['E', 5], ['F', 9]]).toEqual(result);
  });

  it('3', () => {
    const graph = new Map();
		graph.set("AB", 1);
		graph.set("BC", 2);
		graph.set("CD", 3);
		graph.set("DE", -1);
		graph.set("EF", 4);
		graph.set("ED", 1);
    
    const weightByNode = shortestPaths("A", graph);
    const result = [...weightByNode]
      .sort();

    expect([['A', 0], ['B', 1], ['C', 3], ['D', 6], ['E', 5], ['F', 9]]).toEqual(result);
  });
});