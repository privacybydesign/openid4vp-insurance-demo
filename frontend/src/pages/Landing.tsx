import { Link } from "react-router-dom"
import { ArrowRight, Award, Shield, Star, Users, type LucideIcon } from "lucide-react"
import { PRODUCTS, formatFromPrice, productFromPrice } from "@/lib/products"

export function Landing() {
  return (
    <>
      <Hero />
      <TrustStrip />
      <Products />
      <Footer />
    </>
  )
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[var(--color-primary)] to-[#1d3f8a] text-white">
      <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <p className="text-sm font-medium uppercase tracking-wider text-white/70">
          Yivi Verzekeringen
        </p>
        <h1 className="mt-3 max-w-3xl text-4xl font-bold leading-tight sm:text-5xl">
          Binnen seconden verzekerd,<br />zonder gedoe met polisnummers.
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-white/85">
          Kies uw verzekering en bevestig met uw wallet. Geen formulieren, geen
          wachttijd — u bent direct verzekerd en logt voortaan in met één scan.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/word-klant"
            className="inline-flex items-center gap-2 rounded-md bg-white px-6 py-3 text-base font-medium text-[var(--color-primary)] shadow-sm hover:bg-white/90"
          >
            Direct verzekerd
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/inloggen"
            className="inline-flex items-center gap-2 rounded-md border border-white/30 px-6 py-3 text-base font-medium text-white hover:bg-white/10"
          >
            Inloggen
          </Link>
        </div>
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-white/5 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-white/5 blur-3xl"
      />
    </section>
  )
}

function TrustStrip() {
  return (
    <section className="border-b border-[var(--color-border)] bg-white">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-6 py-10 md:grid-cols-4">
        <Stat icon={Users} value="500.000+" label="klanten in Nederland" />
        <Stat icon={Award} value="Sinds 1998" label="een vertrouwd merk" />
        <Stat icon={Star} value="9,2" label="klanttevredenheid" />
        <Stat icon={Shield} value="24/7" label="schade melden" />
      </div>
    </section>
  )
}

function Products() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <div className="max-w-2xl">
        <h2 className="text-2xl font-semibold text-[var(--color-foreground)]">
          Onze verzekeringen
        </h2>
        <p className="mt-2 text-[var(--color-muted-foreground)]">
          Stel uw eigen pakket samen. U bepaalt zelf wat u nodig heeft.
        </p>
      </div>
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PRODUCTS.map((p) => (
          <ProductCard
            key={p.id}
            to={`/word-klant?product=${p.id}`}
            icon={p.icon}
            title={p.title}
            price={formatFromPrice(productFromPrice(p))}
          />
        ))}
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="border-t border-[var(--color-border)] bg-[var(--color-muted)]">
      <div className="mx-auto max-w-6xl px-6 py-10 text-sm text-[var(--color-muted-foreground)]">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div>
            <div className="font-semibold text-[var(--color-primary)]">Yivi Verzekeringen</div>
            <p className="mt-2 leading-relaxed">
              Postbus 12345<br />
              3500 AA Utrecht
            </p>
          </div>
          <div>
            <div className="font-medium text-[var(--color-foreground)]">Klantenservice</div>
            <p className="mt-2 leading-relaxed">
              030 — 123 45 67<br />
              klantenservice@yiviverzekeringen.nl
            </p>
          </div>
          <div>
            <div className="font-medium text-[var(--color-foreground)]">Bedrijfsinformatie</div>
            <p className="mt-2 leading-relaxed">
              KvK 12345678<br />
              AFM 11.222.333
            </p>
          </div>
          <div>
            <div className="font-medium text-[var(--color-foreground)]">Over deze site</div>
            <p className="mt-2 leading-relaxed">
              Demonstratie van digitale identiteit met OpenID4VP / OpenID4VCI.
              Geen echte verzekeringen.
            </p>
          </div>
        </div>
        <div className="mt-8 border-t border-[var(--color-border)] pt-4">
          © 2026 Yivi Verzekeringen B.V. — Alle rechten voorbehouden.
        </div>
      </div>
    </footer>
  )
}

function Stat({ icon: Icon, value, label }: { icon: LucideIcon; value: string; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="h-8 w-8 shrink-0 text-[var(--color-primary)]" />
      <div>
        <div className="text-lg font-semibold text-[var(--color-foreground)]">{value}</div>
        <div className="text-sm text-[var(--color-muted-foreground)]">{label}</div>
      </div>
    </div>
  )
}

function ProductCard({
  to,
  icon: Icon,
  title,
  price,
}: {
  to: string
  icon: LucideIcon
  title: string
  price: string
}) {
  return (
    <Link
      to={to}
      className="group rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-6 transition hover:border-[var(--color-primary)] hover:shadow-sm"
    >
      <Icon className="h-8 w-8 text-[var(--color-primary)]" />
      <h3 className="mt-4 text-base font-medium text-[var(--color-foreground)]">{title}</h3>
      <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{price}</p>
      <div className="mt-3 inline-flex items-center text-sm font-medium text-[var(--color-primary)] opacity-0 transition group-hover:opacity-100">
        Verzeker me
        <ArrowRight className="ml-1 h-3.5 w-3.5" />
      </div>
    </Link>
  )
}
