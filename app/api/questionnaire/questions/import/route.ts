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

    // Get existing sections for this user
    const existingSections = await prisma.questionnaireSection.findMany({
      where: { 
        userId
      },
      include: { 
        questions: {
          orderBy: { order: 'asc' }
        }
      }
    })

    const sectionMap = new Map()
    existingSections.forEach(section => {
      sectionMap.set(section.title.toLowerCase(), section)
    })

    const results = []

    // Process each record
    for (const record of records) {
      const sectionName = (record as { section?: string }).section?.trim()
      const question = (record as { question?: string }).question?.trim()
      const order = parseInt((record as { order?: string }).order || '0') || 0

      if (!sectionName || !question) continue

      let section = sectionMap.get(sectionName.toLowerCase())

      // Create section if it doesn't exist
      if (!section) {
        section = await prisma.questionnaireSection.create({
          data: {
            title: sectionName,
            order: sectionMap.size + 1,
            userId
          },
          include: {
            questions: true
          }
        })
        sectionMap.set(sectionName.toLowerCase(), section)
      }

      // Ensure section has questions array
      if (!section.questions) {
        section.questions = []
      }

      // Check if question already exists
      const existingQuestion = section.questions.find((q: unknown) => 
        (q as { question: string }).question.toLowerCase().trim() === question.toLowerCase().trim()
      )

      let isNew = false
      if (!existingQuestion) {
        // Create new question
        await prisma.questionnaireQuestion.create({
          data: {
            question,
            order,
            sectionId: section.id
          }
        })
        isNew = true
      } else {
        // Update existing question order if different
        if (existingQuestion.order !== order) {
          await prisma.questionnaireQuestion.update({
            where: { id: existingQuestion.id },
            data: { order }
          })
        }
      }

      results.push({
        section: sectionName,
        question,
        order,
        isNew
      })
    }

    return NextResponse.json({
      success: true,
      results,
      message: `Successfully imported ${results.length} questions`
    })

  } catch (error) {
    console.error("Error importing questions:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
