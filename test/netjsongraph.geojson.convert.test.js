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
    expect(nodes.map((n) => n._featureIndex)).toEqual([undefined, 1, 2]);
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
      expect(nodes.find((node) => node._featureIndex === undefined).id).toBe("42");
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
    const layers = [{feature: features[1]}, {feature: features[2]}];
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

  test("hides only the polygons which belong to a cluster", () => {
    const {self, layers, shown} = setUp();
    updatePolygonOverlays(self, [cluster({id: "point"}, {_featureIndex: 1})]);
    expect([...shown]).toEqual([layers[1]]);
    expect(self.leaflet.addLayer).not.toHaveBeenCalled();
  });

  test("shows the polygons again when their cluster is gone", () => {
    const {self, layers, shown} = setUp();
    updatePolygonOverlays(self, [cluster({_featureIndex: 1}, {_featureIndex: 2})]);
    expect(shown.size).toBe(0);
    updatePolygonOverlays(self, [cluster({id: "point"}, {_featureIndex: 2})]);
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
    const node = {id: "area", _featureIndex: 0};
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
});
