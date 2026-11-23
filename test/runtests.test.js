// Test the shared entry point without allowing Jest options that execute other code.
const {spawnSync} = require("child_process");
const path = require("path");

const root = path.resolve(__dirname, "..");
const script = path.join(root, "runtests");

test.each(["--config=other.js", "--setupFiles=other.js", "../other.test.js"])(
  "rejects unsupported argument %s",
  (argument) => {
    const result = spawnSync(script, [argument], {cwd: root, encoding: "utf8"});
    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(/unsupported/i);
  },
);

test("runs an existing spec suite", () => {
  const result = spawnSync(script, ["--runInBand", "test/netjsongraph.spec.js"], {
    cwd: root,
    encoding: "utf8",
    timeout: 20000,
  });
  expect(result.status).toBe(0);
  expect(result.stderr).toMatch(/Test Suites: 1 passed/);
}, 30000);
