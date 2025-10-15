import { PrismaClient } from "@prisma/client"
import { NextRequest, NextResponse } from "next/server"
import { getNextPropertyNumber } from "lib/property-number"

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      propertyType,
      recipientName,
      streetAddress,
      postalCode,
      city,
      province,
      country,
      latitude,
      longitude,
      propertyLink,
      tags,
      pictures,
      partnerId
    } = body as {
      name: string
      propertyType: string
      recipientName?: string
      streetAddress?: string
      postalCode?: string
      city?: string
      province?: string
      country?: string
      latitude?: number
      longitude?: number
      propertyLink?: string
      tags?: string[]
      pictures?: string[]
      partnerId: string
    }

    if (!name || !propertyType || !city || !partnerId) {
      return NextResponse.json(
        { error: "Name, property type, city, and partner ID are required" },
        { status: 400 }
      )
    }

    // Generate the next property number
    const propertyNumber = await getNextPropertyNumber()

    // Create the property
    const property = await prisma.property.create({
      data: {
        propertyNumber: propertyNumber,
        name,
        propertyType,
        recipientName: recipientName || null,
        streetAddress: streetAddress || null,
        postalCode: postalCode || null,
        city: city || null,
        province: province || null,
        country: country || "ITALY",
        latitude: latitude || 0,
        longitude: longitude || 0,
        propertyLink: propertyLink || null,
        tags: tags || [],
        picturesUploaded: pictures || [],
        userId: "system", // System user for partner-submitted properties
        partnerId: partnerId
      }
    })

    return NextResponse.json({
      success: true,
      property: {
        id: property.id,
        name: property.name,
        propertyType: property.propertyType,
        city: property.city,
        createdAt: property.createdAt
      }
    })

  } catch (error) {
    console.error("Error creating partner property:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}