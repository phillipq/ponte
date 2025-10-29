import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from 'lib/auth'
import { prisma } from 'lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get request body for toll avoidance option
    let avoidTolls = false
    try {
      const body = await request.json() as { avoidTolls?: boolean }
      avoidTolls = body?.avoidTolls || false
    } catch (error) {
      // If no JSON body or invalid JSON, use default value
      avoidTolls = false
    }

    // Get all properties and destinations
    const [properties, destinations] = await Promise.all([
      prisma.property.findMany(),
      prisma.destination.findMany()
    ])

    if (properties.length === 0 || destinations.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: "No properties or destinations found" 
      }, { status: 400 })
    }

    let calculated = 0
    let errors = 0

    // Calculate distances for each property-destination pair
    for (const property of properties) {
      for (const destination of destinations) {
        try {
          // Check if distance already exists
          const existingDistance = await prisma.propertyDistance.findFirst({
            where: {
              propertyId: property.id,
              destinationId: destination.id
            }
          })

          // Always recalculate if toll avoidance is enabled, or if no existing distance
          if (existingDistance && !avoidTolls) {
            continue // Skip if already calculated and not using toll avoidance
          }

          // Calculate distance using Google Maps Distance Matrix API
          console.log(`Calculating distance from ${property.name} to ${destination.name}`)
          const distance = await calculateDistance(
            property.latitude,
            property.longitude,
            destination.latitude,
            destination.longitude,
            avoidTolls
          )
          console.log(`Distance result:`, distance)

          if (distance) {
            // Delete existing distance if it exists
            if (existingDistance) {
              await prisma.propertyDistance.delete({
                where: { id: existingDistance.id }
              })
            }
            
            // Create new distance
            await prisma.propertyDistance.create({
              data: {
                propertyId: property.id,
                destinationId: destination.id,
                drivingDistance: distance.drivingDistance,
                drivingDuration: distance.drivingDuration,
                transitDistance: distance.transitDistance,
                transitDuration: distance.transitDuration,
                walkingDistance: distance.walkingDistance,
                walkingDuration: distance.walkingDuration
              }
            })
            calculated++
          }
        } catch (error) {
          console.error(`Error calculating distance for property ${property.id} to destination ${destination.id}:`, error)
          errors++
        }
      }
    }

    return NextResponse.json({
      success: true,
      calculated,
      errors,
      message: `Calculated ${calculated} distances${errors > 0 ? ` with ${errors} errors` : ''}`
    })

  } catch (error) {
    console.error('Error in calculate-distances API:', error)
    return NextResponse.json({ 
      success: false, 
      error: "Internal server error" 
    }, { status: 500 })
  }
}

async function calculateDistance(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number,
  avoidTolls: boolean = false
) {
  const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY
  if (!googleMapsApiKey) {
    throw new Error('Google Maps API key not configured')
  }

  const origin = `${originLat},${originLng}`
  const destination = `${destLat},${destLng}`

  try {
    // Calculate driving distance (with optional toll avoidance)
    let drivingUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin}&destinations=${destination}&mode=driving`
    if (avoidTolls) {
      drivingUrl += '&avoid=tolls'
    }
    drivingUrl += `&key=${googleMapsApiKey}`
    
    const drivingResponse = await fetch(drivingUrl)
    const drivingData = await drivingResponse.json() as { rows?: { elements?: { distance?: { value: number; text: string }; duration?: { value: number; text: string } }[] }[] }
    console.log('Driving API response:', JSON.stringify(drivingData, null, 2))

    // Calculate transit distance
    const transitResponse = await fetch(
      `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin}&destinations=${destination}&mode=transit&key=${googleMapsApiKey}`
    )
    const transitData = await transitResponse.json() as { rows?: { elements?: { distance?: { value: number; text: string }; duration?: { value: number; text: string } }[] }[] }
    console.log('Transit API response:', JSON.stringify(transitData, null, 2))

    // Calculate walking distance
    const walkingResponse = await fetch(
      `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin}&destinations=${destination}&mode=walking&key=${googleMapsApiKey}`
    )
    const walkingData = await walkingResponse.json() as { rows?: { elements?: { distance?: { value: number; text: string }; duration?: { value: number; text: string } }[] }[] }
    console.log('Walking API response:', JSON.stringify(walkingData, null, 2))

    const drivingElement = drivingData.rows?.[0]?.elements?.[0]
    const transitElement = transitData.rows?.[0]?.elements?.[0]
    const walkingElement = walkingData.rows?.[0]?.elements?.[0]

    console.log('Driving element:', drivingElement)
    console.log('Transit element:', transitElement)
    console.log('Walking element:', walkingElement)

    const result = {
      drivingDistance: drivingElement?.distance?.value || 0,
      drivingDuration: drivingElement?.duration?.value || 0,
      transitDistance: transitElement?.distance?.value || 0,
      transitDuration: transitElement?.duration?.value || 0,
      walkingDistance: walkingElement?.distance?.value || 0,
      walkingDuration: walkingElement?.duration?.value || 0
    }
    
    console.log('Final result:', result)
    return result
  } catch (error) {
    console.error('Error calling Google Maps API:', error)
    throw error
  }
}
