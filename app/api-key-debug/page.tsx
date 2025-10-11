"use client"

import Navigation from "components/Navigation"

export default function ApiKeyDebugPage() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">API Key Debug</h1>
        
        <div className="space-y-4">
          <div className="p-4 bg-gray-100 rounded">
            <h3 className="font-bold mb-2">API Key Information:</h3>
            <p><strong>Present:</strong> {apiKey ? "Yes" : "No"}</p>
            <p><strong>Length:</strong> {apiKey.length} characters</p>
            <p><strong>First 10 chars:</strong> {apiKey.substring(0, 10)}...</p>
            <p><strong>Last 10 chars:</strong> ...{apiKey.substring(apiKey.length - 10)}</p>
            <p><strong>Contains spaces:</strong> {apiKey.includes(' ') ? "Yes" : "No"}</p>
            <p><strong>Contains newlines:</strong> {apiKey.includes('\n') ? "Yes" : "No"}</p>
          </div>

          <div className="p-4 bg-blue-100 rounded">
            <h3 className="font-bold mb-2">Google Cloud Console Checklist:</h3>
            <ul className="text-sm space-y-1">
              <li>✅ Billing account linked to project</li>
              <li>✅ Maps JavaScript API enabled</li>
              <li>✅ Geocoding API enabled</li>
              <li>✅ Distance Matrix API enabled</li>
              <li>✅ API key restrictions configured</li>
              <li>✅ HTTP referrers set to localhost:3012/*</li>
            </ul>
          </div>

          <div className="p-4 bg-yellow-100 rounded">
            <h3 className="font-bold mb-2">Common Issues:</h3>
            <ul className="text-sm space-y-1">
              <li>• "This page can't load Google Maps correctly" = API key restrictions</li>
              <li>• "Development purposes only" watermark = No billing account</li>
              <li>• "ApiProjectMapError" = API not enabled or key restrictions</li>
              <li>• "NoApiKeys" = API key not passed correctly to map</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
