import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"
import { authOptions } from "lib/auth"
import { prisma } from "lib/prisma"
import { getNextPropertyNumber } from "lib/property-number"

const createPropertySchema = z.object({
  name: z.string().min(1, "Name is required"),
  tags: z.array(z.string()).optional().default([]),
  latitude: z.number(),
  longitude: z.number(),
  propertyType: z.string().optional().default("house"),
  // Italian address fields (now primary)
  recipientName: z.string().optional(),
  streetAddress: z.string().optional(),
  postalCode: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  country: z.string().optional().default("ITALY"),
  
  // SECTION 1 - Property Identification (from JSON form)
  fullAddress: z.string().optional(),
  region: z.string().optional(),
  gpsCoordinates: z.string().optional(),
  listingType: z.string().optional(),
  yearBuiltNew: z.string().optional(),
  ownershipType: z.string().optional(),
  
  // SECTION 2 - Property Description (from JSON form)
  shortSummary: z.string().optional(),
  fullDescription: z.string().optional(),
  architecturalStyle: z.string().optional(),
  orientation: z.string().optional(),
  condition: z.string().optional(),
  energyEfficiencyClass: z.string().optional(),
  
  // SECTION 3 - Size & Layout (from JSON form)
  totalLivingArea: z.string().optional(),
  totalLandSize: z.string().optional(),
  numberOfFloors: z.string().optional(),
  numberOfBedrooms: z.string().optional(),
  numberOfBathrooms: z.string().optional(),
  kitchen: z.string().optional(),
  livingDiningAreas: z.string().optional(),
  officeStudyRoom: z.boolean().optional(),
  cellarBasement: z.boolean().optional(),
  atticLoft: z.boolean().optional(),
  garageParking: z.string().optional(),
  outbuildings: z.string().optional(),
  terracesBalconies: z.boolean().optional(),
  laundryUtilityRoom: z.boolean().optional(),
  
  // SECTION 4 - Utilities & Infrastructure (from JSON form)
  waterSource: z.string().optional(),
  heatingSystem: z.array(z.string()).optional().default([]),
  coolingAirConditioning: z.boolean().optional(),
  electricityConnection: z.boolean().optional(),
  sewageType: z.string().optional(),
  internetAvailability: z.string().optional(),
  solarRenewableEnergy: z.string().optional(),
  roadAccessCondition: z.string().optional(),
  
  // SECTION 5 - Outdoor Features & Amenities (from JSON form)
  swimmingPool: z.string().optional(),
  gardenLandscaping: z.string().optional(),
  oliveGroveVineyard: z.string().optional(),
  patioCourtyard: z.boolean().optional(),
  outdoorKitchenBBQ: z.boolean().optional(),
  viewTypes: z.array(z.string()).optional().default([]),
  fencingGates: z.string().optional(),
  parkingSpaces: z.string().optional(),
  
  // SECTION 6 - Location & Proximity (from JSON form)
  nearestTown: z.string().optional(),
  distanceToNearestTown: z.string().optional(),
  distanceToCoast: z.string().optional(),
  distanceToAirport: z.string().optional(),
  distanceToTrainStation: z.string().optional(),
  distanceToServices: z.string().optional(),
  notableAttractions: z.string().optional(),
  
  // SECTION 7 - Legal & Financial Details (from JSON form)
  askingPrice: z.string().optional(),
  negotiable: z.boolean().optional(),
  agencyCommission: z.string().optional(),
  annualPropertyTax: z.string().optional(),
  utilityCostsEstimate: z.string().optional(),
  ownershipDocumentsAvailable: z.boolean().optional(),
  urbanPlanningCompliance: z.string().optional(),
  propertyCurrentlyOccupied: z.boolean().optional(),
  easementsRestrictions: z.string().optional(),
  
  // SECTION 8 - Visuals & Media (from JSON form)
  propertyPhotos: z.array(z.string()).optional().default([]),
  floorPlans: z.array(z.string()).optional().default([]),
  dronePhotos: z.array(z.string()).optional().default([]),
  energyCertificate: z.array(z.string()).optional().default([]),
  virtualTourLink: z.string().optional(),
  
  // SECTION 9 - Agent/Submitter Details (from JSON form)
  agentName: z.string().optional(),
  agencyName: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().optional(),
  authorizationToShare: z.string().optional(),
  
  // SECTION 10 - Additional Notes (from JSON form)
  additionalNotes: z.string().optional(),
  recommendedSellingPoints: z.string().optional(),
  suggestedRenovationPotential: z.string().optional(),
})

const updatePropertySchema = z.object({
  name: z.string().optional(),
  tags: z.array(z.string()).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  propertyType: z.string().optional(),
  // Italian address fields (now primary)
  recipientName: z.string().optional(),
  streetAddress: z.string().optional(),
  postalCode: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  country: z.string().optional(),
  
  // All the comprehensive fields from JSON form (all optional for updates)
  fullAddress: z.string().optional(),
  region: z.string().optional(),
  gpsCoordinates: z.string().optional(),
  listingType: z.string().optional(),
  yearBuiltNew: z.string().optional(),
  ownershipType: z.string().optional(),
  shortSummary: z.string().optional(),
  fullDescription: z.string().optional(),
  architecturalStyle: z.string().optional(),
  orientation: z.string().optional(),
  condition: z.string().optional(),
  energyEfficiencyClass: z.string().optional(),
  totalLivingArea: z.string().optional(),
  totalLandSize: z.string().optional(),
  numberOfFloors: z.string().optional(),
  numberOfBedrooms: z.string().optional(),
  numberOfBathrooms: z.string().optional(),
  kitchen: z.string().optional(),
  livingDiningAreas: z.string().optional(),
  officeStudyRoom: z.boolean().optional(),
  cellarBasement: z.boolean().optional(),
  atticLoft: z.boolean().optional(),
  garageParking: z.string().optional(),
  outbuildings: z.string().optional(),
  terracesBalconies: z.boolean().optional(),
  laundryUtilityRoom: z.boolean().optional(),
  waterSource: z.string().optional(),
  heatingSystem: z.array(z.string()).optional(),
  coolingAirConditioning: z.boolean().optional(),
  electricityConnection: z.boolean().optional(),
  sewageType: z.string().optional(),
  internetAvailability: z.string().optional(),
  solarRenewableEnergy: z.string().optional(),
  roadAccessCondition: z.string().optional(),
  swimmingPool: z.string().optional(),
  gardenLandscaping: z.string().optional(),
  oliveGroveVineyard: z.string().optional(),
  patioCourtyard: z.boolean().optional(),
  outdoorKitchenBBQ: z.boolean().optional(),
  viewTypes: z.array(z.string()).optional(),
  fencingGates: z.string().optional(),
  parkingSpaces: z.string().optional(),
  nearestTown: z.string().optional(),
  distanceToNearestTown: z.string().optional(),
  distanceToCoast: z.string().optional(),
  distanceToAirport: z.string().optional(),
  distanceToTrainStation: z.string().optional(),
  distanceToServices: z.string().optional(),
  notableAttractions: z.string().optional(),
  askingPrice: z.string().optional(),
  negotiable: z.boolean().optional(),
  agencyCommission: z.string().optional(),
  annualPropertyTax: z.string().optional(),
  utilityCostsEstimate: z.string().optional(),
  ownershipDocumentsAvailable: z.boolean().optional(),
  urbanPlanningCompliance: z.string().optional(),
  propertyCurrentlyOccupied: z.boolean().optional(),
  easementsRestrictions: z.string().optional(),
  propertyPhotos: z.array(z.string()).optional(),
  floorPlans: z.array(z.string()).optional(),
  dronePhotos: z.array(z.string()).optional(),
  energyCertificate: z.array(z.string()).optional(),
  virtualTourLink: z.string().optional(),
  agentName: z.string().optional(),
  agencyName: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().optional(),
  authorizationToShare: z.string().optional(),
  additionalNotes: z.string().optional(),
  recommendedSellingPoints: z.string().optional(),
  suggestedRenovationPotential: z.string().optional(),
})

// GET /api/properties - Get all properties for the user
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = (session.user as { id: string }).id
    if (!userId) {
      return NextResponse.json({ error: "User ID not found" }, { status: 401 })
    }

    // All users can see all properties
    const properties = await prisma.property.findMany({
      where: {},
      include: {
        partner: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ properties })
  } catch (error) {
    console.error("Error fetching properties:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST /api/properties - Create a new property
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = (session.user as { id: string }).id
    if (!userId) {
      return NextResponse.json({ error: "User ID not found" }, { status: 401 })
    }

    const body = await request.json()
    const data = createPropertySchema.parse(body)

    // Generate the next property number
    const propertyNumber = await getNextPropertyNumber()

    const property = await prisma.property.create({
      data: {
        userId: userId,
        propertyNumber: propertyNumber,
        name: data.name,
        tags: data.tags,
        latitude: data.latitude,
        longitude: data.longitude,
        propertyType: data.propertyType,
        // Italian address fields (now primary)
        recipientName: data.recipientName,
        streetAddress: data.streetAddress,
        postalCode: data.postalCode,
        city: data.city,
        province: data.province,
        country: data.country,
        
        // SECTION 1 - Property Identification (from JSON form)
        fullAddress: data.fullAddress,
        region: data.region,
        gpsCoordinates: data.gpsCoordinates,
        listingType: data.listingType,
        yearBuiltNew: data.yearBuiltNew,
        ownershipType: data.ownershipType,
        
        // SECTION 2 - Property Description (from JSON form)
        shortSummary: data.shortSummary,
        fullDescription: data.fullDescription,
        architecturalStyle: data.architecturalStyle,
        orientation: data.orientation,
        condition: data.condition,
        energyEfficiencyClass: data.energyEfficiencyClass,
        
        // SECTION 3 - Size & Layout (from JSON form)
        totalLivingArea: data.totalLivingArea,
        totalLandSize: data.totalLandSize,
        numberOfFloors: data.numberOfFloors,
        numberOfBedrooms: data.numberOfBedrooms,
        numberOfBathrooms: data.numberOfBathrooms,
        kitchen: data.kitchen,
        livingDiningAreas: data.livingDiningAreas,
        officeStudyRoom: data.officeStudyRoom,
        cellarBasement: data.cellarBasement,
        atticLoft: data.atticLoft,
        garageParking: data.garageParking,
        outbuildings: data.outbuildings,
        terracesBalconies: data.terracesBalconies,
        laundryUtilityRoom: data.laundryUtilityRoom,
        
        // SECTION 4 - Utilities & Infrastructure (from JSON form)
        waterSource: data.waterSource,
        heatingSystem: data.heatingSystem,
        coolingAirConditioning: data.coolingAirConditioning,
        electricityConnection: data.electricityConnection,
        sewageType: data.sewageType,
        internetAvailability: data.internetAvailability,
        solarRenewableEnergy: data.solarRenewableEnergy,
        roadAccessCondition: data.roadAccessCondition,
        
        // SECTION 5 - Outdoor Features & Amenities (from JSON form)
        swimmingPool: data.swimmingPool,
        gardenLandscaping: data.gardenLandscaping,
        oliveGroveVineyard: data.oliveGroveVineyard,
        patioCourtyard: data.patioCourtyard,
        outdoorKitchenBBQ: data.outdoorKitchenBBQ,
        viewTypes: data.viewTypes,
        fencingGates: data.fencingGates,
        parkingSpaces: data.parkingSpaces,
        
        // SECTION 6 - Location & Proximity (from JSON form)
        nearestTown: data.nearestTown,
        distanceToNearestTown: data.distanceToNearestTown,
        distanceToCoast: data.distanceToCoast,
        distanceToAirport: data.distanceToAirport,
        distanceToTrainStation: data.distanceToTrainStation,
        distanceToServices: data.distanceToServices,
        notableAttractions: data.notableAttractions,
        
        // SECTION 7 - Legal & Financial Details (from JSON form)
        askingPrice: data.askingPrice,
        negotiable: data.negotiable,
        agencyCommission: data.agencyCommission,
        annualPropertyTax: data.annualPropertyTax,
        utilityCostsEstimate: data.utilityCostsEstimate,
        ownershipDocumentsAvailable: data.ownershipDocumentsAvailable,
        urbanPlanningCompliance: data.urbanPlanningCompliance,
        propertyCurrentlyOccupied: data.propertyCurrentlyOccupied,
        easementsRestrictions: data.easementsRestrictions,
        
        // SECTION 8 - Visuals & Media (from JSON form)
        propertyPhotos: data.propertyPhotos,
        floorPlans: data.floorPlans,
        dronePhotos: data.dronePhotos,
        energyCertificate: data.energyCertificate,
        virtualTourLink: data.virtualTourLink,
        
        // SECTION 9 - Agent/Submitter Details (from JSON form)
        agentName: data.agentName,
        agencyName: data.agencyName,
        email: data.email,
        phone: data.phone,
        website: data.website,
        authorizationToShare: data.authorizationToShare,
        
        // SECTION 10 - Additional Notes (from JSON form)
        additionalNotes: data.additionalNotes,
        recommendedSellingPoints: data.recommendedSellingPoints,
        suggestedRenovationPotential: data.suggestedRenovationPotential,
      }
    })

    return NextResponse.json({ property }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message || "Validation error" },
        { status: 400 }
      )
    }

    console.error("Error creating property:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE /api/properties - Delete a property
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = (session.user as { id: string }).id
    if (!userId) {
      return NextResponse.json({ error: "User ID not found" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const propertyId = searchParams.get('id')

    if (!propertyId) {
      return NextResponse.json({ error: "Property ID is required" }, { status: 400 })
    }

    // Check if property exists and belongs to user
    const property = await prisma.property.findFirst({
      where: {
        id: propertyId,
        userId: userId
      }
    })

    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 })
    }

    // Delete the property (cascading deletes will handle related records)
    await prisma.property.delete({
      where: {
        id: propertyId
      }
    })

    return NextResponse.json({ message: "Property deleted successfully" })
  } catch (error) {
    console.error("Error deleting property:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// PUT /api/properties - Update a property
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = (session.user as { id: string }).id
    if (!userId) {
      return NextResponse.json({ error: "User ID not found" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const propertyId = searchParams.get('id')

    if (!propertyId) {
      return NextResponse.json({ error: "Property ID is required" }, { status: 400 })
    }

    // Check if property exists and belongs to user
    const existingProperty = await prisma.property.findFirst({
      where: {
        id: propertyId,
        userId: userId
      }
    })

    if (!existingProperty) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 })
    }

    const body = await request.json()
    const updateData = updatePropertySchema.parse(body)

    // Only update fields that are provided
    const updateFields: Record<string, unknown> = {}
    if (updateData.name !== undefined) updateFields.name = updateData.name
    if (updateData.tags !== undefined) updateFields.tags = updateData.tags
    if (updateData.latitude !== undefined) updateFields.latitude = updateData.latitude
    if (updateData.longitude !== undefined) updateFields.longitude = updateData.longitude
    if (updateData.propertyType !== undefined) updateFields.propertyType = updateData.propertyType
    // Italian address fields (now primary)
    if (updateData.recipientName !== undefined) updateFields.recipientName = updateData.recipientName
    if (updateData.streetAddress !== undefined) updateFields.streetAddress = updateData.streetAddress
    if (updateData.postalCode !== undefined) updateFields.postalCode = updateData.postalCode
    if (updateData.city !== undefined) updateFields.city = updateData.city
    if (updateData.province !== undefined) updateFields.province = updateData.province
    if (updateData.country !== undefined) updateFields.country = updateData.country
    
    // SECTION 1 - Property Identification (from JSON form)
    if (updateData.fullAddress !== undefined) updateFields.fullAddress = updateData.fullAddress
    if (updateData.region !== undefined) updateFields.region = updateData.region
    if (updateData.gpsCoordinates !== undefined) updateFields.gpsCoordinates = updateData.gpsCoordinates
    if (updateData.listingType !== undefined) updateFields.listingType = updateData.listingType
    if (updateData.yearBuiltNew !== undefined) updateFields.yearBuiltNew = updateData.yearBuiltNew
    if (updateData.ownershipType !== undefined) updateFields.ownershipType = updateData.ownershipType
    
    // SECTION 2 - Property Description (from JSON form)
    if (updateData.shortSummary !== undefined) updateFields.shortSummary = updateData.shortSummary
    if (updateData.fullDescription !== undefined) updateFields.fullDescription = updateData.fullDescription
    if (updateData.architecturalStyle !== undefined) updateFields.architecturalStyle = updateData.architecturalStyle
    if (updateData.orientation !== undefined) updateFields.orientation = updateData.orientation
    if (updateData.condition !== undefined) updateFields.condition = updateData.condition
    if (updateData.energyEfficiencyClass !== undefined) updateFields.energyEfficiencyClass = updateData.energyEfficiencyClass
    
    // SECTION 3 - Size & Layout (from JSON form)
    if (updateData.totalLivingArea !== undefined) updateFields.totalLivingArea = updateData.totalLivingArea
    if (updateData.totalLandSize !== undefined) updateFields.totalLandSize = updateData.totalLandSize
    if (updateData.numberOfFloors !== undefined) updateFields.numberOfFloors = updateData.numberOfFloors
    if (updateData.numberOfBedrooms !== undefined) updateFields.numberOfBedrooms = updateData.numberOfBedrooms
    if (updateData.numberOfBathrooms !== undefined) updateFields.numberOfBathrooms = updateData.numberOfBathrooms
    if (updateData.kitchen !== undefined) updateFields.kitchen = updateData.kitchen
    if (updateData.livingDiningAreas !== undefined) updateFields.livingDiningAreas = updateData.livingDiningAreas
    if (updateData.officeStudyRoom !== undefined) updateFields.officeStudyRoom = updateData.officeStudyRoom
    if (updateData.cellarBasement !== undefined) updateFields.cellarBasement = updateData.cellarBasement
    if (updateData.atticLoft !== undefined) updateFields.atticLoft = updateData.atticLoft
    if (updateData.garageParking !== undefined) updateFields.garageParking = updateData.garageParking
    if (updateData.outbuildings !== undefined) updateFields.outbuildings = updateData.outbuildings
    if (updateData.terracesBalconies !== undefined) updateFields.terracesBalconies = updateData.terracesBalconies
    if (updateData.laundryUtilityRoom !== undefined) updateFields.laundryUtilityRoom = updateData.laundryUtilityRoom
    
    // SECTION 4 - Utilities & Infrastructure (from JSON form)
    if (updateData.waterSource !== undefined) updateFields.waterSource = updateData.waterSource
    if (updateData.heatingSystem !== undefined) updateFields.heatingSystem = updateData.heatingSystem
    if (updateData.coolingAirConditioning !== undefined) updateFields.coolingAirConditioning = updateData.coolingAirConditioning
    if (updateData.electricityConnection !== undefined) updateFields.electricityConnection = updateData.electricityConnection
    if (updateData.sewageType !== undefined) updateFields.sewageType = updateData.sewageType
    if (updateData.internetAvailability !== undefined) updateFields.internetAvailability = updateData.internetAvailability
    if (updateData.solarRenewableEnergy !== undefined) updateFields.solarRenewableEnergy = updateData.solarRenewableEnergy
    if (updateData.roadAccessCondition !== undefined) updateFields.roadAccessCondition = updateData.roadAccessCondition
    
    // SECTION 5 - Outdoor Features & Amenities (from JSON form)
    if (updateData.swimmingPool !== undefined) updateFields.swimmingPool = updateData.swimmingPool
    if (updateData.gardenLandscaping !== undefined) updateFields.gardenLandscaping = updateData.gardenLandscaping
    if (updateData.oliveGroveVineyard !== undefined) updateFields.oliveGroveVineyard = updateData.oliveGroveVineyard
    if (updateData.patioCourtyard !== undefined) updateFields.patioCourtyard = updateData.patioCourtyard
    if (updateData.outdoorKitchenBBQ !== undefined) updateFields.outdoorKitchenBBQ = updateData.outdoorKitchenBBQ
    if (updateData.viewTypes !== undefined) updateFields.viewTypes = updateData.viewTypes
    if (updateData.fencingGates !== undefined) updateFields.fencingGates = updateData.fencingGates
    if (updateData.parkingSpaces !== undefined) updateFields.parkingSpaces = updateData.parkingSpaces
    
    // SECTION 6 - Location & Proximity (from JSON form)
    if (updateData.nearestTown !== undefined) updateFields.nearestTown = updateData.nearestTown
    if (updateData.distanceToNearestTown !== undefined) updateFields.distanceToNearestTown = updateData.distanceToNearestTown
    if (updateData.distanceToCoast !== undefined) updateFields.distanceToCoast = updateData.distanceToCoast
    if (updateData.distanceToAirport !== undefined) updateFields.distanceToAirport = updateData.distanceToAirport
    if (updateData.distanceToTrainStation !== undefined) updateFields.distanceToTrainStation = updateData.distanceToTrainStation
    if (updateData.distanceToServices !== undefined) updateFields.distanceToServices = updateData.distanceToServices
    if (updateData.notableAttractions !== undefined) updateFields.notableAttractions = updateData.notableAttractions
    
    // SECTION 7 - Legal & Financial Details (from JSON form)
    if (updateData.askingPrice !== undefined) updateFields.askingPrice = updateData.askingPrice
    if (updateData.negotiable !== undefined) updateFields.negotiable = updateData.negotiable
    if (updateData.agencyCommission !== undefined) updateFields.agencyCommission = updateData.agencyCommission
    if (updateData.annualPropertyTax !== undefined) updateFields.annualPropertyTax = updateData.annualPropertyTax
    if (updateData.utilityCostsEstimate !== undefined) updateFields.utilityCostsEstimate = updateData.utilityCostsEstimate
    if (updateData.ownershipDocumentsAvailable !== undefined) updateFields.ownershipDocumentsAvailable = updateData.ownershipDocumentsAvailable
    if (updateData.urbanPlanningCompliance !== undefined) updateFields.urbanPlanningCompliance = updateData.urbanPlanningCompliance
    if (updateData.propertyCurrentlyOccupied !== undefined) updateFields.propertyCurrentlyOccupied = updateData.propertyCurrentlyOccupied
    if (updateData.easementsRestrictions !== undefined) updateFields.easementsRestrictions = updateData.easementsRestrictions
    
    // SECTION 8 - Visuals & Media (from JSON form)
    if (updateData.propertyPhotos !== undefined) updateFields.propertyPhotos = updateData.propertyPhotos
    if (updateData.floorPlans !== undefined) updateFields.floorPlans = updateData.floorPlans
    if (updateData.dronePhotos !== undefined) updateFields.dronePhotos = updateData.dronePhotos
    if (updateData.energyCertificate !== undefined) updateFields.energyCertificate = updateData.energyCertificate
    if (updateData.virtualTourLink !== undefined) updateFields.virtualTourLink = updateData.virtualTourLink
    
    // SECTION 9 - Agent/Submitter Details (from JSON form)
    if (updateData.agentName !== undefined) updateFields.agentName = updateData.agentName
    if (updateData.agencyName !== undefined) updateFields.agencyName = updateData.agencyName
    if (updateData.email !== undefined) updateFields.email = updateData.email
    if (updateData.phone !== undefined) updateFields.phone = updateData.phone
    if (updateData.website !== undefined) updateFields.website = updateData.website
    if (updateData.authorizationToShare !== undefined) updateFields.authorizationToShare = updateData.authorizationToShare
    
    // SECTION 10 - Additional Notes (from JSON form)
    if (updateData.additionalNotes !== undefined) updateFields.additionalNotes = updateData.additionalNotes
    if (updateData.recommendedSellingPoints !== undefined) updateFields.recommendedSellingPoints = updateData.recommendedSellingPoints
    if (updateData.suggestedRenovationPotential !== undefined) updateFields.suggestedRenovationPotential = updateData.suggestedRenovationPotential

    const property = await prisma.property.update({
      where: {
        id: propertyId
      },
      data: updateFields
    })

    return NextResponse.json({ property })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message || "Validation error" },
        { status: 400 }
      )
    }

    console.error("Error updating property:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
