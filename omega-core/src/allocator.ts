import { Decision, Vector } from "./types"
import { assertInvariants } from "./invariants"

export function allocate(v: Vector): Decision {
  let decision: Decision

  if (v.risk === "high") {
    decision = "model"
  } else if (v.mode === "streaming") {
    decision = "model"
  } else if (v.auth === "admin" && v.risk === "low") {
    decision = "bypass"
  } else {
    decision = "reject"
  }

  assertInvariants(v, decision)
  return decision
}
