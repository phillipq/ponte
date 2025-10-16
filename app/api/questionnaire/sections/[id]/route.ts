import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"
import { authOptions } from "lib/auth"
import { prisma } from "lib/prisma"

const updateSectionSchema = z.object({
  title: z.string().min(1, "Title is required"),
  order: z.number().int().min(0)
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!(session?.user as { id: string })?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const validatedData = updateSectionSchema.parse(body)

    const section = await prisma.questionnaireSection.updateMany({
      where: {
        id,
        userId: (session?.user as { id: string })?.id
      },
      data: validatedData
    })

    if (section.count === 0) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 })
    }

    const updatedSection = await prisma.questionnaireSection.findUnique({
      where: { id },
      include: {
        questions: {
          orderBy: { order: "asc" }
        }
      }
    })

    return NextResponse.json({ section: updatedSection })
  } catch (error) {
    console.error("Error updating section:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0]?.message || 'Validation error' }, { status: 400 })
    }
    return NextResponse.json({ error: "Failed to update section" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!(session?.user as { id: string })?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const section = await prisma.questionnaireSection.deleteMany({
      where: {
        id,
        userId: (session?.user as { id: string })?.id
      }
    })

    if (section.count === 0) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting section:", error)
    return NextResponse.json({ error: "Failed to delete section" }, { status: 500 })
  }
}
