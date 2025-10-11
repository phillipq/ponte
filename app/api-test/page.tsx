"use client"

import { useState } from "react"
import Navigation from "components/Navigation"

export default function ApiTest() {
  const [result, setResult] = useState<string>("")
  const [loading, setLoading] = useState(false)

  const testApiKey = async () => {
    setLoading(true)
    setResult("Testing API key...")
    
    try {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
      
      if (!apiKey) {
        setResult("❌ API key is missing from environment variables")
        setLoading(false)
        return
      }

      // Test the API key with a simple geocoding request
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=Toronto&key=${apiKey}`
      )
      
      const data = await response.json()
      
      if (data.status === "OK") {
        setResult("✅ API key is working! Status: " + data.status)
      } else if (data.status === "REQUEST_DENIED") {
        setResult("❌ API key is invalid or restricted. Status: " + data.status)
      } else if (data.status === "OVER_QUERY_LIMIT") {
        setResult("⚠️ API key has exceeded quota. Status: " + data.status)
      } else {
        setResult("⚠️ API key issue. Status: " + data.status)
      }
      
    } catch (error) {
      setResult("❌ Error testing API key: " + error)
    }
    
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Google Maps API Key Test</h1>
        
        <div className="mb-4 space-y-2">
          <p><strong>API Key Present:</strong> {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? "Yes" : "No"}</p>
          <p><strong>API Key Length:</strong> {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.length || 0} characters</p>
        </div>

        <button
          onClick={testApiKey}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? "Testing..." : "Test API Key"}
        </button>

        {result && (
          <div className="mt-4 p-4 bg-gray-100 rounded">
            <p className="font-mono text-sm">{result}</p>
          </div>
        )}

        <div className="mt-8 p-4 bg-yellow-100 rounded">
          <h3 className="font-bold text-yellow-800 mb-2">Common Issues:</h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• Make sure billing is enabled on your Google Cloud project</li>
            <li>• Verify Maps JavaScript API is enabled</li>
            <li>• Check API key restrictions (HTTP referrers)</li>
            <li>• Ensure the API key has proper permissions</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
