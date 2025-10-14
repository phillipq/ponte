import { PrismaClient } from "@prisma/client"
import { NextRequest, NextResponse } from "next/server"

const prisma = new PrismaClient()

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { isActive } = body as { isActive: boolean }
    const realtorId = params.id

    const realtor = await prisma.realtor.update({
      where: { id: realtorId },
      data: { isActive }
    })

    // Return realtor without password
    const { password: _, ...realtorData } = realtor

    return NextResponse.json({
      success: true,
      realtor: realtorData
    })

  } catch (error) {
    console.error("Error updating realtor:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { name, email, password, company, phone } = body as {
      name: string
      email: string
      password: string
      company?: string
      phone?: string
    }
    const realtorId = params.id

    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      )
    }

    // Check if email is already taken by another realtor
    const existingRealtor = await prisma.realtor.findFirst({
      where: {
        email,
        id: { not: realtorId }
      }
    })

    if (existingRealtor) {
      return NextResponse.json(
        { error: "Email is already taken by another realtor" },
        { status: 400 }
      )
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {
      name,
      email,
      company: company || null,
      phone: phone || null
    }

    // Only update password if provided
    if (password && password.trim() !== "") {
      const bcrypt = await import("bcryptjs")
      updateData.password = await bcrypt.hash(password, 12)
    }

    const realtor = await prisma.realtor.update({
      where: { id: realtorId },
      data: updateData
    })

    // Return realtor without password
    const { password: _, ...realtorData } = realtor

    return NextResponse.json({
      success: true,
      realtor: realtorData
    })

  } catch (error) {
    console.error("Error updating realtor:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
