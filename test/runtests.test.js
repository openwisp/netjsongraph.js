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
