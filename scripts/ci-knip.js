const {execSync} = require("child_process");

function parseAndReportKnipResults(result) {
  const issues = {
    dependencies: new Set(),
    devDependencies: new Set(),
    unresolved: new Set(),
    unusedFiles: new Set(),
    unusedExports: [],
  };

  let hasIssues = false;

  // Check for unused files
  if (result.files && result.files.length > 0) {
    result.files.forEach((file) => issues.unusedFiles.add(file));
    hasIssues = true;
  }

  // Parse each file's issues
  if (result.issues && result.issues.length > 0) {
    result.issues.forEach((fileIssue) => {
      if (fileIssue.dependencies && fileIssue.dependencies.length > 0) {
        fileIssue.dependencies.forEach((dep) => issues.dependencies.add(dep));
        hasIssues = true;
      }
      if (fileIssue.devDependencies && fileIssue.devDependencies.length > 0) {
        fileIssue.devDependencies.forEach((dep) => issues.devDependencies.add(dep));
        hasIssues = true;
      }
      if (fileIssue.unresolved && fileIssue.unresolved.length > 0) {
        fileIssue.unresolved.forEach((item) => issues.unresolved.add(item.name));
        hasIssues = true;
      }
      if (fileIssue.exports && fileIssue.exports.length > 0) {
        fileIssue.exports.forEach((exp) => {
          issues.unusedExports.push({
            file: fileIssue.file,
            name: exp.name,
          });
        });
        hasIssues = true;
      }
    });
  }

  if (hasIssues) {
    console.error("❌ Knip found issues:\n");
    if (issues.dependencies.size > 0) {
      console.error("Unused dependencies:");
      Array.from(issues.dependencies)
        .sort()
        .forEach((d) => console.error(`  - ${d.name}`));
      console.error("");
    }
    if (issues.devDependencies.size > 0) {
      console.error("Unused devDependencies:");
      Array.from(issues.devDependencies)
        .sort()
        .forEach((d) => console.error(`  - ${d.name}`));
      console.error("");
    }
    if (issues.unresolved.size > 0) {
      console.error("Unresolved imports:");
      Array.from(issues.unresolved)
        .sort()
        .forEach((d) => console.error(`  - ${d}`));
      console.error("");
    }
    if (issues.unusedFiles.size > 0) {
      console.error("Unused files:");
      Array.from(issues.unusedFiles)
        .sort()
        .forEach((f) => console.error(`  - ${f}`));
      console.error("");
    }
    if (issues.unusedExports.length > 0) {
      console.error("Unused exports:");
      issues.unusedExports
        .sort((a, b) => a.file.localeCompare(b.file))
        .forEach((exp) => console.error(`  - ${exp.name} (${exp.file})`));
      console.error("");
    }
    return true; // has issues
  }
  return false; // no issues
}

try {
  const output = execSync("npx knip --reporter json", {
    encoding: "utf-8",
    stdio: ["pipe", "pipe", "pipe"],
  });
  const result = JSON.parse(output);
  const hasIssues = parseAndReportKnipResults(result);
  if (hasIssues) {
    process.exit(1);
  }
  console.log("✅ Knip passed: no issues found");
} catch (error) {
  if (error.stdout) {
    try {
      const result = JSON.parse(error.stdout);
      parseAndReportKnipResults(result);
    } catch (parseError) {
      console.error("❌ Knip failed (could not parse JSON output):");
      console.error(error.message);
    }
  } else {
    console.error("❌ Knip failed:");
    console.error(error.message);
  }
  process.exit(1);
}
