import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import {
  getRegisterStatus,
  startRegisterSession,
  type RegisterStatus,
} from "@/api/client"
import { QrCard } from "@/components/QrCard"
import { StepCard } from "@/components/StepCard"
import { PolisnummerForm } from "@/components/PolisnummerForm"

export function Registreren() {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [status, setStatus] = useState<RegisterStatus | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    startRegisterSession()
      .then((d) => {
        if (cancelled) return
        setSessionId(d.sessionId)
        setStatus({ state: "pending_passport", walletLink: d.walletLink })
      })
      .catch((err) => {
        console.error(err)
        if (!cancelled) setError("Kon sessie niet starten.")
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!sessionId || status?.state === "complete") return
    const interval = setInterval(async () => {
      try {
        const next = await getRegisterStatus(sessionId)
        if (next === "expired") {
          setError("Sessie verlopen. Vernieuw de pagina om opnieuw te beginnen.")
          clearInterval(interval)
          return
        }
        setStatus(next)
      } catch (err) {
        console.error(err)
      }
    }, 1500)
    return () => clearInterval(interval)
  }, [sessionId, status?.state])

  if (error) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="text-2xl font-semibold text-[var(--color-primary)]">Registreren</h1>
        <p className="mt-4 text-sm text-[var(--color-destructive)]">{error}</p>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-2xl font-semibold text-[var(--color-primary)]">Registreren</h1>
      <p className="mt-2 text-[var(--color-muted-foreground)]">
        Volg de drie stappen om uw digitale klantenpas te ontvangen.
      </p>

      <div className="mt-8 space-y-4">
        <Step1Identification status={status} />
        <Step2Polisnummer
          status={status}
          sessionId={sessionId}
          onSubmitted={async () => {
            if (sessionId) {
              const next = await getRegisterStatus(sessionId)
              if (next !== "expired") setStatus(next)
            }
          }}
        />
        <Step3Card status={status} />
      </div>
    </main>
  )
}

function Step1Identification({ status }: { status: RegisterStatus | null }) {
  if (!status) {
    return (
      <StepCard step={1} title="Deel uw paspoort, ID-kaart of rijbewijs" status="active">
        <p className="text-sm text-[var(--color-muted-foreground)]">Sessie wordt voorbereid…</p>
      </StepCard>
    )
  }
  if (status.state === "pending_passport") {
    return (
      <StepCard step={1} title="Deel uw paspoort, ID-kaart of rijbewijs" status="active">
        <QrCard walletLink={status.walletLink} openLabel="Open in uw wallet" />
      </StepCard>
    )
  }
  if (
    status.state === "polisnummer_required" ||
    status.state === "pending_credential" ||
    status.state === "complete"
  ) {
    const claims =
      status.state === "polisnummer_required"
        ? status.disclosedClaims
        : undefined
    const summary = claims
      ? `Geïdentificeerd als ${claims.firstName} ${claims.lastName}.`
      : "Identiteit bevestigd."
    return <StepCard step={1} title="Deel uw paspoort, ID-kaart of rijbewijs" status="done" summary={summary} />
  }
  return <StepCard step={1} title="Deel uw paspoort, ID-kaart of rijbewijs" status="pending" />
}

function Step2Polisnummer({
  status,
  sessionId,
  onSubmitted,
}: {
  status: RegisterStatus | null
  sessionId: string | null
  onSubmitted: () => void
}) {
  if (!status || status.state === "pending_passport") {
    return <StepCard step={2} title="Bevestig uw polisnummer" status="pending" />
  }
  if (status.state === "polisnummer_required" && sessionId) {
    return (
      <StepCard step={2} title="Bevestig uw polisnummer" status="active">
        <PolisnummerForm
          sessionId={sessionId}
          suggestedPolisnummer={status.suggestedPolisnummer}
          onSubmitted={onSubmitted}
        />
      </StepCard>
    )
  }
  if (status.state === "pending_credential" || status.state === "complete") {
    return (
      <StepCard
        step={2}
        title="Bevestig uw polisnummer"
        status="done"
        summary={`Polisnummer ${status.polisnummer} bevestigd.`}
      />
    )
  }
  return <StepCard step={2} title="Bevestig uw polisnummer" status="pending" />
}

function Step3Card({ status }: { status: RegisterStatus | null }) {
  if (!status || status.state === "pending_passport" || status.state === "polisnummer_required") {
    return <StepCard step={3} title="Ontvang uw klantenpas" status="pending" />
  }
  if (status.state === "pending_credential") {
    return (
      <StepCard step={3} title="Ontvang uw klantenpas" status="active">
        <p className="mb-4 text-sm text-[var(--color-muted-foreground)]">
          Scan om uw klantenpas op te slaan in uw wallet.
        </p>
        <QrCard walletLink={status.walletLink} openLabel="Open in uw wallet" />
      </StepCard>
    )
  }
  return (
    <StepCard
      step={3}
      title="Ontvang uw klantenpas"
      status="done"
      summary={`U bent geregistreerd. Klantnummer ${status.insuranceId}.`}
    >
      <div className="mt-4">
        <Link
          to="/inloggen"
          className="text-sm font-medium text-[var(--color-primary)] underline"
        >
          Direct inloggen met deze klantenpas
        </Link>
      </div>
    </StepCard>
  )
}
