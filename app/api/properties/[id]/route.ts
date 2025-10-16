import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "lib/auth"
import { prisma } from "lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const property = await prisma.property.findFirst({
      where: {
        id: id,
        userId: (session.user as { id: string }).id
      }
    })

    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 })
    }

    return NextResponse.json(property)
  } catch (error) {
    console.error("Error fetching property:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json() as {
      name?: string; tags?: string[]; latitude?: number; longitude?: number; propertyType?: string; recipientName?: string; streetAddress?: string; postalCode?: string; city?: string; province?: string; country?: string;
      propertyNumber?: number; whoProvided?: string; dateProvided?: string; propertyLink?: string; pictures?: string[]; picturesUploaded?: boolean; featuredImage?: string; comune?: string; dateAdded?: string;
      decision?: string; peterNotes?: string; wesNotes?: string; elenaNotes?: string; hazelNotes?: string;
      sellPrice?: number; homeSizeM2?: number; pricePerM2?: number; landSizeM2?: number; yearBuilt?: number; renovationCost?: number; totalInvestment?: number;
      foundationGood?: boolean; roofGood?: boolean; extraBuildings?: string; rooms?: number; bathrooms?: number;
      kmToTown?: number; kmToBeaches?: number; kmToAirport?: number; kmToTransit?: number;
      gasOnSite?: boolean; waterOnSite?: boolean; electricalOnSite?: boolean; views?: string;
      manualScore?: number; aiScore?: number; portfolioPotential?: string; status?: string
    }
    
    // Extract all the new property fields
    const {
      name, tags, latitude, longitude, propertyType, recipientName, streetAddress, postalCode, city, province, country,
      // New comprehensive fields
      propertyNumber, whoProvided, dateProvided, propertyLink, pictures, picturesUploaded, featuredImage, comune, dateAdded,
      decision, peterNotes, wesNotes, elenaNotes, hazelNotes,
      sellPrice, homeSizeM2, pricePerM2, landSizeM2, yearBuilt, renovationCost, totalInvestment,
      foundationGood, roofGood, extraBuildings, rooms, bathrooms,
      kmToTown, kmToBeaches, kmToAirport, kmToTransit,
      gasOnSite, waterOnSite, electricalOnSite, views,
      manualScore, aiScore, portfolioPotential, status
    } = body

    const property = await prisma.property.update({
      where: {
        id: id,
        userId: (session.user as { id: string }).id
      },
      data: {
        name,
        tags,
        latitude,
        longitude,
        propertyType,
        recipientName,
        streetAddress,
        postalCode,
        city,
        province,
        country,
        // New comprehensive fields
        propertyNumber,
        whoProvided,
        dateProvided: dateProvided ? new Date(dateProvided) : undefined,
        propertyLink,
        pictures: pictures ? pictures.join(',') : null,
        picturesUploaded: picturesUploaded ? ['uploaded'] : [],
        featuredImage,
        comune,
        dateAdded: dateAdded ? new Date(dateAdded) : undefined,
        decision,
        peterNotes,
        wesNotes,
        elenaNotes,
        hazelNotes,
        sellPrice,
        homeSizeM2,
        pricePerM2,
        landSizeM2,
        yearBuilt,
        renovationCost,
        totalInvestment,
        foundationGood,
        roofGood,
        extraBuildings: extraBuildings ? extraBuildings === 'true' : false,
        rooms,
        bathrooms,
        kmToTown,
        kmToBeaches,
        kmToAirport,
        kmToTransit,
        gasOnSite,
        waterOnSite,
        electricalOnSite,
        views: views ? views === 'true' : false,
        manualScore,
        aiScore,
        portfolioPotential,
        status
      }
    })

    return NextResponse.json(property)
  } catch (error) {
    console.error("Error updating property:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    // Delete the property (related PropertyDistance records will be deleted due to onDelete: Cascade)
    await prisma.property.delete({
      where: {
        id: id,
        userId: (session.user as { id: string }).id
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting property:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
