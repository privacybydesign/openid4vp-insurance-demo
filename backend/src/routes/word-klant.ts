import { Router, type Request, type Response } from "express"
import { z } from "zod"
import {
  createSignupSession,
  getSignupSession,
  updateSignupSession,
} from "../sessions.js"
import { addCustomer, findCustomerByNameAndDob, setPseudonymForPolisnummer } from "../db.js"
import { createPassportPresentation, pollPresentation } from "../eudi.js"
import { createPseudonymOffer, pollOffer } from "../veramo-issuer.js"
import { generatePseudonym, generatePolisnummer } from "../pseudonym.js"
import type { SignupSessionState } from "../types.js"

export const wordKlantRouter = Router()

const startSchema = z.object({
  products: z.array(z.string().min(1).max(64)).max(20).optional(),
})

wordKlantRouter.post("/start", async (req: Request, res: Response) => {
  const parsed = startSchema.safeParse(req.body ?? {})
  if (!parsed.success) {
    res.status(400).json({ error: "invalid products" })
    return
  }
  try {
    const { transactionId, walletLink } = await createPassportPresentation()
    const session = createSignupSession({
      kind: "pending_disclosure",
      eudiTransactionId: transactionId,
      walletLink,
      products: parsed.data.products ?? [],
    })
    res.json({ sessionId: session.id, walletLink })
  } catch (err) {
    console.error("word-klant/start failed", err)
    res.status(500).json({ error: "could not start session" })
  }
})

wordKlantRouter.get("/:sessionId", async (req: Request, res: Response) => {
  const session = getSignupSession(String(req.params.sessionId))
  if (!session) {
    res.status(410).json({ error: "session expired" })
    return
  }

  if (session.state.kind === "pending_disclosure") {
    try {
      const result = await pollPresentation(session.state.eudiTransactionId)
      if (result.status === "complete" && result.claims) {
        const { firstName, lastName, dateOfBirth } = result.claims
        const { products } = session.state

        // If this person already has a record (e.g. they were really an existing
        // customer, or this is a retry), reuse it instead of creating a duplicate.
        const existing = findCustomerByNameAndDob(firstName, lastName, dateOfBirth)
        const insuranceId = existing?.pseudonym ?? generatePseudonym()
        const polisnummer = existing?.polisnummer ?? generatePolisnummer()
        if (existing) {
          if (!existing.pseudonym) setPseudonymForPolisnummer(polisnummer, insuranceId)
        } else {
          addCustomer({
            polisnummer,
            firstName,
            lastName,
            dateOfBirth,
            customerSince: new Date().toISOString().slice(0, 10),
            pseudonym: insuranceId,
            products,
          })
        }
        const offer = await createPseudonymOffer(insuranceId)
        updateSignupSession(session.id, {
          kind: "pending_credential",
          veramoOfferId: offer.offerId,
          walletLink: offer.walletLink,
          insuranceId,
          polisnummer,
          firstName,
          lastName,
        })
      }
    } catch (err) {
      console.error("word-klant disclosure/offer failed", err)
    }
  } else if (session.state.kind === "pending_credential") {
    try {
      const status = await pollOffer(session.state.veramoOfferId)
      if (status === "issued") {
        updateSignupSession(session.id, {
          kind: "complete",
          insuranceId: session.state.insuranceId,
          polisnummer: session.state.polisnummer,
          firstName: session.state.firstName,
          lastName: session.state.lastName,
        })
      }
    } catch (err) {
      console.error("veramo-issuer poll failed", err)
    }
  }

  const latest = getSignupSession(session.id)
  if (!latest) {
    res.status(410).json({ error: "session expired" })
    return
  }
  res.json(serializeSignupState(latest.state))
})

function serializeSignupState(state: SignupSessionState) {
  switch (state.kind) {
    case "pending_disclosure":
      return { state: "pending_disclosure", walletLink: state.walletLink }
    case "pending_credential":
      return {
        state: "pending_credential",
        walletLink: state.walletLink,
        insuranceId: state.insuranceId,
        polisnummer: state.polisnummer,
        firstName: state.firstName,
        lastName: state.lastName,
      }
    case "complete":
      return {
        state: "complete",
        insuranceId: state.insuranceId,
        polisnummer: state.polisnummer,
        firstName: state.firstName,
        lastName: state.lastName,
      }
  }
}
