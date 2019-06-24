"use strict";

import NetJSONGraphDefaultConfig from "./netjsongraph.config.js";
import NetJSONGraphUpdate from "./netjsongraph.update.js";

class NetJSONGraph {
  /**
   * @constructor
   *
   * @param {string} JSONParam    The NetJSON file param
   * @param {Object} config
   */
  constructor(JSONParam, config) {
    this.JSONParam = JSONParam;

    this.setConfig(config).onInit.call(this);
  }

  /**
   * Set properties of instance
   * @param {Object} config
   *
   * @this {object}      The instantiated object of NetJSONGraph
   *
   * @return {object}    this.config
   */
  setConfig(config) {
    if (!this.utils) {
      this.utils = this.setUtils();
    }

    if (!this.config) {
      this.config = this.utils.deepMergeObj(
        Object.assign({}, NetJSONGraphDefaultConfig),
        config || {}
      );
    } else {
      this.utils.deepMergeObj(this.config, config || {});
    }

    if (typeof this.config.el === "object") {
      this.el = this.config.el;
    } else {
      this.el =
        document.getElementById(this.config.el) ||
        document.getElementsByTagName("body")[0];
    }
    this.el.classList.add("njg-relativePosition");

    return this.config;
  }

  /**
   * @function
   * @name render
   *
   * netjsongraph.js render function
   *
   * @this {object}      The instantiated object of NetJSONGraph
   */
  render() {
    // Loading();

    this.utils
      .JSONParamParse(this.JSONParam)
      .then(JSONData => {
        this.config.prepareData.call(this, JSONData);

        (function addNodeLinkOverlay(_this) {
          let nodeLinkOverlay = document.createElement("div");
          nodeLinkOverlay.setAttribute("class", "njg-overlay njg-container");
          _this.el.appendChild(nodeLinkOverlay);
        })(this);

        if (this.config.metadata) {
          this.el.appendChild(this.utils.NetJSONMetadata(JSONData));
        }

        // unLoading();

        if (this.config.dealDataByWorker) {
          this.utils.dealDataByWorker(
            JSONData,
            this.config.dealDataByWorker,
            this
          );
        } else {
          this.data = Object.freeze(JSONData);
          this.utils.NetJSONRender();
        }
      })
      .catch(error => {
        console.error(error);
      });
  }

  setUtils() {
    const _this = this;

    return Object.assign(Object.create(new NetJSONGraphUpdate()), {
      /**
       * @function
       * @name NetJSONRender
       * Perform different renderings according to different types.
       */

      NetJSONRender() {
        let graphChartContainer = document.getElementById(
          "graphChartContainer"
        );

        if (graphChartContainer) {
          _this.el.removeChild(graphChartContainer);
        }
        graphChartContainer = document.createElement("div");
        graphChartContainer.setAttribute("id", "graphChartContainer");
        _this.el.appendChild(graphChartContainer);
        if (_this.config.render) {
          _this.config.render(graphChartContainer, _this.data, _this);
        } else {
          throw new Error("No render function!");
        }
      }
    });
  }
}

window.NetJSONGraph = NetJSONGraph;