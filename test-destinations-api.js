// Test script to check destinations API
// Run this in your browser console on the property page

async function testDestinationsAPI() {
  try {
    console.log('Testing destinations API...')
    
    const response = await fetch('/api/destinations')
    console.log('Response status:', response.status)
    console.log('Response headers:', Object.fromEntries(response.headers.entries()))
    
    if (response.ok) {
      const data = await response.json()
      console.log('Response data:', data)
      console.log('Destinations count:', data.destinations?.length || 0)
    } else {
      const errorText = await response.text()
      console.error('Error response:', errorText)
    }
  } catch (error) {
    console.error('Fetch error:', error)
  }
}

// Run the test
testDestinationsAPI()
