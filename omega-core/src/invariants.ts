import { Decision, Vector } from "./types"

export function assertInvariants(v: Vector, d: Decision) {
  if (v.risk === "high" && d === "bypass") {
    throw new Error("Invariant: unsafe bypass")
  }

  if (v.mode === "streaming" && d !== "model") {
    throw new Error("Invariant: streaming must use model")
  }
}
