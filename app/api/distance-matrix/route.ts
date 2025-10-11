import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "lib/auth"
import { prisma } from "lib/prisma"
import { z } from "zod"

const distanceMatrixSchema = z.object({
  propertyId: z.string().min(1, "Property ID is required"),
  destinationIds: z.array(z.string()).min(1, "At least one destination ID is required"),
})

interface DistanceMatrixResult {
  propertyId: string
  destinationId: string
  drivingDistance?: number
  drivingDuration?: number
  trafficDuration?: number
  status: string
}

// POST /api/distance-matrix - Calculate distances between property and destinations
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id as string
    const body = await request.json()
    const { propertyId, destinationIds } = distanceMatrixSchema.parse(body)

    const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_GEOCODING_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: "Google Maps API key not configured" },
        { status: 500 }
      )
    }

    // Get the property
    const property = await prisma.property.findFirst({
      where: {
        id: propertyId,
        userId: userId
      }
    })

    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 })
    }

    // Get the destinations
    const destinations = await prisma.destination.findMany({
      where: {
        id: { in: destinationIds }
      }
    })

    if (destinations.length === 0) {
      return NextResponse.json({ error: "No destinations found" }, { status: 404 })
    }

    // Check if distances already exist in database
    const existingDistances = await prisma.propertyDistance.findMany({
      where: {
        propertyId,
        destinationId: { in: destinationIds }
      }
    })

    const existingDestinationIds = new Set(existingDistances.map((d: any) => d.destinationId))
    const newDestinationIds = destinationIds.filter(id => !existingDestinationIds.has(id))

    let results: DistanceMatrixResult[] = []

    // Add existing distances to results
    existingDistances.forEach((distance: any) => {
      results.push({
        propertyId: distance.propertyId,
        destinationId: distance.destinationId,
        drivingDistance: distance.drivingDistance || undefined,
        drivingDuration: distance.drivingDuration || undefined,
        trafficDuration: distance.trafficDuration || undefined,
        status: 'OK'
      })
    })

    // Calculate new distances if needed
    if (newDestinationIds.length > 0) {
      const newDestinations = destinations.filter((d: any) => newDestinationIds.includes(d.id))
      
      // Prepare origins and destinations for Google Distance Matrix API
      const origins = `${property.latitude},${property.longitude}`
      const destinationsParam = newDestinations.map((d: any) => `${d.latitude},${d.longitude}`).join('|')
      
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origins}&destinations=${destinationsParam}&units=metric&key=${apiKey}`
      )

      const data = await response.json() as any

      if (data.status === 'OK') {
        // Process results and save to database
        for (let i = 0; i < data.rows[0].elements.length; i++) {
          const element = data.rows[0].elements[i]
          const destination = newDestinations[i]
          
          if (element.status === 'OK') {
            const distance = element.distance.value // in meters
            const duration = element.duration.value // in seconds
            const trafficDuration = element.duration_in_traffic?.value // in seconds

            // Save to database
            await prisma.propertyDistance.create({
              data: {
                propertyId,
                destinationId: destination.id,
                drivingDistance: distance,
                drivingDuration: duration,
                trafficDuration: trafficDuration,
              }
            })

            results.push({
              propertyId,
              destinationId: destination.id,
              drivingDistance: distance,
              drivingDuration: duration,
              trafficDuration: trafficDuration,
              status: 'OK'
            })
          } else {
            results.push({
              propertyId,
              destinationId: destination.id,
              status: element.status
            })
          }
        }
      }
    }

    return NextResponse.json({ results })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error("Distance matrix error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
