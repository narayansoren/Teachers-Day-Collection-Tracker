import { useEffect, useState } from 'react'
import { getCollectionData } from './services/googleSheets.js'
import CollectionTable from './components/CollectionTable.jsx'
import SummaryCards from './components/SummaryCards.jsx'

function App() {
  const [students, setStudents] = useState([])
  const [search, setSearch] = useState("")

  const [branchFilter, setBranchFilter] = useState("")
  const [semesterFilter, setSemesterFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")

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

  const branches = [
    ...new Set(students.map((student) => student["Branch"]))
  ]

  const semesters = [
    ...new Set(students.map((student) => student["Semester"]))
  ]

  const statuses = [
    ...new Set(students.map((student) => student["Status"]))
  ]

  const filteredStudents = students.filter((student) => {
    const searchTerm = search.toLowerCase()

    const rollNumber = student["Roll Number"].toLowerCase()
    const studentName = student["Student Name"].toLowerCase()

    const matchesSearch =
      rollNumber.includes(searchTerm) ||
      studentName.includes(searchTerm)

    const matchesBranch =
      branchFilter === "" ||
      student["Branch"] === branchFilter

    const matchesSemester =
      semesterFilter === "" ||
      student["Semester"] === semesterFilter

    const matchesStatus =
      statusFilter === "" ||
      student["Status"] === statusFilter

    return (
      matchesSearch &&
      matchesBranch &&
      matchesSemester &&
      matchesStatus
    )
  })

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

        <div className="search-container">
          <input type="search"
            placeholder='Search by name or roll number...'
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div className="filters">
          <select
            value={branchFilter}
            onChange={(event) => setBranchFilter(event.target.value)}
          >
            <option value="">All Branches</option>

            {branches.map((branch) => (
              <option key={branch} value={branch}>
                {branch}
              </option>
            ))}
          </select>

          <select
            value={semesterFilter}
            onChange={(event) => setSemesterFilter(event.target.value)}
          >
            <option value="">All Semesters</option>
            {semesters.map((semester) => (
              <option key={semester} value={semester}>
                {semester}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="">All Statuses</option>

            {statuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        <CollectionTable students={filteredStudents} />
      </div>
    </>
  )
}

export default App
