'use strict';

import NetJSONGraph from "../src/js/netjsongraph.core.js";

const JSONFILE = "test",
      JSONData = {
        date: "2019-04-03T05:06:54.000Z",
        nodes: [],
        links: [],
      },
      graph = new NetJSONGraph([JSONFILE, JSONFILE]);
graph.event = graph.utils.createEvent();
graph.setConfig({
  render: () => {},
  onInit: function() {
    return this.config;
  },
  onRender: function() {
    return this.config;
  },
  onUpdate: function() {
    return this.config;
  },
  afterUpdate: function() {
    return this.config;
  },
  onLoad: function() {
    return this.config;
  },
})
graph.setUtils();

window.fetch = jest.fn(url => url === JSONFILE ? 
    Promise.resolve(JSONData) : 
    Promise.reject("Fetch json file wrong!"))
  
describe("Test netjsongraph render", () => {
  beforeAll(() => {
    graph.setConfig({
      dealDataByWorker: "./error.js",
    })
  });

  afterAll(() => {
    graph.setConfig({
      dealDataByWorker: "",
    })
  })

  test("netjsongraph.js render function", () => {
    graph.render();

    // re render
    graph.utils._render();
  })
})

describe("Test netjsongraph setConfig", () => {
  test("NetJSONGraph support dynamic modification of config parameters", () => {
    graph.setConfig({
      nodeSize: 1
    });
    expect(graph.config.nodeSize).toBe(1);
    graph.setConfig({
      nodeSize: 5
    });
    expect(graph.config.nodeSize).toBe(5);
  });
  test("Modify el config", () => {
    const obj1 = new NetJSONGraph([JSONFILE, JSONFILE]);
    const obj2 = new NetJSONGraph([JSONFILE, JSONFILE], {
      el: document.getElementsByTagName("body")[0],
    });
    const obj3 = new NetJSONGraph([JSONFILE, JSONFILE], {
      el: "error",
    });
    obj1.setConfig({
      el: "error"
    })
  });
})

describe("Test netjsongraph JSONDataUpdate", () => {
  beforeAll(() => {
    graph.setConfig({
      metadata: true,
      dealDataByWorker: "./error.js",
    })
  });

  afterAll(() => {
    graph.setConfig({
      metadata: true,
      dealDataByWorker: "",
    })
  })

  test("Callback function executed when data update.Update Information and view.", () => {
    graph.utils.JSONDataUpdate.call(graph, {
      metadata: {},
      date: "2019-04-03T09:06:54.000Z",
      nodes: [{id: "1"}],
      links: [{id: "2"}],
    })
  })
  test("Update metadata test.", () => {
    graph.utils.JSONDataUpdate.call(graph, {
      metadata: {},
      nodes: [],
      links: [],
    }, true, false)
  })
  test("Update metadata false test.", () => {
    graph.setConfig({
      metadata: false,
    })
    graph.render();
    graph.utils.JSONDataUpdate.call(graph, {
      metadata: {},
      nodes: [],
      links: [],
    }, true, false);
  })
  test("Deal with webWorker.", () => {
    graph.utils.JSONDataUpdate.call(graph, {
      nodes: [],
      links: [],
    });
  })
  test("Merge data -- map append.", () => {
    graph.setConfig({
      dealDataByWorker: "",
    })
    graph.utils.JSONDataUpdate.call(graph, {
      nodes: [],
      links: [],
    }, false);
  })
  test("Merge data -- graph add.", () => {
    graph.setConfig({
      // _this.utils.mapRender === undefined
      render: undefined
    })
    graph.utils.JSONDataUpdate.call(graph, {
      nodes: [],
      links: [],
    }, false);
  })
  test("JSON update event emit.", () => {
    graph.event.emit("renderArray");
  })
})

describe("Test netjsongraph JSONParamParse", () => {
  test("Perform different operations to call NetJSONDataParse function according to different Param types.", () => {
    const { JSONParamParse } = graph.utils;

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
    let searchFunc = graph.utils.searchElements.call(graph, "test");

    window.history.pushState({ searchValue: "" }, "");
    searchFunc("false").catch(e => {
      expect(e).toMatch("Fetch json file wrong!")
    })
  })

  test("Search same key.", () => {
    const searchFunc = graph.utils.searchElements.call(graph, "test"),
          key = "false";

    window.history.pushState({ searchValue: key }, "");
    searchFunc(key);
  })
})

describe("Test netjsongraph properties", () => {
  const map = new NetJSONGraph(JSONFILE, {
          render: "map",
        }),
        jsonData = {
          nodes: [],
          links: [],
        };

  beforeAll(() => {
    map.event = map.utils.createEvent();
    map.setConfig({
      render: () => {},
      onInit: function() {
        return this.config;
      },
      onRender: function() {
        return this.config;
      },
      onUpdate: function() {
        return this.config;
      },
      afterUpdate: function() {
        return this.config;
      },
      onLoad: function() {
        return this.config;
      },
    })
    map.setUtils();
    map.render();
  });

  test("netjsongraph.js JSONParam and data properties -- single json init.", () => {
    expect(map.JSONParam).toEqual([JSONFILE]);
    expect(map.data).toEqual(JSONData);
    
    // append data. data won't be dealed.
    map.utils.JSONDataUpdate.call(map, jsonData, false, false).then(() => {
      expect(map.JSONParam).toEqual([JSONFILE, jsonData]);
      expect(map.data).toEqual(
        Object.assign(JSONData, jsonData, {
          nodes: JSONData.nodes.concat(jsonData.nodes),
          links: JSONData.links.concat(jsonData.links),
        })
      );
    })

    let searchFunc = map.utils.searchElements.call(map, "");
    // override data.
    searchFunc(JSONFILE).then(() => {
      expect(map.JSONParam).toEqual([JSONFILE]);
      expect(map.data).toEqual(JSONData);
    })
  })
})

