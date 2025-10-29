import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "lib/auth"
import { prisma } from "lib/prisma"

// DELETE /api/questionnaire/invite/[id] - Cancel/delete a questionnaire invite
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!(session?.user as { id: string })?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: inviteId } = await params

    if (!inviteId) {
      return NextResponse.json({ error: "Invite ID is required" }, { status: 400 })
    }

    // Verify invite belongs to user and delete it
    const deletedInvite = await prisma.questionnaireInvite.deleteMany({
      where: {
        id: inviteId,
        userId: (session?.user as { id: string })?.id
      }
    })

    if (deletedInvite.count === 0) {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 })
    }

    return NextResponse.json({ 
      success: true, 
      message: "Questionnaire invite cancelled successfully" 
    })

  } catch (error) {
    console.error("Error cancelling questionnaire invite:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
