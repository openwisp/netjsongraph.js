"use strict";

/**
 * Default options
 *
 * @param  {string}            el                  body        The container element                                  el: "body" [description]
 * @param  {bool}              metadata            true        Display NetJSON metadata at startup?
 * @param  {bool}              defaultStyle        true        Does node use default css style? If not, you can income the style with JSON.
 * @param  {bool}              svgRender           false       Switch to Svg mode render?
 * @param  {object(RegExp)}    dateRegular         /(?:)/      Analyze date format.The exec result must be [date, year, month, day, hour, minute, second, millisecond?]
 * @param  {float}             gravity             0.1         The gravitational strength to the specified numerical value. @see {@link https://github.com/mbostock/d3/wiki/Force-Layout#gravity}
 * @param  {int|array}         edgeLength          [20, 60]    The distance between the two nodes on the side, this distance will also be affected by repulsion. @see {@link https://echarts.apache.org/option.html#series-graph.force.edgeLength}
 * @param  {int|array}         repulsion           200         The repulsion factor between nodes. @see {@link https://echarts.apache.org/option.html#series-graph.force.repulsion}
 * @param  {int|function}      circleRadius        node => 10  The radius of circles (nodes) in pixel
 * @param  {int}               labelDx             0           node labels offsetX(distance on x axis) in graph. @see {@link https://echarts.apache.org/option.html#series-graph.label.offset}
 * @param  {int}               labelDy             -10         node labels offsetY(distance on y axis) in graph.
 * @param  {object|function}   nodeStyleProperty   node => {}  Used to custom node style. @see {@link https://echarts.apache.org/option.html#series-graph.data.itemStyle}
 * @param  {object|function}   linkStyleProperty   link => {}  Used to custom link style. @see {@link https://echarts.apache.org/option.html#series-graph.links.lineStyle}
 * @param  {function}          onInit                          Callback function executed on initialization
 * @param  {function}          onLoad                          Callback function executed after data has been loaded
 * @param  {function}          prepareData                     Used to convert NetJSON NetworkGraph to the javascript data
 * @param  {function}          onClickNode                     Called when a node is clicked
 * @param  {function}          onClickLink                     Called when a link is clicked
 */
const NetJSONGraphDefaultConfig = {
  metadata: true,
  // defaultStyle: true,
  // animationAtStart: true,
  svgRender: false,
  scaleExtent: [0.25, 18],
  // charge: -130,
  // linkDistance: 50,
  // linkStrength: 0.2,
  // friction: 0.9,  // d3 default
  // chargeDistance: Infinity,  // d3 default
  // theta: 0.8,  // d3 default
  gravity: 0.1,
  edgeLength: [20, 60],
  repulsion: 120,
  circleRadius: 10,
  labelDx: 0,
  labelDy: -10,
  nodeStyleProperty: {},
  linkStyleProperty: {},
  /**
   * @function
   * @name onInit
   * Callback function executed on initialization
   *
   * @this  {object}          The instantiated object of NetJSONGraph
   *
   * @return {object}         this.config
   */
  onInit: function() {
    return this.config;
  },
  /**
   * @function
   * @name onLoad
   * Callback function executed after data has been loaded
   *
   * @this  {object}          The instantiated object of NetJSONGraph
   *
   * @return {object}         this.config
   */
  onLoad: function() {
    return this.config;
  },
  /**
   * @function
   * @name prepareData
   * Convert NetJSON NetworkGraph to the data structure consumed by d3
   *
   * @param JSONData  {object}
   */
  prepareData: function(JSONData) {},
  /**
   * @function
   * @name onClickNode
   * Called when a node is clicked
   *
   * @this {object}      The instantiated object of NetJSONGraph
   */
  onClickNode: function(node) {
    let nodeLinkOverlay = document.getElementsByClassName("njg-overlay")[0];

    if (!nodeLinkOverlay) {
      nodeLinkOverlay = document.createElement("div");
      nodeLinkOverlay.setAttribute("class", "njg-overlay");
      this.el.appendChild(nodeLinkOverlay);
    }
    nodeLinkOverlay.style.visibility = "visible";
    nodeLinkOverlay.innerHTML = `
            <div class="njg-inner">
                ${this.utils.nodeInfo(node)}
            </div>
        `;
    const closeA = document.createElement("a");
    closeA.setAttribute("class", "njg-close");
    closeA.setAttribute("id", "nodeOverlay-close");
    closeA.onclick = () => {
      nodeLinkOverlay.style.visibility = "hidden";
    };
    nodeLinkOverlay.appendChild(closeA);
  },
  /**
   * @function
   * @name onClickLink
   * Called when a node is clicked
   *
   * @this {object}      The instantiated object of NetJSONGraph
   */
  onClickLink: function(link) {
    let nodeLinkOverlay = document.getElementsByClassName("njg-overlay")[0];

    if (nodeLinkOverlay) {
      nodeLinkOverlay = document.createElement("div");
      nodeLinkOverlay.setAttribute("class", "njg-overlay");
      this.el.appendChild(nodeLinkOverlay);
    }
    nodeLinkOverlay.style.visibility = "visible";
    nodeLinkOverlay.innerHTML = `
            <div class="njg-inner">
                ${this.utils.linkInfo(link)}
            </div>
        `;
    const closeA = document.createElement("a");
    closeA.setAttribute("class", "njg-close");
    closeA.setAttribute("id", "linkOverlay-close");
    closeA.onclick = () => {
      nodeLinkOverlay.style.visibility = "hidden";
    };
    nodeLinkOverlay.appendChild(closeA);
  }
};

class NetJSONGraph {
  /**
   * @constructor
   *
   * @param {string} JSONParam    The NetJSON file param
   * @param {Object} config
   */
  constructor(JSONParam, config) {
    this.config = NetJSONGraphDefaultConfig;
    this.JSONParam = JSONParam;

    this.setConfig(config).onInit.call(this);
  }

  /**
   * Set properties of instance
   * @param {Object} config
   *
   * @this {object}      The instantiated object of NetJSONGraph
   * @return {object} this.config
   */
  setConfig(config) {
    Object.assign(this.config, config);
    if (!this.utils) {
      this.utils = this.setUtils();
    }

    this.el =
      document.getElementById(this.config.el) ||
      document.getElementsByTagName("body")[0];

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
        this.config.onLoad.call(this).prepareData(JSONData);

        if (this.config.metadata) {
          this.utils.NetJSONMetadata(JSONData);
        }

        // if (JSONData.date) {
        //   const dateNode = document.createElement("span"),
        //     dateResult = this.utils.dateParse(
        //       JSONData.date,
        //       this.config.dateRegular
        //     );
        //   dateNode.setAttribute("title", dateResult);
        //   dateNode.setAttribute("class", "njg-date");
        //   dateNode.innerHTML = "Incoming Time: " + dateResult;
        //   this.el.appendChild(dateNode);
        // }

        // unLoading();

        if (this.config.dealDataByWorker) {
          this.utils.dealDataByWorker(JSONData, this.config.dealDataByWorker);
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

    return {
      /**
       * @function
       * @name JSONParamParse
       *
       * Perform different operations to call NetJSONDataParse function according to different Param types.
       * @param  {object|string}  JSONParam   Url or JSONData
       *
       * @return {object}    A promise object of JSONData
       */

      JSONParamParse(JSONParam) {
        if (typeof JSONParam === "string") {
          return fetch(JSONParam, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json"
            }
          })
            .then(response => {
              if (response.json) {
                return response.json();
              } else {
                return response;
              }
            })
            .catch(msg => {
              console.error(msg);
            });
        } else {
          return Promise.resolve(JSONParam);
        }
      },

      /**
       * @function
       * @name dateParse
       *
       * Parse the time in the browser's current time zone based on the incoming matching rules.
       * @param  {string}          dateString
       * @param  {object(RegExp)}  parseRegular
       *
       * @return {string}    Date string
       */

      dateParse(
        dateString,
        parseRegular = /^([1-9]\d{3})-(\d{1,2})-(\d{1,2})T(\d{1,2}):(\d{1,2}):(\d{1,2})(?:\.(\d{1,3}))?Z$/
      ) {
        const dateParseArr = parseRegular.exec(dateString);
        if (!dateParseArr || dateParseArr.length < 7) {
          console.error("Date doesn't meet the specifications.");
          return "";
        }
        const hourDiffer = new Date().getTimezoneOffset() / 60,
          dateNumerFields = ["dateYear", "dateMonth", "dateDay", "dateHour"],
          dateNumberObject = {},
          leapYear =
            (dateParseArr[1] % 4 === 0 && dateParseArr[1] % 100 !== 0) ||
            dateParseArr[1] % 400 === 0,
          limitBoundaries = new Map([
            ["dateMonth", 12],
            [
              "dateDay",
              [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
            ],
            ["dateHour", 24]
          ]);

        for (let i = dateNumerFields.length; i > 0; i--) {
          dateNumberObject[dateNumerFields[i - 1]] = parseInt(
            dateParseArr[i],
            10
          );
        }

        let carry = -hourDiffer,
          limitBoundary;
        for (let i = dateNumerFields.length; i > 0; i--) {
          if (dateNumerFields[i - 1] === "dateYear") {
            dateNumberObject[dateNumerFields[i - 1]] += carry;
            break;
          } else if (dateNumerFields[i - 1] === "dateDay") {
            limitBoundary = limitBoundaries.get("dateDay")[
              dateNumberObject["dateMonth"] - 1
            ];
          } else {
            limitBoundary = limitBoundaries.get(dateNumerFields[i - 1]);
          }

          let calculateResult =
            dateNumberObject[dateNumerFields[i - 1]] + carry;

          if (dateNumerFields[i - 1] === "dateHour") {
            carry =
              calculateResult < 0
                ? -1
                : calculateResult >= limitBoundary
                  ? 1
                  : 0;
          } else {
            carry =
              calculateResult <= 0
                ? -1
                : calculateResult > limitBoundary
                  ? 1
                  : 0;
          }

          if (carry === 1) {
            calculateResult -= limitBoundary;
          } else if (carry < 0) {
            if (dateNumerFields[i - 1] === "dateDay") {
              limitBoundary = limitBoundaries.get("dateDay")[
                (dateNumberObject[dateNumerFields[i - 1]] + 10) % 11
              ];
            }
            calculateResult += limitBoundary;
          }

          dateNumberObject[dateNumerFields[i - 1]] = calculateResult;
        }

        return (
          dateNumberObject["dateYear"] +
          "." +
          _this.utils.numberMinDigit(dateNumberObject["dateMonth"]) +
          "." +
          _this.utils.numberMinDigit(dateNumberObject["dateDay"]) +
          " " +
          _this.utils.numberMinDigit(dateNumberObject["dateHour"]) +
          ":" +
          _this.utils.numberMinDigit(dateParseArr[5]) +
          ":" +
          _this.utils.numberMinDigit(dateParseArr[6]) +
          "." +
          (dateParseArr[7]
            ? _this.utils.numberMinDigit(dateParseArr[7], 3)
            : "")
        );
      },

      /**
       * Guaranteed minimum number of digits
       *
       * @param  {number}      number
       * @param  {number}      digit      min digit
       * @param  {string}      filler
       *
       * @return {string}
       */
      numberMinDigit(number, digit = 2, filler = "0") {
        return (Array(digit).join(filler) + number).slice(-digit);
      },

      /**
       * @function
       * @name nodeInfo
       *
       * Parse the infomation of incoming node data.
       * @param  {object}    node
       *
       * @return {string}    html dom string
       */

      nodeInfo(node) {
        let html = `<p><b>id</b>: ${node.id}</p>\n`;
        if (node.label) {
          html += "<p><b>label</b>: " + node.label + "</p>\n";
        }
        if (node.properties) {
          for (let key in node.properties) {
            html +=
              "<p><b>" +
              key.replace(/_/g, " ") +
              "</b>: " +
              node.properties[key] +
              "</p>\n";
          }
        }
        if (node.linkCount) {
          html += "<p><b>links</b>: " + node.linkCount + "</p>\n";
        }
        if (node.local_addresses) {
          html +=
            "<p><b>local addresses</b>:<br/>" +
            node.local_addresses.join("<br/>") +
            "</p>\n";
        }

        return html;
      },

      /**
       * @function
       * @name linkInfo
       *
       * Parse the infomation of incoming link data.
       * @param  {object}    link
       *
       * @return {string}    html dom string
       */

      linkInfo(link) {
        let html = `<p><b>source</b>: ${link.source}</p>\n<p><b>target</b>: ${
          link.target
        }</p>\n<p><b>cost</b>: ${link.cost}</p>\n`;
        if (link.properties) {
          for (let key in link.properties) {
            html +=
              "<p><b>" +
              key.replace(/_/g, " ") +
              "</b>: " +
              link.properties[key] +
              "</p>\n";
          }
        }

        return html;
      },

      /**
       * @function
       * @name dealDataByWorker
       *
       * Deal JSONData by WebWorker and render.
       * @param  {object}  JSONData     NetJSONData
       * @param  {string}  workerFile   url
       *
       */

      dealDataByWorker(JSONData, workerFile) {
        let worker = new Worker(workerFile);

        worker.postMessage(JSONData);

        worker.addEventListener("error", e => {
          console.error("Error in dealing JSONData!");
        });
        worker.addEventListener("message", e => {
          _this.data = Object.freeze(e.data);

          // if (JSONData.date && JSONData.date !== _this.data.date) {
          //   document.getElementsByClassName("njg-date")[0].innerHTML =
          //     "Incoming Time: " +
          //     _this.utils.dateParse(_this.data.date, _this.config.dateRegular);
          // }

          if (_this.config.metadata) {
            document.getElementsByClassName(
              "njg-metadata"
            )[0].style.visibility = "visible";
            document.getElementById("metadataNodesLength").innerHTML =
              _this.data.nodes.length;
            document.getElementById("metadataLinksLength").innerHTML =
              _this.data.links.length;
          }

          _this.utils.NetJSONRender();
        });
      },

      /**
       * @function
       * @name JSONDataUpdate
       *
       * Callback function executed when data update.Update Information and view.
       * @param  {object}  Data     JSON data or url
       *
       */

      JSONDataUpdate(Data) {
        // Loading

        _this.utils
          .JSONParamParse(Data)
          .then(JSONData => {
            _this.config.onLoad.call(_this).prepareData(JSONData);

            // if (JSONData.date && JSONData.date !== _this.data.date) {
            //   document.getElementsByClassName("njg-date")[0].innerHTML =
            //     "Incoming Time: " +
            //     _this.utils.dateParse(JSONData.date, _this.config.dateRegular);
            // }
            if (_this.config.metadata) {
              document.getElementsByClassName(
                "njg-metadata"
              )[0].style.visibility = "visible";
              document.getElementById("metadataNodesLength").innerHTML =
                JSONData.nodes.length;
              document.getElementById("metadataLinksLength").innerHTML =
                JSONData.links.length;
            }

            // unLoading();

            if (_this.config.dealDataByWorker) {
              _this.utils.dealDataByWorker(
                JSONData,
                _this.config.dealDataByWorker
              );
            } else {
              _this.data = Object.freeze(JSONData);
              _this.utils.NetJSONRender();
            }
          })
          .catch(error => {
            console.error(error);
          });
      },

      /**
       * @function
       * @name NetJSONRender
       * Perform different renderings according to different types.
       *
       * @return {object} render object
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

        return graphChartContainer;
      },

      /**
       * @function
       * @name NetJSONMetadata
       * Display metadata of NetJSONGraph.
       *
       * @param  {object}  metadata
       *
       * @return {object} metadataContainer DOM
       */

      NetJSONMetadata(metadata) {
        const attrs = [
          "protocol",
          "version",
          "revision",
          "metric",
          "router_id",
          "topology_id"
        ];
        let html = "";

        if (metadata.label) {
          html += "<h3>" + metadata.label + "</h3>";
        }
        for (var i in attrs) {
          var attr = attrs[i];
          if (metadata[attr]) {
            html +=
              "<p><b>" + attr + "</b>: <span>" + metadata[attr] + "</span></p>";
          }
        }
        html +=
          "<p><b>nodes</b>: <span id='metadataNodesLength'>" +
          metadata.nodes.length +
          "</span></p>";
        html +=
          "<p><b>links</b>: <span id='metadataLinksLength'>" +
          metadata.links.length +
          "</span></p>";

        const metadataContainer = document.createElement("div"),
          innerDiv = document.createElement("div"),
          closeA = document.createElement("a");
        metadataContainer.setAttribute("class", "njg-metadata");
        metadataContainer.setAttribute("style", "display: block");
        innerDiv.setAttribute("class", "njg-inner");
        closeA.setAttribute("class", "njg-close");
        closeA.setAttribute("id", "metadata-close");

        closeA.onclick = () => {
          metadataContainer.style.visibility = "hidden";
          _this.config.metadata = false;
        };
        innerDiv.innerHTML = html;
        metadataContainer.appendChild(innerDiv);
        metadataContainer.appendChild(closeA);

        _this.el.appendChild(metadataContainer);

        return metadataContainer;
      },

      /**
       * @function
       * @name searchElements
       * Add search function for new elements.
       *
       * @param {string} url listen url
       *
       * @return {function} searchFunc
       */

      searchElements(url) {
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
              _this.utils.JSONDataUpdate(data);
            })
            .catch(error => {
              throw error;
            });
        }
      }
    };
  }
}

window.NetJSONGraph = NetJSONGraph;
