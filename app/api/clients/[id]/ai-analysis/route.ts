import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "lib/auth"
import { prisma } from "lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id } = await params

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

    // Fetch AI analyses for this client
    const aiAnalyses = await prisma.clientAiAnalysis.findMany({
      where: {
        clientId: id
      },
      orderBy: {
        createdAt: 'desc'
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

    return NextResponse.json({ aiAnalyses })
  } catch (error) {
    console.error("Error fetching AI analyses:", error)
    return NextResponse.json({ error: "Failed to fetch AI analyses" }, { status: 500 })
  }
}
