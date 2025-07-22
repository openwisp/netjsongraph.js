import * as echarts from "echarts/core";
import {
  GraphChart,
  EffectScatterChart,
  LinesChart,
  ScatterChart,
} from "echarts/charts";
import {
  TooltipComponent,
  TitleComponent,
  ToolboxComponent,
  LegendComponent,
} from "echarts/components";
import {SVGRenderer} from "echarts/renderers";
import L from "leaflet/dist/leaflet";
import "echarts-gl";
import {addPolygonOverlays} from "./netjsongraph.geojson";

echarts.use([
  GraphChart,
  EffectScatterChart,
  LinesChart,
  TooltipComponent,
  TitleComponent,
  ToolboxComponent,
  LegendComponent,
  SVGRenderer,
  ScatterChart,
]);

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
            lineHeight: 20,
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
          : !params.data.cluster && clickElement("node", params.data.node);
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
  generateMapOption(JSONData, self, clusters = []) {
    const configs = self.config;
    const {nodes, links} = JSONData;
    const flatNodes = JSONData.flatNodes || {};
    const linesData = [];
    let nodesData = [];

    nodes.forEach((node) => {
      if (!node.properties) {
        console.error(`Node ${node.id} position is undefined!`);
      } else {
        const {location} = node.properties;

        if (!location || !location.lng || !location.lat) {
          console.error(`Node ${node.id} position is undefined!`);
        } else {
          const {nodeEmphasisConfig} = self.utils.getNodeStyle(
            node,
            configs,
            "map",
          );

          nodesData.push({
            name: typeof node.label === "string" ? node.label : node.id,
            value: [location.lng, location.lat],
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
        console.warn(`Node ${link.source} does not exist!`);
      } else if (!flatNodes[link.target]) {
        console.warn(`Node ${link.target} does not exist!`);
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

    nodesData = nodesData.concat(clusters);

    const series = [
      {
        type:
          configs.mapOptions.nodeConfig.type === "effectScatter"
            ? "effectScatter"
            : "scatter",
        name: "nodes",
        coordinateSystem: "leaflet",
        data: nodesData,
        animationDuration: 1000,
        label: configs.mapOptions.nodeConfig.label,
        itemStyle: {
          color: (params) => {
            if (
              params.data &&
              params.data.cluster &&
              params.data.itemStyle &&
              params.data.itemStyle.color
            ) {
              return params.data.itemStyle.color;
            }
            if (params.data && params.data.node && params.data.node.category) {
              const category = configs.nodeCategories.find(
                (cat) => cat.name === params.data.node.category,
              );
              const nodeColor =
                (category && category.nodeStyle && category.nodeStyle.color) ||
                (configs.mapOptions.nodeConfig &&
                  configs.mapOptions.nodeConfig.nodeStyle &&
                  configs.mapOptions.nodeConfig.nodeStyle.color) ||
                "#6c757d";
              return nodeColor;
            }
            const defaultColor =
              (configs.mapOptions.nodeConfig &&
                configs.mapOptions.nodeConfig.nodeStyle &&
                configs.mapOptions.nodeConfig.nodeStyle.color) ||
              "#6c757d";
            return defaultColor;
          },
        },
        symbolSize: (value, params) => {
          if (params.data && params.data.cluster) {
            return (
              (configs.mapOptions.clusterConfig &&
                configs.mapOptions.clusterConfig.symbolSize) ||
              30
            );
          }
          if (params.data && params.data.node) {
            const {nodeSizeConfig} = self.utils.getNodeStyle(
              params.data.node,
              configs,
              "map",
            );
            return typeof nodeSizeConfig === "object"
              ? (configs.mapOptions.nodeConfig &&
                  configs.mapOptions.nodeConfig.nodeSize) ||
                  17
              : nodeSizeConfig;
          }
          return (
            (configs.mapOptions.nodeConfig &&
              configs.mapOptions.nodeConfig.nodeSize) ||
            17
          );
        },
        emphasis: configs.mapOptions.nodeConfig.emphasis,
      },
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
      throw new Error(`You must add the tiles via the "mapTileConfig" param!`);
    }
    // Accept both NetJSON and GeoJSON inputs. If GeoJSON is detected,
    // deep-copy it for polygon overlays and convert the working copy to
    // NetJSON so the rest of the pipeline can operate uniformly.
    if (self.utils.isGeoJSON(JSONData)) {
      self.originalGeoJSON = JSON.parse(JSON.stringify(JSONData));
      JSONData = self.utils.geojsonToNetjson(JSONData);
      // From this point forward we treat the data as NetJSON internally,
      // but keep the public-facing `type` value unchanged ("geojson").
    }

    const initialMapOptions = self.utils.generateMapOption(JSONData, self);
    self.utils.echartsSetOption(initialMapOptions, self);
    self.bboxData = {
      nodes: [],
      links: [],
    };

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

    // Render Polygon and MultiPolygon features from the original GeoJSON data.
    // While nodes (Points) and links (LineStrings) are handled by ECharts,
    // polygon features are rendered directly onto the Leaflet map using
    // a separate L.geoJSON layer. This allows for displaying geographical
    // areas like parks or districts alongside the network topology.
    if (self.originalGeoJSON) {
      addPolygonOverlays(self);
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
      const currentZoom = self.leaflet.getZoom();
      self.echarts.setOption({
        series: [
          {
            label: {
              show: currentZoom >= self.config.showLabelsAtZoomLevel,
            },
          },
        ],
      });

      // Zoom in/out buttons disabled only when it is equal to min/max zoomlevel
      // Manually handle zoom control state to ensure correct behavior with float zoom levels
      const minZoom = self.leaflet.getMinZoom();
      const maxZoom = self.leaflet.getMaxZoom();
      const zoomIn = document.querySelector(".leaflet-control-zoom-in");
      const zoomOut = document.querySelector(".leaflet-control-zoom-out");

      if (zoomIn && zoomOut) {
        if (Math.round(currentZoom) >= maxZoom) {
          zoomIn.classList.add("leaflet-disabled");
        } else {
          zoomIn.classList.remove("leaflet-disabled");
        }

        if (Math.round(currentZoom) <= minZoom) {
          zoomOut.classList.add("leaflet-disabled");
        } else {
          zoomOut.classList.remove("leaflet-disabled");
        }
      }
    });

    self.leaflet.on("moveend", async () => {
      const bounds = self.leaflet.getBounds();
      const removeBBoxData = () => {
        const removeNodes = new Set(self.bboxData.nodes);
        const removeLinks = new Set(self.bboxData.links);

        JSONData = {
          ...JSONData,
          nodes: JSONData.nodes.filter((node) => !removeNodes.has(node)),
          links: JSONData.links.filter((link) => !removeLinks.has(link)),
        };

        self.data = JSONData;
        self.echarts.setOption(self.utils.generateMapOption(JSONData, self));
        self.bboxData.nodes = [];
        self.bboxData.links = [];
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
        self.config.prepareData.call(self, data);
        const dataNodeSet = new Set(self.data.nodes.map((n) => n.id));
        const sourceLinkSet = new Set(self.data.links.map((l) => l.source));
        const targetLinkSet = new Set(self.data.links.map((l) => l.target));
        const nodes = data.nodes.filter((node) => !dataNodeSet.has(node.id));
        const links = data.links.filter(
          (link) =>
            !sourceLinkSet.has(link.source) && !targetLinkSet.has(link.target),
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
      } else if (self.hasMoreData && self.bboxData.nodes.length > 0) {
        removeBBoxData();
      }
    });
    if (
      self.config.clustering &&
      self.config.clusteringThreshold < JSONData.nodes.length
    ) {
      let {clusters, nonClusterNodes, nonClusterLinks} =
        self.utils.makeCluster(self);

      // Only show clusters if we're below the disableClusteringAtLevel
      if (self.leaflet.getZoom() > self.config.disableClusteringAtLevel) {
        clusters = [];
        nonClusterNodes = JSONData.nodes;
        nonClusterLinks = JSONData.links;
      }

      self.echarts.setOption(
        self.utils.generateMapOption(
          {
            ...JSONData,
            nodes: nonClusterNodes,
            links: nonClusterLinks,
          },
          self,
          clusters,
        ),
      );

      self.echarts.on("click", (params) => {
        if (
          (params.componentSubType === "scatter" ||
            params.componentSubType === "effectScatter") &&
          params.data.cluster
        ) {
          // Zoom into the clicked cluster instead of expanding it
          const currentZoom = self.leaflet.getZoom();
          const targetZoom = Math.min(
            currentZoom + 2,
            self.leaflet.getMaxZoom(),
          );
          self.leaflet.setView(
            [params.data.value[1], params.data.value[0]],
            targetZoom,
          );
        }
      });

      // Ensure zoom handler consistently applies the same clustering logic
      self.leaflet.on("zoomend", () => {
        if (self.leaflet.getZoom() < self.config.disableClusteringAtLevel) {
          const nodeData = self.utils.makeCluster(self);
          clusters = nodeData.clusters;
          nonClusterNodes = nodeData.nonClusterNodes;
          nonClusterLinks = nodeData.nonClusterLinks;
          self.echarts.setOption(
            self.utils.generateMapOption(
              {
                ...JSONData,
                nodes: nonClusterNodes,
                links: nonClusterLinks,
              },
              self,
              clusters,
            ),
          );
        } else {
          // When above the threshold, show all nodes without clustering
          self.echarts.setOption(self.utils.generateMapOption(JSONData, self));
        }
      });
    }

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
      throw new Error("AppendData function can only be used for map render!");
    }

    if (self.config.render === self.utils.mapRender) {
      const opts = self.utils.generateMapOption(JSONData, self);
      opts.series.forEach((obj, index) => {
        self.echarts.appendData({seriesIndex: index, data: obj.data});
      });
      // modify this.data
      self.utils.mergeData(JSONData, self);
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

    // Ensure nodes are unique by ID using the utility function
    if (self.data.nodes && self.data.nodes.length > 0) {
      self.data.nodes = self.utils.deduplicateNodesById(self.data.nodes);
    }

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
    // Ensure incoming nodes array exists
    if (!JSONData.nodes) {
      JSONData.nodes = [];
    }

    // Create a set of existing node IDs for efficient lookup
    const existingNodeIds = new Set();
    self.data.nodes.forEach((node) => {
      if (node.id) {
        existingNodeIds.add(node.id);
      }
    });

    // Filter incoming nodes: keep nodes without IDs or with new IDs
    const newNodes = JSONData.nodes.filter((node) => {
      if (!node.id) {
        return true;
      }
      if (existingNodeIds.has(node.id)) {
        console.warn(
          `Duplicate node ID ${node.id} detected during merge and skipped.`,
        );
        return false;
      }
      return true;
    });

    const nodes = self.data.nodes.concat(newNodes);
    // Ensure incoming links array exists
    const incomingLinks = JSONData.links || [];
    const links = self.data.links.concat(incomingLinks);

    Object.assign(self.data, JSONData, {
      nodes,
      links,
    });
  }
}

export {NetJSONGraphRender, echarts, L};
