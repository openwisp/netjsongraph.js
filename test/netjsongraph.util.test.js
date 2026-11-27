import L from "leaflet";
import getLeaflet from "../src/js/leaflet-loader";
import NetJSONGraphUtil from "../src/js/netjsongraph.util";
import {geojsonToNetjson} from "../src/js/netjsongraph.geojson";

// Lets a test choose the Leaflet found by the library, none by default
jest.mock("../src/js/leaflet-loader", () => jest.fn());

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

  test("polygon nodes are clustered together with point nodes", () => {
    const nodes = [
      {id: "point", location: {lat: 1, lng: 1}, properties: {_featureType: "Point"}},
      {id: "area", location: {lat: 1, lng: 1}, properties: {_featureType: "Polygon"}},
      {id: "far", location: {lat: 5, lng: 5}, properties: {_featureType: "Polygon"}},
      {
        id: "line",
        location: {lat: 1, lng: 1},
        properties: {_featureType: "LineString"},
      },
    ];
    const util = new NetJSONGraphUtil();
    const {clusters, nonClusterNodes} = util.makeCluster(makeSelf({nodes}));
    expect(clusters).toHaveLength(1);
    expect(clusters[0].childNodes.map((n) => n.id)).toEqual(["point", "area"]);
    expect(clusters[0].name).toBe(2);
    expect(nonClusterNodes.map((n) => n.id).sort()).toEqual(["far", "line"]);
  });

  test("unclustered polygon nodes are not moved to avoid overlaps", () => {
    // 20px from the cluster: outside clusterRadius (10px) but close enough
    // for a marker to be pushed away from the cluster symbol.
    const near = (featureType) => ({
      id: "near",
      location: {lat: 1, lng: 1.02},
      properties: {_featureType: featureType},
    });
    const clustered = () => [
      {id: "1", location: {lat: 1, lng: 1}, properties: {_featureType: "Point"}},
      {id: "2", location: {lat: 1, lng: 1}, properties: {_featureType: "Point"}},
    ];
    const util = new NetJSONGraphUtil();
    const area = near("Polygon");
    util.makeCluster(makeSelf({nodes: [...clustered(), area]}));
    expect(area.location).toEqual({lat: 1, lng: 1.02});
    const point = near("Point");
    util.makeCluster(makeSelf({nodes: [...clustered(), point]}));
    expect(point.location.lng).toBeGreaterThan(1.02);
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

  test("Test addActionToUrl adds a new fragment with nodeId for a polygon", () => {
    const {nodes} = geojsonToNetjson({
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          id: "area1",
          properties: {},
          geometry: {
            type: "Polygon",
            coordinates: [
              [
                [0, 0],
                [4, 0],
                [4, 4],
                [0, 4],
                [0, 0],
              ],
            ],
          },
        },
      ],
    });
    const self = {
      config: {
        render: "map",
        bookmarkableActions: {enabled: true, id: "geoMap"},
      },
      utils: {...utils, graphRender: "graph", mapRender: "map"},
      nodeLinkIndex: {[nodes[0].id]: nodes[0]},
    };
    utils.addActionToUrl(self, {seriesType: "scatter", data: {node: nodes[0]}});
    expect(utils.parseUrlFragments().geoMap.get("nodeId")).toBe("polygon_area1");
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

  test("addActionToUrl does not add a history entry when clicking the open node", () => {
    window.location.hash = "id=geo&nodeId=node1";
    const self = {
      config: {
        render: "graph",
        bookmarkableActions: {enabled: true, id: "geo"},
      },
      utils: {...utils, graphRender: "graph", mapRender: "map"},
      nodeLinkIndex: {node1: {id: "node1"}},
    };
    const pushState = jest.spyOn(window.history, "pushState");
    utils.addActionToUrl(self, {dataType: "node", data: {id: "node1"}});
    expect(pushState).not.toHaveBeenCalled();
    pushState.mockRestore();
  });

  test("addActionToUrl does not add a history entry when the open node has a numeric ID", () => {
    window.location.hash = "id=geo&nodeId=1";
    const self = {
      config: {
        render: "graph",
        bookmarkableActions: {enabled: true, id: "geo"},
      },
      utils: {...utils, graphRender: "graph", mapRender: "map"},
      nodeLinkIndex: {1: {id: 1}},
    };
    const pushState = jest.spyOn(window.history, "pushState");
    utils.addActionToUrl(self, {dataType: "node", data: {id: 1}});
    expect(pushState).not.toHaveBeenCalled();
    pushState.mockRestore();
  });

  // A clustered map whose node n1 is selected in the URL, with another node
  // at the given longitude. Like in Leaflet, the pixel distance between them
  // doubles at each zoom level: with a longitude of 0.01 they are clustered
  // up to zoom 12 and drawn on their own from zoom 13.
  const clusteredMapWithSelectedNode = (leaflet, neighborLng = 0.01) => {
    window.location.hash = "#id=geo&nodeId=n1";
    const node = {id: "n1", location: {lat: 0, lng: 0}};
    const neighbor = {id: "n2", location: {lat: 0, lng: neighborLng}};
    const self = {
      config: {
        render: "map",
        clustering: true,
        clusterRadius: 80,
        disableClusteringAtLevel: 15,
        bookmarkableActions: {
          enabled: true,
          id: "geo",
          zoomLevel: 10,
          zoomOnRestore: true,
        },
        mapOptions: {nodeConfig: {type: "scatter"}},
      },
      data: {nodes: [node, neighbor], links: []},
      nodeLinkIndex: {n1: node},
      leaflet: {
        options: {zoomSnap: 1},
        project: ([lat, lng], zoom) => ({
          x: lng * 2 ** zoom,
          y: lat * 2 ** zoom,
          round() {
            return {x: Math.round(this.x), y: Math.round(this.y)};
          },
        }),
        ...leaflet,
      },
      utils,
    };
    return {self, node};
  };

  test("applyUrlFragmentState zooms in only as much as needed to show a restored node out of clusters", () => {
    const setView = jest.fn();
    const {self} = clusteredMapWithSelectedNode({setView});
    // Like on page load, which calls it with the NetJSONGraph instance as this
    utils.applyUrlFragmentState.call(self, self);
    expect(setView).toHaveBeenLastCalledWith([0, 0], 13);
    // Nodes at the same location are clustered until clustering is disabled
    utils.applyUrlFragmentState(clusteredMapWithSelectedNode({setView}, 0).self);
    expect(setView).toHaveBeenLastCalledWith([0, 0], 15);
    // A node far from the others is shown at zoomLevel
    utils.applyUrlFragmentState(clusteredMapWithSelectedNode({setView}, 1).self);
    expect(setView).toHaveBeenLastCalledWith([0, 0], 10);
    self.config.bookmarkableActions.zoomLevel = 17;
    utils.applyUrlFragmentState(self);
    expect(setView).toHaveBeenLastCalledWith([0, 0], 17);
  });

  // A real Leaflet map with two nodes the given pixels apart at the given zoom
  const realMapWithTwoNodes = ({
    zoomSnap = 1,
    distance = 0,
    atZoom = 3,
    disableClusteringAtLevel = 8,
  }) => {
    const el = document.createElement("div");
    document.body.appendChild(el);
    const map = L.map(el, {minZoom: 0, maxZoom: 18, zoomSnap}).setView([0, 0], 4);
    const a = map.unproject([1000, 1000], atZoom);
    const b = map.unproject([1000 + distance, 1000], atZoom);
    const nodes = [a, b].map((loc, id) => ({
      id,
      location: {lat: loc.lat, lng: loc.lng},
      properties: {},
    }));
    const self = {
      leaflet: map,
      data: {nodes, links: []},
      config: {
        clustering: true,
        clusteringThreshold: 0,
        clusterRadius: 80,
        disableClusteringAtLevel,
        mapOptions: {clusterConfig: {}},
      },
    };
    const remove = () => {
      map.remove();
      el.remove();
    };
    return {map, a, nodes, self, remove};
  };

  test("getUnclusteredZoom predicts clusters at the zoom Leaflet applies", () => {
    // 81 pixels apart at zoom 3.4, which Leaflet rounds to zoom 3
    const {map, a, nodes, self, remove} = realMapWithTwoNodes({
      distance: 81,
      atZoom: 3.4,
    });
    const zoom = utils.getUnclusteredZoom(self, nodes[0], 3.4);
    map.setView(a, zoom, {animate: false});
    expect(utils.makeCluster(self).clusters).toHaveLength(0);
    remove();
  });

  test("getUnclusteredZoom predicts clusters at whole zoom levels in browsers without 3D support", () => {
    // Leaflet then rounds to whole levels whatever zoomSnap is, like in jsdom
    getLeaflet.mockReturnValue({Browser: {any3d: false}});
    // 85 pixels apart at zoom 4.2, which Leaflet rounds to zoom 4
    const {map, a, nodes, self, remove} = realMapWithTwoNodes({
      zoomSnap: 0.3,
      distance: 85,
      atZoom: 4.2,
    });
    const zoom = utils.getUnclusteredZoom(self, nodes[0], 3.4);
    getLeaflet.mockReset();
    map.setView(a, zoom, {animate: false});
    expect(utils.makeCluster(self).clusters).toHaveLength(0);
    remove();
  });

  test("getUnclusteredZoom returns a zoom Leaflet applies at or above disableClusteringAtLevel", () => {
    // At the same location, the nodes are clustered until clustering is disabled
    const {map, nodes, self, remove} = realMapWithTwoNodes({
      disableClusteringAtLevel: 8.3,
    });
    const zoom = utils.getUnclusteredZoom(self, nodes[0], 3);
    map.setView([0, 0], zoom, {animate: false});
    expect(map.getZoom()).toBeGreaterThanOrEqual(8.3);
    remove();
  });

  test("applyUrlFragmentState does not change the zoom on Back and Forward unless the node is clustered", () => {
    const contains = jest.fn(() => true);
    const {self, node} = clusteredMapWithSelectedNode({
      setView: jest.fn(),
      panTo: jest.fn(),
      getBounds: () => ({contains}),
      getZoom: () => 11,
    });
    // The node is in the view
    utils.applyUrlFragmentState(self, true);
    expect(contains).toHaveBeenCalledWith([0, 0]);
    expect(self.leaflet.panTo).not.toHaveBeenCalled();
    // The node is out of the view
    contains.mockReturnValue(false);
    utils.applyUrlFragmentState(self, true);
    expect(self.leaflet.panTo).toHaveBeenCalledWith([0, 0]);
    expect(self.leaflet.setView).not.toHaveBeenCalled();
    // The node is clustered, zooming in from 11 shows it on its own at 13
    self.clusters = [{cluster: true, childNodes: [node]}];
    utils.applyUrlFragmentState(self, true);
    expect(self.leaflet.setView).toHaveBeenCalledWith([0, 0], 13);
    const setView = jest.fn();
    const fractional = clusteredMapWithSelectedNode(
      {options: {zoomSnap: 0.1}, setView, getZoom: () => 4.1},
      78 / 2 ** 4.1,
    );
    fractional.self.clusters = [{cluster: true, childNodes: [fractional.node]}];
    utils.applyUrlFragmentState(fractional.self, true);
    expect(setView.mock.calls[0][1]).toBeCloseTo(4.2);
  });

  test("applyUrlFragmentState shows a polygon as when its shape is clicked", () => {
    const mockOnClick = jest.fn();
    const node = {
      id: "polygon_area",
      location: {lat: 1, lng: 1},
      properties: {_featureType: "Polygon", _featureIndex: 1, name: "Area"},
    };
    const features = [{properties: {name: "Point"}}, {properties: {name: "Area"}}];
    const self = {
      config: {
        render: "map",
        bookmarkableActions: {enabled: true, id: "geo"},
        mapOptions: {nodeConfig: {type: "scatter"}},
        onClickElement: mockOnClick,
      },
      originalGeoJSON: {features},
      polygonNodes: new Map([[features[1], node]]),
      nodeLinkIndex: {polygon_area: node},
      utils,
    };
    window.location.hash = "#id=geo&nodeId=polygon_area";
    utils.applyUrlFragmentState(self);
    expect(mockOnClick).toHaveBeenCalledWith("Feature", {name: "Area"});
  });

  test("applyUrlFragmentState ignores a polygon left from replaced data", () => {
    const mockOnClick = jest.fn();
    const node = {
      id: "polygon_old",
      location: {lat: 1, lng: 1},
      properties: {_featureType: "Polygon", _featureIndex: 0, name: "Old"},
    };
    // The data has been replaced: another polygon is now at the same index
    const feature = {properties: {name: "New"}};
    const self = {
      config: {
        render: "map",
        bookmarkableActions: {enabled: true, id: "geo"},
        mapOptions: {nodeConfig: {type: "scatter"}},
        onClickElement: mockOnClick,
      },
      originalGeoJSON: {features: [feature]},
      polygonNodes: new Map([[feature, {id: "polygon_new"}]]),
      nodeLinkIndex: {polygon_old: node},
      utils,
    };
    window.location.hash = "#id=geo&nodeId=polygon_old";
    utils.applyUrlFragmentState(self);
    expect(mockOnClick).toHaveBeenCalledWith("node", node);
    expect(mockOnClick).not.toHaveBeenCalledWith("Feature", {name: "New"});
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

  test("removeUrlFragment uses pushState when replace=false", () => {
    const util = new NetJSONGraphUtil();
    util.parseUrlFragments = jest.fn(() => ({
      indoorMap: new URLSearchParams("id=indoorMap"),
    }));
    util.updateUrlFragments = jest.fn();
    util.removeUrlFragment.call(util, "indoorMap", null, false, false);
    expect(util.updateUrlFragments).toHaveBeenCalledWith({}, {id: "indoorMap"}, false);
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
    expect(event.detail.hash).toBe("");
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

  test("popstate handler calls applyUrlFragmentState and dispatches fragmentchange", async () => {
    const util = new NetJSONGraphUtil();
    const self = {_popstateHandler: null};
    const applySpy = jest
      .spyOn(util, "applyUrlFragmentState")
      .mockImplementation(() => {});
    jest.spyOn(window, "addEventListener").mockImplementation(() => {});
    const dispatchSpy = jest.spyOn(window, "dispatchEvent");
    util.setupHashChangeHandler(self);
    const popstateEvent = {};
    self._popstateHandler(popstateEvent);
    expect(applySpy).toHaveBeenCalledWith(self, true);
    // Dispatch is deferred via queueMicrotask — not yet called
    expect(dispatchSpy).not.toHaveBeenCalled();
    // Flush microtasks
    await Promise.resolve();
    expect(dispatchSpy).toHaveBeenCalledTimes(1);
    const event = dispatchSpy.mock.calls[0][0];
    expect(event.type).toBe("fragmentchange");
    expect(event.detail.source).toBe("popstate");
    expect(event.detail.fragments).toBeDefined();
    expect(event.detail.state).toBeNull();
    expect(typeof event.detail.hash).toBe("string");
  });

  test("dispatches fragmentchange only once across multiple instances on same popstate event", async () => {
    const util1 = new NetJSONGraphUtil();
    const util2 = new NetJSONGraphUtil();
    const self1 = {_popstateHandler: null};
    const self2 = {_popstateHandler: null};
    jest.spyOn(util1, "applyUrlFragmentState").mockImplementation(() => {});
    jest.spyOn(util2, "applyUrlFragmentState").mockImplementation(() => {});
    jest.spyOn(window, "addEventListener").mockImplementation(() => {});
    const dispatchSpy = jest.spyOn(window, "dispatchEvent");
    util1.setupHashChangeHandler(self1);
    util2.setupHashChangeHandler(self2);
    const popstateEvent = {};
    self1._popstateHandler(popstateEvent);
    self2._popstateHandler(popstateEvent);
    expect(util1.applyUrlFragmentState).toHaveBeenCalledWith(self1, true);
    expect(util2.applyUrlFragmentState).toHaveBeenCalledWith(self2, true);
    // Both handlers ran — state restored, but dispatch queued as microtask
    expect(dispatchSpy).not.toHaveBeenCalled();
    // Flush microtasks
    await Promise.resolve();
    expect(dispatchSpy).toHaveBeenCalledTimes(1);
    const event = dispatchSpy.mock.calls[0][0];
    expect(event.type).toBe("fragmentchange");
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

describe("Test highlight utilities", () => {
  test("highlightNode stores the highlighted node by its logical identity", () => {
    const util = new NetJSONGraphUtil();
    const node = {id: "node-1"};
    const link = {source: "node-1", target: "node-2"};
    const mockSelf = {
      utils: util,
      data: {nodes: [node, {id: "node-2"}], links: [link]},
      config: {onClickElement: jest.fn()},
      echarts: {
        getOption: jest.fn(() => ({
          series: [
            {
              type: "scatter",
              data: [{node}, {node: {id: "node-2"}}],
            },
            {
              type: "lines",
              data: [{link}],
            },
          ],
        })),
        dispatchAction: jest.fn(),
      },
    };

    util.highlightNode.call(mockSelf, node, {
      openTooltip: true,
      showInfo: true,
    });

    expect(mockSelf.echarts.dispatchAction).toHaveBeenCalledWith({
      type: "highlight",
      seriesIndex: 0,
      dataIndex: 0,
    });
    expect(mockSelf.echarts.dispatchAction).not.toHaveBeenCalledWith({
      type: "highlight",
      seriesIndex: 1,
      dataIndex: 0,
    });
    expect(mockSelf.echarts.dispatchAction).toHaveBeenCalledWith({
      type: "showTip",
      seriesIndex: 0,
      dataIndex: 0,
    });
    expect(mockSelf.echarts.dispatchAction).not.toHaveBeenCalledWith({
      type: "showTip",
      seriesIndex: 1,
      dataIndex: 0,
    });
    expect(mockSelf.config.onClickElement).toHaveBeenCalledWith("node", node);
    expect(mockSelf.activeHighlightedElements).toEqual([
      {
        key: "node:node-1",
        type: "node",
        data: node,
        action: {seriesIndex: 0, dataIndex: 0},
      },
    ]);
  });

  test("highlightLink toggles selections with Ctrl or Meta", () => {
    const util = new NetJSONGraphUtil();
    const firstLink = {source: "a", target: "b"};
    const secondLink = {source: "b", target: "c"};
    const mockSelf = {
      utils: util,
      data: {nodes: [], links: [firstLink, secondLink]},
      config: {onClickElement: jest.fn()},
      echarts: {
        getOption: jest.fn(() => ({
          series: [
            {
              type: "graph",
              links: [firstLink, secondLink],
            },
          ],
        })),
        dispatchAction: jest.fn(),
      },
    };

    util.highlightLink.call(mockSelf, firstLink, {append: true, toggle: true});
    util.highlightLink.call(mockSelf, secondLink, {append: true, toggle: true});
    util.highlightLink.call(mockSelf, firstLink, {append: true, toggle: true});

    expect(mockSelf.echarts.dispatchAction).toHaveBeenCalledWith({
      type: "highlight",
      seriesIndex: 0,
      dataIndex: 0,
      dataType: "edge",
    });
    expect(mockSelf.echarts.dispatchAction).toHaveBeenCalledWith({
      type: "highlight",
      seriesIndex: 0,
      dataIndex: 1,
      dataType: "edge",
    });
    expect(mockSelf.echarts.dispatchAction).toHaveBeenCalledWith({
      type: "downplay",
      seriesIndex: 0,
      dataIndex: 0,
      dataType: "edge",
    });
    expect(mockSelf.activeHighlightedElements).toEqual([
      {
        key: "link:b~c",
        type: "link",
        data: secondLink,
        action: {seriesIndex: 0, dataIndex: 1, dataType: "edge"},
      },
    ]);
  });

  test("highlightLink preserves selection when called without link data", () => {
    const util = new NetJSONGraphUtil();
    const activeHighlight = {
      key: "node:node-1",
      type: "node",
      data: {id: "node-1"},
      action: {seriesIndex: 0, dataIndex: 0},
    };
    const mockSelf = {
      utils: util,
      activeHighlightedElements: [activeHighlight],
      config: {onClickElement: jest.fn()},
      echarts: {dispatchAction: jest.fn()},
    };
    util.highlightLink.call(mockSelf, undefined, {showInfo: true});
    expect(mockSelf.activeHighlightedElements).toEqual([activeHighlight]);
    expect(mockSelf.echarts.dispatchAction).not.toHaveBeenCalled();
    expect(mockSelf.config.onClickElement).not.toHaveBeenCalled();
  });

  test("highlightLink opens a tooltip for a map link", () => {
    const util = new NetJSONGraphUtil();
    const link = {source: "a", target: "b"};
    const mockSelf = {
      utils: util,
      config: {onClickElement: jest.fn()},
      echarts: {
        getOption: jest.fn(() => ({
          series: [{id: "map-links", type: "lines", data: [{link}]}],
        })),
        dispatchAction: jest.fn(),
      },
    };
    util.highlightLink.call(mockSelf, link, {openTooltip: true});
    expect(mockSelf.echarts.dispatchAction).toHaveBeenCalledWith({
      type: "showTip",
      seriesIndex: 0,
      dataIndex: 0,
    });
  });

  test("clearHighlight downplays active elements and clears tooltip", () => {
    const util = new NetJSONGraphUtil();
    const mockSelf = {
      utils: util,
      activeHighlightedElements: [
        {
          key: "node:node-1",
          type: "node",
          data: {id: "node-1"},
          action: {seriesIndex: 0, dataIndex: 1, dataType: "node"},
        },
      ],
      echarts: {
        dispatchAction: jest.fn(),
      },
    };

    util.clearHighlight.call(mockSelf);

    expect(mockSelf.echarts.dispatchAction).toHaveBeenCalledWith({
      type: "downplay",
      seriesIndex: 0,
      dataIndex: 1,
      dataType: "node",
    });
    expect(mockSelf.echarts.dispatchAction).toHaveBeenCalledWith({
      type: "hideTip",
    });
    expect(mockSelf.activeHighlightedElements).toEqual([]);
  });
});

describe("updateClusteredPopup", () => {
  const setUp = () => {
    const util = new NetJSONGraphUtil();
    const element = document.createElement("div");
    // The popup stores the node id as a string, unlike the clustered node
    const popup = {
      nodeId: "1",
      options: {},
      getElement: () => element,
      remove: jest.fn(),
    };
    const self = {
      leaflet: {currentPopup: popup},
      utils: {setTooltipVisibility: jest.fn()},
    };
    return {util, element, popup, self};
  };
  const clusters = [{cluster: true, childNodes: [{id: 1}]}];

  test("hides the popup of a clustered node and shows it again when unclustered", () => {
    const {util, element, popup, self} = setUp();
    util.updateClusteredPopup(self, clusters);
    expect(element.style.display).toBe("none");
    expect(self.utils.setTooltipVisibility).toHaveBeenLastCalledWith(self, true);
    util.updateClusteredPopup(self, []);
    expect(element.style.display).toBe("");
    expect(self.utils.setTooltipVisibility).toHaveBeenLastCalledWith(self, false);
    // The popup is not closed, which would remove the node from the URL
    expect(self.leaflet.currentPopup).toBe(popup);
    expect(popup.remove).not.toHaveBeenCalled();
  });

  test("does nothing without an open popup", () => {
    const {util, self} = setUp();
    self.leaflet.currentPopup = null;
    expect(() => util.updateClusteredPopup(self, clusters)).not.toThrow();
    expect(self.utils.setTooltipVisibility).not.toHaveBeenCalled();
  });

  test("moves the popup to its point when makeCluster has moved the point", () => {
    const util = new NetJSONGraphUtil();
    const el = document.createElement("div");
    document.body.appendChild(el);
    const map = L.map(el, {minZoom: 0, maxZoom: 18}).setView([0, 0], 7);
    // Close enough to be pushed apart by makeCluster at zoom 6
    const nodes = [
      [1000, 1000],
      [1008, 1000],
    ].map((point, id) => {
      const loc = map.unproject(point, 5);
      return {id: String(id), location: {lat: loc.lat, lng: loc.lng}, properties: {}};
    });
    const self = {
      leaflet: map,
      el,
      utils: util,
      data: {nodes, links: []},
      config: {clusterRadius: 10, mapOptions: {clusterConfig: {}}},
    };
    util.makeCluster(self);
    const popup = L.popup({autoPan: false})
      .setLatLng(nodes[0].location)
      .setContent("node")
      .openOn(map);
    popup.nodeId = "0";
    map.currentPopup = popup;
    map.setZoom(5, {animate: false});
    util.updateClusteredPopup(self, util.makeCluster(self).clusters);
    expect(popup.getElement().style.display).toBe("none");
    map.setZoom(6, {animate: false});
    const {clusters: shown} = util.makeCluster(self);
    expect(shown).toHaveLength(0);
    util.updateClusteredPopup(self, shown);
    expect(popup.getLatLng().lng).toBeCloseTo(nodes[0].location.lng, 8);
    map.remove();
    el.remove();
  });
});
