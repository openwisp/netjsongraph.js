import fs from "fs";
import path from "path";
import {geojsonToNetjson} from "../src/js/netjsongraph.geojson";

describe("geojsonToNetjson conversion", () => {
  const samplePath = path.join(
    __dirname,
    "../public/assets/data/geojson-sample.json",
  );
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
