import type { ReactNode } from "react"
import { cn } from "@/lib/cn"

interface StepCardProps {
  step: number
  title: string
  status: "pending" | "active" | "done"
  summary?: string
  children?: ReactNode
}

export function StepCard({ step, title, status, summary, children }: StepCardProps) {
  return (
    <section
      className={cn(
        "rounded-lg border bg-[var(--color-card)] p-6 transition",
        status === "active"
          ? "border-[var(--color-primary)] shadow-sm"
          : "border-[var(--color-border)]",
        status === "pending" && "opacity-50"
      )}
    >
      <header className="flex items-center gap-3">
        <span
          className={cn(
            "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
            status === "done"
              ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
              : "bg-[var(--color-muted)] text-[var(--color-muted-foreground)]"
          )}
        >
          {status === "done" ? "✓" : step}
        </span>
        <h2 className="text-base font-medium text-[var(--color-foreground)]">{title}</h2>
      </header>
      {status === "done" && summary && (
        <p className="mt-3 text-sm text-[var(--color-muted-foreground)]">{summary}</p>
      )}
      {status === "active" && children && <div className="mt-5">{children}</div>}
    </section>
  )
}
