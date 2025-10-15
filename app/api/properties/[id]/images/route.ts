import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { existsSync } from "fs"
import { mkdir, writeFile } from "fs/promises"
import { join } from "path"
import { authOptions } from "lib/auth"
import { prisma } from "lib/prisma"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    
    // Verify the user owns this property
    const property = await prisma.property.findFirst({
      where: {
        id: id,
        userId: (session.user as { id: string }).id
      }
    })

    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 })
    }

    const formData = await request.formData()
    const files = formData.getAll('images') as File[]
    
    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No images provided" }, { status: 400 })
    }

    const uploadedImages = []
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'properties', id)
    
    // Create upload directory if it doesn't exist
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    for (const file of files) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        continue // Skip non-image files
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        continue // Skip files that are too large
      }

      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      
      // Generate unique filename
      const timestamp = Date.now()
      const randomString = Math.random().toString(36).substring(2, 15)
      const extension = file.name.split('.').pop() || 'jpg'
      const filename = `${timestamp}_${randomString}.${extension}`
      
      const filepath = join(uploadDir, filename)
      await writeFile(filepath, buffer)
      
      // Create public URL
      const imageUrl = `/uploads/properties/${id}/${filename}`
      uploadedImages.push(imageUrl)
    }

    if (uploadedImages.length === 0) {
      return NextResponse.json({ error: "No valid images uploaded" }, { status: 400 })
    }

    // Update property with new images
    const currentImages = property.propertyPhotos || []
    const updatedImages = [...currentImages, ...uploadedImages]
    
    await prisma.property.update({
      where: { id: id },
      data: { propertyPhotos: updatedImages }
    })

    return NextResponse.json({ 
      success: true, 
      images: uploadedImages,
      message: `${uploadedImages.length} image(s) uploaded successfully`
    })
  } catch (error) {
    console.error("Error uploading images:", error)
    return NextResponse.json({ error: "Failed to upload images" }, { status: 500 })
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
    const { imageUrl } = await request.json()
    
    // Verify the user owns this property
    const property = await prisma.property.findFirst({
      where: {
        id: id,
        userId: (session.user as { id: string }).id
      }
    })

    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 })
    }

    // Remove image from array
    const currentImages = property.propertyPhotos || []
    const updatedImages = currentImages.filter(img => img !== imageUrl)
    
    await prisma.property.update({
      where: { id: id },
      data: { propertyPhotos: updatedImages }
    })

    // TODO: Delete the actual file from filesystem
    // For now, we'll just remove it from the database

    return NextResponse.json({ 
      success: true, 
      message: "Image deleted successfully"
    })
  } catch (error) {
    console.error("Error deleting image:", error)
    return NextResponse.json({ error: "Failed to delete image" }, { status: 500 })
  }
}
