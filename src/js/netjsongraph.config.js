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
 * @param  {function}          onReady                         Callback function executed when rendered.
 * @param  {function}          prepareData                     Callback function executed after data has been loaded. Used to convert data to NetJSONGraph Data.
 * @param  {function}          onClickElement                  Called when a node or link is clicked.
 */
const NetJSONGraphDefaultConfig = {
  metadata: true,
  svgRender: false,
  switchMode: false,
  maxPointsFetched: 10000,
  loadMoreAtZoomLevel: 9,
  clustering: false,
  clusteringThreshold: 100,
  disableClusteringAtLevel: 8,
  clusterRadius: 80,
  showMetaOnNarrowScreens: false,
  showLabelsAtZoomLevel: 7,
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
      labelLayout: {
        hideOverlap: true,
      },
      force: {
        gravity: 0.1,
        edgeLength: [20, 60],
        repulsion: 120,
      },
      roam: true,
      draggable: true,
      legendHoverLink: true,
      emphasis: {
        focus: "none",
        lineStyle: {
          color: "#3acc38",
          opacity: 1,
        },
      },
      nodeStyle: {
        color: "#ffebc4",
      },
      linkStyle: {
        width: 6,
        color: "#1ba619",
      },
      nodeSize: "15",
    },
    baseOptions: {
      backgroundColor: "#282222",
      media: [
        {
          query: {
            minWidth: 320,
            maxWidth: 500,
          },
          option: {
            series: [
              {
                zoom: 0.7,
              },
            ],
            toolbox: {
              itemSize: 18,
            },
          },
        },
        {
          query: {
            minWidth: 501,
          },
          option: {
            series: [
              {
                zoom: 1,
              },
            ],
            toolbox: {
              itemSize: 15,
            },
          },
        },
        {
          query: {
            minWidth: 320,
            maxWidth: 850,
          },
          option: {
            tooltip: {
              show: false,
            },
          },
        },
        {
          query: {
            minWidth: 851,
          },
          option: {
            tooltip: {
              show: true,
            },
          },
        },
      ],
    },
  },

  mapOptions: {
    roam: true,
    zoomAnimation: false,
    minZoom: 3,
    maxZoom: 18,
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
      nodeSize: "17",
    },
    linkConfig: {
      linkStyle: {
        width: 5,
        color: "#1ba619",
      },
      emphasis: {
        focus: "none",
        lineStyle: {
          color: "#3acc38",
          opacity: 1,
        },
      },
    },
    clusterConfig: {
      symbolSize: 30,
      itemStyle: {
        color: "#1566a9",
      },
      tooltip: {
        show: false,
      },
      label: {
        show: true,
        position: "inside",
        color: "#fff",
        offset: [0, 0],
      },
    },
    baseOptions: {
      toolbox: {
        show: false,
      },
      media: [
        {
          query: {
            minWidth: 320,
            maxWidth: 850,
          },
          option: {
            tooltip: {
              show: false,
            },
          },
        },
        {
          query: {
            minWidth: 851,
          },
          option: {
            tooltip: {
              show: true,
            },
          },
        },
      ],
    },
  },
  mapTileConfig: [
    {
      urlTemplate:
        process.env.MAPBOX_URL_TEMPLATE ||
        "http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      options: {
        minZoom: 3,
        maxZoom: 18,
        attribution: `&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors,
         tiles offered by <a href="https://www.mapbox.com">Mapbox</a>`,
      },
    },
  ],
  geoOptions: {
    style: {
      fillColor: "#1566a9",
      weight: 0,
      fillOpacity: 0.8,
      radius: 8,
    },
  },
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
  onClickElement(type, data) {
    let nodeLinkData;
    if (this.type === "netjson") {
      if (type === "node") {
        nodeLinkData = this.utils.nodeInfo(data);
      } else {
        nodeLinkData = this.utils.linkInfo(data);
      }

      if (this.config.showMetaOnNarrowScreens || this.el.clientWidth > 850) {
        this.gui.metaInfoContainer.style.display = "flex";
      }
    } else {
      nodeLinkData = data;
    }

    this.gui.getNodeLinkInfo(type, nodeLinkData);
    this.gui.sideBar.classList.remove("hidden");
  },

  /**
   * @function
   * @name onReady
   * Callback function executed when rendered.
   *
   * @this  {object}        The instantiated object of NetJSONGraph
   *
   */
  /* istanbul ignore next */
  onReady() {},
};

export default {...NetJSONGraphDefaultConfig};
