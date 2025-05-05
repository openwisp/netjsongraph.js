import NetJSONGraphCore from "./netjsongraph.core";
import {NetJSONGraphRender, echarts, L} from "./netjsongraph.render";
import registerLeafletSystem from "../../lib/js/echarts-leaflet/index";
import NetJSONGraphGUI from "./netjsongraph.gui";

const colorTool = require("zrender/lib/tool/color");
const {each} = require("zrender/lib/core/util");
const env = require("zrender/lib/core/env");

/**
 * @class
 * Class NetJSONGraph is entry point for NetJSONGraph library.
 * Used as a global object in the examples_templates.
 */
class NetJSONGraph {
  /**
   * @constructor
   *
   * @param {string} JSONParam - The NetJSON file parameter.
   * @param {Object} [config={}] - Configuration options for the graph.
   */
  constructor(JSONParam, config = {}) {
    this.graph = new NetJSONGraphCore(JSONParam);
    this.config = this.initializeConfig(config);
    this.graph.setConfig(this.config);
    this.setupGraph();
    this.config.onInit.call(this.graph);
    this.initializeECharts();
    // eslint-disable-next-line no-constructor-return
    return this.graph;
  }

  /**
   * @param {Object} config - The user-defined configuration.
   * @returns {Object} - The final configuration object.
   */
  initializeConfig(config = {}) {
    return {
      ...config,
      render:
        config.render === "map"
          ? NetJSONGraphRender.prototype.mapRender
          : NetJSONGraphRender.prototype.graphRender,
      onInit: this.onInit,
      onRender: this.onRender,
      onUpdate: this.onUpdate,
      afterUpdate: this.afterUpdate,
      onLoad: this.onLoad,
    };
  }

  /**
   * Sets up rendering utilities, GUI, and event handling. Used in constructor
   */
  setupGraph() {
    Object.setPrototypeOf(NetJSONGraphRender.prototype, this.graph.utils);
    this.graph.gui = new NetJSONGraphGUI(this.graph);
    this.graph.utils = new NetJSONGraphRender();
    this.graph.setUtils();
    this.graph.event = this.graph.utils.createEvent();
  }

  /**
   * Initializes the ECharts rendering engine. Used in constructor
   */
  initializeECharts() {
    this.graph.echarts = echarts.init(this.graph.el, null, {
      renderer: this.graph.config.svgRender ? "svg" : "canvas",
    });
  }

  /**
   * @this {NetJSONGraph}
   * @returns {Object} - The graph configuration.
   */
  onInit() {
    return this.config;
  }

  /**
   * @this {NetJSONGraph}
   * @returns {Object} - The graph configuration.
   */
  onRender() {
    this.utils.showLoading.call(this);
    this.gui.init();
    return this.config;
  }

  /**
   * @this {NetJSONGraph}
   * @returns {Object} - The graph configuration.
   */
  onUpdate() {
    return this.config;
  }

  /**
   * @this {NetJSONGraph}
   * @returns {Object} - The graph configuration.
   */
  afterUpdate() {
    return this.config;
  }

  /**
   * In map mode, two canvas elements are used:
   * - One canvas displays the map tiles (background).
   * - The other canvas renders the nodes and links on top of the map.
   *
   * When switching to graph mode, the map canvas remains in the DOM,
   * but its container's background color is updated to match the graph rendering,
   *
   * @this {NetJSONGraph}
   * @returns {Object} - The graph configuration.
   */
  onLoad() {
    this.utils.echartsSetEventHandler(this);

    if (this.config.metadata && this.type === "netjson") {
      this.gui.createMetaInfoContainer(this.graph);
      this.utils.updateMetadata.call(this);
    } else {
      this.gui.nodeLinkInfoContainer = this.gui.createNodeLinkInfoContainer();
    }
    if (this.config.switchMode && this.type === "netjson") {
      this.gui.renderModeSelector.onclick = () => {
        // Switch from map to graph mode, first clear canvasContainer and then render
        if (this.config.render === this.utils.mapRender) {
          this.config.render = this.utils.graphRender;
          const canvasContainer = this.echarts
            .getZr()
            .painter.getViewportRoot().parentNode;
          this.echarts.clear();
          this.utils.graphRender(this.data, this);
          canvasContainer.style.background =
            // eslint-disable-next-line no-underscore-dangle
            this.echarts.getZr()._backgroundColor;

          // Hide Openstreetmap credits in the bottom right corner
          document.querySelector(".leaflet-control-attribution").style.display =
            "none";
          // Hide zoom control buttons in top right corner
          document.querySelector(".leaflet-control-zoom").style.display =
            "none";
        } else {
          this.echarts.clear();
          this.config.render = this.utils.mapRender;
          this.utils.mapRender(this.data, this);
          // Show OpenStreetMap credits and zoom control buttons in map mode
          document.querySelector(".leaflet-control-attribution").style.display =
            "block";
          document.querySelector(".leaflet-control-zoom").style.display =
            "block";
        }

        this.selection.highlightSelected(this.echarts);
      };
    }
    this.utils.hideLoading.call(this);
    return this.config;
  }
}

registerLeafletSystem(echarts, L, {
  colorTool,
  each,
  env,
});

window.NetJSONGraph = NetJSONGraph;
window.echarts = echarts;
window.L = L;
