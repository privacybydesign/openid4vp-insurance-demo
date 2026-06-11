import { Router, type Request, type Response } from "express"
import { z } from "zod"
import { createRegisterSession, getRegisterSession, updateRegisterSession } from "../sessions.js"
import {
  findCustomerByNameAndDob,
  findCustomerByPolisnummer,
  setPseudonymForPolisnummer,
} from "../db.js"
import { createPassportPresentation, pollPresentation } from "../eudi.js"
import { createPseudonymOffer, pollOffer } from "../veramo-issuer.js"
import { generatePseudonym } from "../pseudonym.js"
import type { RegisterSessionState } from "../types.js"

export const registrerenRouter = Router()

registrerenRouter.post("/start", async (_req: Request, res: Response) => {
  try {
    const { transactionId, walletLink } = await createPassportPresentation()
    const session = createRegisterSession({
      kind: "pending_passport",
      eudiTransactionId: transactionId,
      walletLink,
    })
    res.json({ sessionId: session.id, walletLink })
  } catch (err) {
    console.error("registreren/start failed", err)
    res.status(500).json({ error: "could not start session" })
  }
})

registrerenRouter.get("/:sessionId", async (req: Request, res: Response) => {
  const session = getRegisterSession(String(req.params.sessionId))
  if (!session) {
    res.status(410).json({ error: "session expired" })
    return
  }

  if (session.state.kind === "pending_passport") {
    try {
      const result = await pollPresentation(session.state.eudiTransactionId)
      if (result.status === "complete" && result.claims) {
        const customer = findCustomerByNameAndDob(
          result.claims.firstName,
          result.claims.lastName,
          result.claims.dateOfBirth
        )
        updateRegisterSession(session.id, {
          kind: "polisnummer_required",
          disclosedClaims: result.claims,
          suggestedPolisnummer: customer?.polisnummer ?? null,
        })
      }
    } catch (err) {
      console.error("eudi poll failed", err)
    }
  } else if (session.state.kind === "pending_credential") {
    try {
      const status = await pollOffer(session.state.veramoOfferId)
      if (status === "issued") {
        updateRegisterSession(session.id, {
          kind: "complete",
          insuranceId: session.state.insuranceId,
          polisnummer: session.state.polisnummer,
        })
      }
    } catch (err) {
      console.error("veramo-issuer poll failed", err)
    }
  }

  const latest = getRegisterSession(session.id)
  if (!latest) {
    res.status(410).json({ error: "session expired" })
    return
  }
  res.json(serializeRegisterState(latest.state))
})

const polisnummerSchema = z.object({ polisnummer: z.string().min(1).max(64) })

registrerenRouter.post("/:sessionId/polisnummer", async (req: Request, res: Response) => {
  const session = getRegisterSession(String(req.params.sessionId))
  if (!session) {
    res.status(410).json({ error: "session expired" })
    return
  }
  if (session.state.kind !== "polisnummer_required") {
    res.status(409).json({ error: "session not awaiting polisnummer", state: session.state.kind })
    return
  }

  const parsed = polisnummerSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: "invalid polisnummer" })
    return
  }
  const { polisnummer } = parsed.data

  const customer = findCustomerByPolisnummer(polisnummer)
  if (!customer) {
    res.status(400).json({ error: "mismatch" })
    return
  }

  const disclosed = session.state.disclosedClaims
  if (
    customer.firstName.toLowerCase() !== disclosed.firstName.toLowerCase() ||
    customer.lastName.toLowerCase() !== disclosed.lastName.toLowerCase() ||
    customer.dateOfBirth !== disclosed.dateOfBirth
  ) {
    res.status(400).json({ error: "mismatch" })
    return
  }

  const insuranceId = customer.pseudonym ?? generatePseudonym()
  if (!customer.pseudonym) {
    setPseudonymForPolisnummer(polisnummer, insuranceId)
  }

  try {
    const offer = await createPseudonymOffer(insuranceId)
    updateRegisterSession(session.id, {
      kind: "pending_credential",
      veramoOfferId: offer.offerId,
      walletLink: offer.walletLink,
      insuranceId,
      polisnummer,
    })
    res.json({ ok: true })
  } catch (err) {
    console.error("create-offer failed", err)
    res.status(500).json({ error: "could not create credential offer" })
  }
})

function serializeRegisterState(state: RegisterSessionState) {
  switch (state.kind) {
    case "pending_passport":
      return { state: "pending_passport", walletLink: state.walletLink }
    case "polisnummer_required":
      return {
        state: "polisnummer_required",
        disclosedClaims: state.disclosedClaims,
        suggestedPolisnummer: state.suggestedPolisnummer,
      }
    case "pending_credential":
      return {
        state: "pending_credential",
        walletLink: state.walletLink,
        insuranceId: state.insuranceId,
        polisnummer: state.polisnummer,
      }
    case "complete":
      return {
        state: "complete",
        insuranceId: state.insuranceId,
        polisnummer: state.polisnummer,
      }
  }
}
