import Netjsongraph from '../../../src/refactor/netjsongraph.three.js';

const ng = new Netjsongraph('../data/netjson.json', {
  static: false,
  initialAnimation: true
});
console.log(ng);
