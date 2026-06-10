import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { getLoginStatus, startLoginSession, type LoginStatus } from "@/api/client"
import { QrCard } from "@/components/QrCard"

export function Inloggen() {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [status, setStatus] = useState<LoginStatus | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    startLoginSession()
      .then((d) => {
        if (cancelled) return
        setSessionId(d.sessionId)
        setStatus({ state: "pending", walletLink: d.walletLink })
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
    if (!sessionId || !status || status.state !== "pending") return
    const interval = setInterval(async () => {
      try {
        const next = await getLoginStatus(sessionId)
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
        <h1 className="text-2xl font-semibold text-[var(--color-primary)]">Inloggen</h1>
        <p className="mt-4 text-sm text-[var(--color-destructive)]">{error}</p>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-2xl font-semibold text-[var(--color-primary)]">Inloggen</h1>
      <p className="mt-2 text-[var(--color-muted-foreground)]">
        Scan uw klantenpas om direct herkend te worden — zonder dat u uw polisnummer
        hoeft op te zoeken.
      </p>

      <div className="mt-8">
        {!status && <p className="text-sm text-[var(--color-muted-foreground)]">Sessie wordt voorbereid…</p>}
        {status?.state === "pending" && (
          <div className="rounded-lg border border-[var(--color-primary)] bg-[var(--color-card)] p-6 shadow-sm">
            <QrCard walletLink={status.walletLink} openLabel="Open in uw wallet" />
          </div>
        )}
        {status?.state === "complete" && <WelcomeCard customer={status.customer} />}
        {status?.state === "not_found" && (
          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-6">
            <p className="text-sm text-[var(--color-destructive)]">
              Onbekende klant. Klantnummer <span className="font-mono">{status.insuranceId}</span> staat niet in onze administratie.
            </p>
            <Link to="/registreren" className="mt-3 inline-block text-sm font-medium text-[var(--color-primary)] underline">
              Registreer u eerst
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}

function WelcomeCard({
  customer,
}: {
  customer: { firstName: string; lastName: string; polisnummer: string; customerSince: string }
}) {
  const sinceYear = customer.customerSince.slice(0, 4)
  return (
    <div className="rounded-lg border border-[var(--color-primary)] bg-[var(--color-card)] p-8 shadow-sm">
      <p className="text-sm text-[var(--color-muted-foreground)]">Welkom terug,</p>
      <h2 className="mt-1 text-3xl font-semibold text-[var(--color-primary)]">
        {customer.firstName} {customer.lastName}
      </h2>
      <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
        <div>
          <dt className="text-[var(--color-muted-foreground)]">Polisnummer</dt>
          <dd className="mt-1 font-mono text-base text-[var(--color-foreground)]">{customer.polisnummer}</dd>
        </div>
        <div>
          <dt className="text-[var(--color-muted-foreground)]">Klant sinds</dt>
          <dd className="mt-1 text-base text-[var(--color-foreground)]">{sinceYear}</dd>
        </div>
      </dl>
    </div>
  )
}
