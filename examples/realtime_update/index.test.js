const assert = require("assert");
const echarts = require("echarts");

describe("ECharts Update Regression Tests", () => {
  it("should update series data to undefined if data is set to undefined (Issue #305)", () => {
    // Create a container element with explicit dimensions for the canvas.
    const chartDom = document.createElement("div");
    chartDom.style.width = "400px";
    chartDom.style.height = "300px";
    document.body.appendChild(chartDom);

    const chart = echarts.init(chartDom);

    // Set an initial valid option with series data.
    const initialOption = {
      xAxis: [{}],
      yAxis: [{}],
      series: [
        {
          type: "line",
          data: [1, 2, 3, 4, 5],
        },
      ],
    };
    chart.setOption(initialOption);

    // Update the chart by setting series data to undefined.
    // In the latest ECharts, this update results in the series data remaining undefined.
    chart.setOption({
      series: [
        {
          data: undefined,
        },
      ],
    });

    // Retrieve the updated option.
    const updatedOption = chart.getOption();
    const newData = updatedOption.series[0].data;

    // Expected outcome: for the latest ECharts, setting series data to undefined leaves it as undefined.
    assert.strictEqual(
      newData,
      undefined,
      "Expected updated series data to be undefined when undefined is provided.",
    );
  });
});
