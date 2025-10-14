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

const createDestinationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  address: z.string().min(1, "Address is required"),
  latitude: z.number(),
  longitude: z.number(),
  category: z.string().min(1, "Category is required"),
  placeId: z.string().optional(),
  metadata: z.any().optional(),
  tags: z.array(z.string()).optional(),
  // Italian address fields (aligned with Property)
  streetAddress: z.string().optional(),
  postalCode: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  country: z.string().optional(),
})

const updateDestinationSchema = z.object({
  name: z.string().optional(),
  address: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  category: z.string().optional(),
  placeId: z.string().optional(),
  metadata: z.any().optional(),
  tags: z.array(z.string()).optional(),
})

// GET /api/destinations - Get all destinations for the user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = (session.user as any).id

    const destinations = await prisma.destination.findMany({
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json({ destinations })
  } catch (error) {
    console.error("Error fetching destinations:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST /api/destinations - Create a new destination
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = (session.user as any).id
    const body = await request.json()
    const { name, address, latitude, longitude, category, placeId, metadata, tags, streetAddress, postalCode, city, province, country } = createDestinationSchema.parse(body)

    // Normalize category
    const normalizedCategory = normalizeCategory(category) || category

    const destination = await prisma.destination.create({
      data: {
        userId,
        name,
        address,
        latitude,
        longitude,
        category: normalizedCategory,
        placeId,
        metadata,
        tags: tags || [],
        streetAddress,
        postalCode,
        city,
        province,
        country,
      }
    })

    return NextResponse.json({ destination }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message || "Validation error" },
        { status: 400 }
      )
    }

    console.error("Error creating destination:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}