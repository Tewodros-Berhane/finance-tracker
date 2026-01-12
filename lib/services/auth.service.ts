import { headers } from "next/headers"

import { auth } from "@/lib/auth"

export type AuthenticatedUser = {
  id: string
  name: string | null
  email: string | null
  image?: string | null
}

export async function getAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  const requestHeaders = await headers()
  const session = await auth.api.getSession({
    headers: Object.fromEntries(requestHeaders.entries()),
  })
  return session?.user ?? null
}
