'use strict';

import "../src/js/netjsongraph.core.js";

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

const graph = new NetJSONGraph(JSONFILE, {
  circleRadius: 5,
});

describe("Test netjsongraph render", () => {
  test("netjsongraph.js render function", () => {
    expect(graph.render())

    // re render
    expect(graph.utils.NetJSONRender())
  })
})

describe("Modify netjsongraph configs", () => {
  test("NetJSONGraph support dynamic modification of config parameters", () => {
    graph.setConfig({circleRadius: 1});
    expect(graph.config.circleRadius).toBe(1);
  });
})

describe("Test netjsongraph JSONDataUpdate", () => {
  test("Callback function executed when data update.Update Information and view.", () => {
    expect(graph.utils.JSONDataUpdate({
      date: "2019-04-03T09:06:54.000Z",
      nodes: [{id: "1"}],
      links: [{id: "2"}],
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
      expect(e).toMatch('error')
    })

    let json = {
      "test": true
    };

    JSONParamParse(json).then(data => {
      expect(data).toBe(json);
    })
  })
})