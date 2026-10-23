import fs from "fs";
import path from "path";
import {geojsonToNetjson} from "../src/js/netjsongraph.geojson";

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
      // the original feature id is kept in properties and as the label
      result.nodes.forEach((n) => {
        expect(n.properties.id).toBe("mp");
        expect(n.label).toBe("mp");
      });
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
