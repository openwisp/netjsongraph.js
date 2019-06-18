"use strict";

import * as echarts from "echarts/lib/echarts";
import "echarts/lib/chart/graph";
import "echarts/lib/chart/effectScatter";
import "echarts/lib/chart/lines";
import "echarts/lib/component/tooltip";
import "echarts/lib/component/title";
import "echarts/lib/component/toolbox";
import "echarts/lib/component/legend";
import "zrender/lib/svg/svg";

import "leaflet/dist/leaflet.js";

import "echarts-leaflet/dist/echarts-leaflet.js";

/**
 * @function
 * @name graphSetOption
 *
 * set option in echarts and render.
 *
 * @param  {object}  customOption    custom option determined by different render.
 * @param  {object}  _this           NetJSONGraph object
 *
 * @return {object}  graph object
 *
 */
function graphSetOption(customOption, echartsLayer, _this) {
  const configs = _this.config,
    commonOption = _this.utils.deepMergeObj(
      {
        tooltip: {
          confine: true,
          formatter: params => {
            if (params.componentSubType === "graph") {
              return params.dataType === "edge"
                ? _this.utils.linkInfo(params.data)
                : _this.utils.nodeInfo(params.data);
            } else {
              return params.componentSubType === "lines"
                ? _this.utils.linkInfo(params.data.link)
                : _this.utils.nodeInfo(params.data.node);
            }
          }
        }
      },
      configs.echartsOption
    );

  echartsLayer.setOption(_this.utils.deepMergeObj(commonOption, customOption));
  echartsLayer.on(
    "click",
    function(params) {
      let clickElement = configs.onClickElement.bind(_this);

      if (params.componentSubType === "graph") {
        clickElement(params.dataType === "edge" ? "link" : "node", params.data);
      } else {
        return params.componentSubType === "lines"
          ? clickElement("link", params.data.link)
          : clickElement("node", params.data.node);
      }
    },
    { passive: true }
  );

  window.onresize = () => {
    echartsLayer.resize();
  };

  return echartsLayer;
}

/**
 * @function
 * @name graphRender
 *
 * Render the final graph result based on JSONData.
 * @param  {object}  graphContainer  DOM
 * @param  {object}  JSONData        Render dependent configuration
 * @param  {object}  _this           NetJSONGraph object
 *
 */
function graphRender(graphContainer, JSONData, _this) {
  let categories = JSONData.categories || [],
    configs = _this.config,
    nodes = JSONData.nodes.map(function(node) {
      let nodeResult = JSON.parse(JSON.stringify(node));

      nodeResult.itemStyle =
        typeof configs.nodeStyleProperty === "function"
          ? configs.nodeStyleProperty(node)
          : configs.nodeStyleProperty;
      nodeResult.symbolSize =
        typeof configs.nodeSize === "function"
          ? configs.nodeSize(node)
          : configs.nodeSize;
      nodeResult.name = node.name || node.id;
      nodeResult.value = node.value || node.name;
      if (node.category) {
        nodeResult.category = String(node.category);
      }
      if (node.category && categories.indexOf(node.category) === -1) {
        categories.push(node.category);
      }

      return nodeResult;
    }),
    links = JSONData.links.map(function(link) {
      let linkResult = JSON.parse(JSON.stringify(link));

      linkResult.lineStyle =
        typeof configs.linkStyleProperty === "function"
          ? configs.linkStyleProperty(link)
          : configs.linkStyleProperty;

      return linkResult;
    }),
    series = [
      Object.assign(configs.graphConfig, {
        type: "graph",
        nodes,
        links,
        categories: categories.map(category => ({ name: category }))
      })
    ],
    graph = echarts.init(graphContainer, null, {
      renderer: configs.svgRender ? "svg" : "canvas"
    }),
    legend = categories.length
      ? {
          data: categories
        }
      : undefined;

  _this.echarts = graphSetOption(
    {
      legend,
      series
    },
    graph,
    _this
  );

  configs.onLoad.call(_this);
}

/**
 * @function
 * @name mapRender
 *
 * Render the final map result based on JSONData.
 * @param  {object}  mapContainer   DOM
 * @param  {object}  JSONData       Render dependent configuration
 * @param  {object}  _this          NetJSONGraph object
 *
 */
function mapRender(mapContainer, JSONData, _this) {
  let configs = _this.config,
    { nodes, links } = JSONData,
    flatNodes = JSONData.flatNodes || {},
    linesData = [],
    nodesData = [];

  nodes.map(node => {
    if (!node.location || !node.location.lng || !node.location.lat) {
      console.error(`Node ${node.id} position is undefined!`);
    } else {
      nodesData.push({
        name: node.name,
        value: [node.location.lng, node.location.lat],
        symbolSize:
          typeof configs.nodeSize === "function"
            ? configs.nodeSize(node)
            : configs.nodeSize,
        itemStyle:
          typeof configs.nodeStyleProperty === "function"
            ? configs.nodeStyleProperty(node)
            : configs.nodeStyleProperty,
        node
      });
      if (!JSONData.flatNodes) {
        flatNodes[node.id] = JSON.parse(JSON.stringify(node));
      }
    }
  });
  links.map(link => {
    if (!flatNodes[link.source]) {
      console.error(`Node ${link.source} is not exist!`);
    } else if (!flatNodes[link.target]) {
      console.error(`Node ${link.target} is not exist!`);
    } else {
      linesData.push({
        coords: [
          [
            flatNodes[link.source].location.lng,
            flatNodes[link.source].location.lat
          ],
          [
            flatNodes[link.target].location.lng,
            flatNodes[link.target].location.lat
          ]
        ],
        lineStyle:
          typeof configs.linkStyleProperty === "function"
            ? configs.linkStyleProperty(link)
            : configs.linkStyleProperty,
        link: link
      });
    }
  });

  let series = [
    ...configs.mapLineConfig.map(lineConfig =>
      Object.assign(lineConfig, {
        type: "lines",
        coordinateSystem: "leaflet",
        data: linesData
      })
    ),
    Object.assign(configs.mapNodeConfig, {
      type: "effectScatter",
      coordinateSystem: "leaflet",
      data: nodesData
    })
  ];

  const graph = echarts.init(mapContainer, null, {
    renderer: configs.svgRender ? "svg" : "canvas"
  });
  _this.echarts = graphSetOption(
    {
      leaflet: {
        tiles: [
          {
            urlTemplate: configs.mapTileConfig[0],
            options: configs.mapTileConfig[1]
          }
        ],
        center: configs.mapCenter.reverse(),
        zoom: configs.mapZoom,
        roam: configs.mapRoam
      },
      toolbox: {
        show: false
      },
      series
    },
    graph,
    _this
  );
  _this.leaflet = graph._api.getCoordinateSystems()[0].getLeaflet();

  configs.onLoad.call(_this);
}

/**
 * @function
 * @name viewInputImage
 *
 * Add Input to upload indoormap image.
 *
 * @param  {string}   img             Indoor img src
 * @param  {object}   _this           NetJSONMap object
 *
 * @return {object}   input DOM
 */

function presentIndoormap(img, _this) {
  let netjsonmap = _this.leaflet,
    tempImage = new Image();

  tempImage.src = img;
  tempImage.onload = () => {
    let southWest, northEast, bounds;
    if (
      tempImage.width / tempImage.height >
      window.innerWidth / window.innerHeight
    ) {
      (southWest = netjsonmap.layerPointToLatLng(
        L.point(
          0,
          window.innerHeight -
            (window.innerHeight -
              (window.innerWidth * tempImage.height) / tempImage.width) /
              2 +
            60
        )
      )),
        (northEast = netjsonmap.layerPointToLatLng(
          L.point(
            window.innerWidth,
            (window.innerHeight -
              (window.innerWidth * tempImage.height) / tempImage.width) /
              2 +
              60
          )
        ));
      bounds = new L.LatLngBounds(southWest, northEast);
    } else {
      (southWest = netjsonmap.layerPointToLatLng(
        L.point(
          (window.innerWidth -
            (window.innerHeight * tempImage.width) / tempImage.height) /
            2,
          window.innerHeight + 60
        )
      )),
        (northEast = netjsonmap.layerPointToLatLng(
          L.point(
            window.innerWidth -
              (window.innerWidth -
                (window.innerHeight * tempImage.width) / tempImage.height) /
                2,
            60
          )
        ));
      bounds = new L.LatLngBounds(southWest, northEast);
    }
    netjsonmap.eachLayer(layer => {
      if (layer._url) {
        netjsonmap.removeLayer(layer);
      }
    });
    L.imageOverlay(tempImage.src, bounds).addTo(netjsonmap);
  };
}

window.graphRender = graphRender;
window.mapRender = mapRender;
window.presentIndoormap = presentIndoormap;
