"use client"

import Image from "next/image"
import { useRef, useState } from "react"

interface FileInfo {
  url: string
  originalName: string
  storageName: string
  size: number
  type: string
}

interface PropertyFileManagerProps {
  propertyId: string
  propertyPhotos: FileInfo[] | string[] // Support both old and new format
  documents: FileInfo[] | string[] // Combined: floorPlans + dronePhotos + energyCertificate
  onPropertyPhotosChange: (photos: FileInfo[] | string[]) => void
  onDocumentsChange: (documents: FileInfo[] | string[]) => void
  virtualTourLink?: string
  onVirtualTourLinkChange?: (link: string) => void
  featuredImage?: string
  onFeaturedImageChange?: (imageUrl: string) => void
}

export default function PropertyFileManager({
  propertyId,
  propertyPhotos,
  documents,
  onPropertyPhotosChange,
  onDocumentsChange,
  virtualTourLink,
  onVirtualTourLinkChange,
  featuredImage,
  onFeaturedImageChange
}: PropertyFileManagerProps) {
  const [uploading, setUploading] = useState(false)
  const [showSlideshow, setShowSlideshow] = useState(false)
  const [currentSlide, setCurrentSlide] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Helper functions to handle both old and new file formats
  const getFileUrl = (file: FileInfo | string): string => {
    return typeof file === 'string' ? file : file.url
  }

  const getFileName = (file: FileInfo | string): string => {
    if (typeof file === 'string') {
      return file.split('/').pop() || 'Unknown file'
    }
    return file.originalName
  }

  const getFileIcon = (file: FileInfo | string) => {
    const filename = getFileName(file)
    const extension = filename.split('.').pop()?.toLowerCase()
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) {
      return '🖼️'
    } else if (['pdf'].includes(extension || '')) {
      return '📄'
    } else if (['doc', 'docx'].includes(extension || '')) {
      return '📝'
    } else {
      return '📎'
    }
  }

  // Function to detect if a file is an image
  const isImageFile = (file: File): boolean => {
    return file.type.startsWith('image/')
  }

  // Function to categorize files automatically
  const categorizeFiles = (files: FileList) => {
    const imageFiles: File[] = []
    const documentFiles: File[] = []
    
    Array.from(files).forEach(file => {
      if (isImageFile(file)) {
        imageFiles.push(file)
      } else {
        documentFiles.push(file)
      }
    })
    
    return { imageFiles, documentFiles }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    try {
      // Categorize files automatically
      const { imageFiles, documentFiles } = categorizeFiles(files)
      
      // Upload images if any
      if (imageFiles.length > 0) {
        const imageFormData = new FormData()
        imageFiles.forEach(file => {
          imageFormData.append('files', file)
        })
        imageFormData.append('type', 'propertyPhotos')

        const imageResponse = await fetch(`/api/properties/${propertyId}/files`, {
          method: 'POST',
          body: imageFormData
        })

        if (imageResponse.ok) {
          const imageData = await imageResponse.json() as { files: unknown[] }
          onPropertyPhotosChange([...propertyPhotos, ...imageData.files])
        }
      }
      
      // Upload documents if any
      if (documentFiles.length > 0) {
        const documentFormData = new FormData()
        documentFiles.forEach(file => {
          documentFormData.append('files', file)
        })
        documentFormData.append('type', 'documents')

        const documentResponse = await fetch(`/api/properties/${propertyId}/files`, {
          method: 'POST',
          body: documentFormData
        })

        if (documentResponse.ok) {
          const documentData = await documentResponse.json() as { files: unknown[] }
          onDocumentsChange([...documents, ...documentData.files] as FileInfo[])
        }
      }
      
      // Show success message
      const totalFiles = imageFiles.length + documentFiles.length
      if (totalFiles > 0) {
        console.log(`Successfully uploaded ${totalFiles} files`)
      }
    } catch (error) {
      console.error('Error uploading files:', error)
      alert('Failed to upload files')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDeleteFile = async (fileUrl: string, type: string) => {
    try {
      const response = await fetch(`/api/properties/${propertyId}/files`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileUrl, type })
      })

      if (response.ok) {
        // Remove from appropriate array
        switch (type) {
          case 'propertyPhotos':
            const filteredPhotos: unknown[] = []
            for (const file of propertyPhotos) {
              if (getFileUrl(file) !== fileUrl) {
                filteredPhotos.push(file)
              }
            }
            onPropertyPhotosChange(filteredPhotos as FileInfo[])
            break
          case 'documents':
            const filteredDocs: unknown[] = []
            for (const file of documents) {
              if (getFileUrl(file) !== fileUrl) {
                filteredDocs.push(file)
              }
            }
            onDocumentsChange(filteredDocs as FileInfo[])
            break
        }
      } else {
        alert('Failed to delete file')
      }
    } catch (error) {
      console.error('Error deleting file:', error)
      alert('Failed to delete file')
    }
  }




  const _getCurrentFilesCount = () => {
    return propertyPhotos.length + documents.length
  }

  return (
    <div className="space-y-6">
      {/* Upload Controls */}
      <div className="bg-ponte-sand/30 rounded-lg p-4">
        <div className="flex flex-wrap gap-4 items-center">
          
          <div className="flex-1">
            <label className="block text-sm font-medium text-ponte-black font-body mb-2">
              Upload Files (Images & Documents)
            </label>
            <p className="text-sm text-ponte-olive mb-2">
              Images will be added to Property Photos, other files will be added to Documents
            </p>
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="*/*"
                onChange={handleFileUpload}
                className="flex-1 border-ponte-sand rounded-md shadow-sm focus:ring-ponte-terracotta focus:border-ponte-terracotta font-body"
                disabled={uploading}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="px-4 py-2 bg-ponte-terracotta text-white rounded-md hover:bg-ponte-terracotta/80 disabled:opacity-50 font-body"
              >
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Virtual Tour Link */}
      {onVirtualTourLinkChange && (
        <div>
          <label className="block text-sm font-medium text-ponte-black font-body mb-2">
            Virtual Tour Link
          </label>
          <input
            type="url"
            value={virtualTourLink || ""}
            onChange={(e) => onVirtualTourLinkChange(e.target.value)}
            className="w-full border-ponte-sand rounded-md shadow-sm focus:ring-ponte-terracotta focus:border-ponte-terracotta font-body"
            placeholder="https://..."
          />
        </div>
      )}

      {/* File Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Property Photos */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-ponte-black font-header">
              Property Photos ({propertyPhotos.length})
            </h3>
            {propertyPhotos.length > 0 && onFeaturedImageChange && (
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-ponte-black font-body">
                  Featured:
                </label>
                <select
                  value={featuredImage || ""}
                  onChange={(e) => onFeaturedImageChange(e.target.value)}
                  className="text-sm border-ponte-sand rounded-md shadow-sm focus:ring-ponte-terracotta focus:border-ponte-terracotta font-body"
                >
                  <option value="">Select featured image</option>
                  {propertyPhotos.map((file, index) => (
                    <option key={index} value={getFileUrl(file)}>
                      {getFileName(file)}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          {propertyPhotos.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {propertyPhotos.map((file, index) => {
                const url = getFileUrl(file)
                const fileName = getFileName(file)
                return (
                  <div key={index} className="relative group">
                    <Image
                      src={url}
                      alt={fileName}
                      width={96}
                      height={96}
                      className={`w-full h-24 object-contain rounded border cursor-pointer bg-white ${
                        featuredImage === url ? 'ring-2 ring-ponte-terracotta' : ''
                      }`}
                      onClick={() => {
                        setCurrentSlide(index)
                        setShowSlideshow(true)
                      }}
                    />
                    {featuredImage === url && (
                      <div className="absolute top-1 left-1 bg-ponte-terracotta text-white text-xs px-1 py-0.5 rounded">
                        Featured
                      </div>
                    )}
                    <div className="absolute -top-2 -right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          const link = document.createElement('a')
                          link.href = url
                          link.download = fileName
                          link.target = '_blank'
                          document.body.appendChild(link)
                          link.click()
                          document.body.removeChild(link)
                        }}
                        className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-blue-600"
                        title="Download"
                      >
                        📥
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteFile(url, 'propertyPhotos')
                        }}
                        className="bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                        title="Delete"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-ponte-olive font-body">No property photos uploaded</p>
          )}
        </div>

        {/* Documents */}
        <div>
          <h3 className="text-lg font-semibold text-ponte-black mb-3 font-header">
            Documents ({documents.length})
          </h3>
          {documents.length > 0 ? (
            <div className="space-y-2">
              {documents.map((file, index) => {
                const url = getFileUrl(file)
                const fileName = getFileName(file)
                return (
                  <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                    <div className="flex items-center space-x-2">
                      <span>{getFileIcon(file)}</span>
                      <span className="text-sm font-body">{fileName}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          const link = document.createElement('a')
                          link.href = url
                          link.download = fileName
                          link.target = '_blank'
                          document.body.appendChild(link)
                          link.click()
                          document.body.removeChild(link)
                        }}
                        className="text-blue-500 hover:text-blue-700 text-sm px-2 py-1 rounded border border-blue-500 hover:bg-blue-50"
                      >
                        📥 Download
                      </button>
                      <button
                        onClick={() => handleDeleteFile(url, 'documents')}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-ponte-olive font-body">No documents uploaded</p>
          )}
        </div>
      </div>

      {/* Slideshow Modal */}
      {showSlideshow && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={() => setShowSlideshow(false)}
              className="absolute -top-10 right-0 text-white text-2xl hover:text-gray-300"
            >
              ×
            </button>
            <Image
              src={getFileUrl(propertyPhotos[currentSlide]!)}
              alt={getFileName(propertyPhotos[currentSlide]!)}
              width={800}
              height={600}
              className="max-w-full max-h-full object-contain"
            />
            {propertyPhotos.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                <button
                  onClick={() => setCurrentSlide(prev => prev > 0 ? prev - 1 : propertyPhotos.length - 1)}
                  className="px-3 py-1 bg-white bg-opacity-75 rounded text-black"
                >
                  ←
                </button>
                <span className="px-3 py-1 bg-white bg-opacity-75 rounded text-black">
                  {currentSlide + 1} / {propertyPhotos.length}
                </span>
                <button
                  onClick={() => setCurrentSlide(prev => prev < propertyPhotos.length - 1 ? prev + 1 : 0)}
                  className="px-3 py-1 bg-white bg-opacity-75 rounded text-black"
                >
                  →
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
