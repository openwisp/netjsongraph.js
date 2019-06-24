'use strict';

import NetJSONGraph from "../src/js/netjsongraph.core.js";
import NetJSONGraphUpdate from "../src/js/netjsongraph.update.js";

const JSONFILE = "test",
      JSONData = {
        date: "2019-04-03T05:06:54.000Z",
        nodes: [],
        links: [],
      };

window.fetch = jest.fn(url => url === JSONFILE ? 
  Promise.resolve(JSONData) : 
  Promise.reject("Fetch json file wrong!")
);

const graph = new NetJSONGraph(JSONFILE);
graph.utils = Object.assign(new NetJSONGraphUpdate(), graph.utils);
graph.setConfig({
  el: document.getElementsByTagName("body")[0],
  nodeSize: 5,
  render: () => {}
})

describe("Test netjsongraph render", () => {
  test("netjsongraph.js render function", () => {
    expect(graph.render());

    // re render
    expect(graph.utils.NetJSONRender());
  })
})

describe("Modify netjsongraph configs", () => {
  test("NetJSONGraph support dynamic modification of config parameters", () => {
    graph.setConfig({nodeSize: 1});
    graph.setConfig();
    expect(graph.config.nodeSize).toBe(1);
  });
})

describe("Test netjsongraph JSONDataUpdate", () => {
  graph.render();

  test("Callback function executed when data update.Update Information and view.", () => {
    expect(graph.utils.JSONDataUpdate.call(graph, {
      metadata: {},
      date: "2019-04-03T09:06:54.000Z",
      nodes: [{id: "1"}],
      links: [{id: "2"}],
    }))
  })
  test("Update metadata test.", () => {
    expect(graph.utils.JSONDataUpdate.call(graph, {
      metadata: {},
      nodes: [],
      links: [],
    }))
  })
  test("Update metadata test.", () => {
    graph.setConfig({
      metadata: false
    })
    expect(graph.utils.JSONDataUpdate.call(graph, {
      metadata: {},
      nodes: [],
      links: [],
    }))
  })
})

describe("Test netjsongraph JSONParamParse", () => {
  test("Perform different operations to call NetJSONDataParse function according to different Param types.", () => {
    const {JSONParamParse} = graph.utils;

    JSONParamParse(JSONFILE).then(data => {
      expect(data).toEqual(JSONData);
    })
    JSONParamParse("false").catch(e => {
      expect(e).toMatch("Fetch json file wrong!")
    })

    let json = {
      "test": true
    };

    JSONParamParse(json).then(data => {
      expect(data).toBe(json);
    })
  })
})

describe("Test netjsongraph searchElements", () => {
  test("Add search function for new elements.", () => {
    let searchFunc = graph.utils.searchElements("test");

    searchFunc("false").catch(e => {
      expect(e).toMatch("Fetch json file wrong!")
    })
  })
})
