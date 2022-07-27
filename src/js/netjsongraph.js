import NetJSONGraphCore from "./netjsongraph.core";
import {NetJSONGraphRender, echarts, L} from "./netjsongraph.render";
import registerLeafletSystem from "../../lib/js/echarts-leaflet/index";

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

    let graph = new NetJSONGraphCore(JSONParam);

    Object.setPrototypeOf(NetJSONGraphRender.prototype, graph.utils);
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
        const gui = this.utils.getGUI(this);
        gui.init();
        if (this.config.metadata) {
          gui.createAboutContainer(graph);
          this.utils.updateMetadata.call(this);
        }
        if (this.config.switchMode) {
          gui.renderModeSelector.onclick = () => {
            if (this.config.render === this.utils.mapRender) {
              this.config.render = this.utils.graphRender;
              this.echarts.dispose();
              graph = new NetJSONGraph(this.data, {
                ...this.config,
              });
              graph.render();
            } else {
              this.config.render = this.utils.mapRender;
              this.config.render(this.data, this);
            }
          };
        }
        this.config.onClickElement = (type, data) => {
          let nodeLinkData;
          if (type === "node") {
            nodeLinkData = this.utils.nodeInfo(data);
          } else {
            nodeLinkData = this.utils.linkInfo(data);
          }
          gui.getNodeLinkInfo(type, nodeLinkData);
          gui.sideBar.classList.remove("hidden");
        };
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
