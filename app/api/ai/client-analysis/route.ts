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
          name: session.user.name || session.user.email,
          image: session.user.image
        }
      })
    }

    const { clientId, questionnaireResponses, properties, destinations } = await request.json() as { clientId: string; questionnaireResponses: unknown; properties: unknown; destinations: unknown }

    // Verify client belongs to user
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        userId: user.id
      }
    })

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }

    // Get the selected response set or the latest one
    const responses = questionnaireResponses as { responseSets: unknown[]; selectedResponseSet?: string }
    const responseSet = responses.responseSets.find((rs: unknown) => 
      (rs as { id: string }).id === responses.selectedResponseSet
    ) || responses.responseSets[0]

    if (!responseSet) {
      return NextResponse.json({ error: "No questionnaire responses found" }, { status: 400 })
    }

    // Prepare questionnaire data for AI analysis
    const questionnaireResponsesData = questionnaireResponses as { sections: unknown[] }
    const responseSetData = responseSet as { responses: unknown[] }
    const questionnaireData = questionnaireResponsesData.sections.map((section: unknown) => ({
      section: (section as { title: string }).title,
      questions: responseSetData.responses
        .filter((r: unknown) => (r as { sectionTitle: string }).sectionTitle === (section as { title: string }).title)
        .map((r: unknown) => ({
          question: (r as { question: string }).question,
          answer: (r as { answer: string }).answer
        }))
    })).filter((section: unknown) => (section as { questions: unknown[] }).questions.length > 0)

  console.log("Debug - Questionnaire data:", JSON.stringify(questionnaireData, null, 2))
  console.log("Debug - Properties count:", (properties as unknown[]).length)
  console.log("Debug - Destinations count:", (destinations as unknown[]).length)
  console.log("Debug - Properties:", JSON.stringify((properties as unknown[]).slice(0, 2), null, 2))
  console.log("Debug - Destinations:", JSON.stringify((destinations as unknown[]).slice(0, 2), null, 2))

    // Calculate distances between properties and destinations
    const propertyDistances = await calculatePropertyDistances(properties as unknown[], destinations as unknown[])
    console.log("Debug - Property distances:", JSON.stringify((propertyDistances as unknown[]).slice(0, 1), null, 2))

    // Generate AI analysis using OpenAI
    const aiAnalysis = await generateOpenAIAnalysis(client, questionnaireData, properties as unknown[], propertyDistances as unknown[])

    // Store AI analysis in database
    const storedAnalysis = await prisma.clientAiAnalysis.create({
      data: {
        clientId: client.id,
        responseSetId: (responseSet as { id: string }).id || null,
        summary: (aiAnalysis as { summary: string }).summary,
        preferences: (aiAnalysis as { preferences: string[] }).preferences,
        recommendations: (aiAnalysis as { recommendations: string }).recommendations,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        propertyRankings: (aiAnalysis as { propertyRankings?: unknown[] }).propertyRankings || [] as any
      }
    })

    return NextResponse.json({
      success: true,
      analysis: aiAnalysis,
      propertyRankings: (aiAnalysis as { propertyRankings?: unknown[] }).propertyRankings || [],
      analysisId: storedAnalysis.id
    })

  } catch (error) {
    console.error("Error generating AI analysis:", error)
    return NextResponse.json({ error: "Failed to generate AI analysis" }, { status: 500 })
  }
}

async function calculatePropertyDistances(properties: unknown[], destinations: unknown[]) {
  const distances: unknown[] = []

  for (const property of properties) {
    const propertyDistances = []
    
    for (const destination of destinations) {
      try {
        // First, check if distance already exists in database
        const existingDistance = await prisma.propertyDistance.findUnique({
          where: {
            propertyId_destinationId: {
              propertyId: (property as { id: string }).id,
              destinationId: (destination as { id: string }).id
            }
          }
        })

        if (existingDistance) {
          // Use cached distance data
          console.log(`Using cached distance for ${(property as { name: string }).name} to ${(destination as { name: string }).name}`)
          propertyDistances.push({
            destination: (destination as { name: string }).name,
            category: (destination as { category?: string }).category || 'Unknown',
            distance: existingDistance.distanceKm ? `${existingDistance.distanceKm.toFixed(1)} km` : 'Unknown',
            duration: existingDistance.durationMinutes ? `${Math.round(existingDistance.durationMinutes)} mins` : 'Unknown',
            value: existingDistance.drivingDistance || 0
          })
        } else {
          // Calculate new distance using Google Distance Matrix API
          console.log(`Calculating new distance for ${(property as { name: string }).name} to ${(destination as { name: string }).name}`)
          // Build URL with optional toll avoidance (default to false for AI analysis)
          let url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${(property as { latitude: number }).latitude},${(property as { longitude: number }).longitude}&destinations=${(destination as { latitude: number }).latitude},${(destination as { longitude: number }).longitude}&units=metric`
          // Note: AI analysis uses standard routes (not toll-avoiding) for consistency
          url += `&key=${process.env.GOOGLE_MAPS_API_KEY}`
          
          const response = await fetch(url)
          
          const data = await response.json() as { rows?: { elements?: { status?: string; distance?: { value: number; text: string }; duration?: { value: number; text: string } }[] }[] }
          
          if (data.rows?.[0]?.elements?.[0]?.status === 'OK') {
            const element = data.rows[0].elements[0]
            
            // Store the distance in database for future use
            await prisma.propertyDistance.upsert({
              where: {
                propertyId_destinationId: {
              propertyId: (property as { id: string }).id,
              destinationId: (destination as { id: string }).id
                }
              },
              update: {
                drivingDistance: (element as { distance: { value: number } }).distance.value,
                drivingDuration: (element as { duration: { value: number } }).duration.value,
                distanceKm: (element as { distance: { value: number } }).distance.value / 1000,
                durationMinutes: (element as { duration: { value: number } }).duration.value / 60,
                calculatedAt: new Date()
              },
              create: {
                propertyId: (property as { id: string }).id,
                destinationId: (destination as { id: string }).id,
                drivingDistance: (element as { distance: { value: number } }).distance.value,
                drivingDuration: (element as { duration: { value: number } }).duration.value,
                distanceKm: (element as { distance: { value: number } }).distance.value / 1000,
                durationMinutes: (element as { duration: { value: number } }).duration.value / 60,
                calculatedAt: new Date()
              }
            })

            propertyDistances.push({
              destination: (destination as { name: string }).name,
              category: (destination as { category?: string }).category || 'Unknown',
              distance: (element as { distance: { text: string } }).distance.text,
              duration: (element as { duration: { text: string } }).duration.text,
              value: (element as { distance: { value: number } }).distance.value
            })
          }
        }
      } catch (error) {
        console.error(`Error calculating distance for ${(property as { name: string }).name} to ${(destination as { name: string }).name}:`, error)
      }
    }

    distances.push({
      propertyId: (property as { id: string }).id,
      propertyName: (property as { name: string }).name,
      distances: propertyDistances
    })
  }

  return distances
}

async function generateOpenAIAnalysis(client: unknown, questionnaireData: unknown[], properties: unknown[], propertyDistances: unknown[]) {
  const { OpenAI } = await import('openai')
  const client_openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  })

  // Comprehensive prompt for gpt-4o-mini
  const prompt = `Analyze this client and provide property recommendations.

CLIENT INFORMATION:
- Name: ${(client as { name: string }).name}
- Email: ${(client as { email: string }).email}
- Company: ${(client as { company?: string }).company || 'Not specified'}

QUESTIONNAIRE RESPONSES:
${questionnaireData.length > 0 ? questionnaireData.map((section: unknown) => `
${(section as { section: string }).section}:
${(section as { questions: unknown[] }).questions.map((q: unknown) => `- ${(q as { question: string }).question}: ${(q as { answer: string }).answer}`).join('\n')}
`).join('\n') : 'No questionnaire responses available'}

AVAILABLE PROPERTIES:
${(properties as unknown[]).length > 0 ? (properties as unknown[]).map((p: unknown, index: number) => `
${index + 1}. ${(p as { name: string }).name}
   - Type: ${(p as { propertyType?: string }).propertyType || 'Not specified'}
   - Location: ${(p as { city?: string }).city || 'Not specified'}, ${(p as { country?: string }).country || 'Not specified'}
   - Size: ${(p as { size?: string }).size || 'Not specified'}
   - Features: ${(p as { features?: string }).features || 'Not specified'}
   - Description: ${(p as { description?: string }).description || 'Not specified'}
`).join('\n') : 'No properties available'}

PROPERTY DISTANCES TO DESTINATIONS:
${(propertyDistances as unknown[]).length > 0 ? (propertyDistances as unknown[]).map((pd: unknown) => `
${(pd as { propertyName: string }).propertyName}:
${(pd as { distances: unknown[] }).distances.map((d: unknown) => `  - ${(d as { destination: string }).destination} (${(d as { category: string }).category}): ${(d as { distance: string }).distance} (${(d as { duration: string }).duration})`).join('\n')}
`).join('\n') : 'No distance data available'}

Please provide:
1. A comprehensive client profile summary
2. Key preferences extracted from their responses
3. Specific recommendations for this client
4. Property rankings with detailed match scores and reasoning based on:
   - Property features and type
   - Location advantages
   - Proximity to key destinations (use the distance data provided, considering destination categories like restaurants, hotels, beaches, etc.)
   - General Italian property market insights
5. Distance analysis for each property using the provided distance data

Format the response as JSON with this structure:
{
  "summary": "Comprehensive client profile summary...",
  "preferences": ["Preference 1", "Preference 2", "Preference 3"],
  "recommendations": "Specific recommendations for this client...",
  "propertyRankings": [
    {
      "id": "property_id",
      "name": "Property Name",
      "score": 0.95,
      "matchReasons": ["Close to international airport (15 mins)", "Modern villa with pool", "Excellent location in Tuscany"],
      "distances": [
        {
          "destination": "Leonardo da Vinci Fiumicino (Rome)",
          "distance": "25.3 km",
          "duration": "15 mins"
        }
      ]
    }
  ]
}

CRITICAL: You MUST return ONLY valid JSON. Do not include any explanatory text, apologies, or questions. The response must be a complete JSON object that can be parsed directly.`

  try {
    console.log("Debug - Sending prompt to gpt-4o-mini:", prompt.substring(0, 200) + "...")
    
    // Validate prompt is not empty
    if (!prompt || prompt.trim() === '') {
      throw new Error("Prompt is empty or invalid")
    }
    
    const completion = await client_openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a real estate expert AI assistant specializing in Italian properties. Analyze client preferences and provide detailed property recommendations with rankings."
        },
        {
          role: "user", 
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    })
    
    console.log("Debug - API call completed, checking response...")

    const message = completion.choices[0]?.message
    console.log("Debug - Full message object:", JSON.stringify(message, null, 2))
    
    if (!message) {
      throw new Error("No message received from OpenAI")
    }
    
    // Check for tool calls first
    if (message.tool_calls && message.tool_calls.length > 0) {
      console.log("Debug - Model used tool calls instead of content")
      console.log("Debug - Tool calls:", message.tool_calls)
      throw new Error("Model used tool calls - not supported for this use case")
    }
    
    const response = message.content
    console.log("Debug - OpenAI response content:", response)
    
    // Check if response is empty or null
    if (!response || response.trim() === '') {
      console.error("OpenAI returned empty response")
      console.log("Debug - Message object:", message)
      
      // Try a fallback approach with an even simpler prompt
      console.log("Debug - Trying fallback approach...")
      const fallbackPrompt = `Return this JSON: {"summary": "Basic analysis", "preferences": ["General preferences"], "recommendations": "Standard recommendations", "propertyRankings": [{"id": "1", "name": "Property 1", "score": 0.5, "matchReasons": ["Good location"], "distances": []}]}`
      
      try {
        const fallbackCompletion = await client_openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: fallbackPrompt }],
          max_tokens: 500
        })
        
        const fallbackResponse = fallbackCompletion.choices[0]?.message?.content
        console.log("Debug - Fallback response:", fallbackResponse)
        
        if (fallbackResponse && fallbackResponse.trim() !== '') {
          return JSON.parse(fallbackResponse)
        }
      } catch (fallbackError) {
        console.error("Fallback also failed:", fallbackError)
      }
      
      throw new Error("OpenAI returned empty response")
    }
    
    try {
      // Try to extract JSON from the response if it's wrapped in text
      let jsonResponse = response.trim()
      
      // Look for JSON object in the response
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        jsonResponse = jsonMatch[0]
        console.log("Debug - Extracted JSON:", jsonResponse)
      }
      
      // Ensure the response starts and ends with braces
      if (!jsonResponse.startsWith('{')) {
        jsonResponse = '{' + jsonResponse
      }
      if (!jsonResponse.endsWith('}')) {
        jsonResponse = jsonResponse + '}'
      }
      
      const parsed = JSON.parse(jsonResponse)
      console.log("Debug - Parsed successfully:", parsed)
      return parsed
      
    } catch (parseError) {
      console.error("Error parsing OpenAI response:", parseError)
      console.log("Raw response:", response)
      
      // If the AI returned a text response instead of JSON, provide a basic analysis
      if (response.includes("Apologies") || response.includes("confusion") || response.includes("additional information")) {
        console.log("AI returned text response instead of JSON, providing fallback analysis")
        
        return {
          summary: "AI analysis was requested but the response format was invalid. Please try generating the analysis again.",
          preferences: ["Analysis incomplete - please try again"],
          recommendations: "Unable to generate recommendations due to response format error. Please try again.",
          propertyRankings: (properties as unknown[]).map((property: unknown, _index: number) => ({
            id: (property as { id: string }).id,
            name: (property as { name: string }).name,
            score: 0.5,
            matchReasons: ["Analysis incomplete - please try again"],
            distances: (propertyDistances as unknown[]).find((pd: unknown) => (pd as { propertyId: string }).propertyId === (property as { id: string }).id) ? ((propertyDistances as unknown[]).find((pd: unknown) => (pd as { propertyId: string }).propertyId === (property as { id: string }).id) as { distances: unknown[] }).distances : []
          }))
        }
      }
      
      // Try to extract any useful information from the response
      let summary = "AI analysis generated but response format was invalid."
      const preferences = ["Analysis incomplete"]
      const recommendations = "Unable to generate recommendations due to response format error."
      
      // Try to extract some information from the raw response
      if (response.includes("summary") || response.includes("Summary")) {
        const summaryMatch = response.match(/summary["\s]*:["\s]*([^"]+)/i)
        if (summaryMatch && summaryMatch[1]) {
          summary = summaryMatch[1]
        }
      }
      
      return {
        summary: summary,
        preferences: preferences,
        recommendations: recommendations,
        propertyRankings: (properties as unknown[]).map((property: unknown, _index: number) => ({
          id: (property as { id: string }).id,
          name: (property as { name: string }).name,
          score: 0.5,
          matchReasons: ["Analysis incomplete - please try again"],
          distances: (propertyDistances as unknown[]).find((pd: unknown) => (pd as { propertyId: string }).propertyId === (property as { id: string }).id) ? ((propertyDistances as unknown[]).find((pd: unknown) => (pd as { propertyId: string }).propertyId === (property as { id: string }).id) as { distances: unknown[] }).distances : []
        }))
      }
    }

  } catch (error) {
    console.error("OpenAI API error:", error)
    throw new Error("Failed to generate AI analysis")
  }
}
