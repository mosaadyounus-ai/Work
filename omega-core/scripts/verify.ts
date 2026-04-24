import fs from "fs"

const current = fs.readFileSync("snapshot/output.json", "utf-8")
const golden = fs.readFileSync("snapshot/golden.json", "utf-8")

if (current !== golden) {
  console.error("❌ Drift detected")
  process.exit(1)
}

console.log("✅ Verified — deterministic match")
