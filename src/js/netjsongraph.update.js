"use strict";

import NetJSONGraphUtil from "./netjsongraph.util.js";

class NetJSONGraphUpdate extends NetJSONGraphUtil {
  /**
   * @function
   * @name searchElements
   * Add search function for new data.
   *
   * @param  {string}         url      listen url
   *
   * @this   {object}         NetJSONGraph object
   *
   * @return {function}       searchFunc
   */

  searchElements(url) {
    const _this = this,
      searchHistory = {
        "": {
          data: { ..._this.data },
          param: [..._this.JSONParam]
        }
      };

    window.history.pushState({ searchValue: "" }, "");

    window.onpopstate = event => {
      if (searchHistory[event.state.searchValue]) {
        _this.utils.JSONDataUpdate.call(
          _this,
          searchHistory[event.state.searchValue].data
        ).then(() => {
          _this.JSONParam = searchHistory[event.state.searchValue].param;
        });
      } else {
        _this.utils.JSONDataUpdate.call(_this, url + event.state.searchValue);
      }
    };

    return function searchFunc(key, override = true, isRaw = true) {
      let searchValue = key.trim();

      if (
        !history.state ||
        (history.state && history.state.searchValue !== searchValue)
      ) {
        history.pushState({ searchValue }, "");
        return _this.utils.JSONDataUpdate.call(
          _this,
          url + searchValue,
          override,
          isRaw
        ).then(() => {
          searchHistory[searchValue] = {
            data: { ..._this.data },
            param: [..._this.JSONParam]
          };
        });
      }
    };
  }

  /**
   * @function
   * @name JSONDataUpdate
   * Callback function executed when data update. Update Information and view.
   *
   * @param  {object|string}  Data     JSON data or url.
   * @param  {boolean}        override If old data need to be overrided? True defaultly. (Attention: Only 'map' render can set it `false`!)
   * @param  {boolean}        isRaw    If the data need to deal with the configuration? True defaultly.
   *
   * @this   {object}         NetJSONGraph object
   *
   * @returns {object}        promise
   */

  JSONDataUpdate(Data, override = true, isRaw = true) {
    const _this = this;
    _this.config.onUpdate.call(_this);

    return _this.utils
      .JSONParamParse(Data)
      .then(JSONData => {
        if (isRaw) {
          _this.config.prepareData.call(_this, JSONData);
          if (_this.config.dealDataByWorker) {
            _this.utils.dealDataByWorker.call(
              _this,
              JSONData,
              _this.config.dealDataByWorker,
              _update
            );
          } else {
            _update();
          }
        } else {
          _update();
        }

        return JSONData;

        function _update() {
          // override data.
          if (override) {
            _this.JSONParam = [Data];
            _this.utils._overrideData(JSONData, _this);
          }
          // append data.
          else {
            _this.JSONParam.push(Data);
            _this.config.render === _this.utils.mapRender
              ? _this.utils._appendData(JSONData, _this)
              : _this.utils._addData(JSONData, _this);
          }
          // update metadata
          _this.utils.updateMetadata.call(_this);
        }
      })
      .catch(error => {
        console.error(error);
      });
  }

  /**
   * @function
   * @name dealDataByWorker
   * Deal JSONData by WebWorker.
   *
   * @param  {object}    JSONData     NetJSONData
   * @param  {string}    workerFile   url
   * @param  {function}  callback     override data and render defaultly.
   *
   * @this   {object}    _this        NetJSONGraph object
   *
   */

  dealDataByWorker(JSONData, workerFile, callback) {
    const worker = new Worker(workerFile),
      _this = this;

    worker.postMessage(JSONData);

    worker.addEventListener("error", e => {
      console.error("Error in dealing JSONData!");
    });
    worker.addEventListener("message", e => {
      if (callback) {
        callback();
      } else {
        _this.utils._overrideData(e.data, _this);
        _this.utils.updateMetadata.call(_this);
      }
    });
  }

  /**
   * @function
   * @name _overrideData
   * Override old data and render.
   *
   * @param  {object}         JSONData   Data
   * @param  {object}         _this      NetJSONGraph object
   *
   */
  _overrideData(JSONData, _this) {
    _this.data = JSONData;

    _this.utils._render();
    _this.config.afterUpdate.call(_this);
  }
}

export default NetJSONGraphUpdate;
