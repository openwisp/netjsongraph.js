class NetJSONGraphGUI {
  constructor(_this) {
    this.self = _this;
    this.renderModeSelector = null;
    this.controls = null;
    this.sideBar = null;
    this.aboutContainer = null;
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
    const {body} = document;
    const button = document.createElement("button");
    sideBar.appendChild(button);

    button.classList.add("sideBarHandle");
    button.onclick = () => {
      sideBar.classList.toggle("hidden");
    };
    body.appendChild(sideBar);
    return sideBar;
  }

  createAboutContainer() {
    const metaData = this.self.utils.getMetadata(this.self.data);
    const aboutContainer = document.createElement("div");
    const header = document.createElement("h2");
    const metadataContainer = document.createElement("div");

    metadataContainer.classList.add("njg-metaData");
    aboutContainer.classList.add("njg-aboutContainer");

    header.innerHTML = "About";
    // for (let key in metaData) {
    //   const metaDataItems = document.createElement("div");
    //   metaDataItems.classList.add("njg-metaDataItems");
    //   const keyLabel = document.createElement("span");
    //   keyLabel.setAttribute("class", "njg-keyLabel");
    //   const valueLabel = document.createElement("span");
    //   keyLabel.innerHTML = key;
    //   valueLabel.innerHTML = metaData[key];
    //   metaDataItems.appendChild(keyLabel);
    //   metaDataItems.appendChild(valueLabel);
    //   metadataContainer.appendChild(metaDataItems);
    // }
    Object.keys(metaData).forEach((key) => {
      const metaDataItems = document.createElement("div");
      metaDataItems.classList.add("njg-metaDataItems");
      const keyLabel = document.createElement("span");
      keyLabel.setAttribute("class", "njg-keyLabel");
      const valueLabel = document.createElement("span");
      keyLabel.innerHTML = key;
      valueLabel.innerHTML = metaData[key];
      metaDataItems.appendChild(keyLabel);
      metaDataItems.appendChild(valueLabel);
      metadataContainer.appendChild(metaDataItems);
    });
    aboutContainer.appendChild(header);
    aboutContainer.appendChild(metadataContainer);
    this.sideBar.appendChild(aboutContainer);
    this.nodeLinkInfoContainer = this.createNodeLinkInfoContainer();
    return aboutContainer;
  }

  createNodeLinkInfoContainer() {
    const nodeLinkInfoContainer = document.createElement("div");
    nodeLinkInfoContainer.classList.add("njg-nodeLinkInfoContainer");
    nodeLinkInfoContainer.style.visibility = "hidden";
    this.sideBar.appendChild(nodeLinkInfoContainer);
    return nodeLinkInfoContainer;
  }

  getNodeLinkInfo(type, data) {
    const nodeLinkInfoChildren =
      document.querySelectorAll(".njg-infoContainer");
    const headerInfoChildren = document.querySelectorAll(
      ".njg-headerContainer",
    );
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
    closeButton.setAttribute("id", "closeButton");
    this.nodeLinkInfoContainer.style.visibility = "visible";
    header.innerHTML = `${type} Info`;
    closeButton.innerHTML = " &#x2715;";

    Object.keys(data).forEach((key) => {
      const infoItems = document.createElement("div");
      infoItems.classList.add("njg-infoItems");
      const keyLabel = document.createElement("span");
      keyLabel.setAttribute("class", "njg-keyLabel");
      const valueLabel = document.createElement("span");
      if (key === "location") {
        keyLabel.innerHTML = "Location";
        valueLabel.innerHTML = `${Math.round(data[key].lat * 1000) / 1000}, ${
          Math.round(data[key].lng * 1000) / 1000
        }`;
      } else {
        keyLabel.innerHTML = key;
        valueLabel.innerHTML = data[key];
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
      this.nodeLinkInfoContainer.style.visibility = "hidden";
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
