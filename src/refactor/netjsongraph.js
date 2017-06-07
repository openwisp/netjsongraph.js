import { sigma as Sigma } from 'sigma';
import netjsonData from '../../examples/data/netjson.json';
import 'forceLayoutWorker';
import 'forceLayoutSupervisor';
import './netjsongraph.css';

const N = 100;
const s = new Sigma('container');

netjsonData.nodes.forEach((n, i) => {
  s.graph.addNode({
    id: n.id,
    label: n.id,
    size: 1,
    color: 'red',
    x: 100 * Math.cos(2 * i * Math.PI / N),
    y: 100 * Math.sin(2 * i * Math.PI / N)
  });
});

netjsonData.links.forEach((l, i) => {
  s.graph.addEdge({
    id: i,
    source: l.source,
    target: l.target
  });
});

// s.startForceAtlas2({worker: true, barnesHutOptimize: false});  // force layout
s.refresh();
