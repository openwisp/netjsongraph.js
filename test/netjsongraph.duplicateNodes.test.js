const {dealJSONData, operations} = require("../src/js/netjsonWorker");
const NetJSONGraphRender = require("../src/js/netjsongraph.render").default;

// Test data for duplicate node handling
const duplicateNodeTestData = new Map([
  [
    "duplicateNodeNetwork",
    {
      input: {
        nodes: [
          {
            id: "test1",
            label: "Test Node 1",
          },
          {
            id: "test1",
            label: "Test Node 1 Duplicate",
          },
          {
            id: "node2",
            label: "Node 2",
          },
        ],
        links: [
          {
            source: "test1",
            target: "node2",
          },
        ],
      },
      expected: {
        nodeCount: 2,
        linkCount: 1,
        flatNodeCount: 2,
        test1Count: 1,
      },
    },
  ],
  [
    // key: Data for mergeData test
    "mergeDataTest",
    // value: Test data
    {
      initialData: {
        nodes: [
          {
            id: "test1",
            label: "Test Node 1",
          },
          {
            id: "node2",
            label: "Node 2",
          },
        ],
        links: [
          {
            source: "test1",
            target: "node2",
          },
        ],
      },
      newData: {
        nodes: [
          {
            id: "test1",
            label: "Test Node 1 Updated",
          },
          {
            id: "node3",
            label: "Node 3",
          },
        ],
        links: [
          {
            source: "node2",
            target: "node3",
          },
        ],
      },
      expected: {
        finalNodeCount: 3,
        finalLinkCount: 2,
        test1Count: 1,
        node3Count: 1,
      },
    },
  ],
  [
    // key: Data for addData deduplication test
    "addDataDeduplication",
    // value: Test data
    {
      corruptData: {
        nodes: [
          {
            id: "test1",
            label: "Test Node 1",
          },
          {
            id: "test1",
            label: "Test Node 1 Duplicate",
          },
          {
            id: "node2",
            label: "Node 2",
          },
        ],
        links: [],
      },
      newData: {
        nodes: [],
        links: [],
      },
      expected: {
        finalNodeCount: 2,
        test1Count: 1,
      },
    },
  ],
]);

// Mock required dependencies
global.L = {
  circleMarker: jest.fn(),
  divIcon: jest.fn(),
  point: jest.fn(),
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

describe("NetJSONGraph Duplicate Node ID Handling", () => {
  test("dealJSONData should remove duplicate node IDs from the output", () => {
    const testCase = duplicateNodeTestData.get("duplicateNodeNetwork");
    const testData = testCase.input;

    const processedData = dealJSONData(testData);

    const idCounts = processedData.nodes.reduce((acc, node) => {
      acc[node.id] = (acc[node.id] || 0) + 1;
      return acc;
    }, {});

    Object.entries(idCounts).forEach(([, count]) => {
      expect(count).toBe(1);
    });

    expect(Object.keys(processedData.flatNodes).length).toBe(2);
    expect(processedData.flatNodes.test1).toBeDefined();
    expect(processedData.flatNodes.node2).toBeDefined();

    const node1 = processedData.nodes.find((node) => node.id === "test1");
    expect(node1.label).toBe("Test Node 1");
  });

  test("mergeData should handle duplicate node IDs correctly", () => {
    // Get test data
    const testCase = duplicateNodeTestData.get("mergeDataTest");
    const {initialData} = testCase;
    const {newData} = testCase;
    const {expected} = testCase;

    // Create an instance of NetJSONGraphRender
    const netJSONGraphRender = new NetJSONGraphRender();

    // Mock self object with initial data
    const self = {
      data: JSON.parse(JSON.stringify(initialData)),
    };

    // Call the mergeData function with our mock self and new data
    netJSONGraphRender.mergeData(newData, self);

    // Ensure that adding a duplicate node does not result in multiple entries.
    expect(self.data.nodes.filter((node) => node.id === "test1").length).toBe(
      expected.test1Count,
    );

    // Verify that the new node was added
    expect(self.data.nodes.filter((node) => node.id === "node3").length).toBe(
      expected.node3Count,
    );

    // Verify total node and link counts
    expect(self.data.nodes.length).toBe(expected.finalNodeCount);
    expect(self.data.links.length).toBe(expected.finalLinkCount);
  });

  test("addData should apply extra deduplication safeguard", () => {
    // Get test data
    const testCase = duplicateNodeTestData.get("addDataDeduplication");
    const {corruptData} = testCase;
    const {newData} = testCase;
    const {expected} = testCase;

    // Create an instance of NetJSONGraphRender
    const netJSONGraphRender = new NetJSONGraphRender();

    // Mock the render function
    netJSONGraphRender.render = jest.fn();

    // Mock self object with corrupt initial data
    const self = {
      data: JSON.parse(JSON.stringify(corruptData)),
      utils: {
        mergeData: netJSONGraphRender.mergeData,
        render: jest.fn(),
        deduplicateNodesById: operations.deduplicateNodesById,
      },
      config: {
        afterUpdate: jest.fn(),
      },
    };

    // Call the addData function with our mock self and new data
    netJSONGraphRender.addData(newData, self);

    // Verify that the duplicate node was removed by the safeguard
    expect(self.data.nodes.filter((node) => node.id === "test1").length).toBe(
      expected.test1Count,
    );

    // Verify total node count
    expect(self.data.nodes.length).toBe(expected.finalNodeCount);
  });
});
