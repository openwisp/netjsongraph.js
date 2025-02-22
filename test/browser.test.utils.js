import {Builder, By, until} from "selenium-webdriver";
import chrome from "selenium-webdriver/chrome";
import graphData from "../public/assets/data/netjsonmap.json";

const url = "http://localhost:8080/";

export const getDriver = async () => {
  try {
    const driver = new Builder()
      .forBrowser("chrome")
      .setChromeOptions(new chrome.Options().addArguments("--headless"))
      .build();

    await driver.get(url);
    return driver;
  } catch (err) {
    console.error("Failed to initialize driver:", err);
    throw err;
  }
};

export const openExample = async (driver, example) => {
  await driver
    .findElement(By.xpath(`//div[@class='cards']//a[text()='${example}']`))
    .click();
  const tabs = await driver.getAllWindowHandles();
  await driver.switchTo().window(tabs[1]);
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

export const getRenderedNodesAndLinks = async (driver) => {
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

export const getPresentNodesAndLinks = async (example) => {
  let data;
  if (example === "Geographic map") {
    data = graphData;
  }
  return {nodesPresent: data.nodes.length, linksPresent: data.links.length};
};

export const captureConsoleErrors = async (driver) => {
  const logs = await driver.manage().logs().get("browser");
  return logs.filter(
    (log) =>
      log.level.name === "SEVERE" && !log.message.includes("favicon.ico"),
  );
};

export const tearDown = async (driver) => {
  const consoleErrors = await captureConsoleErrors(driver);

  if (consoleErrors.length > 0) {
    console.error("Console Errors Detected:");
    consoleErrors.forEach((error) =>
      console.error(`${error.level.name}: ${error.message}`),
    );
  }

  await driver.executeScript("window.sessionStorage.clear()");
  await driver.executeScript("window.localStorage.clear()");
  await driver.manage().deleteAllCookies();
  await driver.quit();
};
