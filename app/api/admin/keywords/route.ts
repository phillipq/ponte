import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
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
          name: session.user.name || session.user.email,
          image: session.user.image
        }
      })
    }

    // Check if user is admin
    if (user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Fetch all keywords
    const keywords = await prisma.keyword.findMany({
      orderBy: { name: 'asc' }
    })

    return NextResponse.json({ keywords })
  } catch (error) {
    console.error("Error fetching keywords:", error)
    return NextResponse.json({ error: "Failed to fetch keywords" }, { status: 500 })
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
          name: session.user.name || session.user.email,
          image: session.user.image
        }
      })
    }

    // Check if user is admin
    if (user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { name, color } = await request.json() as { name: string; color: string }

    if (!name || !color) {
      return NextResponse.json({ error: "Name and color are required" }, { status: 400 })
    }

    // Check if keyword already exists
    const existingKeyword = await prisma.keyword.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } }
    })

    if (existingKeyword) {
      return NextResponse.json({ error: "Keyword already exists" }, { status: 400 })
    }

    // Create new keyword
    const keyword = await prisma.keyword.create({
      data: {
        name,
        color
      }
    })

    return NextResponse.json({ success: true, keyword })
  } catch (error) {
    console.error("Error creating keyword:", error)
    return NextResponse.json({ error: "Failed to create keyword" }, { status: 500 })
  }
}
