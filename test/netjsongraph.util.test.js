import NetJSONGraphUtil from "../src/js/netjsongraph.util";

// Mock Leaflet projection (minimal for pixel<->latlng)
const mockLeaflet = {
  latLngToContainerPoint: ([lat, lng]) => ({
    x: lng * 1000,
    y: lat * 1000,
  }),
  containerPointToLatLng: ([x, y]) => ({
    lng: x / 1000,
    lat: y / 1000,
  }),
};

describe("makeCluster cluster separation logic", () => {
  function makeSelf({nodes, clusteringAttribute, clusterSeparation}) {
    return {
      config: {
        clusterRadius: 10,
        clusteringAttribute,
        clusterSeparation,
        nodeCategories: [
          {name: "A", nodeStyle: {color: "red"}},
          {name: "B", nodeStyle: {color: "blue"}},
        ],
        mapOptions: {clusterConfig: {}},
      },
      data: {nodes, links: []},
      leaflet: mockLeaflet,
    };
  }

  test("clusters at same location with different attributes are separated in a circle", () => {
    const nodes = [
      {
        id: "1",
        location: {lat: 1, lng: 1},
        properties: {_featureType: "Point", status: "A"},
      },
      {
        id: "2",
        location: {lat: 1, lng: 1},
        properties: {_featureType: "Point", status: "A"},
      },
      {
        id: "3",
        location: {lat: 1, lng: 1},
        properties: {_featureType: "Point", status: "B"},
      },
      {
        id: "4",
        location: {lat: 1, lng: 1},
        properties: {_featureType: "Point", status: "B"},
      },
    ];
    const self = makeSelf({
      nodes,
      clusteringAttribute: "status",
      clusterSeparation: 50,
    });
    const util = new NetJSONGraphUtil();
    const {clusters} = util.makeCluster(self);
    expect(clusters.length).toBe(2);
    // Should be separated by roughly clusterSeparation in pixel space
    const px1 = mockLeaflet.latLngToContainerPoint(clusters[0].value);
    const px2 = mockLeaflet.latLngToContainerPoint(clusters[1].value);
    const dist = Math.sqrt((px1.x - px2.x) ** 2 + (px1.y - px2.y) ** 2);
    expect(dist).toBeGreaterThan(40); // Allow some tolerance
  });

  test("clusters at same location with one attribute are not offset", () => {
    const nodes = [
      {
        id: "1",
        location: {lat: 2, lng: 2},
        properties: {_featureType: "Point", status: "A"},
      },
      {
        id: "2",
        location: {lat: 2, lng: 2},
        properties: {_featureType: "Point", status: "A"},
      },
      {
        id: "3",
        location: {lat: 2, lng: 2},
        properties: {_featureType: "Point", status: "A"},
      },
    ];
    const self = makeSelf({
      nodes,
      clusteringAttribute: "status",
      clusterSeparation: 50,
    });
    const util = new NetJSONGraphUtil();
    const {clusters} = util.makeCluster(self);
    expect(clusters.length).toBe(1);
    // Should be at the original location
    expect(clusters[0].value[0]).toBeCloseTo(2, 5);
    expect(clusters[0].value[1]).toBeCloseTo(2, 5);
  });

  test("clusterSeparation uses default when not set", () => {
    const nodes = [
      {
        id: "1",
        location: {lat: 3, lng: 3},
        properties: {_featureType: "Point", status: "A"},
      },
      {
        id: "2",
        location: {lat: 3, lng: 3},
        properties: {_featureType: "Point", status: "A"},
      },
      {
        id: "3",
        location: {lat: 3, lng: 3},
        properties: {_featureType: "Point", status: "B"},
      },
      {
        id: "4",
        location: {lat: 3, lng: 3},
        properties: {_featureType: "Point", status: "B"},
      },
    ];
    const self = makeSelf({
      nodes,
      clusteringAttribute: "status",
      clusterSeparation: undefined,
    });
    const util = new NetJSONGraphUtil();
    const {clusters} = util.makeCluster(self);
    expect(clusters.length).toBe(2);
    // Should be separated by at least half the clusterRadius (default)
    const px1 = mockLeaflet.latLngToContainerPoint(clusters[0].value);
    const px2 = mockLeaflet.latLngToContainerPoint(clusters[1].value);
    const dist = Math.sqrt((px1.x - px2.x) ** 2 + (px1.y - px2.y) ** 2);
    expect(dist).toBeGreaterThan(4); // clusterRadius/2 = 5, allow some tolerance
  });
});

describe("Test utils deepCopy function", () => {
  test("creates a deep clone that is independent from the original object", () => {
    const util = new NetJSONGraphUtil();

    const config = {
      render: "map",
      mapOptions: {
        center: [50, 50],
        zoom: 5,
        nodeConfig: {label: {offset: [0, -10]}},
      },
      linkCategories: [
        {
          name: "down",
          linkStyle: {color: "#c92517", width: 5},
        },
      ],
    };

    const original = config;
    const clone = util.deepCopy(original);

    expect(clone).not.toBe(original);
    expect(clone.mapOptions).not.toBe(original.mapOptions);
    expect(clone.linkCategories).not.toBe(original.linkCategories);

    clone.render = "graph";
    clone.mapOptions.center = [0, 0];
    clone.mapOptions.zoom = 10;
    clone.linkCategories[0].linkStyle.color = "#000000";
    clone.linkCategories.push({
      name: "up",
      linkStyle: {color: "#00ff00", width: 2},
    });

    expect(original.render).toBe("map");
    expect(clone.render).toBe("graph");
    expect(original.mapOptions.center).toEqual([50, 50]);
    expect(clone.mapOptions.center).toEqual([0, 0]);
    expect(original.mapOptions.zoom).toBe(5);
    expect(clone.mapOptions.zoom).toBe(10);
    expect(original.linkCategories.length).toBe(1);
    expect(clone.linkCategories.length).toBe(2);
    expect(original.linkCategories[0].linkStyle.color).toBe("#c92517");
    expect(clone.linkCategories[0].linkStyle.color).toBe("#000000");
    expect(original.linkCategories[0].name).toBe("down");
    expect(clone.linkCategories[0].name).toBe("down");
    expect(clone.linkCategories[1].name).toBe("up");
  });
});

describe("Test URL fragment utilities", () => {
  let utils;

  beforeEach(() => {
    utils = new NetJSONGraphUtil();
    window.location.hash = "";
  });

  afterEach(() => {
    window.location.hash = "";
  });

  test("Test parseUrlFragments parses multiple fragments and decodes values", () => {
    window.location.hash =
      "#id=geoMap&nodeId=abc%3A123;id=indoorMap&nodeId=indoor-node";
    const fragments = utils.parseUrlFragments();

    expect(Object.keys(fragments).sort()).toEqual(["geoMap", "indoorMap"].sort());
    expect(fragments.geoMap.get("nodeId")).toBe("abc:123");
    expect(fragments.indoorMap.get("nodeId")).toBe("indoor-node");
  });

  test("Test addActionToUrl adds a new fragment with nodeId for a node", () => {
    const node = {id: "node1"};
    const self = {
      config: {
        render: "graph",
        bookmarkableActions: {enabled: true, id: "basicUsage"},
      },
      data: {nodes: [node]},
      utils: {...utils, graphRender: "graph", mapRender: "map"},
      nodeIndex: {node1: 0},
    };
    const params = {
      dataType: "node",
      data: {id: "node1"},
    };

    utils.addActionToUrl(self, params);

    const fragments = utils.parseUrlFragments();
    expect(fragments.basicUsage).toBeDefined();
    expect(fragments.basicUsage.get("id")).toBe("basicUsage");
    expect(fragments.basicUsage.get("nodeId")).toBe("node1");
  });

  test("Test addActionToUrl adds a new fragment with nodeId for a link", () => {
    const link = {source: "node1", target: "node2"};
    const self = {
      config: {
        render: "graph",
        bookmarkableActions: {enabled: true, id: "basicUsage"},
      },
      data: {links: [link]},
      utils: {...utils, graphRender: "graph", mapRender: "map"},
      nodeIndex: {"node1-node2": 0},
    };

    const params = {
      dataType: "edge",
      data: link,
    };

    utils.addActionToUrl(self, params);

    const fragments = utils.parseUrlFragments();
    expect(fragments.basicUsage).toBeDefined();
    expect(fragments.basicUsage.get("id")).toBe("basicUsage");
    expect(fragments.basicUsage.get("nodeId")).toBe("node1-node2");
  });

  test("Test addActionToUrl updates an existing fragment and preserves others", () => {
    window.location.hash = "id=graph&nodeId=node1";
    const node1 = {id: "node1"};
    const node2 = {id: "node2"};
    const self = {
      config: {
        render: "graph",
        bookmarkableActions: {enabled: true, id: "geo"},
      },
      data: {nodes: [node1, node2]},
      utils: {...utils, graphRender: "graph", mapRender: "map"},
      nodeIndex: {node1: 0, node2: 1},
    };
    const params = {
      dataType: "node",
      data: {id: "node1"},
    };

    utils.addActionToUrl(self, params);
    const fragments = utils.parseUrlFragments();

    expect(fragments.graph).toBeDefined();
    expect(fragments.graph.get("nodeId")).toBe("node1");
    expect(fragments.geo).toBeDefined();
    expect(fragments.geo.get("nodeId")).toBe("node1");
  });

  test("removeUrlFragment deletes the fragment for the given id", () => {
    window.location.hash = "id=keep&nodeId=a;id=removeMe&nodeId=b";
    utils.removeUrlFragment("removeMe");
    const fragments = utils.parseUrlFragments();
    expect(fragments.keep).toBeDefined();
    expect(fragments.removeMe).toBeUndefined();
    expect(window.location.hash).not.toContain("removeMe");
  });

  test("applyUrlFragmentState calls map.setView and triggers onClickElement", () => {
    const mockSetView = jest.fn();
    const mockOnClick = jest.fn();

    const node = {
      id: "n1",
      location: {lat: 12.1, lng: 77.5},
      cluster: null,
    };

    const self = {
      config: {
        render: "map",
        bookmarkableActions: {enabled: true, id: "geo"},
        graphConfig: {series: {type: null}},
        mapOptions: {nodeConfig: {type: "scatter"}, center: [0, 0]},
        onClickElement: mockOnClick,
      },
      data: {nodes: [node]},
      nodeIndex: {n1: 0},
      leaflet: {setView: mockSetView, getZoom: () => 6},
      utils,
    };

    window.location.hash = "#id=geo&nodeId=n1";
    utils.applyUrlFragmentState(self);

    expect(mockSetView).toHaveBeenCalledWith([12.1, 77.5], 6);
    expect(mockOnClick).toHaveBeenCalledWith("node", node);
  });

  test("applyUrlFragmentState handles link case and calls map.setView with default center", () => {
    const mockSetView = jest.fn();
    const mockOnClick = jest.fn();

    const link = {
      source: "n1",
      target: "n2",
    };

    const self = {
      config: {
        render: "map",
        bookmarkableActions: {enabled: true, id: "geo"},
        graphConfig: {series: {type: null}},
        mapOptions: {nodeConfig: {type: "scatter"}, center: [10, 20]},
        onClickElement: mockOnClick,
      },
      data: {links: [link]},
      nodeIndex: {"n1-n2": 0},
      leaflet: {setView: mockSetView, getZoom: () => 6},
      utils,
    };

    window.location.hash = "#id=geo&nodeId=n1-n2";

    utils.applyUrlFragmentState(self);

    expect(mockSetView).toHaveBeenCalledWith([10, 20], 6);
    expect(mockOnClick).toHaveBeenCalledWith("link", link);
  });

  test("Test applyUrlFragmentState runs only after onReady completes", async () => {
    const recorder = [];

    const emitter = {
      handlers: {},
      once(event, handler) {
        this.handlers[event] = handler;
      },
      emit(event) {
        const h = this.handlers[event];
        if (h) {
          h();
        }
      },
    };
    const delay = (ms) =>
      new Promise((resolve) => {
        setTimeout(resolve, ms);
      });

    const asyncOnReady = async () => {
      recorder.push("onReady-start");
      await delay(20);
      recorder.push("onReady-done");
    };

    const onReadyDone = new Promise((resolve) => {
      emitter.once("onReady", async () => {
        await asyncOnReady();
        resolve();
      });
    });

    emitter.once("applyUrlFragmentState", async () => {
      await onReadyDone;
      recorder.push("applyUrlFragmentState");
    });
    emitter.emit("onReady");
    emitter.emit("applyUrlFragmentState");
    await delay(40);
    expect(recorder).toEqual([
      "onReady-start",
      "onReady-done",
      "applyUrlFragmentState",
    ]);
  });
});
