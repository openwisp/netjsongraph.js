import NetJSONGraph from "../src/js/netjsongraph.core";
import {NetJSONGraphRender, L} from "../src/js/netjsongraph.render";

const JSONFILE = "test";
const JSONData = {
  date: "2019-04-03T05:06:54.000Z",
  nodes: [],
  links: [],
};
const param = "data1.json";
const nextParam = "data2.json";
const nextParam2 = "data3.json";
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
  next: nextParam2,
};
const data3 = {
  results: {
    nodes: [{id: "5"}, {id: "6"}],
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
  if (url.includes("bbox")) {
    return Promise.resolve({
      json: () =>
        Promise.resolve({
          nodes: [{id: "1"}, {id: "2"}],
          links: [],
        }),
    });
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
  if (url === nextParam2) {
    return Promise.resolve({
      json: () => Promise.resolve(data3),
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
        nodes: [{id: "1"}, {id: "2"}, {id: "3"}, {id: "4"}, {id: "5"}, {id: "6"}],
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
    const converted = map.utils.geojsonToNetjson(geoJSONData);
    expect(map.JSONParam).toEqual([geoJSONData]);
    expect(map.data).toEqual(converted);
    expect(map.type).toEqual("geojson");
  });

  test("Update GeoJSON data dynamically", () => {
    const originalConverted = map.utils.geojsonToNetjson(geoJSONData);
    expect(map.data).toEqual(originalConverted);
    const newGeoJSON = {
      type: "FeatureCollection",
      features: [],
    };
    return map.utils.JSONDataUpdate.call(map, newGeoJSON, true).then(() => {
      // After update, library keeps original GeoJSON format internally
      expect(map.data).toEqual(newGeoJSON);
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
    expect(console.error).toHaveBeenCalledWith(new Error("Invalid data format!"));
  });
});

describe("generateMapOption - node processing and dynamic styling", () => {
  let self;
  beforeEach(() => {
    self = {
      config: {
        mapOptions: {
          nodeConfig: {
            type: "scatter",
            nodeStyle: {},
            nodeSize: undefined,
            label: {},
            emphasis: {},
          },
          linkConfig: {},
          baseOptions: {},
          clusterConfig: {},
        },
        mapTileConfig: [
          {urlTemplate: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", options: {}},
        ],
        nodeCategories: [],
      },
      utils: {
        getNodeStyle: jest.fn(() => ({
          nodeEmphasisConfig: {nodeStyle: {}, nodeSize: 10},
          nodeSizeConfig: 10,
        })),
        getLinkStyle: jest.fn(() => ({
          linkStyleConfig: {},
          linkEmphasisConfig: {linkStyle: {}},
        })),
      },
    };
  });
  describe("color function", () => {
    test("cluster color", () => {
      const render = new NetJSONGraphRender();
      const params = {
        data: {cluster: true, itemStyle: {color: "specified_cluster_color"}},
      };
      const option = render.generateMapOption({nodes: [], links: []}, self);
      const colorFn = option.series[0].itemStyle.color;
      expect(colorFn(params)).toBe("specified_cluster_color");
    });
    test("node category color", () => {
      self.config.nodeCategories = [
        {name: "myCategory", nodeStyle: {color: "category_color"}},
      ];
      const render = new NetJSONGraphRender();
      const params = {data: {node: {category: "myCategory"}}};
      const option = render.generateMapOption({nodes: [], links: []}, self);
      const colorFn = option.series[0].itemStyle.color;
      expect(colorFn(params)).toBe("category_color");
    });
    test("node category fallback", () => {
      self.config.nodeCategories = [];
      self.config.mapOptions.nodeConfig.nodeStyle.color = "default_node_color";
      const render = new NetJSONGraphRender();
      const params = {data: {node: {category: "someCategory"}}};
      const option = render.generateMapOption({nodes: [], links: []}, self);
      const colorFn = option.series[0].itemStyle.color;
      expect(colorFn(params)).toBe("default_node_color");
    });
    test("default node color", () => {
      self.config.mapOptions.nodeConfig.nodeStyle.color = "default_node_color";
      const render = new NetJSONGraphRender();
      const params = {data: {node: {}}};
      const option = render.generateMapOption({nodes: [], links: []}, self);
      const colorFn = option.series[0].itemStyle.color;
      expect(colorFn(params)).toBe("default_node_color");
    });
    test("absolute default color", () => {
      delete self.config.mapOptions.nodeConfig.nodeStyle.color;
      const render = new NetJSONGraphRender();
      const params = {data: {node: {}}};
      const option = render.generateMapOption({nodes: [], links: []}, self);
      const colorFn = option.series[0].itemStyle.color;
      expect(colorFn(params)).toBe("#6c757d");
    });
  });

  describe("symbolSize function", () => {
    test("cluster size configured", () => {
      self.config.mapOptions.clusterConfig.symbolSize = 40;
      const render = new NetJSONGraphRender();
      const params = {data: {cluster: true}};
      const option = render.generateMapOption({nodes: [], links: []}, self);
      const sizeFn = option.series[0].symbolSize;
      expect(sizeFn(null, params)).toBe(40);
    });
    test("cluster size default", () => {
      delete self.config.mapOptions.clusterConfig.symbolSize;
      const render = new NetJSONGraphRender();
      const params = {data: {cluster: true}};
      const option = render.generateMapOption({nodes: [], links: []}, self);
      const sizeFn = option.series[0].symbolSize;
      expect(sizeFn(null, params)).toBe(30);
    });
    test("node size specific number", () => {
      self.utils.getNodeStyle = jest.fn(() => ({nodeSizeConfig: 25}));
      const render = new NetJSONGraphRender();
      const params = {data: {node: {foo: "bar"}}};
      const option = render.generateMapOption({nodes: [], links: []}, self);
      const sizeFn = option.series[0].symbolSize;
      expect(sizeFn(null, params)).toBe(25);
    });
    test("node size default configured", () => {
      self.utils.getNodeStyle = jest.fn(() => ({nodeSizeConfig: {}}));
      self.config.mapOptions.nodeConfig.nodeSize = 22;
      const render = new NetJSONGraphRender();
      const params = {data: {node: {foo: "bar"}}};
      const option = render.generateMapOption({nodes: [], links: []}, self);
      const sizeFn = option.series[0].symbolSize;
      expect(sizeFn(null, params)).toBe(22);
    });
    test("node size default fallback", () => {
      self.utils.getNodeStyle = jest.fn(() => ({nodeSizeConfig: {}}));
      delete self.config.mapOptions.nodeConfig.nodeSize;
      const render = new NetJSONGraphRender();
      const params = {data: {node: {foo: "bar"}}};
      const option = render.generateMapOption({nodes: [], links: []}, self);
      const sizeFn = option.series[0].symbolSize;
      expect(sizeFn(null, params)).toBe(17);
    });
    test("overall default configured", () => {
      self.config.mapOptions.nodeConfig.nodeSize = 15;
      const render = new NetJSONGraphRender();
      const params = {data: {}};
      const option = render.generateMapOption({nodes: [], links: []}, self);
      const sizeFn = option.series[0].symbolSize;
      expect(sizeFn(null, params)).toBe(15);
    });
    test("overall default fallback", () => {
      delete self.config.mapOptions.nodeConfig.nodeSize;
      const render = new NetJSONGraphRender();
      const params = {data: {}};
      const option = render.generateMapOption({nodes: [], links: []}, self);
      const sizeFn = option.series[0].symbolSize;
      expect(sizeFn(null, params)).toBe(17);
    });
  });
});

describe("Test when more data is present than maxPointsFetched", () => {
  const data = {
    nodes: [
      {
        id: "1",
      },
      {
        id: "2",
      },
      {
        id: "3",
      },
      {
        id: "4",
      },
      {
        id: "5",
      },
    ],
    links: [
      {source: "1", target: "2", cost: 1},
      {source: "2", target: "3", cost: 1},
      {source: "3", target: "4", cost: 1},
      {source: "4", target: "5", cost: 1},
      {source: "5", target: "1", cost: 1},
    ],
  };
  const map = new NetJSONGraph(data);
  beforeAll(() => {
    map.event = map.utils.createEvent();
    map.setConfig({
      maxPointsFetched: 3,
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

  test("Set hasMoreData to true", () => {
    expect(map.hasMoreData).toEqual(true);
    expect(map.data.links.length).toEqual(2);
  });

  test("Test getBBoxData", async () => {
    const {getBBoxData} = map.utils;
    const bounds = {
      _northEast: {
        lat: 23,
        lng: 46,
      },
      _southWest: {
        lat: 22,
        lng: 45,
      },
    };
    const res = await getBBoxData.call(map, "api/data", bounds);
    expect(res).toEqual({
      nodes: [{id: "1"}, {id: "2"}],
      links: [],
    });
  });
});

describe("Test clustering", () => {
  let container;
  const setUp = (map) => {
    Object.setPrototypeOf(NetJSONGraphRender.prototype, map.utils);
    map.utils = new NetJSONGraphRender();
    map.echarts = {
      setOption: () => {},
      appendData: jest.fn(),
      _api: {
        getCoordinateSystems: () => [{getLeaflet: () => map.leaflet}],
      },
    };
    map.utils.echarts = map.echarts;
    map.event = map.utils.createEvent();
    map.setConfig({
      render: map.utils.mapRender,
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
      el: "#map",
      clustering: true,
      clusteringThreshold: 2,
    });
    map.setUtils();
    map.render();
    container = document.createElement("div");
    container.setAttribute("id", "map");
  };
  test("Test the created clusters", () => {
    const data = {
      nodes: [
        {
          id: "1",
          location: {lng: 24.5, lat: 45.3895},
          properties: {_featureType: "Point"},
        },
        {
          id: "2",
          location: {lng: 24.5, lat: 45.1895},
          properties: {_featureType: "Point"},
        },
        {
          id: "3",
          location: {lng: 28, lat: 47.3895},
          properties: {_featureType: "Point"},
        },
        {
          id: "4",
          location: {lng: 32, lat: 41.3895},
          properties: {_featureType: "Point"},
        },
      ],
      links: [
        {
          source: "1",
          target: "3",
          cost: 1,
        },
        {
          source: "3",
          target: "4",
          cost: 1,
        },
      ],
    };

    const map = new NetJSONGraph(data);

    setUp(map);

    document.body.appendChild(container);

    map.leaflet = L.map("map", {
      center: [51.505, -0.09],
      zoom: 5,
      maxZoom: 5,
    });
    map.data = data;
    const clusterObj = map.utils.makeCluster(map);

    expect(clusterObj.clusters.length).toEqual(1);
    expect(clusterObj.clusters[0].childNodes.length).toBeGreaterThan(1);
    expect(clusterObj.nonClusterNodes.length).toBeGreaterThan(0);
    expect(clusterObj.nonClusterLinks.length).toEqual(1);
    document.body.removeChild(container);
  });

  test("Test the categorization of clusters", () => {
    const data = {
      nodes: [
        {
          id: "1",
          location: {lng: 24.5, lat: 45.3895},
          properties: {
            _featureType: "Point",
            status: "up",
          },
        },
        {
          id: "2",
          location: {lng: 24.5, lat: 45.1895},
          properties: {
            _featureType: "Point",
            status: "down",
          },
        },
        {
          id: "3",
          location: {lng: 28, lat: 47.3895},
          properties: {
            _featureType: "Point",
            status: "up",
          },
        },
        {
          id: "4",
          location: {lng: 32, lat: 41.3895},
          properties: {
            _featureType: "Point",
            status: "up",
          },
        },
        {
          id: "5",
          location: {lng: 24.5, lat: 45.191},
          properties: {
            _featureType: "Point",
            status: "down",
          },
        },
      ],
      links: [],
    };

    const map = new NetJSONGraph(data);

    setUp(map);
    map.setConfig({
      clusteringAttribute: "status",
      clusterRadius: 100000,
      nodeCategories: [
        {
          name: "down",
          nodeStyle: {
            color: "#c92517",
          },
        },
        {
          name: "up",
          nodeStyle: {
            color: "#1ba619",
          },
        },
      ],
    });
    map.render();
    document.body.appendChild(container);
    map.leaflet = L.map("map", {
      center: [51.505, -0.09],
      zoom: 5,
      maxZoom: 5,
    });
    map.data = data;
    const clusterObj = map.utils.makeCluster(map);
    expect(clusterObj.clusters.length).toEqual(2);
    const upCluster = clusterObj.clusters.find(
      (c) => c.itemStyle && c.itemStyle.color === "#1ba619",
    );
    const downCluster = clusterObj.clusters.find(
      (c) => c.itemStyle && c.itemStyle.color === "#c92517",
    );
    expect(upCluster).toBeDefined();
    expect(upCluster.childNodes.length).toBeGreaterThan(1);
    expect(downCluster).toBeDefined();
    expect(downCluster.childNodes.length).toBeGreaterThan(1);
    document.body.removeChild(container);
  });

  test("appendData correctly appends NetJSON nodes", () => {
    const data = {
      nodes: [
        {
          id: "1",
          location: {lng: 27.7648, lat: 46.0122},
          properties: {
            _featureType: "Point",
            status: "up",
          },
        },
      ],
      links: [],
    };
    const map = new NetJSONGraph(data);
    setUp(map);
    document.body.appendChild(container);
    map.leaflet = L.map("map", {
      center: [51.505, -0.09],
      zoom: 5,
      maxZoom: 5,
    });
    // Ensure base data exists to merge into
    map.data = {nodes: [], links: []};
    map.utils.appendData(data, map);

    // Ensure echarts.appendData was called since appendData now routes through
    // the NetJSON-only path.
    expect(map.echarts.appendData).toHaveBeenCalled();
  });
});

describe("Test disableClusteringAtLevel: 0", () => {
  let renderInstance;
  let mockSelf;
  let mockLeafletInstance;
  let mockGeoJSONLayer;

  beforeEach(() => {
    mockGeoJSONLayer = {
      addTo: jest.fn(),
      on: jest.fn(),
    };
    mockLeafletInstance = {
      on: jest.fn(),
      getZoom: jest.fn(),
      getBounds: jest.fn(),
      addLayer: jest.fn(),
      latLngToContainerPoint: jest.fn(() => ({x: 0, y: 0})),
      getPane: jest.fn(() => undefined),
      createPane: jest.fn(() => ({style: {}})),
      eachLayer: jest.fn(),
      removeLayer: jest.fn(),
      addLayer: jest.fn(),
    };

    jest.spyOn(L, "geoJSON").mockImplementation(() => mockGeoJSONLayer);
    jest.spyOn(L, "map").mockImplementation(() => mockLeafletInstance);
    jest.spyOn(L, "divIcon").mockImplementation(jest.fn());
    jest.spyOn(L, "point").mockImplementation(jest.fn());
    jest.spyOn(L, "circleMarker").mockImplementation(jest.fn());

    mockSelf = {
      type: "geojson",
      data: {type: "FeatureCollection", features: []},
      config: {
        clustering: true,
        disableClusteringAtLevel: 0,
        clusterRadius: 80,
        geoOptions: {},
        clusteringAttribute: null,
        prepareData: jest.fn((d) => d),
        onClickElement: jest.fn(),
        mapOptions: {},
        mapTileConfig: [
          {urlTemplate: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", options: {}},
        ],
      },
      leaflet: mockLeafletInstance,
      echarts: {
        setOption: jest.fn(),
        _api: {
          getCoordinateSystems: () => [{getLeaflet: () => mockLeafletInstance}],
        },
      },
      utils: {
        deepMergeObj: jest.fn((obj1, obj2) => ({...obj1, ...obj2})),
        isGeoJSON: jest.fn(() => true),
        geojsonToNetjson: jest.fn(() => ({nodes: [], links: []})),
        generateMapOption: jest.fn(() => ({series: []})),
        echartsSetOption: jest.fn(),
        makeCluster: jest.fn(() => ({
          clusters: [{id: "cluster1", childNodes: [{id: "node1"}]}],
          nonClusterNodes: [],
          nonClusterLinks: [],
        })),
      },
      event: {
        emit: jest.fn(),
      },
      el: document.createElement("div"),
    };

    renderInstance = new NetJSONGraphRender();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("should disable clustering when disableClusteringAtLevel is 0 and initial zoom is 0", () => {
    mockSelf.leaflet.getZoom.mockReturnValue(0);
    renderInstance.mapRender(mockSelf.data, mockSelf);

    expect(mockSelf.config.clustering).toBe(true);
    expect(mockSelf.config.disableClusteringAtLevel).toBe(0);
    expect(mockSelf.leaflet.getZoom()).toBe(0);

    // No polygon features supplied, so no GeoJSON layer should be added
    expect(mockGeoJSONLayer.addTo).not.toHaveBeenCalled();
  });

  test("should disable clustering when disableClusteringAtLevel is 0 and initial zoom is greater than 0", () => {
    mockSelf.leaflet.getZoom.mockReturnValue(1);
    renderInstance.mapRender(mockSelf.data, mockSelf);

    expect(mockSelf.config.clustering).toBe(true);
    expect(mockSelf.config.disableClusteringAtLevel).toBe(0);
    expect(mockSelf.leaflet.getZoom()).toBe(1);

    // No polygon features supplied, so no GeoJSON layer should be added
    expect(mockGeoJSONLayer.addTo).not.toHaveBeenCalled();
  });
});

describe("Test leaflet zoomend handler and zoom control state", () => {
  let renderInstance;
  let mockSelf;
  let mapContainer;

  function setZoomAndTrigger(map, zoom) {
    map.setZoom(zoom);
    map.fire("zoomend");
  }

  function getZoomControlButtons(type) {
    return document.querySelector(`.leaflet-control-zoom-${type}`);
  }

  beforeEach(() => {
    mapContainer = document.createElement("div");
    mapContainer.id = "test-map";
    // Leaflet won't render map without height and width
    mapContainer.style.width = "400px";
    mapContainer.style.height = "400px";
    document.body.appendChild(mapContainer);

    const leafletMap = L.map(mapContainer, {
      center: [0, 0],
      zoom: 2,
      minZoom: 1,
      maxZoom: 4,
      zoomControl: true,
    });

    mockSelf = {
      type: "geojson",
      data: {type: "FeatureCollection", features: []},
      config: {
        clustering: false,
        disableClusteringAtLevel: 0,
        geoOptions: {},
        clusteringAttribute: null,
        prepareData: jest.fn((d) => d),
        onClickElement: jest.fn(),
        mapOptions: {},
        mapTileConfig: [
          {urlTemplate: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", options: {}},
        ],
        showLabelsAtZoomLevel: 3,
      },
      leaflet: leafletMap,
      echarts: {
        setOption: jest.fn(),
        _api: {
          getCoordinateSystems: jest.fn(() => [{getLeaflet: () => leafletMap}]),
        },
      },
      utils: {
        deepMergeObj: jest.fn((obj1, obj2) => ({...obj1, ...obj2})),
        isGeoJSON: jest.fn(() => true),
        geojsonToNetjson: jest.fn(() => ({nodes: [], links: []})),
        generateMapOption: jest.fn(() => ({series: []})),
        echartsSetOption: jest.fn(),
      },
      event: {
        emit: jest.fn(),
      },
      el: document.createElement("div"),
    };

    jest.spyOn(L, "geoJSON").mockImplementation(() => ({
      addTo: jest.fn(),
      on: jest.fn(),
    }));

    renderInstance = new NetJSONGraphRender();
  });

  afterEach(() => {
    mockSelf.leaflet.remove();
    document.body.removeChild(mapContainer);
    jest.restoreAllMocks();
  });

  test("should disable zoom-in at max zoom and enable zoom-out", () => {
    renderInstance.mapRender(mockSelf.data, mockSelf);
    setZoomAndTrigger(mockSelf.leaflet, mockSelf.leaflet.getMaxZoom());

    const zoomInBtn = getZoomControlButtons("in");
    const zoomOutBtn = getZoomControlButtons("out");

    expect(zoomInBtn.classList.contains("leaflet-disabled")).toBe(true);
    expect(zoomOutBtn.classList.contains("leaflet-disabled")).toBe(false);
  });

  test("should disable zoom-out at min zoom and enable zoom-in", () => {
    renderInstance.mapRender(mockSelf.data, mockSelf);
    setZoomAndTrigger(mockSelf.leaflet, mockSelf.leaflet.getMinZoom());

    const zoomInBtn = getZoomControlButtons("in");
    const zoomOutBtn = getZoomControlButtons("out");

    expect(zoomInBtn.classList.contains("leaflet-disabled")).toBe(false);
    expect(zoomOutBtn.classList.contains("leaflet-disabled")).toBe(true);
  });

  test("should enable both zoom-in and zoom-out at intermediate zoom", () => {
    renderInstance.mapRender(mockSelf.data, mockSelf);
    setZoomAndTrigger(mockSelf.leaflet, 3);

    const zoomInBtn = getZoomControlButtons("in");
    const zoomOutBtn = getZoomControlButtons("out");

    expect(zoomInBtn.classList.contains("leaflet-disabled")).toBe(false);
    expect(zoomOutBtn.classList.contains("leaflet-disabled")).toBe(false);
  });

  test("should disable zoom-in at float zoom value rounded to maxZoom", () => {
    renderInstance.mapRender(mockSelf.data, mockSelf);
    setZoomAndTrigger(mockSelf.leaflet, 3.9);

    const zoomInBtn = getZoomControlButtons("in");
    const zoomOutBtn = getZoomControlButtons("out");

    expect(zoomInBtn.classList.contains("leaflet-disabled")).toBe(true);
    expect(zoomOutBtn.classList.contains("leaflet-disabled")).toBe(false);
  });
});

describe("mapRender – polygon overlay & moveend bbox logic", () => {
  let renderInstance;
  let mockSelf;
  let mockLeaflet;
  let mockPolygonLayer;
  const capturedEvents = {};

  beforeEach(() => {
    mockPolygonLayer = {addTo: jest.fn().mockReturnThis(), on: jest.fn()};

    mockLeaflet = {
      on: jest.fn((evt, cb) => {
        capturedEvents[evt] = cb;
      }),
      getZoom: jest.fn(() => 2),
      getMinZoom: jest.fn(() => 1),
      getMaxZoom: jest.fn(() => 18),
      getBounds: jest.fn(() => ({
        /* dummy bounds */
      })),
      getPane: jest.fn(() => undefined),
      createPane: jest.fn(() => ({style: {}})),
      setView: jest.fn(),
      eachLayer: jest.fn(),
      removeLayer: jest.fn(),
      addLayer: jest.fn(),
    };

    jest.spyOn(L, "geoJSON").mockImplementation(() => mockPolygonLayer);

    mockSelf = {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            geometry: {
              type: "Polygon",
              coordinates: [
                [
                  [0, 0],
                  [1, 0],
                  [1, 1],
                  [0, 1],
                  [0, 0],
                ],
              ],
            },
            properties: {},
          },
        ],
      },
      config: {
        clustering: false,
        disableClusteringAtLevel: 0,
        geoOptions: {},
        prepareData: jest.fn(),
        onClickElement: jest.fn(),
        mapOptions: {},
        mapTileConfig: [
          {urlTemplate: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", options: {}},
        ],
        showLabelsAtZoomLevel: 3,
        loadMoreAtZoomLevel: 4,
      },
      leaflet: mockLeaflet,
      echarts: {
        setOption: jest.fn(),
        _api: {
          getCoordinateSystems: jest.fn(() => [{getLeaflet: () => mockLeaflet}]),
        },
      },
      utils: {
        isGeoJSON: jest.fn(() => true),
        geojsonToNetjson: jest.fn(() => ({nodes: [], links: []})),
        generateMapOption: jest.fn(() => ({series: [{data: []}]})),
        echartsSetOption: jest.fn(),
        deepMergeObj: jest.fn((a, b) => ({...a, ...b})),
        getBBoxData: jest.fn(() => Promise.resolve({nodes: [{id: "n1"}], links: []})),
      },
      event: {emit: jest.fn()},
    };

    renderInstance = new NetJSONGraphRender();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    Object.keys(capturedEvents).forEach((k) => delete capturedEvents[k]);
  });

  test("renders polygon layer from GeoJSON features", () => {
    renderInstance.mapRender(mockSelf.data, mockSelf);

    expect(L.geoJSON).toHaveBeenCalled();
    expect(mockPolygonLayer.addTo).toHaveBeenCalledWith(mockLeaflet);
    expect(mockLeaflet.polygonGeoJSON).toBe(mockPolygonLayer);
  });

  test("moveend handler fetches bbox data and updates chart", async () => {
    mockSelf.hasMoreData = true;
    // Pretend we are zoomed in enough to trigger bbox fetch
    mockLeaflet.getZoom.mockReturnValue(5);

    renderInstance.mapRender(mockSelf.data, mockSelf);

    // Ensure self.data exists for bbox merge logic
    mockSelf.data = {nodes: [], links: []};

    // Invoke the captured moveend callback
    await capturedEvents.moveend();

    expect(mockSelf.utils.getBBoxData).toHaveBeenCalled();
    // After data merge, echarts.setOption should be invoked once for the update
    expect(mockSelf.echarts.setOption).toHaveBeenCalledTimes(1);
    // Data should now include the fetched node
    expect(mockSelf.data.nodes.some((n) => n.id === "n1")).toBe(true);
  });
});

describe("graph label visibility and fallbacks", () => {
  test("generateGraphOption sets series id and uses name/label/id fallback", () => {
    const render = new NetJSONGraphRender();
    const mockSelf = {
      config: {
        graphConfig: {
          series: {layout: "force", label: {show: true}},
          baseOptions: {},
        },
        // no threshold here: formatter not injected
      },
      utils: {
        getNodeStyle: jest.fn(() => ({
          nodeStyleConfig: {},
          nodeSizeConfig: 10,
          nodeEmphasisConfig: {nodeStyle: {}, nodeSize: 12},
        })),
      },
      echarts: {
        getOption: jest.fn(() => ({series: [{id: "network-graph", zoom: 1}]})),
      },
    };

    const option = render.generateGraphOption(
      {
        nodes: [{id: "n1", label: "L"}, {id: "n2", name: "N"}, {id: "n3"}],
        links: [],
      },
      mockSelf,
    );

    expect(option.series[0].id).toBe("network-graph");
    const names = option.series[0].nodes.map((n) => n.name);
    expect(names).toEqual(["L", "N", "n3"]);
  });

  test("label formatter hides below threshold and shows above", () => {
    const render = new NetJSONGraphRender();
    const mockSelf = {
      config: {
        graphConfig: {
          series: {layout: "force", label: {show: true}},
          baseOptions: {},
        },
        showGraphLabelsAtZoom: 2,
      },
      utils: {
        getNodeStyle: jest.fn(() => ({
          nodeStyleConfig: {},
          nodeSizeConfig: 10,
          nodeEmphasisConfig: {nodeStyle: {}, nodeSize: 12},
        })),
      },
      echarts: {
        getOption: jest
          .fn()
          .mockReturnValueOnce({series: [{id: "network-graph", zoom: 1}]})
          .mockReturnValue({series: [{id: "network-graph", zoom: 3}]}),
      },
    };

    const option = render.generateGraphOption(
      {nodes: [{id: "1", name: "Node1"}], links: []},
      mockSelf,
    );
    const fmt = option.series[0].label.formatter;
    expect(typeof fmt).toBe("function");
    // First call with zoom 1 -> hidden
    expect(fmt({data: {name: "Node1"}})).toBe("");
    // Subsequent call with zoom 3 -> visible
    expect(fmt({data: {name: "Node1"}})).toBe("Node1");
  });

  test("graphRender registers roam handler (conditional) that triggers resize on zoom", () => {
    const render = new NetJSONGraphRender();
    const handlers = {};
    let zoom = 0.5;
    const mockSelf = {
      utils: {
        generateGraphOption: jest.fn(() => ({series: []})),
        echartsSetOption: jest.fn(),
      },
      echarts: {
        on: jest.fn((evt, cb) => {
          handlers[evt] = cb;
        }),
        resize: jest.fn(),
        getOption: jest.fn(() => ({series: [{id: "network-graph", zoom}]})),
      },
      event: {emit: jest.fn()},
      config: {showGraphLabelsAtZoom: 1},
    };

    render.graphRender({nodes: [], links: []}, mockSelf);
    expect(typeof handlers.graphRoam).toBe("function");
    // cross threshold upwards
    zoom = 1.2;
    handlers.graphRoam({zoom});
    expect(mockSelf.echarts.resize).toHaveBeenCalled();
  });
});

describe("map series ids and name fallbacks", () => {
  test("generateMapOption assigns stable ids and name fallback", () => {
    const render = new NetJSONGraphRender();
    const mockSelf = {
      config: {
        mapOptions: {
          nodeConfig: {type: "scatter", label: {}, emphasis: {}, nodeStyle: {}},
          linkConfig: {},
          baseOptions: {},
        },
        mapTileConfig: [
          {urlTemplate: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", options: {}},
        ],
        nodeCategories: [],
      },
      utils: {
        getNodeStyle: jest.fn(() => ({
          nodeEmphasisConfig: {nodeStyle: {}, nodeSize: 10},
          nodeSizeConfig: 10,
        })),
        getLinkStyle: jest.fn(() => ({
          linkStyleConfig: {},
          linkEmphasisConfig: {linkStyle: {}},
        })),
      },
    };

    const option = render.generateMapOption(
      {
        nodes: [
          {id: "a", properties: {location: {lng: 1, lat: 2}}, label: "L"},
          {id: "b", properties: {location: {lng: 1, lat: 2}}, name: "N"},
          {id: "c", properties: {location: {lng: 1, lat: 2}}},
        ],
        links: [{source: "a", target: "b"}],
        flatNodes: {
          a: {properties: {location: {lng: 1, lat: 2}}},
          b: {properties: {location: {lng: 1, lat: 2}}},
        },
      },
      mockSelf,
    );
    expect(option.series[0].id).toBe("geo-map");
    expect(option.series[1].id).toBe("map-links");
    const names = option.series[0].data.map((d) => d.name);
    expect(names).toEqual(["L", "N", "c"]);
  });

  test("mapRender zoomend toggles labels using geo-map id", () => {
    const render = new NetJSONGraphRender();
    const leafletMap = {
      on: jest.fn((evt, cb) => {
        if (evt === "zoomend") {
          // call right away simulating a zoom end at zoom 5
          leafletMap.getZoom = jest.fn(() => 5);
          cb();
        }
      }),
      getMinZoom: jest.fn(() => 1),
      getMaxZoom: jest.fn(() => 6),
      getZoom: jest.fn(() => 1),
      getBounds: jest.fn(() => ({})),
      eachLayer: jest.fn(),
      removeLayer: jest.fn(),
      addLayer: jest.fn(),
    };
    const mockSelf = {
      type: "geojson",
      data: {type: "FeatureCollection", features: []},
      config: {
        geoOptions: {},
        mapOptions: {},
        mapTileConfig: [
          {urlTemplate: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", options: {}},
        ],
        showLabelsAtZoomLevel: 3,
        onClickElement: jest.fn(),
        prepareData: jest.fn(),
      },
      echarts: {
        setOption: jest.fn(),
        _api: {
          getCoordinateSystems: jest.fn(() => [{getLeaflet: () => leafletMap}]),
        },
      },
      utils: {
        deepMergeObj: jest.fn((a, b) => ({...a, ...b})),
        isGeoJSON: jest.fn(() => true),
        geojsonToNetjson: jest.fn(() => ({nodes: [], links: []})),
        generateMapOption: jest.fn(() => ({series: []})),
        echartsSetOption: jest.fn(),
      },
      event: {emit: jest.fn()},
    };

    render.mapRender(mockSelf.data, mockSelf);
    // After zoomend, we expect a setOption call targeting geo-map id
    const {calls} = mockSelf.echarts.setOption.mock;
    expect(calls.length).toBeGreaterThan(0);
    const [lastArg] = calls[calls.length - 1];
    expect(lastArg.series[0].id).toBe("geo-map");
  });
});
