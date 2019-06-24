import NetJSONGraphCore from "./netjsongraph.core.js";
import NetJSONGraphRender from "./netjsongraph.render.js";
import NetJSONGraphUpdate from "./netjsongraph.update.js";

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

window.NetJSONGraph = NetJSONGraph;
