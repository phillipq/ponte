import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "lib/auth"
import { prisma } from "lib/prisma"

// PUT /api/properties/[id]/evaluations/[evaluationId]/items - Update evaluation items
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string, evaluationId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as { id: string }).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id, evaluationId } = await params
    const body = await request.json() as { items?: unknown[] }
    const { items } = body

    // Verify evaluation belongs to user
    const evaluation = await prisma.propertyEvaluation.findFirst({
      where: {
        id: evaluationId,
        propertyId: id,
        userId: (session.user as { id: string }).id
      },
      include: {
        evaluationItems: true
      }
    })

    if (!evaluation) {
      return NextResponse.json({ error: "Evaluation not found" }, { status: 404 })
    }

    // Update each evaluation item
    for (const item of items || []) {
      const itemData = item as { 
        id: string; 
        notes?: string; 
        score?: number; 
        date?: string; 
        evaluatedBy?: string 
      }
      await prisma.propertyEvaluationItem.update({
        where: {
          id: itemData.id
        },
        data: {
          notes: itemData.notes || null,
          score: itemData.score || 0,
          date: itemData.date ? new Date(itemData.date) : null,
          evaluatedBy: itemData.evaluatedBy || null
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
        const category = (item as { category: string }).category
        if (!acc[category]) {
          acc[category] = []
        }
        acc[category].push(item)
        return acc
      }, {} as Record<string, unknown[]>)

      // Calculate overall score
      const categoryScores = Object.values(categories).map(categoryItems => {
        const totalScore = categoryItems.reduce((sum: number, item) => sum + ((item as { score?: number }).score || 0), 0)
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
