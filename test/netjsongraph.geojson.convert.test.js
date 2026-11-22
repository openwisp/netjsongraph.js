import fs from "fs";
import path from "path";
import L from "leaflet";
import {
  addPolygonOverlays,
  geojsonToNetjson,
  updatePolygonOverlays,
} from "../src/js/netjsongraph.geojson";

describe("geojsonToNetjson conversion", () => {
  const samplePath = path.join(__dirname, "../public/assets/data/geojson-sample.json");
  const sample = JSON.parse(fs.readFileSync(samplePath, "utf-8"));
  const {nodes, links} = geojsonToNetjson(sample);

  test("properties.name becomes node label", () => {
    const named = nodes.find((n) => n.label === "Sample MultiPoint");
    expect(named).toBeDefined();
  });

  test("explicit id preserved", () => {
    const explicit = nodes.find((n) => n.id === "test1");
    expect(explicit).toBeDefined();
    // eslint-disable-next-line no-underscore-dangle
    expect(explicit._generatedIdentity).toBeFalsy();
  });

  test("LineString & MultiLineString converted to links", () => {
    const lineLinks = links.filter(
      // eslint-disable-next-line no-underscore-dangle
      (l) => l.properties && l.properties._featureType === "LineString",
    );
    expect(lineLinks.length).toBeGreaterThan(0);
  });

  describe("Point features are never merged", () => {
    const point = (coordinates, properties, id) => ({
      type: "Feature",
      ...(id !== undefined ? {id} : {}),
      properties,
      geometry: {type: "Point", coordinates},
    });
    const line = (coordinates, properties = {}) => ({
      type: "Feature",
      properties,
      geometry: {type: "LineString", coordinates},
    });
    const collection = (...features) => ({type: "FeatureCollection", features});

    test("duplicate Points keep their own ids, labels and properties", () => {
      const result = geojsonToNetjson(
        collection(
          point([10, 20], {name: "First", floor: 1}, "a"),
          point([10, 20], {name: "Second", floor: 2}, "b"),
        ),
      );
      expect(result.nodes).toHaveLength(2);
      expect(result.nodes.map((n) => n.id)).toEqual(["a", "b"]);
      expect(result.nodes.map((n) => n.label)).toEqual(["First", "Second"]);
      expect(result.nodes[0].properties.floor).toBe(1);
      expect(result.nodes[1].properties.floor).toBe(2);
    });

    test("MultiPoint with repeated coordinates gives one node per point", () => {
      const result = geojsonToNetjson(
        collection({
          type: "Feature",
          properties: {name: "Repeated"},
          geometry: {
            type: "MultiPoint",
            coordinates: [
              [1, 2],
              [1, 2],
              [3, 4],
            ],
          },
        }),
      );
      expect(result.nodes).toHaveLength(3);
      expect(new Set(result.nodes.map((n) => n.id)).size).toBe(3);
    });

    test("MultiPoint with an explicit id gives every point a unique graph id", () => {
      const result = geojsonToNetjson(
        collection({
          type: "Feature",
          id: "mp",
          properties: {},
          geometry: {
            type: "MultiPoint",
            coordinates: [
              [1, 2],
              [1, 2],
              [3, 4],
            ],
          },
        }),
      );
      expect(result.nodes).toHaveLength(3);
      expect(new Set(result.nodes.map((n) => n.id)).size).toBe(3);
      expect(result.nodes.map((n) => n.id)).toEqual(["mp_0", "mp_1", "mp_2"]);
      // the original feature id is kept in properties and as the label
      result.nodes.forEach((n) => {
        expect(n.properties.id).toBe("mp");
        expect(n.label).toBe("mp");
      });
    });

    test("MultiPoint suffixed ids do not collide with other feature ids", () => {
      const result = geojsonToNetjson(
        collection(
          {
            type: "Feature",
            id: "mp",
            properties: {},
            geometry: {
              type: "MultiPoint",
              coordinates: [
                [1, 2],
                [3, 4],
              ],
            },
          },
          {
            type: "Feature",
            id: "mp_0",
            properties: {},
            geometry: {type: "Point", coordinates: [5, 6]},
          },
        ),
      );
      const ids = result.nodes.map((n) => n.id);
      expect(ids).toHaveLength(3);
      expect(new Set(ids).size).toBe(3);
      // the standalone Point keeps its own id
      expect(ids).toContain("mp_0");
      const multiNodes = result.nodes.filter((n) => n.properties.id === "mp");
      expect(multiNodes).toHaveLength(2);
      multiNodes.forEach((n) => expect(n.label).toBe("mp"));
    });

    test("MultiPoint suffixed ids skip a node_id used as fallback for an empty id", () => {
      const result = geojsonToNetjson(
        collection(
          {
            type: "Feature",
            id: "mp",
            properties: {},
            geometry: {
              type: "MultiPoint",
              coordinates: [
                [1, 2],
                [3, 4],
              ],
            },
          },
          point([5, 6], {node_id: "mp_0"}, ""),
        ),
      );
      const ids = result.nodes.map((n) => n.id);
      expect(ids).toHaveLength(3);
      expect(new Set(ids).size).toBe(3);
      expect(ids[2]).toBe("mp_0");
    });

    test("generated gjn_ ids skip explicit ids of other features", () => {
      const result = geojsonToNetjson(
        collection(point([5, 5], {}), point([5, 5], {}, "gjn_0")),
      );
      const ids = result.nodes.map((n) => n.id);
      expect(ids).toHaveLength(2);
      expect(new Set(ids).size).toBe(2);
      expect(ids[1]).toBe("gjn_0");
    });

    test("a Point on a line vertex stays its own node", () => {
      const result = geojsonToNetjson(
        collection(
          line([
            [0, 0],
            [1, 1],
          ]),
          point([1, 1], {name: "On the line"}, "p1"),
        ),
      );
      // two line vertices + one Point, none of them merged
      expect(result.nodes).toHaveLength(3);
      expect(result.nodes.filter((n) => n.id === "p1")).toHaveLength(1);
      // the link only connects the two line vertices, not the Point
      expect(result.links).toHaveLength(1);
      expect(result.links[0].source).not.toBe("p1");
      expect(result.links[0].target).not.toBe("p1");
    });

    test("two lines meeting at a vertex still share one node", () => {
      const result = geojsonToNetjson(
        collection(
          line([
            [0, 0],
            [1, 1],
          ]),
          line([
            [1, 1],
            [2, 2],
          ]),
        ),
      );
      // vertices (0,0), (1,1), (2,2): the shared vertex is not duplicated
      expect(result.nodes).toHaveLength(3);
      expect(result.links).toHaveLength(2);
      expect(result.links[0].target).toBe(result.links[1].source);
    });

    test("a line with an explicit id gives each vertex a unique id", () => {
      const result = geojsonToNetjson(
        collection(
          line(
            [
              [0, 0],
              [1, 1],
              [2, 2],
            ],
            {id: "l1"},
          ),
        ),
      );
      const ids = result.nodes.map((n) => n.id);
      expect(ids).toEqual(["l1_0", "l1_1", "l1_2"]);
      expect(result.nodes.map((n) => n.properties.id)).toEqual(["l1", "l1", "l1"]);
      expect(result.links).toHaveLength(2);
      result.links.forEach((l) => expect(l.source).not.toBe(l.target));
    });

    test("a Point before a line vertex with the same id stays separate", () => {
      const result = geojsonToNetjson(
        collection(
          point([1, 1], {name: "Before the line"}, "x"),
          line(
            [
              [1, 1],
              [2, 2],
            ],
            {id: "x"},
          ),
        ),
      );
      const ids = result.nodes.map((n) => n.id);
      expect(result.nodes).toHaveLength(3);
      expect(new Set(ids).size).toBe(3);
      expect(result.nodes.filter((n) => n.id === "x")).toHaveLength(1);
      expect(result.links).toHaveLength(1);
      expect(result.links[0].source).not.toBe(result.links[0].target);
      expect([result.links[0].source, result.links[0].target]).not.toContain("x");
    });

    test("Points sharing one feature id in a GeometryCollection get unique ids", () => {
      const result = geojsonToNetjson(
        collection({
          type: "Feature",
          id: "gc",
          properties: {},
          geometry: {
            type: "GeometryCollection",
            geometries: [
              {type: "Point", coordinates: [3, 3]},
              {type: "Point", coordinates: [3, 3]},
            ],
          },
        }),
      );
      expect(result.nodes.map((n) => n.id)).toEqual(["gc", "gc_1"]);
      expect(result.nodes.map((n) => n.properties.id)).toEqual(["gc", "gc"]);
    });

    test("numeric feature ids become string node ids", () => {
      const result = geojsonToNetjson(collection(point([1, 1], {}, 7)));
      expect(result.nodes[0].id).toBe("7");
    });

    test("Points without ids get unique generated gjn_ ids", () => {
      const result = geojsonToNetjson(
        collection(point([5, 5], {}), point([5, 5], {}), point([5, 5], {})),
      );
      const ids = result.nodes.map((n) => n.id);
      expect(ids).toHaveLength(3);
      expect(new Set(ids).size).toBe(3);
      ids.forEach((id) => expect(id).toMatch(/^gjn_\d+$/));
      // eslint-disable-next-line no-underscore-dangle
      result.nodes.forEach((n) => expect(n._generatedIdentity).toBe(true));
    });
  });
});

describe("geojsonToNetjson polygon nodes", () => {
  const convert = (...features) =>
    geojsonToNetjson({type: "FeatureCollection", features}).nodes;
  const polygon = (rings, extra = {}) => ({
    type: "Feature",
    properties: {name: "Area"},
    geometry: {type: "Polygon", coordinates: rings},
    ...extra,
  });
  const square = (west, south, size) => [
    [west, south],
    [west + size, south],
    [west + size, south + size],
    [west, south + size],
    [west, south],
  ];

  test("Polygon becomes a single node with a prefixed id and its label", () => {
    const nodes = convert(polygon([square(0, 0, 4)], {id: "area-1"}));
    expect(nodes).toHaveLength(1);
    expect(nodes[0].id).toBe("polygon_area-1");
    expect(nodes[0].label).toBe("Area");
    // eslint-disable-next-line no-underscore-dangle
    expect(nodes[0].properties._featureType).toBe("Polygon");
    expect(nodes[0].location).toEqual({lng: 2, lat: 2});
    expect(nodes[0].properties.location).toEqual({lng: 2, lat: 2});
  });

  test("node of a concave polygon lies within it", () => {
    // U shape: its centroid falls in the notch between the two arms.
    const ring = [
      [0, 0],
      [6, 0],
      [6, 6],
      [4, 6],
      [4, 2],
      [2, 2],
      [2, 6],
      [0, 6],
      [0, 0],
    ];
    const [{location}] = convert(polygon([ring]));
    expect(location.lng).toBe(1);
    expect(location.lat).toBeGreaterThan(2);
    expect(location.lat).toBeLessThan(6);
  });

  test("node of a polygon with a hole lies outside the hole", () => {
    const [{location}] = convert(polygon([square(0, 0, 6), square(2, 2, 2)]));
    expect(location).toEqual({lng: 1, lat: 3});
  });

  test("node of a polygon with a hole lies at the centroid of its filled area", () => {
    // The hole in the lower left corner moves the centroid up and right
    const [{location}] = convert(polygon([square(0, 0, 6), square(0.5, 0.5, 2)]));
    expect(location.lng).toBeCloseTo(3.1875);
    expect(location.lat).toBeCloseTo(3.1875);
  });

  test("MultiPolygon becomes a single node within its largest polygon", () => {
    const nodes = convert({
      type: "Feature",
      id: "multi",
      properties: {},
      geometry: {
        type: "MultiPolygon",
        coordinates: [[square(0, 0, 2)], [square(10, 10, 4)]],
      },
    });
    expect(nodes).toHaveLength(1);
    expect(nodes[0].id).toBe("polygon_multi");
    expect(nodes[0].location).toEqual({lng: 12, lat: 12});
  });

  test("MultiPolygon node excludes the holes when comparing its polygons", () => {
    // The first polygon has the larger outer ring, but its hole leaves it
    // a smaller area than the second polygon.
    const [{location}] = convert({
      type: "Feature",
      properties: {},
      geometry: {
        type: "MultiPolygon",
        coordinates: [[square(0, 0, 6), square(0.5, 0.5, 5)], [square(10, 10, 4)]],
      },
    });
    expect(location).toEqual({lng: 12, lat: 12});
  });

  test("polygon node is not merged with a point at the same position", () => {
    const point = {
      type: "Feature",
      id: "point",
      properties: {},
      geometry: {type: "Point", coordinates: [2, 2]},
    };
    const area = polygon([square(0, 0, 4)], {id: "area"});
    expect(convert(point, area).map((n) => n.id)).toEqual(["point", "polygon_area"]);
    expect(convert(area, point).map((n) => n.id)).toEqual(["polygon_area", "point"]);
  });

  test("polygon node records the position of its feature", () => {
    const point = {
      type: "Feature",
      properties: {},
      geometry: {type: "Point", coordinates: [9, 9]},
    };
    const nodes = convert(
      point,
      polygon([square(0, 0, 4)]),
      polygon([square(5, 5, 2)]),
    );
    // eslint-disable-next-line no-underscore-dangle
    expect(nodes.map((n) => n.properties._featureIndex)).toEqual([undefined, 1, 2]);
  });

  test("polygons nested in a GeometryCollection get no node", () => {
    const nodes = convert({
      type: "Feature",
      properties: {},
      geometry: {
        type: "GeometryCollection",
        geometries: [
          {type: "Point", coordinates: [1, 1]},
          {type: "Polygon", coordinates: [square(0, 0, 4)]},
        ],
      },
    });
    expect(nodes).toHaveLength(1);
    // eslint-disable-next-line no-underscore-dangle
    expect(nodes[0].properties._featureType).toBe("Point");
  });

  test("degenerate polygons do not break the conversion", () => {
    const flat = [
      [1, 1],
      [3, 1],
      [1, 1],
    ];
    const nodes = convert(polygon([]), polygon([[]]), polygon([flat], {id: "flat"}));
    expect(nodes).toHaveLength(1);
    expect(nodes[0].location).toEqual({lng: 1, lat: 1});
  });

  test("polygons do not change the generated ids of points and lines", () => {
    const nodes = convert(
      polygon([square(0, 0, 4)]),
      {
        type: "Feature",
        properties: {name: "Station"},
        geometry: {type: "Point", coordinates: [10, 10]},
      },
      polygon([square(20, 20, 4)]),
      {
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates: [
            [30, 30],
            [31, 31],
          ],
        },
      },
    );
    const ids = Object.fromEntries(
      nodes.map((node) => [`${node.location.lng},${node.location.lat}`, node.id]),
    );
    expect(ids["10,10"]).toBe("gjn_0");
    expect(ids["30,30"]).toBe("gjn_1");
    expect(ids["31,31"]).toBe("gjn_2");
    expect(ids["2,2"]).toBe("gjn_polygon_0");
    expect(ids["22,22"]).toBe("gjn_polygon_1");
  });

  test("polygons never share the id of another node", () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    const point = {
      type: "Feature",
      id: 42,
      properties: {},
      geometry: {type: "Point", coordinates: [10, 10]},
    };
    const area = polygon([square(0, 0, 4)], {id: 42, properties: {}});
    [convert(point, area, area), convert(area, point, area)].forEach((nodes) => {
      // eslint-disable-next-line no-underscore-dangle
      expect(nodes.find((n) => n.properties._featureIndex === undefined).id).toBe("42");
      expect(nodes.map((node) => node.id).sort()).toEqual([
        "42",
        "polygon_42",
        "polygon_42_2",
      ]);
      expect(nodes.map((node) => node.label)).toEqual(["42", "42", "42"]);
    });
    expect(warn).toHaveBeenCalledWith(
      'Node id "polygon_42" is taken, hence "polygon_42_2" is used.',
    );
    warn.mockRestore();
  });

  test("a Point keeps its id when a polygon comes first with the same id", () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    const point = (x) => ({
      type: "Feature",
      id: "polygon_42",
      properties: {},
      geometry: {type: "Point", coordinates: [x, x]},
    });
    const area = polygon([square(0, 0, 4)], {id: 42, properties: {}});
    [convert(area, point(10), point(20)), convert(point(10), point(20), area)].forEach(
      (nodes) => {
        // eslint-disable-next-line no-underscore-dangle
        const ids = (type) => nodes.filter((n) => n.properties._featureType === type);
        expect(ids("Point").map((n) => n.id)).toEqual(["polygon_42", "polygon_42_1"]);
        expect(ids("Polygon").map((n) => n.id)).toEqual(["polygon_42_2"]);
      },
    );
    warn.mockRestore();
  });

  test("an empty id is treated as missing", () => {
    const point = (x, properties = {}) => ({
      type: "Feature",
      id: "",
      properties,
      geometry: {type: "Point", coordinates: [x, x]},
    });
    const nodes = convert(
      point(10),
      point(20, {node_id: "dev-1"}),
      polygon([square(0, 0, 4)], {id: ""}),
    );
    expect(nodes.map((node) => node.id)).toEqual(["gjn_0", "dev-1", "gjn_polygon_0"]);
    // eslint-disable-next-line no-underscore-dangle
    expect(nodes.map((node) => node._generatedIdentity)).toEqual([true, false, true]);
  });

  test.each(["Polygon", "MultiPolygon"])("%s keeps the id 0 in any order", (type) => {
    const rings = [square(0, 0, 4)];
    const zero = {
      type: "Feature",
      id: 0,
      properties: {},
      geometry: {type, coordinates: type === "Polygon" ? rings : [rings]},
    };
    const [alone] = convert(zero);
    const [, behind] = convert(polygon([square(20, 20, 4)]), zero);
    [alone, behind].forEach((node) => {
      expect(node.id).toBe("polygon_0");
      // eslint-disable-next-line no-underscore-dangle
      expect(node._generatedIdentity).toBe(false);
    });
  });
});

describe("updatePolygonOverlays", () => {
  const setUp = () => {
    const features = [{id: "point"}, {id: "area-1"}, {id: "area-2"}];
    const layers = [
      {feature: features[1], bringToFront: jest.fn()},
      {feature: features[2], bringToFront: jest.fn()},
    ];
    const shown = new Set(layers);
    const self = {
      originalGeoJSON: {features},
      leaflet: {
        polygonGeoJSON: {eachLayer: (callback) => layers.forEach(callback)},
        hasLayer: (layer) => shown.has(layer),
        addLayer: jest.fn((layer) => shown.add(layer)),
        removeLayer: jest.fn((layer) => shown.delete(layer)),
      },
    };
    return {self, layers, shown};
  };
  const cluster = (...childNodes) => ({childNodes});
  const polygonNode = (index) => ({
    properties: {_featureType: "Polygon", _featureIndex: index},
  });

  test("hides only the polygons which belong to a cluster", () => {
    const {self, layers, shown} = setUp();
    updatePolygonOverlays(self, [cluster({id: "point"}, polygonNode(1))]);
    expect([...shown]).toEqual([layers[1]]);
    expect(self.leaflet.addLayer).not.toHaveBeenCalled();
  });

  test("shows the polygons again when their cluster is gone", () => {
    const {self, layers, shown} = setUp();
    updatePolygonOverlays(self, [cluster(polygonNode(1), polygonNode(2))]);
    expect(shown.size).toBe(0);
    updatePolygonOverlays(self, [cluster({id: "point"}, polygonNode(2))]);
    expect([...shown]).toEqual([layers[0]]);
    updatePolygonOverlays(self);
    expect(shown.size).toBe(2);
  });

  test("does nothing when there are no polygon overlays", () => {
    expect(() => updatePolygonOverlays({leaflet: {}}, [cluster({})])).not.toThrow();
    expect(() => updatePolygonOverlays({}, [])).not.toThrow();
  });
});

describe("addPolygonOverlays on a rerender", () => {
  test("replaces the polygons of the previous render", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const map = L.map(container, {center: [0.5, 0.5], zoom: 5});
    const node = {
      id: "area",
      properties: {_featureType: "Polygon", _featureIndex: 0},
    };
    const self = {
      originalGeoJSON: {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            id: "area",
            properties: {},
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
          },
        ],
      },
      leaflet: map,
      config: {geoOptions: {}, onClickElement: jest.fn()},
    };
    const polygonsOnMap = () => {
      let count = 0;
      map.eachLayer((layer) => {
        if (layer.feature && layer.feature.geometry.type === "Polygon") {
          count += 1;
        }
      });
      return count;
    };
    addPolygonOverlays(self, [node]);
    addPolygonOverlays(self, [node]);
    expect(polygonsOnMap()).toBe(1);
    updatePolygonOverlays(self, [{childNodes: [node]}]);
    expect(polygonsOnMap()).toBe(0);
    map.remove();
    document.body.removeChild(container);
  });

  test("keeps the order of the polygons when one is shown again", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const map = L.map(container, {center: [35, -30], zoom: 7});
    const square = (id, west, south, size) => ({
      type: "Feature",
      id,
      properties: {},
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [west, south],
            [west + size, south],
            [west + size, south + size],
            [west, south + size],
            [west, south],
          ],
        ],
      },
    });
    const nodes = [0, 1].map((index) => ({
      properties: {_featureType: "Polygon", _featureIndex: index},
    }));
    const self = {
      originalGeoJSON: {
        type: "FeatureCollection",
        // A small polygon inside a big one, e.g. a building inside a campus
        features: [square("big", -31, 34, 2), square("small", -29.6, 35.4, 0.4)],
      },
      leaflet: map,
      config: {geoOptions: {}, onClickElement: jest.fn()},
    };
    const drawOrder = () => {
      const layers = [];
      self.leaflet.polygonGeoJSON.eachLayer((layer) => layers.push(layer));
      const layerOf = new Map(layers.map((layer) => [layer.getElement(), layer]));
      return [...map.getPane("njg-polygons").querySelectorAll("path")].map(
        (element) => layerOf.get(element).feature.id,
      );
    };
    addPolygonOverlays(self, nodes);
    expect(drawOrder()).toEqual(["big", "small"]);
    updatePolygonOverlays(self, [{childNodes: [nodes[0]]}]);
    expect(drawOrder()).toEqual(["small"]);
    updatePolygonOverlays(self, []);
    expect(drawOrder()).toEqual(["big", "small"]);
    map.remove();
    document.body.removeChild(container);
  });
});
