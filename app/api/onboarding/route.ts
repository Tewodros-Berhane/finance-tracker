import { NextResponse } from "next/server"
import { revalidateTag } from "next/cache"

import { prisma } from "@/lib/prisma"
import { onboardingSchema } from "@/lib/actions/onboarding.schema"
import { getAuthenticatedUser } from "@/lib/services/auth.service"

export async function POST(request: Request) {
  const user = await getAuthenticatedUser()
  if (!user) {
    return NextResponse.json(
      { success: false, data: null, error: "Unauthorized." },
      { status: 401 }
    )
  }

  const body = await request.json().catch(() => null)
  const parsed = onboardingSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, data: null, error: "Invalid onboarding payload." },
      { status: 400 }
    )
  }

  const data = parsed.data

  const created = await prisma.financialAccount.create({
    data: {
      userId: user.id,
      name: data.name,
      type: data.type,
      balance: data.balance,
      currency: data.currency,
      color: "#0ea5e9",
      icon: "wallet",
    },
    select: { id: true },
  })

  revalidateTag("accounts", "max")
  revalidateTag("summary", "max")

  return NextResponse.json({
    success: true,
    data: { id: created.id },
    error: null,
  })
}
