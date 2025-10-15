import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"
import { authOptions } from "lib/auth"
import { prisma } from "lib/prisma"

const updateQuestionnaireSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  isDefault: z.boolean().optional()
})

// GET /api/questionnaires/[id] - Get a specific questionnaire
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
    const { id: questionnaireId } = await params

    const questionnaire = await prisma.questionnaire.findFirst({
      where: {
        id: questionnaireId,
        userId: userId
      },
      include: {
        sections: {
          include: {
            questions: true
          },
          orderBy: {
            order: 'asc'
          }
        }
      }
    })

    if (!questionnaire) {
      return NextResponse.json({ error: "Questionnaire not found" }, { status: 404 })
    }

    return NextResponse.json({ questionnaire })
  } catch (error) {
    console.error("Error fetching questionnaire:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// PUT /api/questionnaires/[id] - Update a questionnaire
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
    const { id: questionnaireId } = await params

    // Verify the user owns this questionnaire
    const existingQuestionnaire = await prisma.questionnaire.findFirst({
      where: {
        id: questionnaireId,
        userId: userId
      }
    })

    if (!existingQuestionnaire) {
      return NextResponse.json({ error: "Questionnaire not found" }, { status: 404 })
    }

    const body = await request.json()
    const updateData = updateQuestionnaireSchema.parse(body)

    // If this is set as default, unset other defaults
    if (updateData.isDefault) {
      await prisma.questionnaire.updateMany({
        where: {
          userId,
          isDefault: true,
          id: { not: questionnaireId }
        },
        data: {
          isDefault: false
        }
      })
    }

    const questionnaire = await prisma.questionnaire.update({
      where: {
        id: questionnaireId
      },
      data: updateData,
      include: {
        sections: {
          include: {
            questions: true
          },
          orderBy: {
            order: 'asc'
          }
        }
      }
    })

    return NextResponse.json({ questionnaire })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error("Error updating questionnaire:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE /api/questionnaires/[id] - Delete a questionnaire
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
    const { id: questionnaireId } = await params

    // Verify the user owns this questionnaire
    const existingQuestionnaire = await prisma.questionnaire.findFirst({
      where: {
        id: questionnaireId,
        userId: userId
      }
    })

    if (!existingQuestionnaire) {
      return NextResponse.json({ error: "Questionnaire not found" }, { status: 404 })
    }

    // Delete the questionnaire (cascade will handle sections and questions)
    await prisma.questionnaire.delete({
      where: {
        id: questionnaireId
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting questionnaire:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
