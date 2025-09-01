/* eslint-disable no-underscore-dangle */
/* global echarts */
function attachClientsOverlay(graph, options = {}) {
  const chart = graph.echarts;
  const g = echarts.graphic;
  const colors = {
    wifi: (options.colors && options.colors.wifi) || "#d35454",
  };
  const radius = options.radius || 3;
  const gap = options.gap || 8;

  let minZoomLevel = options.minZoomLevel || 1.5;
  let currentZoom = 1;

  const getClientCount = (node) => {
    if (!node) return 0;
    if (typeof node.clients === "number") return node.clients;
    if (Array.isArray(node.clients)) return node.clients.length;
    return 0;
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
    (typeof seriesCfg.nodeSize === "number" ? seriesCfg.nodeSize : 18) / 2;

  function getCurrentZoom() {
    const option = chart.getOption();
    if (option && option.series && option.series[0] && option.series[0].zoom) {
      return option.series[0].zoom;
    }
    return 1;
  }

  function updateZoom() {
    currentZoom = getCurrentZoom();
    const shouldShow = currentZoom >= minZoomLevel;
    overlay.attr("invisible", !shouldShow);
  }

  function draw() {
    const seriesModel = chart.getModel().getSeriesByIndex(0);
    if (!seriesModel) return;
    const data = seriesModel.getData();
    if (!data) return;

    updateZoom();
    overlay.removeAll();

    if (currentZoom < minZoomLevel) {
      overlay.attr("invisible", true);
      return;
    }

    overlay.attr("invisible", false);

    const placeOrbit = (centerX, centerY, total, startDistance, color) => {
      const a = 1.2;
      let i = 0;
      if (total === 0) return;

      for (let orbit = 0; i < total; orbit += 1) {
        const distance = Math.max(0.1, startDistance + orbit * 2 * radius * a);
        const n = Math.max(1, Math.floor((Math.PI * distance) / (a * radius)));
        const delta = total - i;

        for (let j = 0; j < Math.min(delta, n); j += 1, i += 1) {
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

        const startDistance = nodeRadius + radius + Math.max(0, gap);
        const wifi = getClientCount(node);

        placeOrbit(x, y, wifi, startDistance, colors.wifi);
      }
    }
  }

  const handlers = [
    ["finished", draw],
    ["rendered", draw],
    ["graphLayoutEnd", draw],
    [
      "graphRoam",
      () => {
        updateZoom();
        draw();
      },
    ],
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
    setMinZoomLevel(newLevel) {
      minZoomLevel = newLevel;
      draw();
    },
    getMinZoomLevel() {
      return minZoomLevel;
    },
  };
}

export default attachClientsOverlay;
