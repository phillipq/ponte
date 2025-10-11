"use client"

import { useEffect, useState } from "react"
import { setOptions, importLibrary } from "@googlemaps/js-api-loader"
import Navigation from "components/Navigation"

export default function MapsJsTest() {
  const [status, setStatus] = useState<string>("Testing...")
  const [error, setError] = useState<string>("")
  const [mapLoaded, setMapLoaded] = useState(false)

  useEffect(() => {
    const testMapsJsApi = async () => {
      try {
        setStatus("Setting up Google Maps...")
        
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
        if (!apiKey) {
          setError("API key not found")
          setStatus("❌ Failed")
          return
        }

        setStatus("Configuring API options...")
        setOptions({
          apiKey: apiKey,
          version: "weekly",
          libraries: ["places"]
        })

        setStatus("Loading Maps JavaScript API...")
        const { Map } = await importLibrary("maps")
        
        setStatus("✅ Maps JavaScript API loaded successfully!")
        setMapLoaded(true)
        
      } catch (error: any) {
        console.error("Maps JS API Error:", error)
        setError(error.message || "Unknown error")
        setStatus("❌ Failed to load Maps JavaScript API")
      }
    }

    testMapsJsApi()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Maps JavaScript API Test</h1>
        
        <div className="mb-4 p-4 bg-gray-100 rounded">
          <p><strong>Status:</strong> {status}</p>
          {error && <p className="text-red-600"><strong>Error:</strong> {error}</p>}
        </div>

        {mapLoaded && (
          <div className="p-4 bg-green-100 rounded">
            <h3 className="font-bold text-green-800 mb-2">✅ Success!</h3>
            <p className="text-green-700">Maps JavaScript API is working correctly.</p>
            <p className="text-sm text-green-600 mt-2">
              You should now be able to use the main map page without errors.
            </p>
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-100 rounded">
            <h3 className="font-bold text-red-800 mb-2">❌ Common Solutions:</h3>
            <ul className="text-sm text-red-700 space-y-1">
              <li>• Enable "Maps JavaScript API" in Google Cloud Console</li>
              <li>• Add "Maps JavaScript API" to your API key restrictions</li>
              <li>• Check that billing is enabled on your project</li>
              <li>• Wait 5-10 minutes after enabling the API</li>
              <li>• Try creating a new API key if issues persist</li>
            </ul>
          </div>
        )}

        <div className="mt-6">
          <a 
            href="/map" 
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Test Main Map Page
          </a>
        </div>
      </div>
    </div>
  )
}
