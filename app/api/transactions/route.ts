import { NextResponse } from "next/server"

import { getAuthenticatedUser } from "@/lib/services/auth.service"
import { getTransactions } from "@/lib/services/transaction.service"

const parseDateParam = (value: string | null): Date | undefined | null => {
  if (!value) return undefined

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return null
  }

  return date
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)

  const user = await getAuthenticatedUser()
  if (!user) {
    return NextResponse.json(
      { success: false, data: null, error: "Unauthorized." },
      { status: 401 }
    )
  }

  const from = parseDateParam(searchParams.get("startDate"))
  if (from === null) {
    return NextResponse.json(
      { success: false, data: null, error: "Invalid startDate." },
      { status: 400 }
    )
  }

  const to = parseDateParam(searchParams.get("endDate"))
  if (to === null) {
    return NextResponse.json(
      { success: false, data: null, error: "Invalid endDate." },
      { status: 400 }
    )
  }

  const limitParam = searchParams.get("limit")
  const limit = limitParam ? Number(limitParam) : undefined
  const pageParam = searchParams.get("page")
  const page = pageParam ? Number(pageParam) : undefined

  try {
    const data = await getTransactions(user.id, {
      from: from ?? undefined,
      to: to ?? undefined,
      accountId: searchParams.get("accountId") ?? undefined,
      categoryId: searchParams.get("categoryId") ?? undefined,
      limit: limit && Number.isFinite(limit) ? limit : undefined,
      page: page && Number.isFinite(page) ? page : undefined,
    })

    return NextResponse.json({ success: true, data, error: null })
  } catch (error) {
    return NextResponse.json(
      { success: false, data: null, error: "Failed to load transactions." },
      { status: 500 }
    )
  }
}
