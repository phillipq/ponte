"use client"

import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useEffect, useRef, useState } from "react"
// Using traditional Google Maps API loading method
import { Button } from "components/Button"
import Navigation from "components/Navigation"

// Google Maps type declarations
declare global {
  interface Window {
    google: {
      maps: {
        Map: new (element: HTMLElement, options: MapOptions) => Map
        Marker: new (options: MarkerOptions) => Marker
        InfoWindow: new (options?: InfoWindowOptions) => InfoWindow
        LatLng: new (lat: number, lng: number) => LatLng
        LatLngBounds: new () => LatLngBounds
        Size: new (width: number, height: number) => Size
        Point: new (x: number, y: number) => Point
        PlacesService: new (map: Map) => PlacesService
        MapTypeId: { SATELLITE: string }
        ControlPosition: { TOP_RIGHT: number }
        SymbolPath: { CIRCLE: number }
        places: {
          PlacesService: new (map: Map) => PlacesService
          PlacesServiceStatus: { OK: string }
        }
        event: {
          clearListeners: (instance: unknown, eventName?: string) => void
        }
      }
    }
  }
}


// Type definitions for Google Maps classes
interface Map {
  getCenter(): LatLng | undefined
  getBounds(): LatLngBounds | undefined
  getDiv(): HTMLElement
  setCenter(latLng: LatLng | LatLngLiteral): void
  setZoom(zoom: number): void
  addListener(eventName: string, handler: (event: MapMouseEvent) => void): MapsEventListener
}

interface Marker {
  setPosition(latLng: LatLng | LatLngLiteral): void
  getPosition(): LatLng | undefined
  setMap(map: Map | null): void
  addListener(eventName: string, handler: (event: MapMouseEvent) => void): void
}

interface InfoWindow {
  setContent(content: string): void
  open(map: Map, marker?: Marker): void
  close(): void
  addListener(eventName: string, handler: (event: MapMouseEvent) => void): void
}

interface LatLng {
  lat(): number
  lng(): number
}

interface LatLngBounds {
  getNorthEast(): LatLng
  getSouthWest(): LatLng
}

interface Size {
  width: number
  height: number
}

interface Point {
  x: number
  y: number
}

interface PlacesService {
  textSearch(request: TextSearchRequest, callback: (results: PlaceResult[] | null, status: PlacesServiceStatus) => void): void
}

interface MapOptions {
  center: LatLng | LatLngLiteral
  zoom: number
  mapTypeId?: string
  mapTypeControl?: boolean
  mapTypeControlOptions?: MapTypeControlOptions
  streetViewControl?: boolean
  fullscreenControl?: boolean
  zoomControl?: boolean
}

interface MarkerOptions {
  position: LatLng | LatLngLiteral
  map?: Map
  title?: string
  icon?: string | Icon | Symbol
  draggable?: boolean
}

interface InfoWindowOptions {
  content?: string
}

interface MapTypeControlOptions {
  position?: number
}

interface Icon {
  url: string
  scaledSize?: Size
  anchor?: Point
}

interface Symbol {
  path: number
  scale?: number
  fillColor?: string
  fillOpacity?: number
  strokeColor?: string
  strokeWeight?: number
}

interface LatLngLiteral {
  lat: number
  lng: number
}

interface MapMouseEvent {
  latLng: LatLng | null
  domEvent?: MouseEvent
}

interface MapsEventListener {
  remove(): void
}

interface TextSearchRequest {
  query: string
  fields: string[]
  locationBias?: LatLng | LatLngLiteral
}

interface PlaceResult {
  name?: string
  formatted_address?: string
  place_id?: string
  geometry?: {
    location: LatLng
  }
}

type PlacesServiceStatus = string


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

export default function MapPage() {
  const { data: _session, status } = useSession()
  const router = useRouter()
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<Map | null>(null)
  const [properties, setProperties] = useState<Property[]>([])
  const [destinations, setDestinations] = useState<Destination[]>([])
  const [_selectedCategory, _setSelectedCategory] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [mapLoading, setMapLoading] = useState(true)
  const [scriptLoaded, setScriptLoaded] = useState(false)
  const [mapPin, setMapPin] = useState<Marker | null>(null)
  const [showAddLocation, setShowAddLocation] = useState(false)
  const [locationType, setLocationType] = useState<"property" | "destination">("property")
  const [showInlineForm, setShowInlineForm] = useState(false)
  const [clickedLocation, setClickedLocation] = useState<{ lat: number; lng: number } | null>(null)
  
  // Marker management
  const [propertyMarkers, setPropertyMarkers] = useState<Marker[]>([])
  const [destinationMarkers, setDestinationMarkers] = useState<Marker[]>([])
  
  // Default map location (can be configured)
  const [defaultLocation, setDefaultLocation] = useState({
    lat: 40.7128, // New York City
    lng: -74.0060,
    zoom: 10
  })

  // Load settings on component mount
  useEffect(() => {
    const savedSettings = localStorage.getItem("mapSettings")
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings) as { defaultLocation?: { lat: number; lng: number; zoom: number } }
        if (settings.defaultLocation) {
          setDefaultLocation(settings.defaultLocation)
        }
      } catch (error) {
        console.error("Error loading map settings:", error)
      }
    }
  }, [])
  const [newProperty, setNewProperty] = useState({ 
    name: "", 
    tags: [] as string[],
    useMapLocation: true,
    propertyType: "house",
    // Italian address fields (now primary)
    recipientName: "",
    streetAddress: "",
    postalCode: "",
    city: "",
    province: "",
    country: "ITALY"
  })
  const [newDestination, setNewDestination] = useState({ 
    name: "", 
    address: "",
    category: "",
    latitude: 0,
    longitude: 0
  })
  const [newTag, setNewTag] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<PlaceResult[]>([])
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [_placesService, _setPlacesService] = useState<PlacesService | null>(null)
  const [showLocationMenu, setShowLocationMenu] = useState(false)
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 })
  const [contextLocation, setContextLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [googleMapsPopup, setGoogleMapsPopup] = useState<PlaceResult | null>(null)
  const [showGoogleMapsMenu, setShowGoogleMapsMenu] = useState(false)
  const [movingDestination, setMovingDestination] = useState<string | null>(null)
  const [moveMarker, setMoveMarker] = useState<Marker | null>(null)

  // Simplified property types with icons
  const propertyTypes = [
    { value: "house", label: "House", icon: "🏠" },
    { value: "condo", label: "Condo", icon: "🏢" },
    { value: "apartment", label: "Apartment", icon: "🏘️" },
    { value: "estate", label: "Estate", icon: "🏰" },
  ]

  // Expanded destination categories with icons (sorted alphabetically)
  const destinationCategories = [
    { value: "airport", label: "Airport", icon: "✈️" },
    { value: "int_airport", label: "International Airport", icon: "✈️" },
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
    { value: "school", label: "School", icon: "🎓" },
    { value: "shopping", label: "Shopping", icon: "🛍️" },
    { value: "train_station", label: "Train Station", icon: "🚂" },
  ]

  useEffect(() => {
    console.log("Map page useEffect - status:", status)
    
    if (status === "unauthenticated") {
      console.log("User not authenticated, redirecting to signin")
      router.push("/auth/signin")
      return
    }

    if (status === "authenticated") {
      console.log("User authenticated, starting initialization")
      fetchData()
      
      // Fallback timeout in case map never loads
      const timeout = setTimeout(() => {
        console.log("Map loading timeout - forcing map loading to false")
        setMapLoading(false)
      }, 10000) // 10 second timeout

      return () => clearTimeout(timeout)
    }
  }, [status, router])

  // Initialize map when authenticated and data is loaded
  useEffect(() => {
    if (status === "authenticated" && !loading && !map && !scriptLoaded) {
      console.log("All conditions met, initializing map")
      // Use a small delay to ensure DOM is ready
      setTimeout(() => {
        initializeMap()
      }, 100)
    }
  }, [status, loading, map, scriptLoaded])

  // Handle map click listener when modal is open
  useEffect(() => {
    if (!map) return

    const handleMapClick = (event: MapMouseEvent) => {
      if (event.latLng && showInlineForm) {
        const lat = event.latLng.lat()
        const lng = event.latLng.lng()
        setClickedLocation({ lat, lng })
        
        // Create or update the pin marker
        if (mapPin) {
          mapPin.setPosition({ lat, lng })
        } else {
          const pin = new window.google.maps.Marker({
            position: { lat, lng },
            map: map,
            draggable: true,
            title: "Selected Location",
            icon: {
              url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#3B82F6"/>
                </svg>
              `),
              scaledSize: new window.google.maps.Size(24, 24),
              anchor: new window.google.maps.Point(12, 24)
            }
          })
          
          // Add drag listener to update location
          pin.addListener("dragend", (dragEvent: MapMouseEvent) => {
            if (dragEvent.latLng) {
              const newLat = dragEvent.latLng.lat()
              const newLng = dragEvent.latLng.lng()
              setClickedLocation({ lat: newLat, lng: newLng })
            }
          })
          
          setMapPin(pin)
        }
      }
    }

    // Always add click listener for context menu
    map.addListener("click", handleMapClick)

    // Add listener for Google Maps popup interactions
    const handleGoogleMapsPopupClick = (event: Event) => {
      const target = event.target as HTMLElement
      
      // Check if the click is on a Google Maps popup or info window
      if (target.closest('.gm-style-iw') || target.closest('[data-place-id]') || target.closest('.gm-style-iw-t') || target.closest('.gm-style-iw-c')) {
        // Extract place information from the popup
        const popupElement = target.closest('.gm-style-iw')
        if (popupElement) {
          // Try to extract information from the popup content
          const titleElement = popupElement.querySelector('.gm-style-iw-t')
          const contentElement = popupElement.querySelector('.gm-style-iw-c')
          
          if (titleElement && contentElement) {
            const name = titleElement.textContent || ""
            const address = contentElement.textContent || ""
            
            // Get coordinates from the map center (approximate)
            const center = map.getCenter()
            const lat = center?.lat() || 0
            const lng = center?.lng() || 0
            
            console.log("Google Maps popup detected:", { name, address, lat, lng })
            
            // Set the location and open the form
            setClickedLocation({ lat, lng })
            setShowInlineForm(true)
            setLocationType("destination")
            
            // Pre-populate the destination form with Google Maps data
            setNewDestination({
              name: name || "Google Maps Location",
              address: address || "Address not available",
              category: "Other", // Default category
              latitude: lat,
              longitude: lng
            })
            
            // Show a success message
            console.log("✅ Google Maps location captured and form opened!")
          }
        }
      }
    }

    // Add global click listener for Google Maps popups
    document.addEventListener('click', handleGoogleMapsPopupClick)
    
    // Add a more direct approach to detect marker clicks
    const handleMarkerClick = (event: Event) => {
      const target = event.target as HTMLElement
      
      // Check if clicking on move or edit buttons - ignore these clicks
      if (target.id?.startsWith('move-destination-') || target.id?.startsWith('edit-destination-') ||
          target.closest('[id^="move-destination-"]') || target.closest('[id^="edit-destination-"]')) {
        console.log("🎯 Move/Edit button clicked - ignoring marker click parsing")
        return
      }
      
      // Check if clicking on a Google Maps marker
      if (target.closest('.gm-style-iw') || 
          target.closest('[data-place-id]') || 
          target.closest('.gm-style-iw-t') || 
          target.closest('.gm-style-iw-c') ||
          target.closest('.gm-style-iw-d') ||
          target.closest('.gm-style-iw-b')) {
        
        console.log("🎯 Marker click detected")
        
        // Wait a bit for the popup to appear, then try to extract data
        setTimeout(() => {
          const popupContainer = document.querySelector('.gm-style-iw')
          if (popupContainer) {
            console.log("📦 Popup container found after marker click")
            
            // Extract all text content
            const allText = popupContainer.textContent?.trim() || ""
            console.log("📝 Full popup text from marker click:", allText)
            
            if (allText) {
              // Clean up the text - remove "View on Google Maps" and other unwanted text
              const cleanText = allText
                .replace(/View on Google Maps/gi, '')
                .replace(/Directions/gi, '')
                .replace(/Save/gi, '')
                .replace(/Share/gi, '')
                .replace(/Call/gi, '')
                .replace(/Website/gi, '')
                .trim()
              
              console.log("📝 Cleaned popup text from marker click:", cleanText)
              
              // Try to parse the text
              const lines = cleanText.split('\n').filter(line => line.trim())
              console.log("📝 Parsed lines from marker click:", lines)
              
              let name = ""
              let address = ""
              
              if (lines.length > 1) {
                // Multiple lines - use the original logic
                name = lines[0]?.trim() || ""
                address = lines.slice(1)
                  .filter(line => 
                    !line.includes('View on') && 
                    !line.includes('Directions') && 
                    !line.includes('Save') &&
                    !line.includes('Share') &&
                    !line.includes('Call') &&
                    !line.includes('Website') &&
                    line.trim().length > 0
                  )
                  .join(', ')
              } else if (lines.length === 1) {
                // Single line - try to parse it
                const singleLine = lines[0]?.trim() || ""
                console.log("📝 Single line detected from marker click, parsing:", singleLine)
                
                // Look for patterns like "Business Name Business Name Address"
                const words = singleLine.split(/\s+/)
                console.log("📝 Words from marker click:", words)
                
                if (words.length > 3) {
                  // Try to find a pattern where the business name is repeated
                  let bestMatch = { name: "", address: "", score: 0 }
                  
                  for (let i = 1; i < Math.min(words.length / 2, 10); i++) {
                    const firstPart = words.slice(0, i).join(' ')
                    const secondPart = words.slice(i, i + i).join(' ')
                    
                    if (firstPart === secondPart && firstPart.length > 0) {
                      const remainingWords = words.slice(i + i)
                      const address = remainingWords.join(' ')
                      
                      // Score based on how much of the text is covered
                      const coverage = (firstPart.length * 2 + address.length) / singleLine.length
                      
                      if (coverage > bestMatch.score) {
                        bestMatch = { name: firstPart, address: address, score: coverage }
                        console.log("📝 Found repeated pattern from marker click:", { name: firstPart, address, coverage })
                      }
                    }
                  }
                  
                  if (bestMatch.name && bestMatch.address) {
                    name = bestMatch.name
                    address = bestMatch.address
                    console.log("📝 Using best repeated pattern from marker click:", { name, address })
                  } else {
                    // Fallback: try to split at common address indicators
                    const addressIndicators = ['V.', 'Via', 'Street', 'St.', 'Avenue', 'Ave.', 'Road', 'Rd.', 'Boulevard', 'Blvd.']
                    let splitIndex = -1
                    
                    for (const indicator of addressIndicators) {
                      const index = singleLine.indexOf(indicator)
                      if (index > 0) {
                        splitIndex = index
                        break
                      }
                    }
                    
                    if (splitIndex > 0) {
                      name = singleLine.substring(0, splitIndex).trim()
                      address = singleLine.substring(splitIndex).trim()
                      console.log("📝 Split at address indicator from marker click:", { name, address })
                    } else {
                      // Final fallback: take first few words as name, rest as address
                      const nameWords = words.slice(0, Math.min(3, words.length))
                      name = nameWords.join(' ')
                      address = words.slice(nameWords.length).join(' ')
                      console.log("📝 Fallback split from marker click:", { name, address })
                    }
                  }
                } else {
                  // Too few words, treat as name only
                  name = singleLine
                  address = ""
                  console.log("📝 Too few words from marker click, using as name only:", { name })
                }
              } else {
                // If no newlines, try to parse the single line
                console.log("📝 No newlines found, parsing single line:", cleanText)
                
                // Look for patterns like "Business Name Business Name Address"
                // Try to find where the business name repeats
                const words = cleanText.split(/\s+/)
                console.log("📝 Words:", words)
                
                if (words.length > 3) {
                  // Try to find a pattern where the business name is repeated
                  // Start from 1 word and go up to find the best match
                  let bestMatch = { name: "", address: "", score: 0 }
                  
                  for (let i = 1; i < Math.min(words.length / 2, 10); i++) {
                    const firstPart = words.slice(0, i).join(' ')
                    const secondPart = words.slice(i, i + i).join(' ')
                    
                    if (firstPart === secondPart && firstPart.length > 0) {
                      const remainingWords = words.slice(i + i)
                      const address = remainingWords.join(' ')
                      
                      // Score based on how much of the text is covered
                      const coverage = (firstPart.length * 2 + address.length) / cleanText.length
                      
                      if (coverage > bestMatch.score) {
                        bestMatch = { name: firstPart, address: address, score: coverage }
                        console.log("📝 Found repeated pattern:", { name: firstPart, address, coverage })
                      }
                    }
                  }
                  
                  if (bestMatch.name && bestMatch.address) {
                    name = bestMatch.name
                    address = bestMatch.address
                    console.log("📝 Using best repeated pattern:", { name, address })
                  }
                  
                  // If no pattern found, try to split at common address indicators
                  if (!name || !address) {
                    const addressIndicators = ['V.', 'Via', 'Street', 'St.', 'Avenue', 'Ave.', 'Road', 'Rd.', 'Boulevard', 'Blvd.']
                    let splitIndex = -1
                    
                    for (const indicator of addressIndicators) {
                      const index = cleanText.indexOf(indicator)
                      if (index > 0) {
                        splitIndex = index
                        break
                      }
                    }
                    
                    if (splitIndex > 0) {
                      name = cleanText.substring(0, splitIndex).trim()
                      address = cleanText.substring(splitIndex).trim()
                      console.log("📝 Split at address indicator:", { name, address })
                    } else {
                      // Fallback: take first few words as name, rest as address
                      const nameWords = words.slice(0, Math.min(3, words.length))
                      name = nameWords.join(' ')
                      address = words.slice(nameWords.length).join(' ')
                      console.log("📝 Fallback split:", { name, address })
                    }
                  }
                }
              }
              
              // Get coordinates from the actual marker location
              let lat = 0
              let lng = 0
              
              // Try to get from popup data attributes
              const popupData = popupContainer.getAttribute('data-lat') || popupContainer.getAttribute('data-lng')
              if (popupData) {
                lat = parseFloat(popupContainer.getAttribute('data-lat') || '0')
                lng = parseFloat(popupContainer.getAttribute('data-lng') || '0')
              }
              
              // Try to get from the popup's position relative to map
              if (lat === 0 && lng === 0) {
                const popupRect = popupContainer.getBoundingClientRect()
                const mapRect = map.getDiv().getBoundingClientRect()
                
                const relativeX = (popupRect.left + popupRect.width / 2 - mapRect.left) / mapRect.width
                const relativeY = (popupRect.top + popupRect.height / 2 - mapRect.top) / mapRect.height
                
                const bounds = map.getBounds()
                if (bounds) {
                  const ne = bounds.getNorthEast()
                  const sw = bounds.getSouthWest()
                  lat = sw.lat() + (ne.lat() - sw.lat()) * (1 - relativeY)
                  lng = sw.lng() + (ne.lng() - sw.lng()) * relativeX
                }
              }
              
              // Fallback to map center if we can't get marker position
              if (lat === 0 && lng === 0) {
                const center = map.getCenter()
                lat = center?.lat() || 0
                lng = center?.lng() || 0
              }
              
              console.log("📍 Extracted from marker click:", { name, address, lat, lng })
              
              if (name || address) {
                // Set the location and open the form
                setClickedLocation({ lat, lng })
                setShowInlineForm(true)
                setLocationType("destination")
                
                // Pre-populate the destination form
                setNewDestination({
                  name: name || "Google Maps Location",
                  address: address || "Address not available",
                  category: "Other",
                  latitude: lat,
                  longitude: lng
                })
                
                console.log("✅ Form opened with marker click data!")
              }
            }
          }
        }, 200) // Wait for popup to appear
      }
    }
    
    // Add the marker click listener
    document.addEventListener('click', handleMarkerClick)
    
    // Also add a more comprehensive listener for Google Maps interactions
    const handleGoogleMapsInteraction = (event: Event) => {
      const target = event.target as HTMLElement
      
      // Check for various Google Maps elements
      if (target.closest('.gm-style-iw') || 
          target.closest('[data-place-id]') || 
          target.closest('.gm-style-iw-t') || 
          target.closest('.gm-style-iw-c') ||
          target.closest('.gm-style-iw-d') ||
          target.closest('.gm-style-iw-b')) {
        
        console.log("🔍 Google Maps interaction detected:", target.className)
        
        // Try to find the popup container
        const popupContainer = target.closest('.gm-style-iw') || 
                              target.closest('.gm-style-iw-t')?.closest('.gm-style-iw')
        
        if (popupContainer) {
          console.log("📦 Popup container found:", popupContainer)
          
          // Try multiple ways to extract information
          const titleElement = popupContainer.querySelector('.gm-style-iw-t')
          const contentElement = popupContainer.querySelector('.gm-style-iw-c')
          
          let name = ""
          let address = ""
          
          // Method 1: Try to get from title and content elements
          if (titleElement) {
            name = titleElement.textContent?.trim() || ""
            console.log("📝 Title found:", name)
          }
          
          if (contentElement) {
            address = contentElement.textContent?.trim() || ""
            console.log("📝 Content found:", address)
          }
          
          // Method 2: If no specific elements, try to get from the entire popup
          if (!name && !address) {
            const allText = popupContainer.textContent?.trim() || ""
            console.log("📝 All popup text:", allText)
            
            // Clean up the text - remove "View on Google Maps" and other unwanted text
            const cleanText = allText
              .replace(/View on Google Maps/gi, '')
              .replace(/Directions/gi, '')
              .replace(/Save/gi, '')
              .replace(/Share/gi, '')
              .replace(/Call/gi, '')
              .replace(/Website/gi, '')
              .trim()
            
            console.log("📝 Cleaned popup text:", cleanText)
            
            // Try to parse the text to extract name and address
            const lines = cleanText.split('\n').filter(line => line.trim())
            console.log("📝 Parsed lines:", lines)
            
            if (lines.length > 1) {
              // Multiple lines - use the original logic
              name = lines[0]?.trim() || ""
              address = lines.slice(1)
                .filter(line => 
                  !line.includes('View on') && 
                  !line.includes('Directions') && 
                  !line.includes('Save') &&
                  !line.includes('Share') &&
                  !line.includes('Call') &&
                  !line.includes('Website') &&
                  line.trim().length > 0
                )
                .join(', ')
            } else if (lines.length === 1) {
              // Single line - try to parse it
              const singleLine = lines[0]?.trim() || ""
              console.log("📝 Single line detected, parsing:", singleLine)
              
              // Look for patterns like "Business Name Business Name Address"
              const words = singleLine.split(/\s+/)
              console.log("📝 Words:", words)
              
              if (words.length > 3) {
                // Try to find a pattern where the business name is repeated
                let bestMatch = { name: "", address: "", score: 0 }
                
                for (let i = 1; i < Math.min(words.length / 2, 10); i++) {
                  const firstPart = words.slice(0, i).join(' ')
                  const secondPart = words.slice(i, i + i).join(' ')
                  
                  if (firstPart === secondPart && firstPart.length > 0) {
                    const remainingWords = words.slice(i + i)
                    const address = remainingWords.join(' ')
                    
                    // Score based on how much of the text is covered
                    const coverage = (firstPart.length * 2 + address.length) / singleLine.length
                    
                    if (coverage > bestMatch.score) {
                      bestMatch = { name: firstPart, address: address, score: coverage }
                      console.log("📝 Found repeated pattern:", { name: firstPart, address, coverage })
                    }
                  }
                }
                
                if (bestMatch.name && bestMatch.address) {
                  name = bestMatch.name
                  address = bestMatch.address
                  console.log("📝 Using best repeated pattern:", { name, address })
                } else {
                  // Fallback: try to split at common address indicators
                  const addressIndicators = ['V.', 'Via', 'Street', 'St.', 'Avenue', 'Ave.', 'Road', 'Rd.', 'Boulevard', 'Blvd.']
                  let splitIndex = -1
                  
                  for (const indicator of addressIndicators) {
                    const index = singleLine.indexOf(indicator)
                    if (index > 0) {
                      splitIndex = index
                      break
                    }
                  }
                  
                  if (splitIndex > 0) {
                    name = singleLine.substring(0, splitIndex).trim()
                    address = singleLine.substring(splitIndex).trim()
                    console.log("📝 Split at address indicator:", { name, address })
                  } else {
                    // Final fallback: take first few words as name, rest as address
                    const nameWords = words.slice(0, Math.min(3, words.length))
                    name = nameWords.join(' ')
                    address = words.slice(nameWords.length).join(' ')
                    console.log("📝 Fallback split:", { name, address })
                  }
                }
              } else {
                // Too few words, treat as name only
                name = singleLine
                address = ""
                console.log("📝 Too few words, using as name only:", { name })
              }
            } else {
              // If no newlines, try to parse the single line
              console.log("📝 No newlines found, parsing single line:", cleanText)
              
              // Look for patterns like "Business Name Business Name Address"
              // Try to find where the business name repeats
              const words = cleanText.split(/\s+/)
              console.log("📝 Words:", words)
              
              if (words.length > 3) {
                // Try to find a pattern where the business name is repeated
                // Start from 1 word and go up to find the best match
                let bestMatch = { name: "", address: "", score: 0 }
                
                for (let i = 1; i < Math.min(words.length / 2, 10); i++) {
                  const firstPart = words.slice(0, i).join(' ')
                  const secondPart = words.slice(i, i + i).join(' ')
                  
                  if (firstPart === secondPart && firstPart.length > 0) {
                    const remainingWords = words.slice(i + i)
                    const address = remainingWords.join(' ')
                    
                    // Score based on how much of the text is covered
                    const coverage = (firstPart.length * 2 + address.length) / cleanText.length
                    
                    if (coverage > bestMatch.score) {
                      bestMatch = { name: firstPart, address: address, score: coverage }
                      console.log("📝 Found repeated pattern:", { name: firstPart, address, coverage })
                    }
                  }
                }
                
                if (bestMatch.name && bestMatch.address) {
                  name = bestMatch.name
                  address = bestMatch.address
                  console.log("📝 Using best repeated pattern:", { name, address })
                }
                
                // If no pattern found, try to split at common address indicators
                if (!name || !address) {
                  const addressIndicators = ['V.', 'Via', 'Street', 'St.', 'Avenue', 'Ave.', 'Road', 'Rd.', 'Boulevard', 'Blvd.']
                  let splitIndex = -1
                  
                  for (const indicator of addressIndicators) {
                    const index = cleanText.indexOf(indicator)
                    if (index > 0) {
                      splitIndex = index
                      break
                    }
                  }
                  
                  if (splitIndex > 0) {
                    name = cleanText.substring(0, splitIndex).trim()
                    address = cleanText.substring(splitIndex).trim()
                    console.log("📝 Split at address indicator:", { name, address })
                  } else {
                    // Fallback: take first few words as name, rest as address
                    const nameWords = words.slice(0, Math.min(3, words.length))
                    name = nameWords.join(' ')
                    address = words.slice(nameWords.length).join(' ')
                    console.log("📝 Fallback split:", { name, address })
                  }
                }
              }
            }
          }
          
          // Method 3: Try to get from any text content in the popup
          if (!name && !address) {
            const textNodes = Array.from(popupContainer.querySelectorAll('*')).map(el => el.textContent?.trim()).filter(text => text && text.length > 0)
            console.log("📝 All text nodes:", textNodes)
            
            if (textNodes.length > 0) {
              name = textNodes[0] || ""
              if (textNodes.length > 1) {
                address = textNodes.slice(1).join(', ')
              }
            }
          }
          
          // Get coordinates from the actual marker location, not map center
          // Try to get the marker position from the popup
          let lat = 0
          let lng = 0
          
          // Method 1: Try to get from popup data attributes
          const popupData = popupContainer.getAttribute('data-lat') || popupContainer.getAttribute('data-lng')
          if (popupData) {
            lat = parseFloat(popupContainer.getAttribute('data-lat') || '0')
            lng = parseFloat(popupContainer.getAttribute('data-lng') || '0')
          }
          
          // Method 2: Try to get from the popup's position relative to map
          if (lat === 0 && lng === 0) {
            const popupRect = popupContainer.getBoundingClientRect()
            const mapRect = map.getDiv().getBoundingClientRect()
            
            // Calculate position based on popup position relative to map
            const relativeX = (popupRect.left + popupRect.width / 2 - mapRect.left) / mapRect.width
            const relativeY = (popupRect.top + popupRect.height / 2 - mapRect.top) / mapRect.height
            
            const bounds = map.getBounds()
            if (bounds) {
              const ne = bounds.getNorthEast()
              const sw = bounds.getSouthWest()
              // Invert Y coordinate because popup appears above marker
              lat = sw.lat() + (ne.lat() - sw.lat()) * (1 - relativeY)
              lng = sw.lng() + (ne.lng() - sw.lng()) * relativeX
            }
          }
          
          // Method 3: Try to get from the popup's arrow position (more accurate)
          if (lat === 0 && lng === 0) {
            const popupArrow = popupContainer.querySelector('.gm-style-iw-tc')
            if (popupArrow) {
              const arrowRect = popupArrow.getBoundingClientRect()
              const mapRect = map.getDiv().getBoundingClientRect()
              
              const relativeX = (arrowRect.left + arrowRect.width / 2 - mapRect.left) / mapRect.width
              const relativeY = (arrowRect.top + arrowRect.height / 2 - mapRect.top) / mapRect.height
              
              const bounds = map.getBounds()
              if (bounds) {
                const ne = bounds.getNorthEast()
                const sw = bounds.getSouthWest()
                lat = sw.lat() + (ne.lat() - sw.lat()) * (1 - relativeY)
                lng = sw.lng() + (ne.lng() - sw.lng()) * relativeX
              }
            }
          }
          
          // Method 4: Fallback to map center if we can't get marker position
          if (lat === 0 && lng === 0) {
            const center = map.getCenter()
            lat = center?.lat() || 0
            lng = center?.lng() || 0
          }
          
          console.log("📍 Final extracted data:", { name, address, lat, lng })
          
          if (name || address) {
            console.log("✅ Google Maps location captured:", { name, address, lat, lng })
            
            // Set the location and open the form
            setClickedLocation({ lat, lng })
            setShowInlineForm(true)
            setLocationType("destination")
            
            // Pre-populate the destination form
            setNewDestination({
              name: name || "Google Maps Location",
              address: address || "Address not available",
              category: "Other",
              latitude: lat,
              longitude: lng
            })
            
            console.log("✅ Form opened with Google Maps data!")
          } else {
            console.log("⚠️ No useful data extracted from popup")
          }
        } else {
          console.log("❌ No popup container found")
        }
      }
    }
    
    // Add the enhanced listener
    document.addEventListener('click', handleGoogleMapsInteraction)
    
    // Add a more direct approach - listen for clicks on popup content
    const handlePopupContentClick = (event: Event) => {
      const target = event.target as HTMLElement
      
      // Check if clicking on move or edit buttons - ignore these clicks
      if (target.id?.startsWith('move-destination-') || target.id?.startsWith('edit-destination-') ||
          target.closest('[id^="move-destination-"]') || target.closest('[id^="edit-destination-"]')) {
        console.log("🎯 Move/Edit button clicked - ignoring popup parsing")
        return
      }
      
      // Check if clicking on popup content
      if (target.closest('.gm-style-iw-c') || target.closest('.gm-style-iw-t')) {
        console.log("🎯 Direct popup content click detected")
        
        const popupContainer = target.closest('.gm-style-iw')
        if (popupContainer) {
          console.log("📦 Popup container found for direct click")
          
          // Extract all text content
          const allText = popupContainer.textContent?.trim() || ""
          console.log("📝 Full popup text:", allText)
          
          if (allText) {
            // Clean up the text - remove "View on Google Maps" and other unwanted text
            const cleanText = allText
              .replace(/View on Google Maps/gi, '')
              .replace(/Directions/gi, '')
              .replace(/Save/gi, '')
              .replace(/Share/gi, '')
              .replace(/Call/gi, '')
              .replace(/Website/gi, '')
              .trim()
            
            console.log("📝 Cleaned popup text:", cleanText)
            
            // Try to parse the text
            const lines = cleanText.split('\n').filter(line => line.trim())
            console.log("📝 Parsed lines:", lines)
            
            let name = ""
            let address = ""
            
            if (lines.length > 0) {
              // Get the first line as name, but clean it up
              name = lines[0]?.trim() || ""
              
              // If the name contains the business name twice (common issue), clean it up
              const nameWords = name.split(' ')
              if (nameWords.length > 2) {
                // Check if the first half is repeated in the second half
                const midPoint = Math.floor(nameWords.length / 2)
                const firstHalf = nameWords.slice(0, midPoint).join(' ')
                const secondHalf = nameWords.slice(midPoint).join(' ')
                
                if (firstHalf === secondHalf) {
                  name = firstHalf
                  console.log("📝 Cleaned duplicate name:", name)
                }
              }
              
              if (lines.length > 1) {
                // Join remaining lines as address, but filter out common UI elements
                address = lines.slice(1)
                  .filter(line => 
                    !line.includes('View on') && 
                    !line.includes('Directions') && 
                    !line.includes('Save') &&
                    !line.includes('Share') &&
                    !line.includes('Call') &&
                    !line.includes('Website') &&
                    line.trim().length > 0
                  )
                  .join(', ')
              }
            }
            
            // Get coordinates from the actual marker location, not map center
            let lat = 0
            let lng = 0
            
            // Method 1: Try to get from popup data attributes
            const popupData = popupContainer.getAttribute('data-lat') || popupContainer.getAttribute('data-lng')
            if (popupData) {
              lat = parseFloat(popupContainer.getAttribute('data-lat') || '0')
              lng = parseFloat(popupContainer.getAttribute('data-lng') || '0')
            }
            
            // Method 2: Try to get from the popup's position relative to map
            if (lat === 0 && lng === 0) {
              const popupRect = popupContainer.getBoundingClientRect()
              const mapRect = map.getDiv().getBoundingClientRect()
              
              // Calculate position based on popup position relative to map
              const relativeX = (popupRect.left + popupRect.width / 2 - mapRect.left) / mapRect.width
              const relativeY = (popupRect.top + popupRect.height / 2 - mapRect.top) / mapRect.height
              
              const bounds = map.getBounds()
              if (bounds) {
                const ne = bounds.getNorthEast()
                const sw = bounds.getSouthWest()
                // Invert Y coordinate because popup appears above marker
                lat = sw.lat() + (ne.lat() - sw.lat()) * (1 - relativeY)
                lng = sw.lng() + (ne.lng() - sw.lng()) * relativeX
              }
            }
            
            // Method 3: Try to get from the popup's arrow position (more accurate)
            if (lat === 0 && lng === 0) {
              const popupArrow = popupContainer.querySelector('.gm-style-iw-tc')
              if (popupArrow) {
                const arrowRect = popupArrow.getBoundingClientRect()
                const mapRect = map.getDiv().getBoundingClientRect()
                
                const relativeX = (arrowRect.left + arrowRect.width / 2 - mapRect.left) / mapRect.width
                const relativeY = (arrowRect.top + arrowRect.height / 2 - mapRect.top) / mapRect.height
                
                const bounds = map.getBounds()
                if (bounds) {
                  const ne = bounds.getNorthEast()
                  const sw = bounds.getSouthWest()
                  lat = sw.lat() + (ne.lat() - sw.lat()) * (1 - relativeY)
                  lng = sw.lng() + (ne.lng() - sw.lng()) * relativeX
                }
              }
            }
            
            // Method 4: Fallback to map center if we can't get marker position
            if (lat === 0 && lng === 0) {
              const center = map.getCenter()
              lat = center?.lat() || 0
              lng = center?.lng() || 0
            }
            
            console.log("📍 Extracted from direct click:", { name, address, lat, lng })
            
            if (name || address) {
              // Set the location and open the form
              setClickedLocation({ lat, lng })
              setShowInlineForm(true)
              setLocationType("destination")
              
              // Pre-populate the destination form
              setNewDestination({
                name: name || "Google Maps Location",
                address: address || "Address not available",
                category: "Other",
                latitude: lat,
                longitude: lng
              })
              
              console.log("✅ Form opened with direct click data!")
            }
          }
        }
      }
    }
    
    // Add the direct click listener
    document.addEventListener('click', handlePopupContentClick)
    
    // Add mutation observer to detect Google Maps popups
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element
              if (element.classList?.contains('gm-style-iw') || element.querySelector?.('.gm-style-iw')) {
                console.log("Google Maps popup detected via mutation observer")
                
                // Try to extract data from the newly created popup
                const popupElement = element.classList?.contains('gm-style-iw') ? element : element.querySelector('.gm-style-iw')
                if (popupElement) {
                  console.log("📦 New popup element:", popupElement)
                  
                  // Wait a bit for the popup to fully render
                  setTimeout(() => {
                    const titleElement = popupElement.querySelector('.gm-style-iw-t')
                    const contentElement = popupElement.querySelector('.gm-style-iw-c')
                    
                    let name = ""
                    let address = ""
                    
                    if (titleElement) {
                      name = titleElement.textContent?.trim() || ""
                      console.log("📝 Popup title:", name)
                    }
                    
                    if (contentElement) {
                      address = contentElement.textContent?.trim() || ""
                      console.log("📝 Popup content:", address)
                    }
                    
                    // If we don't have specific elements, try to parse all text
                    if (!name && !address) {
                      const allText = popupElement.textContent?.trim() || ""
                      console.log("📝 All popup text from observer:", allText)
                      
                      // Clean up the text - remove "View on Google Maps" and other unwanted text
                      const cleanText = allText
                        .replace(/View on Google Maps/gi, '')
                        .replace(/Directions/gi, '')
                        .replace(/Save/gi, '')
                        .replace(/Share/gi, '')
                        .replace(/Call/gi, '')
                        .replace(/Website/gi, '')
                        .trim()
                      
                      console.log("📝 Cleaned popup text from observer:", cleanText)
                      
                      // Try to parse the text
                      const lines = cleanText.split('\n').filter(line => line.trim())
                      console.log("📝 Parsed lines from observer:", lines)
                      
                      if (lines.length > 1) {
                        // Multiple lines - use the original logic
                        name = lines[0]?.trim() || ""
                        address = lines.slice(1)
                          .filter(line => 
                            !line.includes('View on') && 
                            !line.includes('Directions') && 
                            !line.includes('Save') &&
                            !line.includes('Share') &&
                            !line.includes('Call') &&
                            !line.includes('Website') &&
                            line.trim().length > 0
                          )
                          .join(', ')
                      } else if (lines.length === 1) {
                        // Single line - try to parse it with duplicate pattern detection
                        const singleLine = lines[0]?.trim() || ""
                        console.log("📝 Single line detected from observer, parsing:", singleLine)
                        
                        // Look for patterns like "Business Name Business Name Address"
                        const words = singleLine.split(/\s+/)
                        console.log("📝 Words from observer:", words)
                        
                        if (words.length > 3) {
                          // Try to find a pattern where the business name is repeated
                          let bestMatch = { name: "", address: "", score: 0 }
                          
                          for (let i = 1; i < Math.min(words.length / 2, 10); i++) {
                            const firstPart = words.slice(0, i).join(' ')
                            const secondPart = words.slice(i, i + i).join(' ')
                            
                            if (firstPart === secondPart && firstPart.length > 0) {
                              const remainingWords = words.slice(i + i)
                              const address = remainingWords.join(' ')
                              
                              // Score based on how much of the text is covered
                              const coverage = (firstPart.length * 2 + address.length) / singleLine.length
                              
                              if (coverage > bestMatch.score) {
                                bestMatch = { name: firstPart, address: address, score: coverage }
                                console.log("📝 Found repeated pattern from observer:", { name: firstPart, address, coverage })
                              }
                            }
                          }
                          
                          if (bestMatch.name && bestMatch.address) {
                            name = bestMatch.name
                            address = bestMatch.address
                            console.log("📝 Using best repeated pattern from observer:", { name, address })
                          } else {
                            // Fallback: try to split at common address indicators
                            const addressIndicators = ['V.', 'Via', 'Street', 'St.', 'Avenue', 'Ave.', 'Road', 'Rd.', 'Boulevard', 'Blvd.']
                            let splitIndex = -1
                            
                            for (const indicator of addressIndicators) {
                              const index = singleLine.indexOf(indicator)
                              if (index > 0) {
                                splitIndex = index
                                break
                              }
                            }
                            
                            if (splitIndex > 0) {
                              name = singleLine.substring(0, splitIndex).trim()
                              address = singleLine.substring(splitIndex).trim()
                              console.log("📝 Split at address indicator from observer:", { name, address })
                            } else {
                              // Final fallback: take first few words as name, rest as address
                              const nameWords = words.slice(0, Math.min(3, words.length))
                              name = nameWords.join(' ')
                              address = words.slice(nameWords.length).join(' ')
                              console.log("📝 Fallback split from observer:", { name, address })
                            }
                          }
                        } else {
                          // Too few words, treat as name only
                          name = singleLine
                          address = ""
                          console.log("📝 Too few words from observer, using as name only:", { name })
                        }
                      }
                    }
                    
                    // If we have data, automatically open the form
                    if (name || address) {
                      console.log("✅ Popup data ready for capture:", { name, address })
                      
                      // Get coordinates from the popup position
                      let lat = 0
                      let lng = 0
                      
                      // Try to get from popup data attributes
                      const popupData = popupElement.getAttribute('data-lat') || popupElement.getAttribute('data-lng')
                      if (popupData) {
                        lat = parseFloat(popupElement.getAttribute('data-lat') || '0')
                        lng = parseFloat(popupElement.getAttribute('data-lng') || '0')
                      }
                      
                      // Try to get from the popup's position relative to map
                      if (lat === 0 && lng === 0) {
                        const popupRect = popupElement.getBoundingClientRect()
                        const mapRect = map.getDiv().getBoundingClientRect()
                        
                        const relativeX = (popupRect.left + popupRect.width / 2 - mapRect.left) / mapRect.width
                        const relativeY = (popupRect.top + popupRect.height / 2 - mapRect.top) / mapRect.height
                        
                        const bounds = map.getBounds()
                        if (bounds) {
                          const ne = bounds.getNorthEast()
                          const sw = bounds.getSouthWest()
                          lat = sw.lat() + (ne.lat() - sw.lat()) * (1 - relativeY)
                          lng = sw.lng() + (ne.lng() - sw.lng()) * relativeX
                        }
                      }
                      
                      // Fallback to map center if we can't get marker position
                      if (lat === 0 && lng === 0) {
                        const center = map.getCenter()
                        lat = center?.lat() || 0
                        lng = center?.lng() || 0
                      }
                      
                      console.log("📍 Coordinates from observer:", { lat, lng })
                      
                      // Set the location and open the form
                      setClickedLocation({ lat, lng })
                      setShowInlineForm(true)
                      setLocationType("destination")
                      
                      // Pre-populate the destination form
                      setNewDestination({
                        name: name || "Google Maps Location",
                        address: address || "Address not available",
                        category: "Other",
                        latitude: lat,
                        longitude: lng
                      })
                      
                      console.log("✅ Form opened automatically from observer!")
                    }
                  }, 100)
                }
              }
            }
          })
        }
      })
    })
    
    // Start observing
    observer.observe(document.body, {
      childList: true,
      subtree: true
    })

    return () => {
      if (map) {
        window.google.maps.event.clearListeners(map, "click")
      }
      document.removeEventListener('click', handleGoogleMapsPopupClick)
      document.removeEventListener('click', handleGoogleMapsInteraction)
      document.removeEventListener('click', handlePopupContentClick)
      document.removeEventListener('click', handleMarkerClick)
      observer.disconnect()
    }
  }, [map, showInlineForm, mapPin])

  // Cleanup effect to prevent memory leaks
  useEffect(() => {
    return () => {
      // Clean up any existing Google Maps script if component unmounts
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]')
      if (existingScript && existingScript.parentNode) {
        existingScript.parentNode.removeChild(existingScript)
      }
    }
  }, [])

  const fetchData = async () => {
    console.log("Starting fetchData...")
    try {
      // Clear existing markers before fetching new data
      clearAllMarkers()
      
      const [propertiesRes, destinationsRes] = await Promise.all([
        fetch("/api/properties"),
        fetch("/api/destinations")
      ])

      console.log("API responses:", { propertiesRes: propertiesRes.status, destinationsRes: destinationsRes.status })

      if (propertiesRes.ok) {
        const propertiesData = await propertiesRes.json()
        console.log("Properties response:", propertiesData)
        // Handle both array and object response formats
        const properties = Array.isArray(propertiesData) ? propertiesData as Property[] : (propertiesData as { properties?: Property[] }).properties || []
        console.log("Properties loaded:", properties.length)
        setProperties(properties)
      }

      if (destinationsRes.ok) {
        const destinationsData = await destinationsRes.json()
        console.log("Destinations response:", destinationsData)
        // Handle both array and object response formats
        const destinations = Array.isArray(destinationsData) ? destinationsData as Destination[] : (destinationsData as { destinations?: Destination[] }).destinations || []
        console.log("Destinations loaded:", destinations.length)
        setDestinations(destinations)
      }
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      console.log("Setting loading to false")
      setLoading(false)
    }
  }

  const initializeMap = async () => {
    console.log("initializeMap called")
    console.log("Map ref current:", !!mapRef.current)
    console.log("Map ref element:", mapRef.current)
    
    // Check if map ref is available, if not, retry
    if (!mapRef.current) {
      console.log("Map ref not available, retrying in 200ms")
      setTimeout(() => {
        if (mapRef.current) {
          console.log("Map ref now available, retrying initialization")
          initializeMap()
        } else {
          console.log("Map ref still not available after retry")
          setMapLoading(false)
        }
      }, 200)
      return
    }

    // Check if Google Maps is already loaded
    if (typeof window !== 'undefined' && window.google && window.google.maps) {
      console.log("Google Maps already loaded, creating map...")
      createMapInstance()
      return
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]')
    if (existingScript) {
      console.log("Google Maps script already exists, waiting for it to load...")
      existingScript.addEventListener('load', () => {
        console.log("Existing Google Maps script loaded")
        setScriptLoaded(true)
        createMapInstance()
      })
      return
    }

    try {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""
      console.log("Google Maps API Key:", apiKey ? "Present" : "Missing")
      
      if (!apiKey) {
        console.error("Google Maps API key is missing!")
        setMapLoading(false)
        return
      }

      console.log("Loading Google Maps script...")
      setScriptLoaded(true)
      
      // Create script tag for Google Maps
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async`
    script.async = true
    script.defer = true
      
      script.onload = () => {
        console.log("Google Maps script loaded successfully")
        // Add a small delay to ensure the API is fully initialized
        setTimeout(() => {
          createMapInstance()
        }, 100)
      }
      
      script.onerror = () => {
        console.error("Failed to load Google Maps script")
        setMapLoading(false)
        setScriptLoaded(false)
      }
      
      document.head.appendChild(script)

    } catch (error) {
      console.error("Error loading Google Maps:", error)
      console.error("Error details:", error)
      setMapLoading(false)
      setScriptLoaded(false)
    }
  }

  const createMapInstance = (retryCount = 0) => {
    try {
      console.log("Creating map instance...")
      
      // Check if Google Maps API is fully loaded
      if (typeof window === 'undefined' || !window.google || !window.google.maps || !window.google.maps.Map) {
        if (retryCount < 50) { // Max 5 seconds of retries
          console.log(`Google Maps API not ready (attempt ${retryCount + 1}/50), retrying in 100ms...`)
          console.log("Google object:", typeof window.google)
          console.log("Google.maps:", typeof window.google?.maps)
          console.log("Google.maps.Map:", typeof window.google?.maps?.Map)
          setTimeout(() => createMapInstance(retryCount + 1), 100)
          return
        } else {
          console.error("Google Maps API failed to load after maximum retries")
          setMapLoading(false)
          return
        }
      }
      
      const mapInstance = new window.google.maps.Map(mapRef.current!, {
        center: { lat: defaultLocation.lat, lng: defaultLocation.lng },
        zoom: defaultLocation.zoom,
        mapTypeId: window.google.maps.MapTypeId.SATELLITE,
        mapTypeControl: true,
        mapTypeControlOptions: {
          position: window.google.maps.ControlPosition?.TOP_RIGHT || 0,
        },
        streetViewControl: true,
        fullscreenControl: true,
        zoomControl: true,
      })

      console.log("Map instance created, setting state...")
      setMap(mapInstance)

      // Add a small delay to ensure map is fully rendered
      setTimeout(() => {
        console.log("Setting map loading to false")
        setMapLoading(false)
      }, 1000)

    } catch (error) {
      console.error("Error creating map instance:", error)
      setMapLoading(false)
    }
  }

  const getPropertyIcon = (propertyType: string) => {
    // Map property types to custom icon files
    const iconMap: { [key: string]: string } = {
      'house': '/logos/icon-house.png',
      'condo': '/logos/icon-condo.png',
      'apartment': '/logos/icon-apartment.png',
      'estate': '/logos/icon-estate.png'
    }
    
    const iconUrl = iconMap[propertyType] || '/logos/icon-house.png'
    
    return {
      url: iconUrl,
      scaledSize: new window.google.maps.Size(32, 32),
      anchor: new window.google.maps.Point(16, 32)
    }
  }

  const getDestinationIcon = (category: string) => {
    // Map destination categories to custom icon files and normalized display names
    const categoryMap: { [key: string]: { icon: string, displayName: string } } = {
      'airport': { icon: '/logos/icon-airport.png', displayName: 'Airport' },
      'int_airport': { icon: '/logos/icon-int-airport.png', displayName: 'International Airport' },
      'international airport': { icon: '/logos/icon-int-airport.png', displayName: 'International Airport' },
      'bus_station': { icon: '/logos/icon-bus.png', displayName: 'Bus Station' },
      'bus station': { icon: '/logos/icon-bus.png', displayName: 'Bus Station' },
      'train_station': { icon: '/logos/icon-train.png', displayName: 'Train Station' },
      'train station': { icon: '/logos/icon-train.png', displayName: 'Train Station' },
      'beach': { icon: '/logos/icon-beach.png', displayName: 'Beach' },
      'hotel': { icon: '/logos/icon-hotel.png', displayName: 'Hotel' },
      'entertainment': { icon: '/logos/icon-entertainment.png', displayName: 'Entertainment' },
      'restaurant': { icon: '/logos/icon-restaurant.png', displayName: 'Restaurant' }
    }
    
    // Check for exact match first, then check for case-insensitive match
    let categoryInfo = categoryMap[category]
    if (!categoryInfo) {
      const lowerCategory = category.toLowerCase()
      if (lowerCategory.includes('international') && lowerCategory.includes('airport')) {
        categoryInfo = { icon: '/logos/icon-int-airport.png', displayName: 'International Airport' }
      } else if (lowerCategory.includes('airport')) {
        categoryInfo = { icon: '/logos/icon-airport.png', displayName: 'Airport' }
      } else if (lowerCategory.includes('bus') && lowerCategory.includes('station')) {
        categoryInfo = { icon: '/logos/icon-bus.png', displayName: 'Bus Station' }
      } else if (lowerCategory.includes('train') && lowerCategory.includes('station')) {
        categoryInfo = { icon: '/logos/icon-train.png', displayName: 'Train Station' }
      } else {
        categoryInfo = { icon: '/logos/icon-destination.png', displayName: 'Destination' }
      }
    }
    
    return {
      url: categoryInfo.icon,
      scaledSize: new window.google.maps.Size(32, 32),
      anchor: new window.google.maps.Point(16, 32),
      displayName: categoryInfo.displayName
    }
  }

  const clearAllMarkers = () => {
    // Clear property markers
    propertyMarkers.forEach(marker => {
      marker.setMap(null)
    })
    setPropertyMarkers([])
    
    // Clear destination markers
    destinationMarkers.forEach(marker => {
      marker.setMap(null)
    })
    setDestinationMarkers([])
  }

  const addPropertyMarker = (property: Property) => {
    if (!map) return

    const marker = new window.google.maps.Marker({
      position: { lat: property.latitude, lng: property.longitude },
      map: map,
      title: property.name || `${property.streetAddress}, ${property.city}`,
      icon: getPropertyIcon(property.propertyType)
    })

    const typeConfig = propertyTypes.find(type => type.value === property.propertyType) || propertyTypes[0]
    const infoWindow = new window.google.maps.InfoWindow({
      content: `
        <div class="p-2">
          <div class="flex items-center space-x-2 mb-2">
            <span class="text-lg">${typeConfig?.icon || "🏠"}</span>
            <h3 class="font-semibold">${property.name || "Property"}</h3>
          </div>
          <p class="text-sm text-gray-600">${property.streetAddress}, ${property.city}</p>
          <p class="text-xs text-gray-500 mt-1">${typeConfig?.label || "Property"}</p>
          ${property.tags.length > 0 ? `
            <div class="mt-2">
              ${property.tags.map(tag => `<span class="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-1">${tag}</span>`).join('')}
            </div>
          ` : ''}
        </div>
      `
    })

    marker.addListener("click", () => {
      infoWindow.open(map, marker)
      
      // Also open the form for editing this property
      setLocationType("property")
      setNewProperty({
        name: property.name || "",
        tags: property.tags,
        useMapLocation: false,
        propertyType: property.propertyType,
        recipientName: property.recipientName || "",
        streetAddress: property.streetAddress,
        postalCode: property.postalCode,
        city: property.city,
        province: property.province || "",
        country: property.country
      })
      setClickedLocation({ lat: property.latitude, lng: property.longitude })
      setShowInlineForm(true)
    })

    // Add to property markers array
    setPropertyMarkers(prev => [...prev, marker])
  }

  const addDestinationMarker = (destination: Destination, category: string) => {
    if (!map) return

    const iconInfo = getDestinationIcon(category)
    const marker = new window.google.maps.Marker({
      position: { lat: destination.latitude, lng: destination.longitude },
      map: map,
      title: destination.name,
      icon: iconInfo
    })

    const infoWindow = new window.google.maps.InfoWindow({
      content: `
        <div class="p-2">
          <h3 class="font-semibold">${destination.name}</h3>
          <p class="text-sm text-gray-600">${destination.address}</p>
          <p class="text-xs text-gray-500">Category: ${iconInfo.displayName}</p>
          <div class="mt-2 flex gap-2">
            <button 
              id="move-destination-${destination.id}" 
              class="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Move
            </button>
            <button 
              id="edit-destination-${destination.id}" 
              class="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
            >
              Edit
            </button>
          </div>
        </div>
      `
    })

    marker.addListener("click", () => {
      infoWindow.open(map, marker)
      
      // Also open the form for editing this destination
      setLocationType("destination")
      setNewDestination({
        name: destination.name,
        address: destination.address,
        category: destination.category,
        latitude: destination.latitude,
        longitude: destination.longitude
      })
      setClickedLocation({ lat: destination.latitude, lng: destination.longitude })
      setShowInlineForm(true)
    })

    // Add event listeners for move and edit buttons after InfoWindow opens
    infoWindow.addListener('domready', () => {
      const moveButton = document.getElementById(`move-destination-${destination.id}`)
      const editButton = document.getElementById(`edit-destination-${destination.id}`)
      
      if (moveButton) {
        moveButton.onclick = (e) => {
          e.preventDefault()
          e.stopPropagation()
          console.log("🎯 Move button clicked for destination:", destination.id)
          handleStartMoveDestination(destination)
          infoWindow.close()
        }
      }
      
      if (editButton) {
        editButton.onclick = (e) => {
          e.preventDefault()
          e.stopPropagation()
          console.log("🎯 Edit button clicked for destination:", destination.id)
          handleEditDestination(destination)
          infoWindow.close()
        }
      }
    })

    // Add to destination markers array
    setDestinationMarkers(prev => [...prev, marker])
  }

  // Add markers when map and data are loaded
  useEffect(() => {
    if (map && properties.length > 0) {
      // Clear existing property markers first
      clearAllMarkers()
      properties.forEach((property) => {
        addPropertyMarker(property)
      })
    }
  }, [map, properties])

  useEffect(() => {
    if (map && destinations.length > 0) {
      // Clear existing destination markers first
      clearAllMarkers()
      destinations.forEach((dest) => {
        addDestinationMarker(dest, dest.category)
      })
    }
  }, [map, destinations])

  const clearMapPin = () => {
    if (mapPin) {
      mapPin.setMap(null)
      setMapPin(null)
    }
    setClickedLocation(null)
  }

  const handleSearch = async () => {
    if (!searchQuery.trim() || !map) return

    try {
      const request = {
        query: searchQuery,
        fields: ['name', 'geometry', 'formatted_address', 'place_id', 'types'],
        locationBias: map.getCenter()
      }

      const service = new window.google.maps.places.PlacesService(map)
      service.textSearch(request, (results: PlaceResult[] | null, status: PlacesServiceStatus) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
          setSearchResults(results)
          setShowSearchResults(true)
        } else {
          console.error('Search failed:', status)
          setSearchResults([])
          setShowSearchResults(false)
        }
      })
    } catch (error) {
      console.error('Search error:', error)
    }
  }

  const handleSearchResultClick = (result: PlaceResult) => {
    if (!map) return

    const location = result.geometry?.location
    if (location) {
      map.setCenter(location)
      map.setZoom(15)
      
      // Set clicked location for property/destination adding
      setClickedLocation({
        lat: location.lat(),
        lng: location.lng()
      })
    }

    // Close search results
    setShowSearchResults(false)
    setSearchQuery("")
  }

  const _handleMapClick = (event: MapMouseEvent) => {
    if (!event.latLng) return

    const lat = event.latLng.lat()
    const lng = event.latLng.lng()
    
    setContextLocation({ lat, lng })
    setClickedLocation({ lat, lng })
    
    // Show context menu
    setShowLocationMenu(true)
    setMenuPosition({ x: event.domEvent?.clientX || 0, y: event.domEvent?.clientY || 0 })
  }

  const handleAddLocationFromMap = async () => {
    if (!contextLocation) return
    
    setClickedLocation(contextLocation)
    setShowLocationMenu(false)
    setShowInlineForm(true)
    
    // Perform reverse geocoding to get address from coordinates
    try {
      const response = await fetch("/api/geocoding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latlng: `${contextLocation.lat},${contextLocation.lng}`
        })
      })

      if (response.ok) {
        const data = await response.json() as { result?: { formatted_address?: string } }
        const address = data.result?.formatted_address || "Unknown Address"
        
        // Update both property and destination forms with the geocoded address
        setNewProperty(prev => ({
          ...prev,
          streetAddress: address,
          postalCode: "",
          city: "",
          useMapLocation: true
        }))
        
        setNewDestination({
          name: "",
          address: address,
          category: "",
          latitude: contextLocation.lat,
          longitude: contextLocation.lng
        })
      }
    } catch (error) {
      console.error("Reverse geocoding failed:", error)
      // Still show the form even if geocoding fails
    }
  }

  const closeContextMenu = () => {
    setShowLocationMenu(false)
    setContextLocation(null)
  }

  const handleAddLocationClick = () => {
    setShowInlineForm(!showInlineForm)
    if (!showInlineForm) {
      // Reset form when opening
      setNewProperty({ 
        name: "", 
        tags: [], 
        useMapLocation: true, 
        propertyType: "house",
        recipientName: "",
        streetAddress: "",
        postalCode: "",
        city: "",
        province: "",
        country: "ITALY"
      })
      setNewDestination({ name: "", address: "", category: "", latitude: 0, longitude: 0 })
      setNewTag("")
    }
  }

  const addTag = () => {
    if (newTag.trim()) {
      if (locationType === "property") {
        setNewProperty(prev => ({
          ...prev,
          tags: [...prev.tags, newTag.trim()]
        }))
      } else {
        // For destinations, we can add tags to a separate array if needed
        // For now, we'll just clear the input
      }
      setNewTag("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    if (locationType === "property") {
      setNewProperty(prev => ({
        ...prev,
        tags: prev.tags.filter(tag => tag !== tagToRemove)
      }))
    }
  }

  const handleAddDestinationFromGoogleMaps = async () => {
    if (!googleMapsPopup) return

    try {
      // Extract information from Google Maps popup
      const name = googleMapsPopup.name || "Unknown Location"
      const address = googleMapsPopup.formatted_address || ""
      const lat = googleMapsPopup.geometry?.location?.lat() || 0
      const lng = googleMapsPopup.geometry?.location?.lng() || 0

      // Create destination
      const response = await fetch("/api/destinations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name,
          address: address,
          latitude: lat,
          longitude: lng,
          category: "Other", // Default category
          placeId: googleMapsPopup.place_id,
          metadata: {
            googleMapsData: googleMapsPopup
          }
        })
      })

      if (response.ok) {
        // Refresh destinations
        await fetchData()
        setShowGoogleMapsMenu(false)
        setGoogleMapsPopup(null)
        alert(`"${name}" added to destinations successfully!`)
      } else {
        const errorData = await response.json() as { error?: string }
        alert(`Failed to add destination: ${errorData.error || "Unknown error"}`)
      }
    } catch (error) {
      console.error("Error adding destination from Google Maps:", error)
      alert("An error occurred while adding the destination.")
    }
  }

  const handleAddProperty = async () => {
    try {
      if (!clickedLocation) {
        alert("Please click on the map to select a location first.")
        return
      }

      // Use the coordinates from the map click
      const finalLat = clickedLocation.lat
      const finalLng = clickedLocation.lng
      
      // Perform reverse geocoding to get address from coordinates
      const geocodedAddress = {
        streetAddress: "Map Location",
        city: "",
        postalCode: "",
        province: "",
        country: "Unknown"
      }

      try {
        const response = await fetch("/api/geocoding", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            latlng: `${finalLat},${finalLng}`
          })
        })

        if (response.ok) {
          const data = await response.json() as { result?: { formatted_address?: string } }
          const address = data.result?.formatted_address || "Unknown Address"
          
          // Parse the address components
          const addressParts = address.split(', ')
          if (addressParts.length >= 2) {
            geocodedAddress.streetAddress = addressParts[0] || "Map Location"
            geocodedAddress.city = addressParts[1] || ""
            if (addressParts.length >= 3) {
              geocodedAddress.postalCode = addressParts[addressParts.length - 2] || ""
              geocodedAddress.country = addressParts[addressParts.length - 1] || "Unknown"
            }
          }
        }
      } catch (error) {
        console.error("Reverse geocoding failed:", error)
        // Continue with default values
      }
      
      // Create the property with the geocoded address
      const propertyResponse = await fetch("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newProperty.name || undefined,
          tags: newProperty.tags,
          latitude: finalLat,
          longitude: finalLng,
          propertyType: newProperty.propertyType,
          recipientName: newProperty.recipientName || undefined,
          streetAddress: newProperty.streetAddress || geocodedAddress.streetAddress,
          postalCode: newProperty.postalCode || geocodedAddress.postalCode,
          city: newProperty.city || geocodedAddress.city,
          province: newProperty.province || geocodedAddress.province,
          country: geocodedAddress.country,
        })
      })

      if (propertyResponse.ok) {
        await fetchData()
        setShowInlineForm(false)
        setNewProperty({ 
          name: "", 
          tags: [], 
          useMapLocation: true, 
          propertyType: "house",
          recipientName: "",
          streetAddress: "",
          postalCode: "",
          city: "",
          province: "",
          country: "ITALY"
        })
        setNewTag("")
        clearMapPin()
        setClickedLocation(null)
      } else {
        const errorData = await propertyResponse.json() as { error?: string }
        alert(`Failed to create property: ${errorData.error || "Unknown error"}`)
      }
    } catch (error) {
      console.error("Error adding property:", error)
      alert("An error occurred while adding the property.")
    }
  }

  const handleAddDestination = async () => {
    if (!clickedLocation) {
      alert("Please click on the map to select a location first.")
      return
    }

    if (!newDestination.category) {
      alert("Please select a category for the destination.")
      return
    }

    try {
      const response = await fetch("/api/geocoding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: `${clickedLocation.lat}, ${clickedLocation.lng}`
        })
      })

      const data = await response.json() as { result?: { formatted_address?: string } }
      if (response.ok) {
        const destinationResponse = await fetch("/api/destinations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: newDestination.name,
            address: data.result?.formatted_address || "Unknown Address",
            latitude: clickedLocation.lat,
            longitude: clickedLocation.lng,
            category: newDestination.category,
          })
        })

        if (destinationResponse.ok) {
          await fetchData()
          setShowInlineForm(false)
          setNewDestination({ name: "", address: "", category: "", latitude: 0, longitude: 0 })
          setClickedLocation(null)
        } else {
        const errorData = await destinationResponse.json() as { error?: string }
        alert(`Failed to create destination: ${errorData.error || "Unknown error"}`)
        }
      } else {
        alert("Failed to get address for the selected location.")
      }
    } catch (error) {
      console.error("Error adding destination:", error)
      alert("An error occurred while adding the destination.")
    }
  }

  const handleStartMoveDestination = (destination: Destination) => {
    setMovingDestination(destination.id)
    
    // Create a temporary marker for moving
    if (moveMarker) {
      moveMarker.setMap(null)
    }
    
    const tempMarker = new window.google.maps.Marker({
      position: { lat: destination.latitude, lng: destination.longitude },
      map: map || undefined,
      title: `Moving: ${destination.name}`,
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: '#FF0000',
        fillOpacity: 0.8,
        strokeColor: '#FFFFFF',
        strokeWeight: 2
      },
      draggable: true
    })
    
    setMoveMarker(tempMarker)
    
    // Add click listener to map for placing the marker
    const moveListener = map?.addListener('click', (event: MapMouseEvent) => {
      if (event.latLng) {
        tempMarker.setPosition(event.latLng)
      }
    })
    
    // Store the listener for cleanup
    if (moveListener) {
      ;(tempMarker as { moveListener?: unknown }).moveListener = moveListener
    }
  }

  const handleConfirmMoveDestination = async () => {
    if (!movingDestination || !moveMarker) return
    
    try {
      const position = moveMarker.getPosition()
      if (!position) return
      
      const lat = position.lat()
      const lng = position.lng()
      
      // Get the address for the new location
      const response = await fetch("/api/geocoding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latlng: `${lat},${lng}`
        })
      })
      
      const data = await response.json() as { result?: { formatted_address?: string } }
      const newAddress = data.result?.formatted_address || "Unknown Address"
      
      // Update the destination
      const updateResponse = await fetch(`/api/destinations/${movingDestination}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: lat,
          longitude: lng,
          address: newAddress
        })
      })
      
      if (updateResponse.ok) {
        await fetchData()
        alert("Destination moved successfully!")
      } else {
        const errorData = await updateResponse.json() as { error?: string }
        alert(`Failed to move destination: ${errorData.error || "Unknown error"}`)
      }
    } catch (error) {
      console.error("Error moving destination:", error)
      alert("An error occurred while moving the destination.")
    } finally {
      // Clean up
      if (moveMarker) {
        moveMarker.setMap(null)
        setMoveMarker(null)
      }
      setMovingDestination(null)
    }
  }

  const handleCancelMoveDestination = () => {
    if (moveMarker) {
      moveMarker.setMap(null)
      setMoveMarker(null)
    }
    setMovingDestination(null)
  }

  const handleEditDestination = (destination: Destination) => {
    setLocationType("destination")
    setNewDestination({
      name: destination.name,
      address: destination.address,
      category: destination.category,
      latitude: destination.latitude,
      longitude: destination.longitude
    })
    setClickedLocation({ lat: destination.latitude, lng: destination.longitude })
    setShowInlineForm(true)
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ponte-terracotta mx-auto"></div>
          <p className="mt-4 text-ponte-olive font-body">Loading Map...</p>
        </div>
      </div>
    )
  }

  if (status === "unauthenticated") {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar */}
        <div className="w-80 bg-white shadow-lg flex flex-col">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Map Controls</h2>
          </div>
          
          <div className="flex-1 p-4 space-y-4">
            {/* Add Location Controls */}
            <div>
              <Button
                onClick={handleAddLocationClick}
                className="w-full"
                size="sm"
              >
                {showInlineForm ? "Cancel" : "Add Location"}
              </Button>
              

              {/* Move Destination Controls */}
              {movingDestination && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                  <h3 className="text-sm font-medium text-yellow-800 mb-2">Moving Destination</h3>
                  <p className="text-xs text-yellow-700 mb-3">
                    Click anywhere on the map to move the destination to a new location.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleConfirmMoveDestination}
                      className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Confirm Move
                    </button>
                    <button
                      onClick={handleCancelMoveDestination}
                      className="px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
              
              {showInlineForm && (
                <div className="mt-4 space-y-4">
                  {/* Location Type Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Type
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="locationType"
                          checked={locationType === "property"}
                          onChange={() => setLocationType("property")}
                          className="mr-2"
                        />
                        <span className="text-sm">🏠 Property</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="locationType"
                          checked={locationType === "destination"}
                          onChange={() => setLocationType("destination")}
                          className="mr-2"
                        />
                        <span className="text-sm">📍 Destination</span>
                      </label>
                    </div>
                  </div>

                  {/* Property Form */}
                  {locationType === "property" && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Name (Optional)
                        </label>
                        <input
                          type="text"
                          value={newProperty.name}
                          onChange={(e) => setNewProperty({ ...newProperty, name: e.target.value })}
                          className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                          placeholder="e.g., My Beach House"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Type
                        </label>
                        <select
                          value={newProperty.propertyType}
                          onChange={(e) => setNewProperty({ ...newProperty, propertyType: e.target.value })}
                          className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                        >
                          {propertyTypes.map(type => (
                            <option key={type.value} value={type.value}>
                              {type.icon} {type.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {newProperty.tags.map((tag, index) => (
                            <span key={index} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {tag}
                              <button
                                type="button"
                                onClick={() => removeTag(tag)}
                                className="ml-1 text-blue-600 hover:text-blue-800"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                            className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                            placeholder="Add tag"
                          />
                          <button
                            type="button"
                            onClick={addTag}
                            className="px-2 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                          >
                            Add
                          </button>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={() => setShowInlineForm(false)}
                          intent="secondary"
                          size="sm"
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleAddProperty}
                          size="sm"
                          className="flex-1"
                        >
                          Add Property
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Destination Form */}
                  {locationType === "destination" && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Name
                        </label>
                        <input
                          type="text"
                          value={newDestination.name}
                          onChange={(e) => setNewDestination({ ...newDestination, name: e.target.value })}
                          className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                          placeholder="e.g., Central Park"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Category *
                        </label>
                        <select
                          value={newDestination.category}
                          onChange={(e) => setNewDestination({ ...newDestination, category: e.target.value })}
                          className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                          required
                        >
                          <option value="">Select category</option>
                          {destinationCategories.map(category => (
                            <option key={category.value} value={category.value}>
                              {category.icon} {category.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={() => setShowInlineForm(false)}
                          intent="secondary"
                          size="sm"
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleAddDestination}
                          size="sm"
                          className="flex-1"
                        >
                          Add Destination
                        </Button>
                      </div>
                    </div>
                  )}

                  {clickedLocation ? (
                    <div className="bg-green-50 p-2 rounded-md">
                      <p className="text-xs text-green-800">
                        <strong>Location Selected:</strong><br />
                        {clickedLocation.lat.toFixed(6)}, {clickedLocation.lng.toFixed(6)}
                      </p>
                      <p className="text-xs text-green-600 mt-1">
                        Click on the map to change location
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500">
                      Click on the map to select location
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Statistics */}
            <div className="pt-4 border-t">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Statistics</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p>Properties: {Array.isArray(properties) ? properties.length : 0}</p>
                <p>Destinations: {Array.isArray(destinations) ? destinations.length : 0}</p>
                <p>Categories: {Array.isArray(destinations) ? Array.from(new Set(destinations.map(d => d.category))).length : 0}</p>
              </div>
            </div>
          </div>
        </div>


      {/* Map Container */}
      <div className="flex-1 relative" onClick={closeContextMenu}>
        {/* Search Bar */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 w-1/2">
          <div className="bg-white rounded-lg shadow-lg p-1">
            <div className="flex">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search places..."
                className="flex-1 px-2 py-1 text-sm border border-ponte-sand rounded-l-md focus:outline-none focus:ring-2 focus:ring-ponte-terracotta focus:border-transparent"
              />
              <button
                onClick={handleSearch}
                className="px-2 py-1 bg-ponte-terracotta text-white rounded-r-md hover:bg-accent-600 focus:outline-none focus:ring-2 focus:ring-ponte-terracotta text-sm"
              >
                🔍
              </button>
            </div>
            
            {/* Search Results */}
            {showSearchResults && searchResults.length > 0 && (
              <div className="mt-1 max-h-48 overflow-y-auto">
                {searchResults.map((result, index) => (
                  <div
                    key={result.place_id || index}
                    onClick={() => handleSearchResultClick(result)}
                    className="p-1 hover:bg-gray-100 cursor-pointer border-b border-gray-200 last:border-b-0"
                  >
                    <div className="font-medium text-xs">{result.name}</div>
                    <div className="text-xs text-gray-600 truncate">{result.formatted_address}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div ref={mapRef} className="w-full h-full" />
        
        
        
        {/* Context Menu */}
        {showLocationMenu && (
          <div
            className="absolute bg-white rounded-lg shadow-lg border border-gray-200 z-20"
            style={{
              left: menuPosition.x,
              top: menuPosition.y,
              transform: 'translate(-50%, -100%)'
            }}
          >
            <div className="p-2">
              <div className="flex justify-between items-center mb-2">
                <div className="text-sm font-medium text-gray-700">
                  Add to Map
                </div>
                <button
                  onClick={closeContextMenu}
                  className="text-gray-400 hover:text-gray-600 text-lg"
                >
                  ×
                </button>
              </div>
              <div className="space-y-1">
                <button
                  onClick={handleAddLocationFromMap}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded-md flex items-center"
                >
                  <span className="mr-2">📍</span>
                  Add Location
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Google Maps Popup Menu */}
        {showGoogleMapsMenu && googleMapsPopup && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-lg border border-gray-200 z-30 w-80">
            <div className="p-4">
              <div className="flex justify-between items-center mb-3">
                <div className="text-sm font-medium text-gray-700">
                  Add to Destinations
                </div>
                <button
                  onClick={() => {
                    setShowGoogleMapsMenu(false)
                    setGoogleMapsPopup(null)
                  }}
                  className="text-gray-400 hover:text-gray-600 text-lg"
                >
                  ×
                </button>
              </div>
              
              <div className="mb-3">
                <div className="text-sm font-medium text-gray-900 mb-1">
                  {googleMapsPopup.name}
                </div>
                <div className="text-xs text-gray-600">
                  {googleMapsPopup.formatted_address}
                </div>
              </div>

              <button
                onClick={handleAddDestinationFromGoogleMaps}
                className="w-full bg-blue-500 text-white px-3 py-2 rounded-md hover:bg-blue-600 text-sm flex items-center justify-center"
              >
                <span className="mr-2">📍</span>
                Add to Destinations
              </button>
            </div>
          </div>
        )}
          
          {mapLoading && (
            <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ponte-terracotta mx-auto"></div>
                <p className="mt-2 text-sm text-ponte-olive font-body">Loading map...</p>
                <p className="mt-1 text-xs text-ponte-olive">Check browser console for debug info</p>
              </div>
            </div>
          )}
          
          {/* Map Click Indicator */}
          {showInlineForm && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-4 left-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">
                    {clickedLocation ? "Location selected - click to change" : "Click on the map to select location"}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Location Modal - DISABLED - Using inline form instead */}
      {false && showAddLocation && (
        <div className="fixed inset-0 bg-transparent flex items-start justify-end z-50 pointer-events-none">
          <div className="bg-white rounded-lg p-6 w-96 max-h-[90vh] overflow-y-auto m-4 shadow-xl pointer-events-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Add Location</h3>
              <button
                onClick={() => {
                  setShowAddLocation(false)
                  clearMapPin()
                  setNewProperty({ 
                    name: "", 
                    tags: [], 
                    useMapLocation: true, 
                    propertyType: "house",
                    recipientName: "",
                    streetAddress: "",
                    postalCode: "",
                    city: "",
                    province: "",
                    country: "ITALY"
                  })
                  setNewDestination({ name: "", address: "", category: "", latitude: 0, longitude: 0 })
                }}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ×
              </button>
            </div>
            <div className="space-y-4">
              {/* Location Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What type of location is this?
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="locationType"
                      checked={locationType === "property"}
                      onChange={() => setLocationType("property")}
                      className="mr-2"
                    />
                    <span className="text-sm">🏠 Property</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="locationType"
                      checked={locationType === "destination"}
                      onChange={() => setLocationType("destination")}
                      className="mr-2"
                    />
                    <span className="text-sm">📍 Destination</span>
                  </label>
                </div>
              </div>


              {/* Location Info */}
              <div className="bg-blue-50 p-3 rounded-md">
                <p className="text-sm text-blue-800">
                  <strong>Selected Location:</strong><br />
                  Coordinates: {clickedLocation?.lat.toFixed(6)}, {clickedLocation?.lng.toFixed(6)}
                </p>
                {newProperty.streetAddress && (
                  <p className="text-sm text-blue-600 mt-1">
                    Address: {newProperty.streetAddress}
                  </p>
                )}
              </div>

              {/* Property Form */}
              {locationType === "property" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Property Name (Optional)
                    </label>
                    <input
                      type="text"
                      value={newProperty.name}
                      onChange={(e) => setNewProperty({ ...newProperty, name: e.target.value })}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="e.g., My Beach House"
                    />
                  </div>

              {/* Property Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Property Type
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {propertyTypes.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setNewProperty({ ...newProperty, propertyType: type.value })}
                      className={`p-2 rounded-md border-2 text-center transition-colors ${
                        newProperty.propertyType === type.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-2xl mb-1">{type.icon}</div>
                      <div className="text-xs text-gray-600">{type.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Address Fields */}
              {!newProperty.useMapLocation && (
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Address Details</h4>
                
                {/* Name/Company */}
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name/Company
                  </label>
                  <input
                    type="text"
                    value={newProperty.recipientName}
                    onChange={(e) => setNewProperty({ ...newProperty, recipientName: e.target.value })}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="e.g., John Smith or ABC Company"
                  />
                </div>

                {/* Street Address */}
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Street Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newProperty.streetAddress}
                    onChange={(e) => setNewProperty({ ...newProperty, streetAddress: e.target.value })}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="e.g., 123 Main Street or PO Box 456"
                    required
                  />
                </div>

                {/* Postal Code and City */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Postal Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newProperty.postalCode}
                      onChange={(e) => setNewProperty({ ...newProperty, postalCode: e.target.value })}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="e.g., 12345"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newProperty.city}
                      onChange={(e) => setNewProperty({ ...newProperty, city: e.target.value })}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="e.g., New York"
                      required
                    />
                  </div>
                </div>

                {/* Province and Country */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Province
                    </label>
                    <input
                      type="text"
                      value={newProperty.province}
                      onChange={(e) => setNewProperty({ ...newProperty, province: e.target.value })}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="e.g., NY"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Country
                    </label>
                    <input
                      type="text"
                      value={newProperty.country}
                      onChange={(e) => setNewProperty({ ...newProperty, country: e.target.value })}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="ITALY"
                    />
                  </div>
                </div>
                </div>
              )}

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tags (Optional)
                </label>
                <input
                  type="text"
                  value={newProperty.tags.join(", ")}
                  onChange={(e) => setNewProperty({ 
                    ...newProperty, 
                    tags: e.target.value.split(",").map(tag => tag.trim()).filter(tag => tag)
                  })}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="e.g., beach, waterfront, downtown"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Separate multiple tags with commas
                </p>
              </div>

                  <div className="flex justify-end space-x-3">
                    <Button
                      onClick={() => {
                        setShowAddLocation(false)
                        clearMapPin()
                      }}
                      intent="secondary"
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleAddProperty}>
                      Add Property
                    </Button>
                  </div>
                </div>
              )}

              {/* Destination Form */}
              {locationType === "destination" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Destination Name
                    </label>
                    <input
                      type="text"
                      value={newDestination.name}
                      onChange={(e) => setNewDestination({ ...newDestination, name: e.target.value })}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="e.g., Central Park"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category *
                    </label>
                    <select
                      value={newDestination.category}
                      onChange={(e) => setNewDestination({ ...newDestination, category: e.target.value })}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select a category</option>
                      {destinationCategories.map(category => (
                        <option key={category.value} value={category.value}>{category.icon} {category.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex justify-end space-x-3">
                    <Button
                      onClick={() => {
                        setShowAddLocation(false)
                        clearMapPin()
                      }}
                      intent="secondary"
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleAddDestination}>
                      Add Destination
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
