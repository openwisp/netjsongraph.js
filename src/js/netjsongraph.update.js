"use strict";

import NetJSONGraphUtil from "./netjsongraph.util.js";

class NetJSONGraphUpdate extends NetJSONGraphUtil {
  /**
   * @function
   * @name searchElements
   * Add search function for new elements.
   *
   * @param {string} url      listen url
   * @param {object} _this    NetJSONGraph object
   *
   * @return {function} searchFunc
   */

  searchElements(url, _this) {
    window.history.pushState({ searchValue: "" }, "");

    window.onpopstate = event => {
      updateSearchedElements(event.state.searchValue);
    };

    return function searchFunc(key) {
      let searchValue = key.trim();

      if (
        !history.state ||
        (history.state && history.state.searchValue !== searchValue)
      ) {
        history.pushState({ searchValue }, "");
        return updateSearchedElements(searchValue);
      }
    };

    function updateSearchedElements(searchValue) {
      return fetch(url + searchValue)
        .then(data => data.json())
        .then(data => {
          _this.utils.JSONDataUpdate.call(_this, data);
        })
        .catch(error => {
          throw error;
        });
    }
  }

  /**
   * @function
   * @name dealDataByWorker
   *
   * Deal JSONData by WebWorker and render.
   * @param  {object}  JSONData     NetJSONData
   * @param  {string}  workerFile   url
   * @param  {object}  _this        NetJSONGraph object
   *
   */

  dealDataByWorker(JSONData, workerFile, _this) {
    let worker = new Worker(workerFile);

    worker.postMessage(JSONData);

    worker.addEventListener("error", e => {
      console.error("Error in dealing JSONData!");
    });
    worker.addEventListener("message", e => {
      _this.data = e.data;

      if (_this.config.metadata) {
        document.getElementsByClassName("njg-metadata")[0].style.visibility =
          "visible";
        document.getElementById("metadataNodesLength").innerHTML =
          _this.data.nodes.length;
        document.getElementById("metadataLinksLength").innerHTML =
          _this.data.links.length;
      }

      _this.utils.NetJSONRender();
    });
  }

  /**
   * @function
   * @name JSONDataUpdate
   *
   * Callback function executed when data update. Update Information and view.
   * @param  {object}  Data     JSON data or url
   *
   * @this  {object}   NetJSONGraph object
   *
   */

  JSONDataUpdate(Data) {
    // Loading
    const _this = this;

    _this.utils
      .JSONParamParse(Data)
      .then(JSONData => {
        _this.config.prepareData.call(_this, JSONData);

        if (_this.config.metadata) {
          document.getElementsByClassName("njg-metadata")[0].style.visibility =
            "visible";
          document.getElementById("metadataNodesLength").innerHTML =
            JSONData.nodes.length;
          document.getElementById("metadataLinksLength").innerHTML =
            JSONData.links.length;
        }

        // unLoading();

        if (_this.config.dealDataByWorker) {
          _this.utils.dealDataByWorker(
            JSONData,
            _this.config.dealDataByWorker,
            _this
          );
        } else {
          _this.data = JSONData;
          _this.utils.NetJSONRender();
        }
      })
      .catch(error => {
        console.error(error);
      });
  }
}

export default NetJSONGraphUpdate;
