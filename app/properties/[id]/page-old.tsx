"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import Navigation from "components/Navigation"
import PropertyImageManager from "components/PropertyImageManager"
import PropertyEvaluationDashboard from "components/PropertyEvaluationDashboard"

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
  propertyPhotos?: string[]
  floorPlans?: string[]
  dronePhotos?: string[]
  energyCertificate?: string[]
  virtualTourLink?: string
  
  // SECTION 9 - Additional Notes (from JSON form)
  additionalNotes?: string
  recommendedSellingPoints?: string
  suggestedRenovationPotential?: string
  
  // Legacy fields for compatibility
  propertyNumber?: number
  status: string
  createdAt: string
  updatedAt: string
}

export default function PropertyDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const { data: session, status } = useSession()
  const [property, setProperty] = useState<Property | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [scraping, setScraping] = useState(false)
  const [scrapeUrl, setScrapeUrl] = useState("")
  const [availableTags, setAvailableTags] = useState<Array<{id: string, name: string, color: string}>>([])

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
      return
    }

    if (status === "authenticated" && id) {
      fetchProperty()
      fetchAvailableTags()
    }
  }, [status, id, router])

  const fetchProperty = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/properties/${id}`)
      
      if (response.ok) {
        const data = await response.json() as Property
        setProperty(data)
      } else {
        setError("Property not found")
      }
    } catch (error) {
      setError("Failed to load property")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!property) return

    try {
      setSaving(true)
      const response = await fetch(`/api/properties/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(property)
      })

      if (response.ok) {
        setEditing(false)
        // Show success message
      } else {
        setError("Failed to save property")
      }
    } catch (error) {
      setError("Failed to save property")
    } finally {
      setSaving(false)
    }
  }

  const handleScrapeProperty = async () => {
    if (!scrapeUrl.trim()) return

    try {
      setScraping(true)
      setError("")
      
      const response = await fetch("/api/properties/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: scrapeUrl })
      })

      if (response.ok) {
        const data = await response.json() as any
        const scrapedData = data.data
        
        // Check if AI parsing failed or manual entry is required
        if (scrapedData.name === "AI parsing failed" || scrapedData.name === "AI parsing error" || scrapedData.name === "Content extraction failed" || scrapedData.name === "Manual Entry Required") {
          // Don't treat this as an error - it's helpful guidance
          setError("") // Clear any previous errors
          setProperty(prev => ({
            ...prev!,
            propertyLink: scrapeUrl
          }))
          // Show the manual entry form by setting a special state
          setError("MANUAL_ENTRY_REQUIRED:" + (scrapedData.guidance || "Please enter the details manually."))
          // Show a brief success message
          setTimeout(() => {
            setError("MANUAL_ENTRY_REQUIRED:" + (scrapedData.guidance || "Please enter the details manually."))
          }, 100)
        } else {
          // Update property with scraped data
          setProperty(prev => ({
            ...prev!,
            propertyLink: scrapeUrl,
            name: scrapedData.name || prev?.name,
            sellPrice: scrapedData.price || prev?.sellPrice,
            homeSizeM2: scrapedData.size || prev?.homeSizeM2,
            rooms: scrapedData.rooms || prev?.rooms,
            bathrooms: scrapedData.bathrooms || prev?.bathrooms,
            yearBuilt: scrapedData.yearBuilt || prev?.yearBuilt,
            propertyType: scrapedData.propertyType || prev?.propertyType,
            streetAddress: scrapedData.address || prev?.streetAddress,
            city: scrapedData.city || prev?.city,
            postalCode: scrapedData.postalCode || prev?.postalCode,
            picturesUploaded: scrapedData.images || prev?.picturesUploaded || []
          }))
        }
        
        setScrapeUrl("")
      } else {
        const errorData = await response.json() as any
        setError(errorData.error || "Failed to scrape property data")
      }
    } catch (error) {
      setError("Failed to scrape property data")
    } finally {
      setScraping(false)
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

  const handleTagToggle = (tagName: string) => {
    if (!property) return
    
    setProperty({
      ...property,
      tags: property.tags.includes(tagName) 
        ? property.tags.filter(tag => tag !== tagName)
        : [...property.tags, tagName]
    })
  }


  const getTagColor = (tagName: string) => {
    const tag = availableTags.find(t => t.name === tagName)
    return tag?.color || '#D3BFA4'
  }

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>
  if (!property) return <div>Property not found</div>

  return (
    <div className="min-h-screen bg-ponte-cream">
      <Navigation />
      
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow border border-ponte-sand p-6 mb-6">
          <div className="flex justify-between items-start">
            <div className="flex items-start space-x-4">
              {/* Featured Image */}
              {property.featuredImage && (
                <div className="flex-shrink-0">
                  <img
                    src={property.featuredImage}
                    alt="Property featured image"
                    className="w-20 h-20 object-cover rounded-lg border-2 border-ponte-sand"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                </div>
              )}
              
              <div>
                <h1 className="text-3xl font-bold text-ponte-black font-header">
                  {property.propertyNumber && (
                    <span className="text-ponte-terracotta font-mono text-2xl mr-3">
                      P-{property.propertyNumber}
                    </span>
                  )}
                  {property.name || `Property ${property.propertyNumber || property.id.slice(-8)}`}
                </h1>
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
              <button
                onClick={() => setEditing(!editing)}
                className="px-4 py-2 bg-ponte-terracotta text-white rounded-md hover:bg-accent-600 transition-colors font-body"
              >
                {editing ? "Cancel" : "Edit"}
              </button>
              {editing && (
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors font-body"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Property Scraping Section */}
        {editing && (
          <div className="bg-white rounded-lg shadow border border-ponte-sand p-6 mb-6">
            <h2 className="text-lg font-semibold text-ponte-black mb-4 font-header">🔍 Auto-Fill from Property URL</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ponte-black mb-2 font-body">
                  Property URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={scrapeUrl}
                    onChange={(e) => setScrapeUrl(e.target.value)}
                    className="flex-1 border-ponte-sand rounded-md shadow-sm focus:ring-ponte-terracotta focus:border-ponte-terracotta font-body"
                    placeholder="https://www.idealista.it/en/immobile/..."
                  />
                  <button
                    onClick={handleScrapeProperty}
                    disabled={scraping || !scrapeUrl.trim()}
                    className="px-4 py-2 bg-ponte-terracotta text-white rounded-md hover:bg-accent-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-body"
                  >
                    {scraping ? "Scraping..." : "Auto-Fill"}
                  </button>
                </div>
                <p className="text-xs text-ponte-olive mt-1 font-body">
                  🤖 Paste a property listing URL to automatically extract price, size, rooms, and other details using AI
                </p>
                <p className="text-xs text-ponte-terracotta mt-1 font-body">
                  ✨ This uses AI to intelligently parse property information from the page content, bypassing anti-bot protection
                </p>
              </div>
              
              {/* Success message when property link is saved */}
              {property.propertyLink && !error.includes("MANUAL_ENTRY_REQUIRED:") && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-xs text-green-700">
                    ✅ Property link saved: <a href={property.propertyLink} target="_blank" rel="noopener noreferrer" className="underline">{property.propertyLink}</a>
                  </p>
                </div>
              )}

              {/* Manual entry fallback when AI parsing fails */}
              {error && error.includes("MANUAL_ENTRY_REQUIRED:") && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-800 mb-2">📝 Manual Entry Required</h4>
                  <p className="text-xs text-blue-700 mb-3">
                    {error.replace("MANUAL_ENTRY_REQUIRED:", "")}
                  </p>
                  <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded">
                    <p className="text-xs text-green-700">
                      ✅ Property link saved: <a href={property.propertyLink} target="_blank" rel="noopener noreferrer" className="underline">{property.propertyLink}</a>
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-ponte-black font-body">Price (€)</label>
                      <input
                        type="number"
                        value={property.sellPrice || ""}
                        onChange={(e) => setProperty({...property, sellPrice: parseFloat(e.target.value) || undefined})}
                        className="mt-1 block w-full text-sm border-ponte-sand rounded-md shadow-sm focus:ring-ponte-terracotta focus:border-ponte-terracotta font-body"
                        placeholder="e.g., 150000"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-ponte-black font-body">Size (m²)</label>
                      <input
                        type="number"
                        value={property.homeSizeM2 || ""}
                        onChange={(e) => setProperty({...property, homeSizeM2: parseFloat(e.target.value) || undefined})}
                        className="mt-1 block w-full text-sm border-ponte-sand rounded-md shadow-sm focus:ring-ponte-terracotta focus:border-ponte-terracotta font-body"
                        placeholder="e.g., 120"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-ponte-black font-body">Rooms</label>
                      <input
                        type="number"
                        value={property.rooms || ""}
                        onChange={(e) => setProperty({...property, rooms: parseInt(e.target.value) || undefined})}
                        className="mt-1 block w-full text-sm border-ponte-sand rounded-md shadow-sm focus:ring-ponte-terracotta focus:border-ponte-terracotta font-body"
                        placeholder="e.g., 3"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-ponte-black font-body">Bathrooms</label>
                      <input
                        type="number"
                        value={property.bathrooms || ""}
                        onChange={(e) => setProperty({...property, bathrooms: parseInt(e.target.value) || undefined})}
                        className="mt-1 block w-full text-sm border-ponte-sand rounded-md shadow-sm focus:ring-ponte-terracotta focus:border-ponte-terracotta font-body"
                        placeholder="e.g., 2"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Display scraped images if any */}
              {property.picturesUploaded && property.picturesUploaded.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-ponte-black font-body mb-2">
                    Scraped Images ({property.picturesUploaded.length})
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {property.picturesUploaded.map((imageUrl, index) => (
                      <div key={index} className="relative">
                        <img
                          src={imageUrl}
                          alt={`Property image ${index + 1}`}
                          className="w-full h-24 object-cover rounded border"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                        <button
                          onClick={() => {
                            setProperty(prev => ({
                              ...prev!,
                              picturesUploaded: prev?.picturesUploaded?.filter((_, i) => i !== index) || []
                            }))
                          }}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Property Information Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow border border-ponte-sand p-6">
            <h2 className="text-lg font-semibold text-ponte-black mb-4 font-header">Basic Information</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-ponte-black font-body">Property Type</label>
                <input
                  type="text"
                  value={property.propertyType || ""}
                  onChange={(e) => setProperty({...property, propertyType: e.target.value})}
                  disabled={!editing}
                  className="mt-1 block w-full border-ponte-sand rounded-md shadow-sm focus:ring-ponte-terracotta focus:border-ponte-terracotta disabled:bg-ponte-cream font-body"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ponte-black font-body">Status</label>
                <select
                  value={property.status}
                  onChange={(e) => setProperty({...property, status: e.target.value})}
                  disabled={!editing}
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
                <label className="block text-sm font-medium text-ponte-black font-body">Property Number</label>
                <input
                  type="text"
                  value={property.propertyNumber || ""}
                  onChange={(e) => setProperty({...property, propertyNumber: e.target.value})}
                  disabled={!editing}
                  className="mt-1 block w-full border-ponte-sand rounded-md shadow-sm focus:ring-ponte-terracotta focus:border-ponte-terracotta disabled:bg-ponte-cream font-body"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ponte-black font-body">Who Provided</label>
                <input
                  type="text"
                  value={property.whoProvided || ""}
                  onChange={(e) => setProperty({...property, whoProvided: e.target.value})}
                  disabled={!editing}
                  className="mt-1 block w-full border-ponte-sand rounded-md shadow-sm focus:ring-ponte-terracotta focus:border-ponte-terracotta disabled:bg-ponte-cream font-body"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ponte-black font-body">Property Link</label>
                <input
                  type="url"
                  value={property.propertyLink || ""}
                  onChange={(e) => setProperty({...property, propertyLink: e.target.value})}
                  disabled={!editing}
                  className="mt-1 block w-full border-ponte-sand rounded-md shadow-sm focus:ring-ponte-terracotta focus:border-ponte-terracotta disabled:bg-ponte-cream font-body"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ponte-black font-body">Date Added</label>
                <input
                  type="date"
                  value={property.dateAdded ? new Date(property.dateAdded).toISOString().split('T')[0] : ""}
                  onChange={(e) => setProperty({...property, dateAdded: e.target.value})}
                  disabled={!editing}
                  className="mt-1 block w-full border-ponte-sand rounded-md shadow-sm focus:ring-ponte-terracotta focus:border-ponte-terracotta disabled:bg-ponte-cream font-body"
                />
              </div>
            </div>
          </div>

          {/* Financial Information */}
          <div className="bg-white rounded-lg shadow border border-ponte-sand p-6">
            <h2 className="text-lg font-semibold text-ponte-black mb-4 font-header">Financial Information</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-ponte-black font-body">Sell Price (€)</label>
                <input
                  type="number"
                  value={property.sellPrice || ""}
                  onChange={(e) => setProperty({...property, sellPrice: parseFloat(e.target.value) || undefined})}
                  disabled={!editing}
                  className="mt-1 block w-full border-ponte-sand rounded-md shadow-sm focus:ring-ponte-terracotta focus:border-ponte-terracotta disabled:bg-ponte-cream font-body"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ponte-black font-body">Home Size (m²)</label>
                <input
                  type="number"
                  value={property.homeSizeM2 || ""}
                  onChange={(e) => setProperty({...property, homeSizeM2: parseFloat(e.target.value) || undefined})}
                  disabled={!editing}
                  className="mt-1 block w-full border-ponte-sand rounded-md shadow-sm focus:ring-ponte-terracotta focus:border-ponte-terracotta disabled:bg-ponte-cream font-body"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ponte-black font-body">Price per m² (€)</label>
                <input
                  type="number"
                  value={property.pricePerM2 || ""}
                  onChange={(e) => setProperty({...property, pricePerM2: parseFloat(e.target.value) || undefined})}
                  disabled={!editing}
                  className="mt-1 block w-full border-ponte-sand rounded-md shadow-sm focus:ring-ponte-terracotta focus:border-ponte-terracotta disabled:bg-ponte-cream font-body"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ponte-black font-body">Land Size (m²)</label>
                <input
                  type="number"
                  value={property.landSizeM2 || ""}
                  onChange={(e) => setProperty({...property, landSizeM2: parseFloat(e.target.value) || undefined})}
                  disabled={!editing}
                  className="mt-1 block w-full border-ponte-sand rounded-md shadow-sm focus:ring-ponte-terracotta focus:border-ponte-terracotta disabled:bg-ponte-cream font-body"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ponte-black font-body">Year Built</label>
                <input
                  type="number"
                  value={property.yearBuilt || ""}
                  onChange={(e) => setProperty({...property, yearBuilt: parseInt(e.target.value) || undefined})}
                  disabled={!editing}
                  className="mt-1 block w-full border-ponte-sand rounded-md shadow-sm focus:ring-ponte-terracotta focus:border-ponte-terracotta disabled:bg-ponte-cream font-body"
                />
              </div>
            </div>
          </div>

          {/* Property Condition */}
          <div className="bg-white rounded-lg shadow border border-ponte-sand p-6">
            <h2 className="text-lg font-semibold text-ponte-black mb-4 font-header">Property Condition</h2>
            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={property.foundationGood || false}
                  onChange={(e) => setProperty({...property, foundationGood: e.target.checked})}
                  disabled={!editing}
                  className="h-4 w-4 text-ponte-terracotta focus:ring-ponte-terracotta border-ponte-sand rounded"
                />
                <label className="ml-2 text-sm text-ponte-black font-body">Foundation Good</label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={property.roofGood || false}
                  onChange={(e) => setProperty({...property, roofGood: e.target.checked})}
                  disabled={!editing}
                  className="h-4 w-4 text-ponte-terracotta focus:ring-ponte-terracotta border-ponte-sand rounded"
                />
                <label className="ml-2 text-sm text-ponte-black font-body">Roof Good</label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={property.extraBuildings || false}
                  onChange={(e) => setProperty({...property, extraBuildings: e.target.checked})}
                  disabled={!editing}
                  className="h-4 w-4 text-ponte-terracotta focus:ring-ponte-terracotta border-ponte-sand rounded"
                />
                <label className="ml-2 text-sm text-ponte-black font-body">Extra Buildings</label>
              </div>
              <div>
                <label className="block text-sm font-medium text-ponte-black font-body">Rooms</label>
                <input
                  type="number"
                  value={property.rooms || ""}
                  onChange={(e) => setProperty({...property, rooms: parseInt(e.target.value) || undefined})}
                  disabled={!editing}
                  className="mt-1 block w-full border-ponte-sand rounded-md shadow-sm focus:ring-ponte-terracotta focus:border-ponte-terracotta disabled:bg-ponte-cream font-body"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ponte-black font-body">Bathrooms</label>
                <input
                  type="number"
                  value={property.bathrooms || ""}
                  onChange={(e) => setProperty({...property, bathrooms: parseInt(e.target.value) || undefined})}
                  disabled={!editing}
                  className="mt-1 block w-full border-ponte-sand rounded-md shadow-sm focus:ring-ponte-terracotta focus:border-ponte-terracotta disabled:bg-ponte-cream font-body"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Team Notes Section */}
        <div className="mt-6 bg-white rounded-lg shadow border border-ponte-sand p-6">
          <h2 className="text-lg font-semibold text-ponte-black mb-4 font-header">Team Notes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-ponte-black font-body mb-2">Peter's Notes</label>
              <textarea
                value={property.peterNotes || ""}
                onChange={(e) => setProperty({...property, peterNotes: e.target.value})}
                disabled={!editing}
                rows={4}
                className="w-full border-ponte-sand rounded-md shadow-sm focus:ring-ponte-terracotta focus:border-ponte-terracotta disabled:bg-ponte-cream font-body"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ponte-black font-body mb-2">Wes's Notes</label>
              <textarea
                value={property.wesNotes || ""}
                onChange={(e) => setProperty({...property, wesNotes: e.target.value})}
                disabled={!editing}
                rows={4}
                className="w-full border-ponte-sand rounded-md shadow-sm focus:ring-ponte-terracotta focus:border-ponte-terracotta disabled:bg-ponte-cream font-body"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ponte-black font-body mb-2">Elena's Notes</label>
              <textarea
                value={property.elenaNotes || ""}
                onChange={(e) => setProperty({...property, elenaNotes: e.target.value})}
                disabled={!editing}
                rows={4}
                className="w-full border-ponte-sand rounded-md shadow-sm focus:ring-ponte-terracotta focus:border-ponte-terracotta disabled:bg-ponte-cream font-body"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ponte-black font-body mb-2">Hazel's Notes</label>
              <textarea
                value={property.hazelNotes || ""}
                onChange={(e) => setProperty({...property, hazelNotes: e.target.value})}
                disabled={!editing}
                rows={4}
                className="w-full border-ponte-sand rounded-md shadow-sm focus:ring-ponte-terracotta focus:border-ponte-terracotta disabled:bg-ponte-cream font-body"
              />
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
                disabled={!editing}
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
                  property.tags.includes(tag.name)
                    ? 'bg-ponte-terracotta text-white border-ponte-terracotta'
                    : 'bg-white text-ponte-black border-ponte-sand hover:bg-ponte-sand'
                } ${!editing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
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

        {/* Decision & Scoring */}
        <div className="mt-6 bg-white rounded-lg shadow border border-ponte-sand p-6">
          <h2 className="text-lg font-semibold text-ponte-black mb-4 font-header">Decision & Scoring</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-ponte-black font-body">Decision</label>
              <select
                value={property.decision || ""}
                onChange={(e) => setProperty({...property, decision: e.target.value})}
                disabled={!editing}
                className="mt-1 block w-full border-ponte-sand rounded-md shadow-sm focus:ring-ponte-terracotta focus:border-ponte-terracotta disabled:bg-ponte-cream font-body"
              >
                <option value="">Select Decision</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
                <option value="Maybe">Maybe</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-ponte-black font-body">Manual Score (1-10)</label>
              <input
                type="number"
                min="1"
                max="10"
                value={property.manualScore || ""}
                onChange={(e) => setProperty({...property, manualScore: parseInt(e.target.value) || undefined})}
                disabled={!editing}
                className="mt-1 block w-full border-ponte-sand rounded-md shadow-sm focus:ring-ponte-terracotta focus:border-ponte-terracotta disabled:bg-ponte-cream font-body"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ponte-black font-body">AI Score</label>
              <input
                type="number"
                step="0.1"
                value={property.aiScore || ""}
                onChange={(e) => setProperty({...property, aiScore: parseFloat(e.target.value) || undefined})}
                disabled={!editing}
                className="mt-1 block w-full border-ponte-sand rounded-md shadow-sm focus:ring-ponte-terracotta focus:border-ponte-terracotta disabled:bg-ponte-cream font-body"
              />
            </div>
          </div>
        </div>

        {/* Property Evaluation Dashboard */}
        <div className="mt-6">
          <PropertyEvaluationDashboard 
            propertyId={property.id} 
            propertyName={property.name}
          />
        </div>

        {/* Property Images Section */}
        <div className="mt-6 bg-white rounded-lg shadow border border-ponte-sand p-6">
          <h2 className="text-lg font-semibold text-ponte-black mb-4 font-header">Property Images</h2>
          <PropertyImageManager
            propertyId={property.id}
            images={property.picturesUploaded || []}
            onImagesChange={(newImages) => setProperty(prev => ({...prev!, picturesUploaded: newImages}))}
            googleDriveLink={property.pictures || ""}
            onGoogleDriveLinkChange={(link) => setProperty(prev => ({...prev!, pictures: link}))}
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
      </div>
    </div>
  )
}
