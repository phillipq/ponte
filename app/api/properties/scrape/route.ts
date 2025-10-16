import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "lib/auth"

interface ScrapedPropertyData {
  name?: string
  price?: number
  size?: number
  rooms?: number
  bathrooms?: number
  yearBuilt?: number
  description?: string
  images?: string[]
  address?: string
  city?: string
  province?: string
  postalCode?: string
  propertyType?: string
  features?: string[]
  propertyLink?: string
  guidance?: string
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { url } = await request.json() as { url?: string }
    
    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 })
    }

    // Validate URL
    try {
      new URL(url)
    } catch {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 })
    }

    const scrapedData = await scrapePropertyData(url)
    
    return NextResponse.json({ 
      success: true, 
      data: scrapedData,
      message: "Property data scraped successfully"
    })
  } catch (error) {
    console.error("Error scraping property:", error)
    return NextResponse.json({ 
      error: "Failed to scrape property data",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

async function scrapePropertyData(url: string): Promise<ScrapedPropertyData> {
  try {
    // Try content extraction approach first
    const contentData = await extractPropertyContent(url)
    if (contentData.success) {
      return contentData.data
    }
    
    // If content extraction failed, provide a helpful manual entry response
    console.log('Content extraction failed, providing manual entry guidance')
    return {
      name: "Manual Entry Required",
      description: "This property site blocks automated access. Please enter the details manually using the form below.",
      propertyLink: url,
      // Provide some guidance based on the URL
      guidance: getPropertyGuidance(url)
    }
  } catch (error) {
    console.error("Error in property data extraction:", error)
    return {
      name: "Content extraction failed",
      description: "Unable to extract property information. Please enter details manually.",
      propertyLink: url
    }
  }
}

function getPropertyGuidance(url: string): string {
  if (url.includes('idealista.it')) {
    return "For Idealista properties, look for: price (€), size (m²), rooms (locali), bathrooms (bagni), and address information."
  } else if (url.includes('immobiliare.it')) {
    return "For Immobiliare properties, look for: price (€), size (m²), rooms (locali), bathrooms (bagni), and address information."
  } else if (url.includes('casa.it')) {
    return "For Casa.it properties, look for: price (€), size (m²), rooms (locali), bathrooms (bagni), and address information."
  }
  return "Look for price, size, rooms, bathrooms, and address information on the property page."
}

async function extractPropertyContent(url: string): Promise<{success: boolean, data: ScrapedPropertyData}> {
  try {
    // Try multiple approaches to get content
    const approaches = [
      // Approach 1: Standard browser headers
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9,it;q=0.8',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      },
      // Approach 2: Mobile user agent
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9,it;q=0.8',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      },
      // Approach 3: Simple bot-like approach
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; PropertyBot/1.0; +https://example.com/bot)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9,it;q=0.8',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      }
    ]
    
    for (let i = 0; i < approaches.length; i++) {
      try {
        console.log(`Trying approach ${i + 1} for content extraction...`)
        const response = await fetch(url, approaches[i])
        
        if (response.ok) {
          const html = await response.text()
          console.log(`Approach ${i + 1} successful, got ${html.length} characters`)
          
          // Extract text content without parsing HTML structure
          const textContent = extractTextFromHTML(html)
          
          console.log('Extracted text length:', textContent.length)
          console.log('First 500 chars:', textContent.substring(0, 500))
          
          if (textContent.length >= 50) {
            // Use AI to parse the text content
            const aiParsedData = await parseWithAI(textContent, url)
            return { success: true, data: aiParsedData }
          }
        } else {
          console.log(`Approach ${i + 1} failed with status: ${response.status}`)
        }
      } catch (error) {
        console.log(`Approach ${i + 1} failed with error:`, error)
      }
    }
    
    // If all approaches failed, try a different strategy
    console.log('All direct approaches failed, trying alternative strategy...')
    return await tryAlternativeContentExtraction(url)
    
  } catch (error) {
    console.error("Content extraction failed:", error)
    return { success: false, data: {} }
  }
}

async function tryAlternativeContentExtraction(url: string): Promise<{success: boolean, data: ScrapedPropertyData}> {
  try {
    // Try using a proxy or different approach
    // For now, let's try with minimal headers
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'curl/7.68.0',
        'Accept': '*/*'
      }
    })
    
    if (response.ok) {
      const html = await response.text()
      const textContent = extractTextFromHTML(html)
      
      if (textContent.length >= 50) {
        const aiParsedData = await parseWithAI(textContent, url)
        return { success: true, data: aiParsedData }
      }
    }
    
    return { success: false, data: {} }
  } catch (error) {
    console.error("Alternative content extraction failed:", error)
    return { success: false, data: {} }
  }
}

function extractTextFromHTML(html: string): string {
  // Remove script and style elements
  let text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '')
    .replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '')
    .replace(/<object[^>]*>[\s\S]*?<\/object>/gi, '')
    .replace(/<embed[^>]*>/gi, '')
  
  // Remove HTML tags but keep text content
  text = text.replace(/<[^>]*>/g, ' ')
  
  // Clean up whitespace
  text = text
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n/g, '\n')
    .trim()
  
  // Extract key sections that typically contain property info
  const sections = [
    // Look for price patterns
    /€\s*[\d,\.]+/g,
    /EUR\s*[\d,\.]+/g,
    /price[:\s]*€?\s*[\d,\.]+/gi,
    /prezzo[:\s]*€?\s*[\d,\.]+/gi,
    /costo[:\s]*€?\s*[\d,\.]+/gi,
    
    // Look for size patterns
    /\d+(?:,\d+)?\s*m[²2]/gi,
    /\d+(?:,\d+)?\s*sqm/gi,
    /\d+(?:,\d+)?\s*mq/gi,
    /superficie[:\s]*\d+(?:,\d+)?/gi,
    
    // Look for room patterns
    /\d+\s*local[ie]/gi,
    /\d+\s*room/gi,
    /\d+\s*camera/gi,
    /(\d+)\s*(?:locali|camere|stanze)/gi,
    
    // Look for bathroom patterns
    /\d+\s*bagn[oi]/gi,
    /\d+\s*bathroom/gi,
    /(\d+)\s*(?:bagni|toilet)/gi,
    
    // Look for address patterns
    /via[:\s]*[^,\n]+/gi,
    /street[:\s]*[^,\n]+/gi,
    /indirizzo[:\s]*[^,\n]+/gi,
    /address[:\s]*[^,\n]+/gi,
    
    // Look for year patterns
    /anno[:\s]*\d{4}/gi,
    /year[:\s]*\d{4}/gi,
    /built[:\s]*\d{4}/gi,
    /costruito[:\s]*\d{4}/gi,
    
    // Look for property type patterns
    /(casa|house|villa|appartamento|apartment|condominio|condo)/gi,
    /(monolocale|studio|bilocale|trilocale|quadrilocale)/gi
  ]
  
  let extractedText = ''
  sections.forEach(pattern => {
    const matches = text.match(pattern)
    if (matches) {
      extractedText += matches.join(' ') + ' '
    }
  })
  
  // If we didn't find much with patterns, return a larger chunk of text
  if (extractedText.length < 100) {
    // Try to find the main content area
    const contentPatterns = [
      /<main[^>]*>([\s\S]*?)<\/main>/gi,
      /<article[^>]*>([\s\S]*?)<\/article>/gi,
      /<div[^>]*class="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
      /<div[^>]*class="[^"]*property[^"]*"[^>]*>([\s\S]*?)<\/div>/gi
    ]
    
    for (const pattern of contentPatterns) {
      const matches = html.match(pattern)
      if (matches && matches.length > 0) {
        const content = matches[0]
          .replace(/<[^>]*>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
        if (content.length > 100) {
          extractedText = content.substring(0, 3000)
          break
        }
      }
    }
    
    // If still no good content, take the first 3000 characters
    if (extractedText.length < 100) {
      extractedText = text.substring(0, 3000)
    }
  }
  
  return extractedText
}

async function parseWithAI(textContent: string, url: string): Promise<ScrapedPropertyData> {
  try {
    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY) {
      console.error('OpenAI API key not found')
      return {
        name: "OpenAI API key not configured",
        description: "Please add OPENAI_API_KEY to your environment variables to enable AI-powered property extraction.",
        propertyLink: url
      }
    }

    // Prepare the prompt for AI parsing
    const prompt = `Analyze this Italian property listing text and extract the following information in JSON format:

Text: "${textContent.substring(0, 3000)}"

Please extract and return ONLY a JSON object with these fields (use null for missing values):
{
  "name": "Property name or title",
  "price": number (price in euros, no currency symbol),
  "size": number (size in square meters),
  "rooms": number (number of rooms),
  "bathrooms": number (number of bathrooms),
  "yearBuilt": number (year built),
  "propertyType": "house|apartment|condo|villa",
  "address": "street address",
  "city": "city name",
  "postalCode": "postal code",
  "description": "property description",
  "features": ["feature1", "feature2", "feature3"]
}

Focus on Italian property terms:
- "casa" = house
- "appartamento" = apartment  
- "villa" = villa
- "locali" = rooms
- "bagni" = bathrooms
- "superficie" = surface area
- "prezzo" = price
- "€" = euros

Return only valid JSON, no other text.`

    console.log('Calling OpenAI API with text length:', textContent.length)

    // Call OpenAI API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 1000
      })
    })

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text()
      console.error('OpenAI API error:', openaiResponse.status, errorText)
      throw new Error(`OpenAI API error: ${openaiResponse.status}`)
    }

    const aiData = await openaiResponse.json() as { choices?: { message?: { content?: string } }[] }
    const aiContent = aiData.choices?.[0]?.message?.content
    
    console.log('OpenAI response:', aiContent)
    
    if (!aiContent) {
      throw new Error('No content received from OpenAI')
    }
    
    // Parse the AI response
    try {
      const parsedData = JSON.parse(aiContent) as {
        name?: string;
        price?: number;
        size?: number;
        rooms?: number;
        bathrooms?: number;
        yearBuilt?: number;
        propertyType?: string;
        address?: string;
        city?: string;
        postalCode?: string;
        description?: string;
        features?: string[];
      }
      console.log('Parsed AI data:', parsedData)
      return {
        name: parsedData.name,
        price: parsedData.price,
        size: parsedData.size,
        rooms: parsedData.rooms,
        bathrooms: parsedData.bathrooms,
        yearBuilt: parsedData.yearBuilt,
        propertyType: parsedData.propertyType,
        address: parsedData.address,
        city: parsedData.city,
        postalCode: parsedData.postalCode,
        description: parsedData.description,
        features: parsedData.features,
        propertyLink: url
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError)
      console.error('AI response was:', aiContent)
      return {
        name: "AI parsing failed",
        description: "Unable to parse property information with AI. Please enter details manually.",
        propertyLink: url
      }
    }
  } catch (error) {
    console.error('AI parsing error:', error)
    return {
      name: "AI parsing error",
      description: "AI parsing failed. Please enter details manually.",
      propertyLink: url
    }
  }
}


function _parsePropertyHTML(html: string, url: string): ScrapedPropertyData {
  const result: ScrapedPropertyData = {}
  
  // Common patterns for Italian property sites
  const patterns = {
    // Price patterns (various formats)
    price: [
      /€\s*([\d,\.]+)/g,
      /EUR\s*([\d,\.]+)/g,
      /price[:\s]*€?\s*([\d,\.]+)/gi,
      /prezzo[:\s]*€?\s*([\d,\.]+)/gi,
      /costo[:\s]*€?\s*([\d,\.]+)/gi
    ],
    
    // Size patterns
    size: [
      /(\d+(?:,\d+)?)\s*m[²2]/gi,
      /(\d+(?:,\d+)?)\s*sqm/gi,
      /(\d+(?:,\d+)?)\s*mq/gi,
      /superficie[:\s]*(\d+(?:,\d+)?)/gi,
      /surface[:\s]*(\d+(?:,\d+)?)/gi
    ],
    
    // Room patterns
    rooms: [
      /(\d+)\s*local[ie]/gi,
      /(\d+)\s*room/gi,
      /(\d+)\s*camera/gi,
      /(\d+)\s*bedroom/gi
    ],
    
    // Bathroom patterns
    bathrooms: [
      /(\d+)\s*bagn[oi]/gi,
      /(\d+)\s*bathroom/gi,
      /(\d+)\s*toilet/gi
    ],
    
    // Year built patterns
    yearBuilt: [
      /anno[:\s]*(\d{4})/gi,
      /year[:\s]*(\d{4})/gi,
      /built[:\s]*(\d{4})/gi,
      /costruito[:\s]*(\d{4})/gi
    ],
    
    // Property type patterns
    propertyType: [
      /(casa|house|villa|appartamento|apartment|condominio|condo)/gi,
      /(monolocale|studio|bilocale|trilocale|quadrilocale)/gi
    ],
    
    // Address patterns
    address: [
      /via[:\s]*([^,\n]+)/gi,
      /street[:\s]*([^,\n]+)/gi,
      /indirizzo[:\s]*([^,\n]+)/gi
    ],
    
    // City patterns
    city: [
      /(\d{5})\s*([^,\n]+)/g, // Italian postal code + city
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*\([A-Z]{2}\)/g // City (Province)
    ]
  }
  
  // Extract price
  for (const pattern of patterns.price) {
    const matches = html.match(pattern)
    if (matches && matches[0]) {
      const price = matches[0].replace(/[€EUR\s,]/g, '').replace('.', '')
      const numPrice = parseInt(price)
      if (numPrice > 1000) { // Reasonable price threshold
        result.price = numPrice
        break
      }
    }
  }
  
  // Extract size
  for (const pattern of patterns.size) {
    const matches = html.match(pattern)
    if (matches && matches[0]) {
      const size = matches[0].replace(/[^\d,]/g, '').replace(',', '.')
      const numSize = parseFloat(size)
      if (numSize > 10) { // Reasonable size threshold
        result.size = numSize
        break
      }
    }
  }
  
  // Extract rooms
  for (const pattern of patterns.rooms) {
    const matches = html.match(pattern)
    if (matches && matches[0]) {
      const rooms = parseInt(matches[0].replace(/\D/g, ''))
      if (rooms > 0 && rooms < 20) { // Reasonable room count
        result.rooms = rooms
        break
      }
    }
  }
  
  // Extract bathrooms
  for (const pattern of patterns.bathrooms) {
    const matches = html.match(pattern)
    if (matches && matches[0]) {
      const bathrooms = parseInt(matches[0].replace(/\D/g, ''))
      if (bathrooms > 0 && bathrooms < 10) { // Reasonable bathroom count
        result.bathrooms = bathrooms
        break
      }
    }
  }
  
  // Extract year built
  for (const pattern of patterns.yearBuilt) {
    const matches = html.match(pattern)
    if (matches && matches[0]) {
      const year = parseInt(matches[0].replace(/\D/g, ''))
      if (year > 1800 && year <= new Date().getFullYear()) {
        result.yearBuilt = year
        break
      }
    }
  }
  
  // Extract property type
  for (const pattern of patterns.propertyType) {
    const matches = html.match(pattern)
    if (matches && matches[0]) {
      const type = matches[0].toLowerCase()
      if (type.includes('casa') || type.includes('house') || type.includes('villa')) {
        result.propertyType = 'house'
      } else if (type.includes('appartamento') || type.includes('apartment')) {
        result.propertyType = 'apartment'
      } else if (type.includes('condominio') || type.includes('condo')) {
        result.propertyType = 'condo'
      }
      break
    }
  }
  
  // Extract address
  for (const pattern of patterns.address) {
    const matches = html.match(pattern)
    if (matches && matches[0]) {
      result.address = matches[0].replace(/via[:\s]*/gi, '').trim()
      break
    }
  }
  
  // Extract city from postal code pattern
  for (const pattern of patterns.city) {
    const matches = html.match(pattern)
    if (matches && matches[0]) {
      const parts = matches[0].split(' ')
      if (parts.length >= 2) {
        result.postalCode = parts[0]
        result.city = parts.slice(1).join(' ')
      }
      break
    }
  }
  
  // Extract images (look for common image patterns)
  const imagePatterns = [
    /<img[^>]+src="([^"]+\.(?:jpg|jpeg|png|gif|webp))"/gi,
    /background-image:\s*url\(['"]?([^'"]+\.(?:jpg|jpeg|png|gif|webp))['"]?\)/gi
  ]
  
  const images: string[] = []
  for (const pattern of imagePatterns) {
    const matches = html.match(pattern)
    if (matches) {
      matches.forEach(match => {
        const srcMatch = match.match(/src="([^"]+)"/) || match.match(/url\(['"]?([^'"]+)['"]?\)/)
        if (srcMatch && srcMatch[1]) {
          let imageUrl = srcMatch[1]
          // Convert relative URLs to absolute
          if (imageUrl.startsWith('/')) {
            const urlObj = new URL(url)
            imageUrl = `${urlObj.protocol}//${urlObj.host}${imageUrl}`
          } else if (imageUrl.startsWith('./') || !imageUrl.startsWith('http')) {
            const urlObj = new URL(url)
            imageUrl = `${urlObj.protocol}//${urlObj.host}/${imageUrl}`
          }
          images.push(imageUrl)
        }
      })
    }
  }
  
  if (images.length > 0) {
    result.images = Array.from(new Set(images)) // Remove duplicates
  }
  
  // Extract description (look for common description patterns)
  const descriptionPatterns = [
    /<meta[^>]+name="description"[^>]+content="([^"]+)"/gi,
    /<p[^>]*class="[^"]*description[^"]*"[^>]*>([^<]+)</gi,
    /<div[^>]*class="[^"]*description[^"]*"[^>]*>([^<]+)</gi
  ]
  
  for (const pattern of descriptionPatterns) {
    const matches = html.match(pattern)
    if (matches && matches[1]) {
      result.description = matches[1].trim()
      break
    }
  }
  
  return result
}
