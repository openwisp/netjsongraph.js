'use strict';

import "../src/js/netjsongraph.core.js";

describe("Test netjsongraph utils dom functions", () => {
  const graph = new NetJSONGraph("", {});

  const NetJSONMetadataData = new Map([
    [
      // key
      [
        {
          "type":"NetworkGraph",
          "label":"Ninux Roma",
          "protocol":"OLSR",
          "version":"0.6.6.2",
          "metric":"ETX",
          "nodes": [],
          "links": [],
        }
      ],
      // value
      HTMLDivElement
    ],
  ]);
  
  const utilsDOMObj = {
    "Display metadata of NetJSONGraph.": ["NetJSONMetadata", NetJSONMetadataData],
  }

  for(let operationText in utilsDOMObj){
    test(operationText, () => {
      let [operationFunc, operationDataMap] = utilsDOMObj[operationText];
      for(let [key, value] of operationDataMap){   
        expect(graph.utils[operationFunc](...key)).toBeInstanceOf(value);
      }
    });
  }
})


describe("Test netjsongraph dom operate", () => {
  const graph = new NetJSONGraph({
    nodes: [],
    links: [],
  });
  graph.render();

  test("Click a node", () => {
    expect(graph.config.onClickElement.call(graph, "node", {
        id: "2"
    }))
    const closeBtn = document.getElementById('nodelinkOverlay-close');
    closeBtn.click();
  })

  test("Click a link", () => {
    expect(graph.config.onClickElement.call(graph, "link", {
      id: "2"
    }))
    const closeBtn = document.getElementById('nodelinkOverlay-close');
    closeBtn.click();
  })

  test('Close the metadata', () => {
    const metadataClose = document.getElementById('metadata-close');
    metadataClose.click();
  })
})
