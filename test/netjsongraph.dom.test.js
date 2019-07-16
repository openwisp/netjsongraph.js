'use strict';

import NetJSONGraph from "../src/js/netjsongraph.core.js";
import NetJSONGraphUtil from "../src/js/netjsongraph.util.js";

const graph = new NetJSONGraph({
  "type":"NetworkGraph",
  "label":"Ninux Roma",
  "protocol":"OLSR",
  "version":"0.6.6.2",
  "metric":"ETX",
  "nodes": [],
  "links": [],
});
graph.utils = Object.assign(new NetJSONGraphUtil(), graph.utils);
graph.setConfig({
  onInit: function() {
    return this.config;
  },
  onRender: function() {
    return this.config;
  },
  onLoad: function() {
    return this.config;
  },
});

describe("Test netjsongraph utils dom functions", () => {
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
    [
      // key
      [
        {
          "type":"NetworkGraph",
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
