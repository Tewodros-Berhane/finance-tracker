"use client"

import { useEffect, useRef } from "react"
import { usePathname, useRouter } from "next/navigation"

const STORAGE_KEY = "vantage:currency-version"

export function CurrencyRefresh() {
  const router = useRouter()
  const pathname = usePathname()
  const lastSeenRef = useRef<string | null>(null)

  useEffect(() => {
    lastSeenRef.current = window.localStorage.getItem(STORAGE_KEY)
  }, [])

  useEffect(() => {
    const current = window.localStorage.getItem(STORAGE_KEY)
    if (current && current !== lastSeenRef.current) {
      lastSeenRef.current = current
      router.refresh()
    }
  }, [pathname, router])

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return
      if (event.newValue && event.newValue !== lastSeenRef.current) {
        lastSeenRef.current = event.newValue
        router.refresh()
      }
    }

    window.addEventListener("storage", handleStorage)
    return () => window.removeEventListener("storage", handleStorage)
  }, [router])

  return null
}
