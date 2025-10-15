import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "lib/auth"
import { prisma } from "lib/prisma"
import { STORAGE_BUCKETS, deleteFileFromStorage, getPublicUrl, uploadFileToStorage } from "lib/supabase"

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
    const files = formData.getAll('files') as File[]
    const type = formData.get('type') as string
    
    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 })
    }

    if (!type || !['propertyPhotos', 'documents'].includes(type)) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 })
    }

    const uploadedFiles = []
    
    // Determine storage bucket based on file type
    const bucket = type === 'propertyPhotos' ? STORAGE_BUCKETS.PROPERTY_PHOTOS : STORAGE_BUCKETS.DOCUMENTS

    for (const file of files) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        continue // Skip files that are too large
      }

      // Validate file type based on upload type
      if (type === 'propertyPhotos') {
        if (!file.type.startsWith('image/')) {
          continue // Skip non-image files for photo types
        }
      }

      // Generate unique filename for storage
      const timestamp = Date.now()
      const randomString = Math.random().toString(36).substring(2, 15)
      const extension = file.name.split('.').pop() || (type === 'propertyPhotos' ? 'jpg' : 'pdf')
      const storageFilename = `${timestamp}_${randomString}.${extension}`
      
      // Create file path in storage
      const filePath = `properties/${id}/${storageFilename}`
      
      // Upload to Supabase storage
      const { data: _uploadData, error: uploadError } = await uploadFileToStorage(bucket, filePath, file)
      
      if (uploadError) {
        console.error('Error uploading file to Supabase:', uploadError)
        continue // Skip this file if upload fails
      }
      
      // Get public URL
      const publicUrl = getPublicUrl(bucket, filePath)
      
      // Store file info with original name
      const fileInfo = {
        url: publicUrl,
        originalName: file.name,
        storageName: storageFilename,
        size: file.size,
        type: file.type
      }
      
      uploadedFiles.push(fileInfo)
    }

    if (uploadedFiles.length === 0) {
      return NextResponse.json({ error: "No valid files uploaded" }, { status: 400 })
    }

    // Update property with new files
    let currentFiles: unknown[] = []
    const updateData: Record<string, unknown> = {}
    
    if (type === 'propertyPhotos') {
      currentFiles = property.propertyPhotos || []
      updateData.propertyPhotos = [...currentFiles, ...uploadedFiles]
    } else if (type === 'documents') {
      // For documents, we need to update the combined documents field
      // We'll store all documents in a single field for now
      currentFiles = property.floorPlans || []
      updateData.floorPlans = [...currentFiles, ...uploadedFiles]
    }
    
    await prisma.property.update({
      where: { id: id },
      data: updateData
    })

    return NextResponse.json({ 
      success: true, 
      files: uploadedFiles,
      message: `${uploadedFiles.length} file(s) uploaded successfully`
    })
  } catch (error) {
    console.error("Error uploading files:", error)
    return NextResponse.json({ error: "Failed to upload files" }, { status: 500 })
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
    const { fileUrl, type } = await request.json() as { fileUrl: string; type: string }
    
    if (!type || !['propertyPhotos', 'documents'].includes(type)) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 })
    }
    
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

    // Remove file from array
    let currentFiles: string[] = []
    const updateData: Record<string, unknown> = {}
    
    if (type === 'propertyPhotos') {
      currentFiles = property.propertyPhotos || []
      updateData.propertyPhotos = currentFiles.filter(file => file !== fileUrl)
    } else if (type === 'documents') {
      currentFiles = property.floorPlans || []
      updateData.floorPlans = currentFiles.filter(file => file !== fileUrl)
    }
    
    await prisma.property.update({
      where: { id: id },
      data: updateData
    })

    // Delete the actual file from Supabase storage
    try {
      // Extract file path from URL
      const urlParts = fileUrl.split('/')
      const _bucket = urlParts[urlParts.length - 3] // Get bucket from URL
      const filename = urlParts[urlParts.length - 1] // Get filename from URL
      const filePath = `properties/${id}/${filename}`
      
      // Determine which bucket to delete from
      const storageBucket = type === 'propertyPhotos' ? STORAGE_BUCKETS.PROPERTY_PHOTOS : STORAGE_BUCKETS.DOCUMENTS
      
      const { error: deleteError } = await deleteFileFromStorage(storageBucket, filePath)
      if (deleteError) {
        console.error("Error deleting file from Supabase storage:", deleteError)
        // Don't fail the request if file deletion fails
      }
    } catch (fileError) {
      console.error("Error deleting file from storage:", fileError)
      // Don't fail the request if file deletion fails
    }

    return NextResponse.json({ 
      success: true, 
      message: "File deleted successfully"
    })
  } catch (error) {
    console.error("Error deleting file:", error)
    return NextResponse.json({ error: "Failed to delete file" }, { status: 500 })
  }
}
