"use strict";

/**
 * Default options
 *
 * @param  {string}            el                  body        Container element. "body" defaultly.
 * @param  {string|function}   render              "graph"     Render function. "graph" defaultly.
 * @param  {bool}              metadata            true        Display NetJSON metadata at startup?
 * @param  {bool}              svgRender           false       Use SVG render?
 * @param  {string}            dealDataByWorker                WebWorker file url.
 *
 * @param  {object}            echartsOption       {}          A global configuration of Echarts. @see {@link https://echarts.apache.org/en/option.html#title}
 *
 * @param  {object}            graphConfig         {}          Configuration of graph series(graphRender). @see {@link https://echarts.apache.org/en/option.html#series-graph}
 *
 * @param  {string|bool}       mapOptions          {}          Map init config. @see {@link https://leafletjs.com/reference-1.5.0.html#map-option}
 * @param  {array}             mapTileConfig       []          Map tiles config array, whose format is [{label, urlTemplate, options}]. @see {@link https://leafletjs.com/reference-1.5.0.html#tilelayer-option}
 * @param  {array}             mapLinkConfig       []          Support multiple lines superimposed style. @see {@link https://echarts.apache.org/en/option.html#series-lines}
 * @param  {object}            mapNodeConfig       {}          Map node style. @see {@link https://echarts.apache.org/en/option.html#series-effectScatter}
 *
 * @param {int|Array|function} nodeSize            node => 10  The size of nodes in pixel. @see {@link https://echarts.apache.org/en/option.html#series-graph.symbolSize}
 * @param  {object|function}   nodeStyleProperty   node => {}  Used to custom node style. @see {@link https://echarts.apache.org/en/option.html#series-graph.data.itemStyle}
 * @param  {object|function}   linkStyleProperty   link => {}  Used to custom link style. @see {@link https://echarts.apache.org/en/option.html#series-graph.links.lineStyle}
 *
 * @param  {function}          onInit                          Callback function executed on initialization.
 * @param  {function}          onRender                        Callback function executed on render start.
 * @param  {function}          onUpdate                        Callback function executed on update.
 * @param  {function}          afterUpdate                     Callback function executed after update.
 * @param  {function}          onLoad                          Callback function executed when rendered.
 * @param  {function}          prepareData                     Callback function executed after data has been loaded. Used to convert data to NetJSONGraph Data.
 * @param  {function}          onClickElement                  Called when a node or link is clicked.
 */
const NetJSONGraphDefaultConfig = {
  metadata: true,
  svgRender: false,
  echartsOption: {
    title: {
      text: "NetJSONGraph",
      link: "",
      textStyle: {
        color: "grey",
        fontWeight: "bold",
        fontSize: 30
      },
      left: "center",
      top: "5%"
    },
    aria: {
      show: true,
      description:
        "This is a force-oriented graph chart that depicts the relationship between ip nodes."
    },
    toolbox: {
      show: true,
      feature: {
        restore: {
          show: true,
          title: "Restore view"
        },
        saveAsImage: {
          show: true,
          title: "Save image"
        }
      }
    },
    color: ["#d66b30", "#a3c7dd", "#5c9660", "#d66b30"]
  },

  graphConfig: {
    layout: "force",
    label: {
      show: true,
      color: "#000000",
      position: "top"
    },
    force: {
      gravity: 0.1,
      edgeLength: [20, 60],
      repulsion: 120
    },
    roam: true,
    draggable: true,
    focusNodeAdjacency: false,
    hoverAnimation: true,
    legendHoverLink: true
  },

  mapOptions: {
    roam: true
  },
  mapTileConfig: [],
  mapLinkConfig: [{}],
  mapNodeConfig: {
    label: {
      show: true,
      color: "#000000",
      position: "top",
      formatter: "{b}"
    }
  },

  nodeSize: 25,
  nodeStyleProperty: (() => {
    let styles = [
        {
          color: {
            type: "radial",
            x: 0.5,
            y: 0.5,
            r: 0.5,
            colorStops: [
              {
                offset: 0,
                color: "#d66b30"
              },
              {
                offset: 0.7,
                color: "#d66b30"
              },
              {
                offset: 0.71,
                color: "#ebb598"
              },
              {
                offset: 1,
                color: "#ebb598"
              }
            ]
          }
        },
        {
          color: {
            type: "radial",
            x: 0.5,
            y: 0.5,
            r: 0.5,
            colorStops: [
              {
                offset: 0,
                color: "#a3c7dd"
              },
              {
                offset: 0.7,
                color: "#a3c7dd"
              },
              {
                offset: 0.71,
                color: "#e3edf6"
              },
              {
                offset: 1,
                color: "#e3edf6"
              }
            ]
          }
        },
        {
          color: {
            type: "radial",
            x: 0.5,
            y: 0.5,
            r: 0.5,
            colorStops: [
              {
                offset: 0,
                color: "#5c9660"
              },
              {
                offset: 0.7,
                color: "#5c9660"
              },
              {
                offset: 0.71,
                color: "#aecbb0"
              },
              {
                offset: 1,
                color: "#aecbb0"
              }
            ]
          }
        },
        {
          color: {
            type: "radial",
            x: 0.5,
            y: 0.5,
            r: 0.5,
            colorStops: [
              {
                offset: 0,
                color: "#d66b30"
              },
              {
                offset: 0.7,
                color: "#d66b30"
              },
              {
                offset: 0.71,
                color: "#ebb598"
              },
              {
                offset: 1,
                color: "#ebb598"
              }
            ]
          }
        }
      ],
      i = 0;
    return () => {
      return styles[i++ % styles.length];
    };
  })(),
  linkStyleProperty: () => ({
    width: 5,
    color: "#999",
    shadowColor: "rgba(0, 0, 0, 0.5)",
    shadowBlur: 10
  }),
  /**
   * @function
   * @name prepareData
   * Callback function executed after data has been loaded. Used to convert data to NetJSONGraph Data.
   *
   * @param JSONData  {object}
   *
   * @this  {object}        The instantiated object of NetJSONGraph
   *
   */
  prepareData: function(JSONData) {},
  /**
   * @function
   * @name onClickElement
   * Called when a node or link is clicked
   *
   * @param {string} type   The type of element
   * @param {object} data   Element data
   *
   * @this  {object}        The instantiated object of NetJSONGraph
   *
   */
  onClickElement: function(type, data) {
    let nodeLinkOverlay = document.getElementsByClassName("njg-overlay")[0];
    nodeLinkOverlay.style.visibility = "visible";
    nodeLinkOverlay.innerHTML = `
        <div class="njg-inner">
            ${
              type === "link"
                ? this.utils.linkInfo(data)
                : this.utils.nodeInfo(data)
            }
        </div>
    `;

    const closeA = document.createElement("a");
    closeA.setAttribute("class", "njg-close");
    closeA.setAttribute("id", "nodelinkOverlay-close");
    closeA.onclick = () => {
      nodeLinkOverlay.style.visibility = "hidden";
    };

    nodeLinkOverlay.appendChild(closeA);
  }
};

export default { ...NetJSONGraphDefaultConfig };
