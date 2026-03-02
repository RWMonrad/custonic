import fs from "node:fs";

const report = JSON.parse(fs.readFileSync("docs/eslint-report.json", "utf8"));
const counts = new Map();

for (const file of report) {
  for (const m of file.messages) {
    const key = `${m.severity === 2 ? "ERROR" : "WARN"}:${m.ruleId ?? "unknown"}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
}

const sorted = [...counts.entries()].sort((a,b) => b[1]-a[1]);
console.log("TOP ESLINT RULES BY COUNT:");
console.log("========================");
console.log(sorted.slice(0, 30).map(([k,v]) => `${v}\t${k}`).join("\n"));
