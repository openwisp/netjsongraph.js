import NetJSONGraphCore from "./netjsongraph.core.js";
import { NetJSONGraphRender, echarts, L } from "./netjsongraph.render.js";
import registerLeafletSystem from "../../lib/js/echarts-leaflet/index.js";

const colorTool = require("zrender/lib/tool/color");
const aria = require("echarts/lib/visual/aria");
const { each } = require("zrender/lib/core/util");
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

    let graph = new NetJSONGraphCore(JSONParam);

    Object.setPrototypeOf(NetJSONGraphRender.prototype, graph.utils);
    graph.utils = new NetJSONGraphRender();
    graph.setUtils();

    graph.event = graph.utils.createEvent();
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
            this.utils.showLoading.call(this);

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
          onUpdate: function() {
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
          afterUpdate: function() {
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
          onLoad: function() {
            this.utils.hideLoading.call(this);

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

registerLeafletSystem(echarts, L, {
  colorTool,
  aria,
  each,
  env
});

window.NetJSONGraph = NetJSONGraph;
window.echarts = echarts;
window.L = L;
