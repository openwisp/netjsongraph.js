/**
 * @class
 * NetJSONGraphGUI - User interface components and controls management.
 *
 * Main Responsibilities:
 * - Creates DOM elements for controls and information panels
 * - Manages metadata display and node/link details
 * - Handles UI interactions and event binding
 * - Maintains responsive design and accessibility
 */
class NetJSONGraphGUI {
  constructor(_this) {
    this.self = _this;
    this.renderModeSelector = null;
    this.controls = null;
    this.sideBar = null;
    this.metaInfoContainer = null;
    this.nodeLinkInfoContainer = null;
  }

  createControls() {
    const controls = document.createElement("div");
    controls.setAttribute("class", "njg-controls");
    this.self.el.appendChild(controls);
    return controls;
  }

  createRenderModeSelector() {
    const selectIconContainer = document.createElement("div");
    const iconEye = document.createElement("span");
    iconEye.setAttribute("class", "iconfont icon-eye");
    selectIconContainer.setAttribute("class", "njg-selectIcon");
    selectIconContainer.appendChild(iconEye);
    this.controls.appendChild(selectIconContainer);
    return selectIconContainer;
  }

  createSideBar() {
    const sideBar = document.createElement("div");
    sideBar.setAttribute("class", "njg-sideBar");
    sideBar.classList.add("hidden");
    const button = document.createElement("button");
    sideBar.appendChild(button);
    button.classList.add("sideBarHandle");
    button.onclick = () => {
      sideBar.classList.toggle("hidden");
      const metaInfo = document.querySelector(".njg-metaInfoContainer");
      if (
        (this.self.config.showMetaOnNarrowScreens || this.self.el.clientWidth > 850) &&
        metaInfo
      ) {
        metaInfo.style.display = "flex";
      }
    };
    this.self.el.appendChild(sideBar);
    return sideBar;
  }

  hideInfoOnNarrowScreen() {
    if (!this.self.config.showMetaOnNarrowScreens && this.self.el.clientWidth < 850) {
      this.metaInfoContainer.style.display = "none";
    }

    if (
      this.metaInfoContainer.style.display === "none" &&
      this.nodeLinkInfoContainer.style.display === "none"
    ) {
      this.sideBar.classList.add("hidden");
    }
  }

  createMetaInfoContainer() {
    const metaInfoContainer = document.createElement("div");
    const header = document.createElement("h2");
    const metadataContainer = document.createElement("div");

    metadataContainer.classList.add("njg-metaData");
    metaInfoContainer.classList.add("njg-metaInfoContainer");
    const closeButton = document.createElement("span");
    closeButton.classList.add("njg-closeButton");
    header.innerHTML = "Info";
    closeButton.innerHTML = " &#x2715;";
    header.appendChild(closeButton);
    metaInfoContainer.appendChild(header);
    metaInfoContainer.appendChild(metadataContainer);
    this.metaInfoContainer = metaInfoContainer;
    this.sideBar.appendChild(metaInfoContainer);
    this.nodeLinkInfoContainer = this.createNodeLinkInfoContainer();
    this.hideInfoOnNarrowScreen();
    window.addEventListener("resize", this.hideInfoOnNarrowScreen.bind(this));

    closeButton.onclick = () => {
      this.metaInfoContainer.style.display = "none";
      if (this.nodeLinkInfoContainer.style.display === "none") {
        this.sideBar.classList.add("hidden");
      }
    };

    return metaInfoContainer;
  }

  createNodeLinkInfoContainer() {
    const nodeLinkInfoContainer = document.createElement("div");
    nodeLinkInfoContainer.classList.add("njg-nodeLinkInfoContainer");
    nodeLinkInfoContainer.style.display = "none";
    this.sideBar.appendChild(nodeLinkInfoContainer);
    return nodeLinkInfoContainer;
  }

  getNodeLinkInfo(type, data) {
    const nodeLinkInfoChildren = document.querySelectorAll(".njg-infoContainer");
    const headerInfoChildren = document.querySelectorAll(".njg-headerContainer");
    for (let i = 0; i < nodeLinkInfoChildren.length; i += 1) {
      nodeLinkInfoChildren[i].remove();
    }

    for (let i = 0; i < headerInfoChildren.length; i += 1) {
      headerInfoChildren[i].remove();
    }

    const headerContainer = document.createElement("div");
    const infoContainer = document.createElement("div");
    const header = document.createElement("h2");
    const closeButton = document.createElement("span");

    infoContainer.classList.add("njg-infoContainer");
    headerContainer.classList.add("njg-headerContainer");
    closeButton.classList.add("njg-closeButton");
    this.nodeLinkInfoContainer.style.display = "flex";
    header.innerHTML = `${type} Info`;
    closeButton.innerHTML = " &#x2715;";

    // Key label normalization to improve readability
    const formatKeyLabel = (k) => {
      if (k === "clients") {
        return "Clients";
      }
      if (/^clients\s*\[\d+\]$/i.test(k)) {
        return k.replace(/^clients/i, "Client");
      }
      if (k === "localAddresses") {
        return "Local Addresses";
      }
      return k.replace(/_/g, " ");
    };

    // Recursive renderer for nested objects/arrays so every detail is visible
    const renderEntry = (parent, key, val, depth = 0) => {
      // Hide undefined/null and empty strings (except "0")
      if (
        val === undefined ||
        val === null ||
        (typeof val === "string" &&
          (val.trim() === "" || /^(undefined|null)$/i.test(val.trim())) &&
          val !== "0")
      ) {
        return;
      }

      // Handle arrays
      if (Array.isArray(val)) {
        if (val.length === 0) {
          const item = document.createElement("div");
          item.classList.add("njg-infoItems");
          item.style.paddingLeft = `${depth * 12}px`;
          const k = document.createElement("span");
          k.setAttribute("class", "njg-keyLabel");
          const v = document.createElement("span");
          v.setAttribute("class", "njg-valueLabel");
          k.innerHTML = formatKeyLabel(key);
          v.innerHTML = "[]";
          item.appendChild(k);
          item.appendChild(v);
          parent.appendChild(item);
          return;
        }
        // If array of primitives, show as multiline
        if (val.every((x) => typeof x !== "object" || x === null)) {
          const item = document.createElement("div");
          item.classList.add("njg-infoItems");
          item.style.paddingLeft = `${depth * 12}px`;
          const k = document.createElement("span");
          k.setAttribute("class", "njg-keyLabel");
          const v = document.createElement("span");
          v.setAttribute("class", "njg-valueLabel");
          k.innerHTML = formatKeyLabel(key);
          v.innerHTML = val
            .map((x) => (typeof x === "string" ? x.replace(/\n/g, "<br/>") : String(x)))
            .join("<br/>");
          item.appendChild(k);
          item.appendChild(v);
          parent.appendChild(item);
          return;
        }
        // Otherwise, render each element recursively
        val.forEach((child, idx) => {
          renderEntry(parent, `${key} [${idx + 1}]`, child, depth);
        });
        return;
      }

      // Handle plain objects (including location)
      if (typeof val === "object") {
        // Special pretty-print for {lat,lng}
        if (
          key === "location" &&
          typeof val.lat === "number" &&
          typeof val.lng === "number"
        ) {
          const item = document.createElement("div");
          item.classList.add("njg-infoItems");
          item.style.paddingLeft = `${depth * 12}px`;
          const k = document.createElement("span");
          k.setAttribute("class", "njg-keyLabel");
          const v = document.createElement("span");
          v.setAttribute("class", "njg-valueLabel");
          k.innerHTML = "Location";
          v.innerHTML = `${Math.round(val.lat * 1000) / 1000}, ${
            Math.round(val.lng * 1000) / 1000
          }`;
          item.appendChild(k);
          item.appendChild(v);
          parent.appendChild(item);
          return;
        }

        // Header row for the object key
        const headerItem = document.createElement("div");
        headerItem.classList.add("njg-infoItems");
        headerItem.style.paddingLeft = `${depth * 12}px`;
        const hk = document.createElement("span");
        hk.setAttribute("class", "njg-keyLabel");
        const hv = document.createElement("span");
        hv.setAttribute("class", "njg-valueLabel");
        hk.innerHTML = formatKeyLabel(key);
        hv.innerHTML = "";
        headerItem.appendChild(hk);
        headerItem.appendChild(hv);
        parent.appendChild(headerItem);

        Object.keys(val).forEach((childKey) => {
          renderEntry(parent, childKey, val[childKey], depth + 1);
        });
        return;
      }

      // Primitive value
      const infoItems = document.createElement("div");
      infoItems.classList.add("njg-infoItems");
      infoItems.style.paddingLeft = `${depth * 12}px`;
      const keyLabel = document.createElement("span");
      keyLabel.setAttribute("class", "njg-keyLabel");
      const valueLabel = document.createElement("span");
      valueLabel.setAttribute("class", "njg-valueLabel");
      keyLabel.innerHTML = formatKeyLabel(key);
      const displayVal =
        typeof val === "string" ? val.replace(/\n/g, "<br/>") : String(val);
      valueLabel.innerHTML = displayVal;
      infoItems.appendChild(keyLabel);
      infoItems.appendChild(valueLabel);
      parent.appendChild(infoItems);
    };

    Object.keys(data).forEach((key) => renderEntry(infoContainer, key, data[key], 0));
    headerContainer.appendChild(header);
    headerContainer.appendChild(closeButton);
    this.nodeLinkInfoContainer.appendChild(headerContainer);
    this.nodeLinkInfoContainer.appendChild(infoContainer);

    closeButton.onclick = () => {
      this.nodeLinkInfoContainer.style.display = "none";
      if (
        this.metaInfoContainer === null ||
        this.metaInfoContainer.style.display === "none"
      ) {
        this.sideBar.classList.add("hidden");
      }
    };
  }

  /**
   * Load and display a popup for a node on the map using leaflet popup
   * @param {Object} node - The node data containing location and properties
   * @returns {void}
   */
  async loadNodePopup(node) {
    if (!this.self.leaflet) {
      console.error("Leaflet map not available. Cannot load popup.");
      return;
    }
    this.self.echarts?.setOption({
      media: [{option: {tooltip: {show: false}}}],
    });
    this.self.utils.updateLabelVisibility(this.self, false);
    const nodeLocation = node?.properties?.location || node?.location;
    if (!nodeLocation) {
      console.error("Node location not available. Cannot load popup.");
      return;
    }
    const bookmarkableActionId =
      this.self.config.bookmarkableActions && this.self.config.bookmarkableActions.id;
    let popupContent = this.self.config.mapOptions.nodePopup.content;
    if (popupContent == null) {
      popupContent = this.createDefaultPopupContent(node);
    } else if (typeof popupContent === "function") {
      const popupRequest = popupContent.call(this, node, this.self);
      this.self.leaflet.currentPopupRequest = popupRequest;
      try {
        popupContent = await popupRequest;
      } catch (error) {
        this.self.utils.removeUrlFragment(bookmarkableActionId, "nodeId");
        if (this.self.leaflet.currentPopupRequest !== popupRequest) {
          return;
        }
        console.error("Failed to build node popup content:", error);
        return;
      }
      if (this.self.leaflet.currentPopupRequest !== popupRequest) {
        this.self.utils.removeUrlFragment(bookmarkableActionId, "nodeId");
        return;
      }
    }
    const popupConfigInput = this.self.config.mapOptions.nodePopup.config || {};
    const popupConfig = Object.fromEntries(
      Object.entries(popupConfigInput).filter(([, value]) => value != null),
    );

    const popup = window.L.popup({
      ...popupConfig,
    })
      .setLatLng(nodeLocation)
      .setContent(popupContent)
      .openOn(this.self.leaflet);

    this.self.leaflet.currentPopup = popup;
    const {onOpen} = this.self.config.mapOptions.nodePopup;
    if (onOpen && typeof onOpen === "function") {
      try {
        onOpen.call(this, this.self);
      } catch (error) {
        this.self.utils.removeUrlFragment(bookmarkableActionId, "nodeId");
        console.error("Failed to run popup onOpen callback:", error);
      }
    }
    const popupElement = popup
      .getElement()
      ?.querySelector(".leaflet-popup-close-button");
    popupElement?.addEventListener("click", () => {
      this.self.echarts?.setOption({
        media: [{option: {tooltip: {show: true}}}],
      });
      this.self.utils.updateLabelVisibility(this.self, true);
      this.self.utils.removeUrlFragment(bookmarkableActionId, "nodeId");
    });
  }

  createDefaultPopupContent(node) {
    const popupContent = document.createElement("div");
    popupContent.classList.add("default-popup");
    const location = node?.location || node?.properties?.location;
    const lat = Number(location?.lat);
    const lng = Number(location?.lng);
    const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);
    const fields = {
      name: node?.name,
      id: node?.id,
      label: node?.label,
      location: hasCoords ? `${lat.toFixed(8)}, ${lng.toFixed(8)}` : null,
    };
    Object.keys(fields).forEach((key) => {
      const value = fields[key];
      if (!value) {
        return;
      }
      const item = document.createElement("div");
      item.classList.add("njg-tooltip-item");
      const keyLabel = document.createElement("span");
      keyLabel.classList.add("njg-tooltip-key");
      keyLabel.textContent = key;
      const valueLabel = document.createElement("span");
      valueLabel.classList.add("njg-tooltip-value");
      valueLabel.textContent = String(value);
      item.appendChild(keyLabel);
      item.appendChild(valueLabel);
      popupContent.appendChild(item);
    });
    return popupContent;
  }

  init() {
    this.sideBar = this.createSideBar();
    if (this.self.config.switchMode) {
      this.controls = this.createControls();
      this.renderModeSelector = this.createRenderModeSelector();
    }
  }
}

export default NetJSONGraphGUI;
