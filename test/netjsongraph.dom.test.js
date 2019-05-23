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
  const switchRenderModeData = new Map([
    [
      // key
      [],
      // value
      HTMLDivElement
    ],
  ]);
  // const addViewEyeData = new Map([
  //   [
  //     // key
  //     [],
  //     // value
  //     HTMLDivElement
  //   ],
  // ]);
  const addSearchFuncData = new Map([
    [
      // key
      [],
      // value
      HTMLDivElement
    ],
  ]);
  
  const utilsDOMObj = {
    // "Deal JSONData by WebWorker and render.": ["dealDataByWorker", nodeInfoData],
    // "Callback function executed when data update.Update Information and view.": ["JSONDataUpdate", linkInfoData],
    "Display metadata of NetJSONGraph.": ["NetJSONMetadata", NetJSONMetadataData],
    "Switch rendering mode -- Canvas or Svg.": ["switchRenderMode", switchRenderModeData],
    // "Add viewEye icon to change graph or map mode.": ["addViewEye", addViewEyeData],
    // "Add search function for elements.": ["addSearchFunc", addSearchFuncData],
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
  test("Click a node", () => {
    const graph = new NetJSONGraph("");

    expect(graph.config.onClickNode.call(graph, {
      id: "1"
    }))
    const closeBtn = document.getElementById('nodeOverlay-close');
    closeBtn.click();
  })

  const svgGraph = new NetJSONGraph("", {
    svgRender: true
  });
  test("Click a link", () => {
    expect(svgGraph.config.onClickLink.call(svgGraph, {
      id: "2"
    }))
    const closeBtn = document.getElementById('linkOverlay-close');
    closeBtn.click();
  })

  test("Switch rendering mode -- Canvas or Svg.", () => {
    const checkInput = document.getElementById('switch');
    
    checkInput.onchange(checkInput);
  })

  test('Close the metadata', () => {
    const metadataClose = document.getElementById('metadata-close');
    metadataClose.click();
  })
})
