'use strict';

import NetJSONGraph from "../src/js/netjsongraph.core.js";
import NetJSONGraphUpdate from "../src/js/netjsongraph.update.js";

describe('NetJSONGraph Specification', () => {
  const NetJSONGraphOption = {
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
        restore: {
          show: true,
          title: "Restore view"
        },
        saveAsImage: {
          show: true,
          title: "Save image"
        }
      }
    },
    color: [
      "#d66b30", "#a3c7dd", "#5c9660", "#d66b30"
    ],
  };
  const NetJSONGraphConfig = {
    layout: "force",
    label: {
      show: true,
      color: "#000000",
      position: "top"
    },
    force: {
      gravity: 0.1,
      edgeLength: [20, 60],
      repulsion: 120
    },
    roam: true,
    draggable: true,
    focusNodeAdjacency: true,
    hoverAnimation: true,
    legendHoverLink: true
  };
  const NetJSONGraphLinkStyle = {
    width: 5,
    color: "#999",
    shadowColor: "rgba(0, 0, 0, 0.5)",
    shadowBlur: 10
  }

  test("APIs exist", () => {
    expect(NetJSONGraph).toBeDefined();

    expect(NetJSONGraph.prototype.setConfig).toBeInstanceOf(Function);
    expect(NetJSONGraph.prototype.setUtils).toBeInstanceOf(Function);
  })

  test('NetJSONGraph object attribute fields exist', () => {
    let JSONFILE = "test";
    const graph = new NetJSONGraph(JSONFILE);
    graph.utils = Object.assign(new NetJSONGraphUpdate(), graph.utils);
    graph.setConfig({});

    expect(graph).toBeInstanceOf(NetJSONGraph);

    expect(graph.el).toBeInstanceOf(HTMLElement);
    expect(graph.JSONParam).toBe(JSONFILE);
    expect(graph.config).toBeInstanceOf(Object);
    expect(graph.utils).toBeInstanceOf(Object);
    expect(graph.setConfig).toBeInstanceOf(Function);
    expect(graph.setUtils).toBeInstanceOf(Function);
    expect(graph.render).toBeInstanceOf(Function);
 
    expect(graph.config).toHaveProperty("metadata", true);
    expect(graph.config).toHaveProperty("svgRender", false);

    expect(graph.config.echartsOption).toEqual(NetJSONGraphOption);

    expect(graph.config.graphConfig).toEqual(NetJSONGraphConfig);

    expect(graph.config).toHaveProperty("mapCenter", [0, 0]);
    expect(graph.config).toHaveProperty("mapZoom", 4);
    expect(graph.config).toHaveProperty("mapRoam", true);
    expect(graph.config.mapTileConfig).toEqual([]);
    expect(graph.config.mapLineConfig).toEqual([{}]);
    expect(graph.config.mapNodeConfig).toBeInstanceOf(Object);

    expect(graph.config.nodeSize).toBeDefined();
    expect(graph.config.nodeStyleProperty).toBeInstanceOf(Function);
    expect(graph.config.linkStyleProperty).toBeInstanceOf(Function);
    expect(graph.config.nodeStyleProperty()).toBeInstanceOf(Object);
    expect(graph.config.linkStyleProperty()).toEqual(NetJSONGraphLinkStyle);

    expect(graph.config.onInit).toBeInstanceOf(Function);
    expect(graph.config.onInit.call(graph)).toBe(graph.config);
    expect(graph.config.onLoad).toBeInstanceOf(Function);
    expect(graph.config.onLoad.call(graph)).toBe(graph.config);
    expect(graph.config.prepareData).toBeInstanceOf(Function);
    expect(graph.config.onClickElement).toBeInstanceOf(Function);

    expect(graph.utils.JSONDataUpdate).toBeInstanceOf(Function);
    expect(graph.utils.NetJSONRender).toBeInstanceOf(Function);
    expect(graph.utils.dealDataByWorker).toBeInstanceOf(Function);
    expect(graph.utils.dealDataByWorker).toBeInstanceOf(Function);
    expect(graph.utils.searchElements).toBeInstanceOf(Function);

    expect(graph.utils.NetJSONMetadata).toBeInstanceOf(Function);
    expect(graph.utils.nodeInfo).toBeInstanceOf(Function);
    expect(graph.utils.linkInfo).toBeInstanceOf(Function);
    expect(graph.utils.numberMinDigit).toBeInstanceOf(Function);
    expect(graph.utils.deepMergeObj).toBeInstanceOf(Function);
    expect(graph.utils.isObject).toBeInstanceOf(Function);
    expect(graph.utils.dateParse).toBeInstanceOf(Function);
    expect(graph.utils.JSONParamParse).toBeInstanceOf(Function);
  });
})



