import { useEffect } from 'react'
import './App.css'
import { getCollectionData } from './services/googleSheets'

function App() {
  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getCollectionData()

        console.log("Google Sheet Data:")
        console.log(data)
      } catch (error) {
        console.log("Failed to fetch Google Sheet: ", error)
      }
    }

    fetchData()
  }, [])

  return (
    <>
      <div>
        <h1>Teachers' Day Collection Tracker</h1>
        <p>Checking Google Sheet connection...</p>
      </div>
    </>
  )
}

export default App
