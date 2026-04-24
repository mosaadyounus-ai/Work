import crypto from "crypto"

function sortObject(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortObject)
  }

  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => [k, sortObject(v)])
    )
  }

  return value
}

export function stableStringify(obj: unknown): string {
  return JSON.stringify(sortObject(obj))
}

export function sha256(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex")
}
