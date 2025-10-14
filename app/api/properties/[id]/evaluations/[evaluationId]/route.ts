import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "lib/auth"
import { prisma } from "lib/prisma"

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; evaluationId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = (session.user as any).id
    if (!userId) {
      return NextResponse.json({ error: "User ID not found" }, { status: 401 })
    }

    const { id: propertyId, evaluationId } = await params

    // Verify property exists and belongs to user
    const property = await prisma.property.findFirst({
      where: {
        id: propertyId,
        userId: userId
      }
    })

    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 })
    }

    // Delete the evaluation and its items
    await prisma.propertyEvaluation.delete({
      where: {
        id: evaluationId
      }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error("Error deleting evaluation:", error)
    return NextResponse.json(
      { error: "Failed to delete evaluation" },
      { status: 500 }
    )
  }
}
