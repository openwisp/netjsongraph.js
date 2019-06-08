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
  const graph = new NetJSONGraph();
  graph.render();

  test("Click a node", () => {
    expect(graph.config.onClickNode.call(graph, {
      id: "1"
    }))
    const closeBtn = document.getElementById('nodeOverlay-close');
    closeBtn.click();
  })

  test("Click a link", () => {
    expect(graph.config.onClickLink.call(graph, {
      id: "2"
    }))
    const closeBtn = document.getElementById('linkOverlay-close');
    closeBtn.click();
  })

  test('Close the metadata', () => {
    const metadataClose = document.getElementById('metadata-close');
    metadataClose.click();
  })
})
