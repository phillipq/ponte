"use client"

import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Navigation from "components/Navigation"

interface Property {
  id: string
  name?: string
  tags: string[]
  latitude: number
  longitude: number
  propertyType: string
  recipientName?: string | null
  streetAddress: string
  postalCode: string
  city: string
  province?: string | null
  country: string
}

interface Destination {
  id: string
  name: string
  address: string
  latitude: number
  longitude: number
  category?: string
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
  if (!minutes || minutes === 0) return '0 min'
  
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  
  if (hours === 0) {
    return `${remainingMinutes} min`
  } else if (remainingMinutes === 0) {
    return `${hours} hr`
  } else {
    return `${hours} hr ${remainingMinutes} min`
  }
}

// Category normalization function
const normalizeCategory = (category: string | null | undefined): string | null => {
  if (!category) return null
  
  const normalized = category.toLowerCase().trim()
  
  const categoryMap: { [key: string]: string } = {
    'airport': 'airport',
    'international airport': 'int_airport',
    'int_airport': 'int_airport',
    'international_airport': 'int_airport',
    'bus station': 'bus_station',
    'bus_station': 'bus_station',
    'train station': 'train_station',
    'train_station': 'train_station',
    'restaurant': 'restaurant',
    'hotel': 'hotel',
    'other': 'other'
  }
  
  return categoryMap[normalized] || null
}

const getCategoryLabel = (category: string | null | undefined): string => {
  if (!category) return 'Other'
  
  const normalized = normalizeCategory(category)
  const labelMap: { [key: string]: string } = {
    'airport': 'Airport',
    'int_airport': 'International Airport',
    'bus_station': 'Bus Station',
    'train_station': 'Train Station',
    'restaurant': 'Restaurant',
    'hotel': 'Hotel',
    'other': 'Other'
  }
  
  return labelMap[normalized || 'other'] || category
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
      const [propertiesRes, destinationsRes, distancesRes] = await Promise.all([
        fetch("/api/properties"),
        fetch("/api/destinations"),
        fetch("/api/analysis/distances")
      ])

      if (propertiesRes.ok) {
        const propertiesData = await propertiesRes.json()
        setProperties(propertiesData)
      }

      if (destinationsRes.ok) {
        const destinationsData = await destinationsRes.json()
        setDestinations(destinationsData)
      }

      if (distancesRes.ok) {
        const distancesData = await distancesRes.json()
        setDistances(distancesData)
      }
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  // Load Google Maps when page loads
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

  // Calculate tour route using backend API
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
                  onClick={() => {}} // Add calculate distances function
                  disabled={calculating || properties.length === 0 || destinations.length === 0}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-ponte-terracotta hover:bg-accent-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ponte-terracotta disabled:opacity-50"
                >
                  {calculating ? "Calculating..." : "Calculate Distances"}
                </button>
                <button
                  onClick={() => {}} // Add export function
                  disabled={false}
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

        {/* Tour Planner Tab Content */}
        {activeTab === 'tour-planner' && (
          <div className="space-y-8">
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
                    onClick={() => {}} // Add reset function
                    className="inline-flex items-center px-4 py-2 border border-ponte-sand text-sm font-medium rounded-md text-ponte-black bg-ponte-cream hover:bg-ponte-sand focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ponte-terracotta"
                  >
                    Reset Tour
                  </button>
                </div>
              </div>

              {tourSteps.length > 0 ? (
                <div className="space-y-2">
                  {tourSteps.map((step, index) => (
                    <div key={index} className="flex items-center p-3 border border-ponte-sand rounded-lg">
                      <div className="flex-shrink-0 w-8 h-8 bg-ponte-terracotta text-white rounded-full flex items-center justify-center text-sm font-medium mr-3">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-ponte-black">
                          {step.name}
                        </div>
                        <div className="text-xs text-ponte-olive">
                          {step.address}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-ponte-olive">
                  <p>Select properties and destinations to build your tour route</p>
                </div>
              )}
            </div>

            {/* Interactive Map - Always show */}
            <div className="bg-white rounded-lg shadow border border-ponte-sand">
              <div className="px-6 py-4 border-b border-ponte-sand">
                <h3 className="text-lg font-medium text-ponte-black">Route Map</h3>
              </div>
              <div className="p-6">
                <div 
                  ref={mapRef}
                  className="h-96 w-full rounded-lg"
                  style={{ minHeight: '384px' }}
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
          </div>
        )}
      </div>
    </div>
  )
}
