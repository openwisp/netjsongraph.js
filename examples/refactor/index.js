import Netjsongraph from '../../src/netjsongraph.three.js';
import netjsonData from '../data/netjson.json';

new Netjsongraph()
  .load(netjsonData)
  .forceLayout()
  .render();
