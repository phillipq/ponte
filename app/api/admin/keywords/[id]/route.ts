import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "lib/auth"
import { prisma } from "lib/prisma"

export async function PUT(
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

    // Check if user is admin
    if (user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    const { name, color } = await request.json() as { name: string; color: string }

    if (!name || !color) {
      return NextResponse.json({ error: "Name and color are required" }, { status: 400 })
    }

    // Check if keyword exists
    const existingKeyword = await prisma.keyword.findUnique({
      where: { id }
    })

    if (!existingKeyword) {
      return NextResponse.json({ error: "Keyword not found" }, { status: 404 })
    }

    // Check if another keyword with the same name exists
    const duplicateKeyword = await prisma.keyword.findFirst({
      where: { 
        name: { equals: name, mode: 'insensitive' },
        id: { not: id }
      }
    })

    if (duplicateKeyword) {
      return NextResponse.json({ error: "Keyword name already exists" }, { status: 400 })
    }

    // Update keyword
    const updatedKeyword = await prisma.keyword.update({
      where: { id },
      data: { name, color }
    })

    return NextResponse.json({ success: true, keyword: updatedKeyword })
  } catch (error) {
    console.error("Error updating keyword:", error)
    return NextResponse.json({ error: "Failed to update keyword" }, { status: 500 })
  }
}

export async function DELETE(
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

    // Check if user is admin
    if (user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params

    // Check if keyword exists
    const existingKeyword = await prisma.keyword.findUnique({
      where: { id }
    })

    if (!existingKeyword) {
      return NextResponse.json({ error: "Keyword not found" }, { status: 404 })
    }

    // Delete keyword
    await prisma.keyword.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting keyword:", error)
    return NextResponse.json({ error: "Failed to delete keyword" }, { status: 500 })
  }
}
