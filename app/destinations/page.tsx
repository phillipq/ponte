"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import Navigation from "components/Navigation"

interface Destination {
  id: string
  name: string
  address: string
  latitude: number
  longitude: number
  category: string
  placeId?: string
  tags: string[]
  
  // Italian address fields (aligned with Property)
  streetAddress?: string
  postalCode?: string
  city?: string
  province?: string
  country?: string
  
  createdAt: string
  updatedAt: string
}

export default function DestinationsPage() {
  const { data: _session, status } = useSession()
  const router = useRouter()
  const [destinations, setDestinations] = useState<Destination[]>([])
  const [loading, setLoading] = useState(true)
  const [sortField, setSortField] = useState<keyof Destination>("name")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [filterCategory, setFilterCategory] = useState<string>("")
  const [filterTag, setFilterTag] = useState<string>("")
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingDestination, setEditingDestination] = useState<Destination | null>(null)
  const [selectedDestinations, setSelectedDestinations] = useState<string[]>([])
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false)
  const [newDestination, setNewDestination] = useState({
    name: "",
    address: "",
    streetAddress: "",
    postalCode: "",
    city: "",
    province: "",
    country: "",
    category: "",
    latitude: 0,
    longitude: 0,
    tags: [] as string[]
  })
  const [geocodingResult, setGeocodingResult] = useState<{ formatted_address?: string; latitude?: number; longitude?: number; place_id?: string } | null>(null)
  const [geocodingLoading, setGeocodingLoading] = useState(false)
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [availableTags, setAvailableTags] = useState<Array<{id: string, name: string, color: string}>>([])

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

  // Get all unique tags from destinations
  const allTags = Array.from(new Set(destinations.flatMap(d => d.tags))).sort()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
      return
    }

    if (status === "authenticated") {
      fetchDestinations()
      fetchAvailableTags()
    }
  }, [status, router])

  const fetchDestinations = async () => {
    try {
      const response = await fetch("/api/destinations")
      
      if (response.ok) {
        const data = await response.json() as { destinations?: Destination[] }
        setDestinations(data.destinations || [])
      } else {
        console.error("Error fetching destinations")
      }
    } catch (error) {
      console.error("Error fetching destinations:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailableTags = async () => {
    try {
      const response = await fetch("/api/tags")
      
      if (response.ok) {
        const data = await response.json() as { tags?: Array<{id: string, name: string, color: string}> }
        setAvailableTags(data.tags || [])
      } else {
        console.error("Error fetching tags")
      }
    } catch (error) {
      console.error("Error fetching tags:", error)
    }
  }

  const handleSort = (field: keyof Destination) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const sortedDestinations = [...destinations].sort((a, b) => {
    const aValue = a[sortField]
    const bValue = b[sortField]
    
    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortDirection === "asc" 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue)
    }
    
    if (typeof aValue === "number" && typeof bValue === "number") {
      return sortDirection === "asc" ? aValue - bValue : bValue - aValue
    }
    
    return 0
  })

  const normalizeCategory = (category: string) => {
    // Normalize category to handle typos and capitalization
    const normalized = category.toLowerCase().trim()
    
    // Map common variations to correct categories
    const categoryMap: { [key: string]: string } = {
      'international airport': 'int_airport',
      'international airports': 'int_airport',
      'int airport': 'int_airport',
      'int_airport': 'int_airport',
      'airport': 'airport',
      'airports': 'airport',
      'bus station': 'bus_station',
      'bus stations': 'bus_station',
      'bus_station': 'bus_station',
      'train station': 'train_station',
      'train stations': 'train_station',
      'train_station': 'train_station',
      'attraction': 'attraction',
      'attractions': 'attraction',
      'beach': 'beach',
      'beaches': 'beach',
      'entertainment': 'entertainment',
      'hospital': 'hospital',
      'hospitals': 'hospital',
      'hotel': 'hotel',
      'hotels': 'hotel',
      'museum': 'museum',
      'museums': 'museum',
      'mountain': 'mountain',
      'mountains': 'mountain',
      'other': 'other',
      'park': 'park',
      'parks': 'park',
      'restaurant': 'restaurant',
      'restaurants': 'restaurant',
      'school': 'school',
      'schools': 'school',
      'shopping': 'shopping',
      'store': 'shopping',
      'stores': 'shopping',
      'theater': 'entertainment',
      'theatre': 'entertainment',
      'theaters': 'entertainment',
      'theatres': 'entertainment'
    }
    
    return categoryMap[normalized] || normalized // Return normalized value if not found in map
  }

  const filteredDestinations = sortedDestinations.filter(d => {
    // Category filter
    const categoryMatch = !filterCategory || (() => {
      const normalizedDestinationCategory = normalizeCategory(d.category)
      return normalizedDestinationCategory === filterCategory || d.category === filterCategory
    })()
    
    // Tag filter
    const tagMatch = !filterTag || d.tags.includes(filterTag)
    
    return categoryMatch && tagMatch
  })

  const handleSelectDestination = (destinationId: string) => {
    setSelectedDestinations(prev => 
      prev.includes(destinationId) 
        ? prev.filter(id => id !== destinationId)
        : [...prev, destinationId]
    )
  }

  const handleSelectAll = () => {
    if (selectedDestinations.length === filteredDestinations.length) {
      setSelectedDestinations([])
    } else {
      setSelectedDestinations(filteredDestinations.map(d => d.id))
    }
  }

  const handleBulkDelete = async () => {
    if (selectedDestinations.length === 0) return
    
    if (!confirm(`Are you sure you want to delete ${selectedDestinations.length} destination(s)?`)) {
      return
    }

    setBulkDeleteLoading(true)

    try {
      const deletePromises = selectedDestinations.map(id => 
        fetch(`/api/destinations/${id}`, { method: "DELETE" })
      )
      
      const results = await Promise.all(deletePromises)
      const failedDeletes = results.filter(response => !response.ok)
      
      if (failedDeletes.length > 0) {
        alert(`Failed to delete ${failedDeletes.length} destination(s)`)
      } else {
        await fetchDestinations()
        setSelectedDestinations([])
      }
    } catch {
      alert("Failed to delete destinations")
    } finally {
      setBulkDeleteLoading(false)
    }
  }

  const parseExistingAddress = () => {
    if (!editingDestination?.address) return

    const address = editingDestination.address
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

    setNewDestination(prev => ({
      ...prev,
      streetAddress,
      postalCode,
      city,
      province,
      country
    }))
  }

  const _handleGeocode = async () => {
    if (!newDestination.streetAddress.trim() && !newDestination.city.trim()) {
      setError("Please enter at least a street address or city")
      return
    }

    setGeocodingLoading(true)
    setError("")

    try {
      // Build address from components
      const addressParts = [
        newDestination.streetAddress,
        newDestination.postalCode,
        newDestination.city,
        newDestination.province,
        newDestination.country
      ].filter(part => part && part.trim())

      const fullAddress = addressParts.join(", ")

      const response = await fetch("/api/geocoding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ address: fullAddress }),
      })

      const data = await response.json() as { result?: { formatted_address?: string; latitude?: number; longitude?: number; place_id?: string }, error?: string }

      if (response.ok) {
        setGeocodingResult(data.result || null)
        setNewDestination(prev => ({
          ...prev,
          name: prev.name || data.result?.formatted_address || "",
          latitude: data.result?.latitude || 0,
          longitude: data.result?.longitude || 0
        }))
      } else {
        setError(data.error || "Geocoding failed")
      }
    } catch {
      setError("Failed to geocode address")
    } finally {
      setGeocodingLoading(false)
    }
  }

  const handleGeocodeFromGPS = async () => {
    if (!editingDestination) return

    setGeocodingLoading(true)
    setError("")

    try {
      const response = await fetch("/api/geocoding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latlng: `${editingDestination.latitude},${editingDestination.longitude}`
        })
      })

      if (response.ok) {
        const data = await response.json() as unknown
        const address = (data as { result: { formatted_address: string } }).result.formatted_address
        
        // Update the editing destination with the full address in the address field
        setEditingDestination(prev => prev ? {
          ...prev,
          address: address
        } : null)
      } else {
        setError("Failed to geocode address")
      }
    } catch {
      setError("Failed to geocode address")
    } finally {
      setGeocodingLoading(false)
    }
  }

  const handleSubmitDestination = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Only require geocoding for new destinations
    if (!geocodingResult && !editingDestination) {
      setError("Please geocode the address first")
      return
    }

    setSubmitting(true)
    setError("")

    try {
      const isEditing = !!editingDestination
      const url = isEditing ? `/api/destinations/${editingDestination.id}` : "/api/destinations"
      const method = isEditing ? "PUT" : "POST"
      
      // For editing, use existing address if no geocoding was done, otherwise use geocoded address
      const address = geocodingResult?.formatted_address || 
        (isEditing ? editingDestination?.address : 
          [newDestination.streetAddress, newDestination.postalCode, newDestination.city, newDestination.province, newDestination.country]
            .filter(part => part && part.trim())
            .join(", "))
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newDestination.name,
          address: address,
          latitude: newDestination.latitude,
          longitude: newDestination.longitude,
          category: normalizeCategory(newDestination.category) || newDestination.category,
          placeId: geocodingResult?.place_id || editingDestination?.placeId || null,
          tags: newDestination.tags,
          // Include address fields for editing - only send non-empty values
          ...(newDestination.streetAddress && { streetAddress: newDestination.streetAddress }),
          ...(newDestination.postalCode && { postalCode: newDestination.postalCode }),
          ...(newDestination.city && { city: newDestination.city }),
          ...(newDestination.province && { province: newDestination.province }),
          ...(newDestination.country && { country: newDestination.country }),
        }),
      })

      const data = await response.json() as { error?: string }

      if (response.ok) {
        await fetchDestinations()
        resetForm()
      } else {
        setError(data.error || `Failed to ${isEditing ? 'update' : 'add'} destination`)
      }
    } catch {
      setError(`Failed to ${editingDestination ? 'update' : 'add'} destination`)
    } finally {
      setSubmitting(false)
    }
  }

  const handleTagToggle = (tagName: string) => {
    setNewDestination(prev => ({
      ...prev,
      tags: prev.tags.includes(tagName) 
        ? prev.tags.filter(tag => tag !== tagName)
        : [...prev.tags, tagName]
    }))
  }

  const resetForm = () => {
    setShowAddForm(false)
    setEditingDestination(null)
    setNewDestination({ 
      name: "", 
      address: "", 
      streetAddress: "",
      postalCode: "",
      city: "",
      province: "",
      country: "",
      category: "", 
      latitude: 0, 
      longitude: 0,
      tags: []
    })
    setGeocodingResult(null)
    setError("")
  }

  const getTagColor = (tagName: string) => {
    const tag = availableTags.find(t => t.name === tagName)
    return tag?.color || '#D3BFA4' // fallback to sand color
  }

  const getCategoryLabel = (category: string) => {
    const normalized = normalizeCategory(category)
    if (!normalized) return category // fallback to original if not found
    
    const categoryInfo = categories.find(c => c.value === normalized)
    return categoryInfo?.label || category
  }


  // Populate form when editing a destination
  useEffect(() => {
    if (editingDestination) {
      setNewDestination({
        name: editingDestination.name,
        address: editingDestination.address,
        streetAddress: editingDestination.streetAddress || "",
        postalCode: editingDestination.postalCode || "",
        city: editingDestination.city || "",
        province: editingDestination.province || "",
        country: editingDestination.country || "",
        category: editingDestination.category,
        latitude: editingDestination.latitude,
        longitude: editingDestination.longitude,
        tags: editingDestination.tags || []
      })
    }
  }, [editingDestination])

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ponte-terracotta mx-auto"></div>
          <p className="mt-4 text-ponte-olive font-body">Loading Destinations...</p>
        </div>
      </div>
    )
  }

  if (status === "unauthenticated") {
    return null
  }

  return (
    <div className="min-h-screen bg-ponte-cream">
      <Navigation />
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Image 
                src="/logos/icon-destination.png" 
                alt="Destination Icon" 
                width={32}
                height={32}
                className="w-8 h-8 mr-3"
              />
              <div>
                <h1 className="text-3xl font-bold text-ponte-black">Destinations</h1>
                <p className="mt-2 text-ponte-olive">Manage your destinations with categories</p>
              </div>
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-ponte-terracotta hover:bg-accent-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ponte-terracotta"
            >
              Add Destination
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 bg-white p-4 rounded-lg shadow border border-ponte-sand">
          <div className="flex flex-wrap gap-4 items-center">
            <div>
              <label htmlFor="category-filter" className="block text-sm font-medium text-ponte-black mb-1">
                Filter by Category
              </label>
              <select
                id="category-filter"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="block w-full rounded-md border-ponte-sand shadow-sm focus:border-ponte-terracotta focus:ring-ponte-terracotta"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category.value} value={category.value}>{category.icon} {category.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="tag-filter" className="block text-sm font-medium text-ponte-black mb-1">
                Filter by Tag
              </label>
              <select
                id="tag-filter"
                value={filterTag}
                onChange={(e) => setFilterTag(e.target.value)}
                className="block w-full rounded-md border-ponte-sand shadow-sm focus:border-ponte-terracotta focus:ring-ponte-terracotta"
              >
                <option value="">All Tags</option>
                {allTags.map(tag => (
                  <option key={tag} value={tag}>🏷️ {tag}</option>
                ))}
              </select>
            </div>
            <div className="text-sm text-ponte-olive">
              Showing {filteredDestinations.length} of {destinations.length} destinations
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {filteredDestinations.length > 0 && (
          <div className="mb-4 bg-ponte-sand p-4 rounded-lg border border-ponte-sand">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedDestinations.length === filteredDestinations.length && filteredDestinations.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-ponte-sand text-ponte-terracotta focus:ring-ponte-terracotta"
                  />
                  <span className="ml-2 text-sm font-medium text-ponte-black">
                    Select All ({selectedDestinations.length} selected)
                  </span>
                </label>
              </div>
              {selectedDestinations.length > 0 && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-ponte-olive">
                    {selectedDestinations.length} selected
                  </span>
                  <button
                    onClick={handleBulkDelete}
                    disabled={bulkDeleteLoading}
                    className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 disabled:opacity-50"
                  >
                    {bulkDeleteLoading ? "Deleting..." : `Delete ${selectedDestinations.length} Item(s)`}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Destinations Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden border border-ponte-sand">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-ponte-sand">
              <thead className="bg-ponte-sand">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-ponte-black uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectedDestinations.length === filteredDestinations.length && filteredDestinations.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-ponte-sand text-ponte-terracotta focus:ring-ponte-terracotta"
                    />
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-ponte-black uppercase tracking-wider cursor-pointer hover:bg-primary-200"
                    onClick={() => handleSort("name")}
                  >
                    Name {sortField === "name" && (sortDirection === "asc" ? "↑" : "↓")}
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-ponte-black uppercase tracking-wider cursor-pointer hover:bg-primary-200"
                    onClick={() => handleSort("category")}
                  >
                    Category {sortField === "category" && (sortDirection === "asc" ? "↑" : "↓")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-ponte-black uppercase tracking-wider">
                    Tags
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-ponte-black uppercase tracking-wider">
                    Address
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-ponte-black uppercase tracking-wider">
                    Coordinates
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-ponte-black uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-ponte-sand">
                {filteredDestinations.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-ponte-olive">
                      {filterCategory || filterTag ? 
                        `No destinations found with ${filterCategory ? `"${filterCategory}" category` : ''}${filterCategory && filterTag ? ' and ' : ''}${filterTag ? `"${filterTag}" tag` : ''}` : 
                        "No destinations added yet"
                      }
                    </td>
                  </tr>
                ) : (
                  filteredDestinations.map((destination) => (
                    <tr 
                      key={destination.id} 
                      className="hover:bg-primary-50 cursor-pointer"
                      onClick={() => router.push(`/destinations/${destination.id}`)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedDestinations.includes(destination.id)}
                          onChange={(e) => {
                            e.stopPropagation()
                            handleSelectDestination(destination.id)
                          }}
                          onClick={(e) => {
                            e.stopPropagation()
                          }}
                          className="rounded border-ponte-sand text-ponte-terracotta focus:ring-ponte-terracotta"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-ponte-black">{destination.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-ponte-sand text-ponte-black">
                          {getCategoryLabel(destination.category)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {destination.tags && destination.tags.length > 0 ? (
                            destination.tags.map((tag, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium text-white"
                                style={{ backgroundColor: getTagColor(tag) }}
                              >
                                {tag}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-ponte-olive">No tags</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-ponte-black max-w-md break-words">{destination.address}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-ponte-olive">
                        {destination.latitude.toFixed(8)}, {destination.longitude.toFixed(8)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {/* Row is now clickable - no action button needed */}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add/Edit Destination Modal */}
        {(showAddForm || editingDestination) && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-5 border border-ponte-sand w-full max-w-2xl shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-ponte-black">
                    {editingDestination ? "Edit Destination" : "Add New Destination"}
                  </h3>
                  <button
                    onClick={resetForm}
                    className="text-ponte-olive hover:text-ponte-black"
                  >
                    ×
                  </button>
                </div>

                <form onSubmit={handleSubmitDestination} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-ponte-black">
                        Destination Name
                      </label>
                      <input
                        type="text"
                        id="name"
                        value={newDestination.name}
                        onChange={(e) => setNewDestination({ ...newDestination, name: e.target.value })}
                        className="mt-1 block w-full rounded-md border-ponte-sand shadow-sm focus:border-ponte-terracotta focus:ring-ponte-terracotta"
                        placeholder="Destination name (required)"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="category" className="block text-sm font-medium text-ponte-black">
                        Category *
                      </label>
                      <select
                        id="category"
                        value={newDestination.category}
                        onChange={(e) => setNewDestination({ ...newDestination, category: e.target.value })}
                        className="mt-1 block w-full rounded-md border-ponte-sand shadow-sm focus:border-ponte-terracotta focus:ring-ponte-terracotta"
                        required
                      >
                        <option value="">Select a category</option>
                        {categories.map(category => (
                          <option key={category.value} value={category.value}>{category.icon} {category.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="text-sm font-medium text-ponte-black mb-3">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {availableTags.map((tag) => (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => handleTagToggle(tag.name)}
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
                            newDestination.tags.includes(tag.name)
                              ? 'bg-ponte-terracotta text-white border-ponte-terracotta'
                              : 'bg-white text-ponte-black border-ponte-sand hover:bg-ponte-sand'
                          }`}
                          style={{ 
                            backgroundColor: newDestination.tags.includes(tag.name) ? tag.color : undefined,
                            borderColor: newDestination.tags.includes(tag.name) ? tag.color : undefined
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

                  <div className="border-t pt-4">
                    <h4 className="text-sm font-medium text-ponte-black mb-3">Address Details</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="streetAddress" className="block text-sm font-medium text-ponte-black">
                          Street Address
                        </label>
                        <input
                          type="text"
                          id="streetAddress"
                          value={newDestination.streetAddress}
                          onChange={(e) => setNewDestination({ ...newDestination, streetAddress: e.target.value })}
                          className="mt-1 block w-full rounded-md border-ponte-sand shadow-sm focus:border-ponte-terracotta focus:ring-ponte-terracotta"
                          placeholder="e.g., 123 Main Street or PO Box 456"
                        />
                      </div>

                      <div>
                        <label htmlFor="postalCode" className="block text-sm font-medium text-ponte-black">
                          Postal Code
                        </label>
                        <input
                          type="text"
                          id="postalCode"
                          value={newDestination.postalCode}
                          onChange={(e) => setNewDestination({ ...newDestination, postalCode: e.target.value })}
                          className="mt-1 block w-full rounded-md border-ponte-sand shadow-sm focus:border-ponte-terracotta focus:ring-ponte-terracotta"
                          placeholder="e.g., 00185"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div>
                        <label htmlFor="city" className="block text-sm font-medium text-ponte-black">
                          City
                        </label>
                        <input
                          type="text"
                          id="city"
                          value={newDestination.city}
                          onChange={(e) => setNewDestination({ ...newDestination, city: e.target.value })}
                          className="mt-1 block w-full rounded-md border-ponte-sand shadow-sm focus:border-ponte-terracotta focus:ring-ponte-terracotta"
                          placeholder="e.g., Roma"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div>
                        <label htmlFor="province" className="block text-sm font-medium text-ponte-black">
                          Province
                        </label>
                        <input
                          type="text"
                          id="province"
                          value={newDestination.province}
                          onChange={(e) => setNewDestination({ ...newDestination, province: e.target.value })}
                          className="mt-1 block w-full rounded-md border-ponte-sand shadow-sm focus:border-ponte-terracotta focus:ring-ponte-terracotta"
                          placeholder="e.g., RM"
                        />
                      </div>
                      <div>
                        <label htmlFor="country" className="block text-sm font-medium text-ponte-black">
                          Country
                        </label>
                        <input
                          type="text"
                          id="country"
                          value={newDestination.country}
                          onChange={(e) => setNewDestination({ ...newDestination, country: e.target.value })}
                          className="mt-1 block w-full rounded-md border-ponte-sand shadow-sm focus:border-ponte-terracotta focus:ring-ponte-terracotta"
                          placeholder="e.g., ITALY"
                        />
                      </div>
                    </div>
                  </div>

                  {/* GPS Button */}
                  <div className="mt-4 p-4 bg-ponte-sand rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-ponte-black">Get Address from GPS</h4>
                        <p className="text-xs text-ponte-olive mt-1">
                          Use the GPS coordinates to automatically fill in the address fields
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleGeocodeFromGPS}
                        disabled={geocodingLoading}
                        className="px-4 py-2 bg-ponte-terracotta text-white rounded-md hover:bg-accent-600 disabled:opacity-50"
                      >
                        {geocodingLoading ? "Getting Address..." : "Get Address from GPS"}
                      </button>
                    </div>
                  </div>

                  {editingDestination && (
                    <div className="mt-4 p-3 bg-ponte-sand border border-ponte-sand rounded-md">
                      <h4 className="text-sm font-medium text-ponte-black mb-2">Current Address:</h4>
                      <p className="text-sm text-ponte-olive mb-2">{editingDestination.address}</p>
                      <button
                        type="button"
                        onClick={parseExistingAddress}
                        className="text-xs text-ponte-terracotta hover:text-accent-600 underline"
                      >
                        Parse into fields above
                      </button>
                    </div>
                  )}

                  {editingDestination && (
                    <p className="mt-1 text-xs text-ponte-terracotta">
                      💡 Fill in the address fields above and click "Geocode Address" to update coordinates
                    </p>
                  )}

                  {geocodingResult && (
                    <div className="bg-green-50 border border-green-200 rounded-md p-3">
                      <p className="text-sm text-green-700">
                        <strong>Found:</strong> {geocodingResult.formatted_address}
                      </p>
                      <p className="text-xs text-green-600">
                        {geocodingResult.latitude?.toFixed(8)}, {geocodingResult.longitude?.toFixed(8)}
                      </p>
                    </div>
                  )}

                  <div className="border-t pt-4">
                    <h4 className="text-sm font-medium text-ponte-black mb-3">GPS Coordinates</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="latitude" className="block text-sm font-medium text-ponte-black">
                          Latitude
                        </label>
                        <input
                          type="number"
                          step="0.00000001"
                          id="latitude"
                          value={newDestination.latitude}
                          onChange={(e) => setNewDestination({ ...newDestination, latitude: parseFloat(e.target.value) || 0 })}
                          className="mt-1 block w-full rounded-md border-ponte-sand shadow-sm focus:border-ponte-terracotta focus:ring-ponte-terracotta"
                          placeholder="e.g., 43.44040264"
                        />
                      </div>
                      <div>
                        <label htmlFor="longitude" className="block text-sm font-medium text-ponte-black">
                          Longitude
                        </label>
                        <input
                          type="number"
                          step="0.00000001"
                          id="longitude"
                          value={newDestination.longitude}
                          onChange={(e) => setNewDestination({ ...newDestination, longitude: parseFloat(e.target.value) || 0 })}
                          className="mt-1 block w-full rounded-md border-ponte-sand shadow-sm focus:border-ponte-terracotta focus:ring-ponte-terracotta"
                          placeholder="e.g., 13.66056997"
                        />
                      </div>
                    </div>
                  </div>


                  {error && (
                    <div className="text-red-600 text-sm">{error}</div>
                  )}

                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-4 py-2 text-sm font-medium text-ponte-black bg-ponte-sand hover:bg-primary-200 rounded-md"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-4 py-2 text-sm font-medium text-white bg-ponte-terracotta hover:bg-accent-600 rounded-md disabled:opacity-50"
                    >
                      {submitting ? "Saving..." : "Save Destination"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}