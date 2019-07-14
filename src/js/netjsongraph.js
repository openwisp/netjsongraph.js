import NetJSONGraphCore from "./netjsongraph.core.js";
import { NetJSONGraphRender, echarts, L } from "./netjsongraph.render.js";
import NetJSONGraphUpdate from "./netjsongraph.update.js";
import registerLeafletSystem from "echarts-leaflet/dist/echarts-leaflet.js";

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
    graph.setConfig(config);

    return graph;
  }
}

registerLeafletSystem(echarts, L);

window.NetJSONGraph = NetJSONGraph;
window.echarts = echarts;
window.L = L;
