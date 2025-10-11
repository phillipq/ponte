import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "lib/auth"
import { prisma } from "lib/prisma"
import { z } from "zod"

const updateTagSchema = z.object({
  name: z.string().min(1, "Tag name is required").max(50, "Tag name must be less than 50 characters").optional(),
  color: z.string().optional()
})

// GET /api/tags/[id] - Get a specific tag
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id as string
    const { id } = await params

    const tag = await prisma.tag.findFirst({
      where: {
        id: id,
        userId: userId
      }
    })

    if (!tag) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 })
    }

    return NextResponse.json({ tag })
  } catch (error) {
    console.error("Error fetching tag:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// PUT /api/tags/[id] - Update a tag
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id as string
    const { id } = await params

    // Verify the user owns this tag
    const existingTag = await prisma.tag.findFirst({
      where: {
        id: id,
        userId: userId
      }
    })

    if (!existingTag) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 })
    }

    const body = await request.json()
    const updateData = updateTagSchema.parse(body)

    // If updating name, check if it already exists for this user
    if (updateData.name && updateData.name !== existingTag.name) {
      const nameExists = await prisma.tag.findFirst({
        where: {
          name: updateData.name,
          userId: userId,
          id: { not: id }
        }
      })

      if (nameExists) {
        return NextResponse.json(
          { error: "A tag with this name already exists" },
          { status: 400 }
        )
      }
    }

    const tag = await prisma.tag.update({
      where: { id: id },
      data: updateData
    })

    return NextResponse.json({ tag })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }
    console.error("Error updating tag:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE /api/tags/[id] - Delete a tag
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id as string
    const { id } = await params

    // Verify the user owns this tag
    const existingTag = await prisma.tag.findFirst({
      where: {
        id: id,
        userId: userId
      }
    })

    if (!existingTag) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 })
    }

    // Delete the tag
    await prisma.tag.delete({
      where: { id: id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting tag:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
