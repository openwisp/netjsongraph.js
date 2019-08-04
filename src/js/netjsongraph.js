import NetJSONGraphCore from "./netjsongraph.core.js";
import { NetJSONGraphRender, echarts, L } from "./netjsongraph.render.js";
import NetJSONGraphUpdate from "./netjsongraph.update.js";
import registerLeafletSystem from "../../lib/js/echarts-leaflet/index.js";

class NetJSONGraph {
  /**
   * @constructor
   *
   * @param {string} JSONParam    The NetJSON file param
   * @param {Object} config
   */
  constructor(JSONParam, config) {
    if (config && config.render === "graph") {
      config.render = NetJSONGraphRender.prototype.graphRender;
    } else if (config && config.render === "map") {
      config.render = NetJSONGraphRender.prototype.mapRender;
    }

    let graph = new NetJSONGraphCore(JSONParam);

    Object.setPrototypeOf(
      NetJSONGraphRender.prototype,
      NetJSONGraphUpdate.prototype
    );
    graph.utils = Object.assign(new NetJSONGraphRender(), graph.utils);
    graph.setConfig(
      Object.assign(
        {
          /**
           * @function
           * @name onInit
           * Callback function executed on initialization
           *
           * @this  {object}          The instantiated object of NetJSONGraph
           *
           * @return {object}         this.config
           */
          onInit: function() {
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
          onRender: function() {
            this.echarts.showLoading();

            return this.config;
          },
          /**
           * @function
           * @name onLoad
           * Callback function executed when rendered.
           *
           * @this  {object}          The instantiated object of NetJSONGraph
           *
           * @return {object}         this.config
           */
          onLoad: function() {
            this.echarts.hideLoading();

            return this.config;
          }
        },
        config
      )
    );
    graph.echarts = echarts.init(graph.el, null, {
      renderer: graph.config.svgRender ? "svg" : "canvas"
    });

    graph.config.onInit.call(graph);

    return graph;
  }
}

registerLeafletSystem(echarts, L);

window.NetJSONGraph = NetJSONGraph;
window.echarts = echarts;
window.L = L;
