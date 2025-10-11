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

    const { clientId, questionnaireResponses, properties, destinations } = await request.json()

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
    const responseSet = questionnaireResponses.responseSets.find((rs: any) => 
      rs.id === questionnaireResponses.selectedResponseSet
    ) || questionnaireResponses.responseSets[0]

    if (!responseSet) {
      return NextResponse.json({ error: "No questionnaire responses found" }, { status: 400 })
    }

    // Prepare questionnaire data for AI analysis
    const questionnaireData = questionnaireResponses.sections.map((section: any) => ({
      section: section.title,
      questions: responseSet.responses
        .filter((r: any) => r.sectionTitle === section.title)
        .map((r: any) => ({
          question: r.question,
          answer: r.answer
        }))
    })).filter((section: any) => section.questions.length > 0)

  console.log("Debug - Questionnaire data:", JSON.stringify(questionnaireData, null, 2))
  console.log("Debug - Properties count:", properties.length)
  console.log("Debug - Destinations count:", destinations.length)
  console.log("Debug - Properties:", JSON.stringify(properties.slice(0, 2), null, 2))
  console.log("Debug - Destinations:", JSON.stringify(destinations.slice(0, 2), null, 2))

    // Calculate distances between properties and destinations
    const propertyDistances = await calculatePropertyDistances(properties, destinations)
    console.log("Debug - Property distances:", JSON.stringify(propertyDistances.slice(0, 1), null, 2))

    // Generate AI analysis using OpenAI
    const aiAnalysis = await generateOpenAIAnalysis(client, questionnaireData, properties, propertyDistances)

    // Store AI analysis in database
    const storedAnalysis = await prisma.clientAiAnalysis.create({
      data: {
        clientId: client.id,
        responseSetId: questionnaireData?.responseSetId || null,
        summary: aiAnalysis.summary,
        preferences: aiAnalysis.preferences,
        recommendations: aiAnalysis.recommendations,
        propertyRankings: aiAnalysis.propertyRankings || []
      }
    })

    return NextResponse.json({
      success: true,
      analysis: aiAnalysis,
      propertyRankings: aiAnalysis.propertyRankings || [],
      analysisId: storedAnalysis.id
    })

  } catch (error) {
    console.error("Error generating AI analysis:", error)
    return NextResponse.json({ error: "Failed to generate AI analysis" }, { status: 500 })
  }
}

async function calculatePropertyDistances(properties: any[], destinations: any[]) {
  const distances: any[] = []

  for (const property of properties) {
    const propertyDistances = []
    
    for (const destination of destinations) {
      try {
        // First, check if distance already exists in database
        const existingDistance = await prisma.propertyDistance.findUnique({
          where: {
            propertyId_destinationId: {
              propertyId: property.id,
              destinationId: destination.id
            }
          }
        })

        if (existingDistance) {
          // Use cached distance data
          console.log(`Using cached distance for ${property.name} to ${destination.name}`)
          propertyDistances.push({
            destination: destination.name,
            category: destination.category || 'Unknown',
            distance: existingDistance.distanceKm ? `${existingDistance.distanceKm.toFixed(1)} km` : 'Unknown',
            duration: existingDistance.durationMinutes ? `${Math.round(existingDistance.durationMinutes)} mins` : 'Unknown',
            value: existingDistance.drivingDistance || 0
          })
        } else {
          // Calculate new distance using Google Distance Matrix API
          console.log(`Calculating new distance for ${property.name} to ${destination.name}`)
          const response = await fetch(
            `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${property.latitude},${property.longitude}&destinations=${destination.latitude},${destination.longitude}&units=metric&key=${process.env.GOOGLE_MAPS_API_KEY}`
          )
          
          const data = await response.json()
          
          if (data.rows?.[0]?.elements?.[0]?.status === 'OK') {
            const element = data.rows[0].elements[0]
            
            // Store the distance in database for future use
            await prisma.propertyDistance.upsert({
              where: {
                propertyId_destinationId: {
                  propertyId: property.id,
                  destinationId: destination.id
                }
              },
              update: {
                drivingDistance: element.distance.value,
                drivingDuration: element.duration.value,
                distanceKm: element.distance.value / 1000,
                durationMinutes: element.duration.value / 60,
                calculatedAt: new Date()
              },
              create: {
                propertyId: property.id,
                destinationId: destination.id,
                drivingDistance: element.distance.value,
                drivingDuration: element.duration.value,
                distanceKm: element.distance.value / 1000,
                durationMinutes: element.duration.value / 60,
                calculatedAt: new Date()
              }
            })

            propertyDistances.push({
              destination: destination.name,
              category: destination.category || 'Unknown',
              distance: element.distance.text,
              duration: element.duration.text,
              value: element.distance.value
            })
          }
        }
      } catch (error) {
        console.error(`Error calculating distance for ${property.name} to ${destination.name}:`, error)
      }
    }

    distances.push({
      propertyId: property.id,
      propertyName: property.name,
      distances: propertyDistances
    })
  }

  return distances
}

async function generateOpenAIAnalysis(client: any, questionnaireData: any[], properties: any[], propertyDistances: any[]) {
  const { OpenAI } = await import('openai')
  const client_openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  })

  // Comprehensive prompt for gpt-4o-mini
  const prompt = `Analyze this client and provide property recommendations.

CLIENT INFORMATION:
- Name: ${client.name}
- Email: ${client.email}
- Company: ${client.company || 'Not specified'}

QUESTIONNAIRE RESPONSES:
${questionnaireData.length > 0 ? questionnaireData.map(section => `
${section.section}:
${section.questions.map((q: any) => `- ${q.question}: ${q.answer}`).join('\n')}
`).join('\n') : 'No questionnaire responses available'}

AVAILABLE PROPERTIES:
${properties.length > 0 ? properties.map((p, index) => `
${index + 1}. ${p.name}
   - Type: ${p.propertyType || 'Not specified'}
   - Location: ${p.city || 'Not specified'}, ${p.country || 'Not specified'}
   - Size: ${p.size || 'Not specified'}
   - Features: ${p.features || 'Not specified'}
   - Description: ${p.description || 'Not specified'}
`).join('\n') : 'No properties available'}

PROPERTY DISTANCES TO DESTINATIONS:
${propertyDistances.length > 0 ? propertyDistances.map(pd => `
${pd.propertyName}:
${pd.distances.map((d: any) => `  - ${d.destination} (${d.category}): ${d.distance} (${d.duration})`).join('\n')}
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

    const message = completion.choices[0].message
    console.log("Debug - Full message object:", JSON.stringify(message, null, 2))
    
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
        
        const fallbackResponse = fallbackCompletion.choices[0].message.content
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
          propertyRankings: properties.map((property, index) => ({
            id: property.id,
            name: property.name,
            score: 0.5,
            matchReasons: ["Analysis incomplete - please try again"],
            distances: propertyDistances.find(pd => pd.propertyId === property.id)?.distances || []
          }))
        }
      }
      
      // Try to extract any useful information from the response
      let summary = "AI analysis generated but response format was invalid."
      let preferences = ["Analysis incomplete"]
      let recommendations = "Unable to generate recommendations due to response format error."
      
      // Try to extract some information from the raw response
      if (response.includes("summary") || response.includes("Summary")) {
        const summaryMatch = response.match(/summary["\s]*:["\s]*([^"]+)/i)
        if (summaryMatch) {
          summary = summaryMatch[1]
        }
      }
      
      return {
        summary: summary,
        preferences: preferences,
        recommendations: recommendations,
        propertyRankings: properties.map((property, index) => ({
          id: property.id,
          name: property.name,
          score: 0.5,
          matchReasons: ["Analysis incomplete - please try again"],
          distances: propertyDistances.find(pd => pd.propertyId === property.id)?.distances || []
        }))
      }
    }

  } catch (error) {
    console.error("OpenAI API error:", error)
    throw new Error("Failed to generate AI analysis")
  }
}
