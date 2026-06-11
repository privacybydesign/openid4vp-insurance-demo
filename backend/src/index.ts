import express from "express"
import cors from "cors"
import { config } from "./config.js"
import { loadCustomers } from "./db.js"
import { registrerenRouter } from "./routes/registreren.js"
import { inloggenRouter } from "./routes/inloggen.js"
import { wordKlantRouter } from "./routes/word-klant.js"

// Eager-load the DB so a missing seed file fails fast at startup.
loadCustomers()

const app = express()
app.use(cors())
app.use(express.json())

app.get("/api/health", (_req, res) => {
  res.json({ ok: true })
})

app.use("/api/registreren", registrerenRouter)
app.use("/api/inloggen", inloggenRouter)
app.use("/api/word-klant", wordKlantRouter)

app.listen(config.port, () => {
  console.log(`backend listening on :${config.port}`)
})
