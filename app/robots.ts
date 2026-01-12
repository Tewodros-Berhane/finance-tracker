import type { MetadataRoute } from "next"

import { siteConfig } from "@/lib/seo"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/_next/", "/favicon.ico", "/og-image.svg"],
        disallow: [
          "/api/",
          "/dashboard",
          "/transactions",
          "/accounts",
          "/budgets",
          "/goals",
          "/categories",
          "/sign-in",
          "/sign-up",
          "/onboarding",
        ],
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  }
}
