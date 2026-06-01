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
    window.location.hash = "#id=geoMap&nodeId=abc%3A123;id=indoorMap&nodeId=indoorNode";
    const fragments = utils.parseUrlFragments();

    expect(Object.keys(fragments).sort()).toEqual(["geoMap", "indoorMap"].sort());
    expect(fragments.geoMap.get("nodeId")).toBe("abc:123");
    expect(fragments.indoorMap.get("nodeId")).toBe("indoorNode");
  });

  test("Test addActionToUrl adds a new fragment with nodeId for a node", () => {
    const node = {id: "node1"};
    const self = {
      config: {
        render: "graph",
        bookmarkableActions: {enabled: true, id: "basicUsage"},
      },
      utils: {...utils, graphRender: "graph", mapRender: "map"},
      nodeLinkIndex: {node1: node},
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
      utils: {...utils, graphRender: "graph", mapRender: "map"},
      nodeLinkIndex: {"node1~node2": link},
    };

    const params = {
      dataType: "edge",
      data: link,
    };

    utils.addActionToUrl(self, params);

    const fragments = utils.parseUrlFragments();
    expect(fragments.basicUsage).toBeDefined();
    expect(fragments.basicUsage.get("id")).toBe("basicUsage");
    expect(fragments.basicUsage.get("nodeId")).toBe("node1~node2");
    // Verify that ~ is NOT double encoded in the hash
    expect(window.location.hash).toContain("nodeId=node1~node2");
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
      utils: {...utils, graphRender: "graph", mapRender: "map"},
      nodeLinkIndex: {node1, node2},
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
        bookmarkableActions: {
          enabled: true,
          id: "geo",
          zoomLevel: 6,
          zoomOnRestore: true,
        },
        graphConfig: {series: {type: null}},
        mapOptions: {
          nodeConfig: {type: "scatter"},
          center: [0, 0],
        },
        onClickElement: mockOnClick,
      },
      nodeLinkIndex: {n1: node},
      leaflet: {setView: mockSetView},
      utils,
    };

    window.location.hash = "#id=geo&nodeId=n1";
    utils.applyUrlFragmentState(self);

    expect(mockSetView).toHaveBeenCalledWith([12.1, 77.5], 6);
    expect(mockOnClick).toHaveBeenCalledWith("node", node);
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

describe("Test move Node in Real Time", () => {
  test("updates node location, properties, value and calls setOption", () => {
    const util = new NetJSONGraphUtil();
    const newLocation = {lat: 11, lng: 21};
    const node = {
      id: "node-1",
      location: {lat: 10, lng: 20},
      properties: {location: {lat: 10, lng: 20}},
    };
    const series = [
      {type: "line", data: []},
      {
        type: "scatter",
        data: [
          {
            node,
            value: [node.location.lng, node.location.lat],
          },
        ],
      },
    ];
    const echarts = {
      getOption: jest.fn(() => ({
        series: JSON.parse(JSON.stringify(series)),
      })),
      setOption: jest.fn(),
    };
    const mapContext = {
      echarts,
      nodeLinkIndex: {
        [node.id]: node,
      },
    };

    util.moveNodeInRealTime.call(mapContext, node.id, newLocation);
    expect(echarts.getOption).toHaveBeenCalled();
    expect(echarts.setOption).toHaveBeenCalled();

    const calledArg = echarts.setOption.mock.calls[0][0];
    expect(calledArg).toBeDefined();
    expect(calledArg.series).toBeDefined();

    const scatterSeries = calledArg.series.find((s) => s.type === "scatter");
    expect(scatterSeries).toBeDefined();

    const updated = scatterSeries.data.find((d) => d.node.id === node.id);
    expect(updated).toBeDefined();
    expect(updated.node.location).toEqual(newLocation);
    expect(updated.node.properties.location).toEqual(newLocation);
    expect(updated.value).toEqual([newLocation.lng, newLocation.lat]);
  });
});

describe("Test applyUrlFragmentState with nodePopup", () => {
  test("calls loadNodePopup when target is null and nodePopup.show is true", () => {
    const util = new NetJSONGraphUtil();
    const node = {
      id: "node-1",
      location: {lat: 10, lng: 20},
    };
    const params = new URLSearchParams();
    params.set("id", "id");
    params.set("nodeId", "node-1");
    const fragments = {
      id: params,
    };
    const mockSelf = {
      config: {
        bookmarkableActions: {
          enabled: true,
          id: "id",
          zoomOnRestore: false,
        },
        mapOptions: {
          nodePopup: {
            show: true,
          },
        },
        onClickElement: jest.fn(),
      },
      gui: {
        loadNodePopup: jest.fn(),
      },
      utils: {
        parseUrlFragments: jest.fn(() => fragments),
      },
      nodeLinkIndex: {
        "node-1": node,
      },
      leaflet: {
        setView: jest.fn(),
      },
    };
    util.applyUrlFragmentState.call(util, mockSelf);
    expect(mockSelf.gui.loadNodePopup).toHaveBeenCalledWith(node);
  });

  test("does not call loadNodePopup when target is not null (link case)", () => {
    const util = new NetJSONGraphUtil();
    const params = new URLSearchParams();
    params.set("id", "id");
    params.set("nodeId", "node-1~node-2");
    const fragments = {
      id: params,
    };
    const mockSelf = {
      config: {
        bookmarkableActions: {
          enabled: true,
          id: "id",
          zoomOnRestore: false,
        },
        mapOptions: {
          nodePopup: {
            show: true,
          },
        },
        onClickElement: jest.fn(),
      },
      gui: {
        loadNodePopup: jest.fn(),
      },
      utils: {
        parseUrlFragments: jest.fn(() => fragments),
      },
      nodeLinkIndex: {
        "node-1~node-2": {id: "node-1~node-2", location: {lat: 12, lng: 22}},
      },
      leaflet: {
        setView: jest.fn(),
      },
    };
    util.applyUrlFragmentState.call(util, mockSelf);
    expect(mockSelf.gui.loadNodePopup).not.toHaveBeenCalled();
  });

  test("does not call loadNodePopup when nodePopup.show is false", () => {
    const util = new NetJSONGraphUtil();
    const node = {
      id: "node-3",
      location: {lat: 20, lng: 30},
    };
    const params = new URLSearchParams();
    params.set("id", "id");
    params.set("nodeId", "node-3");

    const fragments = {
      id: params,
    };
    const mockSelf = {
      config: {
        bookmarkableActions: {
          enabled: true,
          id: "id",
          zoomOnRestore: false,
        },
        mapOptions: {
          nodePopup: {
            show: false,
          },
        },
        onClickElement: jest.fn(),
      },
      gui: {
        loadNodePopup: jest.fn(),
      },
      utils: {
        parseUrlFragments: jest.fn(() => fragments),
      },
      nodeLinkIndex: {
        "node-3": node,
      },
      leaflet: {
        setView: jest.fn(),
      },
    };
    util.applyUrlFragmentState.call(util, mockSelf);
    expect(mockSelf.gui.loadNodePopup).not.toHaveBeenCalled();
  });

  test("does not call loadNodePopup when mapOptions.nodePopup is not configured", () => {
    const util = new NetJSONGraphUtil();
    const node = {
      id: "node-4",
      location: {lat: 25, lng: 35},
    };
    const params = new URLSearchParams();
    params.set("id", "id");
    params.set("nodeId", "node-4");
    const fragments = {
      id: params,
    };
    const mockSelf = {
      config: {
        bookmarkableActions: {
          enabled: true,
          id: "id",
          zoomOnRestore: false,
        },
        mapOptions: {},
        onClickElement: jest.fn(),
      },
      gui: {
        loadNodePopup: jest.fn(),
      },
      utils: {
        parseUrlFragments: jest.fn(() => fragments),
      },
      nodeLinkIndex: {
        "node-4": node,
      },
      leaflet: {
        setView: jest.fn(),
      },
    };
    util.applyUrlFragmentState.call(util, mockSelf);
    expect(mockSelf.gui.loadNodePopup).not.toHaveBeenCalled();
  });

  test("closes the open popup when popstate navigates to a state without nodeId", () => {
    // Regression for popstate-back to a no-nodeId state: the URL no longer
    // references a selected node, so any popup that was opened by an earlier
    // applyUrlFragmentState must be closed to keep the visible state in sync
    // with the URL.
    const util = new NetJSONGraphUtil();
    const fragments = {};
    const popupRemove = jest.fn();
    const mockSelf = {
      config: {
        bookmarkableActions: {
          enabled: true,
          id: "id",
          zoomOnRestore: false,
        },
        mapOptions: {
          nodePopup: {
            show: true,
          },
        },
        onClickElement: jest.fn(),
      },
      gui: {
        loadNodePopup: jest.fn(),
      },
      utils: {
        parseUrlFragments: jest.fn(() => fragments),
      },
      nodeLinkIndex: {},
      leaflet: {
        setView: jest.fn(),
        currentPopup: {remove: popupRemove},
      },
    };
    util.applyUrlFragmentState.call(util, mockSelf);
    expect(popupRemove).toHaveBeenCalled();
    expect(mockSelf.gui.loadNodePopup).not.toHaveBeenCalled();
  });

  test("calls onClickElement for node clicks regardless of nodePopup setting", () => {
    const util = new NetJSONGraphUtil();
    const node = {
      id: "node-5",
      location: {lat: 30, lng: 40},
    };
    const params = new URLSearchParams();
    params.set("id", "id");
    params.set("nodeId", "node-5");
    const fragments = {
      id: params,
    };
    const mockSelf = {
      config: {
        bookmarkableActions: {
          enabled: true,
          id: "id",
          zoomOnRestore: false,
        },
        mapOptions: {
          nodePopup: {
            show: true,
          },
        },
        onClickElement: jest.fn(),
      },
      gui: {
        loadNodePopup: jest.fn(),
      },
      utils: {
        parseUrlFragments: jest.fn(() => fragments),
      },
      nodeLinkIndex: {
        "node-5": node,
      },
      leaflet: {
        setView: jest.fn(),
      },
    };
    util.applyUrlFragmentState.call(util, mockSelf);
    expect(mockSelf.config.onClickElement).toHaveBeenCalledWith("node", node);
  });
});

describe("Test removeUrlFragment with paramName argument", () => {
  test("removeUrlFragment deletes only the named param when paramName is provided", () => {
    const util = new NetJSONGraphUtil();
    const params = new URLSearchParams();
    params.set("id", "id");
    params.set("nodeId", "node-1");
    params.set("other", "value");
    util.parseUrlFragments = jest.fn(() => ({
      id: params,
    }));
    util.updateUrlFragments = jest.fn();
    util.removeUrlFragment.call(util, "id", "nodeId");
    expect(util.updateUrlFragments).toHaveBeenCalledWith(
      {id: params},
      {id: "id"},
      true,
    );
    expect(params.has("nodeId")).toBe(false);
    expect(params.get("other")).toBe("value");
  });

  test("removeUrlFragment deletes entire fragment when paramName is not provided", () => {
    const util = new NetJSONGraphUtil();
    util.parseUrlFragments = jest.fn(() => ({
      id: new URLSearchParams("nodeId=node-1"),
    }));
    util.updateUrlFragments = jest.fn();
    util.removeUrlFragment.call(util, "id");
    expect(util.updateUrlFragments).toHaveBeenCalledWith({}, {id: "id"}, true);
  });

  test("removeUrlFragment returns early when fragment does not exist", () => {
    const util = new NetJSONGraphUtil();
    util.parseUrlFragments = jest.fn(() => ({}));
    util.updateUrlFragments = jest.fn();
    util.removeUrlFragment.call(util, "nonexistent");
    expect(util.updateUrlFragments).not.toHaveBeenCalled();
  });

  test("removeUrlFragment drops the whole fragment entry when only the action id remains", () => {
    // If removing the named param leaves nothing but the bare `id` key, the
    // fragment becomes a useless stub like "#id=geoMap" — drop it entirely.
    const util = new NetJSONGraphUtil();
    const params = new URLSearchParams();
    params.set("id", "geoMap");
    params.set("nodeId", "node-1");
    util.parseUrlFragments = jest.fn(() => ({
      geoMap: params,
    }));
    util.updateUrlFragments = jest.fn();
    util.removeUrlFragment.call(util, "geoMap", "nodeId");
    // After deletion, only `id` would remain → entire entry should be gone.
    expect(util.updateUrlFragments).toHaveBeenCalledWith({}, {id: "geoMap"}, true);
  });

  test("removeUrlFragment keeps an id-only fragment when preserveFragment is true", () => {
    const util = new NetJSONGraphUtil();
    const params = new URLSearchParams();
    params.set("id", "geoMap");
    params.set("nodeId", "node-1");
    util.parseUrlFragments = jest.fn(() => ({
      geoMap: params,
    }));
    util.updateUrlFragments = jest.fn();
    util.removeUrlFragment.call(util, "geoMap", "nodeId", true);
    expect(util.updateUrlFragments).toHaveBeenCalledWith(
      {geoMap: params},
      {id: "geoMap"},
      true,
    );
    expect(params.toString()).toBe("id=geoMap");
  });
});

describe("Test updateUrlFragments fragmentchange event", () => {
  afterEach(() => {
    jest.restoreAllMocks();
    window.location.hash = "";
  });

  test("calls pushState when replace=false (default)", () => {
    const util = new NetJSONGraphUtil();
    const params = new URLSearchParams();
    params.set("id", "test");
    params.set("nodeId", "node-1");
    const fragments = {test: params};
    const state = {some: "state"};

    const pushSpy = jest.spyOn(window.history, "pushState");
    const replaceSpy = jest.spyOn(window.history, "replaceState");

    util.updateUrlFragments(fragments, state);

    expect(pushSpy).toHaveBeenCalledWith(state, "", `#${params.toString()}`);
    expect(replaceSpy).not.toHaveBeenCalled();
  });

  test("calls replaceState when replace=true", () => {
    const util = new NetJSONGraphUtil();
    const params = new URLSearchParams();
    params.set("id", "test");
    params.set("nodeId", "node-1");
    const fragments = {test: params};
    const state = {some: "state"};

    const pushSpy = jest.spyOn(window.history, "pushState");
    const replaceSpy = jest.spyOn(window.history, "replaceState");

    util.updateUrlFragments(fragments, state, true);

    expect(replaceSpy).toHaveBeenCalledWith(state, "", `#${params.toString()}`);
    expect(pushSpy).not.toHaveBeenCalled();
  });

  test("dispatches fragmentchange with hash when fragments present", () => {
    const util = new NetJSONGraphUtil();
    const params = new URLSearchParams();
    params.set("id", "test");
    params.set("nodeId", "node-1");
    const fragments = {test: params};
    const state = {some: "state"};

    jest.spyOn(window.history, "pushState").mockImplementation(() => {});
    const dispatchSpy = jest.spyOn(window, "dispatchEvent");

    util.updateUrlFragments(fragments, state);

    expect(dispatchSpy).toHaveBeenCalledTimes(1);
    const event = dispatchSpy.mock.calls[0][0];
    expect(event.type).toBe("fragmentchange");
    expect(event.detail).toEqual({
      fragments,
      state,
      hash: params.toString(),
    });
  });

  test("dispatches fragmentchange with empty hash when no fragments remain", () => {
    const util = new NetJSONGraphUtil();
    const state = {some: "state"};

    jest.spyOn(window.history, "pushState").mockImplementation(() => {});
    const dispatchSpy = jest.spyOn(window, "dispatchEvent");

    util.updateUrlFragments({}, state);

    const event = dispatchSpy.mock.calls[0][0];
    expect(event.type).toBe("fragmentchange");
    expect(event.detail.hash).toBe(window.location.pathname + window.location.search);
  });

  test("dispatches fragmentchange on replaceState too", () => {
    const util = new NetJSONGraphUtil();
    const params = new URLSearchParams();
    params.set("id", "test");
    const fragments = {test: params};
    const state = {some: "state"};

    jest.spyOn(window.history, "replaceState").mockImplementation(() => {});
    const dispatchSpy = jest.spyOn(window, "dispatchEvent");

    util.updateUrlFragments(fragments, state, true);

    expect(dispatchSpy).toHaveBeenCalledTimes(1);
    const event = dispatchSpy.mock.calls[0][0];
    expect(event.type).toBe("fragmentchange");
  });

  test("clears hash when no fragments remain", () => {
    const util = new NetJSONGraphUtil();
    const state = {some: "state"};

    const pushSpy = jest.spyOn(window.history, "pushState");
    jest.spyOn(window, "dispatchEvent").mockImplementation(() => true);

    util.updateUrlFragments({}, state);

    const url = pushSpy.mock.calls[0][2];
    expect(url).toBe(window.location.pathname + window.location.search);
  });
});

describe("Test setupHashChangeHandler fragmentchange event", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("registers popstate listener", () => {
    const util = new NetJSONGraphUtil();
    /* eslint-disable no-underscore-dangle */
    const self = {_popstateHandler: null};
    const addSpy = jest.spyOn(window, "addEventListener");

    util.setupHashChangeHandler(self);

    expect(addSpy).toHaveBeenCalledWith("popstate", expect.any(Function));
    expect(typeof self._popstateHandler).toBe("function");
  });

  test("removes duplicate listener on second call", () => {
    const util = new NetJSONGraphUtil();
    const oldHandler = jest.fn();
    const self = {_popstateHandler: oldHandler};
    const removeSpy = jest.spyOn(window, "removeEventListener");
    jest.spyOn(window, "addEventListener").mockImplementation(() => {});

    util.setupHashChangeHandler(self);

    expect(removeSpy).toHaveBeenCalledWith("popstate", oldHandler);
    expect(self._popstateHandler).not.toBe(oldHandler);
  });

  test("popstate handler calls applyUrlFragmentState and dispatches fragmentchange", () => {
    const util = new NetJSONGraphUtil();
    const self = {_popstateHandler: null};

    const applySpy = jest
      .spyOn(util, "applyUrlFragmentState")
      .mockImplementation(() => {});
    jest.spyOn(window, "addEventListener").mockImplementation(() => {});
    const dispatchSpy = jest.spyOn(window, "dispatchEvent");

    util.setupHashChangeHandler(self);
    self._popstateHandler();

    expect(applySpy).toHaveBeenCalledWith(self);
    const event = dispatchSpy.mock.calls[0][0];
    expect(event.type).toBe("fragmentchange");
    expect(event.detail).toEqual({source: "popstate"});
  });

  test("teardown removes listener and clears handler", () => {
    const util = new NetJSONGraphUtil();
    const self = {_popstateHandler: null};

    jest.spyOn(window, "addEventListener").mockImplementation(() => {});
    const removeSpy = jest.spyOn(window, "removeEventListener");

    const teardown = util.setupHashChangeHandler(self);
    const handler = self._popstateHandler;
    teardown();

    expect(removeSpy).toHaveBeenCalledWith("popstate", handler);
    expect(self._popstateHandler).toBeNull();
    /* eslint-enable no-underscore-dangle */
  });
});

describe("Test updateLabelVisibility utility method", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("updateLabelVisibility hides labels when show is false", () => {
    const util = new NetJSONGraphUtil();
    const mockSelf = {
      echarts: {
        setOption: jest.fn(),
      },
      config: {
        showMapLabelsAtZoom: 3,
      },
      leaflet: {
        getZoom: jest.fn(() => 5),
      },
    };
    util.updateLabelVisibility.call(util, mockSelf, false);
    expect(mockSelf.echarts.setOption).toHaveBeenCalledWith({
      series: [
        {
          id: "geo-map",
          label: {
            show: false,
            silent: true,
          },
          emphasis: {
            label: {
              show: false,
            },
          },
        },
      ],
    });
  });

  test("updateLabelVisibility shows labels and emphasis labels when tooltip is disabled", () => {
    const util = new NetJSONGraphUtil();
    const mockSelf = {
      echarts: {
        getOption: jest.fn(() => ({
          tooltip: [{show: false}],
        })),
        setOption: jest.fn(),
      },
      config: {
        showMapLabelsAtZoom: 3,
      },
      leaflet: {
        getZoom: jest.fn(() => 5),
      },
    };
    util.updateLabelVisibility.call(util, mockSelf, true);
    expect(mockSelf.echarts.setOption).toHaveBeenCalledWith({
      series: [
        {
          id: "geo-map",
          label: {
            show: true,
            silent: true,
          },
          emphasis: {
            label: {
              show: true,
            },
          },
        },
      ],
    });
  });

  test("updateLabelVisibility hides emphasis labels when tooltip is enabled", () => {
    const util = new NetJSONGraphUtil();
    const mockSelf = {
      echarts: {
        getOption: jest.fn(() => ({
          tooltip: [{show: true}],
        })),
        setOption: jest.fn(),
      },
      config: {
        mapOptions: {
          baseOptions: {
            media: [{option: {tooltip: {show: true}}}],
          },
        },
        showMapLabelsAtZoom: 3,
      },
      leaflet: {
        getZoom: jest.fn(() => 5),
      },
    };
    util.updateLabelVisibility.call(util, mockSelf, true);
    expect(mockSelf.echarts.setOption).toHaveBeenCalledWith({
      series: [
        {
          id: "geo-map",
          label: {
            show: true,
            silent: true,
          },
          emphasis: {
            label: {
              show: false,
            },
          },
        },
      ],
    });
  });

  test("updateLabelVisibility hides labels when zoom < threshold even if show is true", () => {
    const util = new NetJSONGraphUtil();
    const mockSelf = {
      echarts: {
        getOption: jest.fn(() => ({
          tooltip: {show: false},
        })),
        setOption: jest.fn(),
      },
      config: {
        showMapLabelsAtZoom: 10,
      },
      leaflet: {
        getZoom: jest.fn(() => 5),
      },
    };
    util.updateLabelVisibility.call(util, mockSelf, true);
    expect(mockSelf.echarts.setOption).toHaveBeenCalledWith({
      series: [
        {
          id: "geo-map",
          label: {
            show: false,
            silent: true,
          },
          emphasis: {
            label: {
              show: true,
            },
          },
        },
      ],
    });
  });

  test("updateLabelVisibility always hides labels when showMapLabelsAtZoom is false", () => {
    const util = new NetJSONGraphUtil();
    const mockSelf = {
      echarts: {
        getOption: jest.fn(() => ({
          tooltip: {show: false},
        })),
        setOption: jest.fn(),
      },
      config: {
        showMapLabelsAtZoom: false,
      },
      leaflet: {
        getZoom: jest.fn(() => 10),
      },
    };
    util.updateLabelVisibility.call(util, mockSelf, true);
    expect(mockSelf.echarts.setOption).toHaveBeenCalledWith({
      series: [
        {
          id: "geo-map",
          label: {
            show: false,
            silent: true,
          },
          emphasis: {
            label: {
              show: false,
            },
          },
        },
      ],
    });
  });

  test("updateLabelVisibility returns early when echarts is not ready", () => {
    const util = new NetJSONGraphUtil();
    const mockSelf = {
      echarts: null,
      config: {
        showMapLabelsAtZoom: 3,
      },
      leaflet: {
        getZoom: jest.fn(() => 5),
      },
    };
    const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    util.updateLabelVisibility.call(util, mockSelf, true);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      "updateLabelVisibility: ECharts instance not ready",
    );
  });
});
