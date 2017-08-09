const fs = require('fs');

const nodesCount = 1000;
const linksCount = 2000;
const netjson = {
  type: 'NetworkGraph',
  label: 'Ninux Roma',
  protocol: 'OLSR',
  version: '0.0.0.0',
  metric: 'ETX'
};

const ran = () => Math.floor(Math.random() * 255);
const nodes = [];
for (let i = 0; i < nodesCount; ++i) {
  nodes.push({ id: `${ran()}.${ran()}.${ran()}.${ran()}` });
}

const randomNode = () => Math.floor(Math.random() * nodesCount);
const links = [];
for (let i = 0; i < linksCount; ++i) {
  links.push({
    source: nodes[randomNode()].id,
    target: nodes[randomNode()].id,
    cost: 1
  });
}

netjson.nodes = nodes;
netjson.links = links;

fs.writeFileSync(__dirname + '/netjson.json', JSON.stringify(netjson));
