import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"
import { authOptions } from "lib/auth"
import { prisma } from "lib/prisma"

const updateResponseSchema = z.object({
  answer: z.string().min(1, "Answer is required")
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; responseId: string }> }
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

    const { id: clientId, responseId } = await params
    const body = await request.json()
    const validatedData = updateResponseSchema.parse(body)

    // Verify the client belongs to the user
    const client = await prisma.client.findFirst({
      where: { 
        id: clientId,
        userId: user.id 
      }
    })

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }

    // Verify the response belongs to the client through the responseSet
    const response = await prisma.questionnaireResponse.findFirst({
      where: { 
        id: responseId,
        responseSet: {
          clientId: clientId
        }
      }
    })

    if (!response) {
      return NextResponse.json({ error: "Response not found" }, { status: 404 })
    }

    // Update the response
    const updatedResponse = await prisma.questionnaireResponse.update({
      where: { id: responseId },
      data: {
        answer: validatedData.answer
      }
    })

    return NextResponse.json({ response: updatedResponse })
  } catch (error) {
    console.error("Error updating response:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: "Failed to update response" }, { status: 500 })
  }
}
