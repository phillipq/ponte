import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"
import { NextRequest, NextResponse } from "next/server"

const prisma = new PrismaClient()

export async function GET() {
  try {
    const partners = await prisma.partner.findMany({
      include: {
        _count: {
          select: {
            properties: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    return NextResponse.json({
      success: true,
      partners
    })

  } catch (error) {
    console.error("Error fetching partners:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, company, phone } = await request.json()

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      )
    }

    // Check if partner already exists
    const existingPartner = await prisma.partner.findUnique({
      where: { email }
    })

    if (existingPartner) {
      return NextResponse.json(
        { error: "Partner with this email already exists" },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create partner
    const partner = await prisma.partner.create({
      data: {
        name,
        email,
        password: hashedPassword,
        company: company || null,
        phone: phone || null
      }
    })

    // Return partner without password
    const { password: _, ...partnerData } = partner

    return NextResponse.json({
      success: true,
      partner: partnerData
    })

  } catch (error) {
    console.error("Error creating partner:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
