let nodeLength = 10000, categoryLength = 10;
let nodes = [], links = [], JSONData = {
  "type":"NetworkGraph",
  "label":"Ninux Roma",
  "protocol":"OLSR",
  "version":"0.6.6.2",
  "metric":"ETX",
  "date":"2019-04-03T05:06:54.000Z",
};

for(let i = 0;i < nodeLength;i++){
  let node1 = {
    id: i,
    category: "category" + parseInt(Math.random() * categoryLength),
    name: Math.random().toString(36).slice(2,8),
    location: {
      lng: Math.random() * 180 - 90,
      lat: Math.random() * 360,
    }
  }, node2 = {
    id: nodeLength + i,
    category: "category" + parseInt(Math.random() * categoryLength),
    name: Math.random().toString(36).slice(2, 8),
    location: {
      lng: Math.random() * 180 - 90,
      lat: Math.random() * 360,
    }
  };

  let link = {
    source: node1.id,
    target: node2.id,
    cost: Math.random() * 10,
  }

  nodes.push(node1, node2);
  links.push(link);
}

console.log(JSON.stringify({
  ...JSONData,
  nodes,
  links
}));