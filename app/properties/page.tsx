"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import Navigation from "components/Navigation"

interface Property {
  id: string
  name?: string
  tags: string[]
  latitude: number
  longitude: number
  propertyType: string
  // Italian address fields (now primary)
  recipientName?: string | null
  streetAddress: string
  postalCode: string
  city: string
  province?: string | null
  country: string
  createdAt: string
  // Partner/User information
  partnerId?: string | null
  partner?: {
    id: string
    name: string
    email: string
  } | null
  user?: {
    id: string
    name: string
    email: string
  } | null
}

export default function PropertiesPage() {
  const { data: _session, status } = useSession()
  const router = useRouter()
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [sortField, setSortField] = useState<keyof Property>("name")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [filterType, setFilterType] = useState<string>("")
  const [filterTag, setFilterTag] = useState<string>("")
  const [editingProperty, setEditingProperty] = useState<Property | null>(null)
  const [selectedProperties, setSelectedProperties] = useState<string[]>([])
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false)
  const [newProperty, setNewProperty] = useState({
    name: "",
    tags: [] as string[],
    latitude: 0,
    longitude: 0,
    propertyType: "house",
    recipientName: "",
    streetAddress: "",
    postalCode: "",
    city: "",
    province: "",
    country: "ITALY"
  })
  const [geocodingResult, setGeocodingResult] = useState<unknown>(null)
  const [_geocodingLoading, setGeocodingLoading] = useState(false)
  const [availableTags, setAvailableTags] = useState<Array<{id: string, name: string, color: string}>>([])
  const [editForm, setEditForm] = useState({
    name: "",
    tags: [] as string[],
    latitude: 0,
    longitude: 0,
    propertyType: "house",
    // Italian address fields (now primary)
    recipientName: "",
    streetAddress: "",
    postalCode: "",
    city: "",
    province: "",
    country: "ITALY"
  })
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  // Property type options with icons (4 types for properties)
  const propertyTypes = [
    { value: "house", label: "House", icon: "🏠" },
    { value: "condo", label: "Condo", icon: "🏢" },
    { value: "apartment", label: "Apartment", icon: "🏘️" },
    { value: "estate", label: "Estate", icon: "🏰" },
  ]

  // Get all unique tags from properties
  const allTags = Array.from(new Set(properties.flatMap(p => p.tags))).sort()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
      return
    }

    if (status === "authenticated") {
      fetchProperties()
      fetchAvailableTags()
    }
  }, [status, router])

  const fetchProperties = async () => {
    try {
      const response = await fetch("/api/properties")
      
      if (response.ok) {
        const data = await response.json() as { properties?: Property[] }
        setProperties(data.properties || [])
      } else {
        console.error("Error fetching properties")
      }
    } catch (error) {
      console.error("Error fetching properties:", error)
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

  const handleSort = (field: keyof Property) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const sortedProperties = [...properties].sort((a, b) => {
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

  const filteredProperties = sortedProperties.filter(p => {
    // Type filter
    const typeMatch = !filterType || p.propertyType === filterType
    
    // Tag filter
    const tagMatch = !filterTag || p.tags.includes(filterTag)
    
    return typeMatch && tagMatch
  })

  const handleSelectProperty = (propertyId: string) => {
    setSelectedProperties(prev => 
      prev.includes(propertyId) 
        ? prev.filter(id => id !== propertyId)
        : [...prev, propertyId]
    )
  }

  const handleSelectAll = () => {
    if (selectedProperties.length === filteredProperties.length) {
      setSelectedProperties([])
    } else {
      setSelectedProperties(filteredProperties.map(p => p.id))
    }
  }

  const handleBulkDelete = async () => {
    if (selectedProperties.length === 0) return
    
    if (!confirm(`Are you sure you want to delete ${selectedProperties.length} property(ies)?`)) {
      return
    }

    setBulkDeleteLoading(true)

    try {
      const deletePromises = selectedProperties.map(id => 
        fetch(`/api/properties/${id}`, { method: "DELETE" })
      )
      
      const results = await Promise.all(deletePromises)
      const failedDeletes = results.filter(response => !response.ok)
      
      if (failedDeletes.length > 0) {
        alert(`Failed to delete ${failedDeletes.length} property(ies)`)
      } else {
        await fetchProperties()
        setSelectedProperties([])
      }
    } catch {
      alert("Failed to delete properties")
    } finally {
      setBulkDeleteLoading(false)
    }
  }

  const handleEditProperty = (property: Property) => {
    setEditingProperty(property)
    setEditForm({
      name: property.name || "",
      tags: property.tags,
      latitude: property.latitude,
      longitude: property.longitude,
      propertyType: property.propertyType,
      recipientName: property.recipientName || "",
      streetAddress: property.streetAddress,
      postalCode: property.postalCode,
      city: property.city,
      province: property.province || "",
      country: property.country
    })
  }

  const handleGeocodeAddress = async () => {
    if (!editingProperty) return

    setSubmitting(true)
    setError("")

    try {
      const response = await fetch("/api/geocoding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latlng: `${editForm.latitude},${editForm.longitude}`
        })
      })

      if (response.ok) {
        const data = await response.json() as unknown
        const address = (data as { result: { formatted_address: string } }).result.formatted_address
        
        // Parse the address components
        const addressParts = address.split(', ')
        if (addressParts.length >= 2) {
          setEditForm({
            ...editForm,
            streetAddress: addressParts[0] || "",
            city: addressParts[1] || "",
            postalCode: addressParts[addressParts.length - 2] || "",
            country: addressParts[addressParts.length - 1] || "Unknown"
          })
        }
      } else {
        setError("Failed to geocode address")
      }
    } catch {
      setError("Failed to geocode address")
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateProperty = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editingProperty) return

    setSubmitting(true)
    setError("")

    try {
      const response = await fetch(`/api/properties/${editingProperty.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editForm),
      })

      const data = await response.json() as { error?: string }

      if (response.ok) {
        await fetchProperties()
        setEditingProperty(null)
        setEditForm({
          name: "",
          tags: [],
          latitude: 0,
          longitude: 0,
          propertyType: "house",
          recipientName: "",
          streetAddress: "",
          postalCode: "",
          city: "",
          province: "",
          country: "ITALY"
        })
      } else {
        setError(data.error || "Failed to update property")
      }
    } catch {
      setError("Failed to update property")
    } finally {
      setSubmitting(false)
    }
  }


  const resetEditForm = () => {
    setEditingProperty(null)
    setEditForm({
      name: "",
      tags: [],
      latitude: 0,
      longitude: 0,
      propertyType: "house",
      recipientName: "",
      streetAddress: "",
      postalCode: "",
      city: "",
      province: "",
      country: "ITALY"
    })
    setError("")
  }


  const _handleGeocodeAddressForAdd = async () => {
    if (!newProperty.streetAddress.trim() && !newProperty.city.trim()) {
      setError("Please enter at least a street address or city")
      return
    }

    setGeocodingLoading(true)
    setError("")

    try {
      // Build address from components
      const addressParts = [
        newProperty.streetAddress,
        newProperty.postalCode,
        newProperty.city,
        newProperty.province,
        newProperty.country
      ].filter(part => part && part.trim())

      const fullAddress = addressParts.join(", ")

      const response = await fetch("/api/geocoding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ address: fullAddress }),
      })

      const data = await response.json() as { result?: { formatted_address: string; latitude: number; longitude: number }, error?: string }

      if (response.ok) {
        setGeocodingResult(data.result)
        setNewProperty(prev => ({
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

  const _handleAddProperty = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!geocodingResult) {
      setError("Please geocode the address first")
      return
    }

    setSubmitting(true)
    setError("")

    try {
      const response = await fetch("/api/properties", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newProperty.name,
          tags: newProperty.tags,
          latitude: newProperty.latitude,
          longitude: newProperty.longitude,
          propertyType: newProperty.propertyType,
          recipientName: newProperty.recipientName,
          streetAddress: newProperty.streetAddress,
          postalCode: newProperty.postalCode,
          city: newProperty.city,
          province: newProperty.province,
          country: newProperty.country
        }),
      })

      const data = await response.json() as { error?: string }

      if (response.ok) {
        await fetchProperties()
      } else {
        setError(data.error || "Failed to add property")
      }
    } catch {
      setError("Failed to add property")
    } finally {
      setSubmitting(false)
    }
  }

  const _handleTagToggle = (tagName: string, isForNewProperty: boolean = false) => {
    if (isForNewProperty) {
      setNewProperty(prev => ({
        ...prev,
        tags: prev.tags.includes(tagName) 
          ? prev.tags.filter(tag => tag !== tagName)
          : [...prev.tags, tagName]
      }))
    } else {
      setEditForm(prev => ({
        ...prev,
        tags: prev.tags.includes(tagName) 
          ? prev.tags.filter(tag => tag !== tagName)
          : [...prev.tags, tagName]
      }))
    }
  }

  const parseExistingAddress = () => {
    if (!editingProperty) return

    // Build address from property fields
    const addressParts = [
      editingProperty.streetAddress,
      editingProperty.postalCode,
      editingProperty.city,
      editingProperty.province,
      editingProperty.country
    ].filter(Boolean)
    
    const address = addressParts.join(', ')
    if (!address) return

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

    setEditForm(prev => ({
      ...prev,
      streetAddress,
      postalCode,
      city,
      province,
      country
    }))
  }

  const getPropertyTypeInfo = (type: string) => {
    return propertyTypes.find(pt => pt.value === type) || { value: type, label: type, icon: "🏠" }
  }

  const getTagColor = (tagName: string) => {
    const tag = availableTags.find(t => t.name === tagName)
    return tag?.color || '#D3BFA4' // fallback to sand color
  }

  const _formatAddress = (property: Property) => {
    const parts = [
      property.streetAddress,
      property.postalCode,
      property.city,
      property.province,
      property.country
    ].filter(Boolean)
    return parts.join(", ")
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ponte-terracotta mx-auto"></div>
          <p className="mt-4 text-ponte-olive font-body">Loading Properties...</p>
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
                src="/logos/icon-property.png" 
                alt="Property Icon" 
                width={32}
                height={32}
                className="w-8 h-8 mr-3"
              />
              <div>
                <h1 className="text-3xl font-bold text-ponte-black">Properties</h1>
                <p className="mt-2 text-ponte-olive">Manage your properties with detailed information</p>
              </div>
            </div>
            <button
              onClick={() => router.push("/properties/new")}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-ponte-olive hover:bg-ponte-olive/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ponte-olive"
            >
              Add Property
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 bg-white p-4 rounded-lg shadow border border-ponte-sand">
          <div className="flex flex-wrap gap-4 items-center">
            <div>
              <label htmlFor="type-filter" className="block text-sm font-medium text-ponte-black mb-1">
                Filter by Type
              </label>
              <select
                id="type-filter"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="block w-full rounded-md border-ponte-sand shadow-sm focus:border-ponte-terracotta focus:ring-ponte-terracotta"
              >
                <option value="">All Types</option>
                {propertyTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.icon} {type.label}</option>
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
              Showing {filteredProperties.length} of {properties.length} properties
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {filteredProperties.length > 0 && (
          <div className="mb-4 bg-ponte-sand p-4 rounded-lg border border-ponte-sand">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedProperties.length === filteredProperties.length && filteredProperties.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-ponte-sand text-ponte-terracotta focus:ring-ponte-terracotta"
                  />
                  <span className="ml-2 text-sm font-medium text-ponte-black">
                    Select All ({selectedProperties.length} selected)
                  </span>
                </label>
              </div>
              {selectedProperties.length > 0 && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-ponte-olive">
                    {selectedProperties.length} selected
                  </span>
                  <button
                    onClick={handleBulkDelete}
                    disabled={bulkDeleteLoading}
                    className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 disabled:opacity-50"
                  >
                    {bulkDeleteLoading ? "Deleting..." : `Delete ${selectedProperties.length} Item(s)`}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Properties Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden border border-ponte-sand">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-ponte-sand">
              <thead className="bg-ponte-sand">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-ponte-black uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectedProperties.length === filteredProperties.length && filteredProperties.length > 0}
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
                    onClick={() => handleSort("propertyType")}
                  >
                    Type {sortField === "propertyType" && (sortDirection === "asc" ? "↑" : "↓")}
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-ponte-black uppercase tracking-wider">
                    Added By
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-ponte-black uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-ponte-sand">
                {filteredProperties.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-ponte-olive">
                      {filterType || filterTag ? 
                        `No properties found with ${filterType ? `"${getPropertyTypeInfo(filterType).label}" type` : ''}${filterType && filterTag ? ' and ' : ''}${filterTag ? `"${filterTag}" tag` : ''}` : 
                        "No properties added yet"
                      }
                    </td>
                  </tr>
                ) : (
                  filteredProperties.map((property) => {
                    const typeInfo = getPropertyTypeInfo(property.propertyType)
                    return (
                      <tr 
                        key={property.id} 
                        className="hover:bg-primary-50 cursor-pointer"
                        onClick={() => router.push(`/properties/${property.id}`)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedProperties.includes(property.id)}
                            onChange={(e) => {
                              e.stopPropagation()
                              handleSelectProperty(property.id)
                            }}
                            onClick={(e) => {
                              e.stopPropagation()
                            }}
                            className="rounded border-ponte-sand text-ponte-terracotta focus:ring-ponte-terracotta"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-ponte-black">
                            {property.name || "Unnamed Property"}
                          </div>
                          {property.recipientName && (
                            <div className="text-xs text-ponte-olive">{property.recipientName}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-ponte-sand text-ponte-black">
                            <span className="mr-1">{typeInfo.icon}</span>
                            {typeInfo.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {property.tags.length === 0 ? (
                              <span className="text-xs text-ponte-olive">No tags</span>
                            ) : (
                              property.tags.map((tag, index) => (
                                <span
                                  key={index}
                                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium text-white"
                                  style={{ backgroundColor: getTagColor(tag) }}
                                >
                                  {tag}
                                </span>
                              ))
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-ponte-black max-w-md">
                            <div className="font-medium break-words">{property.streetAddress}</div>
                            <div className="text-ponte-olive break-words">
                              {property.postalCode} {property.city}
                              {property.province && `, ${property.province}`}
                            </div>
                            <div className="text-xs text-ponte-olive break-words">{property.country}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-ponte-olive">
                          {property.latitude.toFixed(4)}, {property.longitude.toFixed(4)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-ponte-black">
                          {property.partner ? (
                            <div>
                              <div className="font-medium">{property.partner.name}</div>
                              <div className="text-xs text-ponte-olive">Partner</div>
                            </div>
                          ) : property.user ? (
                            <div>
                              <div className="font-medium">{property.user.name}</div>
                              <div className="text-xs text-ponte-olive">User</div>
                            </div>
                          ) : (
                            <div className="text-ponte-olive">Unknown</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEditProperty(property)
                            }}
                            className="text-ponte-terracotta hover:text-accent-600"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Edit Property Modal */}
        {editingProperty && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-5 border border-ponte-sand w-full max-w-2xl shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-ponte-black">Edit Property</h3>
                  <button
                    onClick={resetEditForm}
                    className="text-ponte-olive hover:text-ponte-black"
                  >
                    ×
                  </button>
                </div>

                <form onSubmit={handleUpdateProperty} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-ponte-black">
                        Property Name
                      </label>
                      <input
                        type="text"
                        id="name"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="mt-1 block w-full rounded-md border-ponte-sand shadow-sm focus:border-ponte-terracotta focus:ring-ponte-terracotta"
                        placeholder="Property name (required)"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="propertyType" className="block text-sm font-medium text-ponte-black">
                        Property Type
                      </label>
                      <select
                        id="propertyType"
                        value={editForm.propertyType}
                        onChange={(e) => setEditForm({ ...editForm, propertyType: e.target.value })}
                        className="mt-1 block w-full rounded-md border-ponte-sand shadow-sm focus:border-ponte-terracotta focus:ring-ponte-terracotta"
                      >
                        {propertyTypes.map(type => (
                          <option key={type.value} value={type.value}>
                            {type.icon} {type.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>


                  <div className="border-t pt-4">
                    <h4 className="text-sm font-medium text-ponte-black mb-3">Address Details</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="recipientName" className="block text-sm font-medium text-ponte-black">
                          Name/Company
                        </label>
                        <input
                          type="text"
                          id="recipientName"
                          value={editForm.recipientName}
                          onChange={(e) => setEditForm({ ...editForm, recipientName: e.target.value })}
                          className="mt-1 block w-full rounded-md border-ponte-sand shadow-sm focus:border-ponte-terracotta focus:ring-ponte-terracotta"
                          placeholder="Recipient name or company"
                        />
                      </div>

                      <div>
                        <label htmlFor="streetAddress" className="block text-sm font-medium text-ponte-black">
                          Street Address <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="streetAddress"
                          value={editForm.streetAddress}
                          onChange={(e) => setEditForm({ ...editForm, streetAddress: e.target.value })}
                          className="mt-1 block w-full rounded-md border-ponte-sand shadow-sm focus:border-ponte-terracotta focus:ring-ponte-terracotta"
                          placeholder="e.g., 123 Main Street or PO Box 456"
                          required
                        />
                      </div>

                      <div>
                        <label htmlFor="postalCode" className="block text-sm font-medium text-ponte-black">
                          Postal Code <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="postalCode"
                          value={editForm.postalCode}
                          onChange={(e) => setEditForm({ ...editForm, postalCode: e.target.value })}
                          className="mt-1 block w-full rounded-md border-ponte-sand shadow-sm focus:border-ponte-terracotta focus:ring-ponte-terracotta"
                          placeholder="e.g., 00185"
                          required
                        />
                      </div>

                      <div>
                        <label htmlFor="city" className="block text-sm font-medium text-ponte-black">
                          City <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="city"
                          value={editForm.city}
                          onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                          className="mt-1 block w-full rounded-md border-ponte-sand shadow-sm focus:border-ponte-terracotta focus:ring-ponte-terracotta"
                          placeholder="e.g., Roma"
                          required
                        />
                      </div>

                      <div>
                        <label htmlFor="province" className="block text-sm font-medium text-ponte-black">
                          Province
                        </label>
                        <input
                          type="text"
                          id="province"
                          value={editForm.province}
                          onChange={(e) => setEditForm({ ...editForm, province: e.target.value })}
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
                          value={editForm.country}
                          onChange={(e) => setEditForm({ ...editForm, country: e.target.value })}
                          className="mt-1 block w-full rounded-md border-ponte-sand shadow-sm focus:border-ponte-terracotta focus:ring-ponte-terracotta"
                          placeholder="e.g., ITALY"
                        />
                      </div>
                    </div>

                    {/* Geocode Button */}
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
                          onClick={handleGeocodeAddress}
                          disabled={submitting}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-ponte-terracotta hover:bg-accent-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ponte-terracotta disabled:opacity-50"
                        >
                          {submitting ? "Geocoding..." : "Get Address"}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="latitude" className="block text-sm font-medium text-ponte-black">
                        Latitude
                      </label>
                      <input
                        type="number"
                        step="any"
                        id="latitude"
                        value={editForm.latitude}
                        onChange={(e) => setEditForm({ ...editForm, latitude: parseFloat(e.target.value) || 0 })}
                        className="mt-1 block w-full rounded-md border-ponte-sand shadow-sm focus:border-ponte-terracotta focus:ring-ponte-terracotta"
                        placeholder="Latitude"
                      />
                    </div>

                    <div>
                      <label htmlFor="longitude" className="block text-sm font-medium text-ponte-black">
                        Longitude
                      </label>
                      <input
                        type="number"
                        step="any"
                        id="longitude"
                        value={editForm.longitude}
                        onChange={(e) => setEditForm({ ...editForm, longitude: parseFloat(e.target.value) || 0 })}
                        className="mt-1 block w-full rounded-md border-ponte-sand shadow-sm focus:border-ponte-terracotta focus:ring-ponte-terracotta"
                        placeholder="Longitude"
                      />
                    </div>
                  </div>

                  {editingProperty && (
                    <div className="mt-4 p-3 bg-ponte-sand border border-ponte-sand rounded-md">
                      <h4 className="text-sm font-medium text-ponte-black mb-2">Current Address:</h4>
                      <p className="text-sm text-ponte-olive mb-2">{editingProperty.streetAddress ? 
                        `${editingProperty.streetAddress}, ${editingProperty.postalCode} ${editingProperty.city}${editingProperty.province ? `, ${editingProperty.province}` : ''}, ${editingProperty.country}` 
                        : 'No address available'}
                      </p>
                      <button
                        type="button"
                        onClick={parseExistingAddress}
                        className="text-xs text-ponte-terracotta hover:text-accent-600 underline"
                      >
                        Parse into fields above
                      </button>
                    </div>
                  )}

                  {error && (
                    <div className="text-red-600 text-sm">{error}</div>
                  )}

                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={resetEditForm}
                      className="px-4 py-2 text-sm font-medium text-ponte-black bg-ponte-sand hover:bg-primary-200 rounded-md"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-4 py-2 text-sm font-medium text-white bg-ponte-terracotta hover:bg-accent-600 rounded-md disabled:opacity-50"
                    >
                      {submitting ? "Saving..." : "Save Changes"}
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
