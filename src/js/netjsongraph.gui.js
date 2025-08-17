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

    Object.keys(data).forEach((key) => {
      const val = data[key];

      // Hide keys whose value is not provided or is explicitly undefined/null/empty
      if (
        val === undefined ||
        val === null ||
        (typeof val === "string" &&
          (val.trim() === "" || /^(undefined|null)$/i.test(val.trim())) &&
          val !== "0")
      ) {
        return;
      }

      const infoItems = document.createElement("div");
      infoItems.classList.add("njg-infoItems");
      const keyLabel = document.createElement("span");
      keyLabel.setAttribute("class", "njg-keyLabel");
      const valueLabel = document.createElement("span");
      valueLabel.setAttribute("class", "njg-valueLabel");
      if (key === "location") {
        keyLabel.innerHTML = "Location";
        valueLabel.innerHTML = `${Math.round(data[key].lat * 1000) / 1000}, ${
          Math.round(data[key].lng * 1000) / 1000
        }`;
      } else if (key === "localAddresses") {
        keyLabel.innerHTML = "Local Addresses";
        valueLabel.innerHTML = data[key].join("<br/>");
      } else {
        keyLabel.innerHTML = key;
        // Preserve multiline values
        const displayVal = typeof val === "string" ? val.replace(/\n/g, "<br/>") : val;
        valueLabel.innerHTML = displayVal;
      }

      infoItems.appendChild(keyLabel);
      infoItems.appendChild(valueLabel);
      infoContainer.appendChild(infoItems);
    });
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

  init() {
    this.sideBar = this.createSideBar();
    if (this.self.config.switchMode) {
      this.controls = this.createControls();
      this.renderModeSelector = this.createRenderModeSelector();
    }
  }
}

export default NetJSONGraphGUI;
