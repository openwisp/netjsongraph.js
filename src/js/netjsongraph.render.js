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
          position: (pos, params, dom, rect, size) => {
            let position = "right";
            if (size.viewSize[0] - pos[0] < size.contentSize[0]) {
              position = "left";
            }
            if (params.componentSubType === "lines") {
              position = [
                pos[0] + size.contentSize[0] / 8,
                pos[1] - size.contentSize[1] / 2,
              ];

              if (size.viewSize[0] - position[0] < size.contentSize[0]) {
                position[0] -= 1.25 * size.contentSize[0];
              }
            }
            return position;
          },
          padding: [5, 12],
          textStyle: {
            lineHeight: 5,
          },
          renderMode: "html",
          className: "njg-tooltip",
          formatter: (params) => {
            if (params.componentSubType === "graph") {
              return params.dataType === "edge"
                ? self.utils.getLinkTooltipInfo(params.data)
                : self.utils.getNodeTooltipInfo(params.data);
            }
            if (params.componentSubType === "graphGL") {
              return self.utils.getNodeTooltipInfo(params.data);
            }
            return params.componentSubType === "lines"
              ? self.utils.getLinkTooltipInfo(params.data.link)
              : self.utils.getNodeTooltipInfo(params.data.node);
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
      const {nodeStyleConfig, nodeSizeConfig, nodeEmphasisConfig} =
        self.utils.getNodeStyle(node, configs, "graph");

      nodeResult.itemStyle = nodeStyleConfig;
      nodeResult.symbolSize = nodeSizeConfig;
      nodeResult.emphasis = {
        itemStyle: nodeEmphasisConfig.nodeStyle,
        symbolSize: nodeEmphasisConfig.nodeSize,
      };
      nodeResult.name = typeof node.label === "string" ? node.label : node.id;

      return nodeResult;
    });
    const links = JSONData.links.map((link) => {
      const linkResult = JSON.parse(JSON.stringify(link));
      const {linkStyleConfig, linkEmphasisConfig} = self.utils.getLinkStyle(
        link,
        configs,
        "graph",
      );

      linkResult.lineStyle = linkStyleConfig;
      linkResult.emphasis = {lineStyle: linkEmphasisConfig.linkStyle};

      return linkResult;
    });

    const series = [
      Object.assign(configs.graphConfig.series, {
        type:
          configs.graphConfig.series.type === "graphGL" ? "graphGL" : "graph",
        layout:
          configs.graphConfig.series.type === "graphGL"
            ? "forceAtlas2"
            : configs.graphConfig.series.layout,
        nodes,
        links,
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
      ...configs.graphConfig.baseOptions,
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
          const {nodeStyleConfig, nodeSizeConfig, nodeEmphasisConfig} =
            self.utils.getNodeStyle(node, configs, "map");

          nodesData.push({
            name: typeof node.label === "string" ? node.label : node.id,
            value: [location.lng, location.lat],
            symbolSize: nodeSizeConfig,
            itemStyle: nodeStyleConfig,
            emphasis: {
              itemStyle: nodeEmphasisConfig.nodeStyle,
              symbolSize: nodeEmphasisConfig.nodeSize,
            },
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
        const {linkStyleConfig, linkEmphasisConfig} = self.utils.getLinkStyle(
          link,
          configs,
          "map",
        );
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
          lineStyle: linkStyleConfig,
          emphasis: {lineStyle: linkEmphasisConfig.linkStyle},
          link,
        });
      }
    });

    const series = [
      Object.assign(configs.mapOptions.nodeConfig, {
        type:
          configs.mapOptions.nodeConfig.type === "effectScatter"
            ? "effectScatter"
            : "scatter",
        coordinateSystem: "leaflet",
        data: nodesData,
        animationDuration: 1000,
      }),
      Object.assign(configs.mapOptions.linkConfig, {
        type: "lines",
        coordinateSystem: "leaflet",
        data: linesData,
      }),
    ];

    return {
      leaflet: {
        tiles: configs.mapTileConfig,
        mapOptions: configs.mapOptions,
      },
      series,
      ...configs.mapOptions.baseOptions,
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
    self.event.emit("onReady");
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

    if (self.type === "netjson") {
      self.utils.echartsSetOption(
        self.utils.generateMapOption(JSONData, self),
        self,
      );
      self.bboxData = {
        nodes: [],
        links: [],
      };
    } else if (self.type === "geojson") {
      const {nodeConfig, linkConfig, baseOptions, ...options} =
        self.config.mapOptions;

      self.echarts.setOption({
        leaflet: {
          tiles: self.config.mapTileConfig,
          mapOptions: options,
        },
      });

      self.bboxData = {
        features: [],
      };
    }

    // eslint-disable-next-line no-underscore-dangle
    self.leaflet = self.echarts._api.getCoordinateSystems()[0].getLeaflet();
    // eslint-disable-next-line no-underscore-dangle
    self.leaflet._zoomAnimated = false;

    self.config.geoOptions = self.utils.deepMergeObj(
      {
        pointToLayer: (feature, latlng) =>
          L.circleMarker(latlng, self.config.geoOptions.style),
        onEachFeature: (feature, layer) => {
          layer.on("click", () => {
            const properties = {
              ...feature.properties,
            };
            self.config.onClickElement.call(self, "Feature", properties);
          });
        },
      },
      self.config.geoOptions,
    );

    if (self.type === "geojson") {
      self.leaflet.geoJSON = L.geoJSON(self.data, self.config.geoOptions).addTo(
        self.leaflet,
      );
    }

    if (self.leaflet.getZoom() < self.config.showLabelsAtZoomLevel) {
      self.echarts.setOption({
        series: [
          {
            label: {
              show: false,
            },
          },
        ],
      });
    }

    self.leaflet.on("zoomend", () => {
      if (self.leaflet.getZoom() >= self.config.showLabelsAtZoomLevel) {
        self.echarts.setOption({
          series: [
            {
              label: {
                show: true,
              },
            },
          ],
        });
      } else {
        self.echarts.setOption({
          series: [
            {
              label: {
                show: false,
              },
            },
          ],
        });
      }
    });

    self.leaflet.on("moveend", async () => {
      const bounds = self.leaflet.getBounds();
      const removeBBoxData = function () {
        if (self.type === "netjson") {
          const removeNodes = new Set(self.bboxData.nodes);
          const removeLinks = new Set(self.bboxData.links);
          const updatedNodes = JSONData.nodes.filter(
            (node) => !removeNodes.has(node),
          );
          const updatedLinks = JSONData.links.filter(
            (link) => !removeLinks.has(link),
          );

          JSONData = {
            ...JSONData,
            nodes: updatedNodes,
            links: updatedLinks,
          };

          self.data = JSONData;
          self.echarts.setOption(self.utils.generateMapOption(JSONData, self));
          self.bboxData.nodes = [];
          self.bboxData.links = [];
        } else {
          const removeFeatures = new Set(self.bboxData.features);
          const updatedFeatures = JSONData.features.filter(
            (feature) => !removeFeatures.has(feature),
          );
          JSONData = {
            ...JSONData,
            features: updatedFeatures,
          };
          self.utils.overrideData(JSONData, self);
          self.bboxData.features = [];
        }
      };
      if (
        self.leaflet.getZoom() >= self.config.loadMoreAtZoomLevel &&
        self.hasMoreData
      ) {
        const data = await self.utils.getBBoxData.call(
          self,
          self.JSONParam,
          bounds,
        );
        if (self.type === "netjson") {
          self.config.prepareData.call(this, data);
          const dataNodeSet = new Set(self.data.nodes.map((n) => n.id));
          const sourceLinkSet = new Set(self.data.links.map((l) => l.source));
          const targetLinkSet = new Set(self.data.links.map((l) => l.target));
          const nodes = data.nodes.filter((node) => !dataNodeSet.has(node.id));
          const links = data.links.filter(
            (link) =>
              !sourceLinkSet.has(link.source) &&
              !targetLinkSet.has(link.target),
          );
          const boundsDataSet = new Set(data.nodes.map((n) => n.id));
          const nonCommonNodes = self.bboxData.nodes.filter(
            (node) => !boundsDataSet.has(node.id),
          );
          const removableNodes = new Set(nonCommonNodes.map((n) => n.id));

          JSONData.nodes = JSONData.nodes.filter(
            (node) => !removableNodes.has(node.id),
          );
          self.bboxData.nodes = self.bboxData.nodes.concat(nodes);
          self.bboxData.links = self.bboxData.links.concat(links);
          JSONData = {
            ...JSONData,
            nodes: JSONData.nodes.concat(nodes),
            links: JSONData.links.concat(links),
          };
          self.echarts.setOption(self.utils.generateMapOption(JSONData, self));
          self.data = JSONData;
        } else {
          const dataSet = new Set(self.data.features);
          const features = data.features.filter(
            (feature) => !dataSet.has(feature),
          );
          const boundsDataSet = new Set(data.features);
          const nonCommonFeatures = self.bboxData.features.filter(
            (feature) => !boundsDataSet.has(feature),
          );
          const removableFeatures = new Set(nonCommonFeatures);

          JSONData.features = JSONData.features.filter(
            (feature) => !removableFeatures.has(feature),
          );
          self.bboxData.features = self.bboxData.features.concat(features);
          self.utils.appendData(features, self);
        }
      } else if (self.hasMoreData && self.bboxData.nodes.length > 0) {
        removeBBoxData();
      }
    });

    self.event.emit("onLoad");
    self.event.emit("onReady");
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

    if (self.type === "netjson") {
      const opts = self.utils.generateMapOption(JSONData, self);
      opts.series.forEach((obj, index) => {
        self.echarts.appendData({seriesIndex: index, data: obj.data});
      });
      // modify this.data
      self.utils.mergeData(JSONData, self);
    }

    if (self.type === "geojson") {
      self.data = {
        ...self.data,
        features: self.data.features.concat(JSONData.features),
      };

      self.utils.render();
    }

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
