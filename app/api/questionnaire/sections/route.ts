import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "lib/auth"
import { prisma } from "lib/prisma"

export async function GET() {
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
          name: session.user.name || "Unknown User"
        }
      })
    }

    const sections = await prisma.questionnaireSection.findMany({
      where: {
        userId: user.id
      },
      include: {
        questions: {
          orderBy: {
            order: 'asc'
          }
        }
      },
      orderBy: {
        order: 'asc'
      }
    })

    return NextResponse.json({ sections })
  } catch (error) {
    console.error("Error fetching sections:", error)
    return NextResponse.json({ error: "Failed to fetch sections" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
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
          name: session.user.name || "Unknown User"
        }
      })
    }

    const body = await request.json()
    const { title, order } = body

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    const section = await prisma.questionnaireSection.create({
      data: {
        title,
        order: order || 0,
        userId: user.id
      }
    })

    return NextResponse.json({ section })
  } catch (error) {
    console.error("Error creating section:", error)
    return NextResponse.json({ error: "Failed to create section" }, { status: 500 })
  }
}