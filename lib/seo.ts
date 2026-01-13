import type { Metadata } from "next"

const resolvedSiteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.NEXT_PUBLIC_APP_URL ??
  process.env.BETTER_AUTH_URL ??
  "http://localhost:3000"

export const siteConfig = {
  name: "Vantage",
  description:
    "Vantage is a personal finance tracker for accounts, transactions, budgets, and goals.",
  url: resolvedSiteUrl,
  ogImage: "/og-image.svg",
}

export const metadataBase = new URL(siteConfig.url)

type CreateMetadataInput = {
  title: string
  description: string
  canonical: string
  noIndex?: boolean
  ogImage?: string
}

export function createMetadata({
  title,
  description,
  canonical,
  noIndex,
  ogImage,
}: CreateMetadataInput): Metadata {
  const canonicalUrl = new URL(canonical, metadataBase).toString()
  const imageUrl = new URL(ogImage ?? siteConfig.ogImage, metadataBase).toString()

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      type: "website",
      siteName: siteConfig.name,
      title,
      description,
      url: canonicalUrl,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
    robots: noIndex ? { index: false, follow: false } : undefined,
  }
}

export function serializeJsonLd(data: unknown) {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029")
}
