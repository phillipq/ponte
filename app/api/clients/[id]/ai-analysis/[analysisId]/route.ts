import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "lib/auth"
import { prisma } from "lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; analysisId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Find or create user by email
    let user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: session.user.email,
          name: session.user.name || session.user.email,
          image: session.user.image
        }
      })
    }

    const { id, analysisId } = await params

    // Verify client belongs to user
    const client = await prisma.client.findFirst({
      where: {
        id: id,
        userId: user.id
      }
    })

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }

    // Fetch the specific AI analysis
    const analysis = await prisma.clientAiAnalysis.findFirst({
      where: {
        id: analysisId,
        clientId: id
      },
      include: {
        responseSet: {
          select: {
            id: true,
            version: true,
            submittedAt: true,
            status: true
          }
        }
      }
    })

    if (!analysis) {
      return NextResponse.json({ error: "Analysis not found" }, { status: 404 })
    }

    return NextResponse.json({
      id: analysis.id,
      summary: analysis.summary,
      recommendations: analysis.recommendations,
      propertyRankings: analysis.propertyRankings,
      createdAt: analysis.createdAt,
      responseSet: analysis.responseSet
    })
  } catch (error) {
    console.error("Error fetching AI analysis:", error)
    return NextResponse.json({ error: "Failed to fetch AI analysis" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; analysisId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Find or create user by email
    let user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: session.user.email,
          name: session.user.name || session.user.email,
          image: session.user.image
        }
      })
    }

    const { id, analysisId } = await params

    // Verify client belongs to user
    const client = await prisma.client.findFirst({
      where: {
        id: id,
        userId: user.id
      }
    })

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }

    // Delete the AI analysis
    await prisma.clientAiAnalysis.delete({
      where: {
        id: analysisId,
        clientId: id
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting AI analysis:", error)
    return NextResponse.json({ error: "Failed to delete AI analysis" }, { status: 500 })
  }
}
