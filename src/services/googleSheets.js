import Papa from 'papaparse'

const DEFAULT_SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRvQPjcVsP0jG8pQN-pYuQvIkBFdPnkq7VBx_yOhjE2HRItwfIKqHaOEHbu4J-IcH7cEYA3OLv_PmD3/pub?gid=0&single=true&output=csv'
const SHEET_URL = import.meta.env.VITE_GOOGLE_SHEET_URL || DEFAULT_SHEET_URL

const CACHE_KEY = 'teachers-day-collection-data-v2'
const CACHE_DURATION = 3 * 60 * 1000 // 3 minutes cache

/**
 * Normalizes a single student record from CSV row
 */
export function normalizeStudentRow(row, index = 0) {
  if (!row || typeof row !== 'object') return null

  const getField = (...possibleKeys) => {
    for (const key of possibleKeys) {
      if (row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== '') {
        return String(row[key]).trim()
      }
    }
    // Search case-insensitively without spaces/symbols
    const rowKeys = Object.keys(row)
    for (const key of possibleKeys) {
      const normalizedSearch = key.toLowerCase().replace(/[\s_-]+/g, '')
      const foundKey = rowKeys.find(k => k.toLowerCase().replace(/[\s_-]+/g, '') === normalizedSearch)
      if (foundKey && row[foundKey] !== undefined && row[foundKey] !== null && String(row[foundKey]).trim() !== '') {
        return String(row[foundKey]).trim()
      }
    }
    return ''
  }

  const rollNumber = getField('roll_number', 'rollNumber', 'Roll Number', 'roll', 'id') || `${100 + index + 1}`
  const studentName = getField('student_name', 'studentName', 'Student Name', 'name') || 'Anonymous Student'
  const branch = getField('branch', 'Branch', 'department', 'Department', 'Dept') || 'CSE'
  const yearSemester = getField('year_semester', 'yearSemester', 'Year / Semester', 'year', 'Year', 'semester', 'Semester') || '1st Year'
  const rawAmount = getField('amount_paid', 'amountPaid', 'Amount Paid', 'amount', 'Amount', 'paid')
  const amountPaid = parseFloat(rawAmount.replace(/[^0-9.]/g, '')) || 0
  const paymentMode = getField('payment_mode', 'paymentMode', 'Payment Mode', 'mode', 'Payment') || 'UPI'
  const paymentDate = getField('payment_date', 'paymentDate', 'Payment Date', 'date', 'Date') || new Date().toISOString().slice(0, 10)
  const collectedBy = getField('collected_by', 'collectedBy', 'Collected By', 'collector') || 'Coordinator'
  const studentWish = getField('student_wish', 'studentWish', 'Student Wish', 'wish', 'Remarks', 'remarks', 'message', 'quote')

  // Only return valid student entry if it has a name or roll number or positive amount
  if (!studentName && !rollNumber && amountPaid === 0) {
    return null
  }

  return {
    id: rollNumber || `student-${index}`,
    rollNumber,
    studentName,
    branch,
    yearSemester,
    amountPaid,
    paymentMode,
    paymentDate,
    collectedBy,
    studentWish
  }
}

/**
 * Fetches and parses collection data from published Google Sheet CSV
 */
export function getCollectionData(forceRefresh = false) {
  return new Promise((resolve, reject) => {
    if (!forceRefresh) {
      try {
        const cachedData = localStorage.getItem(CACHE_KEY)
        if (cachedData) {
          const { data, timestamp } = JSON.parse(cachedData)
          const isCacheValid = Date.now() - timestamp < CACHE_DURATION
          if (isCacheValid && Array.isArray(data) && data.length > 0) {
            resolve(data)
            return
          }
        }
      } catch (err) {
        console.warn('Error reading from localStorage cache:', err)
      }
    }

    const targetUrl = SHEET_URL
    const requestUrl = forceRefresh
      ? (targetUrl.includes('?') ? `${targetUrl}&_t=${Date.now()}` : `${targetUrl}?_t=${Date.now()}`)
      : targetUrl

    Papa.parse(requestUrl, {
      download: true,
      header: true,
      skipEmptyLines: 'greedy',
      complete: (results) => {
        if (!results.data || !Array.isArray(results.data)) {
          resolve([])
          return
        }

        const normalizedData = results.data
          .map((row, idx) => normalizeStudentRow(row, idx))
          .filter(Boolean)

        try {
          localStorage.setItem(
            CACHE_KEY,
            JSON.stringify({
              data: normalizedData,
              timestamp: Date.now()
            })
          )
        } catch (err) {
          console.warn('Error saving to localStorage cache:', err)
        }

        resolve(normalizedData)
      },
      error: (error) => {
        console.error('PapaParse error:', error)
        reject(error)
      }
    })
  })
}