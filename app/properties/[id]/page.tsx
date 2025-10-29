"use client"

import Image from "next/image"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import Navigation from "components/Navigation"
import PropertyEvaluationDashboard from "components/PropertyEvaluationDashboard"
import PropertyFileManager from "components/PropertyFileManager"

interface FileInfo {
  url: string
  originalName: string
  storageName: string
  size: number
  type: string
}

interface Destination {
  id: string
  name: string
  address: string
  latitude: number
  longitude: number
  category: string
  placeId?: string
  createdAt: string
}

interface Distance {
  destinationId: string
  drivingDistance?: number
  drivingDuration?: number
  transitDistance?: number
  transitDuration?: number
  walkingDistance?: number
  walkingDuration?: number
}

interface Property {
  id: string
  name: string
  propertyType: string
  latitude: number
  longitude: number
  recipientName?: string
  streetAddress?: string
  postalCode?: string
  city?: string
  province?: string
  country: string
  tags: string[]
  
  // SECTION 1 - Property Identification (from JSON form)
  fullAddress?: string
  region?: string
  gpsCoordinates?: string
  listingType?: string
  yearBuiltNew?: string
  ownershipType?: string
  
  // SECTION 2 - Property Description (from JSON form)
  shortSummary?: string
  fullDescription?: string
  architecturalStyle?: string
  orientation?: string
  condition?: string
  energyEfficiencyClass?: string
  
  // SECTION 3 - Size & Layout (from JSON form)
  totalLivingArea?: string
  totalLandSize?: string
  numberOfFloors?: string
  numberOfBedrooms?: string
  numberOfBathrooms?: string
  kitchen?: string
  livingDiningAreas?: string
  officeStudyRoom?: boolean
  cellarBasement?: boolean
  atticLoft?: boolean
  garageParking?: string
  outbuildings?: string
  terracesBalconies?: boolean
  laundryUtilityRoom?: boolean
  
  // SECTION 4 - Utilities & Infrastructure (from JSON form)
  waterSource?: string
  heatingSystem?: string[]
  coolingAirConditioning?: boolean
  electricityConnection?: boolean
  sewageType?: string
  internetAvailability?: string
  solarRenewableEnergy?: string
  roadAccessCondition?: string
  
  // SECTION 5 - Outdoor Features & Amenities (from JSON form)
  swimmingPool?: string
  gardenLandscaping?: string
  oliveGroveVineyard?: string
  patioCourtyard?: boolean
  outdoorKitchenBBQ?: boolean
  viewTypes?: string[]
  fencingGates?: string
  parkingSpaces?: string
  
  // SECTION 6 - Location & Proximity (from JSON form)
  nearestTown?: string
  distanceToNearestTown?: string
  distanceToCoast?: string
  distanceToAirport?: string
  distanceToTrainStation?: string
  distanceToServices?: string
  notableAttractions?: string
  
  // SECTION 7 - Legal & Financial Details (from JSON form)
  askingPrice?: string
  negotiable?: boolean
  agencyCommission?: string
  annualPropertyTax?: string
  utilityCostsEstimate?: string
  ownershipDocumentsAvailable?: boolean
  urbanPlanningCompliance?: string
  propertyCurrentlyOccupied?: boolean
  easementsRestrictions?: string
  
  // SECTION 8 - Visuals & Media (from JSON form)
  propertyPhotos?: string[] | FileInfo[]
  floorPlans?: string[] | FileInfo[]
  dronePhotos?: string[] | FileInfo[]
  energyCertificate?: string[] | FileInfo[]
  virtualTourLink?: string
  
  // SECTION 9 - Additional Notes (from JSON form)
  additionalNotes?: string
  recommendedSellingPoints?: string
  suggestedRenovationPotential?: string
  
  // Team Notes
  peterNotes?: string
  wesNotes?: string
  elenaNotes?: string
  hazelNotes?: string
  
  // Legacy fields for compatibility
  propertyNumber?: number
  featuredImage?: string
  status: string
  createdAt: string
  updatedAt: string
}

// Helper function to format duration in hours and minutes
const formatDuration = (minutes: number | null | undefined): string => {
  if (!minutes || minutes === 0) return 'N/A'
  
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = Math.round(minutes % 60)
  
  if (hours === 0) {
    return `${remainingMinutes} min`
  } else if (remainingMinutes === 0) {
    return `${hours} hr`
  } else {
    return `${hours} hr ${remainingMinutes} min`
  }
}

export default function PropertyDetailPage() {
  const { id } = useParams() as { id: string }
  const router = useRouter()
  const { data: _session, status } = useSession()
  const [property, setProperty] = useState<Property | null>(null)
  const [originalProperty, setOriginalProperty] = useState<Property | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)
  const [availableTags, setAvailableTags] = useState<Array<{id: string, name: string, color: string}>>([])
  const [evaluationChanged, setEvaluationChanged] = useState(false)
  const [destinations, setDestinations] = useState<Destination[]>([])
  const [distances, setDistances] = useState<Distance[]>([])
  const [loadingDistances, setLoadingDistances] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [avoidTolls, setAvoidTolls] = useState(false)
  const [isEditingName, setIsEditingName] = useState(false)
  const [editingName, setEditingName] = useState("")

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
      return
    }

    if (status === "authenticated") {
      console.log('User authenticated, fetching data...')
      fetchProperty()
      fetchAvailableTags()
      fetchDestinations()
    }
  }, [status, id, router])

  // Fetch distances when property is loaded
  useEffect(() => {
    if (property) {
      fetchDistances()
    }
  }, [property])

  // Also fetch distances when destinations are loaded (in case they load after property)
  useEffect(() => {
    if (property && destinations.length > 0) {
      fetchDistances()
    }
  }, [property, destinations])

  const fetchProperty = async () => {
    try {
      const response = await fetch(`/api/properties/${id}`)
      if (response.ok) {
        const data = await response.json() as Property
        setProperty(data)
        setOriginalProperty(data) // Store original data for comparison
      } else {
        setError("Failed to load property")
      }
    } catch (error) {
      console.error("Error fetching property:", error)
      setError("Failed to load property")
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

  const fetchDestinations = async () => {
    try {
      console.log('Fetching destinations from /api/destinations')
      const response = await fetch('/api/destinations')
      console.log('Destinations response status:', response.status)
      
      if (response.ok) {
        const data = await response.json() as { destinations: Destination[] }
        console.log('Destinations API response:', data)
        console.log('Destinations API response destinations:', data.destinations)
        // Handle the API response format: { destinations: [...] }
        const destinationsArray = Array.isArray(data.destinations) ? data.destinations : []
        console.log('Setting destinations:', destinationsArray.length, 'items')
        console.log('Destinations array:', destinationsArray)
        setDestinations(destinationsArray)
      } else {
        console.error('Failed to fetch destinations:', response.status)
        const errorText = await response.text()
        console.error('Destinations API error response:', errorText)
        setDestinations([])
      }
    } catch (error) {
      console.error('Error fetching destinations:', error)
      setDestinations([])
    }
  }

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev)
      if (newSet.has(category)) {
        newSet.delete(category)
      } else {
        newSet.add(category)
      }
      return newSet
    })
  }

  const fetchDistances = async () => {
    if (!property) {
      console.log('Cannot fetch distances: missing property')
      return
    }
    
    setLoadingDistances(true)
    try {
      console.log('Fetching distances for property:', property.id)
      
      const response = await fetch(`/api/properties/${property.id}/distances`)
      
      if (response.ok) {
        const data = await response.json() as { distances: Distance[] }
        console.log('Distance fetch successful:', data.distances.length, 'distances')
        // Ensure distances is an array before setting it
        setDistances(Array.isArray(data.distances) ? data.distances : [])
      } else {
        const errorData = await response.json()
        console.error('Distance fetch failed:', errorData)
        if (response.status === 404) {
          // No distances calculated yet - this is normal
          console.log('No distance data found for this property')
          setDistances([])
        } else {
          alert('Failed to fetch distances. Please try again.')
          setDistances([])
        }
      }
    } catch (error) {
      console.error('Error fetching distances:', error)
      alert('Failed to fetch distances. Please check your connection and try again.')
      setDistances([])
    } finally {
      setLoadingDistances(false)
    }
  }

  const calculateDistances = async () => {
    if (!property || destinations.length === 0) {
      console.log('Cannot calculate distances: missing property or destinations')
      return
    }
    
    setLoadingDistances(true)
    try {
      console.log('Calculating distances for property:', property.id, 'with toll avoidance:', avoidTolls)
      
      const destinationIds = destinations.map(d => d.id)
      
      const response = await fetch('/api/distance-matrix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          propertyId: property.id, 
          destinationIds,
          avoidTolls 
        })
      })
      
      if (response.ok) {
        const data = await response.json() as { results: unknown[] }
        console.log('Distance calculation successful:', data.results.length, 'results')
        // Refresh the distances after calculation
        await fetchDistances()
      } else {
        const errorData = await response.json()
        console.error('Distance calculation failed:', errorData)
        alert(`Failed to calculate distances: ${(errorData as { error?: string }).error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error calculating distances:', error)
      alert('Failed to calculate distances')
    } finally {
      setLoadingDistances(false)
    }
  }

  // Function to detect if there are unsaved changes
  const hasUnsavedChanges = () => {
    if (!property || !originalProperty) return false
    
    // Check property changes
    const currentData = JSON.stringify(property)
    const originalData = JSON.stringify(originalProperty)
    const propertyChanged = currentData !== originalData
    
    // Check evaluation changes
    return propertyChanged || evaluationChanged
  }

  const handleSave = async () => {
    if (!property) return

    setSaving(true)
    try {
      const response = await fetch(`/api/properties/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(property),
      })

      if (response.ok) {
        // Update original property data after successful save
        setOriginalProperty(property)
        // Reset evaluation change flag since evaluations auto-save
        setEvaluationChanged(false)
      } else {
        const errorData = await response.json() as { error: string }
        alert(`Failed to update property: ${errorData.error}`)
      }
    } catch (error) {
      console.error("Error updating property:", error)
      alert("Failed to update property")
    } finally {
      setSaving(false)
    }
  }

  const handleTagToggle = (tagName: string) => {
    if (!property) return
    
    setProperty({
      ...property,
      tags: property.tags.includes(tagName) 
        ? property.tags.filter(tag => tag !== tagName)
        : [...property.tags, tagName]
    })
  }

  // Callback to handle evaluation changes
  const handleEvaluationChange = () => {
    setEvaluationChanged(true)
  }

  const _getTagColor = (tagName: string) => {
    const tag = availableTags.find(t => t.name === tagName)
    return tag?.color || '#D3BFA4'
  }

  // Name editing functions
  const startEditingName = () => {
    setEditingName(property?.name || "")
    setIsEditingName(true)
  }

  const cancelEditingName = () => {
    setIsEditingName(false)
    setEditingName("")
  }

  const saveName = async () => {
    if (!property || !editingName.trim()) return

    try {
      const response = await fetch(`/api/properties/${property.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: editingName.trim()
        }),
      })

      if (response.ok) {
        const updatedProperty = await response.json() as Property
        setProperty(updatedProperty)
        setIsEditingName(false)
        setEditingName("")
      } else {
        const errorData = await response.json() as { error: string }
        alert(`Failed to update property name: ${errorData.error}`)
      }
    } catch (error) {
      console.error("Error updating property name:", error)
      alert("Failed to update property name")
    }
  }

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>
  if (!property) return <div>Property not found</div>

  return (
    <div className="min-h-screen bg-ponte-cream">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow border border-ponte-sand p-6 mb-6">
          <div className="flex justify-between items-start">
            <div className="flex items-start space-x-4">
              {/* Featured Image */}
              {property.featuredImage && (
                <div className="flex-shrink-0">
                  <Image
                    src={property.featuredImage}
                    alt="Property featured image"
                    width={64}
                    height={64}
                    className="w-16 h-16 object-contain rounded-lg border-2 border-ponte-sand bg-white"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                </div>
              )}
              
              <div>
                <div className="flex items-center space-x-3">
                  <h1 className="text-3xl font-bold text-ponte-black font-header">
                    {property.propertyNumber && (
                      <span className="text-ponte-terracotta font-mono text-2xl mr-3">
                        P-{property.propertyNumber}
                      </span>
                    )}
                    {isEditingName ? (
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="text-3xl font-bold text-ponte-black font-header bg-transparent border-b-2 border-ponte-terracotta focus:outline-none focus:border-ponte-olive"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            saveName()
                          } else if (e.key === 'Escape') {
                            cancelEditingName()
                          }
                        }}
                      />
                    ) : (
                      <span 
                        onClick={startEditingName}
                        className="cursor-pointer hover:text-ponte-olive transition-colors"
                        title="Click to edit name"
                      >
                        {property.name || `Property ${property.propertyNumber || property.id.slice(-8)}`}
                      </span>
                    )}
                  </h1>
                  {isEditingName ? (
                    <div className="flex space-x-2">
                      <button
                        onClick={saveName}
                        className="px-3 py-1 bg-ponte-olive text-white rounded-md hover:bg-ponte-black transition-colors text-sm"
                        title="Save name"
                      >
                        ✓
                      </button>
                      <button
                        onClick={cancelEditingName}
                        className="px-3 py-1 bg-ponte-sand text-ponte-black rounded-md hover:bg-ponte-olive transition-colors text-sm"
                        title="Cancel editing"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={startEditingName}
                      className="px-3 py-1 bg-ponte-sand text-ponte-black rounded-md hover:bg-ponte-olive transition-colors text-sm"
                      title="Edit name"
                    >
                      ✏️
                    </button>
                  )}
                </div>
                <p className="text-sm text-ponte-olive mt-1 font-body">
                  {property.streetAddress && property.city 
                    ? `${property.streetAddress}, ${property.city}` 
                    : `${property.latitude.toFixed(6)}, ${property.longitude.toFixed(6)}`
                  }
                </p>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => router.push('/properties')}
                className="px-4 py-2 bg-ponte-olive text-white rounded-md hover:bg-ponte-black transition-colors font-body"
              >
                ← Back to Properties
              </button>
            </div>
          </div>
        </div>

        {/* Comprehensive Property Information */}
        <div className="space-y-6">
          {/* SECTION 1 - Property Identification */}
          <div className="bg-white rounded-lg shadow border border-ponte-sand p-6">
            <h2 className="text-lg font-semibold text-ponte-black mb-4 font-header">Property Identification</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-ponte-black font-body">Property Type</label>
                <input
                  type="text"
                  value={property.propertyType || ""}
                  onChange={(e) => setProperty({...property, propertyType: e.target.value})}
                  className="mt-1 block w-full border-ponte-sand rounded-md shadow-sm focus:ring-ponte-terracotta focus:border-ponte-terracotta disabled:bg-ponte-cream font-body"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ponte-black font-body">Status</label>
                <select
                  value={property.status}
                  onChange={(e) => setProperty({...property, status: e.target.value})}
                  className="mt-1 block w-full border-ponte-sand rounded-md shadow-sm focus:ring-ponte-terracotta focus:border-ponte-terracotta disabled:bg-ponte-cream font-body"
                >
                  <option value="active">Active</option>
                  <option value="sold">Sold</option>
                  <option value="rejected">Rejected</option>
                  <option value="under_contract">Under Contract</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-ponte-black font-body">Full Address</label>
                <input
                  type="text"
                  value={property.fullAddress || ""}
                  onChange={(e) => setProperty({...property, fullAddress: e.target.value})}
                  className="mt-1 block w-full border-ponte-sand rounded-md shadow-sm focus:ring-ponte-terracotta focus:border-ponte-terracotta disabled:bg-ponte-cream font-body"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ponte-black font-body">Region</label>
                <input
                  type="text"
                  value={property.region || ""}
                  onChange={(e) => setProperty({...property, region: e.target.value})}
                  className="mt-1 block w-full border-ponte-sand rounded-md shadow-sm focus:ring-ponte-terracotta focus:border-ponte-terracotta disabled:bg-ponte-cream font-body"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ponte-black font-body">Province</label>
                <input
                  type="text"
                  value={property.province || ""}
                  onChange={(e) => setProperty({...property, province: e.target.value})}
                  className="mt-1 block w-full border-ponte-sand rounded-md shadow-sm focus:ring-ponte-terracotta focus:border-ponte-terracotta disabled:bg-ponte-cream font-body"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ponte-black font-body">Listing Type</label>
                <select
                  value={property.listingType || ""}
                  onChange={(e) => setProperty({...property, listingType: e.target.value})}
                  className="mt-1 block w-full border-ponte-sand rounded-md shadow-sm focus:ring-ponte-terracotta focus:border-ponte-terracotta disabled:bg-ponte-cream font-body"
                >
                  <option value="">Select...</option>
                  <option value="for-sale">For Sale</option>
                  <option value="for-rent">For Rent</option>
                  <option value="both">Both</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-ponte-black font-body">Year Built / Last Renovated</label>
                <input
                  type="text"
                  value={property.yearBuiltNew || ""}
                  onChange={(e) => setProperty({...property, yearBuiltNew: e.target.value})}
                  className="mt-1 block w-full border-ponte-sand rounded-md shadow-sm focus:ring-ponte-terracotta focus:border-ponte-terracotta disabled:bg-ponte-cream font-body"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ponte-black font-body">Ownership Type</label>
                <select
                  value={property.ownershipType || ""}
                  onChange={(e) => setProperty({...property, ownershipType: e.target.value})}
                  className="mt-1 block w-full border-ponte-sand rounded-md shadow-sm focus:ring-ponte-terracotta focus:border-ponte-terracotta disabled:bg-ponte-cream font-body"
                >
                  <option value="">Select...</option>
                  <option value="private">Private</option>
                  <option value="company">Company</option>
                  <option value="historical-building">Historical Building</option>
                  <option value="agricultural-land">Agricultural Land</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 2 - Property Description */}
          <div className="bg-white rounded-lg shadow border border-ponte-sand p-6">
            <h2 className="text-lg font-semibold text-ponte-black mb-4 font-header">Property Description</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ponte-black font-body">Short Summary</label>
                <textarea
                  value={property.shortSummary || ""}
                  onChange={(e) => setProperty({...property, shortSummary: e.target.value})}
                  rows={3}
                  className="mt-1 block w-full border-ponte-sand rounded-md shadow-sm focus:ring-ponte-terracotta focus:border-ponte-terracotta disabled:bg-ponte-cream font-body"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ponte-black font-body">Full Description</label>
                <textarea
                  value={property.fullDescription || ""}
                  onChange={(e) => setProperty({...property, fullDescription: e.target.value})}
                  rows={4}
                  className="mt-1 block w-full border-ponte-sand rounded-md shadow-sm focus:ring-ponte-terracotta focus:border-ponte-terracotta disabled:bg-ponte-cream font-body"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-ponte-black font-body">Architectural Style</label>
                  <input
                    type="text"
                    value={property.architecturalStyle || ""}
                    onChange={(e) => setProperty({...property, architecturalStyle: e.target.value})}
                    className="mt-1 block w-full border-ponte-sand rounded-md shadow-sm focus:ring-ponte-terracotta focus:border-ponte-terracotta disabled:bg-ponte-cream font-body"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ponte-black font-body">Orientation</label>
                  <select
                    value={property.orientation || ""}
                    onChange={(e) => setProperty({...property, orientation: e.target.value})}
                    className="mt-1 block w-full border-ponte-sand rounded-md shadow-sm focus:ring-ponte-terracotta focus:border-ponte-terracotta disabled:bg-ponte-cream font-body"
                  >
                    <option value="">Select...</option>
                    <option value="north">North</option>
                    <option value="south">South</option>
                    <option value="east">East</option>
                    <option value="west">West</option>
                    <option value="multiple">Multiple</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-ponte-black font-body">Condition</label>
                  <select
                    value={property.condition || ""}
                    onChange={(e) => setProperty({...property, condition: e.target.value})}
                    className="mt-1 block w-full border-ponte-sand rounded-md shadow-sm focus:ring-ponte-terracotta focus:border-ponte-terracotta disabled:bg-ponte-cream font-body"
                  >
                    <option value="">Select...</option>
                    <option value="new">New</option>
                    <option value="recently-renovated">Recently Renovated</option>
                    <option value="needs-renovation">Needs Renovation</option>
                    <option value="excellent">Excellent</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="poor">Poor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-ponte-black font-body">Energy Efficiency Class</label>
                  <select
                    value={property.energyEfficiencyClass || ""}
                    onChange={(e) => setProperty({...property, energyEfficiencyClass: e.target.value})}
                    className="mt-1 block w-full border-ponte-sand rounded-md shadow-sm focus:ring-ponte-terracotta focus:border-ponte-terracotta disabled:bg-ponte-cream font-body"
                  >
                    <option value="">Select...</option>
                    <option value="A4">A4</option>
                    <option value="A3">A3</option>
                    <option value="A2">A2</option>
                    <option value="A1">A1</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                    <option value="E">E</option>
                    <option value="F">F</option>
                    <option value="G">G</option>
                    <option value="unknown">Unknown</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3 - Size & Layout */}
          <div className="bg-white rounded-lg shadow border border-ponte-sand p-6">
            <h2 className="text-lg font-semibold text-ponte-black mb-4 font-header">Size & Layout</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-ponte-black font-body">Total Living Area (m²)</label>
                <input
                  type="text"
                  value={property.totalLivingArea || ""}
                  onChange={(e) => setProperty({...property, totalLivingArea: e.target.value})}
                  className="mt-1 block w-full border-ponte-sand rounded-md shadow-sm focus:ring-ponte-terracotta focus:border-ponte-terracotta disabled:bg-ponte-cream font-body"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ponte-black font-body">Total Land Size (m² or hectares)</label>
                <input
                  type="text"
                  value={property.totalLandSize || ""}
                  onChange={(e) => setProperty({...property, totalLandSize: e.target.value})}
                  className="mt-1 block w-full border-ponte-sand rounded-md shadow-sm focus:ring-ponte-terracotta focus:border-ponte-terracotta disabled:bg-ponte-cream font-body"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ponte-black font-body">Number of Floors</label>
                <input
                  type="text"
                  value={property.numberOfFloors || ""}
                  onChange={(e) => setProperty({...property, numberOfFloors: e.target.value})}
                  className="mt-1 block w-full border-ponte-sand rounded-md shadow-sm focus:ring-ponte-terracotta focus:border-ponte-terracotta disabled:bg-ponte-cream font-body"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ponte-black font-body">Number of Bedrooms</label>
                <input
                  type="text"
                  value={property.numberOfBedrooms || ""}
                  onChange={(e) => setProperty({...property, numberOfBedrooms: e.target.value})}
                  className="mt-1 block w-full border-ponte-sand rounded-md shadow-sm focus:ring-ponte-terracotta focus:border-ponte-terracotta disabled:bg-ponte-cream font-body"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ponte-black font-body">Number of Bathrooms</label>
                <input
                  type="text"
                  value={property.numberOfBathrooms || ""}
                  onChange={(e) => setProperty({...property, numberOfBathrooms: e.target.value})}
                  className="mt-1 block w-full border-ponte-sand rounded-md shadow-sm focus:ring-ponte-terracotta focus:border-ponte-terracotta disabled:bg-ponte-cream font-body"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ponte-black font-body">Kitchen</label>
                <select
                  value={property.kitchen || ""}
                  onChange={(e) => setProperty({...property, kitchen: e.target.value})}
                  className="mt-1 block w-full border-ponte-sand rounded-md shadow-sm focus:ring-ponte-terracotta focus:border-ponte-terracotta disabled:bg-ponte-cream font-body"
                >
                  <option value="">Select...</option>
                  <option value="open-layout">Open Layout</option>
                  <option value="closed-layout">Closed Layout</option>
                  <option value="no">No</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-ponte-black font-body">Living/Dining Areas</label>
                <select
                  value={property.livingDiningAreas || ""}
                  onChange={(e) => setProperty({...property, livingDiningAreas: e.target.value})}
                  className="mt-1 block w-full border-ponte-sand rounded-md shadow-sm focus:ring-ponte-terracotta focus:border-ponte-terracotta disabled:bg-ponte-cream font-body"
                >
                  <option value="">Select...</option>
                  <option value="combined">Combined</option>
                  <option value="separate">Separate</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-ponte-black font-body">Garage/Parking</label>
                <input
                  type="text"
                  value={property.garageParking || ""}
                  onChange={(e) => setProperty({...property, garageParking: e.target.value})}
                  className="mt-1 block w-full border-ponte-sand rounded-md shadow-sm focus:ring-ponte-terracotta focus:border-ponte-terracotta disabled:bg-ponte-cream font-body"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ponte-black font-body">Outbuildings</label>
                <input
                  type="text"
                  value={property.outbuildings || ""}
                  onChange={(e) => setProperty({...property, outbuildings: e.target.value})}
                  className="mt-1 block w-full border-ponte-sand rounded-md shadow-sm focus:ring-ponte-terracotta focus:border-ponte-terracotta disabled:bg-ponte-cream font-body"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ponte-black font-body">Parking Spaces</label>
                <input
                  type="text"
                  value={property.parkingSpaces || ""}
                  onChange={(e) => setProperty({...property, parkingSpaces: e.target.value})}
                  className="mt-1 block w-full border-ponte-sand rounded-md shadow-sm focus:ring-ponte-terracotta focus:border-ponte-terracotta disabled:bg-ponte-cream font-body"
                />
              </div>
            </div>
            
            {/* Boolean Features */}
            <div className="mt-4">
              <h3 className="text-md font-medium text-ponte-black mb-3 font-header">Features</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={property.officeStudyRoom || false}
                    onChange={(e) => setProperty({...property, officeStudyRoom: e.target.checked})}
                    className="mr-2"
                  />
                  <label className="text-sm font-medium text-ponte-black font-body">Office/Study Room</label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={property.cellarBasement || false}
                    onChange={(e) => setProperty({...property, cellarBasement: e.target.checked})}
                    className="mr-2"
                  />
                  <label className="text-sm font-medium text-ponte-black font-body">Cellar/Basement</label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={property.atticLoft || false}
                    onChange={(e) => setProperty({...property, atticLoft: e.target.checked})}
                    className="mr-2"
                  />
                  <label className="text-sm font-medium text-ponte-black font-body">Attic/Loft</label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={property.terracesBalconies || false}
                    onChange={(e) => setProperty({...property, terracesBalconies: e.target.checked})}
                    className="mr-2"
                  />
                  <label className="text-sm font-medium text-ponte-black font-body">Terraces/Balconies</label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={property.laundryUtilityRoom || false}
                    onChange={(e) => setProperty({...property, laundryUtilityRoom: e.target.checked})}
                    className="mr-2"
                  />
                  <label className="text-sm font-medium text-ponte-black font-body">Laundry/Utility Room</label>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 4 - Utilities & Infrastructure */}
          <div className="bg-white rounded-lg shadow border border-ponte-sand p-6">
            <h2 className="text-lg font-semibold text-ponte-black mb-4 font-header">Utilities & Infrastructure</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-ponte-black font-body">Water Source</label>
                <select
                  value={property.waterSource || ""}
                  onChange={(e) => setProperty({...property, waterSource: e.target.value})}
                  className="mt-1 block w-full border-ponte-sand rounded-md shadow-sm focus:ring-ponte-terracotta focus:border-ponte-terracotta font-body"
                >
                  <option value="">Select water source</option>
                  <option value="municipal">Municipal</option>
                  <option value="well">Well</option>
                  <option value="spring">Spring</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-ponte-black font-body">Heating System</label>
                <div className="mt-2 space-y-2">
                  {['central_heating', 'wood_stove', 'fireplace', 'heat_pump', 'solar', 'other'].map(option => (
                    <label key={option} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={property.heatingSystem?.includes(option) || false}
                        onChange={(e) => {
                          const current = property.heatingSystem || []
                          if (e.target.checked) {
                            setProperty({...property, heatingSystem: [...current, option]})
                          } else {
                            setProperty({...property, heatingSystem: current.filter(item => item !== option)})
                          }
                        }}
                        className="mr-2 rounded border-ponte-sand text-ponte-terracotta focus:ring-ponte-terracotta"
                      />
                      <span className="text-sm text-ponte-black font-body capitalize">{option.replace('_', ' ')}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-ponte-black font-body">Cooling/Air Conditioning</label>
                <label className="flex items-center mt-2">
                  <input
                    type="checkbox"
                    checked={property.coolingAirConditioning || false}
                    onChange={(e) => setProperty({...property, coolingAirConditioning: e.target.checked})}
                    className="mr-2 rounded border-ponte-sand text-ponte-terracotta focus:ring-ponte-terracotta"
                  />
                  <span className="text-sm text-ponte-black font-body">Air conditioning available</span>
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-ponte-black font-body">Electricity Connection</label>
                <label className="flex items-center mt-2">
                  <input
                    type="checkbox"
                    checked={property.electricityConnection || false}
                    onChange={(e) => setProperty({...property, electricityConnection: e.target.checked})}
                    className="mr-2 rounded border-ponte-sand text-ponte-terracotta focus:ring-ponte-terracotta"
                  />
                  <span className="text-sm text-ponte-black font-body">Electricity connected</span>
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-ponte-black font-body">Sewage Type</label>
                <select
                  value={property.sewageType || ""}
                  onChange={(e) => setProperty({...property, sewageType: e.target.value})}
                  className="mt-1 block w-full border-ponte-sand rounded-md shadow-sm focus:ring-ponte-terracotta focus:border-ponte-terracotta font-body"
                >
                  <option value="">Select sewage type</option>
                  <option value="municipal">Municipal</option>
                  <option value="septic">Septic tank</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-ponte-black font-body">Internet Availability</label>
                <select
                  value={property.internetAvailability || ""}
                  onChange={(e) => setProperty({...property, internetAvailability: e.target.value})}
                  className="mt-1 block w-full border-ponte-sand rounded-md shadow-sm focus:ring-ponte-terracotta focus:border-ponte-terracotta font-body"
                >
                  <option value="">Select internet availability</option>
                  <option value="fiber">Fiber optic</option>
                  <option value="adsl">ADSL</option>
                  <option value="mobile">Mobile broadband</option>
                  <option value="none">Not available</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-ponte-black font-body">Solar/Renewable Energy</label>
                <input
                  type="text"
                  value={property.solarRenewableEnergy || ""}
                  onChange={(e) => setProperty({...property, solarRenewableEnergy: e.target.value})}
                  placeholder="Describe renewable energy features"
                  className="mt-1 block w-full border-ponte-sand rounded-md shadow-sm focus:ring-ponte-terracotta focus:border-ponte-terracotta font-body"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ponte-black font-body">Road Access Condition</label>
                <select
                  value={property.roadAccessCondition || ""}
                  onChange={(e) => setProperty({...property, roadAccessCondition: e.target.value})}
                  className="mt-1 block w-full border-ponte-sand rounded-md shadow-sm focus:ring-ponte-terracotta focus:border-ponte-terracotta font-body"
                >
                  <option value="">Select road access</option>
                  <option value="excellent">Excellent</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 5 - Outdoor Features & Amenities */}
          <div className="bg-white rounded-lg shadow border border-ponte-sand p-6">
            <h2 className="text-lg font-semibold text-ponte-black mb-4 font-header">Outdoor Features & Amenities</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-ponte-black font-body">Swimming Pool</label>
                <select
                  value={property.swimmingPool || ""}
                  onChange={(e) => setProperty({...property, swimmingPool: e.target.value})}
                  className="mt-1 block w-full border-ponte-sand rounded-md shadow-sm focus:ring-ponte-terracotta focus:border-ponte-terracotta font-body"
                >
                  <option value="">Select pool type</option>
                  <option value="none">No pool</option>
                  <option value="private">Private pool</option>
                  <option value="shared">Shared pool</option>
                  <option value="community">Community pool</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-ponte-black font-body">Garden/Landscaping</label>
                <input
                  type="text"
                  value={property.gardenLandscaping || ""}
                  onChange={(e) => setProperty({...property, gardenLandscaping: e.target.value})}
                  placeholder="Describe garden and landscaping"
                  className="mt-1 block w-full border-ponte-sand rounded-md shadow-sm focus:ring-ponte-terracotta focus:border-ponte-terracotta font-body"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ponte-black font-body">Olive Grove/Vineyard</label>
                <input
                  type="text"
                  value={property.oliveGroveVineyard || ""}
                  onChange={(e) => setProperty({...property, oliveGroveVineyard: e.target.value})}
                  placeholder="Describe agricultural features"
                  className="mt-1 block w-full border-ponte-sand rounded-md shadow-sm focus:ring-ponte-terracotta focus:border-ponte-terracotta font-body"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ponte-black font-body">Patio/Courtyard</label>
                <label className="flex items-center mt-2">
                  <input
                    type="checkbox"
                    checked={property.patioCourtyard || false}
                    onChange={(e) => setProperty({...property, patioCourtyard: e.target.checked})}
                    className="mr-2 rounded border-ponte-sand text-ponte-terracotta focus:ring-ponte-terracotta"
                  />
                  <span className="text-sm text-ponte-black font-body">Patio or courtyard available</span>
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-ponte-black font-body">Outdoor Kitchen/BBQ</label>
                <label className="flex items-center mt-2">
                  <input
                    type="checkbox"
                    checked={property.outdoorKitchenBBQ || false}
                    onChange={(e) => setProperty({...property, outdoorKitchenBBQ: e.target.checked})}
                    className="mr-2 rounded border-ponte-sand text-ponte-terracotta focus:ring-ponte-terracotta"
                  />
                  <span className="text-sm text-ponte-black font-body">Outdoor kitchen/BBQ area</span>
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-ponte-black font-body">Views</label>
                <div className="mt-2 space-y-2">
                  {['sea', 'mountain', 'countryside', 'city', 'garden', 'pool'].map(view => (
                    <label key={view} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={property.viewTypes?.includes(view) || false}
                        onChange={(e) => {
                          const current = property.viewTypes || []
                          if (e.target.checked) {
                            setProperty({...property, viewTypes: [...current, view]})
                          } else {
                            setProperty({...property, viewTypes: current.filter(item => item !== view)})
                          }
                        }}
                        className="mr-2 rounded border-ponte-sand text-ponte-terracotta focus:ring-ponte-terracotta"
                      />
                      <span className="text-sm text-ponte-black font-body capitalize">{view}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-ponte-black font-body">Fencing/Gates</label>
                <input
                  type="text"
                  value={property.fencingGates || ""}
                  onChange={(e) => setProperty({...property, fencingGates: e.target.value})}
                  placeholder="Describe fencing and gates"
                  className="mt-1 block w-full border-ponte-sand rounded-md shadow-sm focus:ring-ponte-terracotta focus:border-ponte-terracotta font-body"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ponte-black font-body">Parking Spaces</label>
                <input
                  type="text"
                  value={property.parkingSpaces || ""}
                  onChange={(e) => setProperty({...property, parkingSpaces: e.target.value})}
                  placeholder="Number and type of parking spaces"
                  className="mt-1 block w-full border-ponte-sand rounded-md shadow-sm focus:ring-ponte-terracotta focus:border-ponte-terracotta font-body"
                />
              </div>
            </div>
          </div>

          {/* SECTION 6 - Location & Proximity */}
          <div className="bg-white rounded-lg shadow border border-ponte-sand p-6">
            <h2 className="text-lg font-semibold text-ponte-black mb-4 font-header">Location & Proximity</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-ponte-black font-body">Nearest Town</label>
                <input
                  type="text"
                  value={property.nearestTown || ""}
                  onChange={(e) => setProperty({...property, nearestTown: e.target.value})}
                  className="mt-1 block w-full border-ponte-sand rounded-md shadow-sm focus:ring-ponte-terracotta focus:border-ponte-terracotta font-body"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ponte-black font-body">Distance to Nearest Town (km)</label>
                <input
                  type="text"
                  value={property.distanceToNearestTown || ""}
                  onChange={(e) => setProperty({...property, distanceToNearestTown: e.target.value})}
                  className="mt-1 block w-full border-ponte-sand rounded-md shadow-sm focus:ring-ponte-terracotta focus:border-ponte-terracotta font-body"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ponte-black font-body">Distance to Coast (km)</label>
                <input
                  type="text"
                  value={property.distanceToCoast || ""}
                  onChange={(e) => setProperty({...property, distanceToCoast: e.target.value})}
                  className="mt-1 block w-full border-ponte-sand rounded-md shadow-sm focus:ring-ponte-terracotta focus:border-ponte-terracotta font-body"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ponte-black font-body">Distance to Airport (km)</label>
                <input
                  type="text"
                  value={property.distanceToAirport || ""}
                  onChange={(e) => setProperty({...property, distanceToAirport: e.target.value})}
                  className="mt-1 block w-full border-ponte-sand rounded-md shadow-sm focus:ring-ponte-terracotta focus:border-ponte-terracotta font-body"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ponte-black font-body">Distance to Train Station (km)</label>
                <input
                  type="text"
                  value={property.distanceToTrainStation || ""}
                  onChange={(e) => setProperty({...property, distanceToTrainStation: e.target.value})}
                  className="mt-1 block w-full border-ponte-sand rounded-md shadow-sm focus:ring-ponte-terracotta focus:border-ponte-terracotta font-body"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ponte-black font-body">Distance to Services (km)</label>
                <input
                  type="text"
                  value={property.distanceToServices || ""}
                  onChange={(e) => setProperty({...property, distanceToServices: e.target.value})}
                  className="mt-1 block w-full border-ponte-sand rounded-md shadow-sm focus:ring-ponte-terracotta focus:border-ponte-terracotta font-body"
                />
              </div>
              <div className="md:col-span-2 lg:col-span-3">
                <label className="block text-sm font-medium text-ponte-black font-body">Notable Attractions</label>
                <textarea
                  value={property.notableAttractions || ""}
                  onChange={(e) => setProperty({...property, notableAttractions: e.target.value})}
                  rows={3}
                  placeholder="List nearby attractions, landmarks, or points of interest"
                  className="mt-1 block w-full border-ponte-sand rounded-md shadow-sm focus:ring-ponte-terracotta focus:border-ponte-terracotta font-body"
                />
              </div>
            </div>
          </div>

          {/* SECTION 8 - Visuals & Media */}
          <div className="bg-white rounded-lg shadow border border-ponte-sand p-6">
            <h2 className="text-lg font-semibold text-ponte-black mb-4 font-header">Visuals & Media</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ponte-black font-body">Virtual Tour Link</label>
                <input
                  type="url"
                  value={property.virtualTourLink || ""}
                  onChange={(e) => setProperty({...property, virtualTourLink: e.target.value})}
                  placeholder="https://..."
                  className="mt-1 block w-full border-ponte-sand rounded-md shadow-sm focus:ring-ponte-terracotta focus:border-ponte-terracotta font-body"
                />
              </div>
            </div>
          </div>

          {/* SECTION 7 - Legal & Financial Details */}
          <div className="bg-white rounded-lg shadow border border-ponte-sand p-6">
            <h2 className="text-lg font-semibold text-ponte-black mb-4 font-header">Legal & Financial Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-ponte-black font-body">Asking Price (€)</label>
                <input
                  type="text"
                  value={property.askingPrice || ""}
                  onChange={(e) => setProperty({...property, askingPrice: e.target.value})}
                  className="mt-1 block w-full border-ponte-sand rounded-md shadow-sm focus:ring-ponte-terracotta focus:border-ponte-terracotta disabled:bg-ponte-cream font-body"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ponte-black font-body">Agency Commission</label>
                <input
                  type="text"
                  value={property.agencyCommission || ""}
                  onChange={(e) => setProperty({...property, agencyCommission: e.target.value})}
                  className="mt-1 block w-full border-ponte-sand rounded-md shadow-sm focus:ring-ponte-terracotta focus:border-ponte-terracotta disabled:bg-ponte-cream font-body"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ponte-black font-body">Annual Property Tax (IMU)</label>
                <input
                  type="text"
                  value={property.annualPropertyTax || ""}
                  onChange={(e) => setProperty({...property, annualPropertyTax: e.target.value})}
                  className="mt-1 block w-full border-ponte-sand rounded-md shadow-sm focus:ring-ponte-terracotta focus:border-ponte-terracotta disabled:bg-ponte-cream font-body"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ponte-black font-body">Utility Costs Estimate</label>
                <input
                  type="text"
                  value={property.utilityCostsEstimate || ""}
                  onChange={(e) => setProperty({...property, utilityCostsEstimate: e.target.value})}
                  className="mt-1 block w-full border-ponte-sand rounded-md shadow-sm focus:ring-ponte-terracotta focus:border-ponte-terracotta disabled:bg-ponte-cream font-body"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ponte-black font-body">Urban Planning Compliance</label>
                <input
                  type="text"
                  value={property.urbanPlanningCompliance || ""}
                  onChange={(e) => setProperty({...property, urbanPlanningCompliance: e.target.value})}
                  className="mt-1 block w-full border-ponte-sand rounded-md shadow-sm focus:ring-ponte-terracotta focus:border-ponte-terracotta disabled:bg-ponte-cream font-body"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ponte-black font-body">Easements/Restrictions</label>
                <input
                  type="text"
                  value={property.easementsRestrictions || ""}
                  onChange={(e) => setProperty({...property, easementsRestrictions: e.target.value})}
                  className="mt-1 block w-full border-ponte-sand rounded-md shadow-sm focus:ring-ponte-terracotta focus:border-ponte-terracotta disabled:bg-ponte-cream font-body"
                />
              </div>
            </div>
            
            {/* Boolean Financial Features */}
            <div className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={property.negotiable || false}
                    onChange={(e) => setProperty({...property, negotiable: e.target.checked})}
                    className="mr-2"
                  />
                  <label className="text-sm font-medium text-ponte-black font-body">Negotiable</label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={property.ownershipDocumentsAvailable || false}
                    onChange={(e) => setProperty({...property, ownershipDocumentsAvailable: e.target.checked})}
                    className="mr-2"
                  />
                  <label className="text-sm font-medium text-ponte-black font-body">Ownership Documents Available</label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={property.propertyCurrentlyOccupied || false}
                    onChange={(e) => setProperty({...property, propertyCurrentlyOccupied: e.target.checked})}
                    className="mr-2"
                  />
                  <label className="text-sm font-medium text-ponte-black font-body">Property Currently Occupied</label>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 9 - Additional Notes */}
          <div className="bg-white rounded-lg shadow border border-ponte-sand p-6">
            <h2 className="text-lg font-semibold text-ponte-black mb-4 font-header">Additional Notes</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ponte-black font-body">Additional Notes</label>
                <textarea
                  value={property.additionalNotes || ""}
                  onChange={(e) => setProperty({...property, additionalNotes: e.target.value})}
                  rows={3}
                  className="mt-1 block w-full border-ponte-sand rounded-md shadow-sm focus:ring-ponte-terracotta focus:border-ponte-terracotta disabled:bg-ponte-cream font-body"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ponte-black font-body">Recommended Selling Points</label>
                <textarea
                  value={property.recommendedSellingPoints || ""}
                  onChange={(e) => setProperty({...property, recommendedSellingPoints: e.target.value})}
                  rows={3}
                  className="mt-1 block w-full border-ponte-sand rounded-md shadow-sm focus:ring-ponte-terracotta focus:border-ponte-terracotta disabled:bg-ponte-cream font-body"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ponte-black font-body">Suggested Renovation Potential</label>
                <textarea
                  value={property.suggestedRenovationPotential || ""}
                  onChange={(e) => setProperty({...property, suggestedRenovationPotential: e.target.value})}
                  rows={3}
                  className="mt-1 block w-full border-ponte-sand rounded-md shadow-sm focus:ring-ponte-terracotta focus:border-ponte-terracotta disabled:bg-ponte-cream font-body"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Tags Section */}
        <div className="mt-6 bg-white rounded-lg shadow border border-ponte-sand p-6">
          <h2 className="text-lg font-semibold text-ponte-black mb-4 font-header">Property Tags</h2>
          <div className="flex flex-wrap gap-2">
            {availableTags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => handleTagToggle(tag.name)}
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
                  property.tags.includes(tag.name)
                    ? 'bg-ponte-terracotta text-white border-ponte-terracotta'
                    : 'bg-white text-ponte-black border-ponte-sand hover:bg-ponte-sand'
                } cursor-pointer`}
                style={{ 
                  backgroundColor: property.tags.includes(tag.name) ? tag.color : undefined,
                  borderColor: property.tags.includes(tag.name) ? tag.color : undefined
                }}
              >
                {tag.name}
              </button>
            ))}
          </div>
          {availableTags.length === 0 && (
            <p className="text-sm text-ponte-olive font-body">No tags available. Create tags in Settings.</p>
          )}
        </div>

        {/* Property Files & Media */}
        <div className="mt-6 bg-white rounded-lg shadow border border-ponte-sand p-6">
          <h2 className="text-lg font-semibold text-ponte-black mb-4 font-header">Property Files & Media</h2>
          <PropertyFileManager
            propertyId={property.id}
            propertyPhotos={property.propertyPhotos || []}
            documents={[
              ...(Array.isArray(property.floorPlans) ? property.floorPlans : []),
              ...(Array.isArray(property.dronePhotos) ? property.dronePhotos : []),
              ...(Array.isArray(property.energyCertificate) ? property.energyCertificate : [])
            ] as (string[] | FileInfo[])}
            onPropertyPhotosChange={(photos) => setProperty(prev => ({...prev!, propertyPhotos: photos}))}
            onDocumentsChange={(documents) => {
              // Split documents back into the original arrays
              // For now, we'll just store them all in one of the existing fields
              // This is a simplified approach - in a real app you might want to preserve the original structure
              setProperty(prev => ({...prev!, floorPlans: documents}))
            }}
            virtualTourLink={property.virtualTourLink}
            onVirtualTourLinkChange={(link) => setProperty(prev => ({...prev!, virtualTourLink: link}))}
            featuredImage={property.featuredImage}
            onFeaturedImageChange={async (imageUrl) => {
              setProperty(prev => ({...prev!, featuredImage: imageUrl}))
              // Auto-save the featured image change
              try {
                const response = await fetch(`/api/properties/${property.id}`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ ...property, featuredImage: imageUrl })
                })
                if (!response.ok) {
                  console.error("Failed to save featured image")
                }
              } catch (error) {
                console.error("Error saving featured image:", error)
              }
            }}
          />
        </div>

        {/* Team Notes */}
        <div className="mt-6">
          <div className="bg-white rounded-lg shadow-sm border border-ponte-sand p-6">
            <h3 className="text-lg font-semibold text-ponte-black font-body mb-4">Team Notes</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Peter Notes */}
              <div>
                <label className="block text-sm font-medium text-ponte-black font-body mb-2">
                  Peter Notes
                </label>
                <textarea
                  value={property.peterNotes || ''}
                  onChange={(e) => setProperty(prev => ({...prev!, peterNotes: e.target.value}))}
                  className="w-full border-ponte-sand rounded-md shadow-sm focus:ring-ponte-terracotta focus:border-ponte-terracotta font-body"
                  rows={4}
                  placeholder="Peter's notes about this property..."
                />
              </div>

              {/* Wes Notes */}
              <div>
                <label className="block text-sm font-medium text-ponte-black font-body mb-2">
                  Wes Notes
                </label>
                <textarea
                  value={property.wesNotes || ''}
                  onChange={(e) => setProperty(prev => ({...prev!, wesNotes: e.target.value}))}
                  className="w-full border-ponte-sand rounded-md shadow-sm focus:ring-ponte-terracotta focus:border-ponte-terracotta font-body"
                  rows={4}
                  placeholder="Wes's notes about this property..."
                />
              </div>

              {/* Elena Notes */}
              <div>
                <label className="block text-sm font-medium text-ponte-black font-body mb-2">
                  Elena Notes
                </label>
                <textarea
                  value={property.elenaNotes || ''}
                  onChange={(e) => setProperty(prev => ({...prev!, elenaNotes: e.target.value}))}
                  className="w-full border-ponte-sand rounded-md shadow-sm focus:ring-ponte-terracotta focus:border-ponte-terracotta font-body"
                  rows={4}
                  placeholder="Elena's notes about this property..."
                />
              </div>

              {/* Hazel Notes */}
              <div>
                <label className="block text-sm font-medium text-ponte-black font-body mb-2">
                  Hazel Notes
                </label>
                <textarea
                  value={property.hazelNotes || ''}
                  onChange={(e) => setProperty(prev => ({...prev!, hazelNotes: e.target.value}))}
                  className="w-full border-ponte-sand rounded-md shadow-sm focus:ring-ponte-terracotta focus:border-ponte-terracotta font-body"
                  rows={4}
                  placeholder="Hazel's notes about this property..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Distance Details */}
        <div className="mt-6">
          <div className="bg-white rounded-lg shadow-sm border border-ponte-sand p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-ponte-black font-body">Distance Details</h3>
              <div className="flex items-center space-x-3">
                <label className="flex items-center text-sm text-ponte-black">
                  <input
                    type="checkbox"
                    checked={avoidTolls}
                    onChange={(e) => setAvoidTolls(e.target.checked)}
                    className="mr-2 rounded border-ponte-sand text-ponte-terracotta focus:ring-ponte-terracotta"
                  />
                  Avoid Tolls
                </label>
                <button
                  onClick={calculateDistances}
                  disabled={loadingDistances}
                  className="px-4 py-2 bg-ponte-olive text-white rounded-md hover:bg-ponte-olive/90 disabled:opacity-50 text-sm font-body"
                >
                  {loadingDistances ? 'Calculating...' : 'Calculate Distances'}
                </button>
                <button
                  onClick={fetchDistances}
                  disabled={loadingDistances}
                  className="px-4 py-2 bg-ponte-terracotta text-white rounded-md hover:bg-ponte-terracotta/90 disabled:opacity-50 text-sm font-body"
                >
                  {loadingDistances ? 'Loading...' : 'Refresh Distances'}
                </button>
              </div>
            </div>
            
            {loadingDistances ? (
              <div className="text-center py-8 text-ponte-olive">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ponte-terracotta mx-auto mb-4"></div>
                <p>Loading distance data...</p>
              </div>
            ) : (distances || []).length > 0 ? (
              <div className="space-y-6">
                {(() => {
                  // Group destinations by category
                  console.log('Destinations in reduce:', destinations, 'Type:', typeof destinations, 'Is Array:', Array.isArray(destinations))
                  console.log('Distances in reduce:', distances, 'Type:', typeof distances, 'Is Array:', Array.isArray(distances))
                  const categories = (destinations || []).reduce((acc: Record<string, Destination[]>, dest: Destination) => {
                    const category = dest.category || 'Other'
                    if (!acc[category]) {
                      acc[category] = []
                    }
                    acc[category].push(dest)
                    return acc
                  }, {} as Record<string, Destination[]>)

                  console.log('Categories created:', categories)
                  console.log('Category entries:', Object.entries(categories))

                  return Object.entries(categories).map(([category, categoryDestinations]: [string, Destination[]]) => {
                    const categoryDistances = (distances || []).filter((d: Distance) => 
                      categoryDestinations.some((dest: Destination) => dest.id === d.destinationId)
                    )
                    
                    console.log(`Category ${category} - Destinations:`, categoryDestinations.length, 'Distances:', categoryDistances.length)

                    const isExpanded = expandedCategories.has(category)
                    
                    return (
                      <div key={category} className="border border-ponte-sand rounded-lg">
                        <button
                          onClick={() => toggleCategory(category)}
                          className="w-full flex justify-between items-center p-4 text-left hover:bg-ponte-sand/20 transition-colors"
                        >
                          <h4 className="text-md font-semibold text-ponte-black font-body capitalize">
                            {category} ({categoryDistances.length} destinations)
                          </h4>
                          <div className="flex items-center">
                            <span className="text-sm text-ponte-olive mr-2">
                              {isExpanded ? 'Hide' : 'Show'}
                            </span>
                            <svg
                              className={`w-4 h-4 text-ponte-olive transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </button>
                        {isExpanded && (
                          <div className="px-4 pb-4">
                            <div className="space-y-2">
                              {categoryDistances.map((distance: Distance, _index) => {
                                const destination = destinations.find((d: Destination) => d.id === distance.destinationId)
                                if (!destination) return null
                                
                                return (
                                  <div key={distance.destinationId} className="py-3 px-3 bg-ponte-cream rounded">
                                    <div className="flex justify-between items-start mb-2">
                                      <span className="text-sm font-medium text-ponte-black font-body">
                                        {destination.name}
                                      </span>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                                      {/* Driving */}
                                      <div className="flex flex-col">
                                        <span className="text-ponte-olive font-medium">🚗 Driving</span>
                                        <span className="text-ponte-black">
                                          {distance.drivingDistance ? `${Math.round(distance.drivingDistance / 1000)}km` : 'N/A'}
                                        </span>
                                        <span className="text-ponte-olive">
                                          {formatDuration(distance.drivingDuration ? distance.drivingDuration / 60 : null)}
                                        </span>
                                      </div>
                                      
                                      {/* Transit */}
                                      <div className="flex flex-col">
                                        <span className="text-ponte-olive font-medium">🚌 Transit</span>
                                        <span className="text-ponte-black">
                                          {distance.transitDistance ? `${Math.round(distance.transitDistance / 1000)}km` : 'N/A'}
                                        </span>
                                        <span className="text-ponte-olive">
                                          {formatDuration(distance.transitDuration ? distance.transitDuration / 60 : null)}
                                        </span>
                                      </div>
                                      
                                      {/* Walking */}
                                      <div className="flex flex-col">
                                        <span className="text-ponte-olive font-medium">🚶 Walking</span>
                                        <span className="text-ponte-black">
                                          {distance.walkingDistance ? `${Math.round(distance.walkingDistance / 1000)}km` : 'N/A'}
                                        </span>
                                        <span className="text-ponte-olive">
                                          {formatDuration(distance.walkingDuration ? distance.walkingDuration / 60 : null)}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })
                })()}
              </div>
            ) : (
              <div className="text-center py-8 text-ponte-olive">
                <p>No distance data available for this property.</p>
                <p className="text-sm mt-2">Distance calculations need to be run from the Analysis page first.</p>
              </div>
            )}
          </div>
        </div>

        {/* Property Evaluation */}
        <div className="mt-6">
          <PropertyEvaluationDashboard 
            propertyId={property.id} 
            propertyName={property.name}
            onEvaluationChange={handleEvaluationChange}
          />
        </div>
      </div>

      {/* Sticky Save Button */}
      <div className="fixed right-6 top-1/2 transform -translate-y-1/2 z-50">
        <button
          onClick={handleSave}
          disabled={saving || !hasUnsavedChanges()}
          className={`px-6 py-3 rounded-lg shadow-lg transition-all duration-200 font-body font-medium flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed ${
            hasUnsavedChanges() 
              ? "bg-ponte-terracotta text-white hover:bg-ponte-terracotta/90" 
              : "bg-ponte-sand text-ponte-black cursor-default"
          }`}
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Saving...</span>
            </>
          ) : hasUnsavedChanges() ? (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span>Save Changes</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>All Saved</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
