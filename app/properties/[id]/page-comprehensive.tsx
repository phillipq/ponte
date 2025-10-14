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
  const [availableTags, setAvailableTags] = useState<Array<{id: string, name: string, color: string}>>([])

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
      return
    }

    if (status === "authenticated") {
      fetchProperty()
      fetchAvailableTags()
    }
  }, [status, id, router])

  const fetchProperty = async () => {
    try {
      const response = await fetch(`/api/properties/${id}`)
      if (response.ok) {
        const data = await response.json()
        setProperty(data)
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
        setEditing(false)
        alert("Property updated successfully!")
      } else {
        const errorData = await response.json()
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
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow border border-ponte-sand p-6 mb-6">
          <div className="flex justify-between items-start">
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
            <div className="flex space-x-3">
              <button
                onClick={() => router.push('/properties')}
                className="px-4 py-2 bg-ponte-olive text-white rounded-md hover:bg-ponte-black transition-colors font-body"
              >
                ← Back to Properties
              </button>
              <button
                onClick={() => setEditing(!editing)}
                className="px-4 py-2 bg-ponte-terracotta text-white rounded-md hover:bg-ponte-terracotta/80 transition-colors font-body"
              >
                {editing ? 'Cancel' : 'Edit'}
              </button>
              {editing && (
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 bg-ponte-olive text-white rounded-md hover:bg-ponte-olive/80 transition-colors font-body disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              )}
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
                <label className="block text-sm font-medium text-ponte-black font-body">Full Address</label>
                <input
                  type="text"
                  value={property.fullAddress || ""}
                  onChange={(e) => setProperty({...property, fullAddress: e.target.value})}
                  disabled={!editing}
                  className="mt-1 block w-full border-ponte-sand rounded-md shadow-sm focus:ring-ponte-terracotta focus:border-ponte-terracotta disabled:bg-ponte-cream font-body"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ponte-black font-body">Region</label>
                <input
                  type="text"
                  value={property.region || ""}
                  onChange={(e) => setProperty({...property, region: e.target.value})}
                  disabled={!editing}
                  className="mt-1 block w-full border-ponte-sand rounded-md shadow-sm focus:ring-ponte-terracotta focus:border-ponte-terracotta disabled:bg-ponte-cream font-body"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ponte-black font-body">Province</label>
                <input
                  type="text"
                  value={property.province || ""}
                  onChange={(e) => setProperty({...property, province: e.target.value})}
                  disabled={!editing}
                  className="mt-1 block w-full border-ponte-sand rounded-md shadow-sm focus:ring-ponte-terracotta focus:border-ponte-terracotta disabled:bg-ponte-cream font-body"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ponte-black font-body">Listing Type</label>
                <select
                  value={property.listingType || ""}
                  onChange={(e) => setProperty({...property, listingType: e.target.value})}
                  disabled={!editing}
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
                  disabled={!editing}
                  className="mt-1 block w-full border-ponte-sand rounded-md shadow-sm focus:ring-ponte-terracotta focus:border-ponte-terracotta disabled:bg-ponte-cream font-body"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ponte-black font-body">Ownership Type</label>
                <select
                  value={property.ownershipType || ""}
                  onChange={(e) => setProperty({...property, ownershipType: e.target.value})}
                  disabled={!editing}
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
                  disabled={!editing}
                  rows={3}
                  className="mt-1 block w-full border-ponte-sand rounded-md shadow-sm focus:ring-ponte-terracotta focus:border-ponte-terracotta disabled:bg-ponte-cream font-body"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ponte-black font-body">Full Description</label>
                <textarea
                  value={property.fullDescription || ""}
                  onChange={(e) => setProperty({...property, fullDescription: e.target.value})}
                  disabled={!editing}
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
                    disabled={!editing}
                    className="mt-1 block w-full border-ponte-sand rounded-md shadow-sm focus:ring-ponte-terracotta focus:border-ponte-terracotta disabled:bg-ponte-cream font-body"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ponte-black font-body">Orientation</label>
                  <select
                    value={property.orientation || ""}
                    onChange={(e) => setProperty({...property, orientation: e.target.value})}
                    disabled={!editing}
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
                    disabled={!editing}
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
                    disabled={!editing}
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
                  disabled={!editing}
                  className="mt-1 block w-full border-ponte-sand rounded-md shadow-sm focus:ring-ponte-terracotta focus:border-ponte-terracotta disabled:bg-ponte-cream font-body"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ponte-black font-body">Total Land Size (m² or hectares)</label>
                <input
                  type="text"
                  value={property.totalLandSize || ""}
                  onChange={(e) => setProperty({...property, totalLandSize: e.target.value})}
                  disabled={!editing}
                  className="mt-1 block w-full border-ponte-sand rounded-md shadow-sm focus:ring-ponte-terracotta focus:border-ponte-terracotta disabled:bg-ponte-cream font-body"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ponte-black font-body">Number of Floors</label>
                <input
                  type="text"
                  value={property.numberOfFloors || ""}
                  onChange={(e) => setProperty({...property, numberOfFloors: e.target.value})}
                  disabled={!editing}
                  className="mt-1 block w-full border-ponte-sand rounded-md shadow-sm focus:ring-ponte-terracotta focus:border-ponte-terracotta disabled:bg-ponte-cream font-body"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ponte-black font-body">Number of Bedrooms</label>
                <input
                  type="text"
                  value={property.numberOfBedrooms || ""}
                  onChange={(e) => setProperty({...property, numberOfBedrooms: e.target.value})}
                  disabled={!editing}
                  className="mt-1 block w-full border-ponte-sand rounded-md shadow-sm focus:ring-ponte-terracotta focus:border-ponte-terracotta disabled:bg-ponte-cream font-body"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ponte-black font-body">Number of Bathrooms</label>
                <input
                  type="text"
                  value={property.numberOfBathrooms || ""}
                  onChange={(e) => setProperty({...property, numberOfBathrooms: e.target.value})}
                  disabled={!editing}
                  className="mt-1 block w-full border-ponte-sand rounded-md shadow-sm focus:ring-ponte-terracotta focus:border-ponte-terracotta disabled:bg-ponte-cream font-body"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ponte-black font-body">Kitchen</label>
                <select
                  value={property.kitchen || ""}
                  onChange={(e) => setProperty({...property, kitchen: e.target.value})}
                  disabled={!editing}
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
                  disabled={!editing}
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
                  disabled={!editing}
                  className="mt-1 block w-full border-ponte-sand rounded-md shadow-sm focus:ring-ponte-terracotta focus:border-ponte-terracotta disabled:bg-ponte-cream font-body"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ponte-black font-body">Outbuildings</label>
                <input
                  type="text"
                  value={property.outbuildings || ""}
                  onChange={(e) => setProperty({...property, outbuildings: e.target.value})}
                  disabled={!editing}
                  className="mt-1 block w-full border-ponte-sand rounded-md shadow-sm focus:ring-ponte-terracotta focus:border-ponte-terracotta disabled:bg-ponte-cream font-body"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ponte-black font-body">Parking Spaces</label>
                <input
                  type="text"
                  value={property.parkingSpaces || ""}
                  onChange={(e) => setProperty({...property, parkingSpaces: e.target.value})}
                  disabled={!editing}
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
                    disabled={!editing}
                    className="mr-2"
                  />
                  <label className="text-sm font-medium text-ponte-black font-body">Office/Study Room</label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={property.cellarBasement || false}
                    onChange={(e) => setProperty({...property, cellarBasement: e.target.checked})}
                    disabled={!editing}
                    className="mr-2"
                  />
                  <label className="text-sm font-medium text-ponte-black font-body">Cellar/Basement</label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={property.atticLoft || false}
                    onChange={(e) => setProperty({...property, atticLoft: e.target.checked})}
                    disabled={!editing}
                    className="mr-2"
                  />
                  <label className="text-sm font-medium text-ponte-black font-body">Attic/Loft</label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={property.terracesBalconies || false}
                    onChange={(e) => setProperty({...property, terracesBalconies: e.target.checked})}
                    disabled={!editing}
                    className="mr-2"
                  />
                  <label className="text-sm font-medium text-ponte-black font-body">Terraces/Balconies</label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={property.laundryUtilityRoom || false}
                    onChange={(e) => setProperty({...property, laundryUtilityRoom: e.target.checked})}
                    disabled={!editing}
                    className="mr-2"
                  />
                  <label className="text-sm font-medium text-ponte-black font-body">Laundry/Utility Room</label>
                </div>
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
                  disabled={!editing}
                  className="mt-1 block w-full border-ponte-sand rounded-md shadow-sm focus:ring-ponte-terracotta focus:border-ponte-terracotta disabled:bg-ponte-cream font-body"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ponte-black font-body">Agency Commission</label>
                <input
                  type="text"
                  value={property.agencyCommission || ""}
                  onChange={(e) => setProperty({...property, agencyCommission: e.target.value})}
                  disabled={!editing}
                  className="mt-1 block w-full border-ponte-sand rounded-md shadow-sm focus:ring-ponte-terracotta focus:border-ponte-terracotta disabled:bg-ponte-cream font-body"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ponte-black font-body">Annual Property Tax (IMU)</label>
                <input
                  type="text"
                  value={property.annualPropertyTax || ""}
                  onChange={(e) => setProperty({...property, annualPropertyTax: e.target.value})}
                  disabled={!editing}
                  className="mt-1 block w-full border-ponte-sand rounded-md shadow-sm focus:ring-ponte-terracotta focus:border-ponte-terracotta disabled:bg-ponte-cream font-body"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ponte-black font-body">Utility Costs Estimate</label>
                <input
                  type="text"
                  value={property.utilityCostsEstimate || ""}
                  onChange={(e) => setProperty({...property, utilityCostsEstimate: e.target.value})}
                  disabled={!editing}
                  className="mt-1 block w-full border-ponte-sand rounded-md shadow-sm focus:ring-ponte-terracotta focus:border-ponte-terracotta disabled:bg-ponte-cream font-body"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ponte-black font-body">Urban Planning Compliance</label>
                <input
                  type="text"
                  value={property.urbanPlanningCompliance || ""}
                  onChange={(e) => setProperty({...property, urbanPlanningCompliance: e.target.value})}
                  disabled={!editing}
                  className="mt-1 block w-full border-ponte-sand rounded-md shadow-sm focus:ring-ponte-terracotta focus:border-ponte-terracotta disabled:bg-ponte-cream font-body"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ponte-black font-body">Easements/Restrictions</label>
                <input
                  type="text"
                  value={property.easementsRestrictions || ""}
                  onChange={(e) => setProperty({...property, easementsRestrictions: e.target.value})}
                  disabled={!editing}
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
                    disabled={!editing}
                    className="mr-2"
                  />
                  <label className="text-sm font-medium text-ponte-black font-body">Negotiable</label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={property.ownershipDocumentsAvailable || false}
                    onChange={(e) => setProperty({...property, ownershipDocumentsAvailable: e.target.checked})}
                    disabled={!editing}
                    className="mr-2"
                  />
                  <label className="text-sm font-medium text-ponte-black font-body">Ownership Documents Available</label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={property.propertyCurrentlyOccupied || false}
                    onChange={(e) => setProperty({...property, propertyCurrentlyOccupied: e.target.checked})}
                    disabled={!editing}
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
                  disabled={!editing}
                  rows={3}
                  className="mt-1 block w-full border-ponte-sand rounded-md shadow-sm focus:ring-ponte-terracotta focus:border-ponte-terracotta disabled:bg-ponte-cream font-body"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ponte-black font-body">Recommended Selling Points</label>
                <textarea
                  value={property.recommendedSellingPoints || ""}
                  onChange={(e) => setProperty({...property, recommendedSellingPoints: e.target.value})}
                  disabled={!editing}
                  rows={3}
                  className="mt-1 block w-full border-ponte-sand rounded-md shadow-sm focus:ring-ponte-terracotta focus:border-ponte-terracotta disabled:bg-ponte-cream font-body"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ponte-black font-body">Suggested Renovation Potential</label>
                <textarea
                  value={property.suggestedRenovationPotential || ""}
                  onChange={(e) => setProperty({...property, suggestedRenovationPotential: e.target.value})}
                  disabled={!editing}
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

        {/* Property Images */}
        <div className="mt-6">
          <PropertyImageManager propertyId={property.id} />
        </div>

        {/* Property Evaluation */}
        <div className="mt-6">
          <PropertyEvaluationDashboard propertyId={property.id} />
        </div>
      </div>
    </div>
  )
}
