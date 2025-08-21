import NetJSONGraphUtil from "./netjsongraph.util";

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
    const self = this;
    const searchHistory = {
      "": {
        data: {...self.data},
        param: [...self.JSONParam],
      },
    };

    window.history.pushState({searchValue: ""}, "");

    window.onpopstate = (event) => {
      if (searchHistory[event.state.searchValue]) {
        self.utils.JSONDataUpdate.call(
          self,
          searchHistory[event.state.searchValue].data,
        ).then(() => {
          self.JSONParam = searchHistory[event.state.searchValue].param;
        });
      } else {
        self.utils.JSONDataUpdate.call(self, url + event.state.searchValue);
      }
    };

    // eslint-disable-next-line consistent-return
    return function searchFunc(key, override = true, isRaw = true) {
      const searchValue = key.trim();

      if (
        !window.history.state ||
        (window.history.state && window.history.state.searchValue !== searchValue)
      ) {
        window.history.pushState({searchValue}, "");
        return self.utils.JSONDataUpdate.call(
          self,
          url + searchValue,
          override,
          isRaw,
        ).then(() => {
          searchHistory[searchValue] = {
            data: {...self.data},
            param: [...self.JSONParam],
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
    const self = this;
    self.config.onUpdate.call(self);

    return self.utils.paginatedDataParse
      .call(self, Data)
      .then((JSONData) => {
        // Convert Mesh data to NetJSON upfront so downstream logic works unchanged
        if (self.utils.isMeshData && self.utils.isMeshData(JSONData)) {
          JSONData = self.utils.meshToNetjson(JSONData);
          self.type = "netjson";
        }
        function update() {
          // override data.
          if (override) {
            self.JSONParam = [Data];
            self.utils.overrideData(JSONData, self);
          }
          // append data.
          else {
            self.JSONParam.push(Data);
            if (self.config.render === self.utils.mapRender) {
              self.utils.appendData(JSONData, self);
            } else {
              self.utils.addData(JSONData, self);
            }
          }
          // update metadata
          if (self.utils.isNetJSON(self.data)) {
            self.utils.updateMetadata.call(self);
          }
        }
        if (isRaw) {
          if (self.utils.isNetJSON(self.data)) {
            self.config.prepareData.call(self, JSONData);
          }

          if (self.config.dealDataByWorker) {
            self.utils.dealDataByWorker.call(
              self,
              JSONData,
              self.config.dealDataByWorker,
              update,
            );
          } else {
            update();
          }
        } else {
          update();
        }

        return JSONData;
      })
      .catch((error) => {
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
   * @this   {object}    self        NetJSONGraph object
   *
   */

  dealDataByWorker(JSONData, workerFile, callback) {
    const worker = new Worker(workerFile);
    const self = this;

    worker.postMessage(JSONData);

    worker.addEventListener("error", (e) => {
      console.error(e);
      console.error("Error in dealing JSONData!");
    });
    worker.addEventListener("message", (e) => {
      if (callback) {
        callback();
      } else {
        self.utils.overrideData(e.data, self);
        if (self.utils.isNetJSON(self.data)) {
          self.utils.updateMetadata.call(self);
        }
      }
    });
  }

  /**
   * @function
   * @name overrideData
   * Override old data and render.
   *
   * @param  {object}         JSONData   Data
   * @param  {object}         self      NetJSONGraph object
   *
   */
  overrideData(JSONData, self) {
    self.data = JSONData;
    if (!self.utils.isNetJSON(self.data)) {
      self.leaflet.geoJSON.removeFrom(self.leaflet);
    }
    self.utils.render();
    self.config.afterUpdate.call(self);
  }
}

export default NetJSONGraphUpdate;
