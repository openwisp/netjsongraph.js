import NetJSONGraph from "../src/js/netjsongraph.core";

describe("NetJSONGraph Specification", () => {
  const NetJSONGraphOption = {
    aria: {
      show: true,
      description:
        "This is a force-oriented graph chart that depicts the relationship between ip nodes.",
    },
    toolbox: {
      show: true,
      iconStyle: {
        borderColor: "#fff",
      },
      feature: {
        restore: {
          show: true,
          title: "Restore view",
        },
        saveAsImage: {
          show: true,
          title: "Save image",
        },
      },
    },
  };
  const NetJSONGraphConfig = {
    series: {
      layout: "force",
      label: {
        show: true,
        color: "#fff",
        position: "top",
      },
      labelLayout: {
        hideOverlap: true,
      },
      force: {
        gravity: 0.1,
        edgeLength: [20, 60],
        repulsion: 120,
      },
      roam: true,
      draggable: true,
      legendHoverLink: true,
      emphasis: {
        focus: "none",
        lineStyle: {
          color: "#3acc38",
          opacity: 1,
        },
      },
      nodeStyle: {
        color: "#ffebc4",
      },
      linkStyle: {
        width: 6,
        color: "#1ba619",
      },
      nodeSize: "15",
    },
    baseOptions: {
      backgroundColor: "#282222",
      media: [
        {
          query: {
            minWidth: 320,
            maxWidth: 500,
          },
          option: {
            series: [
              {
                zoom: 0.7,
              },
            ],
            toolbox: {
              itemSize: 18,
            },
          },
        },
        {
          query: {
            minWidth: 501,
          },
          option: {
            series: [
              {
                zoom: 1,
              },
            ],
            toolbox: {
              itemSize: 15,
            },
          },
        },
        {
          query: {
            minWidth: 320,
            maxWidth: 850,
          },
          option: {
            tooltip: {
              show: false,
            },
          },
        },
        {
          query: {
            minWidth: 851,
          },
          option: {
            tooltip: {
              show: true,
            },
          },
        },
      ],
    },
  };
  const NetJSONGraphMapOptions = {
    roam: true,
    zoomAnimation: false,
    nodeConfig: {
      type: "scatter",
      label: {
        show: true,
        color: "#000000",
        position: "top",
        formatter: "{b}",
      },
      nodeStyle: {
        color: "#1566a9",
      },
      nodeSize: "17",
    },
    linkConfig: {
      linkStyle: {
        width: 5,
        color: "#1ba619",
      },
      emphasis: {
        focus: "none",
        lineStyle: {
          color: "#3acc38",
          opacity: 1,
        },
      },
    },
    baseOptions: {
      toolbox: {
        show: false,
      },
      media: [
        {
          query: {
            minWidth: 320,
            maxWidth: 850,
          },
          option: {
            tooltip: {
              show: false,
            },
          },
        },
        {
          query: {
            minWidth: 851,
          },
          option: {
            tooltip: {
              show: true,
            },
          },
        },
      ],
    },
  };

  test("APIs exist", () => {
    expect(NetJSONGraph).toBeDefined();

    expect(NetJSONGraph.prototype.setConfig).toBeInstanceOf(Function);
    expect(NetJSONGraph.prototype.setUtils).toBeInstanceOf(Function);
  });

  test("NetJSONGraph object attribute fields exist", () => {
    const JSONFILE = "test";

    const graph = new NetJSONGraph(JSONFILE);
    // Package NetJSONGraph instance object.
    graph.event = graph.utils.createEvent();
    graph.setConfig({
      onInit() {
        return this.config;
      },
      onRender() {
        return this.config;
      },
      onUpdate() {
        return this.config;
      },
      afterUpdate() {
        return this.config;
      },
      onLoad() {
        return this.config;
      },
    });

    expect(graph).toBeInstanceOf(NetJSONGraph);

    // NetJSON Props
    expect(graph.el).toBeInstanceOf(HTMLElement);
    expect(graph.JSONParam).toEqual([JSONFILE]);
    expect(graph.config).toBeInstanceOf(Object);
    expect(graph.utils).toBeInstanceOf(Object);
    expect(graph.setConfig).toBeInstanceOf(Function);
    expect(graph.setUtils).toBeInstanceOf(Function);
    expect(graph.render).toBeInstanceOf(Function);
    expect(graph.event).toBeInstanceOf(Object);

    // NetJSON Config
    expect(graph.config).toHaveProperty("metadata", true);
    expect(graph.config).toHaveProperty("svgRender", false);
    expect(graph.config).toHaveProperty("showMetaOnNarrowScreens", false);
    expect(graph.config.echartsOption).toEqual(NetJSONGraphOption);
    expect(graph.config.graphConfig).toEqual(NetJSONGraphConfig);
    expect(graph.config.mapOptions).toEqual(NetJSONGraphMapOptions);
    expect(graph.config.mapTileConfig).toEqual([
      {
        urlTemplate:
          "https://tiles.stadiamaps.com/tiles/outdoors/{z}/{x}/{y}{r}.png",
        options: {
          minZoom: 3,
          maxZoom: 32,
          attribution:
            '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors',
        },
      },
    ]);
    expect(graph.config.mapOptions.nodeConfig).toBeInstanceOf(Object);
    expect(graph.config.mapOptions.linkConfig).toBeInstanceOf(Object);
    expect(graph.config.geoOptions).toBeInstanceOf(Object);
    expect(graph.config.geoOptions).toEqual({
      style: {
        fillColor: "#1566a9",
        weight: 0,
        fillOpacity: 0.8,
        radius: 8,
      },
    });
    expect(graph.config.nodeCategories).toEqual([]);
    expect(graph.config.linkCategories).toEqual([]);
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
    expect(graph.config.onReady).toBeInstanceOf(Function);
    expect(graph.config.prepareData).toBeInstanceOf(Function);
    expect(graph.config.onClickElement).toBeInstanceOf(Function);

    // NetJSON Update
    expect(graph.utils.JSONDataUpdate).toBeInstanceOf(Function);
    expect(graph.utils.dealDataByWorker).toBeInstanceOf(Function);
    expect(graph.utils.searchElements).toBeInstanceOf(Function);

    // NetJSON Utils
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
    expect(graph.utils.generateStyle).toBeInstanceOf(Function);
    expect(graph.utils.getLinkStyle).toBeInstanceOf(Function);
    expect(graph.utils.getMetadata).toBeInstanceOf(Function);
    expect(graph.utils.getNodeStyle).toBeInstanceOf(Function);
    expect(graph.utils.createTooltipItem).toBeInstanceOf(Function);
    expect(graph.utils.getNodeTooltipInfo).toBeInstanceOf(Function);
    expect(graph.utils.getLinkTooltipInfo).toBeInstanceOf(Function);
  });
});
