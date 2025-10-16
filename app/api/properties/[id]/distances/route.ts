import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from 'lib/auth'
import { prisma } from 'lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: propertyId } = await params

    // Fetch all distance data for this property
    const distances = await prisma.propertyDistance.findMany({
      where: {
        propertyId: propertyId
      },
      include: {
        destination: {
          select: {
            id: true,
            name: true,
            category: true,
            latitude: true,
            longitude: true
          }
        }
      }
    })

    // Transform the data to match the expected format
    const transformedDistances = distances.map(distance => ({
      destinationId: distance.destinationId,
      destinationName: distance.destination.name,
      destinationCategory: distance.destination.category,
      drivingDistance: distance.drivingDistance,
      drivingDuration: distance.drivingDuration,
      transitDistance: distance.transitDistance,
      transitDuration: distance.transitDuration,
      walkingDistance: distance.walkingDistance,
      walkingDuration: distance.walkingDuration
    }))

    return NextResponse.json({ distances: transformedDistances })

  } catch (error) {
    console.error('Error fetching property distances:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
