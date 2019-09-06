'use strict';

import NetJSONGraph from "../src/js/netjsongraph.core.js";



const graph = new NetJSONGraph({
  "type":"NetworkGraph",
  "label":"Ninux Roma",
  "protocol":"OLSR",
  "version":"0.6.6.2",
  "metric":"ETX",
  "nodes": [],
  "links": [],
});

// Package NetJSONGraph instance object.
graph.event = graph.utils.createEvent();
graph.setConfig({
  onRender: function() {
    return this.config;
  },
  onLoad: function() {
    return this.config;
  },
});
graph.setUtils();
graph.render();

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

  const loadingData = new Map([
    [
      // key
      [],
      // value
      HTMLDivElement
    ]
  ]);
  
  const utilsDOMObj = {
    "Display metadata of NetJSONGraph.": ["NetJSONMetadata", NetJSONMetadataData],
    "Display loading animation": ["showLoading", loadingData],
    "Cancel loading animation": ["hideLoading", loadingData],
  }

  for(let operationText in utilsDOMObj){
    test("Hide loading -- no dom", () => {
      graph.utils.hideLoading.call(graph);
    })
    test(operationText, () => {
      let [operationFunc, operationDataMap] = utilsDOMObj[operationText];
      for(let [key, value] of operationDataMap){  
        expect(graph.utils[operationFunc].call(graph, ...key)).toBeInstanceOf(value);
      }
    });
    test("Show loading again", () => {
      graph.utils.showLoading.call(graph);
    })
  }
})


describe("Test netjsongraph dom operate", () => {
  test("Click a node", () => {
    graph.config.onClickElement.call(graph, "node", {
        id: "2"
    })
    const closeBtn = document.getElementById('nodelinkOverlay-close');
    closeBtn.click();
  })

  test("Click a link", () => {
    graph.config.onClickElement.call(graph, "link", {
      id: "2"
    })
    const closeBtn = document.getElementById('nodelinkOverlay-close');
    closeBtn.click();
  })

  test('Close the metadata', () => {
    const metadataClose = document.getElementById('metadata-close');
    metadataClose.click();
  })
})

