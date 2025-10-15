import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"
import { authOptions } from "lib/auth"
import { prisma } from "lib/prisma"

const updatePreferencesSchema = z.object({
  preferredProperties: z.array(z.string()).optional()
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
          name: session.user.name || session.user.email,
          image: session.user.image
        }
      })
    }

    const { id } = await params
    const body = await request.json()
    const { preferredProperties } = updatePreferencesSchema.parse(body)

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

    // Update client preferences
    const updatedClient = await prisma.client.update({
      where: { id },
      data: {
        preferredProperties: preferredProperties || []
      }
    })

    return NextResponse.json({ 
      success: true, 
      client: updatedClient 
    })
  } catch (error) {
    console.error("Error updating preferences:", error)
    return NextResponse.json({ error: "Failed to update preferences" }, { status: 500 })
  }
}
