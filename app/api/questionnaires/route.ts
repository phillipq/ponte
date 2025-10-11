import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "lib/auth"
import { prisma } from "lib/prisma"
import { z } from "zod"

const createQuestionnaireSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  isDefault: z.boolean().optional()
})

// GET /api/questionnaires - Get all questionnaires for the user
export async function GET(request: NextRequest) {
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
      // Create user if they don't exist
      user = await prisma.user.create({
        data: {
          email: session.user.email,
          name: session.user.name || "Unknown User"
        }
      })
    }

    const userId = user.id

    const questionnaires = await prisma.questionnaire.findMany({
      where: {
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
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ questionnaires })
  } catch (error) {
    console.error("Error fetching questionnaires:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST /api/questionnaires - Create a new questionnaire
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
      // Create user if they don't exist
      user = await prisma.user.create({
        data: {
          email: session.user.email,
          name: session.user.name || "Unknown User"
        }
      })
    }

    const userId = user.id
    
    const body = await request.json()
    const { name, description, isDefault } = createQuestionnaireSchema.parse(body)

    // If this is set as default, unset other defaults
    if (isDefault) {
      await prisma.questionnaire.updateMany({
        where: {
          userId,
          isDefault: true
        },
        data: {
          isDefault: false
        }
      })
    }

    const questionnaire = await prisma.questionnaire.create({
      data: {
        userId,
        name,
        description,
        isDefault: isDefault || false
      }
    })

    return NextResponse.json({ questionnaire }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error("Error creating questionnaire:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
