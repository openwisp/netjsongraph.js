import {Builder} from "selenium-webdriver";
import chrome from "selenium-webdriver/chrome";
import {getDriver} from "./browser.test.utils";

describe("getDriver", () => {
  const chromePath = process.env.SE_CHROME;
  const chromedriverPath = process.env.SE_CHROMEDRIVER;

  beforeEach(() => {
    jest.spyOn(Builder.prototype, "build").mockResolvedValue({});
  });

  afterEach(() => {
    if (chromePath === undefined) {
      delete process.env.SE_CHROME;
    } else {
      process.env.SE_CHROME = chromePath;
    }
    if (chromedriverPath === undefined) {
      delete process.env.SE_CHROMEDRIVER;
    } else {
      process.env.SE_CHROMEDRIVER = chromedriverPath;
    }
    jest.restoreAllMocks();
  });

  test("uses the configured Chrome and ChromeDriver binaries", async () => {
    process.env.SE_CHROME = "/tmp/chrome";
    process.env.SE_CHROMEDRIVER = "/tmp/chromedriver";
    const setChromeBinaryPath = jest.spyOn(
      chrome.Options.prototype,
      "setChromeBinaryPath",
    );
    const {ServiceBuilder} = chrome;
    const serviceBuilder = jest
      .spyOn(chrome, "ServiceBuilder")
      .mockImplementation((path) => new ServiceBuilder(path));
    const setChromeService = jest
      .spyOn(Builder.prototype, "setChromeService")
      .mockReturnThis();

    await getDriver();

    expect(setChromeBinaryPath).toHaveBeenCalledWith("/tmp/chrome");
    const [service] = setChromeService.mock.calls[0];
    expect(service).toBeInstanceOf(ServiceBuilder);
    expect(serviceBuilder).toHaveBeenCalledWith("/tmp/chromedriver");
  });

  test("uses Selenium defaults when no browser paths are configured", async () => {
    delete process.env.SE_CHROME;
    delete process.env.SE_CHROMEDRIVER;
    const setChromeBinaryPath = jest.spyOn(
      chrome.Options.prototype,
      "setChromeBinaryPath",
    );
    const setChromeService = jest.spyOn(Builder.prototype, "setChromeService");

    await getDriver();

    expect(setChromeBinaryPath).not.toHaveBeenCalled();
    expect(setChromeService).not.toHaveBeenCalled();
  });
});
