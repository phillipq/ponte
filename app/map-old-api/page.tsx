"use client"

import { useEffect, useRef, useState } from "react"
import Navigation from "components/Navigation"

export default function MapOldApiPage() {
  const mapRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [map, setMap] = useState<google.maps.Map | null>(null)

  useEffect(() => {
    const initializeMap = async () => {
      if (!mapRef.current) {
        console.log("Map ref not available")
        setLoading(false)
        return
      }

      try {
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""
        console.log("API Key present:", !!apiKey)
        
        if (!apiKey) {
          setError("Google Maps API key is missing!")
          setLoading(false)
          return
        }

        // Use the old Google Maps API loading method
        console.log("Loading Google Maps with old API...")
        
        // Create script tag
        const script = document.createElement('script')
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`
        script.async = true
        script.defer = true
        
        script.onload = () => {
          console.log("Google Maps script loaded")
          try {
            const mapInstance = new google.maps.Map(mapRef.current!, {
              center: { lat: 43.6532, lng: -79.3832 },
              zoom: 10,
            })
            console.log("Map created with old API")
            setMap(mapInstance)
            setLoading(false)
          } catch (error) {
            console.error("Error creating map:", error)
            setError(`Map creation error: ${error}`)
            setLoading(false)
          }
        }
        
        script.onerror = () => {
          console.error("Failed to load Google Maps script")
          setError("Failed to load Google Maps script")
          setLoading(false)
        }
        
        document.head.appendChild(script)
        
      } catch (error) {
        console.error("Error:", error)
        setError(`Error: ${error}`)
        setLoading(false)
      }
    }

    initializeMap()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Old Google Maps API Test</h1>
        
        <div className="mb-4 space-y-2">
          <p><strong>Loading:</strong> {loading ? "Yes" : "No"}</p>
          <p><strong>Map Instance:</strong> {map ? "Created" : "Not created"}</p>
          <p><strong>API Key:</strong> {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? "Present" : "Missing"}</p>
          {error && <p className="text-red-600"><strong>Error:</strong> {error}</p>}
        </div>

        <div className="relative">
          <div 
            ref={mapRef} 
            className="w-full h-96 border border-gray-300 rounded-lg"
            style={{ minHeight: "400px" }}
          />
          
          {loading && (
            <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-600">Loading map...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
