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
    expect(console.error).toHaveBeenCalledWith(new Error("Invalid data format!"));
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
        },
        {
          id: "2",
          location: {lng: 24.6, lat: 45.1895},
        },
        {
          id: "3",
          location: {lng: 28, lat: 47.3895},
        },
        {
          id: "4",
          location: {lng: 32, lat: 41.3895},
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
    expect(clusterObj.clusters[0].childNodes.length).toEqual(2);
    expect(clusterObj.nonClusterNodes.length).toEqual(2);
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
            status: "up",
          },
        },
        {
          id: "2",
          location: {lng: 24.6, lat: 45.1895},
          properties: {
            status: "down",
          },
        },
        {
          id: "3",
          location: {lng: 28, lat: 47.3895},
          properties: {
            status: "up",
          },
        },
        {
          id: "4",
          location: {lng: 32, lat: 41.3895},
          properties: {
            status: "up",
          },
        },
        {
          id: "5",
          location: {lng: 24.5, lat: 45.5915},
          properties: {
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
    expect(clusterObj.clusters.length).toEqual(1);
    expect(clusterObj.clusters[0].childNodes.length).toEqual(2);
    expect(clusterObj.clusters[0].itemStyle.color).toEqual("#c92517");
    document.body.removeChild(container);
  });

  test("appendData removes plotted points from leaflet", () => {
    const data = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {},
          geometry: {
            type: "Point",
            coordinates: [27.764892578124996, 46.01222384063236],
          },
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
    map.utils.appendData(data, map);
  });
});

describe("Test disableClusteringAtLevel: 0", () => {
  let renderInstance;
  let mockSelf;
  let mockLeafletInstance;
  let mockGeoJSONLayer;
  let mockMarkerClusterGroupInstance;

  beforeEach(() => {
    mockGeoJSONLayer = {
      addTo: jest.fn(),
      on: jest.fn(),
    };
    mockMarkerClusterGroupInstance = {
      addLayer: jest.fn(),
      addTo: jest.fn(() => mockMarkerClusterGroupInstance),
    };
    mockLeafletInstance = {
      on: jest.fn(),
      getZoom: jest.fn(),
      getBounds: jest.fn(),
      addLayer: jest.fn(),
      latLngToContainerPoint: jest.fn(() => ({x: 0, y: 0})),
    };

    jest.spyOn(L, "geoJSON").mockImplementation(() => mockGeoJSONLayer);
    jest
      .spyOn(L, "markerClusterGroup")
      .mockImplementation(() => mockMarkerClusterGroupInstance);
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
        mapTileConfig: [{}],
      },
      leaflet: mockLeafletInstance,
      echarts: {
        setOption: jest.fn(),
        _api: {
          getCoordinateSystems: jest.fn(() => [
            {getLeaflet: () => mockLeafletInstance},
          ]),
        },
      },
      utils: {
        deepMergeObj: jest.fn((obj1, obj2) => ({...obj1, ...obj2})),
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

    expect(L.markerClusterGroup).not.toHaveBeenCalled();
    expect(mockGeoJSONLayer.addTo).toHaveBeenCalledWith(mockSelf.leaflet);
    expect(mockMarkerClusterGroupInstance.addLayer).not.toHaveBeenCalled();
    expect(mockMarkerClusterGroupInstance.addTo).not.toHaveBeenCalled();
  });

  test("should disable clustering when disableClusteringAtLevel is 0 and initial zoom is greater than 0", () => {
    mockSelf.leaflet.getZoom.mockReturnValue(1);
    renderInstance.mapRender(mockSelf.data, mockSelf);

    expect(mockSelf.config.clustering).toBe(true);
    expect(mockSelf.config.disableClusteringAtLevel).toBe(0);
    expect(mockSelf.leaflet.getZoom()).toBe(1);

    expect(L.markerClusterGroup).not.toHaveBeenCalled();
    expect(mockGeoJSONLayer.addTo).toHaveBeenCalledWith(mockSelf.leaflet);
    expect(mockMarkerClusterGroupInstance.addLayer).not.toHaveBeenCalled();
    expect(mockMarkerClusterGroupInstance.addTo).not.toHaveBeenCalled();
  });
});
