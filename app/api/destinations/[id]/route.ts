import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "lib/auth"
import { prisma } from "lib/prisma"
import { z } from "zod"

// Category normalization function
const normalizeCategory = (category: string) => {
  const normalized = category.toLowerCase().trim()
  
  const categoryMap: { [key: string]: string } = {
    'international airport': 'int_airport',
    'international airports': 'int_airport',
    'int airport': 'int_airport',
    'int_airport': 'int_airport',
    'airport': 'airport',
    'airports': 'airport',
    'bus station': 'bus_station',
    'bus stations': 'bus_station',
    'bus_station': 'bus_station',
    'train station': 'train_station',
    'train stations': 'train_station',
    'train_station': 'train_station',
    'attraction': 'attraction',
    'attractions': 'attraction',
    'beach': 'beach',
    'beaches': 'beach',
    'entertainment': 'entertainment',
    'hospital': 'hospital',
    'hospitals': 'hospital',
    'hotel': 'hotel',
    'hotels': 'hotel',
    'museum': 'museum',
    'museums': 'museum',
    'mountain': 'mountain',
    'mountains': 'mountain',
    'other': 'other',
    'park': 'park',
    'parks': 'park',
    'restaurant': 'restaurant',
    'restaurants': 'restaurant',
    'school': 'school',
    'schools': 'school',
    'shopping': 'shopping',
    'store': 'shopping',
    'stores': 'shopping',
    'theater': 'entertainment',
    'theatre': 'entertainment',
    'theaters': 'entertainment',
    'theatres': 'entertainment'
  }
  
  return categoryMap[normalized] || null
}

const updateDestinationSchema = z.object({
  name: z.string().optional(),
  address: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  category: z.string().optional(),
  placeId: z.string().nullable().optional(),
  metadata: z.any().optional(),
  tags: z.array(z.string()).optional(),
  keywords: z.array(z.string()).optional(),
  description: z.string().nullable().optional(),
  // Italian address fields (aligned with Property)
  streetAddress: z.string().nullable().optional(),
  postalCode: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  province: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
})

// GET /api/destinations/[id] - Get a specific destination
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id as string
    const { id: destinationId } = await params

    const destination = await prisma.destination.findFirst({
      where: {
        id: destinationId,
        userId: userId
      }
    })

    if (!destination) {
      return NextResponse.json({ error: "Destination not found" }, { status: 404 })
    }

    return NextResponse.json({ destination })
  } catch (error) {
    console.error("Error fetching destination:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// PUT /api/destinations/[id] - Update a destination
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id as string
    const { id: destinationId } = await params

    // Verify the user owns this destination
    const existingDestination = await prisma.destination.findFirst({
      where: {
        id: destinationId,
        userId: userId
      }
    })

    if (!existingDestination) {
      return NextResponse.json({ error: "Destination not found" }, { status: 404 })
    }

    const body = await request.json()
    const updateData = updateDestinationSchema.parse(body)

    // Normalize category if provided
    if (updateData.category) {
      updateData.category = normalizeCategory(updateData.category) || updateData.category
    }

    const destination = await prisma.destination.update({
      where: {
        id: destinationId
      },
      data: updateData
    })

    return NextResponse.json({ destination })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error("Error updating destination:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE /api/destinations/[id] - Delete a destination
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id as string
    const { id: destinationId } = await params

    // Verify the user owns this destination
    const existingDestination = await prisma.destination.findFirst({
      where: {
        id: destinationId,
        userId: userId
      }
    })

    if (!existingDestination) {
      return NextResponse.json({ error: "Destination not found" }, { status: 404 })
    }

    // Delete the destination
    await prisma.destination.delete({
      where: {
        id: destinationId
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting destination:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}