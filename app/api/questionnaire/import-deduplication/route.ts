import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "lib/auth"
import { prisma } from "lib/prisma"

// POST /api/questionnaire/import-deduplication - Check for duplicate imports
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

    const { csvData, importSource } = await request.json() as { csvData?: unknown[]; importSource?: string }

    if (!csvData || !Array.isArray(csvData) || csvData.length === 0) {
      return NextResponse.json({ error: "No CSV data provided" }, { status: 400 })
    }

    // Get existing client response sets
    const existingResponseSets = await prisma.questionnaireResponseSet.findMany({
      where: {
        client: {
          userId: user.id
        },
        source: importSource || "import"
      },
      include: {
        client: true,
        responses: true
      }
    })

    // Create a map of existing responses by email and submission date
    const existingResponsesMap = new Map()
    existingResponseSets.forEach(responseSet => {
      const key = `${responseSet.client.email}-${responseSet.submittedAt.toISOString().split('T')[0]}`
      existingResponsesMap.set(key, responseSet)
    })

    // Analyze CSV for potential duplicates
    const analysis = {
      totalRows: csvData.length,
      potentialDuplicates: [] as { email: string; submissionDate: string; existingResponseSetId: string; existingResponseCount: number }[],
      newResponses: [] as { email: string; submissionDate: string }[],
      existingEmails: new Set<string>(),
      newEmails: new Set<string>()
    }

    for (const row of csvData) {
      const rowData = row as { email?: string; 'email address'?: string; Email?: string }
      const email = rowData.email || rowData['email address'] || rowData.Email
      const submissionDate = new Date().toISOString().split('T')[0] // Today's date for new imports
      
      if (email && submissionDate) {
        const key = `${email}-${submissionDate}`
        
        if (existingResponsesMap.has(key)) {
          const existingResponse = existingResponsesMap.get(key) as { id: string; responses: unknown[] }
          analysis.potentialDuplicates.push({
            email,
            submissionDate,
            existingResponseSetId: existingResponse.id,
            existingResponseCount: existingResponse.responses.length
          })
          analysis.existingEmails.add(email)
        } else {
          analysis.newResponses.push({
            email,
            submissionDate
          })
          analysis.newEmails.add(email)
        }
      }
    }

    return NextResponse.json({
      analysis,
      recommendations: {
        canProceed: analysis.potentialDuplicates.length === 0,
        duplicateCount: analysis.potentialDuplicates.length,
        newResponseCount: analysis.newResponses.length,
        existingEmailCount: analysis.existingEmails.size,
        newEmailCount: analysis.newEmails.size
      }
    })
  } catch (error) {
    console.error("Error analyzing import deduplication:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
