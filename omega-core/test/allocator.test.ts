import { describe, expect, test } from "vitest"
import { allocate } from "../src/allocator"
import { generateAllVectors } from "../src/generator"

describe("allocator", () => {
  test("all vectors produce valid decisions", () => {
    const vectors = generateAllVectors()

    for (const v of vectors) {
      expect(() => allocate(v)).not.toThrow()
    }
  })
})
