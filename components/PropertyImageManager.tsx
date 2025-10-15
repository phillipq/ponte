"use client"

import Image from "next/image"
import { useEffect, useRef, useState } from "react"

interface PropertyImageManagerProps {
  propertyId: string
  images: string[]
  onImagesChange: (images: string[]) => void
  googleDriveLink?: string
  onGoogleDriveLinkChange: (link: string) => void
  featuredImage?: string
  onFeaturedImageChange?: (imageUrl: string) => void
}

export default function PropertyImageManager({
  propertyId,
  images,
  onImagesChange,
  googleDriveLink,
  onGoogleDriveLinkChange,
  featuredImage,
  onFeaturedImageChange
}: PropertyImageManagerProps) {
  const [uploading, setUploading] = useState(false)
  const [showSlideshow, setShowSlideshow] = useState(false)
  const [currentSlide, setCurrentSlide] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    try {
      const formData = new FormData()
      Array.from(files).forEach(file => {
        formData.append('images', file)
      })

      const response = await fetch(`/api/properties/${propertyId}/images`, {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const data = await response.json() as { images: string[] }
        onImagesChange([...images, ...data.images])
      } else {
        alert('Failed to upload images')
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload images')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDeleteImage = async (imageUrl: string) => {
    if (!confirm('Are you sure you want to delete this image?')) return

    try {
      const response = await fetch(`/api/properties/${propertyId}/images`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl })
      })

      if (response.ok) {
        onImagesChange(images.filter(img => img !== imageUrl))
      } else {
        alert('Failed to delete image')
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('Failed to delete image')
    }
  }

  const openSlideshow = (index: number) => {
    setCurrentSlide(index)
    setShowSlideshow(true)
  }

  const closeSlideshow = () => {
    setShowSlideshow(false)
  }

  // Handle keyboard events for slideshow
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!showSlideshow) return
      
      switch (event.key) {
        case 'Escape':
          closeSlideshow()
          break
        case 'ArrowLeft':
          if (images.length > 1) prevSlide()
          break
        case 'ArrowRight':
          if (images.length > 1) nextSlide()
          break
      }
    }

    if (showSlideshow) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [showSlideshow, images.length])

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % images.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + images.length) % images.length)
  }

  return (
    <div className="space-y-4">
      {/* Google Drive Link */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Google Drive / Dropbox Link
        </label>
        <input
          type="url"
          value={googleDriveLink || ""}
          onChange={(e) => onGoogleDriveLinkChange(e.target.value)}
          className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          placeholder="https://drive.google.com/..."
        />
      </div>

      {/* Upload Section */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Upload Images
        </label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            {uploading ? "Uploading..." : "Choose Images"}
          </button>
          <p className="text-xs text-gray-500 mt-2">
            Select multiple images (max 10MB each)
          </p>
        </div>
      </div>

      {/* Images Grid */}
      {images.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-sm font-medium text-gray-700">
              Property Images ({images.length})
            </h4>
            <button
              onClick={() => openSlideshow(0)}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              View Slideshow
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((imageUrl, index) => (
              <div key={index} className="relative group">
                <div className="aspect-square overflow-hidden rounded-lg border-2 border-ponte-sand">
                  <Image
                    src={imageUrl}
                    alt={`Property image ${index + 1}`}
                    width={200}
                    height={200}
                    className="w-full h-full object-contain cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => openSlideshow(index)}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                </div>
                
                {/* Featured image indicator */}
                {featuredImage === imageUrl && (
                  <div className="absolute top-2 left-2 bg-ponte-terracotta text-white text-xs px-2 py-1 rounded-full font-medium">
                    Featured
                  </div>
                )}
                
                {/* Action buttons */}
                <div className="absolute top-2 right-2 flex gap-1">
                  {onFeaturedImageChange && (
                    <button
                      onClick={() => onFeaturedImageChange(imageUrl)}
                      className={`p-1 rounded-full text-xs font-medium transition-colors ${
                        featuredImage === imageUrl
                          ? 'bg-ponte-terracotta text-white'
                          : 'bg-white text-ponte-black hover:bg-ponte-sand'
                      }`}
                      title={featuredImage === imageUrl ? 'Remove as featured' : 'Set as featured'}
                    >
                      ⭐
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteImage(imageUrl)}
                    className="p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    title="Delete image"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Slideshow Modal */}
      {showSlideshow && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          onClick={closeSlideshow}
        >
          <div 
            className="relative max-w-4xl max-h-full p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeSlideshow}
              className="absolute top-4 right-4 bg-red-500 hover:bg-red-600 text-white text-xl font-bold w-8 h-8 rounded-full flex items-center justify-center z-20 transition-colors"
              title="Close slideshow"
            >
              ×
            </button>
            
            <div className="relative">
              <Image
                src={images[currentSlide]}
                alt={`Property image ${currentSlide + 1}`}
                width={800}
                height={600}
                className="max-w-full max-h-[80vh] object-contain rounded"
              />
              
              {images.length > 1 && (
                <>
                  <button
                    onClick={prevSlide}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75"
                  >
                    ‹
                  </button>
                  <button
                    onClick={nextSlide}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75"
                  >
                    ›
                  </button>
                </>
              )}
            </div>
            
            <div className="text-center text-white mt-4">
              <p className="text-sm mb-2">
                {currentSlide + 1} of {images.length}
              </p>
              <button
                onClick={closeSlideshow}
                className="bg-ponte-terracotta hover:bg-accent-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Close Slideshow
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
