import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "lib/auth"
import { prisma } from "lib/prisma"
import { EVALUATION_CATEGORIES } from "lib/property-evaluation"

// GET /api/properties/[id]/evaluations - Get all evaluations for a property
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!(session?.user as { id: string })?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const evaluations = await prisma.propertyEvaluation.findMany({
      where: {
        propertyId: id,
        userId: (session?.user as { id: string })?.id
      },
      include: {
        evaluationItems: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ evaluations })
  } catch (error) {
    console.error("Error fetching property evaluations:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST /api/properties/[id]/evaluations - Create a new evaluation
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!(session?.user as { id: string })?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json() as { clientName?: string; propertyAddress?: string; createdBy?: string }
    const { clientName, propertyAddress, createdBy } = body

    // Verify property belongs to user
    const property = await prisma.property.findFirst({
      where: {
        id: id,
        userId: (session?.user as { id: string })?.id
      }
    })

    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 })
    }

    // Create evaluation with all items from the framework
    const evaluation = await prisma.propertyEvaluation.create({
      data: {
        propertyId: id,
        userId: (session?.user as { id: string })?.id,
        clientName: clientName || null,
        propertyAddress: propertyAddress || null,
        createdBy: createdBy || (session?.user as { name?: string })?.name || "Unknown",
        evaluationItems: {
          create: [
            // Legal Status items
            ...EVALUATION_CATEGORIES.LEGAL_STATUS.items.map(item => ({
              category: "LEGAL_STATUS",
              item: item.item,
              score: 0
            })),
            // Seismic Activity items
            ...EVALUATION_CATEGORIES.SEISMIC_ACTIVITY.items.map(item => ({
              category: "SEISMIC_ACTIVITY",
              item: item.item,
              score: 0
            })),
            // Foundation Condition items
            ...EVALUATION_CATEGORIES.FOUNDATION_CONDITION.items.map(item => ({
              category: "FOUNDATION_CONDITION",
              item: item.item,
              score: 0
            })),
            // Home Inspection items
            ...EVALUATION_CATEGORIES.HOME_INSPECTION.items.map(item => ({
              category: "HOME_INSPECTION",
              item: item.item,
              score: 0
            })),
            // Service Supplier items
            ...EVALUATION_CATEGORIES.SERVICE_SUPPLIER.items.map(item => ({
              category: "SERVICE_SUPPLIER",
              item: item.item,
              score: 0
            })),
            // Grounds/Gardens items
            ...EVALUATION_CATEGORIES.GROUNDS_GARDENS.items.map(item => ({
              category: "GROUNDS_GARDENS",
              item: item.item,
              score: 0
            }))
          ]
        }
      },
      include: {
        evaluationItems: true
      }
    })

    return NextResponse.json({ evaluation }, { status: 201 })
  } catch (error) {
    console.error("Error creating property evaluation:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
