const operations = {
  /**
   * @function
   * @name addFlatNodes
   * @description Flattens an array of nodes by their IDs and maps local addresses to nodes.
   * @param {Array} nodes - Array of node objects.
   * @returns {Object} An object containing flatNodes and nodeInterfaces.
   * @example
   * const result = addFlatNodes([{ id: '1', local_addresses: ['192.168.1.1'] }]);
   */
  addFlatNodes(nodes) {
    this.validateNodes(nodes);
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
    return { flatNodes, nodeInterfaces };
  },

  /**
   * @function
   * @name addNodeLinks
   * @description Adds node linkCount field based on links in JSONData.
   * @param {Object} JSONData - NetJSONData containing nodes and links.
   * @returns {Array} Updated nodes with linkCount.
   */
  addNodeLinks(JSONData) {
    const nodeLinks = {};
    const resultNodes = [];

    JSONData.links.forEach((link) => {
      const sourceNode = JSONData.flatNodes[link.source];
      const targetNode = JSONData.flatNodes[link.target];
      if (sourceNode && targetNode) {
        if (sourceNode.id === targetNode.id) {
          throw new Error(`Link source and target (${sourceNode.id}) are duplicated!`);
        }

        nodeLinks[sourceNode.id] = (nodeLinks[sourceNode.id] || 0) + 1;
        nodeLinks[targetNode.id] = (nodeLinks[targetNode.id] || 0) + 1;
      } else if (!sourceNode) {
        throw new Error(`Node ${link.source} does not exist!`);
      } else {
        throw new Error(`Node ${link.target} does not exist!`);
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
   * @description Processes NetJSON multi-interface IDs.
   * @param {Object} JSONData - NetJSONData containing links and interfaces.
   * @returns {Array} Updated links with changed interface IDs.
   */
  changeInterfaceID(JSONData) {
    const copyLinks = JSON.parse(JSON.stringify(JSONData.links));
    
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
   * @description Data deduplication and detection of dirty data by eigenvalues.
   * Supports nested properties using dot notation.
   * @param {Array} arrData - Array of objects to deduplicate.
   * @param {Array} eigenvalues - Keys used for deduplication.
   * @param {boolean} ordered - Are eigenvalues ordered?
   * @param {Function|null} keyGenerator - Optional custom key generation function.
   * @returns {Array} Deduplicated array with metadata about duplicates found.
   */
  arrayDeduplication(arrData, eigenvalues = [], ordered = true, keyGenerator = null) {
    const seen = new Set();
    const result = [];

    // Early exit for empty input
    if (arrData.length === 0 || eigenvalues.length === 0) {
      return arrData;
    }

    arrData.forEach(item => {
      const generateKey = keyGenerator || ((item) => eigenvalues.map(ev => this.getValueByPath(item, ev)).join(ordered ? '' : ','));
      const key = generateKey(item);

      if (!seen.has(key)) {
        seen.add(key);
        result.push(item);
      } else {
        console.warn(`Duplicate item found based on keys ${eigenvalues}:`, item);
      }
    });

    return result;
  },

  /**
   * Helper function to get a value from an object using dot notation for nested properties.
   */
  getValueByPath(obj, path) {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
  },

  /**
   * Validates that the input nodes are in the expected format.
   */
  validateNodes(nodes) {
    if (!Array.isArray(nodes)) {
      throw new TypeError('Expected an array of nodes');
    }
    
    nodes.forEach(node => {
      if (typeof node.id !== 'string') {
        throw new TypeError('Each node must have a string id');
      }
    });
  },
};

/**
 * @function
 * @name dealJSONData
 * @description Generate the data needed for graph rendering based on NetJSON data.
 * @param {Object} JSONData - The NetJSON data object containing nodes and links.
 */
function dealJSONData(JSONData) {
  JSONData.nodes = operations.arrayDeduplication(JSONData.nodes, ["id"]);

  const { flatNodes, nodeInterfaces } = operations.addFlatNodes(JSONData.nodes);
  
  JSONData.flatNodes = flatNodes;
  JSONData.nodeInterfaces = nodeInterfaces;

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

module.exports = { operations, dealJSONData };
