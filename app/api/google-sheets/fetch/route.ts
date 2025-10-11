import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()
    
    if (!url) {
      return NextResponse.json({ error: "Google Sheets URL is required" }, { status: 400 })
    }

    // Extract spreadsheet ID from Google Sheets URL
    const spreadsheetId = extractSpreadsheetId(url)
    if (!spreadsheetId) {
      return NextResponse.json({ error: "Invalid Google Sheets URL" }, { status: 400 })
    }

    // For now, we'll use a simple approach - the user will need to export as CSV
    // In a production environment, you'd use Google Sheets API with proper authentication
    return NextResponse.json({
      success: true,
      message: "Please export your Google Sheet as CSV and upload it instead. Google Sheets API integration requires additional setup.",
      spreadsheetId,
      instructions: [
        "1. Open your Google Sheet",
        "2. Go to File > Download > Comma-separated values (.csv)",
        "3. Upload the downloaded CSV file using the import feature"
      ]
    })

  } catch (error) {
    console.error("Error fetching Google Sheets data:", error)
    return NextResponse.json({ error: "Failed to fetch Google Sheets data" }, { status: 500 })
  }
}

function extractSpreadsheetId(url: string): string | null {
  // Extract spreadsheet ID from various Google Sheets URL formats
  const patterns = [
    /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/,
    /\/d\/([a-zA-Z0-9-_]+)/,
    /id=([a-zA-Z0-9-_]+)/
  ]
  
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) {
      return match[1]
    }
  }
  
  return null
}
