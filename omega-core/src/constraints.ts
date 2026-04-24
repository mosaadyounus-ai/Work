import { Vector } from "./types"

export function isValidVector(v: Vector): boolean {
  if (v.mode === "streaming" && v.decision === "bypass") return false
  if (v.risk === "high" && v.decision === "bypass") return false
  if (v.decision === "reject" && v.mode !== "sync") return false
  return true
}
