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
      "#id=geoMap&nodeId=abc%3A123&zoom=5;id=indoorMap&nodeId=indoor-node&zoom=5";
    const fragments = utils.parseUrlFragments();

    expect(Object.keys(fragments).sort()).toEqual(["geoMap", "indoorMap"].sort());
    expect(fragments.geoMap.get("nodeId")).toBe("abc:123"); // percent-decoded
    expect(fragments.geoMap.get("zoom")).toBe("5");
    expect(fragments.indoorMap.get("nodeId")).toBe("indoor-node");
  });

  test("Test setUrlFragments adds a new fragment with nodeId and zoom", () => {
    const self = {
      config: {
        bookmarkableActions: {enabled: true, id: "geoMap"},
      },
      leaflet: {getZoom: () => 7},
    };
    const params = {
      componentSubType: "effectScatter",
      data: {node: {id: "node-1"}},
    };

    utils.setUrlFragments(self, params);

    const fragments = utils.parseUrlFragments();
    expect(fragments.geoMap).toBeDefined();
    expect(fragments.geoMap.get("id")).toBe("geoMap");
    expect(fragments.geoMap.get("nodeId")).toBe("node-1");
    expect(fragments.geoMap.get("zoom")).toBe("7");
  });

  test("Test setUrlFragments updates an existing fragment and preserves others", () => {
    window.location.hash = "id=graph&nodeId=node-1";

    const self = {
      config: {bookmarkableActions: {enabled: true, id: "geo"}},
      leaflet: {getZoom: () => 9},
    };
    const params = {
      componentSubType: "graph",
      data: {id: "node-2"},
    };

    utils.setUrlFragments(self, params);

    const fragments = utils.parseUrlFragments();
    expect(fragments.graph).toBeDefined();
    expect(fragments.graph.get("nodeId")).toBe("node-1");

    expect(fragments.geo.get("nodeId")).toBe("node-2");
    expect(fragments.geo.get("zoom")).toBe("9");
  });

  test("removeUrlFragment deletes the fragment for the given id", () => {
    window.location.hash = "id=keep&nodeId=a;id=removeMe&nodeId=b";
    const self = {config: {bookmarkableActions: {enabled: true, id: "removeMe"}}};
    utils.removeUrlFragment(self, "removeMe");
    const fragments = utils.parseUrlFragments();
    expect(fragments.keep).toBeDefined();
    expect(fragments.removeMe).toBeUndefined();
    expect(window.location.hash).not.toContain("removeMe");
  });

  test("Test setSelectedNodeFromUrlFragments sets selectedNode and numeric zoom", () => {
    window.location.hash = "#id=geo&nodeId=abc&zoom=4";
    const self = {config: {bookmarkableActions: {enabled: true, id: "geo"}}};
    const fragments = utils.parseUrlFragments();

    const node = {id: "abc", properties: {}};
    utils.setSelectedNodeFromUrlFragments(self, fragments, node);

    expect(self.selectedNode).toBe(node);
    expect(self.selectedNode.zoom).toBe(4);
  });

  test("Test applyUrlFragmentState calls map.setView and triggers onClickElement", () => {
    const mockSetView = jest.fn();
    const mockOnClick = jest.fn();

    const node = {
      id: "n1",
      properties: {location: {lat: 12.1, lng: 77.5}},
      zoom: 6,
    };

    const self = {
      config: {
        bookmarkableActions: {enabled: true, id: "geo"},
        graphConfig: {series: {type: null}},
        mapOptions: {nodeConfig: {type: "scatter"}},
        onClickElement: mockOnClick,
      },
      selectedNode: node,
      leaflet: {setView: mockSetView},
    };

    utils.applyUrlFragmentState(self);

    expect(mockSetView).toHaveBeenCalledWith([12.1, 77.5], 6);
    expect(mockOnClick).toHaveBeenCalledWith("node", node);
  });

  test("Test applyUrlFragmentState runs only after onReady completes", async () => {
    const recorder = [];

    const emitter = {
      _handlers: {},
      once(event, handler) {
        this._handlers[event] = handler;
      },
      emit(event) {
        const h = this._handlers[event];
        if (h) h();
      },
    };

    const asyncOnReady = async () => {
      recorder.push("onReady-start");
      await new Promise((r) => setTimeout(r, 20));
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
    await new Promise((r) => setTimeout(r, 40));
    expect(recorder).toEqual([
      "onReady-start",
      "onReady-done",
      "applyUrlFragmentState",
    ]);
  });
});
