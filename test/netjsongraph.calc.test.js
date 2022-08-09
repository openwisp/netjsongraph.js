import NetJSONGraphUtil from "../src/js/netjsongraph.util";

const configs = {
  nodeCategories: [],
  linkCategories: [],
  mapOptions: {
    nodeConfig: {
      nodeStyle: {
        color: "blue",
      },
      nodeSize: 15,
    },
    linkConfig: {
      linkStyle: {
        width: 5,
        color: "green",
      },
    },
  },
  graphConfig: {
    series: {
      nodeStyle: {
        color: "blue",
      },
      nodeSize: 15,
      linkStyle: {
        width: 5,
        color: "green",
      },
    },
  },
};

describe("Test netjsongraph function utils", () => {
  const util = new NetJSONGraphUtil("", {});

  const nodeInfoData = new Map([
    [
      // key
      [
        // nodeInfo
        {
          id: 0,
          label: "test",
          properties: {
            name: "Node",
            color: "red",
            location: {
              lng: 0,
              lat: 0,
            },
          },
          linkCount: 1,
          local_addresses: ["192.168.0.01", "192.168.0.02", "192.168.0.03"],
        },
      ],
      // value
      {
        color: "red",
        id: 0,
        label: "test",
        location: {
          lng: 0,
          lat: 0,
        },
        links: 1,
        localAddresses: ["192.168.0.01", "192.168.0.02", "192.168.0.03"],
        name: "Node",
      },
    ],
    [
      // key
      [
        // nodeInfo
        {
          id: 0,
          label: "test",
          name: "Node",
          location: {
            lng: 0,
            lat: 0,
          },
          properties: {
            color: "red",
            time: "2019-04-03T05:06:54.000Z",
          },
          linkCount: 1,
          local_addresses: ["192.168.0.01", "192.168.0.02", "192.168.0.03"],
        },
      ],
      // value
      {
        color: "red",
        id: 0,
        label: "test",
        links: 1,
        location: {
          lng: 0,
          lat: 0,
        },
        time: "2019.04.03 05:06:54.000",
        localAddresses: ["192.168.0.01", "192.168.0.02", "192.168.0.03"],
        name: "Node",
      },
    ],
  ]);
  const linkInfoData = new Map([
    [
      // key
      [
        // linkInfo
        {
          source: "192.168.0.01",
          target: "192.168.1.01",
          cost: "1.000",
          properties: {
            name: "Link",
            color: "blue",
            time: "2019-04-03T05:06:54.000Z",
          },
        },
      ],
      // value
      {
        color: "blue",
        cost: "1.000",
        name: "Link",
        source: "192.168.0.01",
        target: "192.168.1.01",
        time: "2019.04.03 05:06:54.000",
      },
    ],
    [
      // key
      [
        {
          source: "192.168.0.01",
          target: "192.168.1.01",
        },
      ],
      // value
      {cost: undefined, source: "192.168.0.01", target: "192.168.1.01"},
    ],
  ]);
  const numberMinDigitData = new Map([
    [
      // key
      [
        // origin number
        1,
        // min digit
        3,
        // filler
        0,
      ],
      // value
      "001",
    ],
  ]);
  const dateParseData = new Map([
    [
      // key
      [
        {
          dateString: "2019-02-28T23:59:59.999Z",
          hourDiffer: -1,
        },
      ],
      "2019.03.01 00:59:59.999",
    ],
    [["23:59:59.999Z"]],
    [
      [
        {
          dateString: "2020-02-29T23:59:59Z",
          hourDiffer: -1,
        },
      ],
      "2020.03.01 00:59:59",
    ],
    [
      [
        {
          dateString: "2000-12-31T23:59:59Z",
          hourDiffer: -1,
        },
      ],
      "2001.01.01 00:59:59",
    ],
    [
      [
        {
          dateString: "2000-12-31T23:59:59Z",
          hourDiffer: 1,
        },
      ],
      "2000.12.31 22:59:59",
    ],
    [
      [
        {
          dateString: "1000-01-01T00:59:59Z",
          hourDiffer: 1,
        },
      ],
      "999.12.31 23:59:59",
    ],
  ]);
  const isObjectData = new Map([
    [[[]], false],
    [[{}], true],
  ]);
  const isArrayData = new Map([
    [[[]], true],
    [[{}], false],
  ]);
  const isElementData = new Map([
    [[document.createElement("div")], true],
    [[{}], false],
  ]);
  const deepMergeObjData = new Map([
    [[{a: 1}, {b: 2}], {a: 1, b: 2}],
    [[{a: 1}], {a: 1}],
    // sparse arrays are needed for this test
    // eslint-disable-next-line no-sparse-arrays
    [[, {a: 1}], {a: 1}],
    [[{a: 1}, {a: 2}], {a: 2}],
    [[{a: [1]}, {a: [2]}], {a: [2]}],
    [[{a: {b: 1}}, {a: {c: 2}}], {a: {b: 1, c: 2}}],
    [[{a: 1}, {b: 2}, {c: 3}], {a: 1, b: 2, c: 3}],
    // eslint-disable-next-line no-sparse-arrays
    [[{a: 1}, {c: 3}, , ,], {a: 1, c: 3}],
  ]);

  const utilsObj = {
    "Parse the infomation of incoming node data.": ["nodeInfo", nodeInfoData],
    "Parse the infomation of incoming link data.": ["linkInfo", linkInfoData],
    "Guaranteed minimum number of digits": [
      "numberMinDigit",
      numberMinDigitData,
    ],
    "Parse the time in the browser's current time zone based on the incoming matching rules.":
      ["dateParse", dateParseData],
    "Judge parameter type is object": ["isObject", isObjectData],
    "Judge parameter type is array": ["isArray", isArrayData],
    "Judge parameter type is a dom element": ["isElement", isElementData],
    "Merge two object deeply": ["deepMergeObj", deepMergeObjData],
  };

  Object.keys(utilsObj).forEach((operationText) => {
    test(operationText, () => {
      const [operationFunc, operationDataMap] = utilsObj[operationText];
      operationDataMap.forEach((value, key) => {
        if (value) {
          expect(util[operationFunc](...key)).toEqual(value);
        } else {
          util[operationFunc](...key);
        }
      });
    });
  });

  test("Event test.", () => {
    const event = util.createEvent();
    const res = 1;

    event.on("test", () => res);
    event.once("test", () => res);
    expect(event.emit("test")).toEqual([res, res]);
    expect(event.emit("none_event")).toEqual([]);
    event.delete("once_test");
  });

  test("Parse the metadata information from the JSON data", () => {
    const data = {
      type: "NetworkGraph",
      label: "Ninux Roma",
      protocol: "OLSR",
      version: "0.6.6.2",
      metric: "ETX",
      nodes: [],
      links: [],
    };
    const metadata = util.getMetadata(data);
    expect(metadata).toEqual({
      label: "Ninux Roma",
      protocol: "OLSR",
      version: "0.6.6.2",
      metric: "ETX",
      nodes: 0,
      links: 0,
    });
  });

  test("Generate the style of a node or a link", () => {
    let style = {
      color: "red",
    };
    const link = {};
    expect(util.generateStyle(style, link)).toEqual(style);

    const node = {
      opacity: 0.5,
    };
    style = (n) => n.opacity * 2;
    expect(util.generateStyle(style, node)).toEqual(1);
  });

  test("Get the style of a node", () => {
    let node = {};
    let style = util.getNodeStyle(node, configs, "map");
    expect(style).toEqual({
      nodeStyleConfig: {
        color: "blue",
      },
      nodeSizeConfig: 15,
      nodeEmphasisConfig: {},
    });

    node = {
      category: "test",
    };
    style = util.getNodeStyle(
      node,
      {
        ...configs,
        nodeCategories: [
          {
            name: "test",
            nodeStyle: {
              color: "red",
              opacity: 0.5,
            },
            emphasis: {
              nodeStyle: {
                color: "green",
                opacity: 0.8,
              },
            },
          },
        ],
      },
      "graph",
    );
    expect(style).toEqual({
      nodeStyleConfig: {
        color: "red",
        opacity: 0.5,
      },
      nodeSizeConfig: {},
      nodeEmphasisConfig: {
        nodeStyle: {
          color: "green",
          opacity: 0.8,
        },
        nodeSize: {},
      },
    });

    node = {};
    style = util.getNodeStyle(node, configs, "graph");
    expect(style).toEqual({
      nodeStyleConfig: {
        color: "blue",
      },
      nodeSizeConfig: 15,
      nodeEmphasisConfig: {},
    });
  });

  test("Get the style of a link", () => {
    let link = {};
    let style = util.getLinkStyle(link, configs, "map");
    expect(style).toEqual({
      linkStyleConfig: {
        color: "green",
        width: 5,
      },
      linkEmphasisConfig: {},
    });

    link = {
      category: "test",
    };
    style = util.getLinkStyle(
      link,
      {
        ...configs,
        linkCategories: [
          {
            name: "test",
            linkStyle: {
              color: "red",
              opacity: 0.5,
            },
            emphasis: {
              linkStyle: {
                opacity: 1,
              },
            },
          },
        ],
      },
      "graph",
    );
    expect(style).toEqual({
      linkStyleConfig: {
        color: "red",
        opacity: 0.5,
      },
      linkEmphasisConfig: {
        linkStyle: {
          opacity: 1,
        },
      },
    });

    link = {};
    style = util.getLinkStyle(link, configs, "graph");
    expect(style).toEqual({
      linkStyleConfig: {
        color: "green",
        width: 5,
      },
      linkEmphasisConfig: {},
    });
  });
});
