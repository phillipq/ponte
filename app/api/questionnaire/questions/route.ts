import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"
import { authOptions } from "lib/auth"
import { prisma } from "lib/prisma"

const createQuestionSchema = z.object({
  question: z.string().min(1, "Question is required"),
  questionType: z.enum(["text", "ranking", "yesno"]).default("text"),
  order: z.number().int().min(0),
  sectionId: z.string().min(1, "Section ID is required")
})

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
    const validatedData = createQuestionSchema.parse(body)

    // Verify the section belongs to the user
    const section = await prisma.questionnaireSection.findFirst({
      where: {
        id: validatedData.sectionId,
        userId: user.id
      }
    })

    if (!section) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 })
    }

    const question = await prisma.questionnaireQuestion.create({
      data: {
        question: validatedData.question,
        questionType: validatedData.questionType,
        order: validatedData.order,
        sectionId: validatedData.sectionId
      }
    })

    return NextResponse.json({ question })
  } catch (error) {
    console.error("Error creating question:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: "Failed to create question" }, { status: 500 })
  }
}
