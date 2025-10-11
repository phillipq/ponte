import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "lib/auth"
import { prisma } from "lib/prisma"

// GET /api/admin/cleanup - Get cleanup analysis
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Find duplicate sections (same title, same questionnaire)
    const duplicateSections = await prisma.$queryRaw`
      SELECT title, "questionnaireId", COUNT(*) as count
      FROM "QuestionnaireSection"
      WHERE "userId" = ${user.id}
      GROUP BY title, "questionnaireId"
      HAVING COUNT(*) > 1
    `

    // Find orphaned sections (no questionnaire)
    const orphanedSections = await prisma.questionnaireSection.findMany({
      where: {
        userId: user.id,
        questionnaireId: null
      },
      include: {
        questions: true
      }
    })

    // Find duplicate client responses (same email, same import source)
    const duplicateResponses = await prisma.$queryRaw`
      SELECT c.email, qrs.source, qrs."submittedAt", COUNT(*) as count
      FROM "QuestionnaireResponseSet" qrs
      JOIN "Client" c ON qrs."clientId" = c.id
      WHERE c."userId" = ${user.id}
      GROUP BY c.email, qrs.source, qrs."submittedAt"
      HAVING COUNT(*) > 1
    `

    // Find sections with no questions
    const emptySections = await prisma.questionnaireSection.findMany({
      where: {
        userId: user.id,
        questions: {
          none: {}
        }
      },
      include: {
        questionnaire: true
      }
    })

    return NextResponse.json({
      duplicateSections,
      orphanedSections,
      duplicateResponses,
      emptySections,
      summary: {
        duplicateSectionsCount: (duplicateSections as any[]).length,
        orphanedSectionsCount: orphanedSections.length,
        duplicateResponsesCount: (duplicateResponses as any[]).length,
        emptySectionsCount: emptySections.length
      }
    })
  } catch (error) {
    console.error("Error analyzing cleanup:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST /api/admin/cleanup - Perform cleanup operations
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const { action } = await request.json()

    let results = {}

    switch (action) {
      case 'removeOrphanedSections':
        // Remove sections with no questionnaire
        const orphanedSections = await prisma.questionnaireSection.findMany({
          where: {
            userId: user.id,
            questionnaireId: null
          }
        })
        
        for (const section of orphanedSections) {
          await prisma.questionnaireSection.delete({
            where: { id: section.id }
          })
        }
        
        results = { removedOrphanedSections: orphanedSections.length }
        break

      case 'removeEmptySections':
        // Remove sections with no questions
        const emptySections = await prisma.questionnaireSection.findMany({
          where: {
            userId: user.id,
            questions: {
              none: {}
            }
          }
        })
        
        for (const section of emptySections) {
          await prisma.questionnaireSection.delete({
            where: { id: section.id }
          })
        }
        
        results = { removedEmptySections: emptySections.length }
        break

      case 'removeDuplicateSections':
        // Find and remove duplicate sections (keep the first one)
        const duplicateSections = await prisma.$queryRaw`
          SELECT id, title, "questionnaireId", ROW_NUMBER() OVER (PARTITION BY title, "questionnaireId" ORDER BY "createdAt") as rn
          FROM "QuestionnaireSection"
          WHERE "userId" = ${user.id}
        ` as any[]

        const duplicatesToRemove = duplicateSections.filter(d => d.rn > 1)
        
        for (const duplicate of duplicatesToRemove) {
          await prisma.questionnaireSection.delete({
            where: { id: duplicate.id }
          })
        }
        
        results = { removedDuplicateSections: duplicatesToRemove.length }
        break

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    return NextResponse.json({ success: true, results })
  } catch (error) {
    console.error("Error performing cleanup:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
