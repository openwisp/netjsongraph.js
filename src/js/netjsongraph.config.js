"use strict";

/**
 * Default configs
 *
 * @param  {string}            el                  body        The container element
 * @param  {bool}              metadata            true        Display NetJSON metadata at startup?
 * @param  {bool}              svgRender           false       Use SVG render?
 * @param  {object}            title               {}          Graph Title. @see {@link https://echarts.apache.org/en/option.html#title}
 * @param  {object}            graphConfig         {}          Customize your colorful style. @see {@link https://echarts.apache.org/en/option.html#series-graph}
 * @param  {float}             gravity             0.1         The gravitational strength to the specified numerical value. @see {@link https://github.com/mbostock/d3/wiki/Force-Layout#gravity}
 * @param  {int|array}         edgeLength          [20, 60]    The distance between the two nodes on the side, this distance will also be affected by repulsion. @see {@link https://echarts.apache.org/option.html#series-graph.force.edgeLength}
 * @param  {int|array}         repulsion           200         The repulsion factor between nodes. @see {@link https://echarts.apache.org/option.html#series-graph.force.repulsion}
 * @param {int|Array|function} nodeSize            node => 10  The radius of node in pixel @see {@link https://echarts.apache.org/en/option.html#series-graph.symbolSize}
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
  svgRender: false,
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
  graphConfig: {
    layout: "force",
    cursor: "pointer",
    label: {
      show: true,
      color: "#000000"
    },
    roam: true,
    draggable: true,
    focusNodeAdjacency: true,
    hoverAnimation: true,
    legendHoverLink: true
  },
  scaleExtent: [0.25, 18],
  gravity: 0.1,
  edgeLength: [20, 60],
  repulsion: 120,
  nodeSize: 10,
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

export default NetJSONGraphDefaultConfig;
