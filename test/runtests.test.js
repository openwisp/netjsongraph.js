// Test the shared entry point without allowing Jest options that execute other code.
const {spawnSync} = require("child_process");
const fs = require("fs");
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
    env: {...process.env, FORCE_COLOR: "0"},
    timeout: 20000,
  });
  expect(result.status).toBe(0);
  expect(result.stderr).toMatch(/Test Suites: 1 passed/);
}, 30000);

test("accepts a test path in a hyphenated directory", () => {
  const result = spawnSync(script, ["--runInBand", "test/my-feature/missing.test.js"], {
    cwd: root,
    encoding: "utf8",
    env: {...process.env, FORCE_COLOR: "0"},
    timeout: 20000,
  });
  expect(result.status).toBe(1);
  expect(result.stderr).toMatch(/ENOENT/);
}, 30000);

test("runs only the selected test file", () => {
  const directory = fs.mkdtempSync(path.join(root, "test", "runtests-fixture-"));
  try {
    fs.writeFileSync(path.join(directory, "a.b.test.js"), 'test("dot", () => {});\n');
    fs.writeFileSync(path.join(directory, "a-b.test.js"), 'test("dash", () => {});\n');
    const selected = `test/${path.basename(directory)}/a.b.test.js`;
    const result = spawnSync(script, ["--runInBand", selected], {
      cwd: root,
      encoding: "utf8",
      env: {...process.env, FORCE_COLOR: "0"},
      timeout: 20000,
    });
    expect(result.status).toBe(0);
    expect(result.stderr).toMatch(/Tests:\s+1 passed/);
  } finally {
    fs.rmSync(directory, {recursive: true, force: true});
  }
}, 30000);
