"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useSession } from "next-auth/react"
import Navigation from "components/Navigation"

interface Destination {
  id: string
  name: string
  address: string
  latitude: number
  longitude: number
  category: string
  placeId?: string
  metadata?: any
  tags: string[]
  keywords: string[]
  description?: string
  streetAddress?: string
  postalCode?: string
  city?: string
  province?: string
  country: string
  createdAt: string
  updatedAt: string
}

export default function DestinationDetailsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const destinationId = params.id as string

  const [destination, setDestination] = useState<Destination | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [availableTags, setAvailableTags] = useState<Array<{id: string, name: string, color: string}>>([])
  const [availableKeywords, setAvailableKeywords] = useState<Array<{id: string, name: string, color: string}>>([])
  const [geocodingResult, setGeocodingResult] = useState<any>(null)
  const [geocodingLoading, setGeocodingLoading] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    streetAddress: "",
    postalCode: "",
    city: "",
    province: "",
    country: "ITALY",
    category: "",
    latitude: 0,
    longitude: 0,
    tags: [] as string[],
    keywords: [] as string[],
    description: ""
  })

  // Available categories with icons (sorted alphabetically)
  const categories = [
    { value: "airport", label: "Airport", icon: "✈️" },
    { value: "int_airport", label: "International Airport", icon: "🛫" },
    { value: "attraction", label: "Attraction", icon: "🎯" },
    { value: "beach", label: "Beach", icon: "🏖️" },
    { value: "bus_station", label: "Bus Station", icon: "🚌" },
    { value: "entertainment", label: "Entertainment", icon: "🎭" },
    { value: "hospital", label: "Hospital", icon: "🏥" },
    { value: "hotel", label: "Hotel", icon: "🏨" },
    { value: "museum", label: "Museum", icon: "🏛️" },
    { value: "mountain", label: "Mountain", icon: "⛰️" },
    { value: "other", label: "Other", icon: "📍" },
    { value: "park", label: "Park", icon: "🌳" },
    { value: "restaurant", label: "Restaurant", icon: "🍽️" },
    { value: "rural", label: "Rural", icon: "🌾" },
    { value: "school", label: "School", icon: "🏫" },
    { value: "shopping", label: "Shopping", icon: "🛍️" },
    { value: "train_station", label: "Train Station", icon: "🚂" }
  ]

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
      return
    }

    if (status === "authenticated" && destinationId) {
      fetchDestination()
      fetchAvailableTags()
      fetchAvailableKeywords()
    }
  }, [status, destinationId, router])

  const fetchDestination = async () => {
    try {
      const response = await fetch(`/api/destinations/${destinationId}`)
      
      if (response.ok) {
        const data = await response.json() as { destination: Destination }
        setDestination(data.destination)
        setFormData({
          name: data.destination.name,
          address: data.destination.address,
          streetAddress: data.destination.streetAddress || "",
          postalCode: data.destination.postalCode || "",
          city: data.destination.city || "",
          province: data.destination.province || "",
          country: data.destination.country || "ITALY",
          category: data.destination.category,
          latitude: data.destination.latitude,
          longitude: data.destination.longitude,
          tags: data.destination.tags || [],
          keywords: data.destination.keywords || [],
          description: data.destination.description || ""
        })
      } else {
        setError("Destination not found")
      }
    } catch (error) {
      console.error("Error fetching destination:", error)
      setError("Failed to load destination")
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailableTags = async () => {
    try {
      const response = await fetch("/api/tags")
      if (response.ok) {
        const data = await response.json() as { tags: Array<{id: string, name: string, color: string}> }
        setAvailableTags(data.tags)
      }
    } catch (error) {
      console.error("Error fetching tags:", error)
    }
  }

  const fetchAvailableKeywords = async () => {
    try {
      const response = await fetch("/api/admin/keywords")
      if (response.ok) {
        const data = await response.json() as { keywords: Array<{id: string, name: string, color: string}> }
        setAvailableKeywords(data.keywords)
      }
    } catch (error) {
      console.error("Error fetching keywords:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError("")

    try {
      const response = await fetch(`/api/destinations/${destinationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json() as { error?: string }

      if (response.ok) {
        // Update local state
        setDestination(prev => prev ? { ...prev, ...formData } : null)
        setError("")
        // Show success message or redirect
        alert("Destination updated successfully!")
      } else {
        setError(data.error || "Failed to update destination")
      }
    } catch (error) {
      setError("Failed to update destination")
    } finally {
      setSaving(false)
    }
  }

  const handleTagToggle = (tagName: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tagName) 
        ? prev.tags.filter(tag => tag !== tagName)
        : [...prev.tags, tagName]
    }))
  }

  const handleKeywordToggle = (keywordName: string) => {
    setFormData(prev => ({
      ...prev,
      keywords: prev.keywords.includes(keywordName) 
        ? prev.keywords.filter(keyword => keyword !== keywordName)
        : [...prev.keywords, keywordName]
    }))
  }


  const getTagColor = (tagName: string) => {
    const tag = availableTags.find(t => t.name === tagName)
    return tag?.color || '#D3BFA4'
  }

  const getCategoryLabel = (category: string) => {
    const categoryInfo = categories.find(c => c.value === category)
    return categoryInfo?.label || category
  }

  const parseExistingAddress = () => {
    if (!destination?.address) return

    const address = destination.address
    const parts = address.split(',').map(part => part.trim())

    // Enhanced parsing logic for Italian addresses
    let streetAddress = ""
    let postalCode = ""
    let city = ""
    let province = ""
    let country = ""

    if (parts.length >= 2) {
      // First part is street address (e.g., "Via Cimarelli, 2")
      streetAddress = parts[0] || ""
      
      // Last part is country
      country = parts[parts.length - 1] || ""
      
      // Look for postal code pattern (5 digits)
      const postalCodeMatch = parts.find(part => /^\d{5}$/.test(part))
      if (postalCodeMatch) {
        postalCode = postalCodeMatch
      }
      
      // Look for province pattern (2-3 uppercase letters)
      const provinceMatch = parts.find(part => /^[A-Z]{2,3}$/.test(part))
      if (provinceMatch) {
        province = provinceMatch
      }
      
      // For the city, we need to find the part that contains both postal code and city
      // Format is usually "60013 Corinaldo AN" or "60013 Corinaldo"
      const cityPart = parts.find(part => {
        // Look for a part that contains a postal code followed by a city name
        return /^\d{5}\s+[A-Za-z\s]+$/.test(part) || 
               // Or a part that's just a city name (no postal code)
               (/^[A-Za-z\s]+$/.test(part) && !/^\d+$/.test(part) && part !== country)
      })
      
      if (cityPart) {
        // If it contains postal code and city, extract just the city
        if (/^\d{5}\s+[A-Za-z\s]+$/.test(cityPart)) {
          // Extract city name after postal code
          const cityMatch = cityPart.match(/^\d{5}\s+(.+)$/)
          if (cityMatch && cityMatch[1]) {
            city = cityMatch[1].trim()
          }
        } else {
          // It's just a city name
          city = cityPart
        }
      }
    }

    setFormData(prev => ({
      ...prev,
      streetAddress,
      postalCode,
      city,
      province,
      country
    }))
  }

  const handleGeocode = async () => {
    if (!formData.streetAddress.trim() && !formData.city.trim()) {
      setError("Please enter at least a street address or city")
      return
    }

    setGeocodingLoading(true)
    setError("")

    try {
      // Build address from components
      const addressParts = [
        formData.streetAddress,
        formData.postalCode,
        formData.city,
        formData.province,
        formData.country
      ].filter(part => part && part.trim())

      const fullAddress = addressParts.join(", ")

      const response = await fetch("/api/geocoding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ address: fullAddress }),
      })

      const data = await response.json() as { result?: any, error?: string }

      if (response.ok) {
        setGeocodingResult(data.result)
        if (data.result?.geometry?.location) {
          setFormData(prev => ({
            ...prev,
            latitude: data.result.geometry.location.lat,
            longitude: data.result.geometry.location.lng,
            address: data.result.formatted_address || fullAddress
          }))
        }
      } else {
        setError(data.error || "Geocoding failed")
      }
    } catch (error) {
      setError("Geocoding failed")
    } finally {
      setGeocodingLoading(false)
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading destination...</p>
        </div>
      </div>
    )
  }

  if (status === "unauthenticated") {
    return null
  }

  if (!destination) {
    return (
      <div className="min-h-screen bg-ponte-cream">
        <Navigation />
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-ponte-black">Destination Not Found</h1>
            <p className="mt-2 text-ponte-olive">The destination you're looking for doesn't exist.</p>
            <button
              onClick={() => router.push("/destinations")}
              className="mt-4 px-4 py-2 bg-ponte-terracotta text-white rounded-md hover:bg-accent-600"
            >
              Back to Destinations
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-ponte-cream">
      <Navigation />
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-ponte-black">{destination.name}</h1>
              <p className="mt-2 text-ponte-olive">Edit destination details and keywords</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-ponte-sand text-ponte-black">
                {getCategoryLabel(destination.category)}
              </span>
              <button
                onClick={() => router.push("/destinations")}
                className="px-4 py-2 bg-ponte-olive text-white rounded-md hover:bg-ponte-black transition-colors font-body"
              >
                ← Back to Destinations
              </button>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow p-6 border border-ponte-sand">
            <h2 className="text-xl font-semibold text-ponte-black mb-6">Basic Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-ponte-black mb-2">
                  Destination Name *
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-md border-ponte-sand shadow-sm focus:border-ponte-terracotta focus:ring-ponte-terracotta"
                  required
                />
              </div>

              <div>
                <label htmlFor="category" className="block text-sm font-medium text-ponte-black mb-2">
                  Category *
                </label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full rounded-md border-ponte-sand shadow-sm focus:border-ponte-terracotta focus:ring-ponte-terracotta"
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map(category => (
                    <option key={category.value} value={category.value}>
                      {category.icon} {category.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-6">
              <label htmlFor="address" className="block text-sm font-medium text-ponte-black mb-2">
                Full Address *
              </label>
              <input
                type="text"
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full rounded-md border-ponte-sand shadow-sm focus:border-ponte-terracotta focus:ring-ponte-terracotta"
                required
              />
            </div>

            <div className="mt-6">
              <label htmlFor="description" className="block text-sm font-medium text-ponte-black mb-2">
                Description
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full rounded-md border-ponte-sand shadow-sm focus:border-ponte-terracotta focus:ring-ponte-terracotta"
                placeholder="Describe this destination in detail..."
              />
            </div>

            {/* GPS Coordinates */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="latitude" className="block text-sm font-medium text-ponte-black mb-2">
                  Latitude
                </label>
                <input
                  type="number"
                  id="latitude"
                  value={formData.latitude}
                  onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) || 0 })}
                  step="any"
                  className="w-full rounded-md border-ponte-sand shadow-sm focus:border-ponte-terracotta focus:ring-ponte-terracotta"
                />
              </div>
              <div>
                <label htmlFor="longitude" className="block text-sm font-medium text-ponte-black mb-2">
                  Longitude
                </label>
                <input
                  type="number"
                  id="longitude"
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) || 0 })}
                  step="any"
                  className="w-full rounded-md border-ponte-sand shadow-sm focus:border-ponte-terracotta focus:ring-ponte-terracotta"
                />
              </div>
            </div>

            {/* Geocoding Section */}
            <div className="mt-6 p-4 bg-ponte-sand rounded-md">
              <h3 className="text-lg font-medium text-ponte-black mb-4">Address & GPS Tools</h3>
              
              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  type="button"
                  onClick={parseExistingAddress}
                  className="px-4 py-2 bg-ponte-olive text-white rounded-md hover:bg-accent-600 text-sm"
                >
                  Parse Current Address
                </button>
                <button
                  type="button"
                  onClick={handleGeocode}
                  disabled={geocodingLoading}
                  className="px-4 py-2 bg-ponte-terracotta text-white rounded-md hover:bg-accent-600 disabled:opacity-50 text-sm"
                >
                  {geocodingLoading ? "Getting GPS..." : "Get GPS from Address"}
                </button>
              </div>

              {geocodingResult && (
                <div className="mt-4 p-3 bg-white rounded border">
                  <h4 className="font-medium text-ponte-black mb-2">Geocoding Result:</h4>
                  <p className="text-sm text-ponte-olive">{geocodingResult.formatted_address}</p>
                  <p className="text-xs text-ponte-olive mt-1">
                    Lat: {geocodingResult.geometry?.location?.lat}, 
                    Lng: {geocodingResult.geometry?.location?.lng}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Keywords Section */}
          <div className="bg-white rounded-lg shadow p-6 border border-ponte-sand">
            <h2 className="text-xl font-semibold text-ponte-black mb-6">Keywords & Features</h2>
            <p className="text-sm text-ponte-olive mb-4">
              Add descriptive keywords that help clients understand what makes this destination special.
              Examples: "family friendly", "great sand", "romantic sunset", "wheelchair accessible"
            </p>
            
            <div className="flex flex-wrap gap-2">
              {availableKeywords.map((keyword) => (
                <button
                  key={keyword.id}
                  type="button"
                  onClick={() => handleKeywordToggle(keyword.name)}
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
                    formData.keywords.includes(keyword.name)
                      ? 'bg-ponte-olive text-white border-ponte-olive'
                      : 'bg-white text-ponte-black border-ponte-sand hover:bg-ponte-sand'
                  }`}
                  style={{ 
                    backgroundColor: formData.keywords.includes(keyword.name) ? keyword.color : undefined,
                    borderColor: formData.keywords.includes(keyword.name) ? keyword.color : undefined
                  }}
                >
                  {keyword.name}
                </button>
              ))}
            </div>
            {availableKeywords.length === 0 && (
              <p className="text-sm text-ponte-olive">No keywords available. Create keywords in Settings.</p>
            )}
          </div>

          {/* Tags Section */}
          <div className="bg-white rounded-lg shadow p-6 border border-ponte-sand">
            <h2 className="text-xl font-semibold text-ponte-black mb-6">Tags</h2>
            <div className="flex flex-wrap gap-2">
              {availableTags.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => handleTagToggle(tag.name)}
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
                    formData.tags.includes(tag.name)
                      ? 'bg-ponte-terracotta text-white border-ponte-terracotta'
                      : 'bg-white text-ponte-black border-ponte-sand hover:bg-ponte-sand'
                  }`}
                  style={{ 
                    backgroundColor: formData.tags.includes(tag.name) ? tag.color : undefined,
                    borderColor: formData.tags.includes(tag.name) ? tag.color : undefined
                  }}
                >
                  {tag.name}
                </button>
              ))}
            </div>
            {availableTags.length === 0 && (
              <p className="text-sm text-ponte-olive">No tags available. Create tags in Settings.</p>
            )}
          </div>

          {/* Address Details */}
          <div className="bg-white rounded-lg shadow p-6 border border-ponte-sand">
            <h2 className="text-xl font-semibold text-ponte-black mb-6">Address Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="streetAddress" className="block text-sm font-medium text-ponte-black mb-2">
                  Street Address
                </label>
                <input
                  type="text"
                  id="streetAddress"
                  value={formData.streetAddress}
                  onChange={(e) => setFormData({ ...formData, streetAddress: e.target.value })}
                  className="w-full rounded-md border-ponte-sand shadow-sm focus:border-ponte-terracotta focus:ring-ponte-terracotta"
                  placeholder="e.g., 123 Main Street or PO Box 456"
                />
              </div>

              <div>
                <label htmlFor="postalCode" className="block text-sm font-medium text-ponte-black mb-2">
                  Postal Code
                </label>
                <input
                  type="text"
                  id="postalCode"
                  value={formData.postalCode}
                  onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                  className="w-full rounded-md border-ponte-sand shadow-sm focus:border-ponte-terracotta focus:ring-ponte-terracotta"
                  placeholder="e.g., 00185"
                />
              </div>

              <div>
                <label htmlFor="city" className="block text-sm font-medium text-ponte-black mb-2">
                  City
                </label>
                <input
                  type="text"
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full rounded-md border-ponte-sand shadow-sm focus:border-ponte-terracotta focus:ring-ponte-terracotta"
                  placeholder="e.g., Roma"
                />
              </div>

              <div>
                <label htmlFor="province" className="block text-sm font-medium text-ponte-black mb-2">
                  Province
                </label>
                <input
                  type="text"
                  id="province"
                  value={formData.province}
                  onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                  className="w-full rounded-md border-ponte-sand shadow-sm focus:border-ponte-terracotta focus:ring-ponte-terracotta"
                  placeholder="e.g., RM"
                />
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.push("/destinations")}
              className="px-6 py-2 border border-ponte-sand text-ponte-black rounded-md hover:bg-ponte-sand"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-ponte-terracotta text-white rounded-md hover:bg-accent-600 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
