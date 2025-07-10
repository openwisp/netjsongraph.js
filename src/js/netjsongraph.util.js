import KDBush from "kdbush";

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
   * Convert a GeoJSON FeatureCollection into a NetJSON-style object
   * (nodes / links arrays) so that the rest of the pipeline can work
   * unchanged.  
   *
   * @param {Object} geojson  A GeoJSON FeatureCollection
   * @return {{nodes:Array, links:Array}}
   */
  geojsonToNetjson(geojson) {
    const nodes = [];
    const links = [];
    if (!geojson || !Array.isArray(geojson.features)) {
      return {nodes, links};
    }

    // Coordinate-string → nodeId  (deduplication across features)
    const coordMap = new Map();
    const createNode = (coord, baseProps = {}) => {
      const key = `${coord[0]},${coord[1]}`;
      if (coordMap.has(key)) {
        return coordMap.get(key); // reuse existing node id
      }
      const newId = `gjn_${nodes.length}`;
      const node = {
        id: newId,
        label: newId,
        location: {lng: coord[0], lat: coord[1]},
        properties: {...baseProps, location: {lng: coord[0], lat: coord[1]}},
      };
      nodes.push(node);
      coordMap.set(key, newId);
      return newId;
    };

    const addEdge = (sourceId, targetId, props = {}) => {
      links.push({source: sourceId, target: targetId, properties: props});
    };

    const processCoordsSeq = (coords, props, closeRing = false) => {
      for (let i = 0; i < coords.length - 1; i += 1) {
        const a = createNode(coords[i], props);
        const b = createNode(coords[i + 1], props);
        addEdge(a, b, props);
      }
      if (closeRing && coords.length > 2) {
        // close the polygon ring
        const first = createNode(coords[0], props);
        const last = createNode(coords[coords.length - 1], props);
        addEdge(last, first, props);
      }
    };

    const handleGeometry = (geometry, props) => {
      if (!geometry) return;
      const {type, coordinates, geometries} = geometry;
      switch (type) {
        case "Point":
          createNode(coordinates, props);
          break;
        case "MultiPoint":
          coordinates.forEach((pt) => createNode(pt, props));
          break;
        case "LineString":
          processCoordsSeq(coordinates, props, false);
          break;
        case "MultiLineString":
          coordinates.forEach((line) => processCoordsSeq(line, props, false));
          break;
        case "Polygon":
          coordinates.forEach((ring) => processCoordsSeq(ring, props, true));
          break;
        case "MultiPolygon":
          coordinates.forEach((poly) =>
            poly.forEach((ring) => processCoordsSeq(ring, props, true)),
          );
          break;
        case "GeometryCollection":
          geometries.forEach((g) => handleGeometry(g, props));
          break;
        default:
          console.warn(`Unsupported GeoJSON geometry type: ${type}`);
      }
    };

    geojson.features.forEach((feature) => {
      const baseProps = feature.properties || {};
      handleGeometry(feature.geometry, baseProps);
    });

    return {nodes, links};
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

  makeCluster(self) {
    const {nodes, links} = self.data;
    const nonClusterNodes = [];
    const nonClusterLinks = [];
    const clusters = [];
    const nodeMap = new Map();
    let clusterId = 0;

    nodes.forEach((node) => {
      node.y = self.leaflet.latLngToContainerPoint([
        node.location.lat,
        node.location.lng,
      ]).y;
      node.x = self.leaflet.latLngToContainerPoint([
        node.location.lat,
        node.location.lng,
      ]).x;
      node.visited = false;
      node.cluster = null;
    });

    const index = new KDBush(nodes.length);
    /* eslint-disable no-restricted-syntax */
    for (const {x, y} of nodes) index.add(x, y);
    /* eslint-enable no-restricted-syntax */
    index.finish();

    nodes.forEach((node) => {
      let cluster;
      let centroid = [0, 0];
      const addNode = (n) => {
        n.visited = true;
        n.cluster = clusterId;
        nodeMap.set(n.id, n.cluster);
        centroid[0] += n.location.lng;
        centroid[1] += n.location.lat;
      };
      if (!node.visited) {
        const neighbors = index
          .within(node.x, node.y, self.config.clusterRadius)
          .map((id) => nodes[id]);
        const results = neighbors.filter((n) => {
          if (self.config.clusteringAttribute) {
            if (
              n.properties[self.config.clusteringAttribute] ===
                node.properties[self.config.clusteringAttribute] &&
              n.cluster === null
            ) {
              addNode(n);
              return true;
            }
            return false;
          }

          if (n.cluster === null) {
            addNode(n);
            return true;
          }
          return false;
        });

        if (results.length > 1) {
          centroid = [
            centroid[0] / results.length,
            centroid[1] / results.length,
          ];
          cluster = {
            id: clusterId,
            cluster: true,
            name: results.length,
            value: centroid,
            childNodes: results,
            ...self.config.mapOptions.clusterConfig,
          };

          if (self.config.clusteringAttribute) {
            const {color} = self.config.nodeCategories.find(
              (cat) =>
                cat.name === node.properties[self.config.clusteringAttribute],
            ).nodeStyle;

            cluster.itemStyle = {
              ...cluster.itemStyle,
              color,
            };
          }

          clusters.push(cluster);
        } else if (results.length === 1) {
          nodeMap.set(results[0].id, null);
          nonClusterNodes.push(results[0]);
        }
        clusterId += 1;
      }
    });

    links.forEach((link) => {
      if (
        nodeMap.get(link.source) === null &&
        nodeMap.get(link.target) === null
      ) {
        nonClusterLinks.push(link);
      }
    });

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
    nodeInfo.id = node.id;
    if (node.label && typeof node.label === "string") {
      nodeInfo.label = node.label;
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

    if (node.id) {
      container.appendChild(this.createTooltipItem("id", node.id));
    }
    if (node.label && typeof node.label === "string") {
      container.appendChild(this.createTooltipItem("label", node.label));
    }

    if (node.properties) {
      Object.keys(node.properties).forEach((key) => {
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

    container.appendChild(this.createTooltipItem("source", link.source));
    container.appendChild(this.createTooltipItem("target", link.target));
    container.appendChild(this.createTooltipItem("cost", link.cost));
    if (link.properties) {
      Object.keys(link.properties).forEach((key) => {
        if (key === "time") {
          const time = this.dateParse({
            dateString: link.properties[key],
          });
          container.appendChild(this.createTooltipItem("time", time));
        } else {
          container.appendChild(
            this.createTooltipItem(
              `${key.replace(/_/g, " ")}`,
              link.properties[key],
            ),
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
    linkInfo.source = link.source;
    linkInfo.target = link.target;
    linkInfo.cost = link.cost;
    if (link.properties) {
      Object.keys(link.properties).forEach((key) => {
        if (key === "time") {
          const time = this.dateParse({
            dateString: link.properties[key],
          });
          linkInfo[key] = time;
        } else {
          linkInfo[key.replace(/_/g, " ")] = link.properties[key];
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
    if (node.category && config.nodeCategories.length) {
      const category = config.nodeCategories.find(
        (cat) => cat.name === node.category,
      );

      nodeStyleConfig = this.generateStyle(category.nodeStyle || {}, node);

      nodeSizeConfig = this.generateStyle(category.nodeSize || {}, node);

      nodeEmphasisConfig = {
        ...nodeEmphasisConfig,
        nodeStyle: category.emphasis
          ? this.generateStyle(category.emphasis.nodeStyle || {}, node)
          : {},
      };

      nodeEmphasisConfig = {
        ...nodeEmphasisConfig,
        nodeSize: category.empahsis
          ? this.generateStyle(category.emphasis.nodeSize || {}, node)
          : {},
      };
    } else if (type === "map") {
      nodeStyleConfig = this.generateStyle(
        config.mapOptions.nodeConfig.nodeStyle,
        node,
      );
      nodeSizeConfig = this.generateStyle(
        config.mapOptions.nodeConfig.nodeSize,
        node,
      );
    } else {
      nodeStyleConfig = this.generateStyle(
        config.graphConfig.series.nodeStyle,
        node,
      );
      nodeSizeConfig = this.generateStyle(
        config.graphConfig.series.nodeSize,
        node,
      );
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
