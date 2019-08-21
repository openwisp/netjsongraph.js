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
    this.utils = new NetJSONGraphUpdate();

    this.config = { ...NetJSONGraphDefaultConfig };
    this.setConfig(config);

    this.JSONParam = this.utils.isArray(JSONParam) ? JSONParam : [JSONParam];
  }

  /**
   * @function
   * @name setConfig
   *
   * @param  {Object}     config
   *
   * @this   {object}     The instantiated object of NetJSONGraph
   *
   * @return {object}     this.config
   */
  setConfig(config) {
    this.utils.deepMergeObj(this.config, config);

    if (!this.el) {
      if (!this.config.el) {
        this.el = document.getElementsByTagName("body")[0];
      } else if (this.utils.isElement(this.config.el)) {
        this.el = this.config.el;
      } else {
        this.el = document.getElementById(this.config.el);
      }
      if (this.el) {
        this.el.classList.add("njg-relativePosition");
        this.el.setAttribute("id", "graphChartContainer");
      }
    } else if (config && config.el) {
      console.error("Can't change el again!");
    }

    return this.config;
  }

  /**
   * @function
   * @name render
   * netjsongraph.js render function
   *
   * @this {object}      The instantiated object of NetJSONGraph
   */
  render() {
    const [JSONParam, ...resParam] = this.JSONParam;

    this.config.onRender.call(this);
    this.event.once("onLoad", this.config.onLoad.bind(this));

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
          this.utils.dealDataByWorker.call(
            this,
            JSONData,
            this.config.dealDataByWorker
          );
        } else {
          this.data = JSONData;
          this.utils._render();
        }
      })
      .catch(error => {
        console.error(error);
      });

    if (resParam.length) {
      this.JSONParam = [JSONParam];
      this.event.once("renderArray", _renderArray.bind(this));

      function _renderArray() {
        resParam.map(file => {
          this.utils.JSONDataUpdate.call(this, file, false);
        });
      }
    }
  }

  /**
   * @function
   * @name setUtils
   * set netjsongraph utils
   *
   * @param {object}  util  The object of functions
   *
   * @this {object}         The instantiated object of NetJSONGraph
   */
  setUtils(util = {}) {
    const _this = this;

    _this.utils = Object.assign(
      _this.utils,
      { ...util },
      {
        /**
         * @function
         * @name _render
         * Perform different renderings according to `render` config.
         */

        _render() {
          if (_this.config.render) {
            _this.config.render(_this.data, _this);
          } else {
            throw new Error("No render function!");
          }
        }
      }
    );

    return _this.utils;
  }
}

export default NetJSONGraph;
