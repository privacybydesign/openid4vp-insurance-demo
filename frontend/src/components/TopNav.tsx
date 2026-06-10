import { NavLink } from "react-router-dom"
import { Phone } from "lucide-react"
import { cn } from "@/lib/cn"

export function TopNav() {
  return (
    <header className="border-b border-[var(--color-border)] bg-[var(--color-card)]">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <NavLink to="/" className="flex items-baseline gap-1 text-lg font-semibold">
          <span className="text-[var(--color-primary)]">Yivi</span>
          <span className="text-[var(--color-foreground)]">Verzekeringen</span>
        </NavLink>
        <nav className="hidden items-center gap-1 text-sm md:flex">
          <FauxLink label="Verzekeringen" />
          <FauxLink label="Schade melden" />
          <FauxLink label="Klantenservice" />
          <span className="mx-2 inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[var(--color-muted-foreground)]">
            <Phone className="h-3.5 w-3.5" />
            030 — 123 45 67
          </span>
          <NavItem to="/registreren" label="Word klant" />
          <NavItem to="/inloggen" label="Inloggen" primary />
        </nav>
        <nav className="flex gap-1 md:hidden">
          <NavItem to="/registreren" label="Word klant" />
          <NavItem to="/inloggen" label="Inloggen" primary />
        </nav>
      </div>
    </header>
  )
}

function NavItem({ to, label, primary = false }: { to: string; label: string; primary?: boolean }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
          primary
            ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)] hover:opacity-90"
            : isActive
              ? "bg-[var(--color-accent)] text-[var(--color-accent-foreground)]"
              : "text-[var(--color-foreground)] hover:bg-[var(--color-muted)]"
        )
      }
    >
      {label}
    </NavLink>
  )
}

function FauxLink({ label }: { label: string }) {
  return (
    <span
      role="link"
      aria-disabled
      className="cursor-default rounded-md px-3 py-1.5 text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
      title="Demo — link niet actief"
    >
      {label}
    </span>
  )
}
