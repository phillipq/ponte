import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"
import { authOptions } from "lib/auth"
import { prisma } from "lib/prisma"

const createTagSchema = z.object({
  name: z.string().min(1, "Tag name is required").max(50, "Tag name must be less than 50 characters"),
  color: z.string().optional()
})

const _updateTagSchema = z.object({
  name: z.string().min(1, "Tag name is required").max(50, "Tag name must be less than 50 characters").optional(),
  color: z.string().optional()
})

// GET /api/tags - Get all tags for the user
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!(session?.user as { id: string })?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // All users can see all tags
    const tags = await prisma.tag.findMany({
      where: {},
      orderBy: { name: 'asc' }
    })

    return NextResponse.json({ tags })
  } catch (error) {
    console.error("Error fetching tags:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST /api/tags - Create a new tag
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!(session?.user as { id: string })?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = (session?.user as { id: string })?.id as string
    const body = await request.json()
    const validatedData = createTagSchema.parse(body)

    // Check if tag name already exists for this user
    const existingTag = await prisma.tag.findFirst({
      where: {
        name: validatedData.name,
        userId: userId
      }
    })

    if (existingTag) {
      return NextResponse.json(
        { error: "A tag with this name already exists" },
        { status: 400 }
      )
    }

    const tag = await prisma.tag.create({
      data: {
        name: validatedData.name,
        color: validatedData.color,
        userId: userId
      }
    })

    return NextResponse.json({ tag }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message || 'Validation error' },
        { status: 400 }
      )
    }
    console.error("Error creating tag:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
