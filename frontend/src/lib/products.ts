import { Car, Home, Plane, Shield, type LucideIcon } from "lucide-react"

export interface ProductVariant {
  id: string
  label: string
  // price per month, in euros.
  pricePerMonth: number
}

export interface Product {
  id: string
  title: string
  icon: LucideIcon
  variants: ProductVariant[]
}

export const PRODUCTS: Product[] = [
  {
    id: "auto",
    title: "Autoverzekering",
    icon: Car,
    variants: [
      { id: "auto-wa", label: "WA", pricePerMonth: 11 },
      { id: "auto-wa-plus", label: "WA plus", pricePerMonth: 16 },
      { id: "auto-allrisk", label: "All-risk", pricePerMonth: 24 },
    ],
  },
  {
    id: "inboedel",
    title: "Inboedelverzekering",
    icon: Home,
    variants: [
      { id: "inboedel-basis", label: "Basis", pricePerMonth: 5 },
      { id: "inboedel-uitgebreid", label: "Uitgebreid", pricePerMonth: 8 },
      { id: "inboedel-allrisk", label: "All-risk", pricePerMonth: 12 },
    ],
  },
  {
    id: "reis",
    title: "Reisverzekering",
    icon: Plane,
    variants: [
      { id: "reis-kortlopend", label: "Kortlopend", pricePerMonth: 3 },
      { id: "reis-doorlopend", label: "Doorlopend", pricePerMonth: 6 },
      { id: "reis-werelddekking", label: "Werelddekking", pricePerMonth: 9 },
    ],
  },
  {
    id: "aansprakelijkheid",
    title: "Aansprakelijkheid",
    icon: Shield,
    variants: [
      { id: "aansprakelijkheid-alleenstaand", label: "Alleenstaand", pricePerMonth: 4 },
      { id: "aansprakelijkheid-gezin", label: "Gezin", pricePerMonth: 6 },
    ],
  },
]

export function productById(id: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === id)
}

export function variantById(
  variantId: string
): { product: Product; variant: ProductVariant } | undefined {
  for (const product of PRODUCTS) {
    const variant = product.variants.find((v) => v.id === variantId)
    if (variant) return { product, variant }
  }
  return undefined
}

// Cheapest variant, used for the "vanaf …" teaser on the homepage.
export function productFromPrice(product: Product): number {
  return Math.min(...product.variants.map((v) => v.pricePerMonth))
}

export function formatFromPrice(pricePerMonth: number): string {
  return `vanaf € ${pricePerMonth},- p/m`
}
