import { config } from "./config.js"

const CREDENTIAL_ID = "InsurancePseudonymCredentialSdJwt"
const FIVE_YEARS_SECONDS = 5 * 365 * 24 * 60 * 60

export interface PseudonymOffer {
  offerId: string
  walletLink: string
}

export async function createPseudonymOffer(insuranceId: string): Promise<PseudonymOffer> {
  const body = {
    credentials: [CREDENTIAL_ID],
    grants: {
      "urn:ietf:params:oauth:grant-type:pre-authorized_code": {
        "pre-authorized_code": "generate",
      },
    },
    credentialMetadata: { expiration: FIVE_YEARS_SECONDS },
    credentialDataSupplierInput: { insurance_id: insuranceId },
  }

  const url = `${config.veramoIssuer.internalUrl}/${config.veramoIssuer.name}/api/create-offer`
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.veramoIssuer.adminToken}`,
    },
    body: JSON.stringify(body),
  })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`veramo-issuer create-offer ${response.status}: ${text}`)
  }
  const json = (await response.json()) as { uri: string; id: string }
  return { offerId: json.id, walletLink: json.uri }
}

export type OfferStatus = "pending" | "issued"

export async function pollOffer(offerId: string): Promise<OfferStatus> {
  const url = `${config.veramoIssuer.internalUrl}/${config.veramoIssuer.name}/api/check-offer`
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.veramoIssuer.adminToken}`,
    },
    body: JSON.stringify({ id: offerId }),
  })
  if (!response.ok) return "pending"
  const json = (await response.json()) as { status?: string }
  return json.status === "CREDENTIAL_ISSUED" ? "issued" : "pending"
}
