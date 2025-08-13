import NetJSONGraphConfig, {prepareData} from "../src/js/netjsongraph.config";

/**
 * Tests for utilities inside `netjsongraph.config.js` that are not yet
 * covered elsewhere.  Focuses on the custom `prepareData` and
 * `onClickElement` callbacks.
 */

describe("prepareData", () => {
  it("should assign category based on node.status", () => {
    const data = {
      nodes: [
        {id: "1", properties: {status: "ok"}},
        {id: "2", properties: {status: "problem"}},
        {id: "3", properties: {status: "critical"}},
        {id: "4", properties: {status: "unknown"}},
      ],
    };

    // `prepareData` mutates the input object in-place.
    prepareData.call({}, data);

    expect(data.nodes[0].category).toBe("ok");
    expect(data.nodes[1].category).toBe("problem");
    expect(data.nodes[2].category).toBe("critical");
    // Any status outside the recognised trio should *not* set a category
    expect(data.nodes[3].category).toBeUndefined();
  });

  it("should be a no-op when JSONData lacks a nodes array", () => {
    const data = {links: []};
    // Should not throw and should leave the object unchanged.
    expect(() => prepareData.call({}, data)).not.toThrow();
    expect(data).toEqual({links: []});
  });
});

describe("onClickElement", () => {
  /**
   * Builds a minimal mock of a NetJSONGraph instance with just the pieces
   * `onClickElement` relies on: `utils`, `gui`, `config` and `el`.
   */
  function buildMockGraph({isNetJSONReturn = true} = {}) {
    // Container element – width needs to be > 850 to trigger meta display
    const el = document.createElement("div");
    Object.defineProperty(el, "clientWidth", {value: 900});

    const sideBar = document.createElement("div");
    sideBar.classList.add("hidden");
    const metaInfoContainer = document.createElement("div");
    metaInfoContainer.style.display = "none";
    el.appendChild(sideBar);
    el.appendChild(metaInfoContainer);

    const utils = {
      isNetJSON: jest.fn(() => isNetJSONReturn),
      nodeInfo: jest.fn(() => ({info: "node"})),
      linkInfo: jest.fn(() => ({info: "link"})),
    };

    const gui = {
      sideBar,
      metaInfoContainer,
      getNodeLinkInfo: jest.fn(),
    };

    return {
      data: {nodes: [], links: []},
      utils,
      gui,
      el,
      config: {showMetaOnNarrowScreens: false},
    };
  }

  it("should extract node info and show sidebar when data is NetJSON", () => {
    const mockGraph = buildMockGraph({isNetJSONReturn: true});

    NetJSONGraphConfig.onClickElement.call(mockGraph, "node", {id: "n1"});

    expect(mockGraph.utils.nodeInfo).toHaveBeenCalledWith({id: "n1"});
    expect(mockGraph.gui.metaInfoContainer.style.display).toBe("flex");
    expect(mockGraph.gui.sideBar.classList.contains("hidden")).toBe(false);
    expect(mockGraph.gui.getNodeLinkInfo).toHaveBeenCalledWith("node", {
      info: "node",
    });
  });

  it("should fallback gracefully when data is *not* NetJSON", () => {
    const mockGraph = buildMockGraph({isNetJSONReturn: false});

    // Should not attempt to call nodeInfo / linkInfo paths
    NetJSONGraphConfig.onClickElement.call(mockGraph, "polygon", {
      properties: {},
    });

    expect(mockGraph.utils.nodeInfo).not.toHaveBeenCalled();
    expect(mockGraph.gui.sideBar.classList.contains("hidden")).toBe(false);
  });
});
