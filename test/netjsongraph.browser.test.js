import {
  getElementByCss,
  tearDown,
  captureConsoleErrors,
  openExample,
  getDriver,
  getElementsByCss,
  getRenderedNodesAndLinks,
  getPresentNodesAndLinks,
} from "./browser.test.utils";

describe("Chart Rendering Test", () => {
  let driver;

  beforeAll(async () => {
    driver = await getDriver();
  });

  afterAll(async () => {
    await tearDown(driver);
  });

  test("render the Geographic map example without console errors", async () => {
    await openExample(driver, "Geographic map");
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
      await getRenderedNodesAndLinks(driver);
    const {nodesPresent, linksPresent} =
      await getPresentNodesAndLinks("Geographic map");
    const consoleErrors = await captureConsoleErrors(driver);
    expect(consoleErrors.length).toBe(0);
    expect(leafletContainer).not.toBeNull();
    expect(canvases.length).toBeGreaterThan(0);
    expect(nodesRendered).toBe(nodesPresent);
    expect(linksRendered).toBe(linksPresent);
  });
});
