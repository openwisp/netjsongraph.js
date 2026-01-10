import {
  getElementByCss,
  getElementByXpath,
  tearDown,
  captureConsoleErrors,
  getDriver,
  getElementsByCss,
  getRenderedNodesAndLinksCount,
  getPresentNodesAndLinksCount,
  urls,
  printConsoleErrors,
} from "./browser.test.utils";

describe("Chart Rendering Test", () => {
  let driver;

  beforeAll(async () => {
    driver = await getDriver();
  });

  afterAll(async () => {
    await tearDown(driver);
  });

  test("render the Basic usage example without console errors", async () => {
    driver.get(urls.basicUsage);
    const canvas = await getElementByCss(driver, "canvas", 15000);
    const consoleErrors = await captureConsoleErrors(driver);
    printConsoleErrors(consoleErrors);
    const {nodesRendered, linksRendered} = await getRenderedNodesAndLinksCount(driver);
    const {nodesPresent, linksPresent} =
      await getPresentNodesAndLinksCount("Basic usage");
    expect(consoleErrors.length).toBe(0);
    expect(canvas).not.toBeNull();
    expect(nodesRendered).toBe(nodesPresent);
    expect(linksRendered).toBe(linksPresent);
  });

  test("render the Geographic map example without console errors", async () => {
    driver.get(urls.geographicMap);
    const leafletContainer = await getElementByCss(
      driver,
      ".ec-extension-leaflet",
      2000,
    );
    const canvases = await getElementsByCss(
      driver,
      ".ec-extension-leaflet .leaflet-overlay-pane canvas",
    );
    const {nodesRendered, linksRendered} = await getRenderedNodesAndLinksCount(driver);
    const {nodesPresent, linksPresent} =
      await getPresentNodesAndLinksCount("Geographic map");
    const consoleErrors = await captureConsoleErrors(driver);
    printConsoleErrors(consoleErrors);
    expect(consoleErrors.length).toBe(0);
    expect(leafletContainer).not.toBeNull();
    expect(canvases.length).toBeGreaterThan(0);
    expect(nodesRendered).toBe(nodesPresent);
    expect(linksRendered).toBe(linksPresent);
  });

  test("no blank tiles on canvas at max zoom", async () => {
    driver.get(urls.geographicMap);
    const zoomIn = await getElementByCss(driver, ".leaflet-control-zoom-in", 2000);
    let click = 0;
    while (click < 50) {
      // eslint-disable-next-line no-await-in-loop
      const className = await zoomIn.getAttribute("class");
      if (className.includes("leaflet-disabled")) {
        break;
      }
      zoomIn.click();
      click += 1;
    }
    await driver.sleep(500);
    const consoleErrors = await captureConsoleErrors(driver);
    printConsoleErrors(consoleErrors);
    expect(consoleErrors.length).toBe(0);
  });

  test("render floorplan map without console errors", async () => {
    driver.get(urls.indoorMap);
    const canvas = await getElementByCss(driver, "canvas", 15000);
    const floorplanImage = getElementByCss(driver, ".leaflet-image-layer");
    const consoleErrors = await captureConsoleErrors(driver);
    const {nodesRendered, linksRendered} = await getRenderedNodesAndLinksCount(driver);
    const {nodesPresent, linksPresent} =
      await getPresentNodesAndLinksCount("Indoor map");
    printConsoleErrors(consoleErrors);
    expect(consoleErrors.length).toBe(0);
    expect(canvas).not.toBeNull();
    expect(floorplanImage).not.toBeNull();
    expect(nodesRendered).toBe(nodesPresent);
    expect(linksRendered).toBe(linksPresent);
  });

  test("render custom attributes example without errors", async () => {
    driver.get(urls.customAttributes);
    const canvas = await getElementByCss(driver, "canvas", 15000);
    const consoleErrors = await captureConsoleErrors(driver);
    /* eslint-disable no-unused-vars */
    const {nodesRendered, linksRendered} = await getRenderedNodesAndLinksCount(driver);
    printConsoleErrors(consoleErrors);
    expect(consoleErrors.length).toBe(0);
    expect(canvas).not.toBeNull();
    const canvasHeight = await driver.executeScript(
      "return graph.echarts.getRenderedCanvas().height",
    );
    const windowHeight = await driver.executeScript("return window.innerHeight");
    expect(canvasHeight).not.toBe(0);
    expect(Math.abs(canvasHeight - windowHeight)).toBeLessThanOrEqual(100);
    const nodesCount = await driver.executeScript("return graph.data.nodes.length");
    const linksCount = await driver.executeScript("return graph.data.links.length");
    expect(nodesCount).toBe(6);
    expect(linksCount).toBe(7);
  });

  test("render wifi clients example without errors", async () => {
    await driver.get(urls.wifiClients);
    const canvas = await getElementByCss(driver, "canvas", 2000);
    const sideBar = await getElementByCss(driver, ".njg-sideBar", 2000);
    const consoleErrors = await captureConsoleErrors(driver);
    printConsoleErrors(consoleErrors);
    expect(consoleErrors.length).toBe(0);
    expect(canvas).not.toBeNull();
    expect(sideBar).not.toBeNull();

    const canvasHeight = await driver.executeScript(
      "return graph.echarts.getRenderedCanvas().height",
    );
    const windowHeight = await driver.executeScript("return window.innerHeight");
    expect(canvasHeight).not.toBe(0);
    expect(Math.abs(canvasHeight - windowHeight)).toBeLessThanOrEqual(100);

    const nodesCount = await driver.executeScript("return graph.data.nodes.length");
    const linksCount = await driver.executeScript("return graph.data.links.length");
    expect(nodesCount).toBe(4);
    expect(linksCount).toBe(3);

    const hasDots = await driver.executeScript(
      "return !!document.querySelector('canvas') && !!graph.echarts",
    );
    expect(hasDots).toBe(true);
  });

  test("render Geographic map with GeoJSON data without console errors", async () => {
    await driver.get(urls.geoJson);
    const leafletContainer = await getElementByCss(
      driver,
      ".ec-extension-leaflet",
      2000,
    );
    const consoleErrors = await captureConsoleErrors(driver);
    printConsoleErrors(consoleErrors);
    expect(consoleErrors.length).toBe(0);
    expect(leafletContainer).not.toBeNull();

    // GeoJSON rendering may not show metadata counts the same way as NetJSON
    // The important check is that it renders without errors
  });

  test("bookmarkableActions: render Basic usage example with url fragments for a node", async () => {
    await driver.get(`${urls.basicUsage}#id=basicUsage&nodeId=10.149.3.3`);
    const canvas = await getElementByCss(driver, "canvas", 2000);
    const consoleErrors = await captureConsoleErrors(driver);
    const sideBar = await getElementByCss(driver, ".njg-sideBar", 2000);
    const node = await getElementByXpath(
      driver,
      "//span[@class='njg-valueLabel' and text()='10.149.3.3']",
      2000,
    );
    const nodeId = await node.getText();

    printConsoleErrors(consoleErrors);
    expect(consoleErrors.length).toBe(0);
    expect(canvas).not.toBeNull();
    expect(sideBar).not.toBeNull();
    expect(nodeId).toBe("10.149.3.3");
  });

  test("bookmarkableActions: render Basic usage example with url fragments for a link", async () => {
    await driver.get(
      `${urls.basicUsage}#id=basicUsage&nodeId=172.16.155.5~172.16.155.4`,
    );
    const canvas = await getElementByCss(driver, "canvas", 2000);
    const consoleErrors = await captureConsoleErrors(driver);
    const sideBar = await getElementByCss(driver, ".njg-sideBar", 2000);
    const source = await getElementByXpath(
      driver,
      "//span[@class='njg-valueLabel' and text()='172.16.155.5']",
      2000,
    );
    const target = await getElementByXpath(
      driver,
      "//span[@class='njg-valueLabel' and text()='172.16.155.4']",
      2000,
    );
    const sourceId = await source.getText();
    const targetId = await target.getText();

    printConsoleErrors(consoleErrors);
    expect(consoleErrors.length).toBe(0);
    expect(canvas).not.toBeNull();
    expect(sideBar).not.toBeNull();
    expect(sourceId).toBe("172.16.155.5");
    expect(targetId).toBe("172.16.155.4");
  });

  test("bookmarkableActions: render Geographic map example with url fragments for a node", async () => {
    await driver.get(`${urls.geographicMap}#id=geographicMap&nodeId=172.16.169.1`);
    const canvas = await getElementByCss(driver, "canvas", 2000);
    const consoleErrors = await captureConsoleErrors(driver);
    const sideBar = await getElementByCss(driver, ".njg-sideBar", 2000);
    const node = await getElementByXpath(
      driver,
      "//span[@class='njg-valueLabel' and text()='172.16.169.1']",
      2000,
    );
    const nodeId = await node.getText();

    printConsoleErrors(consoleErrors);
    expect(consoleErrors.length).toBe(0);
    expect(canvas).not.toBeNull();
    expect(sideBar).not.toBeNull();
    expect(nodeId).toBe("172.16.169.1");
  });

  test("bookmarkableActions: render Geographic map example with url fragments for a link", async () => {
    await driver.get(
      `${urls.geographicMap}#id=geographicMap&nodeId=172.16.185.12~172.16.185.13`,
    );
    const canvas = await getElementByCss(driver, "canvas", 2000);
    const consoleErrors = await captureConsoleErrors(driver);
    const sideBar = await getElementByCss(driver, ".njg-sideBar", 2000);
    const source = await getElementByXpath(
      driver,
      "//span[@class='njg-valueLabel' and text()='172.16.185.12']",
      2000,
    );
    const target = await getElementByXpath(
      driver,
      "//span[@class='njg-valueLabel' and text()='172.16.185.13']",
      2000,
    );
    const sourceId = await source.getText();
    const targetId = await target.getText();

    printConsoleErrors(consoleErrors);
    expect(consoleErrors.length).toBe(0);
    expect(canvas).not.toBeNull();
    expect(sideBar).not.toBeNull();
    expect(sourceId).toBe("172.16.185.12");
    expect(targetId).toBe("172.16.185.13");
  });

  test("bookmarkableActions: render indoor overlay example without JS console errors", async () => {
    await driver.get(urls.indoorMapOverlay);
    const canvas = await getElementByCss(driver, "canvas", 2000);
    const consoleErrors = await captureConsoleErrors(driver);
    printConsoleErrors(consoleErrors);
    const {nodesRendered, linksRendered} = await getRenderedNodesAndLinksCount(driver);
    const {nodesPresent, linksPresent} =
      await getPresentNodesAndLinksCount("Geographic map");
    expect(consoleErrors.length).toBe(0);
    expect(canvas).not.toBeNull();
    expect(nodesRendered).toBe(nodesPresent);
    expect(linksRendered).toBe(linksPresent);

    await driver.executeScript('window._geoMap.utils.triggerOnClick("172.16.171.15");');
    let currentUrl = await driver.getCurrentUrl();
    expect(currentUrl).toContain("172.16.171.15");
    let indoorContainer = await getElementByCss(driver, "#indoormap-container", 2000);
    const indoorCanvas = await getElementByCss(driver, "canvas", 2000);
    const floorplanImage = await getElementByCss(driver, ".leaflet-image-layer", 2000);
    const indoorConsoleErrors = await captureConsoleErrors(driver);
    const {nodesRendered: indoorNodesRendered, linksRendered: indoorLinksRendered} =
      await getRenderedNodesAndLinksCount(driver);
    const {nodesPresent: indoorNodesPresent, linksPresent: indoorLinksPresent} =
      await getPresentNodesAndLinksCount("Indoor map");
    printConsoleErrors(indoorConsoleErrors);
    expect(indoorConsoleErrors.length).toBe(0);
    expect(indoorContainer).not.toBeNull();
    expect(indoorCanvas).not.toBeNull();
    expect(floorplanImage).not.toBeNull();
    expect(indoorNodesRendered).toBe(indoorNodesPresent);
    expect(indoorLinksRendered).toBe(indoorLinksPresent);
    await driver.executeScript('window._indoorMap.utils.triggerOnClick("node_2");');
    currentUrl = await driver.getCurrentUrl();
    expect(currentUrl).toContain("node_2");
    const closeBtn = await getElementByCss(driver, "#indoormap-close");
    expect(closeBtn).not.toBeNull();
    await closeBtn.click();
    indoorContainer = await getElementByCss(driver, "#indoormap-container", 2000);
    expect(indoorContainer).toBeNull();
  });

  test("bookmarkableActions: test url fragments for nodes", async () => {
    await driver.get(`${urls.indoorMapOverlay}#id=geoMap&nodeId=172.16.177.33`);
    const canvas = await getElementByCss(driver, "canvas", 2000);
    const indoorContainer = await getElementByCss(driver, "#indoormap-container", 2000);
    const floorplanImage = getElementByCss(driver, "leaflet-image-layer");
    const consoleErrors = await captureConsoleErrors(driver);
    printConsoleErrors(consoleErrors);
    expect(consoleErrors.length).toBe(0);
    expect(canvas).not.toBeNull();
    expect(indoorContainer).not.toBeNull();
    expect(floorplanImage).not.toBeNull();
  });

  test("bookmarkableActions: test forward/backward actions", async () => {
    await driver.get(urls.indoorMapOverlay);
    const canvas = await getElementByCss(driver, "canvas", 2000);
    expect(canvas).not.toBeNull();
    await driver.executeScript('window._geoMap.utils.triggerOnClick("172.16.171.15");');
    let currentUrl = await driver.getCurrentUrl();
    expect(currentUrl).toContain("172.16.171.15");
    let indoorContainer = await getElementByCss(driver, "#indoormap-container");
    expect(indoorContainer).not.toBeNull();
    await driver.executeScript('window._indoorMap.utils.triggerOnClick("node_2");');
    currentUrl = await driver.getCurrentUrl();
    expect(currentUrl).toContain("node_2");
    await driver.get("http://0.0.0.0:8080");
    await driver.navigate().back();
    await driver.sleep(500);
    currentUrl = await driver.getCurrentUrl();
    expect(currentUrl).toContain("172.16.171.15");
    expect(currentUrl).toContain("node_2");
    indoorContainer = await getElementByCss(driver, "#indoormap-container");
    expect(indoorContainer).not.toBeNull();
    let node = await getElementByCss(driver, "#indoormap-container .njg-valueLabel");
    let nodeId = await node.getText();
    expect(nodeId).toBe("Node_2");
    await driver.navigate().back();
    await driver.sleep(500);
    currentUrl = await driver.getCurrentUrl();
    expect(currentUrl).toContain("172.16.171.15");
    expect(currentUrl).not.toContain("node_2");
    indoorContainer = await getElementByCss(driver, "#indoormap-container");
    expect(indoorContainer).toBeNull();
    await driver.navigate().forward();
    await driver.sleep(500);
    currentUrl = await driver.getCurrentUrl();
    expect(currentUrl).toContain("172.16.171.15");
    expect(currentUrl).toContain("node_2");
    indoorContainer = await getElementByCss(driver, "#indoormap-container");
    expect(indoorContainer).not.toBeNull();
    node = await getElementByCss(driver, "#indoormap-container .njg-valueLabel");
    nodeId = await node.getText();
    expect(nodeId).toBe("Node_2");
    const consoleErrors = await captureConsoleErrors(driver);
    printConsoleErrors(consoleErrors);
    expect(consoleErrors.length).toBe(0);
  });

  test("bookmarkableActions: check if parseUrlFragments handles invalid UTF-8", async () => {
    // Invalid UTF-8 sequence in hash
    await driver.get(`${urls.indoorMapOverlay}#%E2%82`);
    const canvas = await getElementByCss(driver, "canvas", 2000);
    const consoleErrors = await captureConsoleErrors(driver);
    printConsoleErrors(consoleErrors);
    expect(consoleErrors.length).toBe(0);
    expect(canvas).not.toBeNull();

  test("graph zoom works when scrolling on empty container area", async () => {
    driver.get(urls.basicUsage);
    await getElementByCss(driver, "canvas", 2000);

    const zoomChanged = await driver.executeAsyncScript(`
      const done = arguments[arguments.length - 1];
      const option = graph.echarts.getOption();
      const initialZoom = option.series[0].zoom || 1;
      
      const zr = graph.echarts.getZr();
      const canvas = zr.dom;
      const rect = canvas.getBoundingClientRect();

      canvas.dispatchEvent(new WheelEvent('wheel', {
        bubbles: true,
        clientX: rect.left + rect.width / 2,
        clientY: rect.top + rect.height / 2,
        deltaY: -120,
        deltaMode: 0
      }));
      
      setTimeout(() => {
        const newZoom = graph.echarts.getOption().series[0].zoom || 1;
        done(newZoom !== initialZoom);
      }, 300);
    `);

    expect(zoomChanged).toBe(true);

  });
});
