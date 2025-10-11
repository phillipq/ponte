import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "lib/auth"
import { prisma } from "lib/prisma"
import { z } from "zod"

const createResponseSchema = z.object({
  clientId: z.string().min(1, "Client ID is required"),
  responses: z.array(z.object({
    questionId: z.string().min(1, "Question ID is required"),
    answer: z.string()
  })),
  status: z.string().default("submitted"),
  source: z.string().default("manual")
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createResponseSchema.parse(body)

    // Verify client belongs to user
    const client = await prisma.client.findFirst({
      where: {
        id: validatedData.clientId,
        userId: session.user.id
      }
    })

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }

    // Get the latest version number for this client
    const latestResponseSet = await prisma.questionnaireResponseSet.findFirst({
      where: { clientId: validatedData.clientId },
      orderBy: { version: 'desc' }
    })

    const nextVersion = (latestResponseSet?.version || 0) + 1

    // Create new response set
    const responseSet = await prisma.questionnaireResponseSet.create({
      data: {
        clientId: validatedData.clientId,
        version: nextVersion,
        status: validatedData.status,
        source: validatedData.source
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

    return NextResponse.json({
      success: true,
      responseSet: {
        id: responseSet.id,
        version: responseSet.version,
        status: responseSet.status,
        source: responseSet.source,
        responsesCount: responseRecords.length
      }
    })

  } catch (error) {
    console.error("Error creating questionnaire response:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: "Failed to create questionnaire response" }, { status: 500 })
  }
}
