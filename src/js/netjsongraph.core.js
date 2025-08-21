import NetJSONGraphDefaultConfig from "./netjsongraph.config";
import NetJSONGraphUpdate from "./netjsongraph.update";

class NetJSONGraph {
  /**
   * @constructor
   *
   * @param {string} JSONParam    The NetJSON file param
   * @param {Object} config
   */
  constructor(JSONParam) {
    this.utils = new NetJSONGraphUpdate();
    this.config = {...NetJSONGraphDefaultConfig};
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
        this.el = document.body;
      } else if (this.utils.isElement(this.config.el)) {
        this.el = this.config.el;
      } else {
        this.el = document.querySelector(this.config.el);
      }
      if (this.el) {
        this.el.classList.add("njg-container");
        if (this.el === document.body) {
          const htmlEl = document.documentElement;
          htmlEl.style.width = "100%";
          htmlEl.style.height = "100%";

          this.el.classList.add("njg-relativePosition");
        }
      } else {
        console.error(
          "NetJSONGraph: The specified element for rendering was not found and could not be set.",
        );
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
    this.event.once("onReady", this.config.onReady.bind(this));
    this.event.once("onLoad", this.config.onLoad.bind(this));
    this.utils.paginatedDataParse
      .call(this, JSONParam)
      .then((JSONData) => {
        // Support Mesh data format by converting it to NetJSON upfront
        if (this.utils.isMeshData && this.utils.isMeshData(JSONData)) {
          JSONData = this.utils.meshToNetjson(JSONData);
          this.type = "netjson";
        }
        if (this.utils.isNetJSON(JSONData)) {
          this.type = "netjson";
        } else if (this.utils.isGeoJSON(JSONData)) {
          // Treat GeoJSON as a first-class citizen by converting it once
          // to NetJSON shape while keeping the original for polygon rendering.
          this.type = "geojson";
          // Preserve the original GeoJSON so that non-point geometries (e.g. Polygons)
          // can still be rendered as filled shapes via a separate Leaflet layer later
          // in the rendering pipeline, while the converted NetJSON shape is used for
          // clustering and ECharts overlays.
          this.originalGeoJSON = JSON.parse(JSON.stringify(JSONData));
          JSONData = this.utils.geojsonToNetjson(JSONData);
        } else {
          throw new Error("Invalid data format!");
        }

        if (this.utils.isNetJSON(JSONData)) {
          if (JSONData.nodes.length > this.config.maxPointsFetched) {
            this.hasMoreData = true;
          }
          JSONData.nodes.splice(
            this.config.maxPointsFetched - 1,
            JSONData.nodes.length - this.config.maxPointsFetched,
          );
          const nodeSet = new Set(JSONData.nodes.map((node) => node.id));
          JSONData.links = JSONData.links.filter((link) => {
            if (nodeSet.has(link.source) && nodeSet.has(link.target)) {
              return true;
            }
            if (!nodeSet.has(link.source)) {
              console.warn(`Node ${link.source} does not exist!`);
            } else {
              console.warn(`Node ${link.target} does not exist!`);
            }
            return false;
          });
        }
        this.config.prepareData.call(this, JSONData);
        this.data = JSONData;

        if (this.config.dealDataByWorker) {
          this.utils.dealDataByWorker.call(
            this,
            JSONData,
            this.config.dealDataByWorker,
          );
        } else {
          this.data = JSONData;
          this.utils.render();
        }
      })
      .catch((error) => {
        console.error(error);
      });

    if (resParam.length) {
      const renderArray = function _renderArray() {
        resParam.map((file) =>
          this.utils.JSONDataUpdate.call(this, file, false),
        );
      };
      this.JSONParam = [JSONParam];
      this.event.once("renderArray", renderArray.bind(this));
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
    const self = this;

    self.utils = Object.assign(
      self.utils,
      {...util},
      {
        /**
         * @function
         * @name render
         * Perform different renderings according to `render` config.
         */

        render() {
          if (self.config.render) {
            self.config.render(self.data, self);
          } else {
            throw new Error("No render function!");
          }
        },
      },
    );

    return self.utils;
  }
}

export default NetJSONGraph;
