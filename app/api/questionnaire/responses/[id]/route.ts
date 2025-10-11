import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "lib/auth"
import { prisma } from "lib/prisma"

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // Find the response set and verify it belongs to a client owned by the user
    const responseSet = await prisma.questionnaireResponseSet.findFirst({
      where: {
        id: id,
        client: {
          userId: session.user.id
        }
      },
      include: {
        client: true
      }
    })

    if (!responseSet) {
      return NextResponse.json({ error: "Response set not found" }, { status: 404 })
    }

    // Delete the response set (cascade will delete all associated responses)
    await prisma.questionnaireResponseSet.delete({
      where: {
        id: id
      }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error("Error deleting response set:", error)
    return NextResponse.json({ error: "Failed to delete response set" }, { status: 500 })
  }
}
