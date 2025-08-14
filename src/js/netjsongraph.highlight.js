/* eslint-disable no-underscore-dangle */

// Highlight controls for graph mode: click to select node/link,
// hold Ctrl/Cmd to multi-select. Non-selected items are dimmed.
// Usage: this.attachHighlight({ dimOpacity: 0.2, linkWidth: 6 })

function attachHighlight(graph, options = {}) {
  const ec = graph.echarts;

  const dimOpacity = typeof options.dimOpacity === "number" ? options.dimOpacity : 0.25;
  const selectedLinkWidth = typeof options.linkWidth === "number" ? options.linkWidth : 6;
  const highlightColor = options.color || "#ffd166";

  const selectedNodes = new Set(); // id
  const selectedLinks = new Set(); // `${source}|${target}`

  function linkKey(link) {
    return String(link.source) + "|" + String(link.target);
  }

  function isEmptySelection() {
    return selectedNodes.size === 0 && selectedLinks.size === 0;
  }

  function buildStyledSeries() {
    // Clone nodes/links and apply styles
    const baseNodes = graph.data.nodes || [];
    const baseLinks = graph.data.links || [];

    // If a link is selected, also treat its endpoints as selected (visual aid)
    const endpointSelected = new Set();
    baseLinks.forEach((l) => {
      if (selectedLinks.has(linkKey(l))) {
        endpointSelected.add(l.source);
        endpointSelected.add(l.target);
      }
    });

    const nodes = baseNodes.map((n) => {
      const sel = selectedNodes.has(n.id) || endpointSelected.has(n.id);
      const itemStyle = Object.assign({}, graph.config.graphConfig.series.nodeStyle);
      if (!sel && !isEmptySelection()) {
        itemStyle.opacity = dimOpacity;
      }
      if (sel) {
        // Subtle highlight tint
        itemStyle.borderColor = highlightColor;
        itemStyle.borderWidth = 2;
      }
      const node = Object.assign({}, n, {itemStyle});
      return node;
    });

    const links = baseLinks.map((l) => {
      const sel = selectedLinks.has(linkKey(l));
      const lineStyle = Object.assign({}, graph.config.graphConfig.series.linkStyle);
      if (sel) {
        lineStyle.width = selectedLinkWidth;
        lineStyle.color = highlightColor;
        lineStyle.opacity = 1;
      } else if (!isEmptySelection()) {
        lineStyle.opacity = dimOpacity;
      }
      const link = Object.assign({}, l, {lineStyle});
      return link;
    });

    return {nodes, links};
  }

  function applyStyles() {
    const {nodes, links} = buildStyledSeries();
    // Merge into existing series (keep type/layout/toolbox etc.)
    ec.setOption(
      {
        series: [
          {
            nodes,
            links,
          },
        ],
      },
      {notMerge: false, lazyUpdate: true},
    );
  }

  function toggleSelection(params) {
    if (params.componentSubType !== "graph") return;
    const zrEvt = params.event || {};
    const nativeEvt = zrEvt.event || zrEvt;
    const multi = !!(nativeEvt && (nativeEvt.ctrlKey || nativeEvt.metaKey));

    if (!multi) {
      selectedNodes.clear();
      selectedLinks.clear();
    }

    if (params.dataType === "node") {
      const id = params.data && (params.data.id || params.data.name);
      if (id !== undefined) {
        if (selectedNodes.has(id)) selectedNodes.delete(id);
        else selectedNodes.add(id);
      }
    } else if (params.dataType === "edge") {
      const lk = linkKey(params.data);
      if (selectedLinks.has(lk)) selectedLinks.delete(lk);
      else selectedLinks.add(lk);
    }

    applyStyles();
  }

  ec.on("click", toggleSelection);

  return {
    clear() {
      selectedNodes.clear();
      selectedLinks.clear();
      applyStyles();
    },
    destroy() {
      if (ec && ec.off) ec.off("click", toggleSelection);
      selectedNodes.clear();
      selectedLinks.clear();
    },
  };
}

export default attachHighlight;


