"use client"

import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Navigation from "components/Navigation"

interface Property {
  id: string
  name?: string
  streetAddress?: string
  city?: string
  propertyType: string
  latitude: number
  longitude: number
  tags?: string[]
}

interface Destination {
  id: string
  name: string
  address: string
  category?: string
  latitude: number
  longitude: number
  tags?: string[]
}

interface PropertyDistance {
  id: string
  propertyId: string
  destinationId: string
  drivingDistance?: number
  drivingDuration?: number
  distanceMiles?: number
  distanceKm?: number
  durationMinutes?: number
  walkingDistance?: number
  walkingDuration?: number
  walkingDurationMinutes?: number
  transitDistance?: number
  transitDuration?: number
  transitDurationMinutes?: number
  calculatedAt: string
  property: Property
  destination: Destination
}

// Helper function to format duration in hours and minutes
const formatDuration = (minutes: number | null | undefined): string => {
  if (!minutes || minutes === 0) return "N/A"
  
  const hours = Math.floor(minutes / 60)
  const mins = Math.round(minutes % 60)
  
  if (hours === 0) {
    return `${mins} min`
  } else if (mins === 0) {
    return `${hours} hr`
  } else {
    return `${hours} hr ${mins} min`
  }
}

// Helper function to format distance with units
const formatDistance = (distance: number | null | undefined, unit: string): string => {
  if (!distance) return "N/A"
  return `${distance} ${unit}`
}

// Helper function to extract unique tags from properties and destinations
const getUniqueTags = (properties: Property[], destinations: Destination[]): string[] => {
  const allTags = new Set<string>()
  
  console.log("🔍 getUniqueTags - Properties:", properties.length, "Destinations:", destinations.length)
  
  // Extract tags from properties
  properties.forEach(property => {
    if (property.tags && Array.isArray(property.tags)) {
      console.log("🏠 Property tags:", property.name, property.tags)
      property.tags.forEach(tag => allTags.add(tag))
    }
  })
  
  // Extract tags from destinations
  destinations.forEach(destination => {
    if (destination.tags && Array.isArray(destination.tags)) {
      console.log("📍 Destination tags:", destination.name, destination.tags)
      destination.tags.forEach(tag => allTags.add(tag))
    }
  })
  
  const uniqueTags = Array.from(allTags).sort()
  console.log("🏷️ All unique tags:", uniqueTags)
  return uniqueTags
}

// Helper function to create Google Maps directions URL
const createGoogleMapsUrl = (property: Property, destination: Destination): string => {
  const origin = `${property.latitude},${property.longitude}`
  const dest = `${destination.latitude},${destination.longitude}`
  return `https://www.google.com/maps/dir/${origin}/${dest}`
}

// Category normalization function (same as in other files)
const normalizeCategory = (category: string | null | undefined) => {
  if (!category) return null
  const normalized = category.toLowerCase().trim()
  
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
  
  return categoryMap[normalized] || null
}

// Get category label for display
const getCategoryLabel = (category: string | null | undefined) => {
  if (!category) return 'Other'
  const normalized = normalizeCategory(category)
  if (!normalized) return category // fallback to original if not found
  
  // Map normalized categories to display labels
  const labelMap: { [key: string]: string } = {
    'int_airport': 'International Airport',
    'airport': 'Airport',
    'bus_station': 'Bus Station',
    'train_station': 'Train Station',
    'attraction': 'Attraction',
    'beach': 'Beach',
    'entertainment': 'Entertainment',
    'hospital': 'Hospital',
    'hotel': 'Hotel',
    'museum': 'Museum',
    'mountain': 'Mountain',
    'other': 'Other',
    'park': 'Park',
    'restaurant': 'Restaurant',
    'school': 'School',
    'shopping': 'Shopping'
  }
  
  return labelMap[normalized] || category
}

export default function AnalysisPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [properties, setProperties] = useState<Property[]>([])
  const [destinations, setDestinations] = useState<Destination[]>([])
  const [distances, setDistances] = useState<PropertyDistance[]>([])
  const [loading, setLoading] = useState(true)
  const [calculating, setCalculating] = useState(false)
  const [error, setError] = useState("")
  
  // Tab state
  const [activeTab, setActiveTab] = useState<'analysis' | 'tour-planner'>('analysis')
  
  // Selection states
  const [selectedProperties, setSelectedProperties] = useState<string[]>([])
  const [selectedDestinations, setSelectedDestinations] = useState<string[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  
  // Tour Planner states
  const [tourStartingPoint, setTourStartingPoint] = useState<{
    type: 'property' | 'destination' | 'custom'
    id?: string
    name?: string
    address?: string
    latitude?: number
    longitude?: number
  } | null>(null)
  const [tourDestinations, setTourDestinations] = useState<string[]>([])
  const [tourProperties, setTourProperties] = useState<string[]>([])
  const [tourRoute, setTourRoute] = useState<any[]>([])
  const [tourCalculating, setTourCalculating] = useState(false)
  const [tourSteps, setTourSteps] = useState<any[]>([])
  const [draggedStep, setDraggedStep] = useState<number | null>(null)
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null)
  const [directionsService, setDirectionsService] = useState<google.maps.DirectionsService | null>(null)
  const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [savedTours, setSavedTours] = useState<any[]>([])
  const [showSavedTours, setShowSavedTours] = useState(false)
  const [mapInitializing, setMapInitializing] = useState(false)
  const mapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
      return
    }

    if (status === "authenticated") {
      fetchData()
    }
  }, [status, router])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch properties and destinations in parallel
      const [propertiesRes, destinationsRes, distancesRes] = await Promise.all([
        fetch("/api/properties"),
        fetch("/api/destinations"),
        fetch("/api/analysis/distances")
      ])

      if (propertiesRes.ok) {
        const propertiesData = await propertiesRes.json() as any
        console.log("Properties data:", propertiesData)
        setProperties(propertiesData.properties || [])
      }

      if (destinationsRes.ok) {
        const destinationsData = await destinationsRes.json() as any
        console.log("Destinations data:", destinationsData)
        setDestinations(destinationsData.destinations || [])
      }

      if (distancesRes.ok) {
        const distancesData = await distancesRes.json() as any
        setDistances(distancesData)
      }
    } catch (error) {
      console.error("Error fetching data:", error)
      setError("Failed to load data")
    } finally {
      setLoading(false)
    }
  }

  // Get unique categories from destinations (normalized)
  const getUniqueCategories = () => {
    if (!destinations || !Array.isArray(destinations)) {
      return []
    }
    const normalizedCategories = destinations
      .map(d => normalizeCategory(d.category) || d.category)
      .filter((cat, index, arr) => arr.indexOf(cat) === index)
    return normalizedCategories
  }

  // Filter distances based on selections
  const getFilteredDistances = () => {
    if (!distances || !Array.isArray(distances)) {
      return []
    }
    
    // If no selections are made, show nothing
    if (selectedProperties.length === 0 && selectedDestinations.length === 0 && selectedCategories.length === 0 && selectedTags.length === 0) {
      return []
    }

    // Require at least one property and one of: destination, category, or tag
    if (selectedProperties.length === 0 || (selectedDestinations.length === 0 && selectedCategories.length === 0 && selectedTags.length === 0)) {
      return []
    }

    return distances.filter(distance => {
      const propertyMatch = selectedProperties.length === 0 || selectedProperties.includes(distance.propertyId)
      const destinationMatch = selectedDestinations.length === 0 || selectedDestinations.includes(distance.destinationId)
      const categoryMatch = selectedCategories.length === 0 || selectedCategories.includes(normalizeCategory(distance.destination.category) || distance.destination.category)
      
      // Check if any selected tags match property or destination tags
      const tagMatch = selectedTags.length === 0 || selectedTags.some(tag => {
        const propertyHasTag = distance.property.tags && distance.property.tags.includes(tag)
        const destinationHasTag = distance.destination.tags && distance.destination.tags.includes(tag)
        return propertyHasTag || destinationHasTag
      })
      
      return propertyMatch && destinationMatch && categoryMatch && tagMatch
    })
  }

  const calculateDistances = async () => {
    if (properties.length === 0 || destinations.length === 0) {
      setError("Please add some properties and destinations first")
      return
    }

    setCalculating(true)
    setError("")

    try {
      const response = await fetch("/api/analysis/calculate-distances", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      })

      if (response.ok) {
        await fetchData() // Refresh the distances
      } else {
        const errorData = await response.json() as any
        setError(errorData.error || "Failed to calculate distances")
      }
    } catch (error) {
      console.error("Error calculating distances:", error)
      setError("Failed to calculate distances")
    } finally {
      setCalculating(false)
    }
  }

  const exportToGoogleSheets = () => {
    const filteredDistances = getFilteredDistances()
    if (filteredDistances.length === 0) {
      setError("No distance data to export")
      return
    }

    // Create CSV data
    const headers = [
      "Property Name",
      "Property Address", 
      "Property Type",
      "Destination Name",
      "Destination Address",
      "Destination Category",
      "Distance (Miles)",
      "Distance (KM)",
      "Driving Duration",
      "Walking Duration",
      "Transit Duration",
      "Calculated At"
    ]

    const csvData = filteredDistances.map(distance => [
      distance.property.name || "Unnamed Property",
      `${distance.property.streetAddress || ""}, ${distance.property.city || ""}`.trim(),
      distance.property.propertyType,
      distance.destination.name,
      distance.destination.address,
      distance.destination.category,
      distance.distanceMiles?.toFixed(2) || "N/A",
      distance.distanceKm?.toFixed(2) || "N/A", 
      formatDuration(distance.durationMinutes),
      formatDuration(distance.walkingDurationMinutes),
      formatDuration(distance.transitDurationMinutes),
      new Date(distance.calculatedAt).toLocaleDateString()
    ])

    // Create CSV content
    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(","))
      .join("\n")

    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `property-distances-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }


  const resetTour = () => {
    setTourStartingPoint(null)
    setTourDestinations([])
    setTourProperties([])
    setTourRoute([])
    setTourSteps([])
  }

  // Update tour steps when selections change
  useEffect(() => {
    const steps = []
    
    // Add starting point as step 1
    if (tourStartingPoint) {
      steps.push({
        step: 1,
        id: tourStartingPoint.id || 'custom',
        name: tourStartingPoint.name || 'Custom Starting Point',
        type: tourStartingPoint.type,
        address: tourStartingPoint.address || '',
        latitude: tourStartingPoint.latitude,
        longitude: tourStartingPoint.longitude,
        duration: 0,
        distance: 0
      })
    }

    // Add selected properties
    tourProperties.forEach((propertyId, index) => {
      const property = properties.find(p => p.id === propertyId)
      if (property) {
        steps.push({
          step: steps.length + 1,
          id: property.id,
          name: property.name || 'Unnamed Property',
          type: 'property',
          address: `${property.streetAddress || ''}, ${property.city || ''}`.trim(),
          latitude: property.latitude,
          longitude: property.longitude,
          propertyType: property.propertyType,
          duration: 0,
          distance: 0
        })
      }
    })

    // Add selected destinations
    tourDestinations.forEach((destinationId, index) => {
      const destination = destinations.find(d => d.id === destinationId)
      if (destination) {
        steps.push({
          step: steps.length + 1,
          id: destination.id,
          name: destination.name,
          type: 'destination',
          address: destination.address,
          latitude: destination.latitude,
          longitude: destination.longitude,
          category: destination.category,
          duration: 0,
          distance: 0
        })
      }
    })

    setTourSteps(steps)
  }, [tourStartingPoint, tourProperties, tourDestinations, properties, destinations])

  // Drag and drop functions for tour steps
  const handleDragStart = (e: React.DragEvent, stepIndex: number) => {
    setDraggedStep(stepIndex)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    
    if (draggedStep === null || draggedStep === dropIndex) return

    const newSteps = [...tourSteps]
    const draggedItem = newSteps[draggedStep]
    
    // Remove the dragged item
    newSteps.splice(draggedStep, 1)
    
    // Insert at new position
    const insertIndex = draggedStep < dropIndex ? dropIndex - 1 : dropIndex
    newSteps.splice(insertIndex, 0, draggedItem)
    
    // Update step numbers
    const updatedSteps = newSteps.map((step, index) => ({
      ...step,
      step: index + 1
    }))
    
    setTourSteps(updatedSteps)
    setDraggedStep(null)
  }

  const handleDragEnd = () => {
    setDraggedStep(null)
  }

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371 // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  const showMarkersOnMap = () => {
    if (mapInstance && tourSteps.length > 0) {
      console.log("Tour planner: Showing markers on map")
      tourSteps.forEach((step, index) => {
        const marker = new window.google.maps.Marker({
          position: { lat: step.latitude, lng: step.longitude },
          map: mapInstance,
          title: step.name,
          label: (index + 1).toString()
        })
      })
    }
  }

  // Show markers when tour steps change and map is available
  useEffect(() => {
    if (mapInstance && tourSteps.length > 0) {
      showMarkersOnMap()
    }
  }, [mapInstance, tourSteps])

  // Load Google Maps when page loads (like the map page)
  useEffect(() => {
    if (status === "authenticated" && !mapLoaded) {
      loadGoogleMapsScript()
    }
  }, [status, mapLoaded])

  // Initialize map when tour planner tab is active and Google Maps is loaded
  useEffect(() => {
    if (activeTab === 'tour-planner' && mapLoaded && !mapInstance && mapRef.current) {
      console.log("Tour planner: Creating map with ref:", mapRef.current)
      
      try {
        const newMap = new window.google.maps.Map(mapRef.current, {
          center: { lat: 41.804532, lng: 12.251998 },
          zoom: 6,
          mapTypeId: window.google.maps.MapTypeId.ROADMAP
        })
        
        setMapInstance(newMap)
        setDirectionsService(new window.google.maps.DirectionsService())
        setDirectionsRenderer(new window.google.maps.DirectionsRenderer())
        setMapInitializing(false)
        
        console.log("Tour planner: Map created successfully")
      } catch (error) {
        console.error("Tour planner: Error creating map:", error)
      }
    }
  }, [activeTab, mapLoaded, mapInstance])

  const loadGoogleMapsScript = () => {
    // Check if script already exists
    if (document.querySelector('script[src*="maps.googleapis.com"]')) {
      console.log("Tour planner: Google Maps script already exists")
      setMapLoaded(true)
      return
    }
    
    setMapInitializing(true)
    
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`
    script.async = true
    script.defer = true
    
    script.onload = () => {
      console.log("Tour planner: Google Maps script loaded")
      setMapLoaded(true)
      setMapInitializing(false)
    }
    
    script.onerror = () => {
      console.error("Tour planner: Failed to load Google Maps script")
      setMapInitializing(false)
    }
    
    document.head.appendChild(script)
  }

  // Calculate tour route with Google Maps
  const calculateTourRoute = async () => {
    if (tourSteps.length < 2) {
      alert("Please select at least 2 stops for your tour")
      return
    }

    setTourCalculating(true)
    try {
      const response = await fetch('/api/tours/calculate-route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tourSteps })
      })

      if (response.ok) {
        const data = await response.json()
        setTourRoute(data.route)
        
        // Display route on map using Directions API
        if (mapInstance && directionsService && directionsRenderer && tourSteps.length >= 2) {
          try {
            const waypoints = tourSteps.slice(1, -1).map(step => ({
              location: new window.google.maps.LatLng(step.latitude, step.longitude),
              stopover: true
            }))

            const request = {
              origin: new window.google.maps.LatLng(tourSteps[0].latitude, tourSteps[0].longitude),
              destination: new window.google.maps.LatLng(
                tourSteps[tourSteps.length - 1].latitude, 
                tourSteps[tourSteps.length - 1].longitude
              ),
              waypoints: waypoints,
              optimizeWaypoints: waypoints.length > 0,
              travelMode: window.google.maps.TravelMode.DRIVING
            }

            directionsService.route(request, (result, status) => {
              if (status === window.google.maps.DirectionsStatus.OK && result) {
                directionsRenderer.setMap(mapInstance)
                directionsRenderer.setDirections(result)
                console.log("Tour planner: Route displayed on map successfully")
              } else {
                console.error("Tour planner: Directions request failed:", status)
                // Fallback: show markers instead
                showMarkersOnMap()
              }
            })
          } catch (error) {
            console.error("Tour planner: Error displaying route on map:", error)
            // Fallback: show markers instead
            showMarkersOnMap()
          }
        } else {
          // Fallback: show markers instead
          showMarkersOnMap()
        }
      } else {
        const errorData = await response.json()
        alert(errorData.error || "Failed to calculate tour route")
      }
    } catch (error) {
      console.error("Error calculating tour route:", error)
      alert("Failed to calculate tour route. Please check your internet connection and try again.")
    } finally {
      setTourCalculating(false)
    }
  }

  // Tour saving and loading functions
  const saveTour = async () => {
    if (tourRoute.length === 0) {
      alert("Please calculate a tour route first")
      return
    }

    const tourName = prompt("Enter a name for this tour:")
    if (!tourName) return

    const tourData = {
      id: Date.now().toString(),
      name: tourName,
      startingPoint: tourStartingPoint,
      steps: tourSteps,
      route: tourRoute,
      createdAt: new Date().toISOString()
    }

    try {
      const response = await fetch('/api/tours', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tourData)
      })

      if (response.ok) {
        alert("Tour saved successfully!")
        loadSavedTours()
      } else {
        alert("Failed to save tour")
      }
    } catch (error) {
      console.error("Error saving tour:", error)
      alert("Failed to save tour")
    }
  }

  const loadSavedTours = async () => {
    try {
      const response = await fetch('/api/tours')
      if (response.ok) {
        const tours = await response.json()
        setSavedTours(tours)
        setShowSavedTours(true)
      }
    } catch (error) {
      console.error("Error loading tours:", error)
      alert("Failed to load saved tours")
    }
  }

  const loadTour = (tour: any) => {
    setTourStartingPoint(tour.startingPoint)
    setTourSteps(tour.steps)
    setTourRoute(tour.route)
    setShowSavedTours(false)
  }

  const deleteTour = async (tourId: string) => {
    if (!confirm("Are you sure you want to delete this tour?")) return

    try {
      const response = await fetch(`/api/tours/${tourId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        alert("Tour deleted successfully!")
        loadSavedTours()
      } else {
        alert("Failed to delete tour")
      }
    } catch (error) {
      console.error("Error deleting tour:", error)
      alert("Failed to delete tour")
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-ponte-black">Analysis & Planning</h1>
              <p className="mt-2 text-ponte-olive">Calculate distances and plan property tours</p>
            </div>
            {activeTab === 'analysis' && (
              <div className="flex gap-3">
                <button
                  onClick={calculateDistances}
                  disabled={calculating || properties.length === 0 || destinations.length === 0}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-ponte-terracotta hover:bg-accent-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ponte-terracotta disabled:opacity-50"
                >
                  {calculating ? "Calculating..." : "Calculate Distances"}
                </button>
                <button
                  onClick={exportToGoogleSheets}
                  disabled={getFilteredDistances().length === 0}
                  className="inline-flex items-center px-4 py-2 border border-ponte-sand text-sm font-medium rounded-md text-ponte-black bg-ponte-cream hover:bg-ponte-sand focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ponte-terracotta disabled:opacity-50"
                >
                  Export to CSV
                </button>
              </div>
            )}
            {activeTab === 'tour-planner' && (
              <div className="text-sm text-ponte-olive">
                Plan your property tour with multiple stops
              </div>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-ponte-sand">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('analysis')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'analysis'
                    ? 'border-ponte-terracotta text-ponte-terracotta'
                    : 'border-transparent text-ponte-olive hover:text-ponte-black hover:border-ponte-sand'
                }`}
              >
                Distance Analysis
              </button>
              <button
                onClick={() => setActiveTab('tour-planner')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'tour-planner'
                    ? 'border-ponte-terracotta text-ponte-terracotta'
                    : 'border-transparent text-ponte-olive hover:text-ponte-black hover:border-ponte-sand'
                }`}
              >
                Tour Planner
              </button>
            </nav>
          </div>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        )}

        {/* Analysis Tab Content */}
        {activeTab === 'analysis' && (
          <>
            {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <img 
                    src="/logos/icon-property.png" 
                    alt="Property Icon" 
                    className="w-8 h-8"
                  />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Properties</dt>
                    <dd className="text-lg font-medium text-gray-900">{properties.length}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <img 
                    src="/logos/icon-destination.png" 
                    alt="Destination Icon" 
                    className="w-8 h-8"
                  />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Destinations</dt>
                    <dd className="text-lg font-medium text-gray-900">{destinations.length}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <img 
                    src="/logos/icon-distance.png" 
                    alt="Distance Icon" 
                    className="w-8 h-8"
                  />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Calculated Distances</dt>
                    <dd className="text-lg font-medium text-gray-900">{distances.length}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <img 
                    src="/logos/icon-combined.png" 
                    alt="Combined Icon" 
                    className="w-8 h-8"
                  />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Combinations</dt>
                    <dd className="text-lg font-medium text-gray-900">{(properties.length || 0) * (destinations.length || 0)}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Interface */}
        <div className="bg-white shadow rounded-lg p-6 mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Filter Results</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Property Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Properties
                </label>
                <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-200 rounded-md p-2">
                  {properties && Array.isArray(properties) ? properties.map((property) => (
                    <label key={property.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedProperties.includes(property.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedProperties([...selectedProperties, property.id])
                          } else {
                            setSelectedProperties(selectedProperties.filter(id => id !== property.id))
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        {property.name || "Unnamed Property"} ({property.propertyType})
                      </span>
                    </label>
                  )) : (
                    <div className="text-sm text-gray-500">Loading properties...</div>
                  )}
                </div>
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => {
                      if (properties && Array.isArray(properties)) {
                        setSelectedProperties(properties.map(p => p.id))
                      }
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    Select All
                  </button>
                  <button
                    onClick={() => setSelectedProperties([])}
                    className="text-xs text-gray-600 hover:text-gray-800"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              {/* Destination Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Destinations
                </label>
                <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-200 rounded-md p-2">
                  {destinations && Array.isArray(destinations) ? destinations.map((destination) => (
                    <label key={destination.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedDestinations.includes(destination.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedDestinations([...selectedDestinations, destination.id])
                          } else {
                            setSelectedDestinations(selectedDestinations.filter(id => id !== destination.id))
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        {destination.name} ({destination.category})
                      </span>
                    </label>
                  )) : (
                    <div className="text-sm text-gray-500">Loading destinations...</div>
                  )}
                </div>
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => {
                      if (destinations && Array.isArray(destinations)) {
                        setSelectedDestinations(destinations.map(d => d.id))
                      }
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    Select All
                  </button>
                  <button
                    onClick={() => setSelectedDestinations([])}
                    className="text-xs text-gray-600 hover:text-gray-800"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              {/* Category Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Categories
                </label>
                <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-200 rounded-md p-2">
                  {destinations && Array.isArray(destinations) ? getUniqueCategories().map((category) => (
                    <label key={category} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(category)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCategories([...selectedCategories, category])
                          } else {
                            setSelectedCategories(selectedCategories.filter(cat => cat !== category))
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                      />
                      <span className="ml-2 text-sm text-gray-700">{getCategoryLabel(category)}</span>
                    </label>
                  )) : (
                    <div className="text-sm text-gray-500">Loading categories...</div>
                  )}
                </div>
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => setSelectedCategories(getUniqueCategories())}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    Select All
                  </button>
                  <button
                    onClick={() => setSelectedCategories([])}
                    className="text-xs text-gray-600 hover:text-gray-800"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              {/* Tags Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Tags
                </label>
                <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-200 rounded-md p-2">
                  {properties && destinations && Array.isArray(properties) && Array.isArray(destinations) ? getUniqueTags(properties, destinations).map((tag) => (
                    <label key={tag} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedTags.includes(tag)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTags([...selectedTags, tag])
                          } else {
                            setSelectedTags(selectedTags.filter(t => t !== tag))
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                      />
                      <span className="ml-2 text-sm text-gray-700">{tag}</span>
                    </label>
                  )) : (
                    <div className="text-sm text-gray-500">Loading tags...</div>
                  )}
                </div>
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => {
                      if (properties && destinations && Array.isArray(properties) && Array.isArray(destinations)) {
                        setSelectedTags(getUniqueTags(properties, destinations))
                      }
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    Select All
                  </button>
                  <button
                    onClick={() => setSelectedTags([])}
                    className="text-xs text-gray-600 hover:text-gray-800"
                  >
                    Clear All
                  </button>
                </div>
              </div>
            </div>
            
            <div className="mt-4 flex justify-between items-center">
              <div className="text-sm text-gray-500">
                Showing {getFilteredDistances().length} of {distances.length} results
              </div>
              <div className="text-sm text-gray-600">
                Select at least one property and one destination, category, or tag to see results
              </div>
            </div>
          </div>

        {/* Distances Table */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Distance Analysis Results</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Driving distances and durations between properties and destinations
            </p>
          </div>
          
              {getFilteredDistances().length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📊</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Distance Data</h3>
              <p className="text-gray-500 mb-4">
                {properties.length === 0 || destinations.length === 0 
                  ? "Please add some properties and destinations first"
                  : (selectedProperties.length === 0 && selectedDestinations.length === 0 && selectedCategories.length === 0 && selectedTags.length === 0)
                    ? "Select at least one property and one destination, category, or tag to filter results."
                    : "Click 'Calculate Distances' to analyze driving times and distances"
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Property
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Destination
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Distance (Miles)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Distance (KM)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Driving Duration (Minutes)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Walking Duration (Minutes)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Transit Duration (Minutes)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Directions
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Calculated
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {getFilteredDistances().map((distance) => (
                    <tr key={distance.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {distance.property.name || "Unnamed Property"}
                        </div>
                        <div className="text-sm text-gray-500">
                          {distance.property.streetAddress && distance.property.city 
                            ? `${distance.property.streetAddress}, ${distance.property.city}`
                            : "No address"
                          }
                        </div>
                        <div className="text-xs text-gray-400">
                          {distance.property.propertyType}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {distance.destination.name}
                        </div>
                        <div className="text-sm text-gray-500 break-words max-w-xs">
                          {distance.destination.address}
                        </div>
                        <div className="text-xs text-gray-400">
                          {distance.destination.category}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDistance(distance.distanceMiles, "mi")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDistance(distance.distanceKm, "km")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDuration(distance.durationMinutes)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDuration(distance.walkingDurationMinutes)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDuration(distance.transitDurationMinutes)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <a
                          href={createGoogleMapsUrl(distance.property, distance.destination)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-blue-600 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          🗺️ View Directions
                        </a>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(distance.calculatedAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
          </>
        )}

        {/* Tour Planner Tab Content */}
        {activeTab === 'tour-planner' && (
          <div className="space-y-8">
            {/* Tour Planning Controls */}
            <div className="bg-white rounded-lg shadow border border-ponte-sand p-6">
              <h2 className="text-xl font-semibold text-ponte-black mb-6">Plan Your Tour</h2>
              
              {/* Starting Point Selection - Single Row */}
              <div className="mb-8">
                <h3 className="text-lg font-medium text-ponte-black mb-4">Starting Point</h3>
                
                <div className="flex flex-wrap items-center gap-6">
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="startingType"
                        value="property"
                        checked={tourStartingPoint?.type === 'property'}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setTourStartingPoint({ type: 'property' })
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm text-ponte-black">Property</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="startingType"
                        value="destination"
                        checked={tourStartingPoint?.type === 'destination'}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setTourStartingPoint({ type: 'destination' })
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm text-ponte-black">Destination</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="startingType"
                        value="custom"
                        checked={tourStartingPoint?.type === 'custom'}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setTourStartingPoint({ type: 'custom', address: '' })
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm text-ponte-black">Custom Address</span>
                    </label>
                  </div>

                  {/* Property Selection */}
                  {tourStartingPoint?.type === 'property' && (
                    <div className="flex-1 min-w-64">
                      <select
                        value={tourStartingPoint.id || ''}
                        onChange={(e) => {
                          const property = properties.find(p => p.id === e.target.value)
                          if (property) {
                            setTourStartingPoint({
                              type: 'property',
                              id: property.id,
                              name: property.name || 'Unnamed Property',
                              address: `${property.streetAddress || ''}, ${property.city || ''}`.trim(),
                              latitude: property.latitude,
                              longitude: property.longitude
                            })
                          }
                        }}
                        className="w-full px-3 py-2 border border-ponte-sand rounded-md focus:outline-none focus:ring-2 focus:ring-ponte-terracotta"
                      >
                        <option value="">Select a property...</option>
                        {properties.map(property => (
                          <option key={property.id} value={property.id}>
                            {property.name || 'Unnamed Property'} - {property.streetAddress}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Destination Selection */}
                  {tourStartingPoint?.type === 'destination' && (
                    <div className="flex-1 min-w-64">
                      <select
                        value={tourStartingPoint.id || ''}
                        onChange={(e) => {
                          const destination = destinations.find(d => d.id === e.target.value)
                          if (destination) {
                            setTourStartingPoint({
                              type: 'destination',
                              id: destination.id,
                              name: destination.name,
                              address: destination.address,
                              latitude: destination.latitude,
                              longitude: destination.longitude
                            })
                          }
                        }}
                        className="w-full px-3 py-2 border border-ponte-sand rounded-md focus:outline-none focus:ring-2 focus:ring-ponte-terracotta"
                      >
                        <option value="">Select a destination...</option>
                        {destinations.map(destination => (
                          <option key={destination.id} value={destination.id}>
                            {destination.name} - {getCategoryLabel(destination.category)}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Custom Address */}
                  {tourStartingPoint?.type === 'custom' && (
                    <div className="flex-1 min-w-64">
                      <input
                        type="text"
                        value={tourStartingPoint.address || ''}
                        onChange={(e) => setTourStartingPoint({
                          ...tourStartingPoint,
                          address: e.target.value
                        })}
                        placeholder="Enter address..."
                        className="w-full px-3 py-2 border border-ponte-sand rounded-md focus:outline-none focus:ring-2 focus:ring-ponte-terracotta"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Tour Destinations - Side by Side Tables */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Properties to Visit */}
                <div>
                  <h3 className="text-lg font-medium text-ponte-black mb-4">Properties to Visit</h3>
                  <div className="max-h-64 overflow-y-auto border border-ponte-sand rounded-md">
                    <table className="min-w-full divide-y divide-ponte-sand">
                      <thead className="bg-ponte-sand sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-ponte-black uppercase tracking-wider">
                            Select
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-ponte-black uppercase tracking-wider">
                            Name
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-ponte-black uppercase tracking-wider">
                            Type
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-ponte-black uppercase tracking-wider">
                            Tags
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-ponte-sand">
                        {properties.map(property => (
                          <tr key={property.id} className="hover:bg-ponte-cream">
                            <td className="px-3 py-2 whitespace-nowrap">
                              <input
                                type="checkbox"
                                checked={tourProperties.includes(property.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setTourProperties([...tourProperties, property.id])
                                  } else {
                                    setTourProperties(tourProperties.filter(id => id !== property.id))
                                  }
                                }}
                                className="rounded"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <div className="text-sm font-medium text-ponte-black">
                                {property.name || 'Unnamed Property'}
                              </div>
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-ponte-terracotta text-white">
                                {property.propertyType}
                              </span>
                            </td>
                            <td className="px-3 py-2">
                              <div className="flex flex-wrap gap-1">
                                {property.tags && property.tags.length > 0 ? (
                                  property.tags.map((tag, index) => (
                                    <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-ponte-sand text-ponte-black">
                                      {tag}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-xs text-ponte-olive">No tags</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Destinations to Visit */}
                <div>
                  <h3 className="text-lg font-medium text-ponte-black mb-4">Destinations to Visit</h3>
                  <div className="max-h-64 overflow-y-auto border border-ponte-sand rounded-md">
                    <table className="min-w-full divide-y divide-ponte-sand">
                      <thead className="bg-ponte-sand sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-ponte-black uppercase tracking-wider">
                            Select
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-ponte-black uppercase tracking-wider">
                            Name
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-ponte-black uppercase tracking-wider">
                            Category
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-ponte-black uppercase tracking-wider">
                            Tags
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-ponte-sand">
                        {destinations.map(destination => (
                          <tr key={destination.id} className="hover:bg-ponte-cream">
                            <td className="px-3 py-2 whitespace-nowrap">
                              <input
                                type="checkbox"
                                checked={tourDestinations.includes(destination.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setTourDestinations([...tourDestinations, destination.id])
                                  } else {
                                    setTourDestinations(tourDestinations.filter(id => id !== destination.id))
                                  }
                                }}
                                className="rounded"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <div className="text-sm font-medium text-ponte-black">
                                {destination.name}
                              </div>
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-ponte-terracotta text-white">
                                {getCategoryLabel(destination.category)}
                              </span>
                            </td>
                            <td className="px-3 py-2">
                              <div className="flex flex-wrap gap-1">
                                {destination.tags && destination.tags.length > 0 ? (
                                  destination.tags.map((tag, index) => (
                                    <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-ponte-sand text-ponte-black">
                                      {tag}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-xs text-ponte-olive">No tags</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* Tour Route Planning - Always show */}
            <div className="bg-white rounded-lg shadow border border-ponte-sand p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium text-ponte-black">Tour Route</h3>
                <div className="flex gap-3">
                  <button
                    onClick={calculateTourRoute}
                    disabled={tourCalculating || tourSteps.length < 2}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-ponte-terracotta hover:bg-accent-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ponte-terracotta disabled:opacity-50"
                  >
                    {tourCalculating ? "Calculating Route..." : "Calculate Tour Route"}
                  </button>
                  <button
                    onClick={resetTour}
                    className="inline-flex items-center px-4 py-2 border border-ponte-sand text-sm font-medium rounded-md text-ponte-black bg-ponte-cream hover:bg-ponte-sand focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ponte-terracotta"
                  >
                    Reset Tour
                  </button>
                </div>
              </div>

                {tourSteps.length > 0 ? (
                  <>
                    <div className="mb-4">
                      <p className="text-sm text-ponte-olive mb-4">
                        Drag and drop to reorder your tour stops. The starting point (Step 1) cannot be moved.
                      </p>
                    </div>

                    <div className="space-y-2">
                      {tourSteps.map((step, index) => (
                    <div
                      key={`${step.type}-${step.id}-${index}`}
                      draggable={index > 0}
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, index)}
                      onDragEnd={handleDragEnd}
                      className={`flex items-center p-3 border border-ponte-sand rounded-lg ${
                        index === 0 
                          ? 'bg-ponte-cream cursor-default' 
                          : 'bg-white hover:bg-ponte-cream cursor-move'
                      } ${
                        draggedStep === index ? 'opacity-50' : ''
                      }`}
                    >
                      <div className="flex-shrink-0 w-8 h-8 bg-ponte-terracotta text-white rounded-full flex items-center justify-center text-sm font-medium mr-3">
                        {step.step}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-ponte-black">
                          {step.name}
                        </div>
                        <div className="text-xs text-ponte-olive">
                          {step.address}
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          step.type === 'property' 
                            ? 'bg-ponte-terracotta text-white'
                            : step.type === 'destination'
                            ? 'bg-ponte-olive text-white'
                            : 'bg-ponte-sand text-ponte-black'
                        }`}>
                          {step.type === 'property' 
                            ? step.propertyType 
                            : step.type === 'destination'
                            ? getCategoryLabel(step.category)
                            : 'Starting Point'
                          }
                        </span>
                      </div>
                      {index > 0 && (
                        <div className="flex-shrink-0 ml-2 text-ponte-olive">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM15 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM15 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM15 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"/>
                          </svg>
                        </div>
                      )}
                    </div>
                  ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-ponte-olive">
                    <p>Select properties and destinations to build your tour route</p>
                  </div>
                )}
              </div>
            </div>

            {/* Tour Route Results */}
            {tourRoute.length > 0 && (
              <>
                {/* Tour Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <img 
                            src="/logos/icon-distance.png" 
                            alt="Distance Icon" 
                            className="w-8 h-8"
                          />
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">Total Distance</dt>
                            <dd className="text-lg font-medium text-gray-900">
                              {tourRoute[tourRoute.length - 1]?.distanceText || '0 km'}
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-ponte-terracotta rounded-full flex items-center justify-center">
                            <span className="text-white text-sm">⏱️</span>
                          </div>
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">Total Time</dt>
                            <dd className="text-lg font-medium text-gray-900">
                              {tourRoute[tourRoute.length - 1]?.durationText || '0 min'}
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-ponte-olive rounded-full flex items-center justify-center">
                            <span className="text-white text-sm">📍</span>
                          </div>
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">Tour Stops</dt>
                            <dd className="text-lg font-medium text-gray-900">
                              {tourSteps.length - 1} stops
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tour Summary Table - Full Width */}
                <div className="bg-white rounded-lg shadow border border-ponte-sand mb-8">
                  <div className="px-6 py-4 border-b border-ponte-sand">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium text-ponte-black">Calculated Route</h3>
                      <div className="flex gap-3">
                        <button
                          onClick={saveTour}
                          className="inline-flex items-center px-4 py-2 border border-ponte-sand text-sm font-medium rounded-md text-ponte-black bg-ponte-cream hover:bg-ponte-sand focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ponte-terracotta"
                        >
                          💾 Save Tour
                        </button>
                        <button
                          onClick={loadSavedTours}
                          className="inline-flex items-center px-4 py-2 border border-ponte-sand text-sm font-medium rounded-md text-ponte-black bg-ponte-cream hover:bg-ponte-sand focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ponte-terracotta"
                        >
                          📂 Load Tours
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-ponte-sand">
                      <thead className="bg-ponte-sand">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-ponte-black uppercase tracking-wider">
                            Step
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-ponte-black uppercase tracking-wider">
                            Location
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-ponte-black uppercase tracking-wider">
                            Type
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-ponte-black uppercase tracking-wider">
                            Driving Time
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-ponte-black uppercase tracking-wider">
                            Transit Time
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-ponte-black uppercase tracking-wider">
                            Distance
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-ponte-sand">
                        {tourRoute.map((step, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-ponte-black">
                              {step.step}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-ponte-black">
                              {step.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-ponte-black">
                              {step.type}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-ponte-black">
                              {step.durationText || formatDuration(step.duration)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-ponte-black">
                              {step.transitDurationText || formatDuration(step.transitDuration)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-ponte-black">
                              {step.distanceText || `${(step.distance / 1000).toFixed(1)} km`}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Interactive Map - Full Width Below */}
                <div className="bg-white rounded-lg shadow border border-ponte-sand">
                  <div className="px-6 py-4 border-b border-ponte-sand">
                    <h3 className="text-lg font-medium text-ponte-black">Route Map</h3>
                  </div>
                  <div className="p-6">
                    <div 
                      ref={mapRef}
                      className="h-96 w-full rounded-lg"
                      style={{ minHeight: '384px' }}
                      onLoad={() => console.log("Tour planner: Map container rendered")}
                    />
                    {mapInitializing && (
                      <div className="absolute inset-0 bg-ponte-cream rounded-lg flex items-center justify-center">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ponte-terracotta mx-auto mb-2"></div>
                          <p className="text-ponte-olive">Loading Google Maps...</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Saved Tours Modal */}
            {showSavedTours && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
                  <div className="px-6 py-4 border-b border-ponte-sand">
                    <div className="flex justify-between items-center">
                      <h2 className="text-lg font-semibold text-ponte-black">Saved Tours</h2>
                      <button
                        onClick={() => setShowSavedTours(false)}
                        className="text-ponte-olive hover:text-ponte-black"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    {savedTours.length === 0 ? (
                      <p className="text-ponte-olive text-center py-4">No saved tours yet</p>
                    ) : (
                      <div className="space-y-3">
                        {savedTours.map((tour) => (
                          <div key={tour.id} className="flex justify-between items-center p-3 border border-ponte-sand rounded-lg">
                            <div>
                              <h3 className="font-medium text-ponte-black">{tour.name}</h3>
                              <p className="text-sm text-ponte-olive">
                                {tour.steps.length} stops • {new Date(tour.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => loadTour(tour)}
                                className="px-3 py-1 text-sm bg-ponte-terracotta text-white rounded hover:bg-ponte-olive"
                              >
                                Load
                              </button>
                              <button
                                onClick={() => deleteTour(tour.id)}
                                className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}