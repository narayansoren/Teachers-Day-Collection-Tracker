import React, { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Heart,
  Flower2,
  Users,
  Target,
  GraduationCap,
  Sprout,
  Lightbulb,
  ChevronLeft,
  ChevronRight,
  Mail,
  X,
  CheckCircle2,
  Sparkles,
  CreditCard,
  RefreshCw
} from 'lucide-react'

import { getCollectionData, normalizeStudentRow } from './services/googleSheets'
import CollectionTable from './components/CollectionTable'

// Visual assets
import heroTeacher from './assets/hero_teacher.jpg'
import floralCorner from './assets/floral_corner.jpg'
import bloomingGarden from './assets/blooming_garden.jpg'
import flowerRose from './assets/flower_rose.jpg'
import flowerLily from './assets/flower_lily.jpg'
import flowerSunflower from './assets/flower_sunflower.jpg'
import flowerPurple from './assets/flower_purple.jpg'

// Circular Progress Component for Department Analytics
function CircularProgress({ percentage = 0, value = "₹ 0", strokeColor = "#e15b74" }) {
  const radius = 28
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (Math.min(percentage, 100) / 100) * circumference

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative flex items-center justify-center w-18 h-18">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 72 72">
          <circle
            cx="36"
            cy="36"
            r={radius}
            stroke="#f1f5f9"
            strokeWidth="5"
            fill="transparent"
          />
          <circle
            cx="36"
            cy="36"
            r={radius}
            stroke={strokeColor}
            strokeWidth="5"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <span className="absolute text-xs font-bold text-stone-800">{percentage}%</span>
      </div>
      <span className="mt-1.5 text-xs font-bold text-stone-800">{value}</span>
    </div>
  )
}

const FLOWER_ICONS = [flowerRose, flowerLily, flowerSunflower, flowerPurple]

// Standard branches (without EE)
const ALL_BRANCHES = ['CSE', 'IT', 'ECE', 'ME']
const ALL_YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year']

const BRANCH_COLORS = {
  CSE: '#e15b74',
  IT: '#849c66',
  ECE: '#8e7cc3',
  ME: '#e69a38',
  General: '#f43f5e'
}

// 60 students per branch, ₹100 per student => ₹6,000 goal per branch
const STUDENTS_PER_BRANCH = 60
const CONTRIBUTION_PER_STUDENT = 100
const BRANCH_GOAL = STUDENTS_PER_BRANCH * CONTRIBUTION_PER_STUDENT // ₹6,000

const DEFAULT_FALLBACK_QUOTES = [
  {
    id: 'quote-1',
    quote: "Happy Teachers Day to all our amazing professors! Thank you for your guidance.",
    author: "— Rahul Sharma (CSE, 3rd Year)",
    flower: flowerRose
  },
  {
    id: 'quote-2',
    quote: "Thank you for guiding us every day with endless patience and support.",
    author: "— Priya Patel (ECE, 1st Year)",
    flower: flowerLily
  },
  {
    id: 'quote-3',
    quote: "Best teachers ever! You made complex concepts feel simple.",
    author: "— Aman Verma (ME, 4th Year)",
    flower: flowerSunflower
  }
]

export default function App() {
  const [students, setStudents] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Modals & UI states
  const [showAddModal, setShowAddModal] = useState(false)
  const [showAllModal, setShowAllModal] = useState(false)
  const [showSuccessToast, setShowSuccessToast] = useState(false)
  const [activeWishIndex, setActiveWishIndex] = useState(0)

  // Contribution Form State
  const [formData, setFormData] = useState({
    name: '',
    department: 'CSE',
    year: '1st Year',
    amount: '100',
    mode: 'UPI',
    message: ''
  })

  // Fetch dynamic data behind the scenes
  const loadData = useCallback(async (force = false) => {
    try {
      if (force) {
        setIsRefreshing(true)
      } else {
        setIsLoading(true)
      }
      const rawData = await getCollectionData(force)
      if (Array.isArray(rawData) && rawData.length > 0) {
        setStudents(rawData)
      } else {
        setStudents([])
      }
    } catch (err) {
      console.error('Failed to load collection data:', err)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadData(false)
  }, [loadData])

  // Computed Dynamic Metrics
  const totalCollection = useMemo(() => {
    return students.reduce((sum, s) => sum + (s.amountPaid || 0), 0)
  }, [students])

  const contributionsCount = students.length

  const todayDateStr = useMemo(() => new Date().toISOString().slice(0, 10), [])

  const todayCollection = useMemo(() => {
    const todayEntries = students.filter(s => {
      if (!s.paymentDate) return false
      return s.paymentDate.startsWith(todayDateStr) || s.paymentDate === todayDateStr
    })

    if (todayEntries.length > 0) {
      return todayEntries.reduce((acc, s) => acc + (s.amountPaid || 0), 0)
    }

    // Fallback to latest payment batch sum if no new payments today
    const dates = students.map(s => s.paymentDate).filter(Boolean).sort()
    const latestDate = dates[dates.length - 1]
    const latestEntries = students.filter(s => s.paymentDate === latestDate)
    return latestEntries.reduce((acc, s) => acc + (s.amountPaid || 0), 0)
  }, [students, todayDateStr])

  // Overall Goal: 4 years * 4 branches * 60 students * ₹100 = ₹96,000
  const targetGoal = ALL_YEARS.length * ALL_BRANCHES.length * BRANCH_GOAL
  const progressPercent = Math.min(Math.round(((totalCollection / targetGoal) * 100) * 10) / 10, 100).toFixed(1)

  // Dynamic Year & Department Collection Matrix (60 students / branch, ₹100 / student)
  const yearWiseData = useMemo(() => {
    const matrix = {}

    // Initialize all 4 years with standard 4 branches (CSE, IT, ECE, ME)
    ALL_YEARS.forEach(year => {
      matrix[year] = {}
      ALL_BRANCHES.forEach(dept => {
        matrix[year][dept] = {
          amount: 0,
          studentCount: 0,
          percentage: 0,
          color: BRANCH_COLORS[dept] || '#e15b74'
        }
      })
    })

    // Accumulate collections and student count per branch & year
    students.forEach(student => {
      const year = student.yearSemester || '1st Year'
      const dept = student.branch || 'General'
      const amt = student.amountPaid || 0

      if (!matrix[year]) {
        matrix[year] = {}
        ALL_BRANCHES.forEach(d => {
          matrix[year][d] = {
            amount: 0,
            studentCount: 0,
            percentage: 0,
            color: BRANCH_COLORS[d] || '#e15b74'
          }
        })
      }

      if (!matrix[year][dept]) {
        matrix[year][dept] = {
          amount: 0,
          studentCount: 0,
          percentage: 0,
          color: BRANCH_COLORS[dept] || '#e15b74'
        }
      }

      matrix[year][dept].amount += amt
      matrix[year][dept].studentCount += 1
    })

    // Calculate percentage based on ₹6,000 goal (60 students * ₹100)
    Object.keys(matrix).forEach(year => {
      Object.keys(matrix[year]).forEach(dept => {
        const amt = matrix[year][dept].amount
        const pct = Math.min(Math.round((amt / BRANCH_GOAL) * 100), 100)
        matrix[year][dept].percentage = pct
      })
    })

    return matrix
  }, [students])

  // Recent Contributions list (formatted for UI cards)
  const recentContributions = useMemo(() => {
    if (students.length === 0) return []
    return [...students].reverse().map((s, idx) => {
      const icon = FLOWER_ICONS[idx % FLOWER_ICONS.length]
      const bgColors = ['bg-rose-50', 'bg-emerald-50', 'bg-amber-50', 'bg-purple-50']
      const borderColors = ['border-rose-100', 'border-emerald-100', 'border-amber-100', 'border-purple-100']

      return {
        id: s.id || `rec-${idx}`,
        name: s.studentName,
        department: `${s.branch}, ${s.yearSemester}`,
        amount: `₹ ${s.amountPaid.toLocaleString('en-IN')}`,
        time: s.paymentDate || 'Recently',
        paymentMode: s.paymentMode,
        icon,
        bg: bgColors[idx % bgColors.length],
        border: borderColors[idx % borderColors.length],
        wish: s.studentWish
      }
    })
  }, [students])

  // Dynamic Student Wishes from Sheet
  const studentWishes = useMemo(() => {
    const extracted = students
      .filter(s => s.studentWish && s.studentWish.trim().length > 0)
      .map((s, idx) => ({
        id: s.id || `wish-${idx}`,
        quote: s.studentWish,
        author: `— ${s.studentName} (${s.branch}, ${s.yearSemester})`,
        flower: FLOWER_ICONS[idx % FLOWER_ICONS.length]
      }))

    return extracted.length > 0 ? extracted : DEFAULT_FALLBACK_QUOTES
  }, [students])

  // Carousel handlers
  const maxWishIndex = Math.max(0, studentWishes.length - 3)
  const handlePrevWish = () => {
    setActiveWishIndex(prev => (prev === 0 ? maxWishIndex : prev - 1))
  }
  const handleNextWish = () => {
    setActiveWishIndex(prev => (prev >= maxWishIndex ? 0 : prev + 1))
  }

  const visibleWishes = useMemo(() => {
    if (studentWishes.length <= 3) return studentWishes
    return studentWishes.slice(activeWishIndex, activeWishIndex + 3)
  }, [studentWishes, activeWishIndex])

  // Handle manual submission in Add Contribution form
  const handleFormSubmit = (e) => {
    e.preventDefault()
    const numericAmount = parseInt(formData.amount, 10) || 100
    const newStudent = normalizeStudentRow({
      roll_number: `${100 + students.length + 1}`,
      student_name: formData.name.trim() || 'Anonymous Student',
      branch: formData.department,
      year_semester: formData.year,
      amount_paid: numericAmount,
      payment_mode: formData.mode,
      payment_date: new Date().toISOString().slice(0, 10),
      collected_by: 'Online Form',
      student_wish: formData.message.trim()
    }, students.length)

    if (newStudent) {
      setStudents(prev => [newStudent, ...prev])
    }

    setShowAddModal(false)
    setShowSuccessToast(true)
    setTimeout(() => setShowSuccessToast(false), 4000)

    setFormData({
      name: '',
      department: 'CSE',
      year: '1st Year',
      amount: '100',
      mode: 'UPI',
      message: ''
    })
  }

  return (
    <div className="min-h-screen bg-[#fbfbf9] text-[#292524] relative overflow-hidden font-sans selection:bg-rose-200 selection:text-rose-900 pb-12">
      {/* Decorative Floral Corner Accents */}
      <img
        src={floralCorner}
        alt=""
        className="absolute -top-6 -left-6 w-36 sm:w-48 md:w-60 lg:w-72 object-contain pointer-events-none opacity-85 z-0 select-none"
      />
      <img
        src={floralCorner}
        alt=""
        className="absolute -top-6 -right-6 w-36 sm:w-48 md:w-60 lg:w-72 object-contain pointer-events-none opacity-85 z-0 select-none -scale-x-100"
      />

      {/* Main Container */}
      <div className="max-w-[880px] mx-auto px-4 sm:px-6 relative z-10 pt-4 md:pt-6">

        {/* Sticky Refresh Button - Positioned in thumb zone (bottom-right) on mobile to avoid title collision, and top-right on desktop */}
        <div className="fixed bottom-5 right-5 sm:bottom-auto sm:top-5 sm:right-6 z-40">
          <button
            onClick={() => loadData(true)}
            disabled={isRefreshing}
            title="Refresh latest data"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 sm:py-2 rounded-full sm:rounded-xl text-xs font-bold text-stone-700 hover:text-[#bd3c59] bg-white/95 backdrop-blur-md hover:bg-rose-50 border border-stone-200/90 shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-95 disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#bd3c59] ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>

        {/* =========================================================================
            1. TOP HERO HEADER
        ========================================================================== */}
        <header className="relative text-center pt-3 pb-2 px-2">
          <h1 className="font-serif text-2xl sm:text-4xl md:text-5xl font-bold text-[#351e22] tracking-tight leading-tight">
            Teacher’s Day Collection
          </h1>
          <div className="flex justify-center items-center mt-1.5">
            <span className="text-rose-400 text-xs">💖</span>
          </div>

          {/* Hero Illustration & Flanking Quotes */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center my-3">
            {/* Left Quote */}
            <div className="md:col-span-3 flex flex-col items-center text-center px-2 order-2 md:order-1">
              <span className="text-rose-500 font-serif text-2xl leading-none mb-1">“</span>
              <p className="text-xs text-stone-600 font-medium leading-relaxed max-w-[200px]">
                A good teacher plants the seeds of knowledge that grow forever.
              </p>
              <div className="flex items-center gap-2 mt-2.5 w-24 justify-center">
                <div className="h-[1px] bg-rose-200 flex-1"></div>
                <span className="text-rose-300 text-[10px]">♡</span>
                <div className="h-[1px] bg-rose-200 flex-1"></div>
              </div>
            </div>

            {/* Center Graphic */}
            <div className="md:col-span-6 flex justify-center items-center py-1 order-1 md:order-2">
              <div className="relative max-w-[280px] sm:max-w-[340px] w-full">
                <img
                  src={heroTeacher}
                  alt="Teacher with respectful students in Guru Vandana"
                  className="w-full h-auto object-contain rounded-2xl drop-shadow-sm hover:scale-[1.01] transition-transform duration-500"
                />
              </div>
            </div>

            {/* Right Quote */}
            <div className="md:col-span-3 flex flex-col items-center text-center px-2 order-3">
              <p className="text-xs text-stone-600 font-medium leading-relaxed max-w-[200px]">
                Celebrating the mentors who guide us, inspire us and help us grow.
              </p>
              <div className="flex items-center gap-2 mt-2.5 w-24 justify-center">
                <div className="h-[1px] bg-rose-200 flex-1"></div>
                <span className="text-rose-300 text-[10px]">♡</span>
                <div className="h-[1px] bg-rose-200 flex-1"></div>
              </div>
            </div>
          </div>
        </header>

        {/* =========================================================================
            2. METRICS CARDS ROW (2 Columns)
        ========================================================================== */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-4">
          {/* Total Collection */}
          <div className="bg-white rounded-2xl p-5 border border-stone-100/90 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex items-center justify-between hover:shadow-[0_4px_16px_rgba(0,0,0,0.05)] transition-all">
            <div>
              <span className="text-[10px] font-bold tracking-widest text-stone-400 uppercase block mb-1">
                TOTAL COLLECTION
              </span>
              <div className="text-2xl sm:text-3xl font-bold text-[#2d181d] flex items-baseline gap-1 font-serif">
                <span>₹</span>
                <span>{isLoading ? '...' : totalCollection.toLocaleString('en-IN')}</span>
              </div>
            </div>
            <div className="w-11 h-11 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 shadow-inner">
              <Heart className="w-5 h-5 fill-rose-500 text-rose-500" />
            </div>
          </div>

          {/* Today's Collection */}
          <div className="bg-white rounded-2xl p-5 border border-stone-100/90 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex items-center justify-between hover:shadow-[0_4px_16px_rgba(0,0,0,0.05)] transition-all">
            <div>
              <span className="text-[10px] font-bold tracking-widest text-stone-400 uppercase block mb-1">
                TODAY'S COLLECTION
              </span>
              <div className="text-2xl sm:text-3xl font-bold text-[#2d181d] flex items-baseline gap-1 font-serif">
                <span>₹</span>
                <span>{isLoading ? '...' : todayCollection.toLocaleString('en-IN')}</span>
              </div>
            </div>
            <div className="w-11 h-11 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-inner">
              <Flower2 className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
        </section>

        {/* =========================================================================
            3. PROGRESS & GARDEN ROW (2 Columns)
        ========================================================================== */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          {/* Our Collective Gift */}
          <div className="bg-white rounded-2xl p-5 border border-stone-100/90 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
            <div className="text-center mb-2">
              <span className="text-[10px] font-bold tracking-widest text-stone-400 uppercase block mb-0.5">
                OUR COLLECTIVE GIFT
              </span>
              <div className="text-2xl sm:text-3xl font-bold text-[#2d181d] font-serif">
                ₹ {totalCollection.toLocaleString('en-IN')}
              </div>
            </div>

            {/* Pink Progress Bar */}
            <div className="my-3">
              <div className="flex items-center gap-2.5">
                <div className="flex-1 bg-rose-100/70 h-3 rounded-full overflow-hidden p-0.5">
                  <div
                    className="bg-gradient-to-r from-rose-400 to-rose-500 h-full rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${Math.min(parseFloat(progressPercent), 100)}%` }}
                  ></div>
                </div>
                <span className="text-xs font-bold text-stone-700 whitespace-nowrap">{progressPercent}%</span>
              </div>
              <div className="flex justify-between text-[10px] text-stone-400 mt-1">
                <span>Raised: ₹{totalCollection.toLocaleString('en-IN')}</span>
                <span>Goal: ₹{targetGoal.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Sub-metrics */}
            <div className="grid grid-cols-3 gap-1 pt-3 border-t border-stone-100 text-center">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 mb-1">
                  <Users className="w-4 h-4" />
                </div>
                <span className="text-sm font-bold text-stone-800">{contributionsCount}</span>
                <span className="text-[9px] text-stone-400 uppercase font-medium">Contributions</span>
              </div>

              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 mb-1">
                  <Target className="w-4 h-4" />
                </div>
                <span className="text-sm font-bold text-stone-800">{ALL_BRANCHES.length}</span>
                <span className="text-[9px] text-stone-400 uppercase font-medium">Departments</span>
              </div>

              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 mb-1">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <span className="text-sm font-bold text-stone-800">{ALL_YEARS.length}</span>
                <span className="text-[9px] text-stone-400 uppercase font-medium">Years Active</span>
              </div>
            </div>
          </div>

          {/* Digital Garden Card */}
          <div className="bg-white rounded-2xl p-5 border border-stone-100/90 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between overflow-hidden">
            <div className="text-center mb-1">
              <span className="text-[10px] font-bold tracking-widest text-stone-600 uppercase block">
                EVERY CONTRIBUTION
              </span>
              <span className="text-[10px] font-bold tracking-widest text-stone-600 uppercase block">
                MAKES THE GARDEN BLOOM
              </span>
            </div>
            <div className="relative flex items-end justify-center pt-2">
              <img
                src={bloomingGarden}
                alt="Blooming digital garden"
                className="w-full max-h-[150px] object-contain hover:scale-[1.03] transition-transform duration-500"
              />
            </div>
          </div>
        </section>

        {/* =========================================================================
            4. FEATURES & RECENT ACTIVITY ROW (2 Columns)
        ========================================================================== */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          {/* More Than A Teacher */}
          <div className="bg-white rounded-2xl p-5 border border-stone-100/90 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
            <div className="text-center mb-3">
              <span className="text-[10px] font-bold tracking-widest text-stone-700 uppercase block">
                MORE THAN A TEACHER
              </span>
              <span className="text-rose-400 text-xs">💖</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {/* Feature 1 */}
              <div className="flex flex-col items-center text-center p-2 rounded-xl bg-stone-50/60 hover:bg-emerald-50/40 transition-colors">
                <div className="w-10 h-10 rounded-full bg-emerald-100/70 flex items-center justify-center text-emerald-700 mb-1.5">
                  <Sprout className="w-5 h-5 text-emerald-700" />
                </div>
                <h4 className="text-xs font-bold text-stone-800 mb-0.5">Guided Us</h4>
                <p className="text-[10px] text-stone-500 leading-tight">From confusion to clarity.</p>
              </div>

              {/* Feature 2 */}
              <div className="flex flex-col items-center text-center p-2 rounded-xl bg-stone-50/60 hover:bg-rose-50/40 transition-colors">
                <div className="w-10 h-10 rounded-full bg-rose-100/70 flex items-center justify-center text-rose-600 mb-1.5">
                  <Lightbulb className="w-5 h-5 text-rose-600" />
                </div>
                <h4 className="text-xs font-bold text-stone-800 mb-0.5">Inspired Us</h4>
                <p className="text-[10px] text-stone-500 leading-tight">Made us believe we could do more.</p>
              </div>

              {/* Feature 3 */}
              <div className="flex flex-col items-center text-center p-2 rounded-xl bg-stone-50/60 hover:bg-amber-50/40 transition-colors">
                <div className="w-10 h-10 rounded-full bg-amber-100/70 flex items-center justify-center text-amber-600 mb-1.5">
                  <Heart className="w-5 h-5 fill-amber-500 text-amber-500" />
                </div>
                <h4 className="text-xs font-bold text-stone-800 mb-0.5">Shaped Us</h4>
                <p className="text-[10px] text-stone-500 leading-tight">Lessons that stay beyond classrooms.</p>
              </div>
            </div>
          </div>

          {/* Recent Contributions */}
          <div className="bg-white rounded-2xl p-5 border border-stone-100/90 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold tracking-widest text-stone-700 uppercase">
                RECENT CONTRIBUTIONS
              </span>
              <button
                onClick={() => setShowAllModal(true)}
                className="text-xs font-bold text-rose-500 hover:text-rose-600 transition-colors cursor-pointer flex items-center gap-1"
              >
                <span>View All ({students.length})</span>
                <span>→</span>
              </button>
            </div>

            <div className="space-y-3">
              {isLoading ? (
                <div className="space-y-2 py-4">
                  <div className="h-9 bg-stone-100 rounded-xl animate-pulse"></div>
                  <div className="h-9 bg-stone-100 rounded-xl animate-pulse"></div>
                  <div className="h-9 bg-stone-100 rounded-xl animate-pulse"></div>
                </div>
              ) : recentContributions.length === 0 ? (
                <div className="text-center py-6 text-stone-400 text-xs">
                  No contributions recorded yet.
                </div>
              ) : (
                recentContributions.slice(0, 4).map((contributor) => (
                  <div
                    key={contributor.id}
                    className="flex items-center justify-between py-0.5 border-b border-stone-50 last:border-0"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-full overflow-hidden flex items-center justify-center ${contributor.bg} border ${contributor.border} shadow-2xs`}>
                        <img src={contributor.icon} alt="" className="w-6 h-6 object-contain" />
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                          <span>{contributor.name}</span>
                          {contributor.paymentMode && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-stone-100 text-stone-500 font-mono uppercase">
                              {contributor.paymentMode}
                            </span>
                          )}
                        </h5>
                        <p className="text-[10px] text-stone-400">{contributor.department}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-[#2d181d] font-mono block">{contributor.amount}</span>
                      <span className="text-[10px] text-stone-400">{contributor.time}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* =========================================================================
            5. ANALYTICS SECTION ("YEAR WISE TOTAL COLLECTION")
            Showing 4 branches (CSE, IT, ECE, ME) with 60 students per branch model
        ========================================================================== */}
        <section className="mb-6">
          <div className="text-center mb-3">
            <span className="text-[11px] font-bold tracking-widest text-stone-700 uppercase block">
              YEAR WISE TOTAL COLLECTION
            </span>
            <span className="text-rose-400 text-xs">💖</span>
          </div>

          <div className="space-y-3">
            {Object.entries(yearWiseData).map(([yearName, depts]) => (
              <div key={yearName} className="bg-white rounded-2xl p-4 border border-stone-100/90 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
                <div className="text-center mb-2">
                  <span className="text-xs font-semibold text-stone-600">{yearName}</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {Object.entries(depts).map(([deptName, info]) => (
                    <div key={deptName} className="flex flex-col items-center">
                      <span className="text-[11px] font-bold text-stone-700 mb-0.5">{deptName}</span>
                      <CircularProgress
                        percentage={info.percentage}
                        value={`₹ ${info.amount.toLocaleString('en-IN')}`}
                        strokeColor={info.color}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* =========================================================================
            6. FEEDBACK CAROUSEL ("WORDS FROM OUR STUDENTS")
        ========================================================================== */}
        <section className="mb-6">
          <div className="text-center mb-3">
            <span className="text-[11px] font-bold tracking-widest text-stone-700 uppercase block">
              WORDS FROM OUR STUDENTS
            </span>
            <span className="text-rose-400 text-xs">💖</span>
          </div>

          <div className="relative flex items-center justify-center gap-2 sm:gap-3">
            {/* Left Chevron Button */}
            <button
              onClick={handlePrevWish}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#bd3c59] text-white flex items-center justify-center shadow-md hover:bg-[#a62f49] transition-all shrink-0 z-10 cursor-pointer active:scale-95"
              aria-label="Previous Testimonials"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Testimonials Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 flex-1">
              {visibleWishes.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl p-4 border border-stone-100/90 shadow-[0_2px_12px_rgba(0,0,0,0.03)] relative overflow-hidden flex flex-col justify-between min-h-[130px] hover:shadow-[0_4px_16px_rgba(0,0,0,0.05)] transition-all"
                >
                  <div>
                    <span className="text-rose-500 font-serif text-xl leading-none">“</span>
                    <p className="text-xs font-medium text-stone-700 leading-relaxed mt-0.5 italic">
                      {item.quote}
                    </p>
                  </div>
                  <div className="flex items-end justify-between mt-3">
                    <span className="text-[10px] text-stone-500 font-medium">{item.author}</span>
                    <img
                      src={item.flower}
                      alt=""
                      className="w-8 h-8 object-contain -mr-1 -mb-1 opacity-90"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Right Chevron Button */}
            <button
              onClick={handleNextWish}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#bd3c59] text-white flex items-center justify-center shadow-md hover:bg-[#a62f49] transition-all shrink-0 z-10 cursor-pointer active:scale-95"
              aria-label="Next Testimonials"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          {/* Carousel Pagination Dots */}
          <div className="flex items-center justify-center gap-1.5 mt-3.5">
            {Array.from({ length: maxWishIndex + 1 }).map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveWishIndex(i)}
                className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${activeWishIndex === i ? 'w-5 bg-rose-400' : 'w-2 bg-stone-300'
                  }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </section>

        {/* =========================================================================
            7. BOTTOM BANNER ("Let's Make Their Day Special ❤️")
            Clean banner without flower image or CTA buttons
        ========================================================================== */}
        <section className="relative mt-7 rounded-3xl bg-gradient-to-r from-rose-100/80 via-pink-100/90 to-rose-100/80 border border-rose-200/70 p-7 sm:p-9 text-center overflow-hidden shadow-xs">
          {/* Floating Petal Accents */}
          <div className="absolute top-4 right-8 pointer-events-none opacity-70 hidden sm:block">
            <span className="text-xl animate-float">🌸</span>
          </div>
          <div className="absolute bottom-5 left-10 pointer-events-none opacity-70 hidden sm:block">
            <span className="text-lg animate-float-delayed">🌸</span>
          </div>

          {/* Center Quote Content */}
          <div className="relative z-10 max-w-lg mx-auto flex flex-col items-center">
            <h3 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 flex flex-col sm:flex-row items-center justify-center gap-2">
              Let’s Make Their Day Special <span>❤️</span>
            </h3>
            <p className="text-xs sm:text-sm text-stone-600 mt-2 font-medium">
              A small contribution. A big expression of gratitude.
            </p>
          </div>
        </section>

        {/* =========================================================================
            8. FOOTER CREDITS (Made with Love by Manish & 3 Profile Links)
        ========================================================================== */}
        <footer className="text-center pt-6 pb-4">
          <p className="text-xs text-stone-500 flex items-center justify-center gap-1.5 font-medium">
            <span>Made with</span>
            <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500 inline" />
            <span>by Manish</span>
          </p>
          <div className="flex items-center justify-center gap-4 mt-2.5 text-stone-500">
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noreferrer"
              className="hover:text-rose-600 transition-colors p-1"
              aria-label="LinkedIn"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.45a1.64 1.64 0 1 0 0 3.28 1.64 1.64 0 0 0 0-3.28" />
              </svg>
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="hover:text-rose-600 transition-colors p-1"
              aria-label="GitHub"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.1-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2" />
              </svg>
            </a>
            <a
              href="mailto:contact@example.com"
              className="hover:text-rose-600 transition-colors p-1"
              aria-label="Email"
            >
              <Mail className="w-4 h-4" />
            </a>
          </div>
        </footer>

      </div>

      {/* =========================================================================
          ALL CONTRIBUTIONS MODAL (Full CollectionTable)
      ========================================================================== */}
      {showAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 max-w-4xl w-full max-h-[90vh] flex flex-col border border-rose-100 shadow-2xl relative animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 mb-3 border-b border-stone-100">
              <div>
                <h3 className="font-serif text-2xl font-bold text-stone-900 flex items-center gap-2">
                  <span>Student Contributions</span>
                  <span className="text-xs font-sans font-bold bg-rose-50 text-rose-600 px-2.5 py-0.5 rounded-full border border-rose-100">
                    {students.length} Records
                  </span>
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  All student contributions and wishes
                </p>
              </div>
              <button
                onClick={() => setShowAllModal(false)}
                className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable table container */}
            <div className="flex-1 overflow-y-auto pr-1">
              <CollectionTable students={students} />
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          INTERACTIVE CONTRIBUTION MODAL
      ========================================================================== */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-rose-100 shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 p-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-5">
              <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-2">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-2xl font-bold text-stone-900">Add Your Contribution</h3>
              <p className="text-xs text-stone-500 mt-1">Join our college in honoring our beloved mentors!</p>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                  Your Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                    Department
                  </label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 bg-white"
                  >
                    <option value="CSE">CSE</option>
                    <option value="IT">IT</option>
                    <option value="ECE">ECE</option>
                    <option value="ME">ME</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                    Year
                  </label>
                  <select
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 bg-white"
                  >
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                  Payment Mode
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['UPI', 'Cash'].map((m) => (
                    <button
                      type="button"
                      key={m}
                      onClick={() => setFormData({ ...formData, mode: m })}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${formData.mode === m
                        ? 'bg-[#bd3c59] text-white border-[#bd3c59] shadow-xs'
                        : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-rose-50'
                        }`}
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>{m}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                  Contribution Amount (₹)
                </label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {['100', '250', '500', '1000'].map((amt) => (
                    <button
                      type="button"
                      key={amt}
                      onClick={() => setFormData({ ...formData, amount: amt })}
                      className={`py-2 rounded-lg text-xs font-bold border transition-all cursor-pointer ${formData.amount === amt
                        ? 'bg-[#bd3c59] text-white border-[#bd3c59] shadow-xs'
                        : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-rose-50 hover:border-rose-200'
                        }`}
                    >
                      ₹{amt}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  placeholder="Or enter custom amount"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                  Message for Teachers (Optional)
                </label>
                <textarea
                  rows="2"
                  placeholder="Leave a sweet note of gratitude..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 resize-none"
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full bg-[#bd3c59] hover:bg-[#a62f49] text-white font-bold text-sm tracking-wider uppercase py-3.5 rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>COMPLETE CONTRIBUTION</span>
                <Heart className="w-4 h-4 fill-white text-white" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {showSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-stone-900 text-white px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 border border-stone-700 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <p className="text-xs font-bold">Contribution Added! 🌸</p>
            <p className="text-[11px] text-stone-300">Thank you for making Teacher’s Day special!</p>
          </div>
        </div>
      )}
    </div>
  )
}
