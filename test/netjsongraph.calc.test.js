'use strict';

import "../src/js/netjsongraph.core.js";

describe("Test netjsongraph function utils", () => {
  const graph = new NetJSONGraph("", {});

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
            update_time: "2019.5.20 14:21:07"
          },
          linkCount: 1,
          local_addresses: ["192.168.0.01", "192.168.0.02", "192.168.0.03"],
        },
      ],
      // value
      "<p><b>id</b>: 0</p>\n<p><b>label</b>: test</p>\n<p><b>name</b>: Node</p>\n<p><b>color</b>: red</p>\n<p><b>update time</b>: 2019.5.20 14:21:07</p>\n<p><b>links</b>: 1</p>\n<p><b>local addresses</b>:<br/>192.168.0.01<br/>192.168.0.02<br/>192.168.0.03</p>\n"
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
            update_time: "2019.5.20 14:21:07"
          },
        },
      ],
      // value
      `<p><b>source</b>: 192.168.0.01</p>\n<p><b>target</b>: 192.168.1.01</p>\n<p><b>cost</b>: 1.000</p>\n<p><b>name</b>: Link</p>\n<p><b>color</b>: blue</p>\n<p><b>update time</b>: 2019.5.20 14:21:07</p>\n`
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
    // dateParse value depands on time zone! So there isn't a only answer.
    [
      // key
      ["2019-02-28T23:59:59.999Z"],
    ],
    [
      ["23:59:59.999Z"],
    ],
    [
      ["2020-02-29T23:59:59Z"],
    ],
    [
      ["2000-12-31T23:59:59Z"],
    ],
  ]);
  
  const utilsObj = {
    "Parse the infomation of incoming node data.": ["nodeInfo", nodeInfoData],
    "Parse the infomation of incoming link data.": ["linkInfo", linkInfoData],
    "Guaranteed minimum number of digits": ["numberMinDigit", numberMinDigitData],
    "Parse the time in the browser's current time zone based on the incoming matching rules.": ["dateParse", dateParseData],
  }

  for(let operationText in utilsObj){
    test(operationText, () => {
      let [operationFunc, operationDataMap] = utilsObj[operationText];
      for(let [key, value] of operationDataMap){  
        if(value){
          expect(graph.utils[operationFunc](...key)).toEqual(value);
        }
        else{
          expect(graph.utils[operationFunc](...key))
        }
      }
    });
  }
})


