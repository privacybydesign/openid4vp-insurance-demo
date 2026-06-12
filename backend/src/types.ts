export interface Customer {
  polisnummer: string
  firstName: string
  lastName: string
  dateOfBirth: string
  customerSince: string
  pseudonym: string | null
  // Product ids chosen in the "Word klant" webshop step (see frontend
  // lib/products.ts). Optional for the same backward-compat reason.
  products?: string[]
}

export interface DisclosedClaims {
  firstName: string
  lastName: string
  dateOfBirth: string
}

export type RegisterSessionState =
  | { kind: "pending_passport"; eudiTransactionId: string; walletLink: string }
  | { kind: "polisnummer_required"; disclosedClaims: DisclosedClaims; suggestedPolisnummer: string | null }
  | { kind: "pending_credential"; veramoOfferId: string; walletLink: string; insuranceId: string; polisnummer: string }
  | { kind: "complete"; insuranceId: string; polisnummer: string }

export interface RegisterSession {
  id: string
  createdAt: number
  state: RegisterSessionState
}

export type SignupSessionState =
  | { kind: "pending_disclosure"; eudiTransactionId: string; walletLink: string; products: string[] }
  | {
      kind: "pending_credential"
      veramoOfferId: string
      walletLink: string
      insuranceId: string
      polisnummer: string
      firstName: string
      lastName: string
    }
  | {
      kind: "complete"
      insuranceId: string
      polisnummer: string
      firstName: string
      lastName: string
    }

export interface SignupSession {
  id: string
  createdAt: number
  state: SignupSessionState
}

export type LoginSessionState =
  | { kind: "pending"; veramoState: string; walletLink: string }
  | { kind: "complete"; customer: Customer }
  | { kind: "not_found"; insuranceId: string }

export interface LoginSession {
  id: string
  createdAt: number
  state: LoginSessionState
}
