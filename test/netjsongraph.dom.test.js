import "@testing-library/jest-dom";
import NetJSONGraph from "../src/js/netjsongraph.core";
import NetJSONGraphGUI from "../src/js/netjsongraph.gui";

const graph = new NetJSONGraph({
  type: "NetworkGraph",
  label: "Ninux Roma",
  protocol: "OLSR",
  version: "0.6.6.2",
  metric: "ETX",
  nodes: [],
  links: [],
});

// Package NetJSONGraph instance object.
graph.event = graph.utils.createEvent();
graph.gui = new NetJSONGraphGUI(graph);
graph.setConfig({
  onRender() {
    return this.config;
  },
  onLoad() {
    return this.config;
  },
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
        expect(graph.utils[operationFunc].call(graph, ...key)).toBeInstanceOf(
          value,
        );
      });
    });
    test("Show loading again", () => {
      graph.utils.showLoading.call(graph);
    });
  });

  test("Create a tooltip item", () => {
    const toolTipItem = `<div class="njg-tooltip-item"><span class="njg-tooltip-key">test</span><span class="njg-tooltip-value">test</span></div>`;

    expect(graph.utils.createTooltipItem("test", "test")).toBeInstanceOf(
      HTMLElement,
    );
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
    expect(graph.gui.aboutContainer).toBe(null);
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
    expect(graph.gui.controls).toContainElement(
      graph.gui.createRenderModeSelector(),
    );
    expect(graph.gui.createRenderModeSelector().outerHTML).toEqual(button);
  });

  test("Create a side bar", () => {
    const sidebar =
      '<div class="njg-sideBar"><button class="sideBarHandle"></button></div>';
    expect(graph.gui.createSideBar).toBeInstanceOf(Function);
    expect(graph.gui.createSideBar()).toBeInstanceOf(HTMLElement);
    expect(graph.el).toContainElement(graph.gui.createSideBar());
    expect(graph.gui.createSideBar().outerHTML).toEqual(sidebar);
  });

  test("Create a container for node and link info", () => {
    const container =
      '<div class="njg-nodeLinkInfoContainer" style="visibility: hidden;"></div>';
    graph.gui.sideBar = graph.gui.createSideBar();
    expect(graph.gui.createNodeLinkInfoContainer).toBeInstanceOf(Function);
    expect(graph.gui.createNodeLinkInfoContainer()).toBeInTheDocument(
      HTMLElement,
    );
    expect(graph.el).toContainElement(graph.gui.createNodeLinkInfoContainer());
    expect(graph.gui.sideBar).toContainElement(
      graph.gui.createNodeLinkInfoContainer(),
    );
    expect(graph.gui.createNodeLinkInfoContainer().outerHTML).toEqual(
      container,
    );
  });

  test("Create a container for meta data", () => {
    const container =
      '<div class="njg-aboutContainer"><h2>About</h2><div class="njg-metaData"></div></div>';
    graph.gui.sideBar = graph.gui.createSideBar();
    expect(graph.gui.nodeLinkInfoContainer).toBe(null);
    expect(graph.gui.createAboutContainer).toBeInstanceOf(Function);
    expect(graph.gui.createAboutContainer()).toBeInstanceOf(HTMLElement);
    expect(graph.el).toContainElement(graph.gui.createAboutContainer());
    expect(graph.gui.sideBar).toContainElement(
      graph.gui.createAboutContainer(),
    );
    expect(graph.gui.createAboutContainer().outerHTML).toEqual(container);

    graph.gui.aboutContainer = graph.gui.createAboutContainer();
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
    expect(header).toContainElement(document.getElementById("closeButton"));
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
    graph.gui.createAboutContainer();
  });

  test("Click a node", () => {
    expect(graph.gui.nodeLinkInfoContainer.style.visibility).toEqual("hidden");
    graph.config.onClickElement.call(graph, "node", {
      id: "33",
    });
    expect(graph.gui.nodeLinkInfoContainer.innerHTML).toContain("33");
    graph.config.onClickElement.call(graph, "node", {
      id: "21",
    });
    expect(graph.gui.nodeLinkInfoContainer.innerHTML).toContain("21");
    expect(graph.gui.nodeLinkInfoContainer.innerHTML).not.toContain("33");
    expect(graph.gui.nodeLinkInfoContainer.style.visibility).toEqual("visible");
    const closeBtn = document.getElementById("closeButton");
    closeBtn.click();
    expect(graph.gui.nodeLinkInfoContainer.style.visibility).toEqual("hidden");
  });

  test("Click a link", () => {
    expect(graph.gui.nodeLinkInfoContainer.style.visibility).toEqual("hidden");
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
    expect(graph.gui.nodeLinkInfoContainer.style.visibility).toEqual("visible");
    const closeBtn = document.getElementById("closeButton");
    closeBtn.click();
    expect(graph.gui.nodeLinkInfoContainer.style.visibility).toEqual("hidden");
  });

  test("Toggle the sidebar", () => {
    const sidebar = document.querySelector(".njg-sideBar");
    const handle = document.querySelector(".sideBarHandle");
    expect(sidebar).not.toHaveClass("hidden");
    handle.click();
    expect(sidebar).toHaveClass("njg-sideBar hidden");
  });
});
