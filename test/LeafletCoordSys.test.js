import L from "leaflet";
import createLeafletCoordSystem from "../lib/js/echarts-leaflet/LeafletCoordSys";

describe("LeafletCoordSys", () => {
  it("should set worldCopyJump to true by default", () => {
    const echartsMock = {
      util: {
        curry: (fn, method) => fn.bind(null, method),
      },
      graphic: {
        BoundingRect: class {},
      },
      matrix: {
        create: () => [],
      },
    };
    const LeafletCoordSys = createLeafletCoordSystem(echartsMock, L);
    const mockModel = {
      get: (key) => {
        if (key === "mapOptions") return {}; // no user options
        if (key === "tiles") return [];
        if (key === "layerControl") return {};
        return undefined;
      },
      __map: null,
    };
    const api = {
      getDom: () => document.createElement("div"),
      getZr: () => ({
        painter: {
          getViewportRoot: () => document.createElement("div"),
        },
      }),
    };
    const ecModel = {
      eachComponent: (type, callback) => {
        if (type === "leaflet") callback(mockModel);
      },
      eachSeries: () => {},
    };
    LeafletCoordSys.create(ecModel, api);
    expect(mockModel.__map.options.worldCopyJump).toBe(true);
  });
});
