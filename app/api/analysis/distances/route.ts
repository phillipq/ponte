import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "lib/auth"
import { prisma } from "lib/prisma"

// GET /api/analysis/distances - Get all calculated distances for the user
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as { id: string }).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = (session.user as { id: string }).id

    const distances = await prisma.propertyDistance.findMany({
      include: {
        property: true,
        destination: true
      },
      orderBy: {
        calculatedAt: "desc"
      }
    })

    return NextResponse.json(distances)
  } catch (error) {
    console.error("Error fetching distances:", error)
    return NextResponse.json({ error: "Failed to fetch distances" }, { status: 500 })
  }
}
