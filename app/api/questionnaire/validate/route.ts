import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "lib/auth"
import { prisma } from "lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!(session?.user as { id: string })?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { csvData } = await request.json() as { csvData?: unknown[] }

    if (!csvData || !Array.isArray(csvData) || csvData.length === 0) {
      return NextResponse.json({ error: "No CSV data provided" }, { status: 400 })
    }

    // Get all questions from the database
    const dbQuestions = await prisma.questionnaireQuestion.findMany({
      where: {
        section: {
          userId: (session?.user as { id: string })?.id
        }
      },
      include: {
        section: true
      },
      orderBy: [
        { section: { order: 'asc' } },
        { order: 'asc' }
      ]
    })

    // Get CSV headers (first row)
    const csvHeaders = Object.keys(csvData[0] as Record<string, unknown>)
    
    // Remove standard columns that aren't questions
    const standardColumns = ['timestamp', 'email', 'email address', 'name']
    const questionColumns = csvHeaders.filter(header => 
      !standardColumns.includes(header.toLowerCase())
    )

    // Analyze CSV structure
    const csvAnalysis = {
      totalColumns: csvHeaders.length,
      standardColumns: csvHeaders.filter(header => 
        standardColumns.includes(header.toLowerCase())
      ),
      questionColumns: questionColumns.length,
      emptyColumns: questionColumns.filter(header => {
        // Check if column has any non-empty values
        return !csvData.slice(1).some(row => {
          const rowData = row as Record<string, unknown>
          return rowData[header] && rowData[header]?.toString().trim() !== ''
        })
      }),
      duplicateQuestions: findDuplicateQuestions(questionColumns)
    }

    // Create comparison report
    const comparison = {
      totalDbQuestions: dbQuestions.length,
      totalCsvQuestions: questionColumns.length,
      dbQuestions: dbQuestions.map(q => ({
        id: q.id,
        question: q.question,
        section: q.section.title,
        order: q.order
      })),
      csvQuestions: questionColumns,
      matches: [] as { dbQuestion: string; csvQuestion: string; section: string }[],
      missingInCsv: [] as { question: string; section: string }[],
      missingInDb: [] as { question: string }[],
      partialMatches: [] as { dbQuestion: string; csvQuestion: string; section: string; similarity: number }[]
    }

    // Find exact matches
    for (const dbQuestion of dbQuestions) {
      const normalizedDbQuestion = normalizeText(dbQuestion.question)
      
      const exactMatch = questionColumns.find(csvQ => {
        const normalizedCsvQuestion = normalizeText(csvQ)
        return normalizedCsvQuestion === normalizedDbQuestion
      })
      
      if (exactMatch) {
        comparison.matches.push({
          dbQuestion: dbQuestion.question,
          csvQuestion: exactMatch,
          section: dbQuestion.section.title
        })
      } else {
        // Look for partial matches with normalized text
        const partialMatch = questionColumns.find(csvQ => {
          const normalizedCsvQuestion = normalizeText(csvQ)
          const similarity = calculateSimilarity(normalizedDbQuestion, normalizedCsvQuestion)
          return similarity > 0.8 // Increased threshold for better matching
        })
        
        if (partialMatch) {
          comparison.partialMatches.push({
            dbQuestion: dbQuestion.question,
            csvQuestion: partialMatch,
            section: dbQuestion.section.title,
            similarity: calculateSimilarity(
              normalizeText(dbQuestion.question),
              normalizeText(partialMatch)
            )
          })
        } else {
          comparison.missingInCsv.push({
            question: dbQuestion.question,
            section: dbQuestion.section.title
          })
        }
      }
    }

    // Find CSV questions not in database
    for (const csvQuestion of questionColumns) {
      const hasMatch = comparison.matches.some(match => 
        match.csvQuestion === csvQuestion
      ) || comparison.partialMatches.some(match => 
        match.csvQuestion === csvQuestion
      )
      
      if (!hasMatch) {
        comparison.missingInDb.push({
          question: csvQuestion
        })
      }
    }

    // Calculate response completeness for each client
    const clientAnalysis = csvData.slice(1).map((row, index) => {
      const rowData = row as Record<string, unknown>
      const email = rowData['Email Address'] || rowData['email'] || rowData['Email']
      const responses = Object.entries(rowData).filter(([key, value]) => {
        const lowerKey = key.toLowerCase()
        return !['timestamp', 'email', 'email address', 'name'].includes(lowerKey) && 
               value && 
               value.toString().trim() !== ''
      })
      
      return {
        rowIndex: index + 2, // +2 because CSV is 1-indexed and we skip header
        email: email || 'No email provided',
        totalResponses: responses.length,
        totalQuestions: questionColumns.length,
        completeness: Math.round((responses.length / questionColumns.length) * 100),
        missingResponses: questionColumns.length - responses.length
      }
    }).filter(client => client.email !== 'No email provided')

    return NextResponse.json({
      success: true,
      csvAnalysis,
      comparison,
      clientAnalysis,
      summary: {
        totalClients: clientAnalysis.length,
        averageCompleteness: Math.round(
          clientAnalysis.reduce((sum, client) => sum + client.completeness, 0) / clientAnalysis.length
        ),
        fullyComplete: clientAnalysis.filter(c => c.completeness === 100).length,
        partiallyComplete: clientAnalysis.filter(c => c.completeness > 0 && c.completeness < 100).length,
        noResponses: clientAnalysis.filter(c => c.completeness === 0).length
      }
    })

  } catch (error) {
    console.error("Error validating questionnaire:", error)
    return NextResponse.json({ error: "Failed to validate questionnaire" }, { status: 500 })
  }
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    // Fix UTF-8 encoding issues
    .replace(/â€™/g, "'")
    .replace(/â€œ/g, '"')
    .replace(/â€/g, '"')
    .replace(/â€"/g, '"')
    .replace(/â€"/g, '"')
    // Normalize quotes and apostrophes
    .replace(/[''`]/g, "'")
    .replace(/["""]/g, '"')
    .replace(/[–—]/g, '-')
    // Normalize common abbreviations
    .replace(/\beg\b/g, 'e.g.')
    .replace(/\bie\b/g, 'i.e.')
    .replace(/\betc\b/g, 'etc.')
    // Remove extra spaces
    .replace(/\s+/g, ' ')
    // Remove common punctuation differences
    .replace(/[.,;:!?]+$/, '')
}

function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2
  const shorter = str1.length > str2.length ? str2 : str1
  
  if (longer.length === 0) return 1.0
  
  const distance = levenshteinDistance(longer, shorter)
  return (longer.length - distance) / longer.length
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = []
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i]
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0]![j] = j
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i]![j] = matrix[i - 1]![j - 1]!
      } else {
        matrix[i]![j] = Math.min(
          matrix[i - 1]![j - 1]! + 1,
          matrix[i]![j - 1]! + 1,
          matrix[i - 1]![j]! + 1
        )
      }
    }
  }
  
  return matrix[str2.length]![str1.length]!
}

function findDuplicateQuestions(questions: string[]): string[] {
  const normalizedQuestions = questions.map(q => normalizeText(q))
  const duplicates: string[] = []
  
  for (let i = 0; i < normalizedQuestions.length; i++) {
    for (let j = i + 1; j < normalizedQuestions.length; j++) {
      if (normalizedQuestions[i] === normalizedQuestions[j]) {
        if (questions[i]) {
          duplicates.push(questions[i]!)
        }
        break
      }
    }
  }
  
  return duplicates
}
