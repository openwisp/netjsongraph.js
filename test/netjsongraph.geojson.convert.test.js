import fs from "fs";
import path from "path";
import {geojsonToNetjson, updatePolygonOverlays} from "../src/js/netjsongraph.geojson";

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

  test("Polygon becomes a single node which keeps id and label", () => {
    const nodes = convert(polygon([square(0, 0, 4)], {id: "area-1"}));
    expect(nodes).toHaveLength(1);
    expect(nodes[0].id).toBe("area-1");
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
    expect(nodes[0].id).toBe("multi");
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
    expect(convert(point, area).map((n) => n.id)).toEqual(["point", "area"]);
    expect(convert(area, point).map((n) => n.id)).toEqual(["area", "point"]);
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
