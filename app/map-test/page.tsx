"use client"

import { useEffect, useRef, useState } from "react"
import { Loader } from "@googlemaps/js-api-loader"

export default function MapTest() {
  const mapRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const initializeMap = async () => {
      if (!mapRef.current) return

      try {
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""
        console.log("API Key present:", !!apiKey)
        console.log("API Key length:", apiKey.length)
        
        if (!apiKey) {
          setError("Google Maps API key is missing!")
          setLoading(false)
          return
        }

        const loader = new Loader({
          apiKey: apiKey,
          version: "weekly",
          libraries: ["places"]
        })

        console.log("Loading Google Maps...")
        const google = await loader.load()
        console.log("Google Maps loaded successfully")
        
        const map = new google.maps.Map(mapRef.current, {
          center: { lat: 43.6532, lng: -79.3832 },
          zoom: 10,
        })

        console.log("Map created successfully")
        setLoading(false)
      } catch (error) {
        console.error("Error:", error)
        setError(`Error: ${error}`)
        setLoading(false)
      }
    }

    initializeMap()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Google Maps Test</h1>
        
        <div className="mb-4">
          <p><strong>API Key Status:</strong> {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? "Present" : "Missing"}</p>
          <p><strong>Loading:</strong> {loading ? "Yes" : "No"}</p>
          {error && <p className="text-red-600"><strong>Error:</strong> {error}</p>}
        </div>

        <div 
          ref={mapRef} 
          className="w-full h-96 border border-gray-300 rounded-lg"
          style={{ minHeight: "400px" }}
        />
      </div>
    </div>
  )
}
