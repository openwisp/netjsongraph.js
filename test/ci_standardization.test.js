// Test the shared CI and test entry-point conventions.
const {spawnSync} = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const root = path.resolve(__dirname, "..");
const script = path.join(root, "runtests");

describe("CI standardization", () => {
  test.each(["--config=other.js", "--setupFiles=other.js", "../other.test.js"])(
    "rejects unsupported argument %s",
    (argument) => {
      const result = spawnSync(script, [argument], {cwd: root, encoding: "utf8"});
      expect(result.status).not.toBe(0);
      expect(result.stderr).toMatch(/unsupported/i);
    },
  );

  test("runs an existing spec suite", () => {
    const result = spawnSync(script, ["test/netjsongraph.spec.js"], {
      cwd: root,
      encoding: "utf8",
      env: {...process.env, FORCE_COLOR: "0"},
      timeout: 20000,
    });
    expect(result.status).toBe(0);
    expect(result.stderr).toMatch(/Test Suites: 1 passed/);
  }, 30000);

  test("accepts a test path in a hyphenated directory", () => {
    const result = spawnSync(
      script,
      ["--runInBand", "test/my-feature/missing.test.js"],
      {
        cwd: root,
        encoding: "utf8",
        env: {...process.env, FORCE_COLOR: "0"},
        timeout: 20000,
      },
    );
    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/ENOENT/);
  }, 30000);

  test("runs only the selected test file", () => {
    const directory = fs.mkdtempSync(path.join(root, "test", "runtests-fixture-"));
    try {
      fs.writeFileSync(path.join(directory, "a.b.test.js"), 'test("dot", () => {});\n');
      fs.writeFileSync(
        path.join(directory, "a-b.test.js"),
        'test("dash", () => {});\n',
      );
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

  test("selects the requested file when the ignore option comes first", () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), "runtests-"));
    try {
      fs.mkdirSync(path.join(directory, "test"));
      fs.symlinkSync(
        path.join(root, "node_modules"),
        path.join(directory, "node_modules"),
        "junction",
      );
      fs.writeFileSync(
        path.join(directory, "package.json"),
        JSON.stringify({private: true, scripts: {test: "jest --silent --runInBand"}}),
      );
      fs.writeFileSync(path.join(directory, "source.js"), "module.exports = 1;\n");
      fs.writeFileSync(
        path.join(directory, "test", "one.test.js"),
        'test("one", () => expect(require("../source")).toBe(1));\n',
      );
      fs.writeFileSync(
        path.join(directory, "test", "two.test.js"),
        'test("two", () => { throw new Error("wrong suite"); });\n',
      );
      fs.writeFileSync(
        path.join(directory, "test", "netjsongraph.browser.test.js"),
        'test("browser", () => { throw new Error("browser should be ignored"); });\n',
      );
      const result = spawnSync(
        script,
        [
          "--runInBand",
          "--testPathIgnorePatterns=test/netjsongraph.browser.test.js",
          "test/one.test.js",
        ],
        {
          cwd: directory,
          encoding: "utf8",
          env: {...process.env, FORCE_COLOR: "0"},
          timeout: 20000,
        },
      );
      expect(result.status).toBe(0);
      expect(result.stderr).toMatch(/Test Suites:\s+1 passed/);
      const all = spawnSync(
        script,
        [
          "--runInBand",
          "--coverage",
          "--testPathIgnorePatterns=test/netjsongraph.browser.test.js",
        ],
        {
          cwd: directory,
          encoding: "utf8",
          env: {...process.env, FORCE_COLOR: "0"},
          timeout: 20000,
        },
      );
      expect(all.status).toBe(1);
      expect(all.stderr).toMatch(/wrong suite/);
      expect(all.stderr).not.toMatch(/browser should be ignored/);
      expect(
        fs.existsSync(path.join(directory, "coverage", "coverage-final.json")),
      ).toBe(true);
      const defaults = spawnSync(script, [], {
        cwd: directory,
        encoding: "utf8",
        env: {...process.env, FORCE_COLOR: "0"},
        timeout: 20000,
      });
      expect(defaults.status).toBe(1);
      expect(defaults.stderr).toMatch(/wrong suite/);
      expect(defaults.stderr).toMatch(/browser should be ignored/);
    } finally {
      fs.rmSync(directory, {recursive: true, force: true});
    }
  }, 30000);

  test("the failure bot uses the CI workflow", () => {
    const workflows = path.join(root, ".github", "workflows");
    const ci = fs.readFileSync(path.join(workflows, "ci.yml"), "utf8");
    const bot = fs.readFileSync(path.join(workflows, "bot-ci-failure.yml"), "utf8");
    const name = ci.match(/^name: (.+)$/m)[1];
    expect(bot).toContain(`workflows: ["${name}"]`);
    expect(bot).toContain(
      "github.event.workflow_run.path == '.github/workflows/ci.yml'",
    );
  });
});
