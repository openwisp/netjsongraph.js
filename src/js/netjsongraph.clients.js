/* eslint-disable no-underscore-dangle */
/* global echarts */
function attachClientsOverlay(graph, options = {}) {
  const chart = graph.echarts;
  const g = echarts.graphic;
  const colors = {
    wifi: (options.colors && options.colors.wifi) || "#d35454",
    other: (options.colors && options.colors.other) || "#bdc3c7",
  };
  const radius = options.radius || 3;
  const gap = options.gap || 8;
  const fields = {
    other: (options.fields && options.fields.other) || "clients_other",
    wifi: (options.fields && options.fields.wifi) || "clients_wifi",
  };

  const readCountFromField = (fieldName, obj) => {
    if (!fieldName || !obj) return 0;
    const top = obj[fieldName];
    const nested = obj.properties && obj.properties[fieldName];
    const val = top !== undefined ? top : nested;
    if (typeof val === "number") return val;
    if (Array.isArray(val)) return val.length;
    return 0;
  };

  const getClientCount = (node) => {
    if (!node) return 0;
    const overrideCount = readCountFromField(fields.wifi, node);
    if (overrideCount > 0) return overrideCount;
    const directCount =
      (typeof node.clients_count === "number" && node.clients_count) ||
      (Array.isArray(node.clients) && node.clients.length) ||
      (node.properties &&
        ((typeof node.properties.clients_count === "number" &&
          node.properties.clients_count) ||
          (Array.isArray(node.properties.clients) &&
            node.properties.clients.length))) ||
      0;
    if (directCount > 0) return directCount;
    const combined =
      (typeof node.clients_wifi === "number" && node.clients_wifi) ||
      (node.properties &&
        typeof node.properties.clients_wifi === "number" &&
        node.properties.clients_wifi) ||
      0;
    if (combined > 0) return combined;
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
  if (!parent) return { destroy() {} };
  const overlay = new g.Group({ silent: true, z: 100, zlevel: 1 });
  parent.add(overlay);

  const seriesCfg =
    (graph &&
      graph.config &&
      graph.config.graphConfig &&
      graph.config.graphConfig.series) ||
    {};
  const nodeRadius =
    (typeof seriesCfg.nodeSize === "number" ? seriesCfg.nodeSize : 18) / 2;

  function draw(isDestroying = false) {
    const seriesModel = chart.getModel().getSeriesByIndex(0);
    if (!seriesModel) return;
    const data = seriesModel.getData();
    if (!data) return;

    const desiredDots = new Map();

    // Step 1: Calculate where all dots SHOULD be, unless we are destroying.
    if (!isDestroying) {
        const count = data.count ? data.count() : data._rawData.length;
        for (let idx = 0; idx < count; idx += 1) {
            const layout = data.getItemLayout(idx);
            if (!layout) continue;

            const x = Array.isArray(layout) ? layout[0] : layout.x;
            const y = Array.isArray(layout) ? layout[1] : layout.y;
            const node = data.getRawDataItem(idx) || {};
            const startDistance = nodeRadius + radius + Math.max(0, gap);

            const counts = [
                { count: getClientCount(node), color: colors.wifi },
                { count: readCountFromField(fields.other, node), color: colors.other },
            ];

            let i = 0;
            const total = counts.reduce((s, v) => s + v.count, 0);
            if (total === 0) continue;

            for (let orbit = 0; i < total; orbit += 1) {
                const a = 1.2;
                const distance = Math.max(0.1, startDistance + orbit * 2 * radius * a);
                const n = Math.max(1, Math.floor((Math.PI * distance) / (a * radius)));
                const delta = total - i;

                for (let j = 0; j < Math.min(delta, n); j += 1, i += 1) {
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
                    const dotX = x + distance * Math.cos(angle);
                    const dotY = y + distance * Math.sin(angle);
                    // Use a unique ID for each dot to track it
                    const dotId = `dot-${node.id}-${i}`;
                    desiredDots.set(dotId, { x: dotX, y: dotY, color });
                }
            }
        }
    }

    const existingDots = new Map();
    overlay.eachChild(child => {
        if (child.id) existingDots.set(child.id, child);
    });

    // Step 2: (EXIT) Animate out any dots that exist but are no longer desired.
    existingDots.forEach((child, id) => {
        if (!desiredDots.has(id)) {
            child.animateTo({
                shape: { r: 0 },
                style: { opacity: 0 },
            }, {
                duration: 300,
                easing: 'cubicIn',
                done: () => {
                    // Important: remove the child only after animation is done.
                    if (child.parent) child.parent.remove(child);
                }
            });
        }
    });

    // Step 3: (ENTER/UPDATE) Add new dots and move existing ones to their new positions.
    desiredDots.forEach((props, id) => {
        const existing = existingDots.get(id);
        if (existing) {
            // (UPDATE) This dot already exists, so just animate it to its new position.
            existing.animateTo({
                shape: { cx: props.x, cy: props.y },
            }, { duration: 300, easing: 'cubicOut' });
        } else {
            // (ENTER) This is a new dot. Create it, add it, and animate it in.
            const circle = new g.Circle({
                id: id,
                shape: { cx: props.x, cy: props.y, r: 0 },
                style: { fill: props.color, opacity: 0 },
                silent: true, z: 100, zlevel: 1,
            });
            overlay.add(circle);
            circle.animateTo({
                shape: { r: radius },
                style: { opacity: 1 },
            }, { duration: 400, easing: 'cubicOut' });
        }
    });
  }

  // Use a safer set of events to avoid the infinite loop
  const handlers = [
    ["graphLayoutEnd", draw], // Fires once when the force layout stabilizes
    ["graphRoam", draw],      // Fires when user zooms or pans
  ];
  handlers.forEach(([ev, fn]) => chart.on(ev, fn));
  
  // Call draw once initially
  draw();

  return {
    destroy(onDone) {
      handlers.forEach(([ev, fn]) => {
        if (chart && chart.off) chart.off(ev, fn);
      });
      
      const children = overlay.children() || [];
      if (children.length === 0) {
        if (overlay.parent) overlay.parent.remove(overlay);
        if (onDone) onDone();
        return;
      }

      children.forEach((child, index) => {
        if (child && child.animateTo) {
          child.animateTo({
            shape: { r: 0 },
            style: { opacity: 0 },
          }, {
            duration: 300,
            easing: 'cubicIn',
            done: () => {
              if (index === children.length - 1) {
                if (overlay && overlay.parent) {
                  overlay.parent.remove(overlay);
                }
                if (onDone) onDone();
              }
            }
          });
        }
      });
    },
  };
}

export default attachClientsOverlay;