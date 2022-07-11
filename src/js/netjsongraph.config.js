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
  switchMode: false,
  echartsOption: {
    aria: {
      show: true,
      description:
        "This is a force-oriented graph chart that depicts the relationship between ip nodes.",
    },
    toolbox: {
      show: true,
      iconStyle: {
        borderColor: "#fff",
      },
      feature: {
        restore: {
          show: true,
          title: "Restore view",
        },
        saveAsImage: {
          show: true,
          title: "Save image",
        },
      },
    },
  },

  graphConfig: {
    series: {
      layout: "force",
      label: {
        show: true,
        color: "#fff",
        position: "top",
      },
      force: {
        gravity: 0.1,
        edgeLength: [20, 60],
        repulsion: 120,
      },
      roam: true,
      draggable: true,
      legendHoverLink: true,
      emphasis: {focus: "none"},
      nodeStyle: {
        color: "#fff",
      },
      linkStyle: {
        width: 3,
        color: "#1aa422",
      },
      nodeSize: "15",
    },
    baseOptions: {
      backgroundColor: "#3F3F3E",
    },
  },

  mapOptions: {
    roam: true,
    nodeConfig: {
      type: "scatter",
      label: {
        show: true,
        color: "#000000",
        position: "top",
        formatter: "{b}",
      },
      nodeStyle: {
        color: "#1566a9",
      },
      nodeSize: "15",
    },
    linkConfig: {
      linkStyle: {
        width: 4,
        color: "#1aa422",
      },
    },
    baseOptions: {
      toolbox: {
        show: false,
      },
    },
  },
  mapTileConfig: [],
  nodeCategories: [],
  linkCategories: [],

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
  // eslint-disable-next-line no-unused-vars
  prepareData(JSONData) {},

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
  // eslint-disable-next-line no-unused-vars
  onClickElement(type, data) {},
};

export default {...NetJSONGraphDefaultConfig};
