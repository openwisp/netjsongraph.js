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
 * Used as a global object in all examples located in `/public/examples_templates/`.
 */
class NetJSONGraph {
  /**
   * @constructor
   * Initializes a new NetJSONGraph instance.
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
   * Initializes the configuration with values and set render to map or graph.
   *
   * @param {Object} config - The user-defined configuration.
   * @returns {Object} - The final configuration object.
   */
  initializeConfig(config) {
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

  // ──────────── Lifecycle Methods ────────────

  /**
   * Callback function executed during initialization.
   *
   * @this {NetJSONGraph}
   * @returns {Object} - The graph configuration.
   */
  onInit() {
    return this.config;
  }

  /**
   * Callback function executed when rendering starts.
   *
   * @this {NetJSONGraph}
   * @returns {Object} - The graph configuration.
   */
  onRender() {
    this.utils.showLoading.call(this);
    this.gui.init();
    return this.config;
  }

  /**
   * Callback function executed when data updates.
   *
   * @this {NetJSONGraph}
   * @returns {Object} - The graph configuration.
   */
  onUpdate() {
    return this.config;
  }

  /**
   * Callback function executed after data updates.
   *
   * @this {NetJSONGraph}
   * @returns {Object} - The graph configuration.
   */
  afterUpdate() {
    return this.config;
  }

  /**
   * Callback function executed when the graph is first rendered.
   *
   * @this {NetJSONGraph}
   * @returns {Object} - The graph configuration.
   */
  onLoad() {
    if (this.config.metadata && this.type === "netjson") {
      this.gui.createMetaInfoContainer(this.graph);
      this.utils.updateMetadata.call(this);
    } else {
      this.gui.nodeLinkInfoContainer = this.gui.createNodeLinkInfoContainer();
    }

    // If mode switching is enabled and the type is 'netjson', set up the mode switch event
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

          // Hide Leaflet UI elements when in graph mode
          document.querySelector(".leaflet-control-attribution").style.display =
            "none";
          document.querySelector(".leaflet-control-zoom").style.display =
            "none";
        } else {
          // Switch from graph to map mode similarly
          this.echarts.clear();
          this.config.render = this.utils.mapRender;
          this.utils.mapRender(this.data, this);

          // Show Leaflet UI elements when back in map mode
          document.querySelector(".leaflet-control-attribution").style.display =
            "block";
          document.querySelector(".leaflet-control-zoom").style.display =
            "block";
        }
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

// Expose objects globally

window.NetJSONGraph = NetJSONGraph;
window.echarts = echarts;
window.L = L;
