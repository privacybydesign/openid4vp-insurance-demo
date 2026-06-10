import { useState } from "react"
import { submitPolisnummer } from "@/api/client"

interface Props {
  sessionId: string
  suggestedPolisnummer: string | null
  onSubmitted: () => void
}

export function PolisnummerForm({ sessionId, suggestedPolisnummer, onSubmitted }: Props) {
  const [polisnummer, setPolisnummer] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!polisnummer.trim()) {
      setError("Vul uw polisnummer in.")
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const result = await submitPolisnummer(sessionId, polisnummer.trim())
      if ("error" in result) {
        setError("Dit polisnummer hoort niet bij dit ID-bewijs.")
      } else {
        onSubmitted()
      }
    } catch (err) {
      console.error(err)
      setError("Er ging iets mis. Probeer het opnieuw.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="space-y-3" onSubmit={onSubmit}>
      <label className="block text-sm font-medium text-[var(--color-foreground)]" htmlFor="polisnummer">
        Polisnummer
      </label>
      <input
        id="polisnummer"
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={polisnummer}
        onChange={(e) => {
          setPolisnummer(e.target.value)
          setError(null)
        }}
        disabled={submitting}
        className="w-full rounded-md border border-[var(--color-border)] bg-white px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none"
        placeholder="bijv. 12345678"
      />
      {error && <p className="text-sm text-[var(--color-destructive)]">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-[var(--color-primary-foreground)] hover:opacity-90 disabled:opacity-60"
        >
          {submitting ? "Bezig…" : "Bevestigen"}
        </button>
        {suggestedPolisnummer && (
          <button
            type="button"
            disabled={submitting}
            onClick={() => setPolisnummer(suggestedPolisnummer)}
            className="rounded-md border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-2 text-sm text-[var(--color-foreground)] hover:bg-[var(--color-muted)]"
          >
            Polisnummer invullen voor dit ID-bewijs
          </button>
        )}
      </div>
    </form>
  )
}
