import { useEffect, useState } from 'react'
import './App.css'
import { getCollectionData } from './services/googleSheets.js'
import CollectionTable from './components/CollectionTable.jsx'

function App() {
  const [students, setStudents] = useState([])

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getCollectionData()

        const studentData = data.filter(
          (student) => student['Roll Number'] !== 'Total'
        )

        setStudents(studentData)
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

        <p>Total Students: {students.length}</p>

        <CollectionTable students={students} />
      </div>
    </>
  )
}

export default App
