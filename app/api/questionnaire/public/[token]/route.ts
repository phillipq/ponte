import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "lib/prisma"

const submitResponseSchema = z.object({
  responses: z.array(z.object({
    questionId: z.string().min(1, "Question ID is required"),
    answer: z.string()
  }))
})

// GET /api/questionnaire/public/[token] - Get questionnaire for client
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    // Find the invite by token
    const invite = await prisma.questionnaireInvite.findUnique({
      where: { token },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    if (!invite) {
      return NextResponse.json({ error: "Invalid questionnaire link" }, { status: 404 })
    }

    // Check if invite is expired
    if (new Date() > invite.expiresAt) {
      return NextResponse.json({ error: "This questionnaire link has expired" }, { status: 410 })
    }

    // Check if already completed
    if (invite.status === "completed") {
      return NextResponse.json({ 
        error: "This questionnaire has already been completed",
        completed: true 
      }, { status: 410 })
    }

    // Get all questionnaire questions for the user who created the invite
    const questions = await prisma.questionnaireQuestion.findMany({
      where: {
        section: {
          userId: invite.userId
        }
      },
      include: {
        section: {
          select: {
            id: true,
            title: true,
            order: true
          }
        }
      },
      orderBy: [
        { section: { order: 'asc' } },
        { order: 'asc' }
      ]
    })

    // Group questions by section
    const sections = questions.reduce((acc, question) => {
      const sectionId = question.section.id
      if (!acc[sectionId]) {
        acc[sectionId] = {
          id: question.section.id,
          title: question.section.title,
          order: question.section.order,
          questions: []
        }
      }
      acc[sectionId].questions.push({
        id: question.id,
        question: question.question,
        questionType: question.questionType,
        order: question.order
      })
      return acc
    }, {} as Record<string, any>)

    const sectionsArray = Object.values(sections).sort((a: any, b: any) => a.order - b.order)

    return NextResponse.json({
      invite: {
        id: invite.id,
        client: invite.client,
        expiresAt: invite.expiresAt,
        status: invite.status
      },
      questionnaire: {
        sections: sectionsArray
      }
    })

  } catch (error) {
    console.error("Error fetching public questionnaire:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST /api/questionnaire/public/[token] - Submit questionnaire responses
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const body = await request.json()
    const validatedData = submitResponseSchema.parse(body)

    // Find the invite by token
    const invite = await prisma.questionnaireInvite.findUnique({
      where: { token },
      include: {
        client: true
      }
    })

    if (!invite) {
      return NextResponse.json({ error: "Invalid questionnaire link" }, { status: 404 })
    }

    // Check if invite is expired
    if (new Date() > invite.expiresAt) {
      return NextResponse.json({ error: "This questionnaire link has expired" }, { status: 410 })
    }

    // Check if already completed
    if (invite.status === "completed") {
      return NextResponse.json({ error: "This questionnaire has already been completed" }, { status: 410 })
    }

    // Get the latest version number for this client
    const latestResponseSet = await prisma.questionnaireResponseSet.findFirst({
      where: { clientId: invite.clientId },
      orderBy: { version: 'desc' }
    })

    const nextVersion = (latestResponseSet?.version || 0) + 1

    // Create new response set
    const responseSet = await prisma.questionnaireResponseSet.create({
      data: {
        clientId: invite.clientId,
        version: nextVersion,
        status: "submitted",
        source: "public_questionnaire"
      }
    })

    // Create response records
    const responseRecords = []
    for (const responseData of validatedData.responses) {
      const response = await prisma.questionnaireResponse.create({
        data: {
          responseSetId: responseSet.id,
          questionId: responseData.questionId,
          answer: responseData.answer
        }
      })
      responseRecords.push(response)
    }

    // Update invite status to completed
    await prisma.questionnaireInvite.update({
      where: { id: invite.id },
      data: { status: "completed" }
    })

    return NextResponse.json({
      success: true,
      message: "Questionnaire submitted successfully",
      responseSet: {
        id: responseSet.id,
        version: responseSet.version,
        responsesCount: responseRecords.length
      }
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error("Error submitting questionnaire:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
