import NetJSONGraph from "../src/js/netjsongraph.core";

const JSONFILE = "test";
const JSONData = {
  date: "2019-04-03T05:06:54.000Z",
  nodes: [],
  links: [],
};
const param = "data1.json";
const nextParam = "data2.json";
const data1 = {
  results: {
    nodes: [{id: "1"}, {id: "2"}],
    links: [],
  },
  next: "data2.json",
  prev: null,
};
const data2 = {
  results: {
    nodes: [{id: "3"}, {id: "4"}],
    links: [],
  },
  next: null,
};

const graph = new NetJSONGraph([JSONFILE, JSONFILE]);
graph.event = graph.utils.createEvent();
graph.setConfig({
  render: () => {},
  onInit() {
    return this.config;
  },
  onRender() {
    return this.config;
  },
  onUpdate() {
    return this.config;
  },
  afterUpdate() {
    return this.config;
  },
  onLoad() {
    return this.config;
  },
});
graph.setUtils();

window.fetch = jest.fn((url) => {
  if (url === JSONFILE) {
    return Promise.resolve(JSONData);
  }
  if (url === param) {
    return Promise.resolve({
      json: () => Promise.resolve(data1),
    });
  }
  if (url === nextParam) {
    return Promise.resolve({
      json: () => Promise.resolve(data2),
    });
  }
  return Promise.reject(new Error("Fetch json file wrong!"));
});

describe("Test netjsongraph render", () => {
  beforeAll(() => {
    graph.setConfig({
      dealDataByWorker: "./error.js",
    });
  });

  afterAll(() => {
    graph.setConfig({
      dealDataByWorker: "",
    });
  });

  test("netjsongraph.js render function", () => {
    graph.render();

    // re render
    graph.utils.render();
  });
});

describe("Test netjsongraph setConfig", () => {
  test("NetJSONGraph support dynamic modification of config parameters", () => {
    graph.setConfig({
      nodeSize: 1,
    });
    expect(graph.config.nodeSize).toBe(1);
    graph.setConfig({
      nodeSize: 5,
    });
    expect(graph.config.nodeSize).toBe(5);
  });
  test("Modify el config", () => {
    const obj1 = new NetJSONGraph([JSONFILE, JSONFILE]);
    expect(obj1.config.el).toBeUndefined();
    obj1.setConfig({});
    expect(obj1.el).toBe(document.body);

    const container = document.createElement("div");
    document.body.appendChild(container);
    const obj2 = new NetJSONGraph([JSONFILE, JSONFILE]);
    obj2.setConfig({
      el: container,
    });
    expect(obj2.config.el).toBe(container);
    obj2.setConfig({});
    expect(obj2.el).toBe(container);

    const obj3 = new NetJSONGraph([JSONFILE, JSONFILE]);
    obj3.setConfig();
    expect(obj3.el).toBe(document.body);

    container.setAttribute("id", "container");
    const obj4 = new NetJSONGraph([JSONFILE, JSONFILE]);
    obj4.setConfig({
      el: "#container",
    });
    expect(obj4.el).toBe(container);
    document.body.removeChild(container);

    obj1.setConfig({
      el: "#container",
    });
    expect(obj1.el).toBe(document.body);
  });
});

describe("Test netjsongraph JSONDataUpdate", () => {
  beforeAll(() => {
    graph.setConfig({
      metadata: true,
      dealDataByWorker: "./error.js",
    });
  });

  afterAll(() => {
    graph.setConfig({
      metadata: true,
      dealDataByWorker: "",
    });
  });

  test("Callback function executed when data update. Update Information and view.", () => {
    graph.utils.JSONDataUpdate.call(graph, {
      metadata: {},
      date: "2019-04-03T09:06:54.000Z",
      nodes: [{id: "1"}],
      links: [{id: "2"}],
    });
  });
  test("Update metadata test.", () => {
    graph.utils.JSONDataUpdate.call(
      graph,
      {
        metadata: {},
        nodes: [],
        links: [],
      },
      true,
      false,
    );
  });
  test("Update metadata false test.", () => {
    graph.setConfig({
      metadata: false,
    });
    graph.render();
    graph.utils.JSONDataUpdate.call(
      graph,
      {
        metadata: {},
        nodes: [],
        links: [],
      },
      true,
      false,
    );
  });
  test("Deal with webWorker.", () => {
    graph.utils.JSONDataUpdate.call(graph, {
      nodes: [],
      links: [],
    });
  });
  test("Merge data -- map append.", () => {
    graph.setConfig({
      dealDataByWorker: "",
    });
    graph.utils.JSONDataUpdate.call(
      graph,
      {
        nodes: [],
        links: [],
      },
      false,
    );
  });
  test("Merge data -- graph add.", () => {
    graph.setConfig({
      // _this.utils.mapRender === undefined
      render: undefined,
    });
    graph.utils.JSONDataUpdate.call(
      graph,
      {
        nodes: [],
        links: [],
      },
      false,
    );
  });
  test("JSON update event emit.", () => {
    graph.event.emit("renderArray");
  });
});

describe("Test deal data by worker", () => {
  const eventData = {
    data: JSONData,
  };

  window.Worker = jest.fn((url) => {
    if (url === "worker.js") {
      return {
        postMessage: jest.fn(),
        onmessage: jest.fn(),
        addEventListener: jest.fn((event, callback) => {
          if (event === "message") {
            callback(eventData);
          }
        }),
      };
    }
    return null;
  });

  beforeAll(() => {
    graph.setConfig({
      dealDataByWorker: "worker.js",
    });
    graph.render();
  });

  test("Should set the data property using worker", () => {
    expect(graph.data).toEqual(eventData.data);
  });
});

describe("Test netjsongraph JSONParamParse", () => {
  test("Perform different operations to call NetJSONDataParse function according to different Param types.", () => {
    const {JSONParamParse} = graph.utils;

    JSONParamParse(JSONFILE).then((data) => {
      expect(data).toEqual(JSONData);
    });
    JSONParamParse("false").catch((e) => {
      expect(e).toMatch("Fetch json file wrong!");
    });

    const json = {
      test: true,
    };

    JSONParamParse(json).then((data) => {
      expect(data).toBe(json);
    });
  });
});

describe("Test paginatedDataParse", () => {
  const {paginatedDataParse} = graph.utils;
  test("Should return the data", () => {
    paginatedDataParse.call(graph, param).then((data) => {
      expect(data).toEqual({
        nodes: [{id: "1"}, {id: "2"}, {id: "3"}, {id: "4"}],
        links: [],
      });
    });
  });
});

describe("Test netjsongraph searchElements", () => {
  test("Add search function for new elements.", () => {
    const searchFunc = graph.utils.searchElements.call(graph, "test");

    window.history.pushState({searchValue: ""}, "");
    searchFunc("false").catch((e) => {
      expect(e).toMatch("Fetch json file wrong!");
    });
  });

  test("Search same key.", () => {
    const searchFunc = graph.utils.searchElements.call(graph, "test");
    const key = "false";

    window.history.pushState({searchValue: key}, "");
    searchFunc(key);
  });
});

describe("Test netjsongraph properties", () => {
  const map = new NetJSONGraph(JSONFILE);
  const jsonData = {
    nodes: [],
    links: [],
  };

  beforeAll(() => {
    map.event = map.utils.createEvent();
    map.setConfig({
      render: () => {},
      onInit() {
        return this.config;
      },
      onRender() {
        return this.config;
      },
      onUpdate() {
        return this.config;
      },
      afterUpdate() {
        return this.config;
      },
      onLoad() {
        return this.config;
      },
    });
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
        }),
      );
    });

    const searchFunc = map.utils.searchElements.call(map, "");
    // override data.
    searchFunc(JSONFILE).then(() => {
      expect(map.JSONParam).toEqual([JSONFILE]);
      expect(map.data).toEqual(JSONData);
    });
  });
});

describe("Test netjsongraph GeoJSON properties", () => {
  const geoJSONData = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: {},
        geometry: {
          type: "Point",
          coordinates: [17.764892578124996, 46.01222384063236],
        },
      },
    ],
  };
  const map = new NetJSONGraph(geoJSONData);

  beforeAll(() => {
    map.event = map.utils.createEvent();
    map.setConfig({
      render: () => {},
      onInit() {
        return this.config;
      },
      onRender() {
        return this.config;
      },
      onUpdate() {
        return this.config;
      },
      afterUpdate() {
        return this.config;
      },
      onLoad() {
        return this.config;
      },
    });
    map.setUtils();
    map.render();
  });

  test("Parse the data in correct format", () => {
    expect(map.JSONParam).toEqual([geoJSONData]);
    expect(map.data).toEqual(geoJSONData);
    expect(map.type).toEqual("geojson");
  });

  test("Update GeoJSON data dynamically", () => {
    expect(map.data).toEqual(geoJSONData);
    map.utils.JSONDataUpdate.call(
      map,
      {
        type: "FeatureCollection",
        features: [],
      },
      true,
    ).then(() => {
      expect(map.data).toEqual({
        type: "FeatureCollection",
        features: [],
      });
    });
  });
});

describe("Test when invalid data is passed", () => {
  const map = new NetJSONGraph({});
  beforeAll(() => {
    map.event = map.utils.createEvent();
    map.setConfig({
      render: () => {},
      onInit() {
        return this.config;
      },
      onRender() {
        return this.config;
      },
      onUpdate() {
        return this.config;
      },
      afterUpdate() {
        return this.config;
      },
      onLoad() {
        return this.config;
      },
    });
    map.setUtils();
    map.render();
    global.console.error = jest.fn();
  });

  afterEach(() => {
    console.error.mockClear();
  });

  test("Handle the error", () => {
    expect(map.render).toThrow();
    expect(console.error).toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith(
      new Error("Invalid data format!"),
    );
  });
});
