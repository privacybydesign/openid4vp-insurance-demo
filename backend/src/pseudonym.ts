import { randomBytes } from "node:crypto"

export function generatePseudonym(): string {
  return `YIVI-INS-${randomBytes(4).toString("hex").toUpperCase()}`
}

// New self-service customers don't have a polisnummer yet, so we mint one.
// 8 digits keeps it consistent with the seeded customers.
export function generatePolisnummer(): string {
  const n = randomBytes(4).readUInt32BE(0) % 100_000_000
  return n.toString().padStart(8, "0")
}
