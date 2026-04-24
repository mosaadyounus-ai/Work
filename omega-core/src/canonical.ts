import { CanonicalState, Vector } from "./types"
import { allocate } from "./allocator"
import { isValidVector } from "./constraints"
import { sha256, stableStringify } from "./hash"

export function buildCanonical(v: Vector): CanonicalState {
  const decision = allocate(v)
  const vector = { ...v, decision }

  if (!isValidVector(vector)) {
    throw new Error("Constraint: invalid vector + decision")
  }

  const base = { vector, decision }

  return {
    ...base,
    proof: {
      hash: sha256(stableStringify(base)),
      invariantsPassed: true,
    },
  }
}
