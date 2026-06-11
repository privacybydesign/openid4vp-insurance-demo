import { readFileSync, writeFileSync, existsSync, copyFileSync, mkdirSync, renameSync } from "node:fs"
import { dirname } from "node:path"
import type { Customer } from "./types.js"
import { config } from "./config.js"

let cache: Customer[] | null = null

function ensureDbFile(): void {
  if (existsSync(config.dbFile)) return
  if (!existsSync(config.dbSeedFile)) {
    throw new Error(`db seed file missing: ${config.dbSeedFile}`)
  }
  mkdirSync(dirname(config.dbFile), { recursive: true })
  copyFileSync(config.dbSeedFile, config.dbFile)
}

export function loadCustomers(): Customer[] {
  if (cache) return cache
  ensureDbFile()
  const raw = readFileSync(config.dbFile, "utf-8")
  cache = JSON.parse(raw) as Customer[]
  return cache
}

export function saveCustomers(customers: Customer[]): void {
  cache = customers
  const tmp = `${config.dbFile}.tmp`
  writeFileSync(tmp, JSON.stringify(customers, null, 2))
  renameSync(tmp, config.dbFile)
}

export function addCustomer(customer: Customer): void {
  const customers = loadCustomers()
  customers.push(customer)
  saveCustomers(customers)
}

export function findCustomerByPolisnummer(polisnummer: string): Customer | undefined {
  return loadCustomers().find((c) => c.polisnummer === polisnummer)
}

export function findCustomerByNameAndDob(
  firstName: string,
  lastName: string,
  dateOfBirth: string
): Customer | undefined {
  return loadCustomers().find(
    (c) =>
      c.firstName.toLowerCase() === firstName.toLowerCase() &&
      c.lastName.toLowerCase() === lastName.toLowerCase() &&
      c.dateOfBirth === dateOfBirth
  )
}

export function findCustomerByPseudonym(insuranceId: string): Customer | undefined {
  return loadCustomers().find((c) => c.pseudonym === insuranceId)
}

export function setPseudonymForPolisnummer(polisnummer: string, pseudonym: string): void {
  const customers = loadCustomers()
  const target = customers.find((c) => c.polisnummer === polisnummer)
  if (!target) throw new Error(`unknown polisnummer: ${polisnummer}`)
  target.pseudonym = pseudonym
  saveCustomers(customers)
}
