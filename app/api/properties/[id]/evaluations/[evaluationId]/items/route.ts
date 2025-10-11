import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "lib/auth"
import { prisma } from "lib/prisma"
import { calculateOverallScore } from "lib/property-evaluation"

// PUT /api/properties/[id]/evaluations/[evaluationId]/items - Update evaluation items
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string, evaluationId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id, evaluationId } = await params
    const body = await request.json()
    const { items } = body

    // Verify evaluation belongs to user
    const evaluation = await prisma.propertyEvaluation.findFirst({
      where: {
        id: evaluationId,
        propertyId: id,
        userId: session.user.id
      },
      include: {
        evaluationItems: true
      }
    })

    if (!evaluation) {
      return NextResponse.json({ error: "Evaluation not found" }, { status: 404 })
    }

    // Update each evaluation item
    for (const item of items) {
      await prisma.propertyEvaluationItem.update({
        where: {
          id: item.id
        },
        data: {
          notes: item.notes || null,
          score: item.score || 0,
          date: item.date ? new Date(item.date) : null,
          evaluatedBy: item.evaluatedBy || null
        }
      })
    }

    // Recalculate overall scores
    const updatedEvaluation = await prisma.propertyEvaluation.findUnique({
      where: { id: evaluationId },
      include: { evaluationItems: true }
    })

    if (updatedEvaluation) {
      // Group items by category and calculate scores
      const categories = updatedEvaluation.evaluationItems.reduce((acc, item) => {
        if (!acc[item.category]) {
          acc[item.category] = []
        }
        acc[item.category].push(item)
        return acc
      }, {} as Record<string, any[]>)

      // Calculate overall score
      const categoryScores = Object.values(categories).map(categoryItems => {
        const totalScore = categoryItems.reduce((sum, item) => sum + (item.score || 0), 0)
        const maxScore = categoryItems.length * 10
        return { totalScore, maxScore }
      })

      const overallScore = categoryScores.reduce((sum, cat) => sum + cat.totalScore, 0)
      const maxScore = categoryScores.reduce((sum, cat) => sum + cat.maxScore, 0)
      const overallPercentage = maxScore > 0 ? (overallScore / maxScore) * 100 : 0

      // Update evaluation with new scores
      await prisma.propertyEvaluation.update({
        where: { id: evaluationId },
        data: {
          totalScore: overallScore,
          maxScore: maxScore,
          overallPercentage: overallPercentage
        }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating evaluation items:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
