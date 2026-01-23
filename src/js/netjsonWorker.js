/**
 * Fast deep copy using structuredClone if available, fallback to JSON.parse(JSON.stringify())
 * @param {any} obj - The object to deep copy
 * @return {any} - Deep copied object
 */
function fastDeepCopy(obj) {
  if (typeof structuredClone === "function") {
    return structuredClone(obj);
  }
  return JSON.parse(JSON.stringify(obj));
}

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
    const flatNodes = {};
    const nodeInterfaces = {};

    nodes.forEach((node) => {
      flatNodes[node.id] = node;

      if (node.local_addresses) {
        node.local_addresses.forEach((address) => {
          nodeInterfaces[address] = node;
        });
      }
    });
    return {flatNodes, nodeInterfaces};
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
    const nodeLinks = {};
    const resultNodes = [];

    JSONData.links.forEach((link) => {
      const sourceNode = JSONData.flatNodes[link.source];
      const targetNode = JSONData.flatNodes[link.target];
      if (sourceNode && targetNode) {
        if (sourceNode.id === targetNode.id) {
          console.error(`Link source and target (${sourceNode.id}) are duplicated!`);
          return;
        }

        if (!nodeLinks[sourceNode.id]) {
          nodeLinks[sourceNode.id] = 0;
        }
        if (!nodeLinks[targetNode.id]) {
          nodeLinks[targetNode.id] = 0;
        }
        nodeLinks[sourceNode.id] += 1;
        nodeLinks[targetNode.id] += 1;
      } else if (!sourceNode) {
        console.error(`Node ${link.source} does not exist!`);
      } else {
        console.error(`Node ${link.target} does not exist!`);
      }
    });
    Object.keys(JSONData.flatNodes).forEach((nodeID) => {
      const copyNode = JSONData.flatNodes[nodeID];
      copyNode.linkCount = nodeLinks[nodeID] || 0;
      resultNodes.push(copyNode);
    });
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
    const copyLinks = fastDeepCopy(JSONData.links);
    for (let i = copyLinks.length - 1; i >= 0; i -= 1) {
      const link = copyLinks[i];

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
    const copyArr = fastDeepCopy(arrData);
    const tempStack = [];
    for (let i = copyArr.length - 1; i >= 0; i -= 1) {
      const tempValueArr = [];
      let flag = 0;

      // eslint-disable-next-line no-restricted-syntax
      for (const key of eigenvalues) {
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
        const value = ordered ? tempValueArr.join("") : tempValueArr.sort().join("");
        if (tempStack.indexOf(value) !== -1) {
          copyArr.splice(i, 1);
        } else {
          tempStack.push(value);
        }
      }
    }
    return copyArr;
  },

  /**
   * @function
   * @name deduplicateNodesById
   *
   * Deduplicates an array of nodes based on their 'id' property.
   * Keeps the first occurrence of each ID and logs a warning for duplicates.
   * Nodes without an 'id' property are kept.
   *
   * @param {array} nodes - The array of node objects to deduplicate.
   * @returns {array} - A new array containing nodes with unique IDs.
   */
  deduplicateNodesById(nodes) {
    const uniqueNodes = [];
    const nodeIds = new Set();

    nodes.forEach((node) => {
      if (node.id) {
        if (!nodeIds.has(node.id)) {
          nodeIds.add(node.id);
          uniqueNodes.push(node);
        } else {
          console.warn(`Duplicate node ID detected and skipped: ${node.id}`);
        }
      } else {
        // Keep nodes without IDs
        uniqueNodes.push(node);
      }
    });

    return uniqueNodes;
  },
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
function dealJSONData(JSONData) {
  // First ensure nodes array exists
  if (!JSONData.nodes) {
    JSONData.nodes = [];
  }

  // Deduplicate nodes based on ID using the new utility function
  JSONData.nodes = operations.deduplicateNodesById(JSONData.nodes);

  const {flatNodes, nodeInterfaces} = operations.addFlatNodes(JSONData.nodes);
  JSONData.flatNodes = flatNodes;
  JSONData.nodeInterfaces = nodeInterfaces;

  // Ensure links array exists
  if (!JSONData.links) {
    JSONData.links = [];
  }

  JSONData.links = operations.changeInterfaceID(JSONData);

  JSONData.links = operations.arrayDeduplication(
    JSONData.links,
    ["source", "target"],
    false,
  );

  JSONData.nodes = operations.addNodeLinks(JSONData);

  return JSONData;
}

// We need to disable this as we are executing this file outside browser
// eslint-disable-next-line no-restricted-globals
self.addEventListener("message", (e) => {
  dealJSONData(e.data, operations);
  postMessage(e.data);
  // eslint-disable-next-line no-restricted-globals
  close();
});

module.exports = {operations, dealJSONData};
