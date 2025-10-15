import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"
import { randomBytes } from "crypto"
import { authOptions } from "lib/auth"
import { prisma } from "lib/prisma"

const createInviteSchema = z.object({
  clientId: z.string().min(1, "Client ID is required"),
  expiresInDays: z.number().min(1).max(365).default(30) // Default 30 days
})

// POST /api/questionnaire/invite - Create a new questionnaire invite
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createInviteSchema.parse(body)

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

    // Generate secure token
    const token = randomBytes(32).toString('hex')
    
    // Calculate expiration date
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + validatedData.expiresInDays)

    // Create invite
    const invite = await prisma.questionnaireInvite.create({
      data: {
        clientId: validatedData.clientId,
        token,
        expiresAt,
        userId: session.user.id
      },
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

    // Generate the public questionnaire URL
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const questionnaireUrl = `${baseUrl}/questionnaire/public/${token}`

    return NextResponse.json({
      success: true,
      invite: {
        id: invite.id,
        token: invite.token,
        expiresAt: invite.expiresAt,
        status: invite.status,
        client: invite.client,
        questionnaireUrl
      }
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error("Error creating questionnaire invite:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// GET /api/questionnaire/invite - Get all invites for the user
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const invites = await prisma.questionnaireInvite.findMany({
      where: {
        userId: session.user.id
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Add questionnaire URLs
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const invitesWithUrls = invites.map(invite => ({
      ...invite,
      questionnaireUrl: `${baseUrl}/questionnaire/public/${invite.token}`
    }))

    return NextResponse.json({ invites: invitesWithUrls })

  } catch (error) {
    console.error("Error fetching questionnaire invites:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
