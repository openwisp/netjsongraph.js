'use strict';

import NetJSONGraphUtil from "../src/js/netjsongraph.util.js";

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
          },
          linkCount: 1,
          local_addresses: ["192.168.0.01", "192.168.0.02", "192.168.0.03"],
        },
      ],
      // value
      "<p><b>id</b>: 0</p><p><b>label</b>: test</p><p><b>name</b>: Node</p><p><b>color</b>: red</p><p><b>links</b>: 1</p><p><b>local addresses</b>:<br />192.168.0.01<br />192.168.0.02<br />192.168.0.03</p>"
    ],
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
              lat: 0
            },
          },
          linkCount: 1,
          local_addresses: ["192.168.0.01", "192.168.0.02", "192.168.0.03"],
        },
      ],
      // value
      "<p><b>id</b>: 0</p><p><b>label</b>: test</p><p><b>name</b>: Node</p><p><b>color</b>: red</p><p><b>location</b>:<br />lat: 0<br />lng: 0<br /></p><p><b>links</b>: 1</p><p><b>local addresses</b>:<br />192.168.0.01<br />192.168.0.02<br />192.168.0.03</p>"
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
          },
        },
      ],
      // value
      `<p><b>source</b>: 192.168.0.01</p><p><b>target</b>: 192.168.1.01</p><p><b>cost</b>: 1.000</p><p><b>name</b>: Link</p><p><b>color</b>: blue</p>`
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
      `<p><b>source</b>: 192.168.0.01</p><p><b>target</b>: 192.168.1.01</p><p><b>cost</b>: undefined</p>`
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
        0
      ],
      // value
      "001"
    ],
  ]);
  const dateParseData = new Map([
    [
      // key
      [{
        dateString: "2019-02-28T23:59:59.999Z",
        hourDiffer: -1,
      }],
      "2019.03.01 00:59:59.999"
    ],
    [
      ["23:59:59.999Z"],
    ],
    [
      [{
        dateString: "2020-02-29T23:59:59Z",
        hourDiffer: -1,
      }],
      "2020.03.01 00:59:59"
    ],
    [
      [{
        dateString: "2000-12-31T23:59:59Z",
        hourDiffer: -1,
      }],
      "2001.01.01 00:59:59"
    ],
    [
      [{
        dateString: "2000-12-31T23:59:59Z",
        hourDiffer: 1,
      }],
      "2000.12.31 22:59:59"
    ],
    [
      [{
        dateString: "1000-01-01T00:59:59Z",
        hourDiffer: 1,
      }],
      "999.12.31 23:59:59"
    ],
  ]);
  const isObjectData = new Map([
    [
      [[]],
      false
    ],
    [
      [{}],
      true
    ],
  ]);
  const isArrayData = new Map([
    [
      [[]],
      true
    ],
    [
      [{}],
      false
    ],
  ]);
  const isElementData = new Map([
    [
      [document.createElement("div")],
      true
    ],
    [
      [{}],
      false
    ],
  ]);
  const deepMergeObjData = new Map([
    [
      [{a: 1}, {b: 2}],
      {a: 1, b: 2}
    ],
    [
      [{a: 1}],
      {a: 1}
    ],
    [
      [, {a: 1}],
      {a: 1}
    ],
    [
      [{a: 1}, {a: 2}],
      {a: 2}
    ],
    [
      [{a: [1,]}, {a: [2,]}],
      {a: [2,]}
    ],
    [
      [{a: {b: 1}}, {a: {c: 2}}],
      {a: {b: 1, c: 2}}
    ],
    [
      [{a: 1}, {b: 2}, {c: 3}],
      {a: 1, b: 2, c: 3}
    ],
    [
      [{a: 1}, {c: 3}, , ,],
      {a: 1, c: 3}
    ],
  ]);
  
  const utilsObj = {
    "Parse the infomation of incoming node data.": ["nodeInfo", nodeInfoData],
    "Parse the infomation of incoming link data.": ["linkInfo", linkInfoData],
    "Guaranteed minimum number of digits": ["numberMinDigit", numberMinDigitData],
    "Parse the time in the browser's current time zone based on the incoming matching rules.": ["dateParse", dateParseData],
    "Judge parameter type is object": ["isObject", isObjectData],
    "Judge parameter type is array": ["isArray", isArrayData],
    "Judge parameter type is a dom element": ["isElement", isElementData],
    "Merge two object deeply": ["deepMergeObj", deepMergeObjData],
  }

  for(let operationText in utilsObj){
    test(operationText, () => {
      let [operationFunc, operationDataMap] = utilsObj[operationText];
      for(let [key, value] of operationDataMap){  
        if(value){
          expect(util[operationFunc](...key)).toEqual(value);
        }
        else{
          util[operationFunc](...key)
        }
      }
    });
  }

  test("Event test.", () => {
    const event = util.createEvent(),
          res = 1;

    event.on("test", () => res);
    event.once("test", () => res); 
    expect(event.emit("test")).toEqual([res, res]);
    expect(event.emit("none_event")).toEqual([]);
    event.delete("once_test"); 
  })
})


