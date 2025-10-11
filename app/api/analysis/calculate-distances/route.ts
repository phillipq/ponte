import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "lib/auth"
import { prisma } from "lib/prisma"

// POST /api/analysis/calculate-distances - Calculate distances between all properties and destinations
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = (session.user as any).id

    // Get all properties and destinations for the user
    const properties = await prisma.property.findMany({
      where: { userId }
    })
    
    const destinations = await prisma.destination.findMany({
      where: { userId }
    })

    if (properties.length === 0 || destinations.length === 0) {
      return NextResponse.json({ error: "No properties or destinations found" }, { status: 400 })
    }

    // Get all existing distances to identify missing pairs
    const existingDistances = await prisma.propertyDistance.findMany({
      where: {
        property: { userId },
        destination: { userId }
      }
    })

    // Create a set of existing property-destination pairs
    const existingPairs = new Set(
      existingDistances.map(d => `${d.propertyId}-${d.destinationId}`)
    )

    // Find missing pairs that need calculation
    const missingPairs = []
    for (const property of properties) {
      for (const destination of destinations) {
        const pairKey = `${property.id}-${destination.id}`
        if (!existingPairs.has(pairKey)) {
          missingPairs.push({ property, destination })
        }
      }
    }

    console.log(`Found ${missingPairs.length} missing pairs to calculate`)

    if (missingPairs.length === 0) {
      return NextResponse.json({
        success: true,
        calculated: 0,
        errors: 0,
        message: "All distances already calculated",
        results: [],
        errors: []
      })
    }

    const results = []
    const errors = []
    const batchSize = 10

    // Process in batches
    for (let i = 0; i < missingPairs.length; i += batchSize) {
      const batch = missingPairs.slice(i, i + batchSize)
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(missingPairs.length / batchSize)} (${batch.length} pairs)`)

      // Process batch concurrently
      const batchPromises = batch.map(async ({ property, destination }) => {
        try {
          // Calculate all three distance types
          const [drivingData, walkingData, transitData] = await Promise.all([
            calculateDistance(property.latitude, property.longitude, destination.latitude, destination.longitude),
            calculateWalkingDistance(property.latitude, property.longitude, destination.latitude, destination.longitude),
            calculateTransitDistance(property.latitude, property.longitude, destination.latitude, destination.longitude)
          ])

          if (drivingData) {
            // Convert meters to miles and kilometers, rounded to whole numbers
            const distanceMiles = drivingData.distance ? Math.round(drivingData.distance / 1609.34) : null
            const distanceKm = drivingData.distance ? Math.round(drivingData.distance / 1000) : null
            const durationMinutes = drivingData.duration ? Math.round(drivingData.duration / 60) : null
            
            // Convert walking data
            const walkingDurationMinutes = walkingData?.duration ? Math.round(walkingData.duration / 60) : null
            
            // Convert transit data
            const transitDurationMinutes = transitData?.duration ? Math.round(transitData.duration / 60) : null

            // Create new record
            const savedDistance = await prisma.propertyDistance.create({
              data: {
                propertyId: property.id,
                destinationId: destination.id,
                drivingDistance: drivingData.distance,
                drivingDuration: drivingData.duration,
                distanceMiles: distanceMiles,
                distanceKm: distanceKm,
                durationMinutes: durationMinutes,
                walkingDistance: walkingData?.distance || null,
                walkingDuration: walkingData?.duration || null,
                walkingDurationMinutes: walkingDurationMinutes,
                transitDistance: transitData?.distance || null,
                transitDuration: transitData?.duration || null,
                transitDurationMinutes: transitDurationMinutes
              }
            })

            console.log(`Calculated distance: ${property.id} -> ${destination.id}`)
            return { success: true, data: savedDistance }
          } else {
            throw new Error("Failed to get driving data from Google Maps API")
          }
        } catch (error) {
          console.error(`Error calculating distance for ${property.id} -> ${destination.id}:`, error)
          return { 
            success: false, 
            error: {
              propertyId: property.id,
              destinationId: destination.id,
              error: error instanceof Error ? error.message : "Unknown error"
            }
          }
        }
      })

      // Wait for batch to complete
      const batchResults = await Promise.all(batchPromises)
      
      // Process results
      batchResults.forEach(result => {
        if (result.success) {
          results.push(result.data)
        } else {
          errors.push(result.error)
        }
      })

      // Add pause between batches (except for the last batch)
      if (i + batchSize < missingPairs.length) {
        console.log("Pausing between batches...")
        await new Promise(resolve => setTimeout(resolve, 2000)) // 2 second pause
      }
    }

    return NextResponse.json({
      success: true,
      calculated: results.length,
      errors: errors.length,
      results,
      errors
    })
  } catch (error) {
    console.error("Error calculating distances:", error)
    return NextResponse.json({ error: "Failed to calculate distances" }, { status: 500 })
  }
}

async function calculateDistance(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number
): Promise<{ distance: number; duration: number } | null> {
  try {
    // Call Google Distance Matrix API directly
    const apiKey = process.env.GOOGLE_MAPS_GEOCODING_API_KEY || process.env.GOOGLE_MAPS_API_KEY
    if (!apiKey) {
      throw new Error("Google Maps API key not found")
    }

    const origins = `${originLat},${originLng}`
    const destinations = `${destLat},${destLng}`
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origins}&destinations=${destinations}&units=metric&mode=driving&key=${apiKey}`

    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`Distance Matrix API error: ${response.status}`)
    }

    const data = await response.json() as any
    
    if (data.rows && data.rows[0] && data.rows[0].elements && data.rows[0].elements[0]) {
      const element = data.rows[0].elements[0]
      
      if (element.status === "OK") {
        return {
          distance: element.distance.value, // in meters
          duration: element.duration.value  // in seconds
        }
      } else {
        console.error("Distance Matrix API returned error:", element.status)
        return null
      }
    }

    console.error("Invalid response from Distance Matrix API:", data)
    return null
  } catch (error) {
    console.error("Error calling Distance Matrix API:", error)
    return null
  }
}

async function calculateWalkingDistance(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number
): Promise<{ distance: number; duration: number } | null> {
  try {
    // Call Google Distance Matrix API for walking
    const apiKey = process.env.GOOGLE_MAPS_GEOCODING_API_KEY || process.env.GOOGLE_MAPS_API_KEY
    if (!apiKey) {
      throw new Error("Google Maps API key not found")
    }

    const origins = `${originLat},${originLng}`
    const destinations = `${destLat},${destLng}`
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origins}&destinations=${destinations}&units=metric&mode=walking&key=${apiKey}`

    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`Distance Matrix API error: ${response.status}`)
    }

    const data = await response.json() as any
    
    if (data.rows && data.rows[0] && data.rows[0].elements && data.rows[0].elements[0]) {
      const element = data.rows[0].elements[0]
      
      if (element.status === "OK") {
        return {
          distance: element.distance.value, // in meters
          duration: element.duration.value  // in seconds
        }
      } else {
        console.error("Distance Matrix API returned error for walking:", element.status)
        return null
      }
    }

    console.error("Invalid response from Distance Matrix API for walking:", data)
    return null
  } catch (error) {
    console.error("Error calling Distance Matrix API for walking:", error)
    return null
  }
}

async function calculateTransitDistance(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number
): Promise<{ distance: number; duration: number } | null> {
  try {
    // Call Google Distance Matrix API for transit
    const apiKey = process.env.GOOGLE_MAPS_GEOCODING_API_KEY || process.env.GOOGLE_MAPS_API_KEY
    if (!apiKey) {
      throw new Error("Google Maps API key not found")
    }

    const origins = `${originLat},${originLng}`
    const destinations = `${destLat},${destLng}`
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origins}&destinations=${destinations}&units=metric&mode=transit&key=${apiKey}`

    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`Distance Matrix API error: ${response.status}`)
    }

    const data = await response.json() as any
    
    if (data.rows && data.rows[0] && data.rows[0].elements && data.rows[0].elements[0]) {
      const element = data.rows[0].elements[0]
      
      if (element.status === "OK") {
        return {
          distance: element.distance.value, // in meters
          duration: element.duration.value  // in seconds
        }
      } else {
        console.error("Distance Matrix API returned error for transit:", element.status)
        return null
      }
    }

    console.error("Invalid response from Distance Matrix API for transit:", data)
    return null
  } catch (error) {
    console.error("Error calling Distance Matrix API for transit:", error)
    return null
  }
}
