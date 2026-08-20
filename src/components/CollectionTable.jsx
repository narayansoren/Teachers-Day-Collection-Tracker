import React, { useState, useMemo } from 'react'
import { Search, Filter, CheckCircle2 } from 'lucide-react'

function CollectionTable({ students = [] }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedBranch, setSelectedBranch] = useState('ALL')

  const branches = useMemo(() => {
    const defaultBranches = ['CSE', 'IT', 'ECE', 'ME']
    const list = students.map(s => s.branch || s['Branch'] || s['branch']).filter(Boolean)
    const unique = Array.from(new Set([...defaultBranches, ...list]))
    return ['ALL', ...unique]
  }, [students])

  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const name = (student.studentName || student['Student Name'] || student['student_name'] || '').toLowerCase()
      const roll = (student.rollNumber || student['Roll Number'] || student['roll_number'] || '').toString().toLowerCase()
      const branch = (student.branch || student['Branch'] || student['branch'] || '').toLowerCase()
      const collector = (student.collectedBy || student['Collected By'] || student['collected_by'] || '').toLowerCase()
      const wish = (student.studentWish || student['Student Wish'] || student['student_wish'] || student['Remarks'] || '').toLowerCase()

      const matchesSearch =
        name.includes(searchTerm.toLowerCase()) ||
        roll.includes(searchTerm.toLowerCase()) ||
        collector.includes(searchTerm.toLowerCase()) ||
        wish.includes(searchTerm.toLowerCase())

      const matchesBranch =
        selectedBranch === 'ALL' ||
        (student.branch || student['Branch'] || student['branch']) === selectedBranch

      return matchesSearch && matchesBranch
    })
  }, [students, searchTerm, selectedBranch])

  const branchColorMap = {
    CSE: 'bg-rose-50 text-rose-700 border-rose-200',
    IT: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    ECE: 'bg-purple-50 text-purple-700 border-purple-200',
    ME: 'bg-amber-50 text-amber-700 border-amber-200'
  }

  return (
    <div className="w-full flex flex-col space-y-4">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by student name, roll number, remarks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-stone-200 bg-stone-50/50 focus:bg-white focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all placeholder:text-stone-400"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-stone-600 cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Branch Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <Filter className="w-3.5 h-3.5 text-stone-400 shrink-0 mr-0.5" />
          {branches.map(b => (
            <button
              key={b}
              onClick={() => setSelectedBranch(b)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all shrink-0 cursor-pointer ${selectedBranch === b
                  ? 'bg-[#bd3c59] text-white shadow-xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
            >
              {b}
            </button>
          ))}
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-hidden border border-stone-200/80 rounded-2xl bg-white shadow-xs">
        <div className="overflow-x-auto max-h-[480px]">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 z-10 bg-stone-50/95 backdrop-blur-xs border-b border-stone-200 text-stone-500 uppercase tracking-wider font-semibold text-[10px]">
              <tr>
                <th className="py-3 px-3.5">Roll No.</th>
                <th className="py-3 px-3.5">Student Name</th>
                <th className="py-3 px-3.5">Branch & Year</th>
                <th className="py-3 px-3.5 text-right">Amount</th>
                <th className="py-3 px-3.5 text-center">Payment Mode</th>
                <th className="py-3 px-3.5">Date</th>
                <th className="py-3 px-3.5">Collected By</th>
                <th className="py-3 px-3.5 min-w-[180px]">Student Wish</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-700">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-stone-400">
                    <p className="text-sm font-medium">No contribution records found</p>
                    <p className="text-xs text-stone-400 mt-1">Try adjusting your search or filter</p>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student, idx) => {
                  const roll = student.rollNumber || student['Roll Number'] || student['roll_number'] || `#${idx + 1}`
                  const name = student.studentName || student['Student Name'] || student['student_name'] || 'Anonymous'
                  const branch = student.branch || student['Branch'] || student['branch'] || 'General'
                  const year = student.yearSemester || student['Year'] || student['year_semester'] || ''
                  const rawAmt = student.amountPaid ?? student['Amount Paid'] ?? student['amount_paid'] ?? 0
                  const amount = typeof rawAmt === 'number' ? rawAmt : (parseFloat(String(rawAmt).replace(/[^0-9.]/g, '')) || 0)
                  const mode = student.paymentMode || student['Payment Mode'] || student['payment_mode'] || 'UPI'
                  const date = student.paymentDate || student['Date of Payment'] || student['payment_date'] || '—'
                  const collector = student.collectedBy || student['Collected By'] || student['collected_by'] || '—'
                  const wish = student.studentWish || student['Remarks'] || student['student_wish'] || ''

                  const badgeClass = branchColorMap[branch] || 'bg-stone-100 text-stone-700 border-stone-200'

                  return (
                    <tr
                      key={roll + '-' + idx}
                      className="hover:bg-rose-50/30 transition-colors"
                    >
                      <td className="py-3 px-3.5 font-mono text-stone-500 font-medium">
                        {roll}
                      </td>
                      <td className="py-3 px-3.5 font-bold text-stone-900">
                        <div className="flex items-center gap-1.5">
                          <span>{name}</span>
                          {wish && (
                            <span title={wish} className="text-rose-400 cursor-help">
                              💌
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${badgeClass}`}>
                            {branch}
                          </span>
                          {year && (
                            <span className="text-[11px] text-stone-500 font-medium">
                              {year}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3.5 text-right font-bold text-[#2d181d] font-mono">
                        ₹{amount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3.5 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${mode.toLowerCase().includes('upi')
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                        >
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          {mode}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-stone-500 text-[11px]">
                        {date}
                      </td>
                      <td className="py-3 px-3.5 text-stone-600 text-[11px] font-medium">
                        {collector}
                      </td>
                      <td className="py-3 px-3.5 text-stone-600 italic text-[11px] max-w-[240px] truncate" title={wish}>
                        {wish ? `“${wish}”` : <span className="text-stone-300 not-italic">—</span>}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer info */}
      <div className="flex items-center justify-between text-[11px] text-stone-400 px-1">
        <span>Showing {filteredStudents.length} of {students.length} contributions</span>
        <span className="flex items-center gap-1">
          Total Filtered: <strong className="text-stone-700">₹{filteredStudents.reduce((sum, s) => sum + (typeof s.amountPaid === 'number' ? s.amountPaid : (parseFloat(String(s.amountPaid || 0).replace(/[^0-9.]/g, '')) || 0)), 0).toLocaleString('en-IN')}</strong>
        </span>
      </div>
    </div>
  )
}

export default CollectionTable