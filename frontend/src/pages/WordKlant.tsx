import { useEffect, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import {
  getSignupStatus,
  startSignupSession,
  type SignupStatus,
} from "@/api/client"
import { QrCard } from "@/components/QrCard"
import { StepCard } from "@/components/StepCard"
import { PRODUCTS, productById, variantById } from "@/lib/products"
import { cn } from "@/lib/cn"

// selection maps a product id to the chosen variant id (one coverage per product).
type Selection = Record<string, string>

export function WordKlant() {
  const [searchParams] = useSearchParams()
  const [selected, setSelected] = useState<Selection>(() => {
    const product = productById(searchParams.get("product") ?? "")
    return product ? { [product.id]: product.variants[0]!.id } : {}
  })
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [status, setStatus] = useState<SignupStatus | null>(null)
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const started = sessionId !== null

  function selectVariant(productId: string, variantId: string) {
    setSelected((prev) => {
      const next = { ...prev }
      if (next[productId] === variantId) delete next[productId]
      else next[productId] = variantId
      return next
    })
  }

  async function confirmSelection() {
    const variantIds = Object.values(selected)
    if (variantIds.length === 0 || starting) return
    setStarting(true)
    setError(null)
    try {
      const d = await startSignupSession(variantIds)
      setSessionId(d.sessionId)
      setStatus({ state: "pending_disclosure", walletLink: d.walletLink })
    } catch (err) {
      console.error(err)
      setError("Kon sessie niet starten.")
    } finally {
      setStarting(false)
    }
  }

  useEffect(() => {
    if (!sessionId || status?.state === "complete") return
    const interval = setInterval(async () => {
      try {
        const next = await getSignupStatus(sessionId)
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
        <h1 className="text-2xl font-semibold text-[var(--color-primary)]">Binnen seconden verzekerd</h1>
        <p className="mt-4 text-sm text-[var(--color-destructive)]">{error}</p>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-2xl font-semibold text-[var(--color-primary)]">Binnen seconden verzekerd</h1>
      <p className="mt-2 text-[var(--color-muted-foreground)]">
        Kies uw verzekeringen en bevestig met uw wallet. Geen formulieren, geen
        wachttijd — binnen seconden verzekerd.
      </p>

      <div className="mt-8 space-y-4">
        <Step1Products
          selected={selected}
          started={started}
          starting={starting}
          onSelectVariant={selectVariant}
          onConfirm={confirmSelection}
        />
        <Step2Disclosure status={status} />
        <Step3Card status={status} />
      </div>

      <p className="mt-6 text-sm text-[var(--color-muted-foreground)]">
        Bent u al klant?{" "}
        <Link to="/inloggen" className="font-medium text-[var(--color-primary)] underline">
          Log in of registreer uw bestaande polis
        </Link>
        .
      </p>
    </main>
  )
}

function Step1Products({
  selected,
  started,
  starting,
  onSelectVariant,
  onConfirm,
}: {
  selected: Selection
  started: boolean
  starting: boolean
  onSelectVariant: (productId: string, variantId: string) => void
  onConfirm: () => void
}) {
  const title = "Kies uw verzekeringen"
  const chosen = Object.entries(selected)

  if (started) {
    const names = chosen
      .map(([, variantId]) => {
        const hit = variantById(variantId)
        return hit ? `${hit.product.title} (${hit.variant.label})` : variantId
      })
      .join(", ")
    return <StepCard step={1} title={title} status="done" summary={`Gekozen: ${names}.`} />
  }

  const total = chosen.reduce(
    (sum, [, variantId]) => sum + (variantById(variantId)?.variant.pricePerMonth ?? 0),
    0
  )

  return (
    <StepCard step={1} title={title} status="active">
      <div className="space-y-3">
        {PRODUCTS.map((p) => {
          const Icon = p.icon
          const selectedVariant = selected[p.id]
          return (
            <div
              key={p.id}
              className={cn(
                "rounded-lg border p-4 transition",
                selectedVariant
                  ? "border-[var(--color-primary)] bg-[var(--color-accent)] shadow-sm"
                  : "border-[var(--color-border)] bg-[var(--color-card)]"
              )}
            >
              <div className="flex items-center gap-3">
                <Icon className="h-7 w-7 shrink-0 text-[var(--color-primary)]" />
                <span className="text-sm font-medium text-[var(--color-foreground)]">
                  {p.title}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {p.variants.map((v) => {
                  const active = selectedVariant === v.id
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => onSelectVariant(p.id, v.id)}
                      aria-pressed={active}
                      className={cn(
                        "rounded-md border px-3 py-1.5 text-sm transition",
                        active
                          ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
                          : "border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-foreground)] hover:border-[var(--color-primary)]"
                      )}
                    >
                      {v.label} · € {v.pricePerMonth},- p/m
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[var(--color-muted-foreground)]">
          {chosen.length === 0
            ? "Kies per verzekering een dekking."
            : `Totaal € ${total},- p/m`}
        </p>
        <button
          type="button"
          onClick={onConfirm}
          disabled={chosen.length === 0 || starting}
          className="rounded-md bg-[var(--color-primary)] px-5 py-2 text-sm font-medium text-[var(--color-primary-foreground)] hover:opacity-90 disabled:opacity-60"
        >
          {starting ? "Bezig…" : "Verzeker me"}
        </button>
      </div>
    </StepCard>
  )
}

function Step2Disclosure({ status }: { status: SignupStatus | null }) {
  const title = "Deel uw identiteit"
  if (!status) {
    return <StepCard step={2} title={title} status="pending" />
  }
  if (status.state === "pending_disclosure") {
    return (
      <StepCard step={2} title={title} status="active">
        <p className="mb-4 text-sm text-[var(--color-muted-foreground)]">
          Deel uw paspoort, ID-kaart of rijbewijs uit uw wallet.
        </p>
        <QrCard walletLink={status.walletLink} openLabel="Open in uw wallet" />
      </StepCard>
    )
  }
  return <StepCard step={2} title={title} status="done" summary="Identiteit ontvangen." />
}

function Step3Card({ status }: { status: SignupStatus | null }) {
  const title = "Ontvang uw klantenpas"
  if (!status || status.state === "pending_disclosure") {
    return <StepCard step={3} title={title} status="pending" />
  }
  if (status.state === "pending_credential") {
    return (
      <StepCard step={3} title={title} status="active">
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
      title={title}
      status="done"
      summary={`Welkom, ${status.firstName} ${status.lastName}! U bent verzekerd. Polisnummer ${status.polisnummer}, klantnummer ${status.insuranceId}.`}
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
