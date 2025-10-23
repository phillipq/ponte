import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "lib/auth"
import { prisma } from "lib/prisma"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !(session.user as { id: string }).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json() as { name?: string }
    
    if (!body.name || body.name.trim() === '') {
      return NextResponse.json({ error: "Tour name is required" }, { status: 400 })
    }
    
    // Check if tour exists
    const tour = await prisma.tour.findFirst({
      where: { 
        id: id
      }
    })
    
    if (!tour) {
      return NextResponse.json({ error: "Tour not found" }, { status: 404 })
    }
    
    // Update tour name
    const updatedTour = await prisma.tour.update({
      where: { id: id },
      data: { name: body.name.trim() }
    })
    
    return NextResponse.json({ success: true, tour: updatedTour })
  } catch (error) {
    console.error("Error updating tour:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !(session.user as { id: string }).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    
    // Check if tour exists
    const tour = await prisma.tour.findFirst({
      where: { 
        id: id
      }
    })
    
    if (!tour) {
      return NextResponse.json({ error: "Tour not found" }, { status: 404 })
    }
    
    await prisma.tour.delete({
      where: { id: id }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting tour:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
