/* eslint-disable dot-notation */
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
      })
        .then((response) => {
          if (response.json) {
            return response.json();
          }
          return response;
        })
        .catch((msg) => {
          console.error(msg);
        });
    }
    return Promise.resolve(JSONParam);
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
   * @function
   * @name NetJSONMetadata
   * Display metadata of NetJSONGraph.
   *
   * @this   {object}   NetJSONGraph object
   *
   * @return {object} metadataContainer DOM
   */

  // NetJSONMetadata() {
  //   const metadataContainer = document.createElement("div");
  //   const innerDiv = document.createElement("div");
  //   const closeA = document.createElement("a");
  //   metadataContainer.setAttribute("class", "njg-metadata njg-container");
  //   metadataContainer.setAttribute("style", "display: block");
  //   innerDiv.setAttribute("class", "njg-inner");
  //   innerDiv.setAttribute("id", "metadata-innerDiv");
  //   closeA.setAttribute("class", "njg-close");
  //   closeA.setAttribute("id", "metadata-close");

  //   closeA.onclick = () => {
  //     metadataContainer.style.visibility = "hidden";
  //   };
  //   innerDiv.innerHTML = this.utils.getMetadata.call(this);
  //   metadataContainer.appendChild(innerDiv);
  //   metadataContainer.appendChild(closeA);

  //   return metadataContainer;
  // }

  /**
   * @function
   * @name updateMetadata
   *
   * @this  {object}   NetJSONGraph object
   *
   */
  // updateMetadata() {
  //   if (this.config.metadata) {
  //     document.getElementsByClassName("njg-metadata")[0].style.visibility =
  //       "visible";
  //     document.getElementById("metadata-innerDiv").innerHTML =
  //       this.utils.getMetadata.call(this);
  //   }
  // }

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
      // We only need this label property if it exists.
      metaDataObj["label"] = metadata.label;
    }
    attrs.forEach((attr) => {
      if (metadata[attr]) {
        metaDataObj[attr] = metadata[attr];
      }
    });

    metaDataObj["nodes"] = metadata.nodes.length;
    metaDataObj["links"] = metadata.links.length;
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
    nodeInfo["id"] = node.id;
    if (node.label && typeof node.label === "string") {
      nodeInfo["label"] = node.label;
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
      nodeInfo["linkCount"] = node.linkCount;
    }
    if (node.local_addresses) {
      nodeInfo["local_addresses"] = node.local_addresses;
    }

    return nodeInfo;
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
    linkInfo["source"] = link.source;
    linkInfo["target"] = link.target;
    linkInfo["cost"] = link.cost;
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
    let nodeSizeConfig;
    if (node.category && config.nodeCategories.length) {
      const category = config.nodeCategories.find(
        (cat) => cat.name === node.category,
      );
      nodeStyleConfig = this.generateStyle(category.nodeStyle, node);
      nodeSizeConfig = this.generateStyle(category.nodeSize, node);
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
    return {nodeStyleConfig, nodeSizeConfig};
  }

  getLinkStyle(link, config, type) {
    let linkStyleConfig;

    if (link.category && config.linkCategories.length) {
      const category = config.linkCategories.find(
        (cat) => cat.name === link.category,
      );
      linkStyleConfig = this.generateStyle(category.linkStyle, link);
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

    return {linkStyleConfig};
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
    let loadingContainer = document.getElementById("loadingContainer");

    if (!loadingContainer) {
      loadingContainer = document.createElement("div");
      loadingContainer.setAttribute("id", "loadingContainer");
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
    const loadingContainer = document.getElementById("loadingContainer");

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
