export interface DisclosedClaims {
  firstName: string
  lastName: string
  dateOfBirth: string
}

export type RegisterStatus =
  | { state: "pending_passport"; walletLink: string }
  | {
      state: "polisnummer_required"
      disclosedClaims: DisclosedClaims
      suggestedPolisnummer: string | null
    }
  | {
      state: "pending_credential"
      walletLink: string
      insuranceId: string
      polisnummer: string
    }
  | { state: "complete"; insuranceId: string; polisnummer: string }

export type SignupStatus =
  | { state: "pending_disclosure"; walletLink: string }
  | {
      state: "pending_credential"
      walletLink: string
      insuranceId: string
      polisnummer: string
      firstName: string
      lastName: string
    }
  | {
      state: "complete"
      insuranceId: string
      polisnummer: string
      firstName: string
      lastName: string
    }

export interface CustomerSummary {
  firstName: string
  lastName: string
  polisnummer: string
  customerSince: string
}

export type LoginStatus =
  | { state: "pending"; walletLink: string }
  | { state: "complete"; customer: CustomerSummary }
  | { state: "not_found"; insuranceId: string }

export async function startRegisterSession(): Promise<{ sessionId: string; walletLink: string }> {
  const r = await fetch("/api/registreren/start", { method: "POST" })
  if (!r.ok) throw new Error(`register/start ${r.status}`)
  return r.json()
}

export async function getRegisterStatus(sessionId: string): Promise<RegisterStatus | "expired"> {
  const r = await fetch(`/api/registreren/${sessionId}`)
  if (r.status === 410) return "expired"
  if (!r.ok) throw new Error(`register/status ${r.status}`)
  return r.json()
}

export async function submitPolisnummer(
  sessionId: string,
  polisnummer: string
): Promise<{ ok: true } | { error: "mismatch" }> {
  const r = await fetch(`/api/registreren/${sessionId}/polisnummer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ polisnummer }),
  })
  if (r.ok) return { ok: true }
  if (r.status === 400) {
    const body = await r.json().catch(() => ({}))
    if (body?.error === "mismatch") return { error: "mismatch" }
  }
  throw new Error(`polisnummer ${r.status}`)
}

export async function startSignupSession(
  products: string[]
): Promise<{ sessionId: string; walletLink: string }> {
  const r = await fetch("/api/word-klant/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ products }),
  })
  if (!r.ok) throw new Error(`word-klant/start ${r.status}`)
  return r.json()
}

export async function getSignupStatus(sessionId: string): Promise<SignupStatus | "expired"> {
  const r = await fetch(`/api/word-klant/${sessionId}`)
  if (r.status === 410) return "expired"
  if (!r.ok) throw new Error(`word-klant/status ${r.status}`)
  return r.json()
}

export async function startLoginSession(): Promise<{ sessionId: string; walletLink: string }> {
  const r = await fetch("/api/inloggen/start", { method: "POST" })
  if (!r.ok) throw new Error(`login/start ${r.status}`)
  return r.json()
}

export async function getLoginStatus(sessionId: string): Promise<LoginStatus | "expired"> {
  const r = await fetch(`/api/inloggen/${sessionId}`)
  if (r.status === 410) return "expired"
  if (!r.ok) throw new Error(`login/status ${r.status}`)
  return r.json()
}
