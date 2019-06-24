const operations = {
  /**
   * @function
   * @name addFlatNodes
   *
   * Flattened nodes array by id
   * @param  {array}  nodes  NetJSONData.nodes
   *
   * @return {object}  {flatNodes, nodeInterfaces}
   */
  addFlatNodes(nodes) {
    let flatNodes = {};
    let nodeInterfaces = {};

    nodes.map(function(node) {
      flatNodes[node.id] = node;

      if (node.local_addresses) {
        node.local_addresses.map(address => {
          nodeInterfaces[address] = node;
        });
      }
    });
    return { flatNodes, nodeInterfaces };
  },

  /**
   * @function
   * @name addNodeLinks
   *
   * Add node linkCount field
   * @param  {object}  JSONData     NetJSONData
   *
   * @return {array}  nodes
   *
   */
  addNodeLinks(JSONData) {
    let nodeLinks = {};
    let resultNodes = [];

    JSONData.links.map(function(link) {
      let sourceNode = JSONData.flatNodes[link.source],
        targetNode = JSONData.flatNodes[link.target];
      if (sourceNode && targetNode) {
        if (sourceNode.id === targetNode.id) {
          console.error(
            `Link source and target (${sourceNode.id}) are duplicated!`
          );
          return;
        }

        if (!nodeLinks[sourceNode.id]) {
          nodeLinks[sourceNode.id] = 0;
        }
        if (!nodeLinks[targetNode.id]) {
          nodeLinks[targetNode.id] = 0;
        }
        nodeLinks[sourceNode.id]++;
        nodeLinks[targetNode.id]++;
      } else if (!sourceNode) {
        console.error(`Node ${link.source} is not exist!`);
      } else {
        console.error(`Node ${link.target} is not exist!`);
      }
    });
    for (let nodeID in JSONData.flatNodes) {
      let copyNode = JSONData.flatNodes[nodeID];
      copyNode.linkCount = nodeLinks[nodeID] || 0;
      resultNodes.push(copyNode);
    }
    return resultNodes;
  },

  /**
   * @function
   * @name changeInterfaceID
   *
   * Netjson multi-interface id process.
   * @param  {object}  JSONData     NetJSONData
   *
   * @return {array}  links
   *
   */
  changeInterfaceID(JSONData) {
    let copyLinks = JSON.parse(JSON.stringify(JSONData.links));
    for (let i = copyLinks.length - 1; i >= 0; i--) {
      let link = copyLinks[i];

      if (link.source && link.target) {
        if (JSONData.nodeInterfaces[link.source]) {
          link.source = JSONData.nodeInterfaces[link.source].id;
        }
        if (JSONData.nodeInterfaces[link.target]) {
          link.target = JSONData.nodeInterfaces[link.target].id;
        }
        if (link.source === link.target) {
          copyLinks.splice(i, 1);
        }
      }
    }
    return copyLinks;
  },

  /**
   * @function
   * @name arrayDeduplication
   *
   * Data deduplication and detection of dirty data by eigenvalues
   * @param  {array}  arrData
   * @param  {array}  eigenvalues     arrData performs deduplication based on these eigenvalues
   * @param {boolean} ordered         eigenvalues are ordered ?
   *
   * @return {array}  result
   *
   */
  arrayDeduplication(arrData, eigenvalues = [], ordered = true) {
    let copyArr = JSON.parse(JSON.stringify(arrData));
    let tempStack = [];
    for (let i = copyArr.length - 1; i >= 0; i--) {
      let tempValueArr = [],
        flag = 0;
      for (let key of eigenvalues) {
        if (!copyArr[i][key]) {
          console.error(`The array doesn't have "${key}"`);
          flag = 1;
          break;
        }
        tempValueArr.push(copyArr[i][key]);
      }
      if (flag) {
        copyArr.splice(i, 1);
      } else {
        let value = ordered
          ? tempValueArr.join("")
          : tempValueArr.sort().join("");
        if (tempStack.indexOf(value) !== -1) {
          copyArr.splice(i, 1);
        } else {
          tempStack.push(value);
        }
      }
    }
    return copyArr;
  }
};
/**
 * @function
 * @name dealJSONData
 *
 * Generate the data needed for graph rendering
 * @param  {object}  JSONData     NetJSONData
 * @param  {object}  operations
 *
 */
function dealJSONData(JSONData, operations) {
  JSONData.nodes = operations.arrayDeduplication(JSONData.nodes, ["id"]);

  let { flatNodes, nodeInterfaces } = operations.addFlatNodes(JSONData.nodes);
  JSONData.flatNodes = flatNodes;
  JSONData.nodeInterfaces = nodeInterfaces;

  JSONData.links = operations.changeInterfaceID(JSONData);

  JSONData.links = operations.arrayDeduplication(
    JSONData.links,
    ["source", "target"],
    false
  );

  JSONData.nodes = operations.addNodeLinks(JSONData);

  return JSONData;
}

self.addEventListener("message", e => {
  dealJSONData(e.data, operations);
  postMessage(e.data);
  close();
});

module.exports = { operations, dealJSONData };
