import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "lib/auth"

// POST /api/tours/calculate-route - Calculate tour route using Distance Matrix API
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as { id: string }).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { tourSteps } = await request.json()

    if (!tourSteps || tourSteps.length < 2) {
      return NextResponse.json({ error: "At least 2 stops required" }, { status: 400 })
    }

    // Validate coordinates
    const validSteps = tourSteps.filter((step: unknown) => {
      const s = step as { latitude?: number; longitude?: number }
      return s.latitude && s.longitude && 
      !isNaN(s.latitude) && !isNaN(s.longitude) &&
      s.latitude >= -90 && s.latitude <= 90 &&
      s.longitude >= -180 && s.longitude <= 180
    })

    if (validSteps.length < 2) {
      return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 })
    }

    const routeSteps = []
    let totalDistance = 0
    let totalDuration = 0
    let totalTransitDuration = 0

    // Add starting point
    routeSteps.push({
      step: 1,
      name: validSteps[0].name,
      type: validSteps[0].type,
      address: validSteps[0].address,
      duration: 0,
      distance: 0,
      durationText: 'Starting Point',
      distanceText: '0 km',
      transitDuration: 0,
      transitDurationText: 'N/A'
    })

    // Calculate distances between consecutive stops
    for (let i = 0; i < validSteps.length - 1; i++) {
      const currentStep = validSteps[i]
      const nextStep = validSteps[i + 1]

      try {
        // Get driving data
        const drivingData = await calculateDistance(
          currentStep.latitude,
          currentStep.longitude,
          nextStep.latitude,
          nextStep.longitude,
          'driving'
        )

        // Get transit data
        const transitData = await calculateDistance(
          currentStep.latitude,
          currentStep.longitude,
          nextStep.latitude,
          nextStep.longitude,
          'transit'
        )

        // Get walking data
        const walkingData = await calculateDistance(
          currentStep.latitude,
          currentStep.longitude,
          nextStep.latitude,
          nextStep.longitude,
          'walking'
        )

        if (drivingData) {
          const duration = drivingData.duration || 0
          const distance = drivingData.distance || 0
          const transitDuration = transitData?.duration || duration * 1.5 // Fallback estimate
          const walkingDuration = walkingData?.duration || duration * 1.2 // Fallback estimate

          totalDuration += duration
          totalDistance += distance
          totalTransitDuration += transitDuration

          routeSteps.push({
            step: i + 2,
            name: nextStep.name,
            type: nextStep.type,
            address: nextStep.address,
            duration: duration,
            distance: distance,
            durationText: formatDuration(duration),
            distanceText: `${(distance / 1000).toFixed(1)} km`,
            transitDuration: transitDuration,
            transitDurationText: formatDuration(transitDuration),
            walkingDuration: walkingDuration,
            walkingDurationText: formatDuration(walkingDuration)
          })
        } else {
          // Fallback calculation
          const distance = calculateHaversineDistance(
            currentStep.latitude,
            currentStep.longitude,
            nextStep.latitude,
            nextStep.longitude
          )
          const estimatedDuration = Math.max(300, distance * 60) // 1 minute per km, minimum 5 minutes
          const estimatedTransitDuration = estimatedDuration * 1.5

          totalDuration += estimatedDuration
          totalDistance += distance * 1000
          totalTransitDuration += estimatedTransitDuration

          routeSteps.push({
            step: i + 2,
            name: nextStep.name,
            type: nextStep.type,
            address: nextStep.address,
            duration: estimatedDuration,
            distance: distance * 1000,
            durationText: formatDuration(estimatedDuration),
            distanceText: `${distance.toFixed(1)} km`,
            transitDuration: estimatedTransitDuration,
            transitDurationText: formatDuration(estimatedTransitDuration)
          })
        }
      } catch (error) {
        console.error(`Error calculating distance for step ${i + 1}:`, error)
        // Continue with fallback
        const distance = calculateHaversineDistance(
          currentStep.latitude,
          currentStep.longitude,
          nextStep.latitude,
          nextStep.longitude
        )
        const estimatedDuration = Math.max(300, distance * 60)
        const estimatedTransitDuration = estimatedDuration * 1.5

        totalDuration += estimatedDuration
        totalDistance += distance * 1000
        totalTransitDuration += estimatedTransitDuration

        routeSteps.push({
          step: i + 2,
          name: nextStep.name,
          type: nextStep.type,
          address: nextStep.address,
          duration: estimatedDuration,
          distance: distance * 1000,
          durationText: formatDuration(estimatedDuration),
          distanceText: `${distance.toFixed(1)} km`,
          transitDuration: estimatedTransitDuration,
          transitDurationText: formatDuration(estimatedTransitDuration)
        })
      }
    }

    // Add total summary
    routeSteps.push({
      step: routeSteps.length + 1,
      name: 'Total Tour',
      type: 'summary',
      address: '',
      duration: totalDuration,
      distance: totalDistance,
      durationText: formatDuration(totalDuration),
      distanceText: `${(totalDistance / 1000).toFixed(1)} km`,
      transitDuration: totalTransitDuration,
      transitDurationText: formatDuration(totalTransitDuration)
    })

    return NextResponse.json({
      success: true,
      route: routeSteps,
      totalDistance: totalDistance,
      totalDuration: totalDuration,
      totalTransitDuration: totalTransitDuration
    })

  } catch (error) {
    console.error("Error calculating tour route:", error)
    return NextResponse.json({ error: "Failed to calculate tour route" }, { status: 500 })
  }
}

async function calculateDistance(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number,
  mode: 'driving' | 'transit' | 'walking'
): Promise<{ distance: number; duration: number } | null> {
  try {
    const apiKey = process.env.GOOGLE_MAPS_GEOCODING_API_KEY || process.env.GOOGLE_MAPS_API_KEY
    if (!apiKey) {
      throw new Error("Google Maps API key not found")
    }

    const origins = `${originLat},${originLng}`
    const destinations = `${destLat},${destLng}`
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origins}&destinations=${destinations}&units=metric&mode=${mode}&key=${apiKey}`

    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`Distance Matrix API error: ${response.status}`)
    }

    const data = await response.json() as unknown
    
    if ((data as { rows?: unknown[] }).rows && ((data as { rows: unknown[] }).rows[0] as { elements?: unknown[] })?.elements && ((data as { rows: unknown[] }).rows[0] as { elements: unknown[] }).elements[0]) {
      const element = ((data as { rows: unknown[] }).rows[0] as { elements: unknown[] }).elements[0]
      
      if ((element as { status: string }).status === "OK") {
        return {
          distance: (element as { distance: { value: number } }).distance.value, // in meters
          duration: (element as { duration: { value: number } }).duration.value  // in seconds
        }
      } else {
        console.error(`Distance Matrix API returned error for ${mode}:`, (element as { status: string }).status)
        return null
      }
    }

    console.error(`Invalid response from Distance Matrix API for ${mode}:`, data)
    return null
  } catch (error) {
    console.error(`Error calling Distance Matrix API for ${mode}:`, error)
    return null
  }
}

function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  
  if (hours === 0) {
    return `${minutes} min`
  } else if (minutes === 0) {
    return `${hours} hr`
  } else {
    return `${hours} hr ${minutes} min`
  }
}
