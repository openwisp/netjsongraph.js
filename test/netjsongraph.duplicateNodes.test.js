const {operations, dealJSONData} = require("../src/js/netjsonWorker");
const {addFlatNodes, arrayDeduplication, addNodeLinks} = operations;

const {NetJSONGraphRender} = require('../src/js/netjsongraph.render');

// Mock required dependencies
global.L = {
  circleMarker: jest.fn(),
  divIcon: jest.fn(),
  point: jest.fn(),
  markerClusterGroup: jest.fn(() => ({
    addTo: jest.fn(() => ({})),
    addLayer: jest.fn(),
  })),
  geoJSON: jest.fn(() => ({
    addTo: jest.fn(),
    removeFrom: jest.fn(),
  })),
};

global.echarts = {
  use: jest.fn(),
  init: jest.fn(),
  appendData: jest.fn(),
  setOption: jest.fn(),
  on: jest.fn(),
};

describe("Test duplicate node ID handling", () => {
  // Test the enhanced dealJSONData function
  test("dealJSONData should handle duplicate node IDs gracefully", () => {
    // Create test data with duplicate node IDs
    const testData = {
      nodes: [
        {
          id: "node1",
          label: "Node 1",
        },
        {
          id: "node1", // Duplicate ID
          label: "Node 1 Duplicate",
        },
        {
          id: "node2",
          label: "Node 2",
        },
      ],
      links: [
        {
          source: "node1",
          target: "node2",
        },
      ],
    };

    // Process the data with our enhanced dealJSONData function
    const processedData = dealJSONData(testData);

    // Verify that only one node with ID "node1" was kept
    expect(processedData.nodes.filter(node => node.id === "node1").length).toBe(1);
    
    // Verify the total count is correct (should be 2 nodes - node1 and node2)
    expect(processedData.nodes.length).toBe(2);
    
    // Verify flatNodes contains the correct nodes
    expect(Object.keys(processedData.flatNodes).length).toBe(2);
    expect(processedData.flatNodes["node1"]).toBeDefined();
    expect(processedData.flatNodes["node2"]).toBeDefined();
  });

  // Test the enhanced mergeData function
  test("mergeData should handle duplicate node IDs correctly", () => {
    // Create an instance of NetJSONGraphRender
    const netJSONGraphRender = new NetJSONGraphRender();
    
    // Mock self object with initial data
    const self = {
      data: {
        nodes: [
          {
            id: "node1",
            label: "Node 1",
          },
          {
            id: "node2",
            label: "Node 2",
          },
        ],
        links: [
          {
            source: "node1",
            target: "node2",
          },
        ],
      },
    };
    
    // Create test data with duplicate node ID
    const newData = {
      nodes: [
        {
          id: "node1", // Duplicate ID
          label: "Node 1 Updated", 
        },
        {
          id: "node3", // New node
          label: "Node 3",
        },
      ],
      links: [
        {
          source: "node2",
          target: "node3",
        },
      ],
    };
    
    // Call the mergeData function with our mock self and new data
    netJSONGraphRender.mergeData(newData, self);
    
    // Verify that the duplicate node was not added
    expect(self.data.nodes.filter(node => node.id === "node1").length).toBe(1);
    
    // Verify that the new node was added
    expect(self.data.nodes.filter(node => node.id === "node3").length).toBe(1);
    
    // Verify total node count (should be 3: node1, node2, node3)
    expect(self.data.nodes.length).toBe(3);
    
    // Verify total link count (should be 2)
    expect(self.data.links.length).toBe(2);
  });

  // Test the addData function's safeguard
  test("addData should apply extra deduplication safeguard", () => {
    // Create an instance of NetJSONGraphRender
    const netJSONGraphRender = new NetJSONGraphRender();
    
    // Mock the render function
    netJSONGraphRender.render = jest.fn();
    
    // Mock self object with initial data that includes duplicate nodes
    // (this represents a corrupted state that shouldn't occur but we're testing the safeguard)
    const self = {
      data: {
        nodes: [
          {
            id: "node1",
            label: "Node 1",
          },
          {
            id: "node1", // Duplicate ID (corrupt state)
            label: "Node 1 Duplicate",
          },
          {
            id: "node2",
            label: "Node 2",
          },
        ],
        links: [],
      },
      utils: {
        mergeData: netJSONGraphRender.mergeData,
        render: jest.fn(),
      },
      config: {
        afterUpdate: jest.fn(),
      },
    };
    
    // Empty test data to add
    const newData = {
      nodes: [],
      links: [],
    };
    
    // Call the addData function with our mock self and new data
    netJSONGraphRender.addData(newData, self);
    
    // Verify that the duplicate node was removed by the safeguard
    expect(self.data.nodes.filter(node => node.id === "node1").length).toBe(1);
    
    // Verify total node count (should be 2: one instance of node1 and node2)
    expect(self.data.nodes.length).toBe(2);
  });
});