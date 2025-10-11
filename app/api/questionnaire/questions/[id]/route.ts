import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "lib/auth"
import { prisma } from "lib/prisma"
import { z } from "zod"

const updateQuestionSchema = z.object({
  question: z.string().min(1, "Question is required").optional(),
  questionType: z.enum(["text", "ranking", "yesno"]).optional(),
  order: z.number().int().min(0).optional()
})

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
          name: session.user.name || "Unknown User"
        }
      })
    }

    const { id } = await params
    const body = await request.json()
    const validatedData = updateQuestionSchema.parse(body)

    // Verify the question belongs to a section owned by the user
    const question = await prisma.questionnaireQuestion.findFirst({
      where: { id },
      include: { section: true }
    })

    if (!question || question.section.userId !== user.id) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 })
    }

    const updatedQuestion = await prisma.questionnaireQuestion.update({
      where: { id },
      data: validatedData
    })

    return NextResponse.json({ question: updatedQuestion })
  } catch (error) {
    console.error("Error updating question:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: "Failed to update question" }, { status: 500 })
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
          name: session.user.name || "Unknown User"
        }
      })
    }

    const { id } = await params

    // Verify the question belongs to a section owned by the user
    const question = await prisma.questionnaireQuestion.findFirst({
      where: { id },
      include: { section: true }
    })

    if (!question || question.section.userId !== user.id) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 })
    }

    await prisma.questionnaireQuestion.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting question:", error)
    return NextResponse.json({ error: "Failed to delete question" }, { status: 500 })
  }
}
