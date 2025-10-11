"use client"

export default function EnvTest() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Environment Variables Test</h1>
        
        <div className="space-y-2">
          <p><strong>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY:</strong> {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? "Present" : "Missing"}</p>
          <p><strong>GOOGLE_MAPS_API_KEY:</strong> {process.env.GOOGLE_MAPS_API_KEY ? "Present" : "Missing"}</p>
          <p><strong>NODE_ENV:</strong> {process.env.NODE_ENV}</p>
        </div>

        {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY && (
          <div className="mt-4 p-4 bg-green-100 rounded">
            <p className="text-green-800">✅ Google Maps API Key is loaded!</p>
            <p className="text-sm text-green-600">Key length: {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.length} characters</p>
          </div>
        )}

        {!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY && (
          <div className="mt-4 p-4 bg-red-100 rounded">
            <p className="text-red-800">❌ Google Maps API Key is missing!</p>
            <p className="text-sm text-red-600">Make sure NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is set in your .env.local file</p>
          </div>
        )}
      </div>
    </div>
  )
}
