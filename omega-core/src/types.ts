export type Env = "prod" | "staging"
export type Mode = "sync" | "streaming"
export type Risk = "low" | "medium" | "high"
export type Auth = "none" | "user" | "admin"
export type Decision = "model" | "bypass" | "reject"

export type Vector = {
  env: Env
  mode: Mode
  risk: Risk
  auth: Auth
  decision?: Decision
}

export type CanonicalState = {
  vector: Vector
  decision: Decision
  proof: {
    hash: string
    invariantsPassed: boolean
  }
}
