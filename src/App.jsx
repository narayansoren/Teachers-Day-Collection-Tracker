import { useEffect, useState } from 'react'
import { getCollectionData } from './services/googleSheets.js'
import CollectionTable from './components/CollectionTable.jsx'
import SummaryCards from './components/SummaryCards.jsx'

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

        <SummaryCards
          totalStudents={students.length}
          totalDue={totalDue}
          totalPaid={totalPaid}
          pendingAmount={pendingAmount}
        />

        <CollectionTable students={students} />
      </div>
    </>
  )
}

export default App
