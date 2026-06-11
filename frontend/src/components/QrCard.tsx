import { useEffect, useState } from "react"
import QRCode from "qrcode"

export function QrCard({ walletLink, openLabel }: { walletLink: string; openLabel: string }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    QRCode.toDataURL(walletLink, { width: 280, margin: 1 }).then((d) => {
      if (!cancelled) setDataUrl(d)
    })
    return () => {
      cancelled = true
    }
  }, [walletLink])

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-2 text-sm font-medium text-[var(--color-foreground)]">
        <img src="/yivi-logo.svg" alt="Yivi" className="h-6 w-auto" />
        <span>Scan this QR code with the Yivi App</span>
      </div>
      <div className="rounded-md border border-[var(--color-border)] bg-white p-3">
        {dataUrl ? (
          <img src={dataUrl} alt="QR code" width={280} height={280} />
        ) : (
          <div className="h-[280px] w-[280px] animate-pulse bg-[var(--color-muted)]" />
        )}
      </div>
      <a
        href={walletLink}
        className="rounded-md border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-2 text-sm font-medium text-[var(--color-foreground)] hover:bg-[var(--color-muted)]"
      >
        {openLabel}
      </a>
    </div>
  )
}
