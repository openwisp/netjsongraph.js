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

  test("should disable zoom-in button at max zoom and show no errors", async () => {
    driver.get(urls.geographicMap);

    await getElementByCss(driver, ".ec-extension-leaflet", 2000);
    const zoomInButton = await getElementByCss(driver, ".leaflet-control-zoom-in", 2000);
    expect(zoomInButton).not.toBeNull();

    for (let i = 0; i < 20; i++) {
      try {
        const currentClassName = await zoomInButton.getAttribute("class");
        if (currentClassName.includes("leaflet-disabled")) {
          break; // Stop if already disabled
        }
        await zoomInButton.click();
        await driver.sleep(250); // Brief pause for zoom action and UI update
      } catch (e) {
        console.log("Error clicking zoom-in button, possibly disabled:", e.message);
        break;
      }
    }

    await driver.wait(async () => {
      const className = await zoomInButton.getAttribute("class");
      return className.includes("leaflet-disabled");
    }, 20000, "Zoom-in button did not become disabled within timeout after repeated clicks");

    await driver.sleep(2000);

    const consoleErrors = await captureConsoleErrors(driver);
    printConsoleErrors(consoleErrors);
    expect(consoleErrors.length).toBe(0, "Console errors found after reaching max zoom");
  });
});
