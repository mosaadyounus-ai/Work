import { Vector } from "./types"

const env = ["prod", "staging"] as const
const mode = ["sync", "streaming"] as const
const risk = ["low", "medium", "high"] as const
const auth = ["none", "user", "admin"] as const

export function generateAllVectors(): Vector[] {
  const result: Vector[] = []

  for (const e of env)
    for (const m of mode)
      for (const r of risk)
        for (const a of auth)
          result.push({ env: e, mode: m, risk: r, auth: a })

  return result
}
