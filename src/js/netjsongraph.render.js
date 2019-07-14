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

import L from "leaflet/dist/leaflet.js";

class NetJSONGraphRender {
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
  graphSetOption(customOption, echartsLayer, _this) {
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

    echartsLayer.setOption(
      _this.utils.deepMergeObj(commonOption, customOption)
    );
    echartsLayer.on(
      "click",
      function(params) {
        let clickElement = configs.onClickElement.bind(_this);

        if (params.componentSubType === "graph") {
          clickElement(
            params.dataType === "edge" ? "link" : "node",
            params.data
          );
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
   * @name generateGraphOption
   *
   * generate graph option in echarts by JSONData.
   *
   * @param  {object}  JSONData        Render data
   * @param  {object}  _this           NetJSONGraph object
   *
   * @return {object}  graph option
   *
   */
  generateGraphOption(JSONData, _this) {
    let categories = [],
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
        nodeResult.name = node.label || node.id;
        if (node.properties && node.properties.category) {
          nodeResult.category = String(node.properties.category);
        }
        if (
          nodeResult.category &&
          categories.indexOf(nodeResult.category) === -1
        ) {
          categories.push(nodeResult.category);
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
      legend = categories.length
        ? {
            data: categories
          }
        : undefined;

    return {
      legend,
      series
    };
  }

  /**
   * @function
   * @name generateMapOption
   *
   * generate map option in echarts by JSONData.
   *
   * @param  {object}  JSONData        Render data
   * @param  {object}  _this           NetJSONGraph object
   *
   * @return {object}  map option
   *
   */
  generateMapOption(JSONData, _this) {
    let configs = _this.config,
      { nodes, links } = JSONData,
      flatNodes = JSONData.flatNodes || {},
      linesData = [],
      nodesData = [];

    nodes.map(node => {
      if (!node.properties) {
        console.error(`Node ${node.id} position is undefined!`);
      } else {
        let { location } = node.properties;

        if (!location || !location.lng || !location.lat) {
          console.error(`Node ${node.id} position is undefined!`);
        } else {
          nodesData.push({
            name: node.label || node.id,
            value: [location.lng, location.lat],
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
              flatNodes[link.source].properties.location.lng,
              flatNodes[link.source].properties.location.lat
            ],
            [
              flatNodes[link.target].properties.location.lng,
              flatNodes[link.target].properties.location.lat
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

    return {
      leaflet: {
        tiles: [
          {
            urlTemplate: configs.mapTileConfig[0],
            options: configs.mapTileConfig[1]
          }
        ],
        center: [...configs.mapCenter].reverse(),
        zoom: configs.mapZoom,
        roam: configs.mapRoam
      },
      toolbox: {
        show: false
      },
      series
    };
  }

  /**
   * @function
   * @name graphRender
   *
   * Render the final graph result based on JSONData.
   * @param  {object}  graphContainer  DOM
   * @param  {object}  JSONData        Render data
   * @param  {object}  _this           NetJSONGraph object
   *
   */
  graphRender(graphContainer, JSONData, _this) {
    let graph = echarts.init(graphContainer, null, {
      renderer: _this.config.svgRender ? "svg" : "canvas"
    });

    _this.echarts = _this.utils.graphSetOption(
      _this.utils.generateGraphOption(JSONData, _this),
      graph,
      _this
    );

    _this.config.onLoad.call(_this);
  }

  /**
   * @function
   * @name mapRender
   *
   * Render the final map result based on JSONData.
   * @param  {object}  mapContainer   DOM
   * @param  {object}  JSONData       Render data
   * @param  {object}  _this          NetJSONGraph object
   *
   */
  mapRender(mapContainer, JSONData, _this) {
    if (!_this.config.mapTileConfig[0]) {
      console.error(`You must add the tiles via the "mapTileConfig" param!`);
      return;
    }

    const graph = echarts.init(mapContainer, null, {
      renderer: _this.config.svgRender ? "svg" : "canvas"
    });

    _this.echarts = _this.utils.graphSetOption(
      _this.utils.generateMapOption(JSONData, _this),
      graph,
      _this
    );
    _this.leaflet = graph._api.getCoordinateSystems()[0].getLeaflet();

    _this.config.onLoad.call(_this);
  }
}

export { NetJSONGraphRender, echarts, L };
