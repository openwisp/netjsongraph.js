import { sigma as Sigma } from 'sigma';
import netjsonData from '../../examples/data/netjson.json';
import './netjsongraph.css';

const s = new Sigma('container');

netjsonData.nodes.forEach((n, i) => {
  s.graph.addNode({
    id: n.id,
    label: n.id
  });
});

netjsonData.links.forEach((l, i) => {
  s.graph.addEdge({
    id: i,
    source: l.source,
    target: l.target
  });
});

s.refresh();
