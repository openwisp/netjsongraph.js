import KDBush from "kdbush";
import {geojsonToNetjson as convertGeojson} from "./netjsongraph.geojson";

class NetJSONGraphUtil {
  /**
   * @function
   * @name JSONParamParse
   *
   * Perform different operations to call NetJSONDataParse function according to different Param types.
   * @param  {object|string}  JSONParam   Url or JSONData
   *
   * @return {object}    A promise object of JSONData
   */

  JSONParamParse(JSONParam) {
    if (typeof JSONParam === "string") {
      return fetch(JSONParam, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "include",
      })
        .then((response) => response)
        .catch((msg) => {
          console.error(msg);
        });
    }
    return Promise.resolve(JSONParam);
  }

  async paginatedDataParse(JSONParam) {
    let res;
    let data;
    try {
      let paginatedResponse = await this.utils.JSONParamParse(JSONParam);
      if (paginatedResponse.json) {
        // eslint-disable-next-line no-await-in-loop
        res = await paginatedResponse.json();
        data = res.results ? res.results : res;
        while (res.next && data.nodes.length <= this.config.maxPointsFetched) {
          // eslint-disable-next-line no-await-in-loop
          paginatedResponse = await this.utils.JSONParamParse(res.next);
          // eslint-disable-next-line no-await-in-loop
          res = await paginatedResponse.json();
          data.nodes = data.nodes.concat(res.results.nodes);
          data.links = data.links.concat(res.results.links);

          if (res.next) {
            this.hasMoreData = true;
          } else {
            this.hasMoreData = false;
          }
        }
      } else {
        data = paginatedResponse;
      }
    } catch (e) {
      console.error(e);
    }

    return data;
  }

  async getBBoxData(JSONParam, bounds) {
    let data;
    try {
      // eslint-disable-next-line prefer-destructuring
      JSONParam = JSONParam[0].split("?")[0];
      // eslint-disable-next-line no-underscore-dangle
      const url = `${JSONParam}bbox?swLat=${bounds._southWest.lat}&swLng=${bounds._southWest.lng}&neLat=${bounds._northEast.lat}&neLng=${bounds._northEast.lng}`;
      // eslint-disable-next-line no-await-in-loop
      const res = await this.utils.JSONParamParse(url);
      data = await res.json();
    } catch (e) {
      console.error(e);
    }
    return data;
  }

  /**
   * @function
   * @name dateParse
   *
   * Parse the time in the browser's current time zone based on the incoming matching rules.
   * The exec result must be [date, year, month, day, hour, minute, second, millisecond?]
   *
   * @param  {string}          dateString
   * @param  {object(RegExp)}  parseRegular
   * @param  {number}          hourDiffer    you can custom time difference, default is the standard time difference

   *
   * @return {string}    Date string
   */

  dateParse({
    dateString,
    parseRegular = /^([1-9]\d{3})-(\d{1,2})-(\d{1,2})T(\d{1,2}):(\d{1,2}):(\d{1,2})(?:\.(\d{1,3}))?Z$/,
    hourDiffer = new Date().getTimezoneOffset() / 60,
  }) {
    const dateParseArr = parseRegular.exec(dateString);
    if (!dateParseArr || dateParseArr.length < 7) {
      console.error("Date doesn't meet the specifications.");
      return "";
    }
    const dateNumberFields = ["dateYear", "dateMonth", "dateDay", "dateHour"];
    const dateNumberObject = {};
    const leapYear =
      (dateParseArr[1] % 4 === 0 && dateParseArr[1] % 100 !== 0) ||
      dateParseArr[1] % 400 === 0;
    const limitBoundaries = new Map([
      ["dateMonth", 12],
      [
        "dateDay",
        [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31],
      ],
      ["dateHour", 24],
    ]);

    for (let i = dateNumberFields.length; i > 0; i -= 1) {
      dateNumberObject[dateNumberFields[i - 1]] = parseInt(dateParseArr[i], 10);
    }

    let carry = -hourDiffer;
    let limitBoundary;
    for (let i = dateNumberFields.length; i > 0; i -= 1) {
      if (dateNumberFields[i - 1] === "dateYear") {
        dateNumberObject[dateNumberFields[i - 1]] += carry;
        break;
      } else if (dateNumberFields[i - 1] === "dateDay") {
        limitBoundary =
          limitBoundaries.get("dateDay")[dateNumberObject.dateMonth - 1];
      } else {
        limitBoundary = limitBoundaries.get(dateNumberFields[i - 1]);
      }

      let calculateResult = dateNumberObject[dateNumberFields[i - 1]] + carry;

      if (dateNumberFields[i - 1] === "dateHour") {
        if (calculateResult < 0) {
          carry = -1;
        } else if (calculateResult >= limitBoundary) {
          carry = 1;
        } else {
          carry = 0;
        }
      } else if (calculateResult <= 0) {
        carry = -1;
      } else if (calculateResult > limitBoundary) {
        carry = 1;
      } else {
        carry = 0;
      }

      if (carry === 1) {
        calculateResult -= limitBoundary;
      } else if (carry < 0) {
        if (dateNumberFields[i - 1] === "dateDay") {
          limitBoundary =
            limitBoundaries.get("dateDay")[
              (dateNumberObject[dateNumberFields[i - 1]] + 10) % 11
            ];
        }
        calculateResult += limitBoundary;
      }

      dateNumberObject[dateNumberFields[i - 1]] = calculateResult;
    }

    return `${dateNumberObject.dateYear}.${this.numberMinDigit(
      dateNumberObject.dateMonth,
    )}.${this.numberMinDigit(dateNumberObject.dateDay)} ${this.numberMinDigit(
      dateNumberObject.dateHour,
    )}:${this.numberMinDigit(dateParseArr[5])}:${this.numberMinDigit(
      dateParseArr[6],
    )}${dateParseArr[7] ? `.${this.numberMinDigit(dateParseArr[7], 3)}` : ""}`;
  }

  /**
   * Guaranteed minimum number of digits
   *
   * @param  {number}      number
   * @param  {number}      digit      min digit
   * @param  {string}      filler
   *
   * @return {string}
   */
  numberMinDigit(number, digit = 2, filler = "0") {
    return (Array(digit).join(filler) + number).slice(-digit);
  }

  /**
   * Judge parameter type
   *
   * @return {bool}
   */
  isObject(x) {
    return Object.prototype.toString.call(x).slice(8, 14) === "Object";
  }

  /**
   * Judge parameter type
   *
   * @return {bool}
   */
  isArray(x) {
    return Object.prototype.toString.call(x).slice(8, 13) === "Array";
  }

  /**
   * Judge parameter is a dom element.
   *
   * @return {bool}
   */
  isElement(o) {
    return typeof HTMLElement === "object"
      ? o instanceof HTMLElement // DOM2
      : o &&
          typeof o === "object" &&
          o !== null &&
          o.nodeType === 1 &&
          typeof o.nodeName === "string";
  }

  /**
   * Judge parameter is a NetJSON network graph object.
   *
   * @return {bool}
   */
  isNetJSON(param) {
    if (param.nodes && param.links) {
      return (
        this.isObject(param) &&
        this.isArray(param.nodes) &&
        this.isArray(param.links)
      );
    }

    return false;
  }

  /**
   * Judge parameter is GeoJSON object.
   *
   * @return {bool}
   */
  isGeoJSON(param) {
    if (param.type && param.type === "FeatureCollection") {
      return this.isObject(param) && this.isArray(param.features);
    }

    if (param.type && param.type === "Feature") {
      return this.isObject(param) && this.isArray(param.geometry);
    }

    return false;
  }

  /**
   * Thin wrapper calling the dedicated converter in netjsongraph.geojson.js.
   * Keeping it here preserves public API while moving heavy logic out.
   */
  geojsonToNetjson(geojson) {
    return convertGeojson(geojson);
  }

  /**
   * merge two object deeply
   *
   * @param  {object}
   *
   * @return {object}      targetObj
   */
  deepMergeObj(...args) {
    const objs = [...args].reverse();
    const len = objs.length;

    for (let i = 0; i < len - 1; i += 1) {
      const originObj = objs[i];
      const targetObj = objs[i + 1];
      if (
        originObj &&
        targetObj &&
        this.isObject(targetObj) &&
        this.isObject(originObj)
      ) {
        Object.keys(originObj).forEach((attr) => {
          if (
            !targetObj[attr] ||
            !(this.isObject(targetObj[attr]) && this.isObject(originObj[attr]))
          ) {
            targetObj[attr] = originObj[attr];
          } else {
            this.deepMergeObj(targetObj[attr], originObj[attr]);
          }
        });
      } else if (!targetObj) {
        objs[i + 1] = originObj;
      }
    }

    return objs[len - 1];
  }

  /**
   * Create clusters of nodes based on spatial proximity and optional attribute grouping.
   * Mathematical reasoning and operations are explained inline.
   */
  makeCluster(self) {
    const {nodes, links} = self.data;
    const nonClusterNodes = [];
    const nonClusterLinks = [];
    const clusters = [];
    const nodeMap = new Map();
    let clusterId = 0;

    // 1. Project all nodes to screen (pixel) coordinates for spatial clustering
    nodes.forEach((node) => {
      // Normalize location reference (GeoJSON may store it under properties.location)
      const loc = (node.properties && node.properties.location) || node.location;
      if (!loc || loc.lat === undefined || loc.lng === undefined) {
        return; // Skip nodes without valid coordinates
      }

      // Ensure `node.location` exists for downstream code
      node.location = loc;

      // Preserve original geographic coordinates and restore them on every pass
      if (!node._origLocation) {
        node._origLocation = { lat: loc.lat, lng: loc.lng };
      } else {
        loc.lat = node._origLocation.lat;
        loc.lng = node._origLocation.lng;
      }

      // Convert geographic coordinates (lat, lng) to pixel coordinates (x, y)
      const pt = self.leaflet.latLngToContainerPoint([loc.lat, loc.lng]);
      node.x = pt.x;
      node.y = pt.y;

      node.visited = false;
      node.cluster = null;
    });

    // 2. Build a spatial index for fast neighbor search
    const index = new KDBush(nodes.length);
    nodes.forEach(({x, y}) => index.add(x, y));
    index.finish();

    // Helper to get cluster symbol size (for overlap calculations)
    const symbolSizeSetting =
      self.config &&
      self.config.mapOptions &&
      self.config.mapOptions.clusterConfig &&
      self.config.mapOptions.clusterConfig.symbolSize;
    const getClusterSymbolSize = (count) => {
      if (typeof symbolSizeSetting === "function") {
        try {
          return symbolSizeSetting(count);
        } catch (e) {
          return 30; // fallback
        }
      }
      if (Array.isArray(symbolSizeSetting)) {
        return symbolSizeSetting[0] || 30;
      }
      return typeof symbolSizeSetting === "number" ? symbolSizeSetting : 30;
    };

    const locationGroups = new Map();
    nodes.forEach((node) => {
      if (node.visited) return;

      // 3. Find all neighbors within clusterRadius in pixel space
      // For a node at (x, y), find all nodes (xi, yi) such that:
      // sqrt((xi - x)^2 + (yi - y)^2) <= clusterRadius
      // This is the Euclidean distance formula in 2D.
      const neighbors = index
        .within(node.x, node.y, self.config.clusterRadius)
        .map((id) => nodes[id]);

      if (neighbors.length > 1) {
        // Group by rounded pixel location (to avoid floating point issues)
        const key = `${Math.round(node.x)},${Math.round(node.y)}`;
        if (!locationGroups.has(key)) {
          locationGroups.set(key, new Map());
        }
        const groupByAttribute = locationGroups.get(key);

        // 4. Further group by attribute if configured (e.g., status)
        neighbors.forEach((n) => {
          if (n.visited) return;
          const attr = self.config.clusteringAttribute
            ? n.properties[self.config.clusteringAttribute]
            : "default";
          if (!groupByAttribute.has(attr)) {
            groupByAttribute.set(attr, []);
          }
          groupByAttribute.get(attr).push(n);
          n.visited = true;
        });
      } else {
        // Node is isolated, not clustered
        node.visited = true;
        nodeMap.set(node.id, null);
        nonClusterNodes.push(node);
      }
    });

    // 5. For each pixel location, process attribute groups
    locationGroups.forEach((attributeGroups) => {
      const groupsArray = Array.from(attributeGroups.entries());
      const groupsCount = groupsArray.length;

      // Find the largest symbol size among all groups (for overlap math)
      let maxSymbolSize = 0;
      groupsArray.forEach(([attr, gNodes]) => {
        const sz = getClusterSymbolSize(gNodes.length);
        if (sz > maxSymbolSize) {
          maxSymbolSize = sz;
        }
      });

      // Base separation (minimum distance between clusters)
      const baseSeparation =
        typeof self.config.clusterSeparation === "number"
          ? self.config.clusterSeparation
          : Math.max(10, Math.floor(self.config.clusterRadius / 2));

      // --- Separation Radius Calculation ---
      // If there are multiple attribute groups, arrange them in a circle
      // The minimal radius R is chosen so that the chord length between adjacent clusters
      // (2R * sin(pi/n)) is at least maxSymbolSize, where n = number of groups
      // Formula: R >= maxSymbolSize / (2 * sin(pi/n))
      let requiredRadius = 0;
      if (groupsCount > 1) {
        const angle = Math.PI / groupsCount;
        const sin = Math.sin(angle);
        if (sin > 0) {
          requiredRadius = maxSymbolSize / (2 * sin);
        }
      }
      // Final separation in pixels (ensures no overlap)
      // separationPx = max(baseSeparation, requiredRadius + 4)
      const separationPx = Math.max(baseSeparation, requiredRadius + 4);

      groupsArray.forEach(([attr, groupNodes], idx) => {
        if (groupNodes.length > 1) {
          // --- Centroid Calculation ---
          // Compute arithmetic mean of lat/lng for all nodes in the group
          // centroidLat = (lat1 + lat2 + ... + latN) / N
          // centroidLng = (lng1 + lng2 + ... + lngN) / N
          let centroidLng = 0;
          let centroidLat = 0;
          groupNodes.forEach((n) => {
            n.cluster = clusterId;
            nodeMap.set(n.id, n.cluster);
            centroidLng += n.location.lng;
            centroidLat += n.location.lat;
          });
          centroidLng /= groupNodes.length;
          centroidLat /= groupNodes.length;

          // --- Circular Arrangement for Multiple Attribute Groups ---
          if (groupsCount > 1) {
            // Each group is offset from the centroid by separationPx along a unique angle
            // angle_k = 2 * pi * idx / n
            // offsetX = separationPx * cos(angle_k), offsetY = separationPx * sin(angle_k)
            const angle = (2 * Math.PI * idx) / groupsCount;
            const basePoint = self.leaflet.latLngToContainerPoint([
              centroidLat,
              centroidLng,
            ]);
            // Offset in pixel space
            const offsetPoint = [
              basePoint.x + separationPx * Math.cos(angle),
              basePoint.y + separationPx * Math.sin(angle),
            ];
            // Convert back to lat/lng for display
            const offsetLatLng =
              self.leaflet.containerPointToLatLng(offsetPoint);
            centroidLng = offsetLatLng.lng;
            centroidLat = offsetLatLng.lat;
          }

          const cluster = {
            id: clusterId,
            cluster: true,
            name: groupNodes.length,
            value: [centroidLng, centroidLat],
            childNodes: groupNodes,
            ...self.config.mapOptions.clusterConfig,
          };

          if (self.config.clusteringAttribute) {
            const category = self.config.nodeCategories.find(
              (cat) => cat.name === attr,
            );
            if (category) {
              cluster.itemStyle = {
                ...cluster.itemStyle,
                color: category.nodeStyle.color,
              };
            }
          }

          clusters.push(cluster);
          clusterId += 1;
        } else if (groupNodes.length === 1) {
          // Always treat single nodes as non-clustered
          const node = groupNodes[0];
          nodeMap.set(node.id, null);
          nonClusterNodes.push(node);
        }
      });
    });

    // Only keep links between non-clustered nodes
    links.forEach((link) => {
      if (
        nodeMap.get(link.source) === null &&
        nodeMap.get(link.target) === null
      ) {
        nonClusterLinks.push(link);
      }
    });

    // --- Screen-Space Repulsion: Final Overlap Prevention ---
    // After initial placement, apply a simple force-directed repulsion to clusters and single nodes
    const repulsionElements = [
      ...clusters.map((c) => ({
        ref: c,
        isCluster: true,
        count: c.childNodes.length,
        get value() {
          return c.value;
        },
        set value([lng, lat]) {
          c.value = [lng, lat];
        },
      })),
      ...nonClusterNodes.map((n) => ({
        ref: n,
        isCluster: false,
        count: 1,
        get value() {
          return [n.location.lng, n.location.lat];
        },
        set value([lng, lat]) {
          n.location.lng = lng;
          n.location.lat = lat;
        },
      })),
    ];

    if (repulsionElements.length > 1) {
      // Prepare elements with positions and radii
      const elements = repulsionElements.map((el) => {
        // Convert lat/lng to pixel coordinates
        const [lng, lat] = el.value;
        const pt = self.leaflet.latLngToContainerPoint([lat, lng]);
        return {
          ref: el.ref,
          isCluster: el.isCluster,
          x: pt.x,
          y: pt.y,
          r: getClusterSymbolSize(el.count) / 2, // radius in pixels
          setValue: ([newLng, newLat]) => {
            el.value = [newLng, newLat];
          },
        };
      });

      const padding = 4; // extra space to avoid visual overlap
      const maxIterations = 5;
      for (let iter = 0; iter < maxIterations; iter += 1) {
        let adjusted = false;
        for (let i = 0; i < elements.length; i += 1) {
          for (let j = i + 1; j < elements.length; j += 1) {
            // Compute distance between centers
            const dx = elements[j].x - elements[i].x;
            const dy = elements[j].y - elements[i].y;
            const dist = Math.hypot(dx, dy);
            // Minimum allowed distance = sum of radii + padding
            const minDist = elements[i].r + elements[j].r + padding;
            if (dist > 0 && dist < minDist) {
              // Push apart
              const shift = (minDist - dist) / 2;
              const nx = dx / dist;
              const ny = dy / dist;
              elements[i].x -= nx * shift;
              elements[i].y -= ny * shift;
              elements[j].x += nx * shift;
              elements[j].y += ny * shift;
              adjusted = true;
            }
          }
        }
        if (!adjusted) break;
      }

      // Commit adjusted positions back to objects (convert to lat/lng)
      elements.forEach((el) => {
        const latlng = self.leaflet.containerPointToLatLng([el.x, el.y]);
        if (el.isCluster) {
          el.ref.value = [latlng.lng, latlng.lat];
        } else {
          el.ref.location.lng = latlng.lng;
          el.ref.location.lat = latlng.lat;
        }
      });
    }

    return {clusters, nonClusterNodes, nonClusterLinks};
  }

  /**
   * @function
   * @name updateMetadata
   *
   * @this  {object}   NetJSONGraph object
   *
   */
  updateMetadata() {
    if (this.config.metadata) {
      const metaData = this.utils.getMetadata(this.data);
      const metadataContainer = document.querySelector(".njg-metaData");
      const metadataChildren = document.querySelectorAll(".njg-metaDataItems");

      for (let i = 0; i < metadataChildren.length; i += 1) {
        metadataChildren[i].remove();
      }

      Object.keys(metaData).forEach((key) => {
        const metaDataItems = document.createElement("div");
        metaDataItems.classList.add("njg-metaDataItems");
        const keyLabel = document.createElement("span");
        keyLabel.setAttribute("class", "njg-keyLabel");
        const valueLabel = document.createElement("span");
        valueLabel.setAttribute("class", "njg-valueLabel");
        keyLabel.innerHTML = key;
        valueLabel.innerHTML = metaData[key];
        metaDataItems.appendChild(keyLabel);
        metaDataItems.appendChild(valueLabel);
        metadataContainer.appendChild(metaDataItems);
      });
    }
  }

  /**
   * @function
   * @name getMetadata
   *
   * Get metadata dom string.
   *
   * @this   {object}   NetJSONGraph object
   * @return {string}   Dom string
   */
  getMetadata(data) {
    const attrs = [
      "protocol",
      "version",
      "revision",
      "metric",
      "router_id",
      "topology_id",
    ];
    const metadata = data;
    const metaDataObj = {};

    if (metadata.label) {
      metaDataObj.label = metadata.label;
    }
    attrs.forEach((attr) => {
      if (metadata[attr]) {
        metaDataObj[attr] = metadata[attr];
      }
    });

    metaDataObj.nodes = metadata.nodes.length;
    metaDataObj.links = metadata.links.length;
    return metaDataObj;
  }

  /**
   * @function
   * @name nodeInfo
   *
   * Parse the information of incoming node data.
   * @param  {object}    node
   *
   * @return {string}    html dom string
   */

  nodeInfo(node) {
    const nodeInfo = {};

    // Show public id/label only when they were provided by the data source.
    // eslint-disable-next-line no-underscore-dangle
    const identityIsPublic = !node._generatedIdentity;

    if (identityIsPublic) {
      nodeInfo.id = node.id;
      if (node.label && typeof node.label === "string") {
        nodeInfo.label = node.label;
      }
    }

    if (node.name) {
      nodeInfo.name = node.name;
    }
    if (node.location) {
      nodeInfo.location = node.location;
    }

    if (node.properties) {
      Object.keys(node.properties).forEach((key) => {
        if (key === "location") {
          nodeInfo[key] = {
            lat: node.properties.location.lat,
            lng: node.properties.location.lng,
          };
        } else if (key === "time") {
          const time = this.dateParse({
            dateString: node.properties[key],
          });
          nodeInfo[key] = time;
        } else if (
          typeof node.properties[key] === "object" ||
          key.startsWith("_")
        ) {
          // Skip nested objects and internal metadata
          // eslint-disable-next-line no-useless-return
          return;
        } else {
          nodeInfo[key.replace(/_/g, " ")] = node.properties[key];
        }
      });
    }
    if (node.linkCount) {
      nodeInfo.links = node.linkCount;
    }
    if (node.local_addresses) {
      nodeInfo.localAddresses = node.local_addresses;
    }

    return nodeInfo;
  }

  createTooltipItem(key, value) {
    const item = document.createElement("div");
    item.classList.add("njg-tooltip-item");
    const keyLabel = document.createElement("span");
    keyLabel.setAttribute("class", "njg-tooltip-key");
    const valueLabel = document.createElement("span");
    valueLabel.setAttribute("class", "njg-tooltip-value");
    keyLabel.innerHTML = key;
    valueLabel.innerHTML = value;
    item.appendChild(keyLabel);
    item.appendChild(valueLabel);
    return item;
  }

  getNodeTooltipInfo(node) {
    const container = document.createElement("div");
    container.classList.add("njg-tooltip-inner");

    // Show public id/label only when they were provided by the data source.
    // eslint-disable-next-line no-underscore-dangle
    const identityIsPublic = !node._generatedIdentity;

    if (identityIsPublic && node.id) {
      container.appendChild(this.createTooltipItem("id", node.id));
    }
    if (identityIsPublic && node.label && typeof node.label === "string") {
      container.appendChild(this.createTooltipItem("label", node.label));
    }

    if (node.properties) {
      Object.keys(node.properties).forEach((key) => {
        if (typeof node.properties[key] === "object" || key.startsWith("_")) {
          return;
        }
        if ((key === "id" || key === "label") && identityIsPublic) {
          return;
        }
        if (key === "location") {
          container.appendChild(
            this.createTooltipItem(
              "location",
              `${Math.round(node.properties.location.lat * 1000) / 1000}, ${
                Math.round(node.properties.location.lng * 1000) / 1000
              }`,
            ),
          );
        } else if (key === "time") {
          const time = this.dateParse({
            dateString: node.properties[key],
          });
          container.appendChild(this.createTooltipItem("time", time));
        } else {
          container.appendChild(
            this.createTooltipItem(
              `${key.replace(/_/g, " ")}`,
              node.properties[key],
            ),
          );
        }
      });
    }
    if (node.linkCount) {
      container.appendChild(this.createTooltipItem("Links", node.linkCount));
    }
    if (node.local_addresses) {
      container.appendChild(
        this.createTooltipItem(
          "Local Addresses",
          node.local_addresses.join("<br/>"),
        ),
      );
    }
    return container;
  }

  getLinkTooltipInfo(link) {
    const container = document.createElement("div");
    container.classList.add("njg-tooltip-inner");

    const isGeneratedId = (val) =>
      typeof val === "string" && val.startsWith("gjn_");

    if (!isGeneratedId(link.source)) {
      container.appendChild(this.createTooltipItem("source", link.source));
    }
    if (!isGeneratedId(link.target)) {
      container.appendChild(this.createTooltipItem("target", link.target));
    }

    if (link.cost !== undefined && link.cost !== null) {
      container.appendChild(this.createTooltipItem("cost", link.cost));
    }

    if (link.properties) {
      Object.keys(link.properties).forEach((key) => {
        const val = link.properties[key];
        if (val === undefined || val === null) return;

        if (key === "time") {
          const time = this.dateParse({dateString: val});
          container.appendChild(this.createTooltipItem("time", time));
        } else {
          const displayVal =
            typeof val === "string" ? val.replace(/\n/g, "<br/>") : val;
          container.appendChild(
            this.createTooltipItem(`${key.replace(/_/g, " ")}`, displayVal),
          );
        }
      });
    }
    return container;
  }

  /**
   * @function
   * @name linkInfo
   *
   * Parse the infomation of incoming link data.
   * @param  {object}    link
   *
   * @return {string}    html dom string
   */

  linkInfo(link) {
    const linkInfo = {};

    const isGeneratedId = (val) =>
      typeof val === "string" && val.startsWith("gjn_");

    // Only include source/target if they are not autogenerated ids
    if (!isGeneratedId(link.source)) {
      linkInfo.source = link.source;
    }
    if (!isGeneratedId(link.target)) {
      linkInfo.target = link.target;
    }

    if (link.cost !== undefined && link.cost !== null) {
      linkInfo.cost = link.cost;
    }

    if (link.properties) {
      Object.keys(link.properties).forEach((key) => {
        const val = link.properties[key];
        if (val === undefined || val === null) return;

        if (key === "time") {
          const time = this.dateParse({dateString: val});
          linkInfo[key] = time;
        } else {
          const displayVal =
            typeof val === "string" ? val.replace(/\n/g, "<br/>") : val;
          linkInfo[key.replace(/_/g, " ")] = displayVal;
        }
      });
    }

    return linkInfo;
  }

  generateStyle(styleConfig, item) {
    const styles =
      typeof styleConfig === "function" ? styleConfig(item) : styleConfig;
    return styles;
  }

  getNodeStyle(node, config, type) {
    let nodeStyleConfig;
    let nodeSizeConfig = {};
    let nodeEmphasisConfig = {};
    let categoryFound = false;

    if (
      node.category &&
      config.nodeCategories &&
      config.nodeCategories.length
    ) {
      const category = config.nodeCategories.find(
        (cat) => cat.name === node.category,
      );

      if (category) {
        categoryFound = true;
        nodeStyleConfig = this.generateStyle(category.nodeStyle || {}, node);
        nodeSizeConfig = this.generateStyle(category.nodeSize || {}, node);

        let emphasisNodeStyle = {};
        let emphasisNodeSize = {};

        if (category.emphasis) {
          emphasisNodeStyle = this.generateStyle(
            category.emphasis.nodeStyle || {},
            node,
          );
          // Corrected typo: empahsis -> emphasis
          emphasisNodeSize = this.generateStyle(
            category.emphasis.nodeSize || {},
            node,
          );
          nodeEmphasisConfig = {
            nodeStyle: emphasisNodeStyle,
            nodeSize: emphasisNodeSize,
          };
        }
      }
    }

    if (!categoryFound) {
      if (type === "map") {
        const nodeConf = config.mapOptions && config.mapOptions.nodeConfig;
        nodeStyleConfig = this.generateStyle(
          (nodeConf && nodeConf.nodeStyle) || {},
          node,
        );
        nodeSizeConfig = this.generateStyle(
          (nodeConf && nodeConf.nodeSize) || {},
          node,
        );

        const emphasisConf = nodeConf && nodeConf.emphasis;
        if (emphasisConf) {
          nodeEmphasisConfig = {
            nodeStyle: this.generateStyle(
              (emphasisConf && emphasisConf.nodeStyle) || {},
              node,
            ),
            nodeSize: this.generateStyle(
              (emphasisConf && emphasisConf.nodeSize) || {},
              node,
            ),
          };
        }
      } else {
        const seriesConf = config.graphConfig && config.graphConfig.series;
        nodeStyleConfig = this.generateStyle(
          (seriesConf && seriesConf.nodeStyle) || {},
          node,
        );
        nodeSizeConfig = this.generateStyle(
          (seriesConf && seriesConf.nodeSize) || {},
          node,
        );

        const emphasisConf = seriesConf && seriesConf.emphasis;
        if (emphasisConf) {
          nodeEmphasisConfig = {
            nodeStyle: this.generateStyle(
              (emphasisConf && emphasisConf.itemStyle) || {},
              node,
            ),

            nodeSize: this.generateStyle(
              (emphasisConf && emphasisConf.symbolSize) || nodeSizeConfig || {},
              node,
            ),
          };
        }
      }
    }

    return {nodeStyleConfig, nodeSizeConfig, nodeEmphasisConfig};
  }

  getLinkStyle(link, config, type) {
    let linkStyleConfig;
    let linkEmphasisConfig = {};
    if (link.category && config.linkCategories.length) {
      const category = config.linkCategories.find(
        (cat) => cat.name === link.category,
      );

      linkStyleConfig = this.generateStyle(category.linkStyle || {}, link);

      linkEmphasisConfig = {
        ...linkEmphasisConfig,
        linkStyle: category.emphasis
          ? this.generateStyle(category.emphasis.linkStyle || {}, link)
          : {},
      };
    } else if (type === "map") {
      linkStyleConfig = this.generateStyle(
        config.mapOptions.linkConfig.linkStyle,
        link,
      );
    } else {
      linkStyleConfig = this.generateStyle(
        config.graphConfig.series.linkStyle,
        link,
      );
    }

    return {linkStyleConfig, linkEmphasisConfig};
  }

  /**
   * @function
   * @name showLoading
   * display loading animation
   *
   * @this {object}      netjsongraph
   *
   * @return {object}    html dom
   */

  showLoading() {
    let loadingContainer = this.el.querySelector(".njg-loadingContainer");

    if (!loadingContainer) {
      loadingContainer = document.createElement("div");
      loadingContainer.classList.add("njg-loadingContainer");
      loadingContainer.innerHTML = `
        <div class="loadingElement">
          <div class="loadingSprite"></div>
          <p class="loadingTip">Loading...</p>
        </div>
      `;

      this.el.appendChild(loadingContainer);
    } else {
      loadingContainer.style.visibility = "visible";
    }

    return loadingContainer;
  }

  /**
   * @function
   * @name hideLoading
   * cancel loading animation
   *
   * @this {object}      netjsongraph
   *
   * @return {object}    html dom
   */

  hideLoading() {
    const loadingContainer = this.el.querySelector(".njg-loadingContainer");

    if (loadingContainer) {
      loadingContainer.style.visibility = "hidden";
    }

    return loadingContainer;
  }

  createEvent() {
    const events = new Map();
    const eventsOnce = new Map();
    return {
      on(key, ...res) {
        events.set(key, [...(events.get(key) || []), ...res]);
      },
      once(key, ...res) {
        eventsOnce.set(key, [...(eventsOnce.get(key) || []), ...res]);
      },
      emit(key) {
        const funcs = events.get(key) || [];
        const funcsOnce = eventsOnce.get(key) || [];
        const res = funcs.map((func) => func());
        const resOnce = funcsOnce.map((func) => func());
        eventsOnce.delete(key);
        return [...res, ...resOnce];
      },
      delete(key) {
        events.delete(key);
        eventsOnce.delete(key);
      },
    };
  }
}

export default NetJSONGraphUtil;
