import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import * as XLSX from "xlsx"
import { authOptions } from "lib/auth"
import { prisma } from "lib/prisma"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = (session.user as { id: string }).id
    if (!userId) {
      return NextResponse.json({ error: "User ID not found" }, { status: 401 })
    }

    const { id: propertyId } = await params

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

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Read the file
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: "buffer" })
    const sheetName = workbook.SheetNames[0]
    if (!sheetName) {
      return NextResponse.json({ error: "No sheets found in the file" }, { status: 400 })
    }
    const worksheet = workbook.Sheets[sheetName]
    if (!worksheet) {
      return NextResponse.json({ error: "Could not read worksheet" }, { status: 400 })
    }
    
    // Parse with options to handle merged cells better
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
      header: 1,
      defval: "", // Default value for empty cells
      raw: false, // Convert all values to strings
      blankrows: false // Skip completely blank rows
    })

    if (jsonData.length < 2) {
      return NextResponse.json({ error: "File must contain at least a header row and one data row" }, { status: 400 })
    }

    // Parse the data
    const headers = jsonData[0] as string[]
    const dataRows = jsonData.slice(1) as unknown[][]

    // Check if this is the Ponte evaluation format
    // Look for the characteristic Ponte format indicators
    const hasPonteHeaders = headers.some(header => 
      header?.toString().toLowerCase().includes('categor') ||
      header?.toString().toLowerCase().includes('note') ||
      header?.toString().toLowerCase().includes('score') ||
      header?.toString().toLowerCase().includes('date')
    )
    
    // Also check if the first row contains "PROPERTY EVALUATION REPORT" which indicates Ponte format
    const hasPonteTitle = dataRows.some(row => 
      row && row[0]?.toString().toLowerCase().includes('property evaluation report')
    )
    
    const isPonteFormat = hasPonteHeaders || hasPonteTitle

    // Check if this is a field-value format (2 columns: Field, Value)
    const isFieldValueFormat = headers.length === 2 && 
      (headers[0]?.toString().toLowerCase().includes('field') || 
       headers[0]?.toString().toLowerCase().includes('item') ||
       headers[0]?.toString().toLowerCase().includes('description')) &&
      (headers[1]?.toString().toLowerCase().includes('value') || 
       headers[1]?.toString().toLowerCase().includes('score') ||
       headers[1]?.toString().toLowerCase().includes('rating'))

    const evaluationItems = []
    
    // Initialize header information
    let clientName = "Imported Evaluation"
    let propertyAddress = "Imported Property"
    let createdBy = "Excel Import"
    let evaluationDate = new Date().toISOString()

    if (isPonteFormat) {
      // Handle Ponte evaluation format
      console.log("Detected Ponte evaluation format")
      
      // Find the actual data start row (skip title and header rows)
      let dataStartRow = 0
      for (let i = 0; i < Math.min(20, jsonData.length); i++) {
        const row = jsonData[i] as unknown[]
        if (row && row.length >= 4) {
          const firstCell = row[0]?.toString().trim()
          // Look for the CATEGORIES header or numbered items
          if (firstCell?.toLowerCase().includes('categor') || 
              firstCell?.match(/^\d+\./)) {
            dataStartRow = i
            break
          }
        }
      }
      
      // Extract header information from the first few rows
      for (let i = 0; i < Math.min(10, dataStartRow); i++) {
        const row = jsonData[i] as unknown[]
        if (row && row.length >= 2) {
          const firstCell = row[0]?.toString().toLowerCase().trim()
          const secondCell = row[1]?.toString().trim()
          
          if (firstCell?.includes('client name') && secondCell) {
            clientName = secondCell
          } else if (firstCell?.includes('date') && secondCell) {
            evaluationDate = secondCell
          } else if (firstCell?.includes('created by') && secondCell) {
            createdBy = secondCell
          } else if (firstCell?.includes('property address') && secondCell) {
            propertyAddress = secondCell
          }
        }
      }
      
      // Use the data starting from the found row
      const actualDataRows = jsonData.slice(dataStartRow)
      
      // Map category names to evaluation categories
      const categoryMappings = {
        'LEGAL STATUS': 'LEGAL_STATUS',
        'PREVIOUS DECADE SEISMIC ACTIVITY REVIEW': 'SEISMIC_ACTIVITY',
        'FOUNDATION CONDITION': 'FOUNDATION_CONDITION',
        'HOME INSPECTION': 'HOME_INSPECTION',
        'SERVICE SUPPLIER REVIEW': 'SERVICE_SUPPLIER',
        'GROUNDS OR GARDENS': 'GROUNDS_GARDENS'
      }

      let currentCategory = ''
      
      for (const row of actualDataRows) {
        const typedRow = row as unknown[]
        if (!typedRow || typedRow.length === 0) continue
        
        // Handle merged cells by ensuring we have the right number of columns
        const paddedRow = Array.from({ length: 4 }, (_, i) => typedRow[i] || '')
        
        const firstCell = paddedRow[0]?.toString().trim()
        const notes = paddedRow[1]?.toString().trim() || ''
        const score = parseFloat(paddedRow[2]?.toString() || '0')
        const date = paddedRow[3]?.toString().trim() || new Date().toISOString()
        
        // Check if this is a category header
        if (firstCell && categoryMappings[firstCell.toUpperCase() as keyof typeof categoryMappings]) {
          currentCategory = categoryMappings[firstCell.toUpperCase() as keyof typeof categoryMappings]
          continue
        }
        
        // Check if this is a numbered item (starts with number and dot)
        if (firstCell && /^\d+\./.test(firstCell)) {
          const itemText = firstCell.replace(/^\d+\.\s*/, '').trim()
          
          if (currentCategory && itemText && score >= 0) {
            evaluationItems.push({
              category: currentCategory,
              item: itemText,
              score: Math.max(0, Math.min(10, score)), // Clamp between 0-10
              notes,
              date,
              evaluatedBy: "Excel Import"
            })
          }
        }
      }
    } else if (isFieldValueFormat) {
      // Handle field-value format
      console.log("Detected field-value format")
      
      // Map field names to evaluation categories
      const fieldMappings = {
        // Legal Status fields
        'liens on property': { category: 'LEGAL_STATUS', item: 'Liens on property or family dispute clarification' },
        'notary selected': { category: 'LEGAL_STATUS', item: 'Notary selected and initial property legal docs reviewed' },
        'habitable status': { category: 'LEGAL_STATUS', item: 'Habitable or non habitable status confirmation' },
        'assign engineer': { category: 'LEGAL_STATUS', item: 'Assign retained PONTE Engineer and Architect' },
        
        // Seismic Activity fields
        'review records': { category: 'SEISMIC_ACTIVITY', item: 'Review records in local town hall' },
        'meeting engineer': { category: 'SEISMIC_ACTIVITY', item: 'Meeting with retained PONTE engineer' },
        
        // Foundation Condition fields
        'expose foundation': { category: 'FOUNDATION_CONDITION', item: 'Expose foundation and assess depth and bearing capacity' },
        'underpinning report': { category: 'FOUNDATION_CONDITION', item: 'Supply underpinning report (if required)' },
        
        // Home Inspection fields
        'cracks masonry': { category: 'HOME_INSPECTION', item: 'Evaluate cracks in masonry (if required)' },
        'stairs railings': { category: 'HOME_INSPECTION', item: 'Check stairs and railings' },
        'windows doors': { category: 'HOME_INSPECTION', item: 'Check windows and doors' },
        'decks overhangs': { category: 'HOME_INSPECTION', item: 'Check decks and overhangs' },
        'out-buildings wells': { category: 'HOME_INSPECTION', item: 'Check out-buildings and wells' },
        'plumbing': { category: 'HOME_INSPECTION', item: 'Check plumbing' },
        'electrical system': { category: 'HOME_INSPECTION', item: 'Check electrical system' },
        'hvac': { category: 'HOME_INSPECTION', item: 'Check HVAC (if installed)' },
        'asbestos': { category: 'HOME_INSPECTION', item: 'Check asbestos' },
        'inspection report': { category: 'HOME_INSPECTION', item: 'Supply home inspection report' },
        
        // Service Supplier fields
        'electricity provider': { category: 'SERVICE_SUPPLIER', item: 'Connect with electricity provider' },
        'water provider': { category: 'SERVICE_SUPPLIER', item: 'Connect with water provider' },
        'gas supplier': { category: 'SERVICE_SUPPLIER', item: 'Connect with gas supplier' },
        
        // Grounds Gardens fields
        'soil quality': { category: 'GROUNDS_GARDENS', item: 'Quality and stability soil' },
        'arborist report': { category: 'GROUNDS_GARDENS', item: 'Arborist report' },
        'vineyard fruit': { category: 'GROUNDS_GARDENS', item: 'Vineyard / fruit tree quality control' },
        'underground water': { category: 'GROUNDS_GARDENS', item: 'Underground water / natural spring quality control' }
      }

      for (const row of dataRows) {
        if (row.length < 2 || !row[0] || !row[1]) continue

        const fieldName = row[0]?.toString().toLowerCase().trim()
        const value = row[1]?.toString().trim()
        
        // Find matching field mapping
        const mapping = Object.entries(fieldMappings).find(([key]) => 
          fieldName.includes(key.toLowerCase())
        )

        if (mapping) {
          const [, fieldData] = mapping
          const score = parseFloat(value) || 0
          
          evaluationItems.push({
            category: fieldData.category,
            item: fieldData.item,
            score: Math.max(0, Math.min(10, score)), // Clamp between 0-10
            notes: value,
            date: new Date().toISOString(),
            evaluatedBy: "Excel Import"
          })
        }
      }
    } else {
      // Handle standard table format
      console.log("Detected standard table format")
      
      // Expected columns with flexible matching
      const columnMappings = {
        category: ["Category", "category", "CATEGORY", "Type", "type", "TYPE"],
        item: ["Item", "item", "ITEM", "Description", "description", "DESCRIPTION", "Task", "task", "TASK"],
        score: ["Score", "score", "SCORE", "Rating", "rating", "RATING", "Points", "points", "POINTS"],
        notes: ["Notes", "notes", "NOTES", "Note", "note", "NOTE", "Comments", "comments", "COMMENTS"],
        date: ["Date", "date", "DATE", "Created", "created", "CREATED", "Timestamp", "timestamp", "TIMESTAMP"],
        evaluatedBy: ["Evaluated By", "evaluated by", "EVALUATED BY", "Evaluator", "evaluator", "EVALUATOR", "By", "by", "BY"]
      }

      // Find column indices with flexible matching
      const columnIndices = {
        category: -1,
        item: -1,
        score: -1,
        notes: -1,
        date: -1,
        evaluatedBy: -1
      }

      // Map headers to column indices
      headers.forEach((header, index) => {
        const headerStr = header?.toString().trim()
        
        // Check for category
        if (columnMappings.category.some(mapping => headerStr?.toLowerCase().includes(mapping.toLowerCase()))) {
          columnIndices.category = index
        }
        // Check for item
        if (columnMappings.item.some(mapping => headerStr?.toLowerCase().includes(mapping.toLowerCase()))) {
          columnIndices.item = index
        }
        // Check for score
        if (columnMappings.score.some(mapping => headerStr?.toLowerCase().includes(mapping.toLowerCase()))) {
          columnIndices.score = index
        }
        // Check for notes
        if (columnMappings.notes.some(mapping => headerStr?.toLowerCase().includes(mapping.toLowerCase()))) {
          columnIndices.notes = index
        }
        // Check for date
        if (columnMappings.date.some(mapping => headerStr?.toLowerCase().includes(mapping.toLowerCase()))) {
          columnIndices.date = index
        }
        // Check for evaluated by
        if (columnMappings.evaluatedBy.some(mapping => headerStr?.toLowerCase().includes(mapping.toLowerCase()))) {
          columnIndices.evaluatedBy = index
        }
      })

      // Check for missing required columns
      const missingColumns = []
      if (columnIndices.category === -1) missingColumns.push("Category")
      if (columnIndices.item === -1) missingColumns.push("Item")
      if (columnIndices.score === -1) missingColumns.push("Score")

      if (missingColumns.length > 0) {
        return NextResponse.json({ 
          error: `Missing required columns: ${missingColumns.join(", ")}. Found columns: ${headers.join(", ")}. Required columns: Category, Item, Score. Optional: Notes, Date, Evaluated By` 
        }, { status: 400 })
      }

      // Process standard table format
      for (const row of dataRows) {
        if (row.length === 0 || !row[columnIndices.category]) continue // Skip empty rows

        const category = row[columnIndices.category]?.toString() || ""
        const item = row[columnIndices.item]?.toString() || ""
        const score = parseFloat(row[columnIndices.score]?.toString() || "0")
        const notes = columnIndices.notes !== -1 ? (row[columnIndices.notes]?.toString() || "") : ""
        const date = columnIndices.date !== -1 ? (row[columnIndices.date]?.toString() || new Date().toISOString()) : new Date().toISOString()
        const evaluatedBy = columnIndices.evaluatedBy !== -1 ? (row[columnIndices.evaluatedBy]?.toString() || "") : ""

        if (category && item) {
          evaluationItems.push({
            category,
            item,
            score: Math.max(0, Math.min(10, score)), // Clamp between 0-10
            notes,
            date,
            evaluatedBy
          })
        }
      }
    }

    // Calculate totals
    let totalScore = 0
    let maxScore = 0

    for (const item of evaluationItems) {
      totalScore += item.score
      maxScore += 10
    }

    if (evaluationItems.length === 0) {
      return NextResponse.json({ 
        error: "No valid evaluation items found in the file. Please check that your Excel file has the correct format with numbered items (1., 2., 3., etc.) under each category section." 
      }, { status: 400 })
    }

    // Create the evaluation
    const evaluation = await prisma.propertyEvaluation.create({
      data: {
        propertyId,
        userId,
        clientName: isPonteFormat ? clientName : "Imported Evaluation",
        propertyAddress: isPonteFormat ? propertyAddress : (property.name || "Imported Property"),
        createdBy: isPonteFormat ? createdBy : "Excel Import",
        date: isPonteFormat ? evaluationDate : new Date().toISOString(),
        totalScore,
        maxScore,
        overallPercentage: maxScore > 0 ? (totalScore / maxScore) * 100 : 0,
        evaluationItems: {
          create: evaluationItems.map(item => ({
            category: item.category,
            item: item.item,
            score: item.score,
            notes: item.notes,
            date: item.date,
            evaluatedBy: item.evaluatedBy
          }))
        }
      },
      include: {
        evaluationItems: true
      }
    })

    return NextResponse.json({ 
      success: true, 
      evaluation,
      message: `Successfully imported ${evaluationItems.length} evaluation items`
    })

  } catch (error) {
    console.error("Error importing evaluation:", error)
    return NextResponse.json(
      { error: "Failed to import evaluation" },
      { status: 500 }
    )
  }
}
