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

import "../../lib/js/echarts-gl";

import L from "leaflet/dist/leaflet.js";

class NetJSONGraphRender {
  /**
   * @function
   * @name echartsSetOption
   *
   * set option in echarts and render.
   *
   * @param  {object}  customOption    custom option determined by different render.
   * @param  {object}  _this           NetJSONGraph object
   *
   * @return {object}  graph object
   *
   */
  echartsSetOption(customOption, _this) {
    const configs = _this.config,
      echartsLayer = _this.echarts,
      commonOption = _this.utils.deepMergeObj(
        {
          // Show element's detail when hover
          //
          // tooltip: {
          //   confine: true,
          //   formatter: params => {
          //     if (params.componentSubType === "graph") {
          //       return params.dataType === "edge"
          //         ? _this.utils.linkInfo(params.data)
          //         : _this.utils.nodeInfo(params.data);
          //     } else if (params.componentSubType === "graphGL") {
          //       return _this.utils.nodeInfo(params.data);
          //     } else {
          //       return params.componentSubType === "lines"
          //         ? _this.utils.linkInfo(params.data.link)
          //         : _this.utils.nodeInfo(params.data.node);
          //     }
          //   }
          // }
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
        } else if (params.componentSubType === "graphGL") {
          clickElement("node", params.data);
        } else {
          return params.componentSubType === "lines"
            ? clickElement("link", params.data.link)
            : clickElement("node", params.data.node);
        }
      },
      { passive: true }
    );

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
        nodeResult.name = typeof node.label === "string" ? node.label : node.id;
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
          type: configs.graphConfig.type === "graphGL" ? "graphGL" : "graph",
          layout:
            configs.graphConfig.type === "graphGL"
              ? "forceAtlas2"
              : configs.graphConfig.layout,
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
            name: typeof node.label === "string" ? node.label : node.id,
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
      Object.assign(configs.mapNodeConfig, {
        type:
          configs.mapNodeConfig.type === "effectScatter"
            ? "effectScatter"
            : "scatter",
        coordinateSystem: "leaflet",
        data: nodesData
      }),
      ...configs.mapLinkConfig.map(lineConfig =>
        Object.assign(lineConfig, {
          type: "lines",
          coordinateSystem: "leaflet",
          data: linesData
        })
      )
    ];

    return {
      leaflet: {
        tiles: configs.mapTileConfig,
        mapOptions: configs.mapOptions
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
   * @param  {object}  JSONData        Render data
   * @param  {object}  _this           NetJSONGraph object
   *
   */
  graphRender(JSONData, _this) {
    _this.utils.echartsSetOption(
      _this.utils.generateGraphOption(JSONData, _this),
      _this
    );

    window.onresize = () => {
      _this.echarts.resize();
    };

    _this.event.emit("onLoad");
    _this.event.emit("renderArray");
  }

  /**
   * @function
   * @name mapRender
   *
   * Render the final map result based on JSONData.
   * @param  {object}  JSONData       Render data
   * @param  {object}  _this          NetJSONGraph object
   *
   */
  mapRender(JSONData, _this) {
    if (!_this.config.mapTileConfig[0]) {
      console.error(`You must add the tiles via the "mapTileConfig" param!`);
      return;
    }

    _this.utils.echartsSetOption(
      _this.utils.generateMapOption(JSONData, _this),
      _this
    );

    _this.leaflet = _this.echarts._api.getCoordinateSystems()[0].getLeaflet();

    _this.event.emit("onLoad");
    _this.event.emit("renderArray");
  }

  /**
   * @function
   * @name _appendData
   * Append new data. Can only be used for `map` render!
   *
   * @param  {object}         JSONData   Data
   * @param  {object}         _this      NetJSONGraph object
   *
   */
  _appendData(JSONData, _this) {
    if (_this.config.render !== _this.utils.mapRender) {
      console.error("AppendData function can only be used for map render!");
      return;
    }
    const opts = _this.utils.generateMapOption(JSONData, _this);
    opts.series.map((obj, index) => {
      _this.echarts.appendData({
        seriesIndex: index,
        data: obj.data
      });
    });
    // modify this.data
    _this.utils._mergeData(JSONData, _this);

    _this.config.afterUpdate.call(_this);
  }

  /**
   * @function
   * @name _addData
   * Add new data. Mainly used for `graph` render.
   *
   * @param  {object}         JSONData      Data
   * @param  {object}         _this         NetJSONGraph object
   */
  _addData(JSONData, _this) {
    // modify this.data
    _this.utils._mergeData(JSONData, _this);
    // `graph` render can't append data. So we have to merge the data and re-render.
    _this.utils._render();

    _this.config.afterUpdate.call(_this);
  }

  /**
   * @function
   * @name _mergeData
   * Merge new data. Modify this.data.
   *
   * @param  {object}         JSONData      Data
   * @param  {object}         _this         NetJSONGraph object
   */
  _mergeData(JSONData, _this) {
    const nodes = _this.data.nodes.concat(JSONData.nodes),
      links = _this.data.links.concat(JSONData.links);
    Object.assign(_this.data, JSONData, {
      nodes,
      links
    });
  }
}

export { NetJSONGraphRender, echarts, L };
