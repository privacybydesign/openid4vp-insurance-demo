import { Router, type Request, type Response } from "express"
import { createLoginSession, getLoginSession, updateLoginSession } from "../sessions.js"
import { findCustomerByPseudonym } from "../db.js"
import { createPseudonymPresentation, pollVerifier } from "../veramo-verifier.js"
import type { LoginSessionState } from "../types.js"

export const inloggenRouter = Router()

inloggenRouter.post("/start", async (_req: Request, res: Response) => {
  try {
    const { state, walletLink } = await createPseudonymPresentation()
    const session = createLoginSession({ kind: "pending", veramoState: state, walletLink })
    res.json({ sessionId: session.id, walletLink })
  } catch (err) {
    console.error("inloggen/start failed", err)
    res.status(500).json({ error: "could not start session" })
  }
})

inloggenRouter.get("/:sessionId", async (req: Request, res: Response) => {
  const session = getLoginSession(String(req.params.sessionId))
  if (!session) {
    res.status(410).json({ error: "session expired" })
    return
  }

  if (session.state.kind === "pending") {
    try {
      const result = await pollVerifier(session.state.veramoState)
      if (result.status === "complete" && result.insuranceId) {
        const customer = findCustomerByPseudonym(result.insuranceId)
        if (customer) {
          updateLoginSession(session.id, { kind: "complete", customer })
        } else {
          updateLoginSession(session.id, { kind: "not_found", insuranceId: result.insuranceId })
        }
      }
    } catch (err) {
      console.error("veramo-verifier poll failed", err)
    }
  }

  const latest = getLoginSession(session.id)
  if (!latest) {
    res.status(410).json({ error: "session expired" })
    return
  }
  res.json(serializeLoginState(latest.state))
})

function serializeLoginState(state: LoginSessionState) {
  switch (state.kind) {
    case "pending":
      return { state: "pending", walletLink: state.walletLink }
    case "complete":
      return {
        state: "complete",
        customer: {
          firstName: state.customer.firstName,
          lastName: state.customer.lastName,
          polisnummer: state.customer.polisnummer,
          customerSince: state.customer.customerSince,
        },
      }
    case "not_found":
      return { state: "not_found", insuranceId: state.insuranceId }
  }
}
