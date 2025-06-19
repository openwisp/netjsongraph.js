import {
  getElementByCss,
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
    const canvas = await getElementByCss(driver, "canvas", 2000);
    const consoleErrors = await captureConsoleErrors(driver);
    printConsoleErrors(consoleErrors);
    const {nodesRendered, linksRendered} =
      await getRenderedNodesAndLinksCount(driver);
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
    const {nodesRendered, linksRendered} =
      await getRenderedNodesAndLinksCount(driver);
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
    const zoomIn = await getElementByCss(
      driver,
      ".leaflet-control-zoom-in",
      2000,
    );
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
    await driver.sleep(15000);
    const consoleErrors = await captureConsoleErrors(driver);
    printConsoleErrors(consoleErrors);
    expect(consoleErrors.length).toBe(0);
  });

  test("render floorplan map without console errors", async () => {
    driver.get(urls.indoorMap);
    const canvas = await getElementByCss(driver, "canvas", 2000);
    const floorplanImage = getElementByCss(driver, "leaflet-image-layer");
    const consoleErrors = await captureConsoleErrors(driver);
    const {nodesRendered, linksRendered} = 
      await getRenderedNodesAndLinksCount(driver);
    const {nodesPresent, linksPresent} =
      await getPresentNodesAndLinksCount("Indoor map");
    printConsoleErrors(consoleErrors);
    expect(consoleErrors.length).toBe(0);
    expect(canvas).not.toBeNull();
    expect(floorplanImage).not.toBeNull();
    expect(nodesRendered).toBe(nodesPresent);
    expect(linksRendered).toBe(linksPresent);
  });
});
