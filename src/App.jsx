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

  function parseAmount(amount) {
    return Number(amount.replace(/[₹,]/g, ''))
  }

  const totalDue = students.reduce(
    (total, student) => total + parseAmount(student["Amount Due"]),
    0
  )

  const totalPaid = students.reduce(
    (total, student) => total + parseAmount(student["Amount Paid"]),
    0
  )

  const pendingAmount = totalDue - totalPaid

  return (
    <>
      <div>
        <h1>Teachers' Day Collection Tracker</h1>

        <div>
          <p>Total Students: {students.length}</p>

          <p>Total Due: ₹{totalDue}</p>

          <p>Total Paid: ₹{totalPaid}</p>

          <p>Pending: ₹{pendingAmount}</p>
        </div>

        <CollectionTable students={students} />
      </div>
    </>
  )
}

export default App
