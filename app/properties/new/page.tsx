"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import Navigation from "components/Navigation"

export default function NewProperty() {
  const { data: _session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Form data - comprehensive structure based on JSON
  const [formData, setFormData] = useState({
    // Section 1 - Property Identification
    name: "",
    fullAddress: "",
    region: "",
    province: "",
    latitude: "",
    longitude: "",
    listingType: "",
    propertyType: "",
    yearBuiltNew: "",
    ownershipType: "",
    
    // Section 2 - Property Description
    shortSummary: "",
    fullDescription: "",
    architecturalStyle: "",
    orientation: "",
    condition: "",
    energyEfficiencyClass: "",
    
    // Section 3 - Size & Layout
    totalLivingArea: "",
    totalLandSize: "",
    numberOfFloors: "",
    numberOfBedrooms: "",
    numberOfBathrooms: "",
    kitchen: "",
    livingDiningAreas: "",
    officeStudyRoom: false,
    cellarBasement: false,
    atticLoft: false,
    garageParking: "",
    outbuildings: "",
    terracesBalconies: false,
    laundryUtilityRoom: false,
    
    // Section 4 - Utilities & Infrastructure
    waterSource: "",
    heatingSystem: [] as string[],
    coolingAirConditioning: false,
    electricityConnection: false,
    sewageType: "",
    internetAvailability: "",
    solarRenewableEnergy: "",
    roadAccessCondition: "",
    
    // Section 5 - Outdoor Features & Amenities
    swimmingPool: "",
    gardenLandscaping: "",
    oliveGroveVineyard: "",
    patioCourtyard: false,
    outdoorKitchenBBQ: false,
    viewTypes: [] as string[],
    fencingGates: "",
    parkingSpaces: "",
    
    // Section 6 - Location & Proximity
    nearestTown: "",
    distanceToNearestTown: "",
    distanceToCoast: "",
    distanceToAirport: "",
    distanceToTrainStation: "",
    distanceToServices: "",
    notableAttractions: "",
    
    // Section 7 - Legal & Financial Details
    askingPrice: "",
    negotiable: false,
    agencyCommission: "",
    annualPropertyTax: "",
    utilityCostsEstimate: "",
    ownershipDocumentsAvailable: false,
    urbanPlanningCompliance: "",
    propertyCurrentlyOccupied: false,
    easementsRestrictions: "",
    
    // Section 8 - Visuals & Media
    propertyPhotos: [] as File[],
    floorPlans: [] as File[],
    dronePhotos: [] as File[],
    energyCertificate: [] as File[],
    virtualTourLink: "",
    
    // Section 9 - Additional Notes
    additionalNotes: "",
    recommendedSellingPoints: "",
    suggestedRenovationPotential: "",
    
    // Legacy fields for compatibility
    recipientName: "",
    streetAddress: "",
    postalCode: "",
    city: "",
    country: "ITALY",
    tags: [] as string[],
    pictures: [] as string[]
  })

  const [availableTags, setAvailableTags] = useState<Array<{id: string, name: string, color: string}>>([])
  const [geocodingResult, setGeocodingResult] = useState<unknown>(null)
  const [geocodingLoading, setGeocodingLoading] = useState(false)
  const [uploadedPictures, setUploadedPictures] = useState<File[]>([])
  const [picturePreview, setPicturePreview] = useState<string[]>([])

  // Property type options from JSON
  const propertyTypes = [
    { value: "villa", label: "Villa", icon: "/logos/icon-estate.png" },
    { value: "country-house", label: "Country House", icon: "/logos/icon-house.png" },
    { value: "apartment", label: "Apartment", icon: "/logos/icon-apartment.png" },
    { value: "palazzo", label: "Palazzo", icon: "/logos/icon-estate.png" },
    { value: "farmhouse", label: "Farmhouse", icon: "/logos/icon-house.png" },
    { value: "trullo", label: "Trullo", icon: "/logos/icon-house.png" },
    { value: "historical-building", label: "Historical Building", icon: "/logos/icon-estate.png" },
    { value: "other", label: "Other", icon: "/logos/icon-house.png" },
  ]

  // Region options from JSON
  const regions = [
    "Marche", "Tuscany", "Umbria", "Puglia", "Abruzzo", "Sicily", "Sardinia", "Other"
  ]

  // Listing type options from JSON
  const listingTypes = [
    { value: "for-sale", label: "For Sale" },
    { value: "for-rent", label: "For Rent" },
    { value: "both", label: "Both" }
  ]

  // Ownership type options from JSON
  const ownershipTypes = [
    { value: "private", label: "Private" },
    { value: "company", label: "Company" },
    { value: "historical-building", label: "Historical Building" },
    { value: "agricultural-land", label: "Agricultural Land" }
  ]

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
      return
    }
    setLoading(false)
    fetchAvailableTags()
  }, [status, router])

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

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      picturePreview.forEach(url => {
        if (url) {
          URL.revokeObjectURL(url)
        }
      })
    }
  }, [picturePreview])

  const handleGeocode = async () => {
    if (!formData.fullAddress.trim()) {
      setError("Please enter a full address")
      return
    }

    setGeocodingLoading(true)
    setError("")

    try {
      const response = await fetch("/api/geocoding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ address: formData.fullAddress }),
      })

      const data = await response.json() as { result?: unknown; error?: string }

      if (response.ok) {
        setGeocodingResult(data.result)
        setFormData(prev => ({
          ...prev,
          latitude: data.result.latitude.toString(),
          longitude: data.result.longitude.toString()
        }))
      } else {
        setError(data.error || "Failed to geocode address")
      }
    } catch {
      setError("Failed to geocode address")
    } finally {
      setGeocodingLoading(false)
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

  const handlePictureUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    
    // Validate file types
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    const validFiles = files.filter(file => validTypes.includes(file.type))
    
    if (validFiles.length !== files.length) {
      setError("Some files are not valid image formats. Please select JPG, PNG, or WebP files.")
      return
    }
    
    // Validate file sizes (max 5MB each)
    const oversizedFiles = validFiles.filter(file => file.size > 5 * 1024 * 1024)
    if (oversizedFiles.length > 0) {
      setError("Some files are too large. Maximum size is 5MB per image.")
      return
    }
    
    // Check total number of pictures (max 10)
    if (uploadedPictures.length + validFiles.length > 10) {
      setError("Maximum 10 pictures allowed. Please remove some pictures first.")
      return
    }
    
    setUploadedPictures(prev => [...prev, ...validFiles])
    
    // Create preview URLs
    const newPreviews = validFiles.map(file => URL.createObjectURL(file))
    setPicturePreview(prev => [...prev, ...newPreviews])
  }

  const removePicture = (index: number) => {
    setUploadedPictures(prev => prev.filter((_, i) => i !== index))
    setPicturePreview(prev => {
      const newPreviews = [...prev]
      if (newPreviews[index]) {
        URL.revokeObjectURL(newPreviews[index])
      }
      return newPreviews.filter((_, i) => i !== index)
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError("")
    setSuccess("")

    try {
      // Validate required fields
      if (!formData.name.trim()) {
        setError("Property name is required")
        return
      }

      // Convert string coordinates to numbers
      const latitude = parseFloat(formData.latitude)
      const longitude = parseFloat(formData.longitude)
      
      if (isNaN(latitude) || isNaN(longitude)) {
        setError("Valid latitude and longitude coordinates are required")
        return
      }

      const processedFormData = {
        ...formData,
        latitude,
        longitude,
        uploadedPictures: uploadedPictures.map(file => ({
          name: file.name,
          size: file.size,
          type: file.type
        }))
      }

      console.log("Sending data to API:", processedFormData)

      const response = await fetch("/api/properties", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(processedFormData),
      })

      const data = await response.json() as { success?: boolean; property?: unknown; error?: string }

      if (!response.ok) {
        console.error("API Error:", data)
        setError(data.error || "Failed to create property")
        return
      }

      if (response.ok) {
        setSuccess("Property created successfully!")
        // Reset form
        setFormData({
          // Section 1 - Property Identification
          name: "",
          fullAddress: "",
          region: "",
          province: "",
          latitude: "",
          longitude: "",
          listingType: "",
          propertyType: "",
          yearBuiltNew: "",
          ownershipType: "",
          
          // Section 2 - Property Description
          shortSummary: "",
          fullDescription: "",
          architecturalStyle: "",
          orientation: "",
          condition: "",
          energyEfficiencyClass: "",
          
          // Section 3 - Size & Layout
          totalLivingArea: "",
          totalLandSize: "",
          numberOfFloors: "",
          numberOfBedrooms: "",
          numberOfBathrooms: "",
          kitchen: "",
          livingDiningAreas: "",
          officeStudyRoom: false,
          cellarBasement: false,
          atticLoft: false,
          garageParking: "",
          outbuildings: "",
          terracesBalconies: false,
          laundryUtilityRoom: false,
          
          // Section 4 - Utilities & Infrastructure
          waterSource: "",
          heatingSystem: [],
          coolingAirConditioning: false,
          electricityConnection: false,
          sewageType: "",
          internetAvailability: "",
          solarRenewableEnergy: "",
          roadAccessCondition: "",
          
          // Section 5 - Outdoor Features & Amenities
          swimmingPool: "",
          gardenLandscaping: "",
          oliveGroveVineyard: "",
          patioCourtyard: false,
          outdoorKitchenBBQ: false,
          viewTypes: [],
          fencingGates: "",
          parkingSpaces: "",
          
          // Section 6 - Location & Proximity
          nearestTown: "",
          distanceToNearestTown: "",
          distanceToCoast: "",
          distanceToAirport: "",
          distanceToTrainStation: "",
          distanceToServices: "",
          notableAttractions: "",
          
          // Section 7 - Legal & Financial Details
          askingPrice: "",
          negotiable: false,
          agencyCommission: "",
          annualPropertyTax: "",
          utilityCostsEstimate: "",
          ownershipDocumentsAvailable: false,
          urbanPlanningCompliance: "",
          propertyCurrentlyOccupied: false,
          easementsRestrictions: "",
          
          // Section 8 - Visuals & Media
          propertyPhotos: [],
          floorPlans: [],
          dronePhotos: [],
          energyCertificate: [],
          virtualTourLink: "",
          
          // Section 9 - Additional Notes
          additionalNotes: "",
          recommendedSellingPoints: "",
          suggestedRenovationPotential: "",
          
          // Legacy fields for compatibility
          recipientName: "",
          streetAddress: "",
          postalCode: "",
          city: "",
          country: "ITALY",
          tags: [],
          pictures: []
        })
        setGeocodingResult(null)
        setUploadedPictures([])
        setPicturePreview([])
        // Redirect to properties page after 2 seconds
        setTimeout(() => {
          router.push("/properties")
        }, 2000)
      } else {
        setError(data.error || "Failed to create property")
      }
    } catch {
      setError("Failed to create property")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-ponte-cream flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ponte-olive mx-auto"></div>
          <p className="mt-4 text-ponte-olive">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-ponte-cream">
      <Navigation />
      
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-ponte-sand">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <Image
                  src="/logos/icon-property.png"
                  alt="Property"
                  width={32}
                  height={32}
                  className="w-8 h-8"
                />
                <div>
                  <h1 className="text-2xl font-bold text-ponte-black font-serif">
                    Add New Property
                  </h1>
                  <p className="text-ponte-olive font-medium">
                    Create a comprehensive property listing
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={() => router.push("/properties")}
              className="text-ponte-olive hover:text-ponte-black transition-colors font-medium px-3 py-2 rounded-lg hover:bg-gray-50 flex items-center space-x-2"
            >
              <span>←</span>
              <span>Back to Properties</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-ponte-sand">
          <div className="px-6 py-4 border-b border-ponte-sand">
            <div className="flex items-center space-x-3">
              <Image
                src="/logos/icon-property.png"
                alt="Property Information"
                width={20}
                height={20}
                className="w-5 h-5"
              />
              <div>
                <h2 className="text-lg font-semibold text-ponte-black font-serif">Property Information</h2>
                <p className="text-sm text-ponte-olive mt-1">
                  Fill out the details for your property listing
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* SECTION 1 - Property Identification */}
              <div className="bg-ponte-cream p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-ponte-black mb-4 font-serif">Section 1 – Property Identification</h3>
                
                {/* Property Name */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-ponte-black mb-2">
                    Property Name / Reference ID *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full rounded-md border-ponte-sand shadow-sm focus:border-ponte-olive focus:ring-ponte-olive"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Villa Toscana, Modern Apartment"
                  />
                </div>

                {/* Full Address */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-ponte-black mb-2">
                    Full Address (Street, Town, Province, Postal Code) *
                  </label>
                  <div className="flex gap-2">
                    <textarea
                      required
                      rows={3}
                      className="flex-1 rounded-md border-ponte-sand shadow-sm focus:border-ponte-olive focus:ring-ponte-olive"
                      value={formData.fullAddress}
                      onChange={(e) => setFormData({ ...formData, fullAddress: e.target.value })}
                      placeholder="e.g., Via Roma 123, Florence, Tuscany, 50100"
                    />
                    <button
                      type="button"
                      onClick={handleGeocode}
                      disabled={geocodingLoading || !formData.fullAddress.trim()}
                      className="bg-ponte-olive text-white px-4 py-2 rounded-lg hover:bg-ponte-olive/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
                    >
                      {geocodingLoading ? "Geocoding..." : "Get GPS"}
                    </button>
                  </div>
                  
                  {geocodingResult && (
                    <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
                      <p className="text-sm text-green-800">
                        ✅ Coordinates found: {geocodingResult.latitude.toFixed(6)}, {geocodingResult.longitude.toFixed(6)}
                      </p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {/* Region */}
                  <div>
                    <label className="block text-sm font-medium text-ponte-black mb-2">
                      Region *
                    </label>
                    <select
                      required
                      className="w-full rounded-md border-ponte-sand shadow-sm focus:border-ponte-olive focus:ring-ponte-olive"
                      value={formData.region}
                      onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                    >
                      <option value="">Select Region</option>
                      {regions.map((region) => (
                        <option key={region} value={region}>{region}</option>
                      ))}
                    </select>
                  </div>

                  {/* Province */}
                  <div>
                    <label className="block text-sm font-medium text-ponte-black mb-2">
                      Province / Comune
                    </label>
                    <input
                      type="text"
                      className="w-full rounded-md border-ponte-sand shadow-sm focus:border-ponte-olive focus:ring-ponte-olive"
                      value={formData.province}
                      onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                      placeholder="e.g., Florence"
                    />
                  </div>
                </div>

                {/* GPS Coordinates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-ponte-black mb-2">
                      Latitude
                    </label>
                    <input
                      type="text"
                      className="w-full rounded-md border-ponte-sand shadow-sm focus:border-ponte-olive focus:ring-ponte-olive"
                      value={formData.latitude}
                      onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                      placeholder="e.g., 43.7696"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ponte-black mb-2">
                      Longitude
                    </label>
                    <input
                      type="text"
                      className="w-full rounded-md border-ponte-sand shadow-sm focus:border-ponte-olive focus:ring-ponte-olive"
                      value={formData.longitude}
                      onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                      placeholder="e.g., 11.2558"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  {/* Listing Type */}
                  <div>
                    <label className="block text-sm font-medium text-ponte-black mb-2">
                      Listing Type *
                    </label>
                    <select
                      required
                      className="w-full rounded-md border-ponte-sand shadow-sm focus:border-ponte-olive focus:ring-ponte-olive"
                      value={formData.listingType}
                      onChange={(e) => setFormData({ ...formData, listingType: e.target.value })}
                    >
                      <option value="">Select Type</option>
                      {listingTypes.map((type) => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Property Type */}
                  <div>
                    <label className="block text-sm font-medium text-ponte-black mb-2">
                      Property Type *
                    </label>
                    <select
                      required
                      className="w-full rounded-md border-ponte-sand shadow-sm focus:border-ponte-olive focus:ring-ponte-olive"
                      value={formData.propertyType}
                      onChange={(e) => setFormData({ ...formData, propertyType: e.target.value })}
                    >
                      <option value="">Select Property Type</option>
                      {propertyTypes.map((type) => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Year Built */}
                  <div>
                    <label className="block text-sm font-medium text-ponte-black mb-2">
                      Year Built / Last Renovated
                    </label>
                    <input
                      type="text"
                      className="w-full rounded-md border-ponte-sand shadow-sm focus:border-ponte-olive focus:ring-ponte-olive"
                      value={formData.yearBuiltNew}
                      onChange={(e) => setFormData({ ...formData, yearBuiltNew: e.target.value })}
                      placeholder="e.g., 1995"
                    />
                  </div>
                </div>

                {/* Ownership Type */}
                <div>
                  <label className="block text-sm font-medium text-ponte-black mb-2">
                    Ownership Type *
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {ownershipTypes.map((type) => (
                      <label key={type.value} className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                        formData.ownershipType === type.value 
                          ? 'border-ponte-olive bg-ponte-olive/10 shadow-md' 
                          : 'border-ponte-sand hover:border-ponte-olive hover:bg-ponte-cream'
                      }`}>
                        <input
                          type="radio"
                          name="ownershipType"
                          value={type.value}
                          checked={formData.ownershipType === type.value}
                          onChange={(e) => setFormData({ ...formData, ownershipType: e.target.value })}
                          className="sr-only"
                        />
                        <span className={`font-medium ${
                          formData.ownershipType === type.value 
                            ? 'text-ponte-olive' 
                            : 'text-ponte-black'
                        }`}>
                          {type.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* SECTION 2 - Property Description */}
              <div className="bg-ponte-cream p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-ponte-black mb-4 font-serif">Section 2 – Property Description</h3>
                
                {/* Short Summary */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-ponte-black mb-2">
                    Short Summary (2–3 sentences describing key features) *
                  </label>
                  <textarea
                    required
                    rows={3}
                    className="w-full rounded-md border-ponte-sand shadow-sm focus:border-ponte-olive focus:ring-ponte-olive"
                    value={formData.shortSummary}
                    onChange={(e) => setFormData({ ...formData, shortSummary: e.target.value })}
                    placeholder="Brief description of the property's key features and appeal"
                  />
                </div>

                {/* Full Description */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-ponte-black mb-2">
                    Full Description *
                  </label>
                  <textarea
                    required
                    rows={5}
                    className="w-full rounded-md border-ponte-sand shadow-sm focus:border-ponte-olive focus:ring-ponte-olive"
                    value={formData.fullDescription}
                    onChange={(e) => setFormData({ ...formData, fullDescription: e.target.value })}
                    placeholder="Detailed description of the property, its history, features, and unique characteristics"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {/* Architectural Style */}
                  <div>
                    <label className="block text-sm font-medium text-ponte-black mb-2">
                      Architectural Style
                    </label>
                    <select
                      className="w-full rounded-md border-ponte-sand shadow-sm focus:border-ponte-olive focus:ring-ponte-olive"
                      value={formData.architecturalStyle}
                      onChange={(e) => setFormData({ ...formData, architecturalStyle: e.target.value })}
                    >
                      <option value="">Select Style</option>
                      <option value="modern">Modern</option>
                      <option value="rustic">Rustic</option>
                      <option value="historical">Historical</option>
                      <option value="contemporary">Contemporary</option>
                      <option value="mediterranean">Mediterranean</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  {/* Orientation */}
                  <div>
                    <label className="block text-sm font-medium text-ponte-black mb-2">
                      Orientation
                    </label>
                    <select
                      className="w-full rounded-md border-ponte-sand shadow-sm focus:border-ponte-olive focus:ring-ponte-olive"
                      value={formData.orientation}
                      onChange={(e) => setFormData({ ...formData, orientation: e.target.value })}
                    >
                      <option value="">Select Orientation</option>
                      <option value="north">North</option>
                      <option value="south">South</option>
                      <option value="east">East</option>
                      <option value="west">West</option>
                      <option value="multiple">Multiple Directions</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Condition */}
                  <div>
                    <label className="block text-sm font-medium text-ponte-black mb-2">
                      Condition *
                    </label>
                    <div className="space-y-2">
                      {[
                        { value: "new", label: "New" },
                        { value: "recently-renovated", label: "Recently Renovated" },
                        { value: "needs-renovation", label: "Needs Renovation" },
                        { value: "requires-full-restoration", label: "Requires Full Restoration" }
                      ].map((option) => (
                        <label key={option.value} className="flex items-center">
                          <input
                            type="radio"
                            name="condition"
                            value={option.value}
                            checked={formData.condition === option.value}
                            onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                            className="mr-2"
                          />
                          {option.label}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Energy Efficiency Class */}
                  <div>
                    <label className="block text-sm font-medium text-ponte-black mb-2">
                      Energy Efficiency Class
                    </label>
                    <select
                      className="w-full rounded-md border-ponte-sand shadow-sm focus:border-ponte-olive focus:ring-ponte-olive"
                      value={formData.energyEfficiencyClass}
                      onChange={(e) => setFormData({ ...formData, energyEfficiencyClass: e.target.value })}
                    >
                      <option value="">Select Class</option>
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

              {/* SECTION 3 - Size & Layout */}
              <div className="bg-ponte-cream p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-ponte-black mb-4 font-serif">Section 3 – Size & Layout</h3>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-ponte-black mb-2">
                        Total Living Area (m²) *
                      </label>
                      <input
                        type="text"
                        className="w-full rounded-md border-ponte-sand shadow-sm focus:border-ponte-olive focus:ring-ponte-olive"
                        value={formData.totalLivingArea}
                        onChange={(e) => setFormData({ ...formData, totalLivingArea: e.target.value })}
                        placeholder="e.g., 150"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-ponte-black mb-2">
                        Total Land Size (m² or hectares)
                      </label>
                      <input
                        type="text"
                        className="w-full rounded-md border-ponte-sand shadow-sm focus:border-ponte-olive focus:ring-ponte-olive"
                        value={formData.totalLandSize}
                        onChange={(e) => setFormData({ ...formData, totalLandSize: e.target.value })}
                        placeholder="e.g., 2000 m² or 2 hectares"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-ponte-black mb-2">
                        Number of Floors/Levels
                      </label>
                      <input
                        type="text"
                        className="w-full rounded-md border-ponte-sand shadow-sm focus:border-ponte-olive focus:ring-ponte-olive"
                        value={formData.numberOfFloors}
                        onChange={(e) => setFormData({ ...formData, numberOfFloors: e.target.value })}
                        placeholder="e.g., 2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-ponte-black mb-2">
                        Number of Bedrooms
                      </label>
                      <input
                        type="text"
                        className="w-full rounded-md border-ponte-sand shadow-sm focus:border-ponte-olive focus:ring-ponte-olive"
                        value={formData.numberOfBedrooms}
                        onChange={(e) => setFormData({ ...formData, numberOfBedrooms: e.target.value })}
                        placeholder="e.g., 3"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-ponte-black mb-2">
                        Number of Bathrooms
                      </label>
                      <input
                        type="text"
                        className="w-full rounded-md border-ponte-sand shadow-sm focus:border-ponte-olive focus:ring-ponte-olive"
                        value={formData.numberOfBathrooms}
                        onChange={(e) => setFormData({ ...formData, numberOfBathrooms: e.target.value })}
                        placeholder="e.g., 2"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-ponte-black mb-2">
                        Kitchen Layout
                      </label>
                      <select
                        className="w-full rounded-md border-ponte-sand shadow-sm focus:border-ponte-olive focus:ring-ponte-olive"
                        value={formData.kitchen}
                        onChange={(e) => setFormData({ ...formData, kitchen: e.target.value })}
                      >
                        <option value="">Select kitchen layout</option>
                        <option value="Open Layout">Open Layout</option>
                        <option value="Closed Layout">Closed Layout</option>
                        <option value="No">No</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-ponte-black mb-2">
                        Living/Dining Areas
                      </label>
                      <select
                        className="w-full rounded-md border-ponte-sand shadow-sm focus:border-ponte-olive focus:ring-ponte-olive"
                        value={formData.livingDiningAreas}
                        onChange={(e) => setFormData({ ...formData, livingDiningAreas: e.target.value })}
                      >
                        <option value="">Select layout</option>
                        <option value="Combined">Combined</option>
                        <option value="Separate">Separate</option>
                      </select>
                    </div>
                  </div>

                  {/* Room Features */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={formData.officeStudyRoom}
                          onChange={(e) => setFormData({ ...formData, officeStudyRoom: e.target.checked })}
                          className="rounded border-ponte-sand text-ponte-olive focus:ring-ponte-olive"
                        />
                        <span className="text-sm font-medium text-ponte-black">Office/Study Room</span>
                      </label>
                    </div>
                    <div>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={formData.cellarBasement}
                          onChange={(e) => setFormData({ ...formData, cellarBasement: e.target.checked })}
                          className="rounded border-ponte-sand text-ponte-olive focus:ring-ponte-olive"
                        />
                        <span className="text-sm font-medium text-ponte-black">Cellar/Basement</span>
                      </label>
                    </div>
                    <div>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={formData.atticLoft}
                          onChange={(e) => setFormData({ ...formData, atticLoft: e.target.checked })}
                          className="rounded border-ponte-sand text-ponte-olive focus:ring-ponte-olive"
                        />
                        <span className="text-sm font-medium text-ponte-black">Attic/Loft</span>
                      </label>
                    </div>
                    <div>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={formData.terracesBalconies}
                          onChange={(e) => setFormData({ ...formData, terracesBalconies: e.target.checked })}
                          className="rounded border-ponte-sand text-ponte-olive focus:ring-ponte-olive"
                        />
                        <span className="text-sm font-medium text-ponte-black">Terrace(s)/Balcony(ies)</span>
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-ponte-black mb-2">
                        Garage/Covered Parking
                      </label>
                      <input
                        type="text"
                        className="w-full rounded-md border-ponte-sand shadow-sm focus:border-ponte-olive focus:ring-ponte-olive"
                        value={formData.garageParking}
                        onChange={(e) => setFormData({ ...formData, garageParking: e.target.value })}
                        placeholder="e.g., 2 cars"
                      />
                    </div>
                    <div>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={formData.laundryUtilityRoom}
                          onChange={(e) => setFormData({ ...formData, laundryUtilityRoom: e.target.checked })}
                          className="rounded border-ponte-sand text-ponte-olive focus:ring-ponte-olive"
                        />
                        <span className="text-sm font-medium text-ponte-black">Laundry/Utility Room</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-ponte-black mb-2">
                      Outbuildings
                    </label>
                    <textarea
                      className="w-full rounded-md border-ponte-sand shadow-sm focus:border-ponte-olive focus:ring-ponte-olive"
                      rows={3}
                      value={formData.outbuildings}
                      onChange={(e) => setFormData({ ...formData, outbuildings: e.target.value })}
                      placeholder="Describe any additional buildings on the property"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 4 - Utilities & Infrastructure */}
              <div className="bg-ponte-cream p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-ponte-black mb-4 font-serif">Section 4 – Utilities & Infrastructure</h3>
                
                <div className="space-y-4">
                  {/* Water Source */}
                  <div>
                    <label className="block text-sm font-medium text-ponte-black mb-2">
                      Water Source *
                    </label>
                    <select
                      className="w-full rounded-md border-ponte-sand shadow-sm focus:border-ponte-olive focus:ring-ponte-olive"
                      value={formData.waterSource}
                      onChange={(e) => setFormData({ ...formData, waterSource: e.target.value })}
                      required
                    >
                      <option value="">Select water source</option>
                      <option value="Municipal">Municipal</option>
                      <option value="Private Well">Private Well</option>
                      <option value="Shared Well">Shared Well</option>
                    </select>
                  </div>

                  {/* Heating System */}
                  <div>
                    <label className="block text-sm font-medium text-ponte-black mb-2">
                      Heating System (select all that apply)
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {["Central Heating", "Individual Radiators", "Fireplace", "Wood Stove", "Heat Pump", "Solar Heating"].map((option) => (
                        <label key={option} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={formData.heatingSystem.includes(option)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({ ...formData, heatingSystem: [...formData.heatingSystem, option] })
                              } else {
                                setFormData({ ...formData, heatingSystem: formData.heatingSystem.filter(item => item !== option) })
                              }
                            }}
                            className="rounded border-ponte-sand text-ponte-olive focus:ring-ponte-olive"
                          />
                          <span className="text-sm text-ponte-black">{option}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Infrastructure Options */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={formData.coolingAirConditioning}
                          onChange={(e) => setFormData({ ...formData, coolingAirConditioning: e.target.checked })}
                          className="rounded border-ponte-sand text-ponte-olive focus:ring-ponte-olive"
                        />
                        <span className="text-sm font-medium text-ponte-black">Cooling/Air Conditioning</span>
                      </label>
                    </div>
                    <div>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={formData.electricityConnection}
                          onChange={(e) => setFormData({ ...formData, electricityConnection: e.target.checked })}
                          className="rounded border-ponte-sand text-ponte-olive focus:ring-ponte-olive"
                        />
                        <span className="text-sm font-medium text-ponte-black">Electricity Connection</span>
                      </label>
                    </div>
                  </div>

                  {/* Sewage Type */}
                  <div>
                    <label className="block text-sm font-medium text-ponte-black mb-2">
                      Sewage Type
                    </label>
                    <select
                      className="w-full rounded-md border-ponte-sand shadow-sm focus:border-ponte-olive focus:ring-ponte-olive"
                      value={formData.sewageType}
                      onChange={(e) => setFormData({ ...formData, sewageType: e.target.value })}
                    >
                      <option value="">Select sewage type</option>
                      <option value="Public">Public</option>
                      <option value="Septic Tank">Septic Tank</option>
                    </select>
                  </div>

                  {/* Internet Availability */}
                  <div>
                    <label className="block text-sm font-medium text-ponte-black mb-2">
                      Internet Availability
                    </label>
                    <select
                      className="w-full rounded-md border-ponte-sand shadow-sm focus:border-ponte-olive focus:ring-ponte-olive"
                      value={formData.internetAvailability}
                      onChange={(e) => setFormData({ ...formData, internetAvailability: e.target.value })}
                    >
                      <option value="">Select internet type</option>
                      <option value="Fiber">Fiber</option>
                      <option value="ADSL">ADSL</option>
                      <option value="Mobile">Mobile</option>
                      <option value="None">None</option>
                    </select>
                  </div>

                  {/* Solar/Renewable Energy */}
                  <div>
                    <label className="block text-sm font-medium text-ponte-black mb-2">
                      Solar/Renewable Energy Systems
                    </label>
                    <textarea
                      className="w-full rounded-md border-ponte-sand shadow-sm focus:border-ponte-olive focus:ring-ponte-olive"
                      rows={3}
                      value={formData.solarRenewableEnergy}
                      onChange={(e) => setFormData({ ...formData, solarRenewableEnergy: e.target.value })}
                      placeholder="Describe any solar panels, wind turbines, or other renewable energy systems"
                    />
                  </div>

                  {/* Road Access Condition */}
                  <div>
                    <label className="block text-sm font-medium text-ponte-black mb-2">
                      Road Access Condition
                    </label>
                    <select
                      className="w-full rounded-md border-ponte-sand shadow-sm focus:border-ponte-olive focus:ring-ponte-olive"
                      value={formData.roadAccessCondition}
                      onChange={(e) => setFormData({ ...formData, roadAccessCondition: e.target.value })}
                    >
                      <option value="">Select road condition</option>
                      <option value="Paved">Paved</option>
                      <option value="Gravel">Gravel</option>
                      <option value="Steep/Unpaved">Steep/Unpaved</option>
                      <option value="Limited">Limited</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 5 - Outdoor Features & Amenities */}
              <div className="bg-ponte-cream p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-ponte-black mb-4 font-serif">Section 5 – Outdoor Features & Amenities</h3>
                
                <div className="space-y-4">
                  {/* Swimming Pool */}
                  <div>
                    <label className="block text-sm font-medium text-ponte-black mb-2">
                      Swimming Pool
                    </label>
                    <select
                      className="w-full rounded-md border-ponte-sand shadow-sm focus:border-ponte-olive focus:ring-ponte-olive"
                      value={formData.swimmingPool}
                      onChange={(e) => setFormData({ ...formData, swimmingPool: e.target.value })}
                    >
                      <option value="">Select pool type</option>
                      <option value="In-ground">In-ground</option>
                      <option value="Above-ground">Above-ground</option>
                      <option value="No">No</option>
                    </select>
                  </div>

                  {/* Garden/Landscaping */}
                  <div>
                    <label className="block text-sm font-medium text-ponte-black mb-2">
                      Garden/Landscaping
                    </label>
                    <textarea
                      className="w-full rounded-md border-ponte-sand shadow-sm focus:border-ponte-olive focus:ring-ponte-olive"
                      rows={3}
                      value={formData.gardenLandscaping}
                      onChange={(e) => setFormData({ ...formData, gardenLandscaping: e.target.value })}
                      placeholder="Describe the garden, landscaping, and outdoor spaces"
                    />
                  </div>

                  {/* Olive Grove/Vineyard/Orchard */}
                  <div>
                    <label className="block text-sm font-medium text-ponte-black mb-2">
                      Olive Grove/Vineyard/Orchard
                    </label>
                    <textarea
                      className="w-full rounded-md border-ponte-sand shadow-sm focus:border-ponte-olive focus:ring-ponte-olive"
                      rows={3}
                      value={formData.oliveGroveVineyard}
                      onChange={(e) => setFormData({ ...formData, oliveGroveVineyard: e.target.value })}
                      placeholder="Describe any agricultural land, olive groves, vineyards, or orchards"
                    />
                  </div>

                  {/* Outdoor Features */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={formData.patioCourtyard}
                          onChange={(e) => setFormData({ ...formData, patioCourtyard: e.target.checked })}
                          className="rounded border-ponte-sand text-ponte-olive focus:ring-ponte-olive"
                        />
                        <span className="text-sm font-medium text-ponte-black">Patio/Courtyard</span>
                      </label>
                    </div>
                    <div>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={formData.outdoorKitchenBBQ}
                          onChange={(e) => setFormData({ ...formData, outdoorKitchenBBQ: e.target.checked })}
                          className="rounded border-ponte-sand text-ponte-olive focus:ring-ponte-olive"
                        />
                        <span className="text-sm font-medium text-ponte-black">Outdoor Kitchen/BBQ Area</span>
                      </label>
                    </div>
                  </div>

                  {/* Views */}
                  <div>
                    <label className="block text-sm font-medium text-ponte-black mb-2">
                      Views (select all that apply)
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {["Sea/Ocean", "Mountain", "Countryside", "Village", "Garden", "Pool"].map((option) => (
                        <label key={option} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={formData.viewTypes.includes(option)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({ ...formData, viewTypes: [...formData.viewTypes, option] })
                              } else {
                                setFormData({ ...formData, viewTypes: formData.viewTypes.filter(item => item !== option) })
                              }
                            }}
                            className="rounded border-ponte-sand text-ponte-olive focus:ring-ponte-olive"
                          />
                          <span className="text-sm text-ponte-black">{option}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Fencing/Gates */}
                  <div>
                    <label className="block text-sm font-medium text-ponte-black mb-2">
                      Fencing/Gates
                    </label>
                    <select
                      className="w-full rounded-md border-ponte-sand shadow-sm focus:border-ponte-olive focus:ring-ponte-olive"
                      value={formData.fencingGates}
                      onChange={(e) => setFormData({ ...formData, fencingGates: e.target.value })}
                    >
                      <option value="">Select fencing type</option>
                      <option value="None">None</option>
                      <option value="Manual">Manual</option>
                      <option value="Electric">Electric</option>
                    </select>
                  </div>

                  {/* Parking Spaces */}
                  <div>
                    <label className="block text-sm font-medium text-ponte-black mb-2">
                      Parking Spaces
                    </label>
                    <input
                      type="text"
                      className="w-full rounded-md border-ponte-sand shadow-sm focus:border-ponte-olive focus:ring-ponte-olive"
                      value={formData.parkingSpaces}
                      onChange={(e) => setFormData({ ...formData, parkingSpaces: e.target.value })}
                      placeholder="e.g., 2 covered spaces, street parking available"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 6 - Location & Proximity */}
              <div className="bg-ponte-cream p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-ponte-black mb-4 font-serif">Section 6 – Location & Proximity</h3>
                
                <div className="space-y-4">
                  {/* Nearest Town */}
                  <div>
                    <label className="block text-sm font-medium text-ponte-black mb-2">
                      Nearest Town/Village *
                    </label>
                    <input
                      type="text"
                      className="w-full rounded-md border-ponte-sand shadow-sm focus:border-ponte-olive focus:ring-ponte-olive"
                      value={formData.nearestTown}
                      onChange={(e) => setFormData({ ...formData, nearestTown: e.target.value })}
                      placeholder="e.g., Montepulciano"
                      required
                    />
                  </div>

                  {/* Distance Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-ponte-black mb-2">
                        Distance to Nearest Town
                      </label>
                      <input
                        type="text"
                        className="w-full rounded-md border-ponte-sand shadow-sm focus:border-ponte-olive focus:ring-ponte-olive"
                        value={formData.distanceToNearestTown}
                        onChange={(e) => setFormData({ ...formData, distanceToNearestTown: e.target.value })}
                        placeholder="e.g., 5 km"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-ponte-black mb-2">
                        Distance to Coast
                      </label>
                      <input
                        type="text"
                        className="w-full rounded-md border-ponte-sand shadow-sm focus:border-ponte-olive focus:ring-ponte-olive"
                        value={formData.distanceToCoast}
                        onChange={(e) => setFormData({ ...formData, distanceToCoast: e.target.value })}
                        placeholder="e.g., 15 km"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-ponte-black mb-2">
                        Distance to Airport
                      </label>
                      <input
                        type="text"
                        className="w-full rounded-md border-ponte-sand shadow-sm focus:border-ponte-olive focus:ring-ponte-olive"
                        value={formData.distanceToAirport}
                        onChange={(e) => setFormData({ ...formData, distanceToAirport: e.target.value })}
                        placeholder="e.g., 45 km"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-ponte-black mb-2">
                        Distance to Train Station
                      </label>
                      <input
                        type="text"
                        className="w-full rounded-md border-ponte-sand shadow-sm focus:border-ponte-olive focus:ring-ponte-olive"
                        value={formData.distanceToTrainStation}
                        onChange={(e) => setFormData({ ...formData, distanceToTrainStation: e.target.value })}
                        placeholder="e.g., 8 km"
                      />
                    </div>
                  </div>

                  {/* Distance to Services */}
                  <div>
                    <label className="block text-sm font-medium text-ponte-black mb-2">
                      Distance to Services (shops, restaurants, medical, schools)
                    </label>
                    <input
                      type="text"
                      className="w-full rounded-md border-ponte-sand shadow-sm focus:border-ponte-olive focus:ring-ponte-olive"
                      value={formData.distanceToServices}
                      onChange={(e) => setFormData({ ...formData, distanceToServices: e.target.value })}
                      placeholder="e.g., 3 km to nearest shops, 10 km to hospital"
                    />
                  </div>

                  {/* Notable Attractions */}
                  <div>
                    <label className="block text-sm font-medium text-ponte-black mb-2">
                      Notable Nearby Attractions
                    </label>
                    <textarea
                      className="w-full rounded-md border-ponte-sand shadow-sm focus:border-ponte-olive focus:ring-ponte-olive"
                      rows={3}
                      value={formData.notableAttractions}
                      onChange={(e) => setFormData({ ...formData, notableAttractions: e.target.value })}
                      placeholder="e.g., Historic center of Montepulciano, thermal baths, wineries"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 7 - Legal & Financial Details */}
              <div className="bg-ponte-cream p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-ponte-black mb-4 font-serif">Section 7 – Legal & Financial Details</h3>
                
                <div className="space-y-4">
                  {/* Asking Price */}
                  <div>
                    <label className="block text-sm font-medium text-ponte-black mb-2">
                      Asking Price (EUR) *
                    </label>
                    <input
                      type="text"
                      className="w-full rounded-md border-ponte-sand shadow-sm focus:border-ponte-olive focus:ring-ponte-olive"
                      value={formData.askingPrice}
                      onChange={(e) => setFormData({ ...formData, askingPrice: e.target.value })}
                      placeholder="e.g., 450,000"
                      required
                    />
                  </div>

                  {/* Negotiable */}
                  <div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.negotiable}
                        onChange={(e) => setFormData({ ...formData, negotiable: e.target.checked })}
                        className="rounded border-ponte-sand text-ponte-olive focus:ring-ponte-olive"
                      />
                      <span className="text-sm font-medium text-ponte-black">Price is negotiable</span>
                    </label>
                  </div>

                  {/* Financial Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-ponte-black mb-2">
                        Agency Commission
                      </label>
                      <input
                        type="text"
                        className="w-full rounded-md border-ponte-sand shadow-sm focus:border-ponte-olive focus:ring-ponte-olive"
                        value={formData.agencyCommission}
                        onChange={(e) => setFormData({ ...formData, agencyCommission: e.target.value })}
                        placeholder="e.g., 3%"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-ponte-black mb-2">
                        Annual Property Tax (IMU)
                      </label>
                      <input
                        type="text"
                        className="w-full rounded-md border-ponte-sand shadow-sm focus:border-ponte-olive focus:ring-ponte-olive"
                        value={formData.annualPropertyTax}
                        onChange={(e) => setFormData({ ...formData, annualPropertyTax: e.target.value })}
                        placeholder="e.g., 1,200 EUR"
                      />
                    </div>
                  </div>

                  {/* Utility Costs */}
                  <div>
                    <label className="block text-sm font-medium text-ponte-black mb-2">
                      Utility Costs Estimate (annual)
                    </label>
                    <input
                      type="text"
                      className="w-full rounded-md border-ponte-sand shadow-sm focus:border-ponte-olive focus:ring-ponte-olive"
                      value={formData.utilityCostsEstimate}
                      onChange={(e) => setFormData({ ...formData, utilityCostsEstimate: e.target.value })}
                      placeholder="e.g., 2,500 EUR"
                    />
                  </div>

                  {/* Legal Status */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={formData.ownershipDocumentsAvailable}
                          onChange={(e) => setFormData({ ...formData, ownershipDocumentsAvailable: e.target.checked })}
                          className="rounded border-ponte-sand text-ponte-olive focus:ring-ponte-olive"
                        />
                        <span className="text-sm font-medium text-ponte-black">Ownership documents available</span>
                      </label>
                    </div>
                    <div>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={formData.propertyCurrentlyOccupied}
                          onChange={(e) => setFormData({ ...formData, propertyCurrentlyOccupied: e.target.checked })}
                          className="rounded border-ponte-sand text-ponte-olive focus:ring-ponte-olive"
                        />
                        <span className="text-sm font-medium text-ponte-black">Property currently occupied</span>
                      </label>
                    </div>
                  </div>

                  {/* Urban Planning Compliance */}
                  <div>
                    <label className="block text-sm font-medium text-ponte-black mb-2">
                      Urban Planning Compliance
                    </label>
                    <select
                      className="w-full rounded-md border-ponte-sand shadow-sm focus:border-ponte-olive focus:ring-ponte-olive"
                      value={formData.urbanPlanningCompliance}
                      onChange={(e) => setFormData({ ...formData, urbanPlanningCompliance: e.target.value })}
                    >
                      <option value="">Select compliance status</option>
                      <option value="Fully Compliant">Fully Compliant</option>
                      <option value="Minor Issues">Minor Issues</option>
                      <option value="Major Issues">Major Issues</option>
                      <option value="Unknown">Unknown</option>
                    </select>
                  </div>

                  {/* Easements/Restrictions */}
                  <div>
                    <label className="block text-sm font-medium text-ponte-black mb-2">
                      Easements or Restrictions
                    </label>
                    <textarea
                      className="w-full rounded-md border-ponte-sand shadow-sm focus:border-ponte-olive focus:ring-ponte-olive"
                      rows={3}
                      value={formData.easementsRestrictions}
                      onChange={(e) => setFormData({ ...formData, easementsRestrictions: e.target.value })}
                      placeholder="Describe any easements, restrictions, or special conditions"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 8 - Visuals & Media */}
              <div className="bg-ponte-cream p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-ponte-black mb-4 font-serif">Section 8 – Visuals & Media</h3>
                
                {/* Property Photos */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-ponte-black mb-2">
                    Upload Property Photos (interior & exterior) *
                  </label>
                  <div className="border-2 border-dashed border-ponte-sand rounded-lg p-6 hover:border-ponte-olive transition-colors">
                    <div className="text-center">
                      <Image
                        src="/logos/icon-property.png"
                        alt="Upload Pictures"
                        width={48}
                        height={48}
                        className="w-12 h-12 mx-auto mb-3 opacity-50"
                      />
                      <p className="text-ponte-olive font-medium mb-2">Upload Property Images</p>
                      <p className="text-xs text-ponte-olive mb-2">Upload multiple images of your property (JPG, PNG, WebP)</p>
                      <p className="text-xs text-ponte-olive mb-4">Maximum 10 pictures • Max 5MB per picture</p>
                      
                      <input
                        type="file"
                        multiple
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={handlePictureUpload}
                        className="hidden"
                        id="picture-upload"
                      />
                      <label
                        htmlFor="picture-upload"
                        className="bg-ponte-olive text-white px-4 py-2 rounded-lg hover:bg-ponte-olive/90 transition-colors cursor-pointer inline-block"
                      >
                        Select Pictures
                      </label>
                    </div>
                    
                    {uploadedPictures.length > 0 && (
                      <div className="mt-6 pt-4 border-t border-ponte-sand">
                        <h4 className="text-sm font-medium text-ponte-black mb-3">Picture Preview</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {picturePreview.map((preview, index) => (
                            <div key={index} className="relative group">
                              <Image
                                src={preview}
                                alt={`Preview ${index + 1}`}
                                width={128}
                                height={128}
                                className="w-full h-32 object-cover rounded-lg border border-ponte-sand"
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-lg flex items-center justify-center">
                                <button
                                  type="button"
                                  onClick={() => removePicture(index)}
                                  className="opacity-0 group-hover:opacity-100 bg-ponte-terracotta text-white px-3 py-1 rounded-md text-sm font-medium transition-all duration-200 hover:bg-ponte-terracotta/80"
                                >
                                  Remove
                                </button>
                              </div>
                              <div className="mt-1 text-xs text-ponte-olive text-center">
                                {uploadedPictures[index]?.name}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Virtual Tour Link */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-ponte-black mb-2">
                    Virtual Tour Link
                  </label>
                  <input
                    type="url"
                    className="w-full rounded-md border-ponte-sand shadow-sm focus:border-ponte-olive focus:ring-ponte-olive"
                    value={formData.virtualTourLink}
                    onChange={(e) => setFormData({ ...formData, virtualTourLink: e.target.value })}
                    placeholder="https://example.com/virtual-tour"
                  />
                </div>
              </div>

              {/* SECTION 9 - Additional Notes */}
              <div className="bg-ponte-cream p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-ponte-black mb-4 font-serif">Section 9 – Additional Notes</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-ponte-black mb-2">
                      Anything else we should know about this property?
                    </label>
                    <textarea
                      className="w-full rounded-md border-ponte-sand shadow-sm focus:border-ponte-olive focus:ring-ponte-olive"
                      rows={4}
                      value={formData.additionalNotes}
                      onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
                      placeholder="Any additional information, special features, or important details about this property..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-ponte-black mb-2">
                      Recommended Selling Points
                    </label>
                    <textarea
                      className="w-full rounded-md border-ponte-sand shadow-sm focus:border-ponte-olive focus:ring-ponte-olive"
                      rows={3}
                      value={formData.recommendedSellingPoints}
                      onChange={(e) => setFormData({ ...formData, recommendedSellingPoints: e.target.value })}
                      placeholder="What makes this property special? What are its key selling points?"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-ponte-black mb-2">
                      Suggested Renovation Potential
                    </label>
                    <textarea
                      className="w-full rounded-md border-ponte-sand shadow-sm focus:border-ponte-olive focus:ring-ponte-olive"
                      rows={3}
                      value={formData.suggestedRenovationPotential}
                      onChange={(e) => setFormData({ ...formData, suggestedRenovationPotential: e.target.value })}
                      placeholder="Any renovation opportunities, potential improvements, or development possibilities..."
                    />
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-ponte-black mb-2">
                  Tags
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableTags.map((tag) => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => handleTagToggle(tag.name)}
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
                        formData.tags.includes(tag.name)
                          ? 'bg-ponte-olive text-white border-ponte-olive'
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

              {/* Error/Success Messages */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <div className="text-sm text-red-600">{error}</div>
                </div>
              )}

              {success && (
                <div className="bg-green-50 border border-green-200 rounded-md p-4">
                  <div className="text-sm text-green-600">{success}</div>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => router.push("/properties")}
                  className="px-6 py-3 border border-ponte-sand text-ponte-olive rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-3 bg-ponte-olive text-white rounded-lg hover:bg-ponte-olive/90 disabled:opacity-50 transition-all duration-200 font-medium flex items-center space-x-2 shadow-sm hover:shadow-md"
                >
                  <Image
                    src="/logos/icon-property.png"
                    alt="Submit"
                    width={16}
                    height={16}
                    className="w-4 h-4"
                  />
                  <span>{submitting ? "Creating..." : "Create Property"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}