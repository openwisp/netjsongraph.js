import NetJSONGraphCore from "./netjsongraph.core";
import {NetJSONGraphRender, echarts, L} from "./netjsongraph.render";
import registerLeafletSystem from "../../lib/js/echarts-leaflet/index";
import NetJSONGraphGUI from "./netjsongraph.gui";

const colorTool = require("zrender/lib/tool/color");
const {each} = require("zrender/lib/core/util");
const env = require("zrender/lib/core/env");

class NetJSONGraph {
  /**
   * @constructor
   *
   * @param {string} JSONParam    The NetJSON file param
   * @param {Object} config
   */

  constructor(JSONParam, config) {
    if (config && config.render === "map") {
      config.render = NetJSONGraphRender.prototype.mapRender;
    } else if (!config || !config.render || config.render === "graph") {
      config = config || {};
      config.render = NetJSONGraphRender.prototype.graphRender;
    }

    const graph = new NetJSONGraphCore(JSONParam);

    Object.setPrototypeOf(NetJSONGraphRender.prototype, graph.utils);
    graph.gui = new NetJSONGraphGUI(graph);
    graph.utils = new NetJSONGraphRender();
    graph.setUtils();

    graph.event = graph.utils.createEvent();

    graph.setConfig({
      /**
       * @function
       * @name onInit
       * Callback function executed on initialization
       *
       * @this  {object}          The instantiated object of NetJSONGraph
       *
       * @return {object}         this.config
       */
      onInit() {
        return this.config;
      },

      /**
       * @function
       * @name onRender
       * Callback function executed on render start
       *
       * @this  {object}          The instantiated object of NetJSONGraph
       *
       * @return {object}         this.config
       */
      onRender() {
        this.utils.showLoading.call(this);
        this.gui.init();
        return this.config;
      },

      /**
       * @function
       * @name onUpdate
       * Callback function executed when data update.
       *
       * @this  {object}          The instantiated object of NetJSONGraph
       *
       * @return {object}         this.config
       */
      onUpdate() {
        return this.config;
      },

      /**
       * @function
       * @name afterUpdate
       * Callback function executed after data update.
       *
       * @this  {object}          The instantiated object of NetJSONGraph
       *
       * @return {object}         this.config
       */
      afterUpdate() {
        return this.config;
      },

      /**
       * @function
       * @name onLoad
       * Callback function executed when first rendered.
       *
       * @this  {object}          The instantiated object of NetJSONGraph
       *
       * @return {object}         this.config
       */
      onLoad() {
        if (this.config.metadata && this.type === "netjson") {
          this.gui.createAboutContainer(graph);
          this.utils.updateMetadata.call(this);
        } else {
          this.gui.nodeLinkInfoContainer =
            this.gui.createNodeLinkInfoContainer();
        }

        if (this.config.switchMode && this.type === "netjson") {
          this.gui.renderModeSelector.onclick = () => {
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
              document.querySelector(
                ".leaflet-control-attribution",
              ).style.display = "none";
              document.querySelector(".leaflet-control-zoom").style.display =
                "none";
            } else {
              this.echarts.clear();
              this.config.render = this.utils.mapRender;
              this.utils.mapRender(this.data, this);
              document.querySelector(
                ".leaflet-control-attribution",
              ).style.display = "block";
              document.querySelector(".leaflet-control-zoom").style.display =
                "block";
            }
          };
        }

        this.utils.hideLoading.call(this);
        return this.config;
      },
      ...config,
    });
    graph.echarts = echarts.init(graph.el, null, {
      renderer: graph.config.svgRender ? "svg" : "canvas",
    });

    graph.config.onInit.call(graph);

    // eslint-disable-next-line no-constructor-return
    return graph;
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
