import * as echarts from "echarts/lib/echarts";
import "echarts/lib/chart/graph";
import "echarts/lib/chart/effectScatter";
import "echarts/lib/chart/lines";
import "echarts/lib/component/tooltip";
import "echarts/lib/component/title";
import "echarts/lib/component/toolbox";
import "echarts/lib/component/legend";

import "zrender/lib/svg/svg";

import "../../lib/js/echarts-gl.min";

import L from "leaflet/dist/leaflet";

class NetJSONGraphRender {
  /**
   * @function
   * @name echartsSetOption
   *
   * set option in echarts and render.
   *
   * @param  {object}  customOption    custom option determined by different render.
   * @param  {object}  self          NetJSONGraph object
   *
   * @return {object}  graph object
   *
   */
  echartsSetOption(customOption, self) {
    const configs = self.config;
    const echartsLayer = self.echarts;
    const commonOption = self.utils.deepMergeObj(
      {
        // Show element's detail when hover

        tooltip: {
          confine: true,
          position: "right",
          padding: [5, 16],
          formatter: (params) => {
            if (params.componentSubType === "graph") {
              return params.dataType === "edge"
                ? self.utils.linkInfo(params.data)
                : self.utils.nodeInfo(params.data);
            }
            if (params.componentSubType === "graphGL") {
              return self.utils.nodeInfo(params.data);
            }
            return params.componentSubType === "lines"
              ? self.utils.linkInfo(params.data.link)
              : self.utils.nodeInfo(params.data.node);
          },
        },
      },
      configs.echartsOption,
    );

    echartsLayer.setOption(self.utils.deepMergeObj(commonOption, customOption));
    echartsLayer.on(
      "click",

      (params) => {
        const clickElement = configs.onClickElement.bind(self);

        if (params.componentSubType === "graph") {
          return clickElement(
            params.dataType === "edge" ? "link" : "node",
            params.data,
          );
        }
        if (params.componentSubType === "graphGL") {
          return clickElement("node", params.data);
        }
        return params.componentSubType === "lines"
          ? clickElement("link", params.data.link)
          : clickElement("node", params.data.node);
      },
      {passive: true},
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
   * @param  {object}  self          NetJSONGraph object
   *
   * @return {object}  graph option
   *
   */
  generateGraphOption(JSONData, self) {
    const categories = [];
    const configs = self.config;
    const nodes = JSONData.nodes.map((node) => {
      const nodeResult = JSON.parse(JSON.stringify(node));

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
    });
    const links = JSONData.links.map((link) => {
      const linkResult = JSON.parse(JSON.stringify(link));

      linkResult.lineStyle =
        typeof configs.linkStyleProperty === "function"
          ? configs.linkStyleProperty(link)
          : configs.linkStyleProperty;

      return linkResult;
    });
    const series = [
      Object.assign(configs.graphConfig, {
        type: configs.graphConfig.type === "graphGL" ? "graphGL" : "graph",
        layout:
          configs.graphConfig.type === "graphGL"
            ? "forceAtlas2"
            : configs.graphConfig.layout,
        nodes,
        links,
        categories: categories.map((category) => ({name: category})),
      }),
    ];
    const legend = categories.length
      ? {
          data: categories,
        }
      : undefined;

    return {
      legend,
      series,
    };
  }

  /**
   * @function
   * @name generateMapOption
   *
   * generate map option in echarts by JSONData.
   *
   * @param  {object}  JSONData        Render data
   * @param  {object}  self          NetJSONGraph object
   *
   * @return {object}  map option
   *
   */
  generateMapOption(JSONData, self) {
    const configs = self.config;
    const {nodes, links} = JSONData;
    const flatNodes = JSONData.flatNodes || {};
    const linesData = [];
    const nodesData = [];

    nodes.forEach((node) => {
      if (!node.properties) {
        console.error(`Node ${node.id} position is undefined!`);
      } else {
        const {location} = node.properties;

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
            node,
          });
          if (!JSONData.flatNodes) {
            flatNodes[node.id] = JSON.parse(JSON.stringify(node));
          }
        }
      }
    });
    links.forEach((link) => {
      if (!flatNodes[link.source]) {
        console.error(`Node ${link.source} is not exist!`);
      } else if (!flatNodes[link.target]) {
        console.error(`Node ${link.target} is not exist!`);
      } else {
        linesData.push({
          coords: [
            [
              flatNodes[link.source].properties.location.lng,
              flatNodes[link.source].properties.location.lat,
            ],
            [
              flatNodes[link.target].properties.location.lng,
              flatNodes[link.target].properties.location.lat,
            ],
          ],
          lineStyle:
            typeof configs.linkStyleProperty === "function"
              ? configs.linkStyleProperty(link)
              : configs.linkStyleProperty,
          link,
        });
      }
    });

    const series = [
      Object.assign(configs.mapNodeConfig, {
        type:
          configs.mapNodeConfig.type === "effectScatter"
            ? "effectScatter"
            : "scatter",
        coordinateSystem: "leaflet",
        data: nodesData,
        animationDuration: 1000,
      }),
      ...configs.mapLinkConfig.map((lineConfig) =>
        Object.assign(lineConfig, {
          type: "lines",
          coordinateSystem: "leaflet",
          data: linesData,
        }),
      ),
    ];

    return {
      leaflet: {
        tiles: configs.mapTileConfig,
        mapOptions: configs.mapOptions,
      },
      toolbox: {
        show: false,
      },
      series,
    };
  }

  /**
   * @function
   * @name graphRender
   *
   * Render the final graph result based on JSONData.
   * @param  {object}  JSONData        Render data
   * @param  {object}  self          NetJSONGraph object
   *
   */
  graphRender(JSONData, self) {
    self.utils.echartsSetOption(
      self.utils.generateGraphOption(JSONData, self),
      self,
    );

    window.onresize = () => {
      self.echarts.resize();
    };

    self.event.emit("onLoad");
    self.event.emit("renderArray");
  }

  /**
   * @function
   * @name mapRender
   *
   * Render the final map result based on JSONData.
   * @param  {object}  JSONData       Render data
   * @param  {object}  self         NetJSONGraph object
   *
   */
  mapRender(JSONData, self) {
    if (!self.config.mapTileConfig[0]) {
      console.error(`You must add the tiles via the "mapTileConfig" param!`);
      return;
    }

    self.utils.echartsSetOption(
      self.utils.generateMapOption(JSONData, self),
      self,
    );

    // eslint-disable-next-line no-underscore-dangle
    self.leaflet = self.echarts._api.getCoordinateSystems()[0].getLeaflet();
    // eslint-disable-next-line no-underscore-dangle
    self.leaflet._zoomAnimated = false;

    self.event.emit("onLoad");
    self.event.emit("renderArray");
  }

  /**
   * @function
   * @name appendData
   * Append new data. Can only be used for `map` render!
   *
   * @param  {object}         JSONData   Data
   * @param  {object}         self     NetJSONGraph object
   *
   */
  appendData(JSONData, self) {
    if (self.config.render !== self.utils.mapRender) {
      console.error("AppendData function can only be used for map render!");
      return;
    }
    const opts = self.utils.generateMapOption(JSONData, self);
    opts.series.forEach((obj, index) => {
      self.echarts.appendData({seriesIndex: index, data: obj.data});
    });
    // modify this.data
    self.utils.mergeData(JSONData, self);

    self.config.afterUpdate.call(self);
  }

  /**
   * @function
   * @name addData
   * Add new data. Mainly used for `graph` render.
   *
   * @param  {object}         JSONData      Data
   * @param  {object}         self        NetJSONGraph object
   */
  addData(JSONData, self) {
    // modify this.data
    self.utils.mergeData(JSONData, self);
    // `graph` render can't append data. So we have to merge the data and re-render.
    self.utils.render();

    self.config.afterUpdate.call(self);
  }

  /**
   * @function
   * @name mergeData
   * Merge new data. Modify this.data.
   *
   * @param  {object}         JSONData      Data
   * @param  {object}         self        NetJSONGraph object
   */
  mergeData(JSONData, self) {
    const nodes = self.data.nodes.concat(JSONData.nodes);
    const links = self.data.links.concat(JSONData.links);
    Object.assign(self.data, JSONData, {
      nodes,
      links,
    });
  }
}

export {NetJSONGraphRender, echarts, L};
