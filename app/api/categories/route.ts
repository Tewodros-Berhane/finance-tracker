import { NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"
import { getAuthenticatedUser } from "@/lib/services/auth.service"

export async function GET() {
  const user = await getAuthenticatedUser()
  if (!user) {
    return NextResponse.json(
      { success: false, data: null, error: "Unauthorized." },
      { status: 401 }
    )
  }

  try {
    const categories = await prisma.category.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        name: true,
        type: true,
      },
      orderBy: { name: "asc" },
    })

    return NextResponse.json({
      success: true,
      data: categories,
      error: null,
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, data: null, error: "Failed to load categories." },
      { status: 500 }
    )
  }
}
