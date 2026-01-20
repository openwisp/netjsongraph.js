import NetJSONGraph from "../src/js/netjsongraph.core";
import {NetJSONGraphRender} from "../src/js/netjsongraph.render";

const JSONData = {
  nodes: [],
  links: [],
};

describe("Test Dark Mode Support", () => {
  let graph;
  let render;

  beforeEach(() => {
    graph = new NetJSONGraph(JSONData);
    graph.setConfig({
      render: () => {},
      onInit() {
        return this.config;
      },
    });
    render = new NetJSONGraphRender();
    // Mock configs
    graph.config = {
      mapOptions: {
        baseOptions: {},
        nodeConfig: {},
        linkConfig: {},
      },
      mapTileConfig: [{urlTemplate: "light-tiles"}],
      mapTileConfigDark: [{urlTemplate: "dark-tiles"}],
    };
    // Set utils with isDarkMode method
    graph.utils = {
      ...render,
      isDarkMode: (self) => {
        return (
          (self.el && self.el.classList.contains("dark-mode")) ||
          document.body.classList.contains("dark-mode") ||
          document.documentElement.classList.contains("dark-mode")
        );
      },
    };
  });

  test("Should use light tiles by default", () => {
    document.body.classList.remove("dark-mode");
    document.documentElement.classList.remove("dark-mode");
    
    const option = render.generateMapOption(JSONData, graph);
    expect(option.leaflet.tiles).toEqual(graph.config.mapTileConfig);
    expect(option.leaflet.tiles[0].urlTemplate).toBe("light-tiles");
  });

  test("Should use dark tiles when body has dark-mode class", () => {
    document.body.classList.add("dark-mode");
    
    const option = render.generateMapOption(JSONData, graph);
    expect(option.leaflet.tiles).toEqual(graph.config.mapTileConfigDark);
    expect(option.leaflet.tiles[0].urlTemplate).toBe("dark-tiles");
    
    document.body.classList.remove("dark-mode");
  });

  test("Should use dark tiles when html has dark-mode class", () => {
    document.documentElement.classList.add("dark-mode");
    
    const option = render.generateMapOption(JSONData, graph);
    expect(option.leaflet.tiles).toEqual(graph.config.mapTileConfigDark);
    expect(option.leaflet.tiles[0].urlTemplate).toBe("dark-tiles");
    
    document.documentElement.classList.remove("dark-mode");
  });

  test("Should fallback to light tiles if dark config is missing", () => {
    document.body.classList.add("dark-mode");
    delete graph.config.mapTileConfigDark;
    
    const option = render.generateMapOption(JSONData, graph);
    expect(option.leaflet.tiles).toEqual(graph.config.mapTileConfig);
    
    document.body.classList.remove("dark-mode");
  });
});
