import { parse } from "csv-parse/sync"
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "lib/auth"
import { prisma } from "lib/prisma"

export async function POST(request: NextRequest) {
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
          name: session.user.name || "Unknown User"
        }
      })
    }

    const userId = user.id
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const text = await file.text()
    const records = parse(text, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    })

    // Validate required columns
    const requiredColumns = ["section", "question", "order"]
    const headers = Object.keys(records[0] || {})
    const missingColumns = requiredColumns.filter(col => !headers.includes(col))

    if (missingColumns.length > 0) {
      return NextResponse.json({ 
        error: `Missing required columns: ${missingColumns.join(", ")}` 
      }, { status: 400 })
    }

    // Get existing sections and questions
    const existingSections = await prisma.questionnaireSection.findMany({
      where: { userId },
      include: { questions: true }
    })

    const existingQuestions = existingSections.flatMap(section => 
      section.questions.map(q => q.question.toLowerCase().trim())
    )

    // Process the data
    const sections = new Map()
    let totalQuestions = 0
    let newQuestions = 0

    for (const record of records) {
      const sectionName = (record as { section?: string }).section?.trim()
      const question = (record as { question?: string }).question?.trim()
      const order = parseInt((record as { order?: string }).order || '0') || 0

      if (!sectionName || !question) continue

      totalQuestions++

      // Check if question is new
      if (!existingQuestions.includes(question.toLowerCase())) {
        newQuestions++
      }

      // Group by section
      if (!sections.has(sectionName)) {
        sections.set(sectionName, {
          name: sectionName,
          questionCount: 0,
          questions: []
        })
      }

      const section = sections.get(sectionName)
      section.questionCount++
      section.questions.push({
        question,
        order,
        isNew: !existingQuestions.includes(question.toLowerCase())
      })
    }

    return NextResponse.json({
      totalQuestions,
      newQuestions,
      sections: Array.from(sections.values())
    })

  } catch (error) {
    console.error("Error validating questions:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
