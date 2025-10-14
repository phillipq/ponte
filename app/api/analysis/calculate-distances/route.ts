import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from 'lib/auth'
import { prisma } from 'lib/prisma'

export async function POST(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get all properties and destinations
    const [properties, destinations] = await Promise.all([
      prisma.property.findMany({
        where: { userId: (session.user as { id: string }).id }
      }),
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

          if (existingDistance) {
            continue // Skip if already calculated
          }

          // Calculate distance using Google Maps Distance Matrix API
          const distance = await calculateDistance(
            property.latitude,
            property.longitude,
            destination.latitude,
            destination.longitude
          )

          if (distance) {
            // Save to database
            await prisma.propertyDistance.create({
              data: {
                propertyId: property.id,
                destinationId: destination.id,
                drivingDistance: distance.drivingDistance,
                drivingDuration: distance.drivingDuration,
                drivingDistanceText: distance.drivingDistanceText,
                drivingDurationText: distance.drivingDurationText,
                transitDistance: distance.transitDistance,
                transitDuration: distance.transitDuration,
                transitDistanceText: distance.transitDistanceText,
                transitDurationText: distance.transitDurationText,
                walkingDistance: distance.walkingDistance,
                walkingDuration: distance.walkingDuration,
                walkingDistanceText: distance.walkingDistanceText,
                walkingDurationText: distance.walkingDurationText
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
  destLng: number
) {
  const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY
  if (!googleMapsApiKey) {
    throw new Error('Google Maps API key not configured')
  }

  const origin = `${originLat},${originLng}`
  const destination = `${destLat},${destLng}`

  try {
    // Calculate driving distance
    const drivingResponse = await fetch(
      `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin}&destinations=${destination}&mode=driving&key=${googleMapsApiKey}`
    )
    const drivingData = await drivingResponse.json()

    // Calculate transit distance
    const transitResponse = await fetch(
      `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin}&destinations=${destination}&mode=transit&key=${googleMapsApiKey}`
    )
    const transitData = await transitResponse.json()

    // Calculate walking distance
    const walkingResponse = await fetch(
      `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin}&destinations=${destination}&mode=walking&key=${googleMapsApiKey}`
    )
    const walkingData = await walkingResponse.json()

    const drivingElement = drivingData.rows[0]?.elements[0]
    const transitElement = transitData.rows[0]?.elements[0]
    const walkingElement = walkingData.rows[0]?.elements[0]

    return {
      drivingDistance: drivingElement?.distance?.value || 0,
      drivingDuration: drivingElement?.duration?.value || 0,
      drivingDistanceText: drivingElement?.distance?.text || '',
      drivingDurationText: drivingElement?.duration?.text || '',
      transitDistance: transitElement?.distance?.value || 0,
      transitDuration: transitElement?.duration?.value || 0,
      transitDistanceText: transitElement?.distance?.text || '',
      transitDurationText: transitElement?.duration?.text || '',
      walkingDistance: walkingElement?.distance?.value || 0,
      walkingDuration: walkingElement?.duration?.value || 0,
      walkingDistanceText: walkingElement?.distance?.text || '',
      walkingDurationText: walkingElement?.duration?.text || ''
    }
  } catch (error) {
    console.error('Error calling Google Maps API:', error)
    throw error
  }
}
