import {Builder, By, until} from "selenium-webdriver";
import chrome from "selenium-webdriver/chrome";
import netJsonMap from "../public/assets/data/netjsonmap.json";
import netJsonMultipleInterfaces from "../public/assets/data/netjson-multipleInterfaces.json";
import netJsonGraphFoldNodes from "../public/assets/data/netjsongraph-foldNodes.json";
import netJsonMapIndoorMap from "../public/assets/data/netjsonmap-indoormap.json";
import netJsonGraphGraphGL from "../public/assets/data/netjsongraph-graphGL.json";
import netJsonElementsLegend from "../public/assets/data/netjson-elementsLegend.json";
import netJsonGraphMultipleLinks from "../public/assets/data/netjsongraph-multipleLinks.json";
import airplaneRouteMap from "../public/assets/data/airplaneRouteMap.json";
import geoJsonSample from "../public/assets/data/geojson-sample.json";
import netJsonNodeTiles1 from "../public/assets/data/netjsonNodeTiles/1.json";
import netJsonAppendData1 from "../public/assets/data/netjsonAppendData/1.json";
import netJsonAppendData2 from "../public/assets/data/netjsonAppendData/2.json";
import netJsonAppendData3 from "../public/assets/data/netjsonAppendData/3.json";

const url = "http://0.0.0.0:8080";

export const getDriver = async () => {
  try {
    const options = new chrome.Options();
    options.addArguments("--headless=new");
    options.addArguments("--disable-dev-shm-usage");
    options.addArguments("--no-sandbox");
    options.addArguments("--remote-debugging-pipe");
    return new Builder().forBrowser("chrome").setChromeOptions(options).build();
  } catch (err) {
    console.error("Failed to initialize driver:", err);
    throw err;
  }
};

export const urls = {
  basicUsage: `${url}/examples/netjsongraph.html`,
  geographicMap: `${url}/examples/netjsonmap.html`,
  indoorMap: `${url}/examples/netjsonmap-indoormap.html`,
  customAttributes: `${url}/examples/netjsongraph-elementsLegend.html`,
  wifiClients: `${url}/examples/netjsongraph-wifi-clients.html`,
};

export const getElementByCss = async (driver, css, waitTime = 1000) => {
  try {
    return await driver.wait(until.elementLocated(By.css(css)), waitTime);
  } catch (err) {
    console.error("Error finding element:", css, err);
    return null;
  }
};

export const getElementsByCss = async (driver, css, waitTime = 1000) => {
  try {
    return await driver.wait(until.elementsLocated(By.css(css)), waitTime);
  } catch (err) {
    console.error(`Error finding elements: ${css}`, err);
    return [];
  }
};

export const getRenderedNodesAndLinksCount = async (driver) => {
  try {
    const nodes = await driver.executeScript(`
      return document.querySelector('.njg-metaDataItems:nth-child(5) .njg-valueLabel').textContent;
    `);

    const links = await driver.executeScript(`
      return document.querySelector('.njg-metaDataItems:nth-child(6) .njg-valueLabel').textContent;
    `);
    const nodesRendered = parseInt(nodes, 10);
    const linksRendered = parseInt(links, 10);
    return {nodesRendered, linksRendered};
  } catch (error) {
    console.error("Error extracting nodes and links:", error);
    return {nodesRendered: 0, linksRendered: 0};
  }
};

export const getPresentNodesAndLinksCount = async (example) => {
  const mapping = {
    "Basic usage": netJsonMap,
    "Geographic map": netJsonMap,
    "Multiple interfaces": netJsonMultipleInterfaces,
    "Search elements": netJsonMap,
    "Data parse": netJsonMap,
    "Switch render mode": netJsonMap,
    "Switch graph mode": netJsonMap,
    "Nodes expand or fold": netJsonGraphFoldNodes,
    "Indoor map": netJsonMapIndoorMap,
    "Leaflet plugins": netJsonMap,
    "GraphGL render for big data": netJsonGraphGraphGL,
    "Custom attributes": netJsonElementsLegend,
    "Multiple links render": netJsonGraphMultipleLinks,
    "JSONDataUpdate using override option": netJsonNodeTiles1,
    "JSONDataUpdate using append option": netJsonAppendData1,
    "Multiple tiles render": netJsonMap,
    "Geographic map animated links": airplaneRouteMap,
    "Append data using arrays": {
      ...netJsonAppendData1,
      nodes: [
        ...netJsonAppendData1.nodes,
        ...netJsonAppendData2.nodes,
        ...netJsonAppendData3.nodes,
      ],
      links: [
        ...netJsonAppendData1.links,
        ...netJsonAppendData2.links,
        ...netJsonAppendData3.links,
      ],
    },
    "Geographic map with GeoJSON data": geoJsonSample,
    Clustering: netJsonMap,
  };
  if (!(example in mapping)) {
    throw new Error("Invalid example type");
  }
  const data = mapping[example];
  return {
    nodesPresent: data.nodes.length,
    linksPresent: data.links.length,
  };
};

export const captureConsoleErrors = async (driver) => {
  const logs = await driver.manage().logs().get("browser");
  return logs.filter(
    (log) => log.level.name === "SEVERE" && !log.message.includes("favicon.ico"),
  );
};

export const printConsoleErrors = (errors) => {
  if (errors.length > 0) {
    process.stdout.write("Console Errors Detected:\n");
    errors.forEach((error) => {
      process.stdout.write(`${error.level.name}: ${error.message}\n`);
    });
  }
};

export const tearDown = async (driver) => {
  await driver.executeScript("window.sessionStorage.clear()");
  await driver.executeScript("window.localStorage.clear()");
  await driver.manage().deleteAllCookies();
  await driver.quit();
};
