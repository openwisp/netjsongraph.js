"use strict";

import NetJSONGraphDefaultConfig from "./netjsongraph.config.js";

class NetJSONGraph {
  /**
   * @constructor
   *
   * @param {string} JSONParam    The NetJSON file param
   * @param {Object} config
   */
  constructor(JSONParam, config) {
    this.JSONParam =
      Object.prototype.toString.call(JSONParam).slice(8, 13) === "Array"
        ? JSONParam
        : [JSONParam];
    this.config = { ...NetJSONGraphDefaultConfig };

    this.setUtils();
    this.setConfig(config);
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
    if (config) {
      this.utils.deepMergeObj(this.config, config);

      if (typeof this.config.el === "object") {
        this.el = this.config.el;
      } else {
        this.el =
          document.getElementById(this.config.el) ||
          document.getElementsByTagName("body")[0];
      }
      this.el.classList.add("njg-relativePosition");
      this.el.setAttribute("id", "graphChartContainer");
    }

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
    const [JSONParam, ...resParam] = this.JSONParam;

    this.config.onRender.call(this);

    this.utils
      .JSONParamParse(JSONParam)
      .then(JSONData => {
        this.config.prepareData.call(this, JSONData);
        this.data = JSONData;

        (function addNodeLinkOverlay(_this) {
          let nodeLinkOverlay = document.createElement("div");
          nodeLinkOverlay.setAttribute("class", "njg-overlay njg-container");
          _this.el.appendChild(nodeLinkOverlay);
        })(this);

        if (this.config.metadata) {
          this.el.appendChild(this.utils.NetJSONMetadata.call(this));
        }

        if (this.config.dealDataByWorker) {
          this.utils.dealDataByWorker(
            JSONData,
            this.config.dealDataByWorker,
            this
          );
        } else {
          this.data = JSONData;
          this.utils.NetJSONRender();
        }
      })
      .catch(error => {
        console.error(error);
      });

    if (resParam.length) {
      this.event.once("renderArray", _renderArray.bind(this));

      function _renderArray() {
        this.JSONParam = [JSONParam];
        resParam.map(file => {
          this.utils.JSONDataUpdate.call(this, file, false);
        });
      }
    }
  }

  /**
   * @function
   * @name setUtils
   *
   * set netjsongraph utils
   *
   * @param {object}  util  The object of functions
   *
   * @this {object}         The instantiated object of NetJSONGraph
   */
  setUtils(util) {
    const _this = this;

    _this.utils = Object.assign(_this.utils || {}, util || {}, {
      /**
       * @function
       * @name NetJSONRender
       * Perform different renderings according to different types.
       */

      NetJSONRender() {
        if (_this.config.render) {
          _this.config.render(_this.data, _this);
        } else {
          throw new Error("No render function!");
        }
      }
    });

    return _this.utils;
  }
}

export default NetJSONGraph;
