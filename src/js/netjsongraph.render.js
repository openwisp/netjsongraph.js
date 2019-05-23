"use strict";

import * as echarts from "echarts/lib/echarts";
import "echarts/lib/chart/graph";
import "echarts/lib/component/tooltip";
import "echarts/lib/component/title";
import "echarts/lib/component/toolbox";
import "zrender/lib/svg/svg";

import "../../lib/js/leaflet.min.js";
import "../../lib/js/leaflet-mapDownload.js";
import "../../lib/js/leaflet-draw.js";

const RenderCache = {
  netjsonmap: null,
  viewIndoormap: false,
  leafLeyLayers: null
};

/**
 * @function
 * @name graphRender
 *
 * Render the final graph result based on JSONData.
 * @param  {object}  graphContainer  DOM
 * @param  {object}  JSONData        Render dependent configuration
 * @param  {object}  _this           NetJSONGraph object
 *
 * @return {object}  graph object
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
        typeof configs.circleRadius === "function"
          ? configs.circleRadius(node)
          : configs.circleRadius;
      nodeResult.name = node.name || node.id;
      nodeResult.value = node.value || node.name;
      if (node.category) {
        nodeResult.category = String(node.category);
      }
      if (categories.indexOf(node.category) === -1) {
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
    options = {
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
          // dataView:{
          //     show:true
          // },
          restore: {
            show: true
          },
          saveAsImage: {
            show: true
          }
        }
      },
      tooltip: {
        confine: true,
        formatter: (params, ticket, callback) =>
          params.dataType === "edge"
            ? _this.utils.linkInfo(params.data)
            : _this.utils.nodeInfo(params.data)
      },
      legend: {
        data: categories
      },
      series: [
        {
          type: "graph",
          name: "NetGraph Demo",
          layout: "force",
          cursor: "pointer",
          label: {
            show: true,
            color: "#000000",
            offset: [configs.labelDx, configs.labelDy]
          },
          force: {
            initLayout: "circular",
            repulsion: configs.repulsion,
            gravity: configs.gravity,
            edgeLength: configs.edgeLength
          },
          roam: true,
          draggable: true,
          focusNodeAdjacency: true,
          nodes,
          links,
          categories: categories.map(category => ({ name: category }))
        }
      ]
    },
    graph = echarts.init(graphContainer, null, {
      renderer: configs.svgRender ? "svg" : "canvas"
    });

  graph.setOption(options);
  graph.on(
    "mouseup",
    function(params) {
      if (params.componentType === "series" && params.seriesType === "graph") {
        if (params.dataType === "edge") {
          configs.onClickLink.call(_this, params.data);
        } else {
          configs.onClickNode.call(_this, params.data);
        }
      }
    },
    { passive: true }
  );
  window.onresize = () => {
    graph.resize();
  };

  return graph;
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
 * @return {object}  map object
 */
function mapRender(mapContainer, JSONData, _this) {
  if (!RenderCache.netjsonmap) {
    RenderCache.netjsonmap = L.map(mapContainer, {
      renderer: _this.config.svgRender ? L.svg() : L.canvas()
    }).setView([42.168, 260.536], 8);
  } else {
    RenderCache.netjsonmap = L.map(mapContainer, {
      renderer: _this.config.svgRender ? L.svg() : L.canvas()
    }).setView(
      RenderCache.netjsonmap.getCenter(),
      RenderCache.netjsonmap.getZoom()
    );
  }

  let map = RenderCache.netjsonmap,
    editableLayers = new L.FeatureGroup(),
    MyCustomMarker = L.Icon.extend({
      options: {
        shadowUrl: null,
        iconAnchor: new L.Point(12, 12),
        iconUrl: "../lib/images/marker-icon.png"
      }
    }),
    options = {
      position: "topleft",
      draw: {
        polyline: {
          shapeOptions: {
            color: "#f357a1",
            weight: 3
          }
        },
        polygon: {
          allowIntersection: false, // Restricts shapes to simple polygons
          drawError: {
            color: "#e1e100", // Color the shape will turn when intersects
            message: "<strong>Oh snap!<strong> you can't draw that!" // Message that will show when intersect
          },
          shapeOptions: {
            color: "#bada55"
          }
        },
        circle: true, // Turns off this drawing tool
        rectangle: {
          shapeOptions: {
            clickable: false
          }
        },
        marker: {
          icon: new MyCustomMarker()
        }
      },
      edit: {
        featureGroup: editableLayers, //REQUIRED!!
        remove: true
      }
    };

  map.addLayer(editableLayers);
  map.addControl(new L.Control.Draw(options));
  map.on(L.Draw.Event.CREATED, function(e) {
    var type = e.layerType,
      layer = e.layer;

    if (type === "marker") {
      layer.bindPopup("A popup!");
    }

    editableLayers.addLayer(layer);
  });

  L.easyPrint({
    title: "Awesome print button",
    position: "bottomleft",
    exportOnly: true,
    sizeModes: ["Current", "A4Portrait", "A4Landscape"]
  }).addTo(map);

  if (!RenderCache.viewIndoormap) {
    const nodeElements = [],
      linkElements = [],
      drawElements = [];
    let { nodes, links } = JSONData,
      flatNodes = {};
    if (JSONData.flatNodes) {
      flatNodes = JSONData.flatNodes;
    } else {
      nodes.map(node => {
        flatNodes[node.id] = JSON.parse(JSON.stringify(node));
      });
    }

    let configs = _this.config;

    RenderCache.leafLeyLayers = [];
    RenderCache.leafLeyLayers.push(
      L.tileLayer(
        "https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}",
        {
          attribution:
            'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
          maxZoom: configs.scaleExtent[1],
          id: "mapbox.streets",
          accessToken:
            "pk.eyJ1Ijoia3V0dWd1IiwiYSI6ImNqdHpnb2hqMjM0OG40OHBjbmN3azV1b2UifQ.PBk9TefuYkZlK8SweLAebA"
        }
      ).addTo(map)
    );

    for (let node_id in flatNodes) {
      if (flatNodes[node_id].location) {
        let { location, ...res } = flatNodes[node_id];
        nodeElements.push(
          L.circleMarker(
            [location.lng, location.lat],
            Object.assign(
              {
                radius:
                  typeof configs.circleRadius === "function"
                    ? configs.circleRadius(flatNodes[node_id])
                    : configs.circleRadius
              },
              typeof configs.nodeStyleProperty === "function"
                ? configs.nodeStyleProperty(flatNodes[node_id])
                : configs.nodeStyleProperty,
              { params: JSON.parse(JSON.stringify(res)) }
            )
          ).bindTooltip(_this.utils.nodeInfo(res))
        );
      }
    }
    for (let link of links) {
      if (flatNodes[link.source] && flatNodes[link.target]) {
        linkElements.push(
          L.polyline(
            [
              [
                flatNodes[link.source].location.lng,
                flatNodes[link.source].location.lat
              ],
              [
                flatNodes[link.target].location.lng,
                flatNodes[link.target].location.lat
              ]
            ],
            Object.assign(
              typeof configs.linkStyleProperty === "function"
                ? configs.linkStyleProperty(link)
                : configs.linkStyleProperty,
              { params: JSON.parse(JSON.stringify(link)) }
            )
          ).bindTooltip(_this.utils.linkInfo(link))
        );
      }
    }
    drawElements.push(
      L.featureGroup(nodeElements).on("click", function(e) {
        map.setView([e.latlng.lat, e.latlng.lng], map.getMaxZoom());
        configs.onClickNode.call(_this, e.layer.options.params);
      })
    );
    drawElements.push(
      L.featureGroup(linkElements).on("click", function(e) {
        map.setView([e.latlng.lat, e.latlng.lng]);
        configs.onClickLink.call(_this, e.layer.options.params);
      })
    );
    L.featureGroup(drawElements).addTo(map);
  }
  viewInputImage(map, _this);

  return map;
}

/**
 * @function
 * @name viewInputImage
 *
 * Add Input to upload indoormap image.
 *
 * @param  {object}   netjsonmap
 * @param  {object}   _this           NetJSONGraph object
 *
 * @return {object}   input DOM
 */

function viewInputImage(netjsonmap, _this) {
  let imgInput = document.getElementById("njg-indoorImgInput");
  if (RenderCache.viewIndoormap) {
    presentIndoormap(imgInput.files[0]);
  } else if (!imgInput) {
    imgInput = document.createElement("input");
    imgInput.setAttribute("type", "file");
    imgInput.setAttribute("accept", "image/*");
    imgInput.setAttribute("id", "njg-indoorImgInput");
    _this.el.appendChild(imgInput);
  }
  imgInput.onchange = e => {
    presentIndoormap(e.target.files[0]);
  };

  return imgInput;

  function presentIndoormap(img) {
    let readImg = new FileReader(),
      tempImage = new Image();
    readImg.readAsDataURL(img);
    readImg.onload = e => {
      tempImage.src = e.target.result;
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
        for (let layer of RenderCache.leafLeyLayers) {
          netjsonmap.removeLayer(layer);
        }
        RenderCache.leafLeyLayers.push(
          L.imageOverlay(tempImage.src, bounds).addTo(netjsonmap)
        );
        RenderCache.viewIndoormap = true;
      };
    };
  }
}

window.graphRender = graphRender;
window.mapRender = mapRender;
