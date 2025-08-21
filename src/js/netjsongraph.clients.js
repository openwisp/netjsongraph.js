/* eslint-disable no-underscore-dangle */
/* global echarts */

// Attach client markers (WiFi / other) around nodes in graph mode
function attachClientsOverlay(graph, options = {}) {
  const chart = graph.echarts;
  const g = echarts.graphic;

  // Use a single color for any WiFi clients (combined 2.4 GHz + 5 GHz)
  const colors = {
    wifi: (options.colors && options.colors.wifi) || "#d35454",
    other: (options.colors && options.colors.other) || "#bdc3c7",
  };
  const radius = options.radius || 3;
  const gap = options.gap || 8;
  const fields = {
    other: (options.fields && options.fields.other) || "clients_other",
  };
  // Combined wifi clients (2.4 + 5) optional field name
  const wifiCombinedField =
    (options.fields && options.fields.wifi) || "clients_wifi";

  function getSeriesViewGroup() {
    const seriesModel = chart.getModel().getSeriesByIndex(0);
    if (!seriesModel) return null;
    const chartsViews = chart._chartsViews || [];
    const seriesView = chartsViews.find(
      (v) => v && v.__model && v.__model.uid === seriesModel.uid,
    );
    return seriesView ? seriesView.group : null;
  }

  const parent = getSeriesViewGroup();
  if (!parent) return {destroy() {}};
  const overlay = new g.Group({silent: true, z: 100, zlevel: 1});
  parent.add(overlay);

  const seriesCfg =
    (graph &&
      graph.config &&
      graph.config.graphConfig &&
      graph.config.graphConfig.series) ||
    {};
  const nodeRadius =
    (typeof seriesCfg.nodeSize === "number" ? seriesCfg.nodeSize : 18) / 2;

  function draw() {
    const seriesModel = chart.getModel().getSeriesByIndex(0);
    if (!seriesModel) return;
    const data = seriesModel.getData();
    if (!data) return;

    overlay.removeAll();

    const placeOrbit = (centerX, centerY, counts, startDistance) => {
      const a = 1.2;
      let i = 0;
      const total = counts.reduce((s, v) => s + v.count, 0);
      if (total === 0) return;
      for (let orbit = 0; i < total; orbit += 1) {
        const distance = Math.max(0.1, startDistance + orbit * 2 * radius * a);
        const n = Math.max(1, Math.floor((Math.PI * distance) / (a * radius)));
        const delta = total - i;
        for (let j = 0; j < Math.min(delta, n); j += 1, i += 1) {
          // Determine which category this marker belongs to based on cumulative counts
          let color = colors.other;
          let cum = 0;
          for (let k = 0; k < counts.length; k += 1) {
            cum += counts[k].count;
            if (i < cum) {
              color = counts[k].color;
              break;
            }
          }

          const angle = ((2 * Math.PI) / n) * j;
          const x = centerX + distance * Math.cos(angle);
          const y = centerY + distance * Math.sin(angle);

          overlay.add(
            new g.Circle({
              shape: {cx: x, cy: y, r: radius},
              style: {fill: color},
              silent: true,
              z: 100,
              zlevel: 1,
            }),
          );
        }
      }
    };

    const count = data.count ? data.count() : data._rawData.length;
    for (let idx = 0; idx < count; idx += 1) {
      const layout = data.getItemLayout(idx);
      if (layout) {
        const x = Array.isArray(layout) ? layout[0] : layout.x;
        const y = Array.isArray(layout) ? layout[1] : layout.y;
        const node = data.getRawDataItem(idx) || {};
        const other =
          node[fields.other] ||
          (node.properties && node.properties[fields.other]) ||
          0;

        const startDistance = nodeRadius + radius + Math.max(0, gap);
        const wifi =
          node[wifiCombinedField] ||
          (node.properties && node.properties[wifiCombinedField]) ||
          0;
        placeOrbit(
          x,
          y,
          [
            {count: wifi, color: colors.wifi},
            {count: other, color: colors.other},
          ],
          startDistance,
        );
      }
    }
  }

  const handlers = [
    ["finished", draw],
    ["rendered", draw],
    ["graphLayoutEnd", draw],
    ["graphRoam", draw],
  ];
  handlers.forEach(([ev, fn]) => chart.on(ev, fn));
  draw();

  return {
    destroy() {
      handlers.forEach(([ev, fn]) => {
        if (chart && chart.off) {
          chart.off(ev, fn);
        }
      });
      if (overlay && overlay.parent) overlay.parent.remove(overlay);
    },
  };
}

export default attachClientsOverlay;
