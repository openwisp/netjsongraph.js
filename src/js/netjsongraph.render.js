import {graphic, use} from "echarts/core";
import {setLabelText} from "echarts/lib/label/labelStyle";
import {install as LinesChart} from "echarts/lib/chart/lines/install";
import {install as GraphChart} from "echarts/lib/chart/graph/install";
import {install as ScatterChart} from "echarts/lib/chart/scatter/install";
import {install as TooltipComponent} from "echarts/lib/component/tooltip/install";
import {install as TitleComponent} from "echarts/lib/component/title/install";
import {install as ToolboxComponent} from "echarts/lib/component/toolbox/install";
import {install as LegendComponent} from "echarts/lib/component/legend/install";
import {install as GraphicComponent} from "echarts/lib/component/graphic/install";
import {install as SVGRenderer} from "echarts/lib/renderer/installSVGRenderer";
import {install as CanvasRenderer} from "echarts/lib/renderer/installCanvasRenderer";
import getLeaflet from "./leaflet-loader";
import {
  addPolygonOverlays,
  isPolygon,
  updatePolygonOverlays,
} from "./netjsongraph.geojson";

use([
  GraphChart,
  LinesChart,
  TooltipComponent,
  TitleComponent,
  ToolboxComponent,
  LegendComponent,
  SVGRenderer,
  CanvasRenderer,
  ScatterChart,
  GraphicComponent,
]);

/**
 * @class
 * NetJSONGraphRender - Rendering utilities and visualization engine integration.
 *
 * Main Responsibilities:
 * - Provides mapRender() and graphRender() methods for different view modes
 * - Integrates ECharts and Leaflet for network topology visualization
 * - Handles interactive features like tooltips and legends
 * - Manages node clustering and styling
 */
class NetJSONGraphRender {
  // Named and HSL colors require an explicit emphasis borderColor.
  getColorWithOpacity(color, opacity) {
    if (typeof color !== "string") {
      return color;
    }
    const hex = color.match(/^#([\da-f]{3}|[\da-f]{6})$/i);
    if (hex) {
      const value = hex[1].length === 3 ? hex[1].replace(/(.)/g, "$1$1") : hex[1];
      const [red, green, blue] = value
        .match(/[\da-f]{2}/gi)
        .map((part) => parseInt(part, 16));
      return `rgba(${red}, ${green}, ${blue}, ${opacity})`;
    }
    const rgb = color.match(/^rgba?\(([^)]+)\)$/i);
    if (rgb) {
      return `rgba(${rgb[1].split(",").slice(0, 3).join(",")}, ${opacity})`;
    }
    return color;
  }

  getNodeEmphasisStyle(
    nodeStyleConfig,
    nodeEmphasisConfig = {},
    defaultEmphasisStyle = {},
  ) {
    const {borderOpacity: defaultBorderOpacity = 0.5, ...defaultStyle} =
      defaultEmphasisStyle;
    const {borderOpacity: nodeBorderOpacity, ...nodeStyle} =
      nodeEmphasisConfig.nodeStyle || {};
    const borderColor =
      nodeStyle.borderColor ||
      defaultStyle.borderColor ||
      this.getColorWithOpacity(
        nodeStyleConfig && nodeStyleConfig.color,
        nodeBorderOpacity === undefined ? defaultBorderOpacity : nodeBorderOpacity,
      );
    return {
      nodeStyle: {
        ...defaultStyle,
        ...(borderColor ? {borderColor} : {}),
        ...nodeStyle,
      },
      ...(nodeEmphasisConfig.nodeSize ? {nodeSize: nodeEmphasisConfig.nodeSize} : {}),
    };
  }

  /**
   * @function
   * @name echartsSetOption
   *
   * set option in echarts and render.
   *
   * @param  {object}  customOption    custom option determined by different render.
   * @param  {object}  self          NetJSONGraph object
   *
   * @return {object}  graph object
   *
   */
  echartsSetOption(customOption, self) {
    const configs = self.config;
    const echartsLayer = self.echarts;
    const commonOption = self.utils.deepMergeObj(
      {
        // Show element's detail when hover

        tooltip: {
          confine: true,
          hideDelay: 0,
          position: (pos, params, dom, rect, size) => {
            let position = "right";
            if (size.viewSize[0] - pos[0] < size.contentSize[0]) {
              position = "left";
            }
            if (params.componentSubType === "lines") {
              position = [
                pos[0] + size.contentSize[0] / 8,
                pos[1] - size.contentSize[1] / 2,
              ];

              if (size.viewSize[0] - position[0] < size.contentSize[0]) {
                position[0] -= 1.25 * size.contentSize[0];
              }
            }
            return position;
          },
          padding: [5, 12],
          textStyle: {
            lineHeight: 20,
          },
          renderMode: "html",
          className: "njg-tooltip",
          formatter: (params) => {
            if (params.componentSubType === "graph") {
              return params.dataType === "edge"
                ? self.utils.getLinkTooltipInfo(params.data)
                : self.utils.getNodeTooltipInfo(params.data);
            }
            return params.componentSubType === "lines"
              ? self.utils.getLinkTooltipInfo(params.data.link)
              : self.utils.getNodeTooltipInfo(params.data.node);
          },
        },
      },
      configs.echartsOption,
    );

    if (typeof self.utils.clearHighlight === "function") {
      self.utils.clearHighlight.call(self);
    }
    echartsLayer.setOption(self.utils.deepMergeObj(commonOption, customOption));
    if (self.echartsClickHandler && typeof echartsLayer.off === "function") {
      echartsLayer.off("click", self.echartsClickHandler);
    }
    self.echartsClickHandler = (params) => {
      const popupSelection = {};
      self.popupSelection = popupSelection;
      const event = params.event && (params.event.event || params.event);
      const append = Boolean(event && (event.ctrlKey || event.metaKey));
      if (
        params.componentSubType !== "graph" &&
        params.componentSubType !== "lines" &&
        params.data &&
        !params.data.cluster &&
        !isPolygon(params.data.node) &&
        configs.mapOptions?.nodePopup?.show &&
        self.leaflet
      ) {
        // Supersede pending content immediately, before the deferred loader
        // starts, so an older failure cannot clear the new bookmark.
        self.leaflet.currentPopupRequest = null;
        if (self.leaflet.currentPopup) {
          // Replacement is not a user close: retain selection and history.
          const previousPopup = self.leaflet.currentPopup;
          self.leaflet.currentPopup = null;
          previousPopup.remove();
          if (!append) {
            self.utils.clearHighlight.call(self);
          }
          self.utils.setTooltipVisibility(self, true);
          self.utils.updateLabelVisibility(self, true);
        }
      }
      self.utils.addActionToUrl(self, params);
      const highlightOptions = {
        showInfo: true,
        append,
        toggle: append,
        seriesIndex: params.seriesIndex,
        dataIndex: params.dataIndex,
      };
      if (params.componentSubType === "graph") {
        if (params.dataType === "edge") {
          self.utils.highlightLink(params.data, {
            ...highlightOptions,
            dataType: "edge",
          });
        } else {
          self.utils.highlightNode(params.data, {
            ...highlightOptions,
            dataType: "node",
          });
        }
        return;
      }
      if (params.componentSubType === "lines") {
        self.utils.highlightLink(params.data.link, {
          ...highlightOptions,
        });
        return;
      }
      if (params.data && !params.data.cluster) {
        const {node} = params.data;
        if (configs.mapOptions?.nodePopup?.show) {
          if (!isPolygon(node)) {
            // Let Leaflet process the same click before opening the popup, so
            // it cannot immediately close it or hide the click from listeners.
            setTimeout(() => {
              if (self.popupSelection === popupSelection) {
                self.gui.loadNodePopup(node);
              }
            }, 0);
          } else {
            self.gui.loadNodePopup(node);
          }
        }
        if (isPolygon(node)) {
          self.config.onClickElement.call(self, "Feature", {
            // eslint-disable-next-line no-underscore-dangle
            ...self.originalGeoJSON.features[node.properties._featureIndex].properties,
          });
          return;
        }
        self.utils.highlightNode(node, {
          ...highlightOptions,
        });
      }
    };
    echartsLayer.on("click", self.echartsClickHandler);

    return echartsLayer;
  }

  /**
   * @function
   * @name generateGraphOption
   *
   * generate graph option in echarts by JSONData.
   *
   * @param  {object}  JSONData        Render data
   * @param  {object}  self          NetJSONGraph object
   *
   * @return {object}  graph option
   *
   */
  generateGraphOption(JSONData, self) {
    const categories = [];
    const configs = self.config;
    // Polygons can only be drawn on maps: the nodes which stand for them are left out
    const drawableNodes = JSONData.nodes.filter((node) => !isPolygon(node));
    const nodes = drawableNodes.map((node) => {
      const nodeResult = self.utils.fastDeepCopy(node);
      const {nodeStyleConfig, nodeSizeConfig, nodeEmphasisConfig} =
        self.utils.getNodeStyle(node, configs, "graph");
      const emphasisConfig = this.getNodeEmphasisStyle(
        nodeStyleConfig,
        nodeEmphasisConfig,
        (configs.graphConfig.series.emphasis || {}).itemStyle,
      );
      nodeResult.itemStyle = nodeStyleConfig;
      nodeResult.symbolSize = nodeSizeConfig;
      if (Object.keys(emphasisConfig.nodeStyle).length || emphasisConfig.nodeSize) {
        nodeResult.emphasis = {
          ...(Object.keys(emphasisConfig.nodeStyle).length
            ? {itemStyle: emphasisConfig.nodeStyle}
            : {}),
          ...(emphasisConfig.nodeSize ? {symbolSize: emphasisConfig.nodeSize} : {}),
        };
      }
      let resolvedName = "";
      if (typeof node.label === "string") {
        resolvedName = node.label;
      } else if (typeof node.name === "string") {
        resolvedName = node.name;
      } else if (node.id !== undefined && node.id !== null) {
        resolvedName = String(node.id);
      }
      nodeResult.name = resolvedName;
      // Preserve original NetJSON node for sidebar use
      /* eslint-disable no-underscore-dangle */
      nodeResult._source = self.utils.fastDeepCopy(node);
      return nodeResult;
    });
    const links = JSONData.links.map((link) => {
      const linkResult = self.utils.fastDeepCopy(link);
      const {linkStyleConfig, linkEmphasisConfig} = self.utils.getLinkStyle(
        link,
        configs,
        "graph",
      );
      linkResult.lineStyle = linkStyleConfig;
      if (linkEmphasisConfig.linkStyle) {
        linkResult.emphasis = {lineStyle: linkEmphasisConfig.linkStyle};
      }
      return linkResult;
    });

    // Clone label config to avoid mutating defaults
    const baseGraphSeries = {...configs.graphConfig.series};
    const baseGraphLabel = {...(baseGraphSeries.label || {})};

    if (self.config.showGraphLabelsAtZoom > 0) {
      const {formatter} = baseGraphLabel;
      baseGraphLabel.formatter = (params) => {
        const model = self.echarts.getModel().getSeriesByIndex(0);
        const visible =
          self.fitLabelsVisible ??
          (model.get("zoom") || 1) >= self.config.showGraphLabelsAtZoom;
        if (!visible || formatter === "") {
          return "";
        }
        return formatter
          ? model.getFormattedLabel(params.dataIndex, "normal", null, null, formatter)
          : (params.name ?? params.data?.name ?? "");
      };
    }
    baseGraphSeries.label = baseGraphLabel;
    const series = [
      {
        ...baseGraphSeries,
        id: "network-graph",
        type: "graph",
        layout: configs.graphConfig.series.layout || "force",
        nodes,
        links,
      },
    ];
    const legend = categories.length
      ? {
          data: categories,
        }
      : undefined;

    return {
      legend,
      series,
      ...configs.graphConfig.baseOptions,
    };
  }

  /**
   * @function
   * @name generateMapOption
   *
   * generate map option in echarts by JSONData.
   *
   * @param  {object}  JSONData        Render data
   * @param  {object}  self          NetJSONGraph object
   *
   * @return {object}  map option
   *
   */
  generateMapOption(JSONData, self, clusters = []) {
    const configs = self.config;
    const {nodes, links} = JSONData;
    const flatNodes = JSONData.flatNodes || {};
    const linesData = [];
    let nodesData = [];
    self.polygonDataIndices = new Map();

    nodes.forEach((node) => {
      if (node.properties) {
        // Maintain flatNodes lookup regardless of whether the node is rendered as a marker
        if (!JSONData.flatNodes) {
          flatNodes[node.id] = self.utils.fastDeepCopy(node);
        }
      }

      // Polygon anchors share ECharts labels/tooltips with points, without a marker.
      if (
        node.properties &&
        // eslint-disable-next-line no-underscore-dangle
        node.properties._featureType &&
        // eslint-disable-next-line no-underscore-dangle
        node.properties._featureType !== "Point" &&
        !isPolygon(node)
      ) {
        return; // skip marker push only
      }
      if (!node.properties) {
        console.error(`Node ${node.id} position is undefined!`);
      } else {
        const {location} = node.properties;

        if (!location || location.lng == null || location.lat == null) {
          console.error(`Node ${node.id} position is undefined!`);
        } else {
          const {nodeStyleConfig, nodeEmphasisConfig} = self.utils.getNodeStyle(
            node,
            configs,
            "map",
          );
          const emphasisConfig = this.getNodeEmphasisStyle(
            nodeStyleConfig,
            nodeEmphasisConfig,
            (configs.mapOptions.nodeConfig.emphasis || {}).itemStyle,
          );

          let nodeName = "";
          if (typeof node.label === "string") {
            nodeName = node.label;
          } else if (typeof node.name === "string") {
            nodeName = node.name;
          } else if (node.id !== undefined && node.id !== null) {
            nodeName = String(node.id);
          }
          if (isPolygon(node)) {
            self.polygonDataIndices.set(node.id, nodesData.length);
          }
          nodesData.push({
            name: nodeName,
            value: [location.lng, location.lat],
            ...(isPolygon(node) ? {symbolSize: 0} : {}),
            ...(Object.keys(emphasisConfig.nodeStyle).length || emphasisConfig.nodeSize
              ? {
                  emphasis: {
                    ...(Object.keys(emphasisConfig.nodeStyle).length
                      ? {itemStyle: emphasisConfig.nodeStyle}
                      : {}),
                    ...(emphasisConfig.nodeSize
                      ? {symbolSize: emphasisConfig.nodeSize}
                      : {}),
                  },
                }
              : {}),
            node,
            _source: self.utils.fastDeepCopy(node),
          });
        }
      }
    });
    links.forEach((link) => {
      if (!flatNodes[link.source]) {
        console.warn(`Node ${link.source} does not exist!`);
      } else if (!flatNodes[link.target]) {
        console.warn(`Node ${link.target} does not exist!`);
      } else {
        const {linkStyleConfig, linkEmphasisConfig} = self.utils.getLinkStyle(
          link,
          configs,
          "map",
        );
        linesData.push({
          coords: [
            [
              flatNodes[link.source].properties.location.lng,
              flatNodes[link.source].properties.location.lat,
            ],
            [
              flatNodes[link.target].properties.location.lng,
              flatNodes[link.target].properties.location.lat,
            ],
          ],
          lineStyle: linkStyleConfig,
          ...(linkEmphasisConfig.linkStyle
            ? {emphasis: {lineStyle: linkEmphasisConfig.linkStyle}}
            : {}),
          link,
        });
      }
    });

    nodesData = nodesData.concat(clusters);
    const series = [
      {
        id: "geo-map",
        type: "scatter",
        name: "nodes",
        coordinateSystem: "leaflet",
        cursor: configs.mapOptions.nodeConfig.cursor,
        data: nodesData,
        label: {
          ...(configs.mapOptions.nodeConfig.label || {}),
          ...(configs.showMapLabelsAtZoom === false ? {show: false} : {}),
          silent: true,
        },
        itemStyle: {
          color: (params) => {
            if (
              params.data &&
              params.data.cluster &&
              params.data.itemStyle &&
              params.data.itemStyle.color
            ) {
              return params.data.itemStyle.color;
            }
            if (params.data && params.data.node && params.data.node.category) {
              const category = configs.nodeCategories.find(
                (cat) => cat.name === params.data.node.category,
              );
              const nodeColor =
                (category && category.nodeStyle && category.nodeStyle.color) ||
                (configs.mapOptions.nodeConfig &&
                  configs.mapOptions.nodeConfig.nodeStyle &&
                  configs.mapOptions.nodeConfig.nodeStyle.color) ||
                "#6c757d";
              return nodeColor;
            }
            const defaultColor =
              (configs.mapOptions.nodeConfig &&
                configs.mapOptions.nodeConfig.nodeStyle &&
                configs.mapOptions.nodeConfig.nodeStyle.color) ||
              "#6c757d";
            return defaultColor;
          },
        },
        symbolSize: (value, params) => {
          if (params.data && params.data.cluster) {
            return (
              (configs.mapOptions.clusterConfig &&
                configs.mapOptions.clusterConfig.symbolSize) ||
              30
            );
          }
          if (params.data && params.data.node) {
            const {nodeSizeConfig} = self.utils.getNodeStyle(
              params.data.node,
              configs,
              "map",
            );
            return typeof nodeSizeConfig === "object"
              ? (configs.mapOptions.nodeConfig &&
                  configs.mapOptions.nodeConfig.nodeSize) ||
                  17
              : nodeSizeConfig;
          }
          return (
            (configs.mapOptions.nodeConfig && configs.mapOptions.nodeConfig.nodeSize) ||
            17
          );
        },
        emphasis: configs.mapOptions.nodeConfig.emphasis,
      },
      Object.assign(configs.mapOptions.linkConfig, {
        id: "map-links",
        type: "lines",
        coordinateSystem: "leaflet",
        data: linesData,
      }),
    ];

    return {
      leaflet: {
        tiles: configs.mapTileConfig,
        mapOptions: configs.mapOptions,
      },
      series,
      ...configs.mapOptions.baseOptions,
    };
  }

  /**
   * @function
   * @name _propagateGraphZoom
   *
   * Enables wheel zoom outside graph canvas area.
   * @param  {object}  self          NetJSONGraph object
   *
   */
  _propagateGraphZoom(self) {
    const dom = self.echarts.getDom && self.echarts.getDom();
    if (!dom) {
      return;
    }
    const canvas = dom.querySelector("canvas");
    dom.addEventListener(
      "wheel",
      (e) => {
        if (!canvas) {
          return;
        }
        const rect = dom.getBoundingClientRect();
        // if coordinates of mouse are inside the canvas,
        // zoom will be handled normally
        if (
          e.clientX < rect.left ||
          e.clientX > rect.right ||
          e.clientY < rect.top ||
          e.clientY > rect.bottom
        ) {
          // during manual testing I couldn't trigger this
          // but let's leave it just in case the internals
          // of the library some day may change
          return;
        }
        // if we get here it's because the mouse is outside the canvas
        e.preventDefault();
        const r = canvas.getBoundingClientRect();
        // trigger wheel event in the canvas to propagate zoom
        canvas.dispatchEvent(
          new WheelEvent("wheel", {
            bubbles: true,
            cancelable: true,
            view: window,
            clientX: r.left + r.width / 2,
            clientY: r.top + r.height / 2,
            // invert deltaY to match expected zoom direction
            deltaY: -e.deltaY,
            deltaMode: e.deltaMode,
          }),
        );
      },
      {passive: false},
    );
  }

  getGraphBounds(series, reserveLabels = false, formatter = null) {
    let bounds;
    const include = (element, name) => {
      if (!element || element.ignore || element.invisible) {
        return;
      }
      if (element.isGroup) {
        element.eachChild((child) => include(child, name));
      } else {
        const rect = element.getBoundingRect().clone();
        const transform = element.getComputedTransform();
        if (transform) {
          rect.applyTransform(transform);
        }
        if (![rect.x, rect.y, rect.width, rect.height].every(Number.isFinite)) {
          return;
        }
        if (bounds) {
          bounds.union(rect);
        } else {
          bounds = rect;
        }
      }
      const label = element.getTextContent();
      if (reserveLabels && label && !label.ignore && name && !label.style.text) {
        // Reserve hidden label space so crossing the threshold cannot change
        // the fitted zoom and immediately hide the labels again.
        const text = new graphic.Text({style: {...label.style, text: name}});
        const rect = text.getBoundingRect().clone();
        rect.applyTransform(label.getComputedTransform());
        if (bounds) {
          bounds.union(rect);
        } else {
          bounds = rect;
        }
      } else {
        include(label);
      }
    };
    const data = series.getData();
    data.eachItemGraphicEl((element, index) =>
      include(
        element,
        formatter != null
          ? series.getFormattedLabel(index, "normal", null, null, formatter)
          : data.getName(index),
      ),
    );
    series.getEdgeData().eachItemGraphicEl((element) => include(element));
    return bounds;
  }

  fitGraph(self, series, state = {}) {
    const chart = self.echarts;
    const width = chart.getWidth();
    const height = chart.getHeight();
    const padding = 40;
    if (width <= padding * 2 || height <= padding * 2) {
      return false;
    }
    const limit = series.get("scaleLimit") || {};
    const reserveLabels = self.config.showGraphLabelsAtZoom > 0;
    const measure = () =>
      this.getGraphBounds(
        series,
        reserveLabels,
        self.config.graphConfig.series.label?.formatter,
      );
    const setZoom = (zoom) => {
      chart.dispatchAction(
        {
          type: "graphRoam",
          seriesId: series.id,
          zoom: zoom / (series.get("zoom") || 1),
          originX: width / 2,
          originY: height / 2,
        },
        {silent: true},
      );
    };
    // Restore animations can leave the visible transform behind the model.
    if (!state.synced) {
      setZoom(series.get("zoom") || 1);
      state.synced = true;
    }
    if (state.width !== width || state.height !== height) {
      state.lower = 0;
      state.upper = Infinity;
      state.attempts = 0;
      state.width = width;
      state.height = height;
    }
    let bounds = measure();
    if (!bounds || !bounds.width || !bounds.height) {
      return true;
    }
    const ratioOf = (rect) =>
      Math.max(
        rect.width / (width - padding * 2),
        rect.height / (height - padding * 2),
      );
    const ratio = ratioOf(bounds);
    const zoom = series.get("zoom") || 1;
    let finished = series.getData().count() === 1 || (ratio <= 1 && 1 - ratio < 0.0005);
    if (!finished) {
      if (ratio <= 1) {
        state.lower = zoom;
      } else {
        state.upper = zoom;
      }
      // Keep the bracket between scheduled passes instead of repeatedly
      // measuring and transforming the entire graph in one callback.
      let target =
        state.attempts && Number.isFinite(state.upper)
          ? ((state.lower || 0) + state.upper) / 2
          : zoom / ratio;
      target = Math.max(limit.min || 1e-6, Math.min(limit.max || Infinity, target));
      state.attempts = (state.attempts || 0) + 1;
      if (Math.abs(target - zoom) < 1e-8) {
        finished = true;
      } else {
        setZoom(target);
        bounds = measure();
        const nextRatio = ratioOf(bounds);
        if (nextRatio <= 1) {
          state.lower = series.get("zoom") || 1;
        }
        finished = nextRatio <= 1 && 1 - nextRatio < 0.0005;
      }
      if (state.attempts >= 20) {
        if (state.lower && (series.get("zoom") || 1) > state.lower) {
          setZoom(Math.max(limit.min || 1e-6, state.lower));
          bounds = measure();
        }
        finished = true;
      }
    }
    const dx = width / 2 - (bounds.x + bounds.width / 2);
    const dy = height / 2 - (bounds.y + bounds.height / 2);
    if (Math.abs(dx) > 0.01 || Math.abs(dy) > 0.01) {
      chart.dispatchAction(
        {type: "graphRoam", seriesId: series.id, dx, dy},
        {silent: true},
      );
    }
    return finished;
  }

  updateGraphLabels(self, series) {
    if (!(self.config.showGraphLabelsAtZoom > 0)) {
      return;
    }
    const visible = (series.get("zoom") || 1) >= self.config.showGraphLabelsAtZoom;
    const data = series.getData();
    data.eachItemGraphicEl((element, index) => {
      const label = element.getSymbolPath().getTextContent();
      if (label) {
        const normal = series.getFormattedLabel(index, "normal") ?? data.getName(index);
        const text = {normal: visible ? normal : ""};
        ["emphasis", "blur", "select"].forEach((state) => {
          text[state] = visible
            ? (series.getFormattedLabel(index, state) ?? normal)
            : "";
        });
        setLabelText(label, text);
      }
    });
  }

  setupGraphFit(self) {
    if (self.cancelGraphFit) {
      self.cancelGraphFit();
    }
    if (!self.config.autoFitGraph || self.graphFitted) {
      return;
    }
    const {zoom, center} = self.config.graphConfig.series;
    if (zoom !== undefined || center !== undefined) {
      return;
    }
    const chart = self.echarts;
    let timer;
    const state = {};
    const fit = () => {
      timer = null;
      if (chart.isDisposed()) {
        self.cancelGraphFit();
        return;
      }
      const series = chart.getModel().getSeriesByIndex(0);
      if (!series || series.id !== "network-graph") {
        self.cancelGraphFit();
        return;
      }
      if (
        !series.getData().count() ||
        chart.getWidth() <= 80 ||
        chart.getHeight() <= 80
      ) {
        return;
      }
      if (self.fitLabelsVisible === undefined) {
        self.fitLabelsVisible =
          (series.get("zoom") || 1) >= self.config.showGraphLabelsAtZoom;
      }
      const view = chart.getViewOfSeriesModel(series);
      const settled =
        (series.get("layout") !== "force" || !view || !view._layouting) &&
        chart.getZr().animation.isFinished();
      if (!settled || !state.settled) {
        state.lower = 0;
        state.upper = Infinity;
        state.attempts = 0;
      }
      state.settled = settled;
      const fitted = this.fitGraph(self, series, state);
      if (
        series.get("layout") === "force" &&
        view &&
        typeof view._layouting !== "boolean" &&
        !self.graphFitWarned
      ) {
        self.graphFitWarned = true;
        console.warn("autoFitGraph: cannot reliably detect force layout completion.");
      }
      // The flag only controls completion; fitting already runs on each frame.
      if (settled && fitted) {
        self.graphFitted = true;
        self.cancelGraphFit();
        this.updateGraphLabels(self, series);
      } else if (settled && !timer) {
        timer = setTimeout(fit, 100);
      }
    };
    const rendered = () => {
      if (!timer) {
        timer = setTimeout(fit, 100);
      }
    };
    const interacted = () => {
      self.graphFitted = true;
      self.cancelGraphFit();
    };
    self.cancelGraphFit = () => {
      clearTimeout(timer);
      chart.off("rendered", rendered);
      chart.off("graphRoam", interacted);
      self.fitLabelsVisible = undefined;
      self.cancelGraphFit = null;
    };
    chart.on("rendered", rendered);
    chart.on("graphRoam", interacted);
  }

  /**
   * @function
   * @name graphRender
   *
   * Render the final graph result based on JSONData.
   * @param  {object}  JSONData        Render data
   * @param  {object}  self          NetJSONGraph object
   *
   */
  graphRender(JSONData, self) {
    self.el.classList.remove("njg-map");
    const chart = self.echarts;
    const previous = ((chart.getOption() || {}).series || []).find(
      (series) => series.id === "network-graph",
    );
    if (!previous) {
      self.graphFitted = false;
    }
    if (self.restoreGraphFit) {
      chart.off("restore", self.restoreGraphFit);
    }
    self.restoreGraphFit = () => {
      self.graphFitted = false;
      self.utils.setupGraphFit(self);
    };
    chart.on("restore", self.restoreGraphFit);
    self.utils.setupGraphFit(self);
    const option = self.utils.generateGraphOption(JSONData, self);
    if (previous) {
      const view = {
        zoom: option.series[0].zoom ?? previous.zoom,
        center: option.series[0].center ?? previous.center,
      };
      Object.assign(option.series[0], view);
      // Media options otherwise reapply their initial zoom on every data update.
      option.media = (option.media || []).map((media) => ({
        ...media,
        option: {
          ...media.option,
          series: (media.option.series || []).map((series) => ({...series, ...view})),
        },
      }));
    }
    if (
      self.config.autoFitGraph &&
      self.config.graphConfig.series.zoom === undefined &&
      self.config.graphConfig.series.center === undefined
    ) {
      option.media = (option.media || []).map((media) => ({
        ...media,
        option: {
          ...media.option,
          series: (media.option.series || []).map((series) => {
            const responsiveStyle = {...series};
            delete responsiveStyle.zoom;
            delete responsiveStyle.center;
            return responsiveStyle;
          }),
        },
      }));
    }
    self.utils.echartsSetOption(option, self);
    window.onresize = () => {
      chart.resize();
    };
    self.utils._propagateGraphZoom(self);
    if (self.graphLabelHandler) {
      chart.off("graphRoam", self.graphLabelHandler);
    }
    self.graphLabelHandler = null;
    if (self.config.showGraphLabelsAtZoom > 0) {
      self.graphLabelHandler = () => {
        const series = chart.getModel().getSeriesByIndex(0);
        if (series && series.id === "network-graph") {
          self.utils.updateGraphLabels(self, series);
        }
      };
      chart.on("graphRoam", self.graphLabelHandler);
      self.graphLabelHandler();
    }

    self.utils.setupHashChangeHandler(self);

    self.event.emit("onLoad");
    self.event.emit("onReady");
    self.event.emit("renderArray");
    self.event.emit("applyUrlFragmentState");
  }

  /**
   * @function
   * @name mapRender
   *
   * Render the final map result based on JSONData.
   * @param  {object}  JSONData       Render data
   * @param  {object}  self         NetJSONGraph object
   *
   */
  mapRender(JSONData, self) {
    if (self.graphLabelHandler) {
      self.echarts.off("graphRoam", self.graphLabelHandler);
      self.graphLabelHandler = null;
    }
    if (self.restoreGraphFit) {
      self.echarts.off("restore", self.restoreGraphFit);
      self.restoreGraphFit = null;
    }
    if (self.cancelGraphFit) {
      self.cancelGraphFit();
    }
    const L = getLeaflet();
    if (!L) {
      throw new Error("Leaflet api is not loaded");
    }
    const {latLngBounds} = L;

    if (!self.config.mapTileConfig[0]) {
      throw new Error(`You must add the tiles via the "mapTileConfig" param!`);
    }
    self.el.classList.add("njg-map");

    // Accept both NetJSON and GeoJSON inputs. If GeoJSON is detected,
    // deep-copy it for polygon overlays and convert the working copy to
    // NetJSON so the rest of the pipeline can operate uniformly.
    if (self.utils.isGeoJSON(JSONData)) {
      self.originalGeoJSON = self.utils.fastDeepCopy(JSONData);
      JSONData = self.utils.geojsonToNetjson(JSONData);
      // From this point forward we treat the data as NetJSON internally,
      // but keep the public-facing `type` value unchanged ("geojson").
    }

    const initialMapOptions = self.utils.generateMapOption(JSONData, self);
    self.utils.echartsSetOption(initialMapOptions, self);
    self.bboxData = {
      nodes: [],
      links: [],
    };

    // eslint-disable-next-line no-underscore-dangle
    self.leaflet = self.echarts._api.getCoordinateSystems()[0].getLeaflet();
    // eslint-disable-next-line no-underscore-dangle
    self.leaflet._zoomAnimated = false;

    // Leaflet draws the shapes; ECharts handles their labels and interactions.
    if (self.originalGeoJSON) {
      addPolygonOverlays(self, JSONData.nodes);
      // Auto-fit view to encompass ALL geometries (polygons + nodes)
      let bounds = null;

      // 1. Polygon overlays (if any)
      if (
        self.leaflet.polygonGeoJSON &&
        typeof self.leaflet.polygonGeoJSON.getBounds === "function"
      ) {
        bounds = self.leaflet.polygonGeoJSON.getBounds();
      }

      // 2. Nodes (Points)
      if (JSONData.nodes && JSONData.nodes.length) {
        const latlngs = JSONData.nodes
          .map((n) => n.properties.location)
          .map((loc) => [loc.lat, loc.lng]);
        if (bounds) {
          latlngs.forEach((ll) => bounds.extend(ll));
        } else {
          bounds = latLngBounds(latlngs);
        }
      }

      if (bounds && bounds.isValid()) {
        self.leaflet.fitBounds(bounds, {padding: [20, 20]});
      }
    }
    self.utils.updateLabelVisibility(self, true);

    self.leaflet.on("zoomend", () => {
      self.utils.updateLabelVisibility(self, true);
      // Zoom in/out buttons disabled only when it is equal to min/max zoomlevel
      // Manually handle zoom control state to ensure correct behavior with float zoom levels
      const currentZoom = self.leaflet.getZoom();
      const minZoom = self.leaflet.getMinZoom();
      const maxZoom = self.leaflet.getMaxZoom();
      const zoomIn = document.querySelector(".leaflet-control-zoom-in");
      const zoomOut = document.querySelector(".leaflet-control-zoom-out");

      if (zoomIn && zoomOut) {
        if (Math.round(currentZoom) >= maxZoom) {
          zoomIn.classList.add("leaflet-disabled");
        } else {
          zoomIn.classList.remove("leaflet-disabled");
        }

        if (Math.round(currentZoom) <= minZoom) {
          zoomOut.classList.add("leaflet-disabled");
        } else {
          zoomOut.classList.remove("leaflet-disabled");
        }
      }
    });

    self.leaflet.on("moveend", async () => {
      const bounds = self.leaflet.getBounds();
      const removeBBoxData = () => {
        const removeNodes = new Set(self.bboxData.nodes);
        const removeLinks = new Set(self.bboxData.links);

        JSONData = {
          ...JSONData,
          nodes: JSONData.nodes.filter((node) => !removeNodes.has(node)),
          links: JSONData.links.filter((link) => !removeLinks.has(link)),
        };

        self.data = JSONData;
        if (typeof self.utils.clearHighlight === "function") {
          self.utils.clearHighlight.call(self);
        }
        self.echarts.setOption(self.utils.generateMapOption(JSONData, self));
        // The chart is redrawn without clusters, hence no polygon may stay hidden
        updatePolygonOverlays(self);
        self.bboxData.nodes = [];
        self.bboxData.links = [];
      };
      if (
        self.leaflet.getZoom() >= self.config.loadMoreAtZoomLevel &&
        self.hasMoreData
      ) {
        const data = await self.utils.getBBoxData.call(self, self.JSONParam, bounds);
        self.config.prepareData.call(self, data);
        const dataNodeSet = new Set(self.data.nodes.map((n) => n.id));
        const sourceLinkSet = new Set(self.data.links.map((l) => l.source));
        const targetLinkSet = new Set(self.data.links.map((l) => l.target));
        const nodes = data.nodes.filter((node) => !dataNodeSet.has(node.id));
        const links = data.links.filter(
          (link) => !sourceLinkSet.has(link.source) && !targetLinkSet.has(link.target),
        );
        const boundsDataSet = new Set(data.nodes.map((n) => n.id));
        const nonCommonNodes = self.bboxData.nodes.filter(
          (node) => !boundsDataSet.has(node.id),
        );
        const removableNodes = new Set(nonCommonNodes.map((n) => n.id));

        JSONData.nodes = JSONData.nodes.filter((node) => !removableNodes.has(node.id));
        self.bboxData.nodes = self.bboxData.nodes.concat(nodes);
        self.bboxData.links = self.bboxData.links.concat(links);
        JSONData = {
          ...JSONData,
          nodes: JSONData.nodes.concat(nodes),
          links: JSONData.links.concat(links),
        };
        if (typeof self.utils.clearHighlight === "function") {
          self.utils.clearHighlight.call(self);
        }
        self.echarts.setOption(self.utils.generateMapOption(JSONData, self));
        updatePolygonOverlays(self);
        self.data = JSONData;
      } else if (self.hasMoreData && self.bboxData.nodes.length > 0) {
        removeBBoxData();
      }
    });
    if (
      self.config.clustering &&
      self.config.clusteringThreshold < JSONData.nodes.length
    ) {
      let {clusters, nonClusterNodes, nonClusterLinks} = self.utils.makeCluster(self);

      // Only show clusters if we're below the disableClusteringAtLevel
      if (self.leaflet.getZoom() >= self.config.disableClusteringAtLevel) {
        clusters = [];
        nonClusterNodes = JSONData.nodes;
        nonClusterLinks = JSONData.links;
      }

      self.echarts.setOption(
        self.utils.generateMapOption(
          {
            ...JSONData,
            nodes: nonClusterNodes,
            links: nonClusterLinks,
          },
          self,
          clusters,
        ),
      );
      updatePolygonOverlays(self, clusters);
      self.utils.updateLabelVisibility(self, true);

      self.echarts.on("click", (params) => {
        if (
          (params.componentSubType === "scatter" ||
            params.componentSubType === "effectScatter") &&
          params.data.cluster
        ) {
          const currentZoom = self.leaflet.getZoom();
          const targetZoom = Math.min(currentZoom + 2, self.leaflet.getMaxZoom());

          self.leaflet.setView(
            [params.data.value[1], params.data.value[0]],
            targetZoom,
          );
        }
      });

      // Ensure zoom handler consistently applies the same clustering logic
      self.leaflet.on("zoomend", () => {
        if (self.leaflet.getZoom() < self.config.disableClusteringAtLevel) {
          const nodeData = self.utils.makeCluster(self);
          clusters = nodeData.clusters;
          nonClusterNodes = nodeData.nonClusterNodes;
          nonClusterLinks = nodeData.nonClusterLinks;
          if (typeof self.utils.clearHighlight === "function") {
            self.utils.clearHighlight.call(self);
          }
          self.echarts.setOption(
            self.utils.generateMapOption(
              {
                ...JSONData,
                nodes: nonClusterNodes,
                links: nonClusterLinks,
              },
              self,
              clusters,
            ),
          );
          updatePolygonOverlays(self, clusters);
        } else {
          // When above the threshold, show all nodes without clustering
          if (typeof self.utils.clearHighlight === "function") {
            self.utils.clearHighlight.call(self);
          }
          self.echarts.setOption(self.utils.generateMapOption(JSONData, self));
          updatePolygonOverlays(self);
        }
        self.utils.updateLabelVisibility(self, true);
      });
    }

    self.utils.setupHashChangeHandler(self);
    self.event.emit("onLoad");
    self.event.emit("onReady");
    self.event.emit("renderArray");
    self.event.emit("applyUrlFragmentState");
  }

  /**
   * @function
   * @name appendData
   * Append new data. Can only be used for `map` render!
   *
   * @param  {object}         JSONData   Data
   * @param  {object}         self     NetJSONGraph object
   *
   */
  appendData(JSONData, self) {
    if (self.config.render !== self.utils.mapRender) {
      throw new Error("AppendData function can only be used for map render!");
    }

    if (self.config.render === self.utils.mapRender) {
      self.utils.clearHighlight.call(self);
      const polygonIndices = self.polygonDataIndices;
      const opts = self.utils.generateMapOption(JSONData, self);
      if (polygonIndices && (polygonIndices.size || self.polygonDataIndices.size)) {
        const offset = self.echarts.getModel().getSeriesByIndex(0).getData().count();
        self.polygonDataIndices.forEach((index, id) => {
          polygonIndices.set(id, offset + index);
        });
        self.polygonDataIndices = polygonIndices;
      }
      opts.series.forEach((obj, index) => {
        self.echarts.appendData({seriesIndex: index, data: obj.data});
      });
      // modify this.data
      self.utils.mergeData(JSONData, self);
    }

    self.config.afterUpdate.call(self);
  }

  /**
   * @function
   * @name addData
   * Add new data. Mainly used for `graph` render.
   *
   * @param  {object}         JSONData      Data
   * @param  {object}         self        NetJSONGraph object
   */
  addData(JSONData, self) {
    // modify this.data
    self.utils.mergeData(JSONData, self);

    // Ensure nodes are unique by ID using the utility function
    if (self.data.nodes && self.data.nodes.length > 0) {
      self.data.nodes = self.utils.deduplicateNodesById(self.data.nodes);
    }

    // `graph` render can't append data. So we have to merge the data and re-render.
    self.utils.render();

    self.config.afterUpdate.call(self);
  }

  /**
   * @function
   * @name mergeData
   * Merge new data. Modify this.data.
   *
   * @param  {object}         JSONData      Data
   * @param  {object}         self        NetJSONGraph object
   */
  mergeData(JSONData, self) {
    // Ensure incoming nodes array exists
    if (!JSONData.nodes) {
      JSONData.nodes = [];
    }

    // Create a set of existing node IDs for efficient lookup
    const existingNodeIds = new Set();
    self.data.nodes.forEach((node) => {
      if (node.id) {
        existingNodeIds.add(node.id);
      }
    });

    // Filter incoming nodes: keep nodes without IDs or with new IDs
    const newNodes = JSONData.nodes.filter((node) => {
      if (!node.id) {
        return true;
      }
      if (existingNodeIds.has(node.id)) {
        console.warn(`Duplicate node ID ${node.id} detected during merge and skipped.`);
        return false;
      }
      return true;
    });

    const nodes = self.data.nodes.concat(newNodes);
    // Ensure incoming links array exists
    const incomingLinks = JSONData.links || [];
    const links = self.data.links.concat(incomingLinks);

    Object.assign(self.data, JSONData, {
      nodes,
      links,
    });
  }
}

export default NetJSONGraphRender;
