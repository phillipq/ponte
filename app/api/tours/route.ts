import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "lib/auth"
import { prisma } from "lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !(session.user as { id: string }).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const tours = await prisma.tour.findMany({
      where: { userId: (session.user as { id: string }).id },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json(tours)
  } catch (error) {
    console.error("Error fetching tours:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !(session.user as { id: string }).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const tourData = await request.json() as unknown
    
    const tour = await prisma.tour.create({
      data: {
        userId: (session.user as { id: string }).id,
        name: (tourData as { name: string }).name,
        startingPoint: (tourData as { startingPoint: unknown }).startingPoint,
        steps: (tourData as { steps: unknown }).steps,
        route: (tourData as { route: unknown }).route
      }
    })
    
    return NextResponse.json({ success: true, id: tour.id })
  } catch (error) {
    console.error("Error saving tour:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
