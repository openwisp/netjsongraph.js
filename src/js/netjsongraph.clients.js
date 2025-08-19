/* eslint-disable no-underscore-dangle */
/* global echarts */

// Attach client markers (2.4/5/other) around nodes in graph mode
function attachClientsOverlay(graph, options = {}) {
  const chart = graph.echarts;
  const g = echarts.graphic;

  const colors = {
    wifi24: (options.colors && options.colors.wifi24) || "#d35454",
    wifi5: (options.colors && options.colors.wifi5) || "#2ecc71",
    other: (options.colors && options.colors.other) || "#bdc3c7",
  };
  const radius = options.radius || 3;
  const gap = options.gap || 8;
  const fields = {
    wifi24: (options.fields && options.fields.wifi24) || "clients_wifi24",
    wifi5: (options.fields && options.fields.wifi5) || "clients_wifi5",
    other: (options.fields && options.fields.other) || "clients_other",
  };

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
    typeof seriesCfg.nodeSize === "number" ? seriesCfg.nodeSize : 18;

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
          let color = colors.other;
          if (i < counts[0].count) color = counts[0].color;
          else if (i < counts[0].count + counts[1].count)
            color = counts[1].color;
          else color = counts[2].color;

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
        const c24 =
          node[fields.wifi24] ||
          (node.properties && node.properties[fields.wifi24]) ||
          0;
        const c5 =
          node[fields.wifi5] ||
          (node.properties && node.properties[fields.wifi5]) ||
          0;
        const other =
          node[fields.other] ||
          (node.properties && node.properties[fields.other]) ||
          0;

        const startDistance = nodeRadius + gap;
        placeOrbit(
          x,
          y,
          [
            {count: c24, color: colors.wifi24},
            {count: c5, color: colors.wifi5},
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
