import { NextResponse } from "next/server"

import { getAccountsWithBalances } from "@/lib/services/account.service"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)

  const userId = request.headers.get("x-user-id") ?? searchParams.get("userId")
  if (!userId) {
    return NextResponse.json(
      { success: false, data: null, error: "Missing userId." },
      { status: 401 }
    )
  }

  try {
    const accounts = await getAccountsWithBalances(userId)

    return NextResponse.json({
      success: true,
      data: accounts,
      error: null,
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, data: null, error: "Failed to load accounts." },
      { status: 500 }
    )
  }
}
