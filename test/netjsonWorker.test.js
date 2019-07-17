'use strict';

const { operations, dealJSONData } = require('../src/js/netjsonWorker.js');
const {
  addFlatNodes,
  arrayDeduplication,
  changeInterfaceID,
  addNodeLinks
} = operations;

const addFlatNodesJSONData = new Map([
  [
    // key
    [
      // nodes
      [
        {
          "id": "172.31.0.5",
          "local_addresses": [
            "172.31.0.2",
          ]
        },
        {
          "id": "172.31.1.100",
        },
        {
          "id": "172.31.2.100",
          "local_addresses": [
            "172.31.2.1",
            "172.31.2.2"
          ]
        },
      ],
    ],
    // value
    {
      flatNodes: {
        "172.31.0.5": {
          "id": "172.31.0.5",
          "local_addresses": [
            "172.31.0.2",
          ]
        },
        "172.31.1.100": {
          "id": "172.31.1.100",
        },
        "172.31.2.100": {
          "id": "172.31.2.100",
          "local_addresses": [
            "172.31.2.1",
            "172.31.2.2"
          ]
        },
      }, 
      nodeInterfaces: {
        "172.31.0.2": {
          "id": "172.31.0.5",
          "local_addresses": [
            "172.31.0.2",
          ]
        },
        "172.31.2.1": {
          "id": "172.31.2.100",
          "local_addresses": [
            "172.31.2.1",
            "172.31.2.2"
          ]
        },
        "172.31.2.2": {
          "id": "172.31.2.100",
          "local_addresses": [
            "172.31.2.1",
            "172.31.2.2"
          ]
        }
      }
    }
  ],
]);
const arrayDeduplicationJSONData = new Map([
  [
    // key
    [
      // nodes
      [
        {
          "id": "172.31.0.5",
          "local_addresses": [
            "172.31.0.2",
          ]
        },
        {
          "id": "172.31.0.5",
        },
        {
          "id": "172.31.1.100",
        },
        {
          "cid": "172.31.1.30",
        },
        {
          "id": "172.31.2.100",
          "local_addresses": [
            "172.31.2.1",
            "172.31.2.2"
          ]
        },
      ],
      // second param
      ["id"]
    ],
    // value
    [
      {
        "id": "172.31.0.5",
      },
      {
        "id": "172.31.1.100",
      },
      {
        "id": "172.31.2.100",
        "local_addresses": [
          "172.31.2.1",
          "172.31.2.2"
        ]
      },
    ],
  ],
  [
    // key
    [
      // links
      [
        {
          "source": "172.31.2.1",
          "target": "172.31.2.2",
          "cost": 1,
        },
        {
          "source": "172.31.2.1",
          "target": "172.31.0.1",
          "cost": 1,
          "cost_text": "1.000"
        },
        {
          "source": "172.31.1.100",
          "target": "172.31.0.1",
          "cost": 1,
          "cost_text": "1.000"
        },
        {
          "source": "172.31.0.1",
          "target": "172.31.1.100",
          "cost": 1,
          "cost_text": "1.000"
        },
        {
          "source": "172.31.2.2",
          "target": "172.31.2.1",
          "cost": 1,
          "cost_text": "1.000"
        },
        {
          "source": "172.31.2.2",
          "cost": 1,
          "cost_text": "1.000"
        },
        {
          "target": "172.31.2.2",
        },
      ],
      // second param
      ["source", "target"],
      // third param
      false,
    ],
    // value
    [
      {
        "source": "172.31.2.1",
        "target": "172.31.0.1",
        "cost": 1,
        "cost_text": "1.000"
      },
      {
        "source": "172.31.0.1",
        "target": "172.31.1.100",
        "cost": 1,
        "cost_text": "1.000"
      },
      {
        "source": "172.31.2.2",
        "target": "172.31.2.1",
        "cost": 1,
        "cost_text": "1.000"
      },
    ],
  ],  
  [
    [
      [{}]
    ],
    [{}]
  ]
]);
const changeInterfaceIDJSONData = new Map([
  [
    [
      {
        nodeInterfaces: {
          "172.31.0.2": {
            "id": "172.31.0.5",
            "local_addresses": [
              "172.31.0.2",
            ]
          },
          "172.31.2.1": {
            "id": "172.31.2.100",
            "local_addresses": [
              "172.31.2.1",
              "172.31.2.2"
            ]
          },
          "172.31.2.2": {
            "id": "172.31.2.100",
            "local_addresses": [
              "172.31.2.1",
              "172.31.2.2"
            ]
          }
        },
        links: [
          {
            "source": "172.31.2.1",
            "target": "172.31.0.1",
            "cost": 1,
            "cost_text": "1.000"
          },
          {
            "source": "172.31.0.1",
            "target": "172.31.1.100",
            "cost": 1,
            "cost_text": "1.000"
          },
          {
            "source": "172.31.2.2",
            "target": "172.31.2.1",
            "cost": 1,
            "cost_text": "1.000"
          },
          {
            "source": "172.31.2.2",
            "cost": 1,
            "cost_text": "1.000"
          },
        ]
      }
    ],
    [
      {
        "source": "172.31.2.100",
        "target": "172.31.0.1",
        "cost": 1,
        "cost_text": "1.000"
      },
      {
        "source": "172.31.0.1",
        "target": "172.31.1.100",
        "cost": 1,
        "cost_text": "1.000"
      },
      {
        "cost": 1,
        "cost_text": "1.000",
        "source": "172.31.2.2",
      }
    ]
  ],
]);
const addNodeLinksJSONData = new Map([
  [
    [
      {
        flatNodes: {
          "172.31.0.5": {
            "id": "172.31.0.5",
            "local_addresses": [
              "172.31.0.2",
            ]
          },
          "172.31.1.100": {
            "id": "172.31.1.100",
          },
          "172.31.2.100": {
            "id": "172.31.2.100",
            "local_addresses": [
              "172.31.2.1",
              "172.31.2.2"
            ]
          },
          "172.31.2.101": {
            "id": "172.31.2.101"
          },
          "172.31.2.102": {
            "id": "172.31.2.102",
          }
        }, 
        links: [
          {
            "source": "172.31.2.1",
            "target": "172.31.0.1",
            "cost": 1,
            "cost_text": "1.000"
          },
          {
            "source": "172.31.0.5",
            "target": "172.31.1.100",
            "cost": 1,
            "cost_text": "1.000"
          },
          {
            "source": "172.31.2.100",
            "target": "172.31.1.100",
            "cost": 1,
            "cost_text": "1.000"
          },
          {
            "source": "172.31.1.100",
            "target": "172.31.1.100",
            "cost": 1,
            "cost_text": "1.000"
          },
          {
            "source": "172.31.2.100",
            "target": "172.31.2.101",
            "cost": 1,
            "cost_text": "0.000"
          },
        ]
      }
    ],
    [
      {
        "id": "172.31.0.5",
        "local_addresses": [
          "172.31.0.2",
        ],
        "linkCount": 1
      },
      {
        "id": "172.31.1.100",
        "linkCount": 2
      },
      {
        "id": "172.31.2.100",
        "local_addresses": [
          "172.31.2.1",
          "172.31.2.2"
        ],
        "linkCount": 2
      },
      {
        "id": "172.31.2.101",
        "linkCount": 1
      },
      {
        "id": "172.31.2.102",
        "linkCount": 0
      }
    ]
  ],
]);
const rawJSONData = new Map([
  [
    [
      {
        nodes: [
          {
            "id": "172.31.0.5",
            "local_addresses": [
              "172.31.0.2",
            ]
          },
          {
            "id": "172.31.1.100",
          },
          {
            "id": "172.31.2.100",
            "local_addresses": [
              "172.31.2.1",
              "172.31.2.2"
            ]
          },
        ],
        links: [
          {
            "source": "172.31.2.1",
            "target": "172.31.0.1",
            "cost": 1,
            "cost_text": "1.000"
          },
          {
            "source": "172.31.0.5",
            "target": "172.31.1.100",
            "cost": 1,
            "cost_text": "1.000"
          },
          {
            "source": "172.31.2.1",
            "target": "172.31.1.100",
            "cost": 1,
            "cost_text": "1.000"
          },
        ]
      },
      operations
    ],
    {
      nodes: [
        {
          "id": "172.31.0.5",
          "local_addresses": [
            "172.31.0.2",
          ],
          "linkCount": 1
        },
        {
          "id": "172.31.1.100",
          "linkCount": 2
        },
        {
          "id": "172.31.2.100",
          "local_addresses": [
            "172.31.2.1",
            "172.31.2.2"
          ],
          "linkCount": 1
        }
      ],
      links: [
        {
          "source": "172.31.2.100",
          "target": "172.31.0.1",
          "cost": 1,
          "cost_text": "1.000"
        },
        {
          "source": "172.31.0.5",
          "target": "172.31.1.100",
          "cost": 1,
          "cost_text": "1.000"
        },
        {
          "source": "172.31.2.100",
          "target": "172.31.1.100",
          "cost": 1,
          "cost_text": "1.000"
        },
      ],
      flatNodes: {
        "172.31.0.5": {
          "id": "172.31.0.5",
          "local_addresses": [
            "172.31.0.2",
          ],
          "linkCount": 1
        },
        "172.31.1.100": {
          "id": "172.31.1.100",
          "linkCount": 2
        },
        "172.31.2.100": {
          "id": "172.31.2.100",
          "local_addresses": [
            "172.31.2.1",
            "172.31.2.2"
          ],
          "linkCount": 1
        },
      }, 
      nodeInterfaces: {
        "172.31.0.2": {
          "id": "172.31.0.5",
          "local_addresses": [
            "172.31.0.2",
          ],
          "linkCount": 1
        },
        "172.31.2.1": {
          "id": "172.31.2.100",
          "local_addresses": [
            "172.31.2.1",
            "172.31.2.2"
          ],
          "linkCount": 1
        },
        "172.31.2.2": {
          "id": "172.31.2.100",
          "local_addresses": [
            "172.31.2.1",
            "172.31.2.2"
          ],
          "linkCount": 1
        }
      },
    }
  ],
]);

const operationsObj = {
  "Data deduplication and detection of dirty data by eigenvalues": [arrayDeduplication, arrayDeduplicationJSONData],
  "Flattened nodes array by id": [addFlatNodes, addFlatNodesJSONData],
  "Netjson multi-interface id process": [changeInterfaceID, changeInterfaceIDJSONData],
  "Add node linkCount field": [addNodeLinks, addNodeLinksJSONData],
}

describe("Some separated operations with netjson", () => {
  for(let operationText in operationsObj){
    if(operationText === "Add node linkCount field"){
      test("Add node linkCount field", () => {
        let [operationFunc, operationDataMap] = operationsObj[operationText];
        for(let [key, value] of operationDataMap){  
          expect(operationFunc(...key)).toEqual(value);
        }
      })
    } 
    else{
      test(operationText, () => {
        let [operationFunc, operationDataMap] = operationsObj[operationText];
        for(let [key, value] of operationDataMap){  
          let keyJsonStore = JSON.stringify(key);                               
          expect(operationFunc(...key)).toEqual(value);
          expect(JSON.stringify(key)).toBe(keyJsonStore);
        }
      });
    }
  }
})
describe("Overall operation with netjson", () => {
  test("Deal with raw JSONData", () => {
    for(let [key, value] of rawJSONData){  
      expect(dealJSONData(...key)).toEqual(value);
    }
  })
})
