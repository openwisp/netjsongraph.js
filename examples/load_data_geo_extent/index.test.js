const assert = require("assert");
const echarts = require("echarts");

// Register a minimal dummy map for "world"
echarts.registerMap("world", {
  type: "FeatureCollection",
  features: [],
  regions: [], // Provide an empty regions array to avoid errors.
});

describe("ECharts Geo Extent Data Load Tests", () => {
  it("should load data correctly with the latest ECharts API", () => {
    const chart = echarts.init(document.createElement("div"));
    const option = {
      geo: {
        map: "world",
        roam: true,
      },
      series: [
        {
          type: "scatter",
          coordinateSystem: "geo",
          data: [{name: "Location", value: [116.46, 39.92]}],
        },
      ],
    };
    chart.setOption(option);
    const data = chart.getOption().series[0].data;
    assert.strictEqual(data.length, 1);
    assert.strictEqual(data[0].name, "Location");
  });

  it("should handle empty data gracefully", () => {
    const chart = echarts.init(document.createElement("div"));
    const option = {
      geo: {
        map: "world",
        roam: true,
      },
      series: [
        {
          type: "scatter",
          coordinateSystem: "geo",
          data: [],
        },
      ],
    };
    chart.setOption(option);
    const data = chart.getOption().series[0].data;
    assert.strictEqual(Array.isArray(data), true, "Data should be an array");
    assert.deepStrictEqual(data, [], "Data should be exactly an empty array");
  });
});
