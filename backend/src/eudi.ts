import { config } from "./config.js"
import type { DisclosedClaims } from "./types.js"

// Trust anchor for the staging PID Issuer's certs.
// Copied verbatim from openid4vp-demo-frontend/src/verifiers.ts:18 so the
// local EUDI verifier accepts passports issued by the staging PID Issuer.
const STAGING_ISSUER_CHAIN =
  "-----BEGIN CERTIFICATE-----\nMIICbTCCAhSgAwIBAgIUX8STjkv3TRF5UBstXlp4ILHy2h0wCgYIKoZIzj0EAwQw\nRjELMAkGA1UEBhMCTkwxDTALBgNVBAoMBFlpdmkxKDAmBgNVBAMMH1lpdmkgU3Rh\nZ2luZyBSZXF1ZXN0b3JzIFJvb3QgQ0EwHhcNMjUwODEyMTUwODA1WhcNNDAwODA4\nMTUwODA0WjBMMQswCQYDVQQGEwJOTDENMAsGA1UECgwEWWl2aTEuMCwGA1UEAwwl\nWWl2aSBTdGFnaW5nIEF0dGVzdGF0aW9uIFByb3ZpZGVycyBDQTBZMBMGByqGSM49\nAgEGCCqGSM49AwEHA0IABMDTwj6APykJnBdr0sCO8LpkULpbXFOBWV47hKKsJHsa\nCVMarjLCYU3CV57UdklHSlMrtm7vfoDpYn4BvUv00UqjgdkwgdYwEgYDVR0TAQH/\nBAgwBgEB/wIBADAfBgNVHSMEGDAWgBRjtHvVs5rhDnC0L2AUi+7ncyXe1jBwBgNV\nHR8EaTBnMGWgY6Bhhl9odHRwczovL2NhLnN0YWdpbmcueWl2aS5hcHAvZWpiY2Ev\ncHVibGljd2ViL2NybHMvc2VhcmNoLmNnaT9pSGFzaD1rRkNPdDhOTGhKOGcwV3FN\nQW5sJTJCdm9OMlJ1WTAdBgNVHQ4EFgQUEjcBLRMmQGBJO0h04IL5Jwha1rEwDgYD\nVR0PAQH/BAQDAgGGMAoGCCqGSM49BAMEA0cAMEQCIDEaWIs4uSm8KVQe+fy0EndE\nTaj1ayt6dUgKQY/xZBO3AiAPYGwRlZMzbeCTFQ2ORLJiSowRtXzbmXpNDSyvtn7e\nDw==\n-----END CERTIFICATE-----"

export interface PassportPresentation {
  transactionId: string
  walletLink: string
}

// firstName / lastName / dateOfBirth are present on all three identity
// documents and are what the registration flow matches a customer on.
const identityBaseClaims = [{ path: ["firstName"] }, { path: ["lastName"] }, { path: ["dateOfBirth"] }]

// The wallet may satisfy the identity requirement with any one of: passport,
// ID card, or driving licence. Every credential + attribute requested here
// must also be authorized in the verifier's x509 RP-metadata cert (see
// scripts/gen-verifier-csr.sh).
const identityDcql = {
  credentials: [
    {
      id: "passport",
      format: "dc+sd-jwt",
      meta: { vct_values: ["pbdf-staging.pbdf.passport"] },
      claims: identityBaseClaims,
    },
    {
      id: "idcard",
      format: "dc+sd-jwt",
      meta: { vct_values: ["pbdf-staging.pbdf.idcard"] },
      claims: identityBaseClaims,
    },
    {
      id: "drivinglicence",
      format: "dc+sd-jwt",
      meta: { vct_values: ["pbdf-staging.pbdf.drivinglicence"] },
      claims: identityBaseClaims,
    },
  ],
  credential_sets: [{ options: [["passport"], ["idcard"], ["drivinglicence"]] }],
}

export async function createPassportPresentation(): Promise<PassportPresentation> {
  const body = {
    type: "vp_token",
    dcql_query: identityDcql,
    nonce: cryptoNonce(),
    jar_mode: "by_reference",
    request_uri_method: "get",
    issuer_chain: STAGING_ISSUER_CHAIN,
  }

  const response = await fetch(`${config.eudi.internalUrl}/ui/presentations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`eudi /ui/presentations ${response.status}: ${text}`)
  }
  const json = (await response.json()) as Record<string, string>

  const params = new URLSearchParams(json)
  const walletLink = `eudi-openid4vp://?${params.toString()}`

  const transactionId = json.transaction_id ?? json.transactionId
  if (!transactionId) throw new Error("EUDI response missing transaction_id")

  return { transactionId, walletLink }
}

export interface EudiPollResult {
  status: "pending" | "complete"
  claims?: DisclosedClaims
}

export async function pollPresentation(transactionId: string): Promise<EudiPollResult> {
  const response = await fetch(`${config.eudi.internalUrl}/ui/presentations/${transactionId}`)
  if (!response.ok) return { status: "pending" }

  const json = (await response.json()) as { vp_token?: Record<string, string[]> }
  const vpTokens = json.vp_token
  if (!vpTokens) return { status: "pending" }

  // The identity document arrives as an SD-JWT under its own vp_token key.
  const identitySdjwts = vpTokens.passport ?? vpTokens.idcard ?? vpTokens.drivinglicence
  if (!identitySdjwts || identitySdjwts.length === 0) return { status: "pending" }

  const identity = disclosures(identitySdjwts[0]!)
  const firstName = asString(identity.firstName)
  const lastName = asString(identity.lastName)
  const dateOfBirth = asString(identity.dateOfBirth)
  // Not complete until every required attribute has been disclosed.
  if (!firstName || !lastName || !dateOfBirth) {
    return { status: "pending" }
  }

  const claims: DisclosedClaims = {
    firstName,
    lastName,
    dateOfBirth,
  }
  return { status: "complete", claims }
}

// Decodes the "~"-separated SD-JWT disclosures into a flat { name: value } map.
function disclosures(sdjwt: string): Record<string, unknown> {
  const parts = sdjwt.split("~")
  const result: Record<string, unknown> = {}
  for (const part of parts.slice(1, parts.length - 1)) {
    if (!part) continue
    try {
      const decoded = Buffer.from(part, "base64url").toString("utf-8")
      const arr = JSON.parse(decoded) as unknown[]
      if (Array.isArray(arr) && arr.length >= 3 && typeof arr[1] === "string") {
        result[arr[1]] = arr[2]
      }
    } catch {
      // skip malformed disclosure
    }
  }
  return result
}

const asString = (v: unknown): string | undefined => (typeof v === "string" ? v : undefined)

function cryptoNonce(): string {
  // EUDI requires a nonce; for the demo a per-session random value is enough.
  return globalThis.crypto.randomUUID()
}
