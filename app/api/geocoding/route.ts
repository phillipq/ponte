import { NextRequest, NextResponse } from "next/server"

interface GeocodingResult {
  address: string
  latitude: number
  longitude: number
  formatted_address: string
  place_id?: string
}

// POST /api/geocoding - Geocode an address to lat/lng or reverse geocode lat/lng to address
export async function POST(request: NextRequest) {
  try {
    const { address, latlng } = await request.json()

    if (!address && !latlng) {
      return NextResponse.json({ error: "Address or latlng is required" }, { status: 400 })
    }

    const apiKey = process.env.GOOGLE_MAPS_GEOCODING_API_KEY || process.env.GOOGLE_MAPS_API_KEY
    console.log("Google Maps API Key present:", !!apiKey)
    console.log("API Key length:", apiKey?.length || 0)
    console.log("Using geocoding-specific key:", !!process.env.GOOGLE_MAPS_GEOCODING_API_KEY)
    
    if (!apiKey) {
      return NextResponse.json(
        { error: "Google Maps API key not configured" },
        { status: 500 }
      )
    }

    let url = ""
    if (address) {
      // Forward geocoding: address to coordinates
      url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`
    } else if (latlng) {
      // Reverse geocoding: coordinates to address
      url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${encodeURIComponent(latlng)}&key=${apiKey}`
    }

    console.log("Geocoding URL:", url.replace(apiKey, "API_KEY_HIDDEN"))
    const response = await fetch(url)
    const data = await response.json()

    console.log("Google Geocoding API response:", {
      status: data.status,
      results: data.results?.length || 0,
      error_message: data.error_message
    })

    if (data.status !== 'OK') {
      console.error("Google Geocoding API Error Details:", {
        status: data.status,
        error_message: data.error_message,
        results: data.results
      })
      
      return NextResponse.json(
        { error: `Geocoding failed: ${data.status} - ${data.error_message || 'No additional details'}` },
        { status: 400 }
      )
    }

    const result = data.results[0]
    const geocodingResult: GeocodingResult = {
      address: result.formatted_address,
      latitude: result.geometry.location.lat,
      longitude: result.geometry.location.lng,
      formatted_address: result.formatted_address,
      place_id: result.place_id,
    }

    return NextResponse.json({ result: geocodingResult })
  } catch (error) {
    console.error("Geocoding error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
