import Netjsongraph from '../src/netjsongraph.three.js';

test('Module importing', () => {
  expect(Netjsongraph).toBeDefined();
  expect(new Netjsongraph()).toBeInstanceOf(Netjsongraph);
});

describe('API', () => {
  test('constructor', () => {
    const ng = new Netjsongraph();
    expect(ng).toHaveProperty('width', 960);
    expect(ng).toHaveProperty('height', 600);
    expect(ng).toHaveProperty('container', document.body);
    expect(ng).toHaveProperty('data');
  });

  test('set', () => {
    const ng = new Netjsongraph();
    ng.set({ width: 1000 });
    expect(ng).toHaveProperty('width', 1000);
  });

  test('el', () => {
    const ng = new Netjsongraph();
    const _div = document.createElement('div');
    _div.id = 'testDiv';
    document.body.appendChild(_div);

    ng.el(_div);
    const div = document.getElementById('testDiv');
    expect(ng).toHaveProperty('container', div);
  });

  test('load', () => {
    const d = {
      nodes: [],
      links: []
    };
    const ng = new Netjsongraph();
    ng.load(d);
    expect(ng).toHaveProperty('data', d);
  });
});
