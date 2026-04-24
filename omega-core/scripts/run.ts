import fs from "fs"
import { buildCanonical } from "../src/canonical"
import { generateAllVectors } from "../src/generator"

const vectors = generateAllVectors()
const results = vectors.map(buildCanonical)

fs.writeFileSync("snapshot/output.json", JSON.stringify(results, null, 2))
console.log(`Wrote ${results.length} canonical states to snapshot/output.json`)
