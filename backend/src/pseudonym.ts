import { randomBytes } from "node:crypto"

export function generatePseudonym(): string {
  return `YIVI-INS-${randomBytes(4).toString("hex").toUpperCase()}`
}
