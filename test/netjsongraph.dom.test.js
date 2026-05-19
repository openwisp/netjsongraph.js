import "@testing-library/jest-dom";
import NetJSONGraphCore from "../src/js/netjsongraph.core";
import NetJSONGraphGUI from "../src/js/netjsongraph.gui";

const graph = new NetJSONGraphCore({
  type: "NetworkGraph",
  label: "Ninux Roma",
  protocol: "OLSR",
  version: "0.6.6.2",
  metric: "ETX",
  nodes: [],
  links: [],
});

// Package NetJSONGraphCore instance object.
graph.event = graph.utils.createEvent();
graph.gui = new NetJSONGraphGUI(graph);
graph.setConfig({
  onRender() {
    return this.config;
  },
  onLoad() {
    return this.config;
  },
  showMetaOnNarrowScreens: true,
});
graph.setUtils();
graph.render();

describe("Test netjsongraph utils dom functions", () => {
  const loadingData = new Map([
    [
      // key
      [],
      // value
      HTMLDivElement,
    ],
  ]);

  const utilsDOMObj = {
    "Display loading animation": ["showLoading", loadingData],
    "Cancel loading animation": ["hideLoading", loadingData],
  };

  Object.keys(utilsDOMObj).forEach((operationText) => {
    test("Hide loading -- no dom", () => {
      graph.utils.hideLoading.call(graph);
    });
    test(operationText, () => {
      const [operationFunc, operationDataMap] = utilsDOMObj[operationText];
      operationDataMap.forEach((value, key) => {
        expect(graph.utils[operationFunc].call(graph, ...key)).toBeInstanceOf(value);
      });
    });
    test("Show loading again", () => {
      graph.utils.showLoading.call(graph);
    });
  });

  test("Create a tooltip item", () => {
    const toolTipItem = `<div class="njg-tooltip-item"><span class="njg-tooltip-key">test</span><span class="njg-tooltip-value">test</span></div>`;

    expect(graph.utils.createTooltipItem("test", "test")).toBeInstanceOf(HTMLElement);
    expect(graph.utils.createTooltipItem("test", "test").outerHTML).toEqual(
      toolTipItem,
    );
  });

  test("Create a tooltip element for node info ", () => {
    const node = {
      label: "test",
      id: "22",
      properties: {
        name: "Node",
        color: "red",
        location: {
          lng: 0,
          lat: 0,
        },
        time: "2019-04-03T05:06:54.000Z",
      },
      linkCount: 1,
      local_addresses: ["192.168.0.01", "192.168.0.02", "192.168.0.03"],
    };

    expect(graph.utils.getNodeTooltipInfo(node)).toBeInstanceOf(HTMLElement);
    expect(graph.utils.getNodeTooltipInfo(node).innerHTML).toContain(
      "id",
      "label",
      "links",
      "location",
      "localAddresses",
      "name",
      "time",
    );
    expect(graph.utils.getNodeTooltipInfo(node).innerHTML).toContain(
      "22",
      "test",
      "1",
      "0",
      "0",
      "Node",
      "192.168.0.01",
      "192.168.0.02",
      "192.168.0.03",
      "2019.04.03 .5:06:54.000",
    );
  });

  test("Create a tooltip element for link info ", () => {
    const link = {
      source: "192.168.0.01",
      target: "192.168.1.01",
      cost: "1.000",
      properties: {
        name: "Link",
        color: "blue",
        time: "2019-04-03T05:06:54.000Z",
      },
    };
    expect(graph.utils.getLinkTooltipInfo(link)).toBeInstanceOf(HTMLElement);
    expect(graph.utils.getLinkTooltipInfo(link).innerHTML).toContain(
      "source",
      "target",
      "cost",
      "name",
      "color",
      "time",
    );
    expect(graph.utils.getLinkTooltipInfo(link).innerHTML).toContain(
      "192.168.0.01",
      "192.168.1.01",
      "1.000",
      "Link",
      "2019.04.03 .5:06:54.000",
    );
  });
});

describe("Test netjsongraph gui", () => {
  beforeEach(() => {
    graph.gui = new NetJSONGraphGUI(graph);
  });

  afterEach(() => {
    graph.gui = null;
  });

  test("Creating a gui instance", () => {
    expect(graph.gui.self).toEqual(graph);
    expect(graph.gui.renderModeSelector).toBe(null);
    expect(graph.gui.controls).toBe(null);
    expect(graph.gui.sideBar).toBe(null);
    expect(graph.gui.metaInfoContainer).toBe(null);
    expect(graph.gui.nodeLinkInfoContainer).toBe(null);
  });

  test("Create a controls container", () => {
    const controls = '<div class="njg-controls"></div>';
    expect(graph.gui.createControls).toBeInstanceOf(Function);
    expect(graph.gui.createControls()).toBeInstanceOf(HTMLElement);
    expect(graph.el).toContainElement(graph.gui.createControls());
    expect(graph.gui.createControls().outerHTML).toEqual(controls);
  });

  test("Create a render mode selector button", () => {
    const button =
      '<div class="njg-selectIcon"><span class="iconfont icon-eye"></span></div>';
    const controls = graph.gui.createControls();
    graph.gui.controls = controls;
    expect(graph.gui.createRenderModeSelector).toBeInstanceOf(Function);
    expect(graph.gui.createRenderModeSelector()).toBeInstanceOf(HTMLElement);
    expect(graph.el).toContainElement(graph.gui.createRenderModeSelector());
    expect(graph.gui.controls).toContainElement(graph.gui.createRenderModeSelector());
    expect(graph.gui.createRenderModeSelector().outerHTML).toEqual(button);
  });

  test("Create a side bar", () => {
    const sidebar =
      '<div class="njg-sideBar hidden"><button class="sideBarHandle"></button></div>';
    expect(graph.gui.createSideBar).toBeInstanceOf(Function);
    expect(graph.gui.createSideBar()).toBeInstanceOf(HTMLElement);
    expect(graph.el).toContainElement(graph.gui.createSideBar());
    expect(graph.gui.createSideBar().outerHTML).toEqual(sidebar);
  });

  test("Create a container for node and link info", () => {
    const container =
      '<div class="njg-nodeLinkInfoContainer" style="display: none;"></div>';
    graph.gui.sideBar = graph.gui.createSideBar();
    expect(graph.gui.createNodeLinkInfoContainer).toBeInstanceOf(Function);
    expect(graph.gui.createNodeLinkInfoContainer()).toBeInTheDocument(HTMLElement);
    expect(graph.el).toContainElement(graph.gui.createNodeLinkInfoContainer());
    expect(graph.gui.sideBar).toContainElement(graph.gui.createNodeLinkInfoContainer());
    expect(graph.gui.createNodeLinkInfoContainer().outerHTML).toEqual(container);
  });

  test("Create a container for meta data", () => {
    const container =
      '<div class="njg-metaInfoContainer"><h2>Info<span class="njg-closeButton"> ✕</span></h2><div class="njg-metaData"></div></div>';
    graph.gui.sideBar = graph.gui.createSideBar();
    expect(graph.gui.nodeLinkInfoContainer).toBe(null);
    expect(graph.gui.createMetaInfoContainer).toBeInstanceOf(Function);
    expect(graph.gui.createMetaInfoContainer()).toBeInstanceOf(HTMLElement);
    expect(graph.el).toContainElement(graph.gui.createMetaInfoContainer());
    expect(graph.gui.sideBar).toContainElement(graph.gui.createMetaInfoContainer());
    expect(graph.gui.createMetaInfoContainer().outerHTML).toEqual(container);

    graph.gui.metaInfoContainer = graph.gui.createMetaInfoContainer();
    const closeBtn = document.querySelector(".njg-metaInfoContainer .njg-closeButton");
    closeBtn.click();
    expect(graph.gui.metaInfoContainer.style.display).toEqual("none");
    expect(graph.gui.nodeLinkInfoContainer).not.toBe(null);
  });

  test("Display node and link data", () => {
    const nodeData = {
      id: 0,
      label: "test",
      links: 1,
      location: {
        lng: 0,
        lat: 0,
      },
      localAddresses: ["192.168.0.01", "192.168.0.02", "192.168.0.03"],
      name: "Node",
    };

    graph.gui.sideBar = graph.gui.createSideBar();
    graph.gui.nodeLinkInfoContainer = graph.gui.createNodeLinkInfoContainer();
    expect(graph.gui.getNodeLinkInfo).toBeInstanceOf(Function);
    expect(graph.gui.nodeLinkInfoContainer).not.toBe(null);
    graph.gui.getNodeLinkInfo("node", nodeData);

    const infoContainer = document.querySelector(".njg-infoContainer");
    const header = document.querySelector(".njg-headerContainer");
    expect(graph.gui.nodeLinkInfoContainer).toContainElement(infoContainer);
    expect(graph.gui.nodeLinkInfoContainer).toContainElement(header);
    expect(header.innerHTML).toContain("node");
    expect(header).toContainElement(
      document.querySelector(".njg-headerContainer .njg-closeButton"),
    );
    expect(infoContainer.innerHTML).toContain(
      "id",
      "label",
      "links",
      "location",
      "localAddresses",
      "name",
    );
    expect(infoContainer.innerHTML).toContain(
      "0",
      "test",
      "1",
      "0",
      "0",
      "Node",
      "192.168.0.01",
      "192.168.0.02",
      "192.168.0.03",
    );
  });

  test("GUI shows Clients number and Client [i] entries", () => {
    const nodeData = {
      id: "B",
      label: "Node B",
      clients: [{mac: "aa"}, {mac: "bb"}],
    };

    graph.gui.sideBar = graph.gui.createSideBar();
    graph.gui.nodeLinkInfoContainer = graph.gui.createNodeLinkInfoContainer();
    const nodeInfo = graph.utils.nodeInfo(nodeData);
    graph.gui.getNodeLinkInfo("node", nodeInfo);

    const infoContainer = document.querySelector(".njg-infoContainer");
    expect(infoContainer.innerHTML).toContain("Clients");
    expect(infoContainer.innerHTML).toContain("Client [1]");
    expect(infoContainer.innerHTML).toContain("Client [2]");
  });

  test("GUI hides Clients when total is zero and renders empty arrays", () => {
    const nodeData = {
      id: "Z",
      label: "Node Z",
      clients: 0,
      properties: {tags: []},
    };
    graph.gui.sideBar = graph.gui.createSideBar();
    graph.gui.nodeLinkInfoContainer = graph.gui.createNodeLinkInfoContainer();
    const nodeInfo = graph.utils.nodeInfo(nodeData);
    graph.gui.getNodeLinkInfo("node", nodeInfo);
    const infoContainer = document.querySelector(".njg-infoContainer");
    expect(infoContainer.innerHTML).not.toContain(
      'Clients</span><span class="njg-valueLabel">0',
    );
    // Empty array formatting
    expect(infoContainer.innerHTML).toContain("tags");
    expect(infoContainer.innerHTML).toContain("[]");
  });

  test("Create sidebar on loading", () => {
    expect(graph.gui.sideBar).toBe(null);
    graph.gui.init();
    expect(graph.gui.sideBar).not.toBe(null);
    expect(graph.gui.controls).toBe(null);
    expect(graph.gui.renderModeSelector).toBe(null);
    graph.setConfig({
      switchMode: true,
    });
    graph.gui.init();
    expect(graph.gui.controls).not.toBe(null);
    expect(graph.gui.renderModeSelector).not.toBe(null);
  });
});
describe("Test netjsongraph dom operate", () => {
  beforeEach(() => {
    graph.gui = new NetJSONGraphGUI(graph);
    graph.gui.init();
    graph.gui.createMetaInfoContainer();
  });

  test("Click a node", () => {
    expect(graph.gui.nodeLinkInfoContainer.style.display).toEqual("none");
    graph.config.onClickElement.call(graph, "node", {
      id: "33",
    });
    expect(graph.gui.nodeLinkInfoContainer.innerHTML).toContain("33");
    graph.config.onClickElement.call(graph, "node", {
      id: "21",
    });
    expect(graph.gui.nodeLinkInfoContainer.innerHTML).toContain("21");
    expect(graph.gui.nodeLinkInfoContainer.innerHTML).not.toContain("33");
    expect(graph.gui.nodeLinkInfoContainer.style.display).toEqual("flex");
    const closeBtn = document.querySelector(".njg-headerContainer .njg-closeButton");
    closeBtn.click();
    expect(graph.gui.nodeLinkInfoContainer.style.display).toEqual("none");
  });

  test("Click a link", () => {
    expect(graph.gui.nodeLinkInfoContainer.style.display).toEqual("none");
    graph.config.onClickElement.call(graph, "link", {
      source: "192.168.0.01",
      target: "192.168.1.01",
    });
    expect(graph.gui.nodeLinkInfoContainer.innerHTML).toContain(
      "192.168.0.01",
      "192.168.1.01",
    );
    graph.config.onClickElement.call(graph, "link", {
      source: "192.168.4.02",
      target: "192.168.5.03",
    });
    expect(graph.gui.nodeLinkInfoContainer.innerHTML).not.toContain(
      "192.168.0.01",
      "192.168.1.01",
    );
    expect(graph.gui.nodeLinkInfoContainer.innerHTML).toContain(
      "192.168.4.02",
      "192.168.5.03",
    );
    expect(graph.gui.nodeLinkInfoContainer.style.display).toEqual("flex");
    const closeBtn = document.querySelector(".njg-headerContainer .njg-closeButton");
    closeBtn.click();
    expect(graph.gui.nodeLinkInfoContainer.style.display).toEqual("none");
    graph.gui.metaInfoContainer.style.display = "none";
    graph.gui.nodeLinkInfoContainer.style.display = "flex";
    closeBtn.click();
    expect(graph.gui.sideBar).toHaveClass("hidden");
  });

  test("Should close sidebar if there are no children", () => {
    const closeBtn = document.querySelector(".njg-metaInfoContainer .njg-closeButton");
    graph.gui.nodeLinkInfoContainer.style.display = "none";
    closeBtn.click();
    expect(graph.gui.sideBar).toHaveClass("hidden");
  });

  test("Toggle the sidebar", () => {
    const handle = document.querySelector(".sideBarHandle");
    const sideBar = document.querySelector(".njg-sideBar");
    expect(sideBar).toHaveClass("hidden");
    handle.click();
    expect(sideBar).not.toHaveClass("hidden");
    expect(document.querySelector(".njg-metaInfoContainer").style.display).toEqual(
      "flex",
    );
  });
});

describe("Test GUI on narrow screens", () => {
  beforeEach(() => {
    graph.setConfig({
      showMetaOnNarrowScreens: false,
    });
    Object.defineProperty(graph.el, "clientWidth", {
      writable: true,
      configurable: true,
      value: 750,
    });
    graph.gui = new NetJSONGraphGUI(graph);
    graph.gui.init();
    graph.gui.createMetaInfoContainer();
  });

  test("Should not show meta info container on narrow screens", () => {
    expect(graph.gui.metaInfoContainer.style.display).toEqual("none");
  });

  test("Should show meta data info if the screen is resized to wide", () => {
    graph.el.clientWidth = 1000;
    const sideBarHandle = document.querySelector(".sideBarHandle");
    expect(graph.gui.sideBar).toHaveClass("hidden");
    expect(graph.gui.metaInfoContainer.style.display).toEqual("none");
    sideBarHandle.click();
    expect(document.querySelector(".njg-metaInfoContainer").style.display).toEqual(
      "flex",
    );
  });

  test("Should not show meta info on element click", () => {
    graph.config.onClickElement.call(graph, "node", {
      id: "33",
    });
    graph.el.clientWidth = 750;
    expect(graph.gui.metaInfoContainer.style.display).toEqual("none");
  });

  test("Click event on a GeoJSON feature", () => {
    graph.type = "geojson";
    const data = {
      type: "Feature",
      properties: {
        region: "Europe",
      },
      geometry: {
        type: "Point",
        coordinates: [0, 0],
      },
    };
    graph.config.onClickElement.call(graph, "feature", data.properties);
    expect(graph.gui.nodeLinkInfoContainer.innerHTML).toContain("region");
  });
});

describe("Test GUI createDefaultPopupContent", () => {
  beforeEach(() => {
    graph.gui = new NetJSONGraphGUI(graph);
  });
  afterEach(() => {
    graph.gui = null;
  });
  test("Create default popup content with valid location coordinates", () => {
    const node = {
      id: "node-1",
      name: "Test Node",
      label: "Node Label",
      location: {
        lat: 12.3456789,
        lng: 98.7654321,
      },
    };
    const content = graph.gui.createDefaultPopupContent(node);
    expect(content).toBeInstanceOf(HTMLElement);
    expect(content.classList.contains("default-popup")).toBe(true);
    expect(content.innerHTML).toContain("node-1");
    expect(content.innerHTML).toContain("Test Node");
    expect(content.innerHTML).toContain("Node Label");
    expect(content.innerHTML).toContain("12.34567890");
    expect(content.innerHTML).toContain("98.76543210");
  });

  test("Create default popup content with missing location should not display coordinates", () => {
    const node = {
      id: "node-2",
      name: "Test Node No Location",
      label: "No Location Node",
    };
    const content = graph.gui.createDefaultPopupContent(node);
    expect(content).toBeInstanceOf(HTMLElement);
    expect(content.innerHTML).toContain("node-2");
    expect(content.innerHTML).not.toContain("location");
  });

  test("Create default popup content with null location should not display coordinates", () => {
    const node = {
      id: "node-3",
      name: "Test Node",
      label: "Node Label",
      location: null,
    };
    const content = graph.gui.createDefaultPopupContent(node);
    expect(content).toBeInstanceOf(HTMLElement);
    expect(content.innerHTML).toContain("node-3");
    expect(content.innerHTML).not.toContain("location");
  });

  test("Create default popup content with NaN coordinates should not display coordinates", () => {
    const node = {
      id: "node-4",
      name: "Test Node",
      label: "Node Label",
      location: {
        lat: NaN,
        lng: 98.7654321,
      },
    };
    const content = graph.gui.createDefaultPopupContent(node);
    expect(content).toBeInstanceOf(HTMLElement);
    expect(content.innerHTML).toContain("node-4");
    expect(content.innerHTML).not.toContain("location");
  });

  test("Create default popup content with Infinity coordinates should not display coordinates", () => {
    const node = {
      id: "node-5",
      name: "Test Node",
      label: "Node Label",
      location: {
        lat: Infinity,
        lng: 98.7654321,
      },
    };
    const content = graph.gui.createDefaultPopupContent(node);
    expect(content).toBeInstanceOf(HTMLElement);
    expect(content.innerHTML).toContain("node-5");
    expect(content.innerHTML).not.toContain("location");
  });

  test("Create default popup content with string coordinates should convert and validate", () => {
    const node = {
      id: "node-6",
      name: "Test Node",
      label: "Node Label",
      location: {
        lat: "45.123456",
        lng: "-87.654321",
      },
    };
    const content = graph.gui.createDefaultPopupContent(node);
    expect(content).toBeInstanceOf(HTMLElement);
    expect(content.innerHTML).toContain("45.12345600");
    expect(content.innerHTML).toContain("-87.65432100");
  });

  test("Create default popup content with properties.location fallback", () => {
    const node = {
      id: "node-7",
      name: "Test Node",
      label: "Node Label",
      properties: {
        location: {
          lat: 10.5,
          lng: 20.5,
        },
      },
    };
    const content = graph.gui.createDefaultPopupContent(node);
    expect(content).toBeInstanceOf(HTMLElement);
    expect(content.innerHTML).toContain("10.50000000");
    expect(content.innerHTML).toContain("20.50000000");
  });

  test("Create default popup content with only finite lat should not display coordinates", () => {
    const node = {
      id: "node-8",
      name: "Test Node",
      label: "Node Label",
      location: {
        lat: 45.123,
        lng: NaN,
      },
    };
    const content = graph.gui.createDefaultPopupContent(node);
    expect(content).toBeInstanceOf(HTMLElement);
    expect(content.innerHTML).not.toContain("location");
  });

  test("Create default popup content with empty node", () => {
    const node = {};
    const content = graph.gui.createDefaultPopupContent(node);
    expect(content).toBeInstanceOf(HTMLElement);
    expect(content.classList.contains("default-popup")).toBe(true);
  });

  test("Create default popup content prefers properties.location over top-level location", () => {
    // loadNodePopup positions the popup using node.properties.location ||
    // node.location. createDefaultPopupContent must read coordinates in the
    // same order, otherwise the rendered text would disagree with the popup
    // position when both fields exist with different values.
    const node = {
      id: "node-mismatch",
      location: {lat: 1, lng: 2},
      properties: {location: {lat: 3, lng: 4}},
    };
    const content = graph.gui.createDefaultPopupContent(node);
    expect(content.innerHTML).toContain("3.00000000");
    expect(content.innerHTML).toContain("4.00000000");
    expect(content.innerHTML).not.toContain("1.00000000");
    expect(content.innerHTML).not.toContain("2.00000000");
  });

  test("Create default popup content keeps falsy-but-valid id (id:0)", () => {
    // id:0 is a legal integer NetJSON node id and must not be filtered out.
    const node = {
      id: 0,
      name: "Origin node",
      label: "Origin",
    };
    const content = graph.gui.createDefaultPopupContent(node);
    expect(content).toBeInstanceOf(HTMLElement);
    const items = content.querySelectorAll(".njg-tooltip-item");
    const idItem = Array.from(items).find(
      (el) => el.querySelector(".njg-tooltip-key")?.textContent === "id",
    );
    expect(idItem).toBeDefined();
    expect(idItem.querySelector(".njg-tooltip-value").textContent).toBe("0");
  });
});

describe("Test GUI loadNodePopup with async and tooltip handling", () => {
  let testGraph;
  let container;
  let originalLeaflet;
  let mockPopup;

  const mockLeafletPopup = (popupElement) => {
    mockPopup = {
      getElement: jest.fn(() => popupElement),
      setLatLng: jest.fn(() => mockPopup),
      setContent: jest.fn(() => mockPopup),
      openOn: jest.fn(() => mockPopup),
      handlers: {},
      on: jest.fn((event, handler) => {
        mockPopup.handlers[event] = handler;
        return mockPopup;
      }),
      remove: jest.fn(),
    };
    window.L = {
      CRS: {
        EPSG3857: {},
      },
      popup: jest.fn(() => mockPopup),
    };
    global.L = window.L;
  };

  beforeEach(() => {
    originalLeaflet = window.L;
    mockLeafletPopup({
      querySelector: jest.fn(),
    });
    container = document.createElement("div");
    container.setAttribute("id", "test-popup-map");
    document.body.appendChild(container);
    testGraph = new NetJSONGraphCore({
      nodes: [{id: "node-1", location: {lat: 10, lng: 20}}],
      links: [],
    });
    testGraph.event = testGraph.utils.createEvent();
    testGraph.gui = new NetJSONGraphGUI(testGraph);
    testGraph.setConfig({
      el: container,
      mapOptions: {
        nodePopup: {
          show: true,
          content: null,
          config: {autoPan: true},
        },
      },
      bookmarkableActions: {
        enabled: true,
        id: "id",
      },
    });
    testGraph.setUtils();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    if (container && document.body.contains(container)) {
      document.body.removeChild(container);
    }
    window.L = originalLeaflet;
    global.L = originalLeaflet;
    testGraph = null;
  });

  test("loadNodePopup hides tooltip on popup open", async () => {
    testGraph.echarts = {
      setOption: jest.fn(),
    };
    testGraph.leaflet = {
      currentPopup: null,
      once: jest.fn(),
      off: jest.fn(),
    };
    testGraph.utils.updateLabelVisibility = jest.fn();
    testGraph.utils.setTooltipVisibility = jest.fn();
    const node = {id: "node-1", location: {lat: 10, lng: 20}};
    await testGraph.gui.loadNodePopup(node);
    expect(testGraph.utils.setTooltipVisibility).toHaveBeenCalledWith(testGraph, false);
    expect(testGraph.utils.updateLabelVisibility).toHaveBeenCalledWith(
      testGraph,
      false,
    );
  });

  test("loadNodePopup handles async content error and cleans up URL fragment", async () => {
    const asyncContentHandler = jest.fn(() =>
      Promise.reject(new Error("Content load failed")),
    );
    testGraph.setConfig({
      mapOptions: {
        nodePopup: {
          show: true,
          content: asyncContentHandler,
          config: {autoPan: true},
        },
      },
      bookmarkableActions: {
        enabled: true,
        id: "id",
      },
    });
    testGraph.echarts = {
      setOption: jest.fn(),
    };
    testGraph.leaflet = {
      currentPopup: null,
      currentPopupRequest: null,
      once: jest.fn(),
      off: jest.fn(),
    };
    testGraph.utils.updateLabelVisibility = jest.fn();
    testGraph.utils.removeUrlFragment = jest.fn();
    const node = {id: "node-1", location: {lat: 10, lng: 20}};
    await testGraph.gui.loadNodePopup(node);
    expect(testGraph.utils.removeUrlFragment).toHaveBeenCalledWith("id", "nodeId");
    expect(testGraph.echarts.setOption).not.toHaveBeenCalled();
    expect(testGraph.utils.updateLabelVisibility).not.toHaveBeenCalled();
  });

  test("loadNodePopup restores tooltip and labels when replacement content fails", async () => {
    // Replacement path: a previous popup was open (tooltip already hidden),
    // we null currentPopup and call previousPopup.remove() so its handler
    // bails. If new content generation then fails the catch must restore
    // the tooltip/labels — otherwise the map is stuck in popup-open visual
    // state with no popup actually visible.
    const asyncContentHandler = jest.fn(() =>
      Promise.reject(new Error("Replacement content failed")),
    );
    testGraph.setConfig({
      mapOptions: {
        nodePopup: {
          show: true,
          content: asyncContentHandler,
          config: {autoPan: true},
        },
      },
      bookmarkableActions: {
        enabled: true,
        id: "id",
      },
    });
    testGraph.echarts = {setOption: jest.fn()};
    testGraph.leaflet = {
      currentPopup: {remove: jest.fn()},
      currentPopupRequest: null,
      once: jest.fn(),
      off: jest.fn(),
    };
    testGraph.utils.updateLabelVisibility = jest.fn();
    testGraph.utils.setTooltipVisibility = jest.fn();
    testGraph.utils.removeUrlFragment = jest.fn();
    const node = {id: "node-1", location: {lat: 10, lng: 20}};
    await testGraph.gui.loadNodePopup(node);
    expect(testGraph.utils.setTooltipVisibility).toHaveBeenCalledWith(testGraph, true);
    expect(testGraph.utils.updateLabelVisibility).toHaveBeenCalledWith(testGraph, true);
    expect(testGraph.utils.removeUrlFragment).toHaveBeenCalledWith("id", "nodeId");
  });

  test("loadNodePopup catches synchronous custom content errors", async () => {
    const contentHandler = jest.fn(() => {
      throw new Error("Content build failed");
    });
    testGraph.setConfig({
      mapOptions: {
        nodePopup: {
          show: true,
          content: contentHandler,
          config: {autoPan: true},
        },
      },
    });
    testGraph.echarts = {
      setOption: jest.fn(),
    };
    testGraph.leaflet = {
      currentPopup: null,
      currentPopupRequest: null,
      once: jest.fn(),
      off: jest.fn(),
    };
    testGraph.utils.updateLabelVisibility = jest.fn();
    testGraph.utils.removeUrlFragment = jest.fn();
    const node = {id: "node-1", location: {lat: 10, lng: 20}};
    await testGraph.gui.loadNodePopup(node);
    expect(testGraph.utils.removeUrlFragment).toHaveBeenCalledWith("id", "nodeId");
    expect(testGraph.echarts.setOption).not.toHaveBeenCalled();
  });

  test("loadNodePopup restores tooltip and removes matching fragment on popup remove", async () => {
    testGraph.echarts = {
      setOption: jest.fn(),
    };
    testGraph.leaflet = {
      currentPopup: null,
      once: jest.fn(),
      off: jest.fn(),
    };
    testGraph.utils.updateLabelVisibility = jest.fn();
    testGraph.utils.setTooltipVisibility = jest.fn();
    testGraph.utils.parseUrlFragments = jest.fn(() => ({
      id: new URLSearchParams("id=id&nodeId=node-1"),
    }));
    testGraph.utils.removeUrlFragment = jest.fn();
    const node = {id: "node-1", location: {lat: 10, lng: 20}};
    await testGraph.gui.loadNodePopup(node);
    expect(mockPopup.on).toHaveBeenCalledWith("remove", expect.any(Function));
    mockPopup.handlers.remove();
    expect(testGraph.utils.setTooltipVisibility).toHaveBeenCalledWith(testGraph, true);
    expect(testGraph.utils.updateLabelVisibility).toHaveBeenCalledWith(testGraph, true);
    expect(testGraph.utils.removeUrlFragment).toHaveBeenCalledWith("id", "nodeId");
  });

  test("loadNodePopup ignores stale async content without clearing newer URL fragment", async () => {
    let resolveFirst;
    const asyncContentHandler = jest
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveFirst = resolve;
          }),
      )
      .mockResolvedValueOnce("<div>Second Popup</div>");
    testGraph.setConfig({
      mapOptions: {
        nodePopup: {
          show: true,
          content: asyncContentHandler,
          config: {autoPan: true},
        },
      },
    });
    testGraph.echarts = {
      setOption: jest.fn(),
    };
    testGraph.leaflet = {
      currentPopup: null,
      currentPopupRequest: null,
      once: jest.fn(),
      off: jest.fn(),
    };
    testGraph.utils.updateLabelVisibility = jest.fn();
    testGraph.utils.removeUrlFragment = jest.fn();
    const node = {id: "node-1", location: {lat: 10, lng: 20}};
    const firstRequest = testGraph.gui.loadNodePopup(node);
    await testGraph.gui.loadNodePopup(node);
    resolveFirst("<div>First Popup</div>");
    await firstRequest;
    expect(testGraph.utils.removeUrlFragment).not.toHaveBeenCalled();
    expect(mockPopup.setContent).toHaveBeenCalledWith("<div>Second Popup</div>");
  });

  test("loadNodePopup closes the current popup before waiting for async content", async () => {
    let resolveContent;
    const asyncContentHandler = jest.fn(
      () =>
        new Promise((resolve) => {
          resolveContent = resolve;
        }),
    );
    testGraph.setConfig({
      mapOptions: {
        nodePopup: {
          show: true,
          content: asyncContentHandler,
          config: {autoPan: true},
        },
      },
    });
    const currentPopup = {remove: jest.fn()};
    testGraph.echarts = {
      setOption: jest.fn(),
    };
    testGraph.leaflet = {
      currentPopup,
      currentPopupRequest: null,
      once: jest.fn(),
      off: jest.fn(),
    };
    testGraph.utils.updateLabelVisibility = jest.fn();
    const node = {id: "node-1", location: {lat: 10, lng: 20}};
    const popupRequest = testGraph.gui.loadNodePopup(node);
    expect(currentPopup.remove).toHaveBeenCalled();
    resolveContent("<div>New Popup</div>");
    await popupRequest;
  });

  test("loadNodePopup handles null popup element gracefully", async () => {
    testGraph.echarts = {
      setOption: jest.fn(),
    };
    testGraph.leaflet = {
      currentPopup: null,
      once: jest.fn(),
      off: jest.fn(),
    };
    testGraph.utils.updateLabelVisibility = jest.fn();
    mockLeafletPopup(null);
    const node = {id: "node-1", location: {lat: 10, lng: 20}};
    await expect(testGraph.gui.loadNodePopup(node)).resolves.toBeUndefined();
  });

  test("loadNodePopup with async custom content handler that succeeds", async () => {
    const customContent = "<div>Custom Popup</div>";
    const asyncContentHandler = jest.fn(() => Promise.resolve(customContent));
    testGraph.setConfig({
      mapOptions: {
        nodePopup: {
          show: true,
          content: asyncContentHandler,
          config: {autoPan: true},
        },
      },
    });
    testGraph.echarts = {
      setOption: jest.fn(),
    };
    testGraph.leaflet = {
      currentPopup: null,
      currentPopupRequest: null,
      once: jest.fn(),
      off: jest.fn(),
    };
    testGraph.utils.updateLabelVisibility = jest.fn();
    const node = {id: "node-1", location: {lat: 10, lng: 20}};
    await testGraph.gui.loadNodePopup(node);
    // Verify async content was resolved and popup was created with it.
    // Callback receives the netjsongraph instance as `this` (project-wide
    // callback convention) and the node as the positional argument.
    expect(asyncContentHandler).toHaveBeenCalledWith(node);
    expect(asyncContentHandler.mock.instances[0]).toBe(testGraph);
    expect(mockPopup.setContent).toHaveBeenCalledWith(customContent);
  });

  test("loadNodePopup calls onOpen callback if provided", async () => {
    const onOpenCallback = jest.fn();
    testGraph.setConfig({
      mapOptions: {
        nodePopup: {
          show: true,
          content: null,
          config: {autoPan: true},
          onOpen: onOpenCallback,
        },
      },
    });
    testGraph.echarts = {
      setOption: jest.fn(),
    };
    testGraph.leaflet = {
      currentPopup: null,
      once: jest.fn(),
      off: jest.fn(),
    };
    testGraph.utils.updateLabelVisibility = jest.fn();
    testGraph.utils.removeUrlFragment = jest.fn();
    const node = {id: "node-1", location: {lat: 10, lng: 20}};
    await testGraph.gui.loadNodePopup(node);
    // Verify onOpen callback was called with the netjsongraph instance as
    // `this` (project-wide callback convention) and no positional args.
    expect(onOpenCallback).toHaveBeenCalledWith();
    expect(onOpenCallback.mock.instances[0]).toBe(testGraph);
  });

  test("loadNodePopup closes the popup and clears URL when onOpen throws", async () => {
    // The popup is already visible by the time onOpen runs (openOn happens
    // before onOpen is invoked). If onOpen throws, both the URL fragment and
    // the popup must be rolled back so the visible map state matches the URL.
    const onOpenError = new Error("onOpen failed");
    const onOpenCallback = jest.fn(() => {
      throw onOpenError;
    });
    testGraph.setConfig({
      mapOptions: {
        nodePopup: {
          show: true,
          content: null,
          config: {autoPan: true},
          onOpen: onOpenCallback,
        },
      },
      bookmarkableActions: {
        enabled: true,
        id: "id",
      },
    });
    testGraph.echarts = {setOption: jest.fn()};
    testGraph.leaflet = {
      currentPopup: null,
      once: jest.fn(),
      off: jest.fn(),
    };
    testGraph.utils.updateLabelVisibility = jest.fn();
    testGraph.utils.parseUrlFragments = jest.fn(() => ({
      id: new URLSearchParams("id=id&nodeId=node-1"),
    }));
    testGraph.utils.removeUrlFragment = jest.fn();
    // Match real Leaflet: .remove() fires the registered "remove" handler
    // synchronously. This lets the assertions confirm both that the popup
    // got removed AND that the handler then cleared the URL fragment.
    mockPopup.remove = jest.fn(() => {
      if (typeof mockPopup.handlers.remove === "function") {
        mockPopup.handlers.remove();
      }
    });
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const node = {id: "node-1", location: {lat: 10, lng: 20}};
    await testGraph.gui.loadNodePopup(node);
    expect(mockPopup.remove).toHaveBeenCalled();
    expect(testGraph.utils.removeUrlFragment).toHaveBeenCalledWith("id", "nodeId");
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Failed to run popup onOpen callback:",
      onOpenError,
    );
  });

  test("loadNodePopup preserves URL fragment when replacing popup for the still-current node", async () => {
    // Reproduces the popstate-restoration regression: when the URL still
    // points to the currently-open node and applyUrlFragmentState re-invokes
    // loadNodePopup for that same node, removing the previous popup must
    // not trigger the user-close cleanup that strips the URL fragment.
    const popups = [];
    const makePopup = () => {
      const popup = {
        setLatLng: jest.fn(() => popup),
        setContent: jest.fn(() => popup),
        openOn: jest.fn(() => popup),
        handlers: {},
        on: jest.fn((event, handler) => {
          popup.handlers[event] = handler;
          return popup;
        }),
        remove: jest.fn(() => {
          // Match real Leaflet: firing remove() invokes the "remove" event
          // listener synchronously.
          if (typeof popup.handlers.remove === "function") {
            popup.handlers.remove();
          }
        }),
      };
      popups.push(popup);
      return popup;
    };
    window.L = {CRS: {EPSG3857: {}}, popup: jest.fn(makePopup)};
    global.L = window.L;

    testGraph.echarts = {setOption: jest.fn()};
    testGraph.leaflet = {
      currentPopup: null,
      currentPopupRequest: null,
      once: jest.fn(),
      off: jest.fn(),
    };
    testGraph.utils.updateLabelVisibility = jest.fn();
    testGraph.utils.parseUrlFragments = jest.fn(() => ({
      id: new URLSearchParams("id=id&nodeId=node-1"),
    }));
    testGraph.utils.removeUrlFragment = jest.fn();

    const node = {id: "node-1", location: {lat: 10, lng: 20}};
    await testGraph.gui.loadNodePopup(node);
    expect(popups).toHaveLength(1);

    // Second invocation for the same node (popstate restoration path).
    await testGraph.gui.loadNodePopup(node);
    expect(popups).toHaveLength(2);
    expect(popups[0].remove).toHaveBeenCalled();

    expect(testGraph.utils.removeUrlFragment).not.toHaveBeenCalled();
  });
});
