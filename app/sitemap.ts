import type { MetadataRoute } from "next"

import { siteConfig } from "@/lib/seo"

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  const staticRoutes = [
    {
      path: "/",
      changeFrequency: "weekly" as const,
      priority: 1,
    },
  ]

  return staticRoutes.map((route) => ({
    url: new URL(route.path, siteConfig.url).toString(),
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }))
}
