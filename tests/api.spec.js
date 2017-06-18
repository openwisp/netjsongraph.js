import Netjsongraph from '../src/netjsongraph.three.js';

test('Module importing', () => {
  expect(Netjsongraph).toBeDefined();
  expect(new Netjsongraph()).toBeInstanceOf(Netjsongraph);
});
