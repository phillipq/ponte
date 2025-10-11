"use client"

import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Navigation from "components/Navigation"
import { Button } from "components/Button"

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
  const remainingMinutes = Math.round(minutes % 60)
  
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

const formatDistance = (distanceKm: number | null | undefined): string => {
  if (!distanceKm) return 'N/A'
  const km = distanceKm.toFixed(1)
  const miles = (distanceKm * 0.621371).toFixed(1)
  return `${km} km (${miles} mi)`
}

const formatDistanceFromMeters = (distanceMeters: number | null | undefined): string => {
  if (!distanceMeters) return 'N/A'
  const km = (distanceMeters / 1000).toFixed(1)
  const miles = (distanceMeters / 1000 * 0.621371).toFixed(1)
  return `${km} km (${miles} mi)`
}

export default function AnalysisPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [properties, setProperties] = useState<Property[]>([])
  const [destinations, setDestinations] = useState<Destination[]>([])
  const [distances, setDistances] = useState<PropertyDistance[]>([])
  const [loading, setLoading] = useState(true)
  const [calculating, setCalculating] = useState(false)
  const [calculationProgress, setCalculationProgress] = useState("")
  const [error, setError] = useState("")
  
  // Tab state
  const [activeTab, setActiveTab] = useState<'analysis' | 'tour-planner' | 'saved-tours'>('analysis')
  
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
  const [mapInstance, setMapInstance] = useState<any>(null)
  const [directionsService, setDirectionsService] = useState<any>(null)
  const [directionsRenderer, setDirectionsRenderer] = useState<any>(null)
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
        const propertiesData = await propertiesRes.json() as Property[] | { properties?: Property[] }
        // Handle both direct array and wrapped response
        const properties = Array.isArray(propertiesData) ? propertiesData : propertiesData.properties || []
        setProperties(properties)
      }

      if (destinationsRes.ok) {
        const destinationsData = await destinationsRes.json() as Destination[] | { destinations?: Destination[] }
        // Handle both direct array and wrapped response
        const destinations = Array.isArray(destinationsData) ? destinationsData : destinationsData.destinations || []
        setDestinations(destinations)
      }

      if (distancesRes.ok) {
        const distancesData = await distancesRes.json() as PropertyDistance[] | { distances?: PropertyDistance[] }
        // Handle both direct array and wrapped response
        const distances = Array.isArray(distancesData) ? distancesData : distancesData.distances || []
        setDistances(distances)
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

  // Load saved tours when user is authenticated
  useEffect(() => {
    if (status === "authenticated") {
      loadSavedTours()
    }
  }, [status])

  // Initialize map when tour planner tab is active and Google Maps is loaded
  useEffect(() => {
    if (activeTab === 'tour-planner' && mapLoaded && !mapInstance && mapRef.current) {
      console.log("Tour planner: Creating map with ref:", mapRef.current)
      
      try {
        const newMap = new (window as any).google.maps.Map(mapRef.current, {
          center: { lat: 41.804532, lng: 12.251998 },
          zoom: 6,
          mapTypeId: (window as any).google.maps.MapTypeId.ROADMAP
        })
        
        setMapInstance(newMap)
        setDirectionsService(new (window as any).google.maps.DirectionsService())
        setDirectionsRenderer(new (window as any).google.maps.DirectionsRenderer())
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
  // Calculate distances for analysis tab
  const calculateDistances = async () => {
    setCalculating(true)
    setCalculationProgress("Starting distance calculations...")
    
    try {
      const response = await fetch('/api/analysis/calculate-distances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (response.ok) {
        const data = await response.json() as { 
          success: boolean
          calculated: number
          errors: number
          message?: string
        }
        
        if (data.success) {
          if (data.calculated === 0) {
            setCalculationProgress("All distances already calculated!")
            alert("All distances are already calculated. No new calculations needed.")
          } else {
            setCalculationProgress(`Successfully calculated ${data.calculated} distances`)
            alert(`Calculated ${data.calculated} new distances${data.errors > 0 ? ` (${data.errors} errors)` : ''}`)
          }
          
          // Refresh the distances data
          await fetchData()
        } else {
          alert("Failed to calculate distances")
        }
      } else {
        const errorData = await response.json() as { error?: string }
        alert(errorData.error || "Failed to calculate distances")
      }
    } catch (error) {
      console.error("Error calculating distances:", error)
      alert("Failed to calculate distances. Please check your internet connection and try again.")
    } finally {
      setCalculating(false)
      setCalculationProgress("")
    }
  }

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
        const data = await response.json() as { route: any[] }
        setTourRoute(data.route)
        
        // Display route on map using Directions API
        if (mapInstance && directionsService && directionsRenderer && tourSteps.length >= 2) {
          try {
            const waypoints = tourSteps.slice(1, -1).map(step => ({
              location: new (window as any).google.maps.LatLng(step.latitude, step.longitude),
              stopover: true
            }))

            const request = {
              origin: new (window as any).google.maps.LatLng(tourSteps[0].latitude, tourSteps[0].longitude),
              destination: new (window as any).google.maps.LatLng(
                tourSteps[tourSteps.length - 1].latitude, 
                tourSteps[tourSteps.length - 1].longitude
              ),
              waypoints: waypoints,
              optimizeWaypoints: waypoints.length > 0,
              travelMode: (window as any).google.maps.TravelMode.DRIVING
            }

            directionsService.route(request, (result: any, status: any) => {
              if (status === (window as any).google.maps.DirectionsStatus.OK && result) {
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
        const errorData = await response.json() as { error?: string }
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
        const marker = new (window as any).google.maps.Marker({
          position: { lat: step.latitude, lng: step.longitude },
          map: mapInstance,
          title: step.name
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

  // Build tour steps when starting point, properties, or destinations change
  useEffect(() => {
    const steps = []
    
    // Add starting point as step 1
    if (tourStartingPoint && tourStartingPoint.name) {
      steps.push({
        step: 1,
        type: tourStartingPoint.type,
        id: tourStartingPoint.id,
        name: tourStartingPoint.name,
        address: tourStartingPoint.address || '',
        latitude: tourStartingPoint.latitude,
        longitude: tourStartingPoint.longitude,
        propertyType: tourStartingPoint.type === 'property' ? 
          properties.find(p => p.id === tourStartingPoint.id)?.propertyType : undefined,
        category: tourStartingPoint.type === 'destination' ? 
          destinations.find(d => d.id === tourStartingPoint.id)?.category : undefined
      })
    }
    
    // Add selected properties (excluding starting point if it's a property)
    tourProperties.forEach((propertyId, index) => {
      // Skip if this property is already the starting point
      if (tourStartingPoint?.type === 'property' && tourStartingPoint.id === propertyId) {
        return
      }
      
      const property = properties.find(p => p.id === propertyId)
      if (property) {
        steps.push({
          step: steps.length + 1,
          type: 'property',
          id: property.id,
          name: property.name || 'Unnamed Property',
          address: `${property.streetAddress || ''}, ${property.city || ''}`.trim(),
          latitude: property.latitude,
          longitude: property.longitude,
          propertyType: property.propertyType
        })
      }
    })
    
    // Add selected destinations (excluding starting point if it's a destination)
    tourDestinations.forEach((destinationId, index) => {
      // Skip if this destination is already the starting point
      if (tourStartingPoint?.type === 'destination' && tourStartingPoint.id === destinationId) {
        return
      }
      
      const destination = destinations.find(d => d.id === destinationId)
      if (destination) {
        steps.push({
          step: steps.length + 1,
          type: 'destination',
          id: destination.id,
          name: destination.name,
          address: destination.address,
          latitude: destination.latitude,
          longitude: destination.longitude,
          category: destination.category
        })
      }
    })
    
    setTourSteps(steps)
  }, [tourStartingPoint, tourProperties, tourDestinations, properties, destinations])

  // Tour saving and loading functions
  const saveTour = async () => {
    if (tourRoute.length === 0) {
      alert("Please calculate a tour route first")
      return
    }

    // Generate default tour name
    const defaultTourName = `Tour ${savedTours.length + 1}`
    const tourName = prompt(`Enter a name for this tour:`, defaultTourName)
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
        const tours = await response.json() as any[]
        setSavedTours(tours)
        setShowSavedTours(true)
      }
    } catch (error) {
      console.error("Error loading tours:", error)
      alert("Failed to load saved tours")
    }
  }

  const loadTour = (tour: any) => {
    // Restore tour data
    setTourStartingPoint(tour.startingPoint)
    setTourSteps(tour.steps)
    setTourRoute(tour.route)
    
    // Extract properties and destinations from steps
    const loadedProperties: string[] = []
    const loadedDestinations: string[] = []
    
    tour.steps?.forEach((step: any) => {
      if (step.type === 'property' && step.id) {
        loadedProperties.push(step.id)
      } else if (step.type === 'destination' && step.id) {
        loadedDestinations.push(step.id)
      }
    })
    
    setTourProperties(loadedProperties)
    setTourDestinations(loadedDestinations)
    
    // Switch to tour planner tab
    setActiveTab('tour-planner')
    
    // Close saved tours modal if open
    setShowSavedTours(false)
    
    alert(`Tour "${tour.name}" loaded successfully!`)
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

  const renameTour = async (tourId: string, currentName: string) => {
    const newName = prompt("Enter new name for this tour:", currentName)
    if (!newName || newName.trim() === currentName) return

    try {
      const response = await fetch(`/api/tours/${tourId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim() })
      })

      if (response.ok) {
        alert("Tour renamed successfully!")
        loadSavedTours()
      } else {
        alert("Failed to rename tour")
      }
    } catch (error) {
      console.error("Error renaming tour:", error)
      alert("Failed to rename tour")
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
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                {calculationProgress && (
                  <div className="text-sm text-ponte-olive mt-2">
                    {calculationProgress}
                  </div>
                )}
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
              <button
                onClick={() => setActiveTab('saved-tours')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'saved-tours'
                    ? 'border-ponte-terracotta text-ponte-terracotta'
                    : 'border-transparent text-ponte-olive hover:text-ponte-black hover:border-ponte-sand'
                }`}
              >
                Saved Tours
              </button>
            </nav>
          </div>
        </div>

        {/* Distance Analysis Tab Content */}
        {activeTab === 'analysis' && (
          <div className="space-y-8">
            {/* Selection Controls */}
            <div className="bg-white rounded-lg shadow border border-ponte-sand p-6">
              <h2 className="text-xl font-semibold text-ponte-black mb-6">Select Properties and Destinations</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Properties Selection */}
                <div>
                  <h3 className="text-lg font-medium text-ponte-black mb-4">Properties</h3>
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
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-ponte-sand">
                        {properties && properties.length > 0 ? properties.map(property => (
                          <tr key={property.id} className="hover:bg-ponte-cream">
                            <td className="px-3 py-2 whitespace-nowrap">
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
                          </tr>
                        )) : (
                          <tr>
                            <td colSpan={3} className="px-6 py-4 text-center text-ponte-olive">
                              {loading ? 'Loading properties...' : 'No properties found'}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Destinations Selection */}
                <div>
                  <h3 className="text-lg font-medium text-ponte-black mb-4">Destinations</h3>
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
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-ponte-sand">
                        {destinations && destinations.length > 0 ? destinations.map(destination => (
                          <tr key={destination.id} className="hover:bg-ponte-cream">
                            <td className="px-3 py-2 whitespace-nowrap">
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
                          </tr>
                        )) : (
                          <tr>
                            <td colSpan={3} className="px-6 py-4 text-center text-ponte-olive">
                              {loading ? 'Loading destinations...' : 'No destinations found'}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* Results Table - Only show when selections are made */}
            {selectedProperties.length > 0 && selectedDestinations.length > 0 ? (
              distances.length > 0 && distances.some(distance => 
                selectedProperties.includes(distance.propertyId) && 
                selectedDestinations.includes(distance.destinationId)
              ) ? (
                <div className="bg-white rounded-lg shadow border border-ponte-sand">
                  <div className="px-6 py-4 border-b border-ponte-sand">
                    <h3 className="text-lg font-medium text-ponte-black">Distance Analysis Results</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-ponte-sand">
                      <thead className="bg-ponte-sand">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-ponte-black uppercase tracking-wider">
                            Property
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-ponte-black uppercase tracking-wider">
                            Destination
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-ponte-black uppercase tracking-wider">
                            Driving
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-ponte-black uppercase tracking-wider">
                            Transit
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-ponte-black uppercase tracking-wider">
                            Walking
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-ponte-black uppercase tracking-wider">
                            Directions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-ponte-sand">
                        {distances && distances.length > 0 ? distances
                          .filter(distance => 
                            selectedProperties.includes(distance.propertyId) && 
                            selectedDestinations.includes(distance.destinationId)
                          )
                          .map((distance) => (
                          <tr key={`${distance.propertyId}-${distance.destinationId}`} className="hover:bg-ponte-cream">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-ponte-black">
                                {distance.property.name || 'Unnamed Property'}
                              </div>
                              <div className="text-sm text-ponte-olive">
                                {distance.property.propertyType}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-ponte-black">
                                {distance.destination.name}
                              </div>
                              <div className="text-sm text-ponte-olive">
                                {getCategoryLabel(distance.destination.category)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-ponte-black">
                                {formatDuration(distance.durationMinutes)}
                              </div>
                              <div className="text-xs text-ponte-olive">
                                {formatDistance(distance.distanceKm)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-ponte-black">
                                {formatDuration(distance.transitDurationMinutes)}
                              </div>
                              <div className="text-xs text-ponte-olive">
                                {formatDistanceFromMeters(distance.transitDistance)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-ponte-black">
                                {formatDuration(distance.walkingDurationMinutes)}
                              </div>
                              <div className="text-xs text-ponte-olive">
                                {formatDistanceFromMeters(distance.walkingDistance)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Button
                                intent="secondary"
                                size="sm"
                                onClick={() => {
                                  // Create Google Maps URL for this specific property to destination route
                                  const property = distance.property
                                  const destination = distance.destination
                                  
                                  const mapsUrl = `https://www.google.com/maps/dir/${property.latitude},${property.longitude}/${destination.latitude},${destination.longitude}`
                                  window.open(mapsUrl, '_blank')
                                }}
                                className="flex items-center space-x-1"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span>Maps</span>
                              </Button>
                            </td>
                          </tr>
                        )) : (
                          <tr>
                            <td colSpan={6} className="px-6 py-4 text-center text-ponte-olive">
                              No distance data available. Calculate distances first.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow border border-ponte-sand p-6">
                  <div className="text-center">
                    <h3 className="text-lg font-medium text-ponte-black mb-2">Ready to Calculate</h3>
                    <p className="text-ponte-olive mb-4">
                      You have selected {selectedProperties.length} properties and {selectedDestinations.length} destinations.
                    </p>
                    <p className="text-sm text-ponte-olive mb-2">
                      This will calculate {selectedProperties.length * selectedDestinations.length} distance combinations.
                    </p>
                    <p className="text-sm text-ponte-olive">
                      Click "Calculate Distances" to see travel times and distances.
                    </p>
                  </div>
                </div>
              )
            ) : (
              <div className="bg-white rounded-lg shadow border border-ponte-sand p-6">
                <div className="text-center">
                  <h3 className="text-lg font-medium text-ponte-black mb-2">Select Properties and Destinations</h3>
                  <p className="text-ponte-olive">
                    Choose properties and destinations from the tables above to begin your distance analysis.
                  </p>
                </div>
              </div>
            )}
          </div>
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
                        {properties && properties.length > 0 ? properties.map(property => (
                          <option key={property.id} value={property.id}>
                            {property.name || 'Unnamed Property'} - {property.streetAddress}
                          </option>
                        )) : (
                          <option disabled>Loading properties...</option>
                        )}
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
                        {destinations && destinations.length > 0 ? destinations.map(destination => (
                          <option key={destination.id} value={destination.id}>
                            {destination.name} - {getCategoryLabel(destination.category)}
                          </option>
                        )) : (
                          <option disabled>Loading destinations...</option>
                        )}
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
                        {properties && properties.length > 0 ? properties.map(property => (
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
                        )) : (
                          <tr>
                            <td colSpan={4} className="px-6 py-4 text-center text-ponte-olive">
                              {loading ? 'Loading properties...' : 'No properties found'}
                            </td>
                          </tr>
                        )}
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
                        {destinations && destinations.length > 0 ? destinations.map(destination => (
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
                        )) : (
                          <tr>
                            <td colSpan={4} className="px-6 py-4 text-center text-ponte-olive">
                              {loading ? 'Loading destinations...' : 'No destinations found'}
                            </td>
                          </tr>
                        )}
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
                    onClick={() => {
                      setTourStartingPoint(null)
                      setTourProperties([])
                      setTourDestinations([])
                      setTourSteps([])
                      setTourRoute([])
                    }}
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

            {/* Tour Route Results - Show after calculation */}
            {tourRoute.length > 0 && (
              <div className="bg-white rounded-lg shadow border border-ponte-sand">
                <div className="px-6 py-4 border-b border-ponte-sand">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium text-ponte-black">Tour Route Results</h3>
                    <div className="flex gap-3">
                      <Button
                        intent="primary"
                        size="sm"
                        onClick={saveTour}
                        className="flex items-center space-x-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <span>Save Tour</span>
                      </Button>
                      <Button
                        intent="secondary"
                        size="sm"
                        onClick={() => {
                          // Create Google Maps URL for entire tour
                          const waypoints = tourSteps
                            .map(step => `${step.latitude},${step.longitude}`)
                            .join('/')
                          
                          if (waypoints) {
                            const mapsUrl = `https://www.google.com/maps/dir/${waypoints}`
                            window.open(mapsUrl, '_blank')
                          }
                        }}
                        className="flex items-center space-x-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>View Full Route in Google Maps</span>
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Trip Summary */}
                <div className="px-6 py-4 bg-ponte-cream border-b border-ponte-sand">
                  <h4 className="text-md font-semibold text-ponte-black mb-3">Trip Summary</h4>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="bg-white rounded-lg p-4 border border-ponte-sand">
                      <div className="text-xs text-ponte-olive mb-1">Total Stops</div>
                      <div className="text-2xl font-bold text-ponte-black">{tourSteps.length}</div>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-ponte-sand">
                      <div className="text-xs text-ponte-olive mb-1">Total Distance</div>
                      <div className="text-2xl font-bold text-ponte-black">
                        {formatDistanceFromMeters(tourRoute.reduce((sum, leg) => sum + (leg.distance || 0), 0))}
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-ponte-sand">
                      <div className="text-xs text-ponte-olive mb-1">Driving Time</div>
                      <div className="text-2xl font-bold text-ponte-black">
                        {formatDuration(tourRoute.reduce((sum, leg) => sum + (leg.duration || 0), 0) / 60)}
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-ponte-sand">
                      <div className="text-xs text-ponte-olive mb-1">Walking Time</div>
                      <div className="text-2xl font-bold text-ponte-black">
                        {formatDuration(tourRoute.reduce((sum, leg) => sum + (leg.walkingDuration || 0), 0) / 60)}
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-ponte-sand">
                      <div className="text-xs text-ponte-olive mb-1">Transit Time</div>
                      <div className="text-2xl font-bold text-ponte-black">
                        {formatDuration(tourRoute.reduce((sum, leg) => sum + (leg.transitDuration || 0), 0) / 60)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Detailed Route Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-ponte-sand">
                    <thead className="bg-ponte-sand">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-ponte-black uppercase tracking-wider">
                          Leg
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-ponte-black uppercase tracking-wider">
                          From → To
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-ponte-black uppercase tracking-wider">
                          Driving
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-ponte-black uppercase tracking-wider">
                          Transit
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-ponte-black uppercase tracking-wider">
                          Walking
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-ponte-black uppercase tracking-wider">
                          Directions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-ponte-sand">
                      {tourRoute.map((leg, index) => (
                        <tr key={index} className="hover:bg-ponte-cream">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-ponte-black">Leg {index + 1}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-ponte-black">
                              {index === 0 ? 'Starting Point' : tourSteps[index - 1]?.name || 'Previous Stop'}
                            </div>
                            <div className="text-xs text-ponte-olive">↓</div>
                            <div className="text-sm font-medium text-ponte-black">
                              {leg.name}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-ponte-black">
                              {leg.durationText || formatDuration(leg.duration / 60)}
                            </div>
                            <div className="text-xs text-ponte-olive">
                              {leg.distanceText || formatDistanceFromMeters(leg.distance)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-ponte-black">
                              {leg.transitDurationText || formatDuration(leg.transitDuration / 60)}
                            </div>
                            <div className="text-xs text-ponte-olive">
                              {formatDistanceFromMeters(leg.distance)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-ponte-black">
                              {leg.walkingDurationText || formatDuration(leg.walkingDuration / 60)}
                            </div>
                            <div className="text-xs text-ponte-olive">
                              {formatDistanceFromMeters(leg.distance)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Button
                              intent="secondary"
                              size="sm"
                              onClick={() => {
                                // Create Google Maps URL for this specific leg
                                const fromStep = tourSteps[index]
                                const toStep = tourSteps[index + 1]
                                
                                if (fromStep && toStep) {
                                  const mapsUrl = `https://www.google.com/maps/dir/${fromStep.latitude},${fromStep.longitude}/${toStep.latitude},${toStep.longitude}`
                                  window.open(mapsUrl, '_blank')
                                }
                              }}
                              className="flex items-center space-x-1"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              <span>Maps</span>
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

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

        {/* Saved Tours Tab Content */}
        {activeTab === 'saved-tours' && (
          <div className="space-y-8">
            <div className="bg-white rounded-lg shadow border border-ponte-sand p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-ponte-black">Saved Tours</h2>
                <Button
                  intent="secondary"
                  size="sm"
                  onClick={loadSavedTours}
                  className="flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Refresh</span>
                </Button>
              </div>
              
              {savedTours.length > 0 ? (
                <div className="space-y-4">
                  {savedTours.map((tour) => (
                    <div key={tour.id} className="border border-ponte-sand rounded-lg p-4 hover:bg-ponte-cream transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-ponte-black mb-2">{tour.name}</h3>
                          <div className="text-sm text-ponte-olive mb-3">
                            Created: {new Date(tour.createdAt).toLocaleDateString()} at {new Date(tour.createdAt).toLocaleTimeString()}
                          </div>
                          <div className="text-sm text-ponte-black">
                            <strong>Starting Point:</strong> {tour.startingPoint?.name || 'Unknown'}
                          </div>
                          <div className="text-sm text-ponte-black">
                            <strong>Stops:</strong> {tour.steps?.length || 0} locations
                          </div>
                          {tour.route && tour.route.length > 0 && (
                            <div className="text-sm text-ponte-black">
                              <strong>Total Distance:</strong> {formatDistanceFromMeters(tour.route.reduce((sum: number, leg: any) => sum + (leg.distance || 0), 0))}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button
                            intent="primary"
                            size="sm"
                            onClick={() => loadTour(tour)}
                            className="flex items-center space-x-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>Load</span>
                          </Button>
                          <Button
                            intent="secondary"
                            size="sm"
                            onClick={() => {
                              // Create Google Maps URL for saved tour
                              if (tour.steps && Array.isArray(tour.steps)) {
                                const waypoints = tour.steps
                                  .map((step: any) => `${step.latitude},${step.longitude}`)
                                  .join('/')
                                
                                if (waypoints) {
                                  const mapsUrl = `https://www.google.com/maps/dir/${waypoints}`
                                  window.open(mapsUrl, '_blank')
                                }
                              }
                            }}
                            className="flex items-center space-x-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span>Maps</span>
                          </Button>
                          <Button
                            intent="secondary"
                            size="sm"
                            onClick={() => renameTour(tour.id, tour.name)}
                            className="flex items-center space-x-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            <span>Rename</span>
                          </Button>
                          <Button
                            intent="danger"
                            size="sm"
                            onClick={() => deleteTour(tour.id)}
                            className="flex items-center space-x-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            <span>Delete</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-ponte-olive">
                  <svg className="w-12 h-12 mx-auto mb-4 text-ponte-sand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  <p className="text-lg font-medium mb-2">No saved tours yet</p>
                  <p className="text-sm">Create and save your first tour in the Tour Planner tab!</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
