import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"
import { authOptions } from "lib/auth"
import { prisma } from "lib/prisma"

const importResponseSchema = z.object({
  email: z.string().email("Valid email is required"),
  name: z.string().optional(),
  responses: z.record(z.string(), z.string()), // question -> answer mapping
  source: z.string().default("import"),
  confirmedMatches: z.array(z.string()).optional() // confirmed potential matches
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = importResponseSchema.parse(body)

    // Check if client exists by email
    const existingClient = await prisma.client.findFirst({
      where: {
        email: validatedData.email,
        userId: session.user.id
      }
    })

    let client
    if (existingClient) {
      client = existingClient
    } else {
      // Create new client if no match found
      client = await prisma.client.create({
        data: {
          name: validatedData.name || "Unknown Client",
          email: validatedData.email,
          userId: session.user.id
        }
      })
    }

    // Get the latest version number for this client
    const latestResponseSet = await prisma.questionnaireResponseSet.findFirst({
      where: { clientId: client.id },
      orderBy: { version: 'desc' }
    })

    const nextVersion = (latestResponseSet?.version || 0) + 1

    // Create new response set
    const responseSet = await prisma.questionnaireResponseSet.create({
      data: {
        clientId: client.id,
        version: nextVersion,
        status: "submitted",
        source: validatedData.source
      }
    })

    // Get all questions to map responses
    const questions = await prisma.questionnaireQuestion.findMany({
      where: {
        section: {
          userId: session.user.id
        }
      },
      include: {
        section: true
      }
    })

    // Create response records
    const responseRecords = []
    for (const [questionText, answer] of Object.entries(validatedData.responses)) {
      // Try exact match first
      let question = questions.find(q => q.question === questionText)
      
      // If no exact match, try normalized matching
      if (!question) {
        const normalizedQuestionText = normalizeText(questionText)
        question = questions.find(q => normalizeText(q.question) === normalizedQuestionText)
      }
      
      // If still no match, check if this is a confirmed potential match
      if (!question && validatedData.confirmedMatches) {
        for (const confirmedMatch of validatedData.confirmedMatches) {
          const [dbQuestion, csvQuestion] = confirmedMatch.split('-')
          if (normalizeText(questionText) === normalizeText(csvQuestion)) {
            question = questions.find(q => normalizeText(q.question) === normalizeText(dbQuestion))
            break
          }
        }
      }
      
      if (question) {
        const response = await prisma.questionnaireResponse.create({
          data: {
            responseSetId: responseSet.id,
            questionId: question.id,
            answer: answer
          }
        })
        responseRecords.push(response)
      }
    }

    return NextResponse.json({
      success: true,
      client: {
        id: client.id,
        name: client.name,
        email: client.email,
        isNew: !existingClient
      },
      responseSet: {
        id: responseSet.id,
        version: responseSet.version,
        responsesCount: responseRecords.length
      }
    })

  } catch (error) {
    console.error("Error importing questionnaire response:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: "Failed to import questionnaire response" }, { status: 500 })
  }
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    // Fix UTF-8 encoding issues
    .replace(/â€™/g, "'")
    .replace(/â€œ/g, '"')
    .replace(/â€/g, '"')
    .replace(/â€"/g, '"')
    .replace(/â€"/g, '"')
    // Normalize quotes and apostrophes
    .replace(/[''`]/g, "'")
    .replace(/["""]/g, '"')
    .replace(/[–—]/g, '-')
    // Normalize common abbreviations
    .replace(/\beg\b/g, 'e.g.')
    .replace(/\bie\b/g, 'i.e.')
    .replace(/\betc\b/g, 'etc.')
    // Remove extra spaces
    .replace(/\s+/g, ' ')
    // Remove common punctuation differences
    .replace(/[.,;:!?]+$/, '')
}
