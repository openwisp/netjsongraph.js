const createConfig = require("../webpack.config");

describe("webpack dev server configuration", () => {
  test("keeps the dev server client enabled by default", () => {
    const {devServer} = createConfig({}, {mode: "development"});
    expect(devServer.hot).toBe(true);
    expect(devServer.liveReload).toBe(true);
    expect(devServer.client.overlay.errors).toBe(true);
  });

  test("disables the dev server client when HMR is turned off", () => {
    const {devServer} = createConfig({HMR: "false"}, {mode: "development"});
    expect(devServer.hot).toBe(false);
    expect(devServer.liveReload).toBe(false);
    expect(devServer.client).toBe(false);
  });
});
