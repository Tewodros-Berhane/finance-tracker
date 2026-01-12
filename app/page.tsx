import Link from "next/link"
import { ModeToggle } from "@/components/modules/dark-mode-toggle"
import { createMetadata, serializeJsonLd, siteConfig } from "@/lib/seo"
import SignInPage from "./(auth)/sign-in/page"

export const metadata = createMetadata({
  title: "Vantage",
  description:
    "Manage accounts, track transactions, set budgets, and grow your savings goals with Vantage.",
  canonical: "/",
})

export default function Home() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: siteConfig.name,
    description: siteConfig.description,
    url: siteConfig.url,
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      availability: "https://schema.org/OnlineOnly",
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      <SignInPage />
    </>
  );
}
