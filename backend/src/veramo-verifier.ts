import { config } from "./config.js"

function vctUrl(): string {
  // The Veramo Issuer serves the VCT type metadata at `<BASEURL>/vct/insurance-pseudonym`.
  // Credentials it issues reference that URL as their `vct`, so the Verifier
  // matches against the same string in DCQL.
  return `${config.veramoIssuer.externalUrl}/vct/insurance-pseudonym`
}

const dcqlBody = () => ({
  dcql: {
    credentials: [
      {
        id: "pseudonym",
        format: "dc+sd-jwt",
        meta: { vct_values: [vctUrl()] },
        claims: [{ path: ["insurance_id"] }],
      },
    ],
  },
})

export interface PseudonymPresentation {
  state: string
  walletLink: string
}

export async function createPseudonymPresentation(): Promise<PseudonymPresentation> {
  const url = `${config.veramoVerifier.internalUrl}/${config.veramoVerifier.name}/api/create-dcql-offer`
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.veramoVerifier.adminToken}`,
    },
    body: JSON.stringify(dcqlBody()),
  })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`veramo-verifier create-dcql-offer ${response.status}: ${text}`)
  }
  const json = (await response.json()) as { state: string; requestUri: string }
  return { state: json.state, walletLink: json.requestUri }
}

export interface VerifierPollResult {
  status: "pending" | "complete"
  insuranceId?: string
}

export async function pollVerifier(state: string): Promise<VerifierPollResult> {
  const url = `${config.veramoVerifier.internalUrl}/${config.veramoVerifier.name}/api/check-offer/${state}`
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${config.veramoVerifier.adminToken}` },
  })
  if (!response.ok) return { status: "pending" }

  const json = (await response.json()) as {
    status?: string
    result?: { credentials?: Record<string, Array<{ claims?: Record<string, unknown> }>> }
  }
  if (json.status !== "VERIFIED" && json.status !== "RESPONSE_RECEIVED") {
    return { status: "pending" }
  }

  const credentialsById = json.result?.credentials ?? {}
  for (const arr of Object.values(credentialsById)) {
    for (const cred of arr) {
      const insuranceId = cred.claims?.insurance_id
      if (typeof insuranceId === "string") return { status: "complete", insuranceId }
    }
  }
  return { status: "pending" }
}
