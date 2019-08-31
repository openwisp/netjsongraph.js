'use strict';

import NetJSONGraph from "../src/js/netjsongraph.core.js";

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
    focusNodeAdjacency: false,
    hoverAnimation: true,
    legendHoverLink: true
  };
  const NetJSONGraphLinkStyle = {
    width: 5,
    color: "#999",
    shadowColor: "rgba(0, 0, 0, 0.5)",
    shadowBlur: 10,
  }

  test("APIs exist", () => {
    expect(NetJSONGraph).toBeDefined();

    expect(NetJSONGraph.prototype.setConfig).toBeInstanceOf(Function);
    expect(NetJSONGraph.prototype.setUtils).toBeInstanceOf(Function);
  })

  test('NetJSONGraph object attribute fields exist', () => {
    let JSONFILE = "test";

    const graph = new NetJSONGraph(JSONFILE);
    // Package NetJSONGraph instance object.
    graph.event = graph.utils.createEvent();
    graph.setConfig({
      onInit: function() {
        return this.config;
      },
      onRender: function() {
        return this.config;
      },
      onUpdate: function() {
        return this.config;
      },
      afterUpdate: function() {
        return this.config;
      },
      onLoad: function() {
        return this.config;
      },
    });

    expect(graph).toBeInstanceOf(NetJSONGraph);
    
    // NetJSON Props
    expect(graph.el).toBeInstanceOf(HTMLElement);
    expect(graph.JSONParam).toEqual([JSONFILE,]);
    expect(graph.config).toBeInstanceOf(Object);
    expect(graph.utils).toBeInstanceOf(Object);
    expect(graph.setConfig).toBeInstanceOf(Function);
    expect(graph.setUtils).toBeInstanceOf(Function);
    expect(graph.render).toBeInstanceOf(Function);
    expect(graph.event).toBeInstanceOf(Object);
 
    // NetJSON Config
    expect(graph.config).toHaveProperty("metadata", true);
    expect(graph.config).toHaveProperty("svgRender", false);

    expect(graph.config.echartsOption).toEqual(NetJSONGraphOption);

    expect(graph.config.graphConfig).toEqual(NetJSONGraphConfig);

    expect(graph.config.mapOptions).toEqual({
      roam: true,
    });
    expect(graph.config.mapTileConfig).toEqual([]);
    expect(graph.config.mapLinkConfig).toEqual([{}]);
    expect(graph.config.mapNodeConfig).toBeInstanceOf(Object);

    expect(graph.config.nodeSize).toBeDefined();
    expect(graph.config.nodeStyleProperty).toBeInstanceOf(Function);
    expect(graph.config.linkStyleProperty).toBeInstanceOf(Function);
    expect(graph.config.nodeStyleProperty()).toBeInstanceOf(Object);
    expect(graph.config.linkStyleProperty()).toEqual(NetJSONGraphLinkStyle);

    expect(graph.config.onInit).toBeInstanceOf(Function);
    expect(graph.config.onInit.call(graph)).toBe(graph.config);
    expect(graph.config.onRender).toBeInstanceOf(Function);
    expect(graph.config.onRender.call(graph)).toBe(graph.config);
    expect(graph.config.onUpdate).toBeInstanceOf(Function);
    expect(graph.config.onUpdate.call(graph)).toBe(graph.config);
    expect(graph.config.afterUpdate).toBeInstanceOf(Function);
    expect(graph.config.afterUpdate.call(graph)).toBe(graph.config);
    expect(graph.config.onLoad).toBeInstanceOf(Function);
    expect(graph.config.onLoad.call(graph)).toBe(graph.config);
    expect(graph.config.prepareData).toBeInstanceOf(Function);
    expect(graph.config.onClickElement).toBeInstanceOf(Function);

    // NetJSON Update
    expect(graph.utils.JSONDataUpdate).toBeInstanceOf(Function);
    expect(graph.utils.dealDataByWorker).toBeInstanceOf(Function);
    expect(graph.utils.searchElements).toBeInstanceOf(Function);

    // NetJSON Utils
    expect(graph.utils.NetJSONMetadata).toBeInstanceOf(Function);
    expect(graph.utils.updateMetadata).toBeInstanceOf(Function);
    expect(graph.utils.nodeInfo).toBeInstanceOf(Function);
    expect(graph.utils.linkInfo).toBeInstanceOf(Function);
    expect(graph.utils.deepMergeObj).toBeInstanceOf(Function);
    expect(graph.utils.isObject).toBeInstanceOf(Function);
    expect(graph.utils.isArray).toBeInstanceOf(Function);
    expect(graph.utils.isElement).toBeInstanceOf(Function);
    expect(graph.utils.dateParse).toBeInstanceOf(Function);
    expect(graph.utils.JSONParamParse).toBeInstanceOf(Function);
    expect(graph.utils.showLoading).toBeInstanceOf(Function);
    expect(graph.utils.hideLoading).toBeInstanceOf(Function);
    expect(graph.utils.createEvent).toBeInstanceOf(Function);
    expect(graph.utils.numberMinDigit).toBeInstanceOf(Function);
  });
})



