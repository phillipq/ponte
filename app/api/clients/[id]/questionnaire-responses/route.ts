import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "lib/auth"
import { prisma } from "lib/prisma"

export async function GET(
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
          name: session.user.name || session.user.email,
          image: session.user.image
        }
      })
    }

    const { id } = await params

    // Verify client belongs to user
    const client = await prisma.client.findFirst({
      where: {
        id: id,
        userId: user.id
      }
    })

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }

    // Get all response sets for this client
    const responseSets = await prisma.questionnaireResponseSet.findMany({
      where: { clientId: id },
      include: {
        responses: {
          include: {
            question: {
              include: {
                section: true
              }
            }
          },
          orderBy: {
            question: {
              order: 'asc'
            }
          }
        }
      },
      orderBy: [
        { version: 'desc' },
        { submittedAt: 'desc' }
      ]
    })

    // Get questionnaire structure
    const sections = await prisma.questionnaireSection.findMany({
      where: { userId: user.id },
      include: {
        questions: {
          orderBy: { order: 'asc' }
        }
      },
      orderBy: { order: 'asc' }
    })

    return NextResponse.json({
      client: {
        id: client.id,
        name: client.name,
        email: client.email
      },
      sections,
      responseSets: responseSets.map(set => ({
        id: set.id,
        version: set.version,
        status: set.status,
        source: set.source,
        submittedAt: set.submittedAt,
        responses: set.responses.map(response => ({
          id: response.id,
          questionId: response.questionId,
          questionText: response.question.question,
          sectionTitle: response.question.section.title,
          answer: response.answer,
          createdAt: response.createdAt,
          question: {
            id: response.question.id,
            question: response.question.question,
            sectionId: response.question.sectionId,
            section: {
              id: response.question.section.id,
              title: response.question.section.title
            }
          }
        }))
      }))
    })

  } catch (error) {
    console.error("Error fetching questionnaire responses:", error)
    return NextResponse.json({ error: "Failed to fetch questionnaire responses" }, { status: 500 })
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
          name: session.user.name || session.user.email,
          image: session.user.image
        }
      })
    }

    const { id } = await params
    const url = new URL(request.url)
    const responseSetId = url.searchParams.get('responseSetId')

    if (!responseSetId) {
      return NextResponse.json({ error: "Response set ID is required" }, { status: 400 })
    }

    // Verify client belongs to user
    const client = await prisma.client.findFirst({
      where: {
        id: id,
        userId: user.id
      }
    })

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }

    // Verify response set belongs to this client
    const responseSet = await prisma.questionnaireResponseSet.findFirst({
      where: {
        id: responseSetId,
        clientId: id
      }
    })

    if (!responseSet) {
      return NextResponse.json({ error: "Response set not found" }, { status: 404 })
    }

    // Delete the response set (this will cascade delete all responses)
    await prisma.questionnaireResponseSet.delete({
      where: { id: responseSetId }
    })

    return NextResponse.json({ message: "Response set deleted successfully" })

  } catch (error) {
    console.error("Error deleting response set:", error)
    return NextResponse.json({ error: "Failed to delete response set" }, { status: 500 })
  }
}
