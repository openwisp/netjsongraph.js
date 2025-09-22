import NetJSONGraphDefaultConfig from "./netjsongraph.config";
import NetJSONGraphUpdate from "./netjsongraph.update";

/**
 * @class
 * NetJSONGraphCore - Core implementation class handling data processing and lifecycle management.
 *
 * Main Responsibilities:
 * - Loads and validates NetJSON/GeoJSON data
 * - Manages configuration and DOM element attachment
 * - Orchestrates the main rendering pipeline
 * - Maintains processed data and visualization state
 */
class NetJSONGraphCore {
  /**
   * @constructor
   *
   * @param {string} JSONParam    The NetJSON file param
   * @param {Object} config
   */
  constructor(JSONParam) {
    this.utils = new NetJSONGraphUpdate();
    // This ensures the of the config is deep-copied, so changes in another instance won't affect it.
    this.config = this.utils.deepCopy(NetJSONGraphDefaultConfig);
    // Preserve the default CRS after merging because it's a Leaflet instance, not a plain object.
    // In setConfig, deepMergeObj would override it, causing it to fall back to the default CRS even
    // if explicitly set it to somthing like L.CRS.Simple.
    this.config.crs = NetJSONGraphDefaultConfig.crs;
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
    // Ensure applyUrlFragmentState runs only after onReady has completed,
    // as onReady may perform asynchronous operations
    const onReadyDone = new Promise((resolve) => {
      this.event.once("onReady", async () => {
        await this.config.onReady.call(this);
        resolve();
      });
    });
    this.event.once("onLoad", this.config.onLoad.bind(this));
    this.event.once("applyUrlFragmentState", async () => {
      await onReadyDone;
      this.utils.applyUrlFragmentState.call(this, this);
    });
    this.utils.paginatedDataParse
      .call(this, JSONParam)
      .then((JSONData) => {
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
          this.originalGeoJSON = this.utils.fastDeepCopy(JSONData);
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
        resParam.map((file) => this.utils.JSONDataUpdate.call(this, file, false));
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

export default NetJSONGraphCore;
