import React, { useState, useEffect, useRef, useCallback } from 'react'
import { RefreshCw, Sparkles } from 'lucide-react'

export default function FloatingRefreshButton({ onRefresh, isRefreshing }) {
  const buttonRef = useRef(null)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)
  const [justSynced, setJustSynced] = useState(false)

  // Drag tracking refs
  const dragStartRef = useRef({ x: 0, y: 0 })
  const startPosRef = useRef({ x: 0, y: 0 })
  const lastMoveRef = useRef({ x: 0, y: 0, time: 0 })
  const velocityRef = useRef({ x: 0, y: 0 })
  const animFrameRef = useRef(null)
  const hasMovedRef = useRef(false)

  const BUTTON_SIZE = 56
  const PADDING = 16

  // Set initial position at bottom right once mounted
  useEffect(() => {
    const initX = Math.max(PADDING, window.innerWidth - BUTTON_SIZE - PADDING - 10)
    const initY = Math.max(PADDING, window.innerHeight - BUTTON_SIZE - PADDING - 24)
    setPosition({ x: initX, y: initY })

    const handleResize = () => {
      setPosition((prev) => ({
        x: Math.min(Math.max(PADDING, prev.x), window.innerWidth - BUTTON_SIZE - PADDING),
        y: Math.min(Math.max(PADDING, prev.y), window.innerHeight - BUTTON_SIZE - PADDING)
      }))
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Clamp helper to ensure button is 100% inside visible screen
  const clampPos = useCallback((x, y) => {
    const maxX = Math.max(PADDING, window.innerWidth - BUTTON_SIZE - PADDING)
    const maxY = Math.max(PADDING, window.innerHeight - BUTTON_SIZE - PADDING)
    return {
      x: Math.min(Math.max(PADDING, x), maxX),
      y: Math.min(Math.max(PADDING, y), maxY)
    }
  }, [])

  // Inertia momentum loop when thrown
  const startThrowInertia = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)

    const step = () => {
      let vx = velocityRef.current.x * 0.92
      let vy = velocityRef.current.y * 0.92

      velocityRef.current = { x: vx, y: vy }

      setPosition((prev) => {
        let nextX = prev.x + vx
        let nextY = prev.y + vy

        const minX = PADDING
        const maxX = Math.max(PADDING, window.innerWidth - BUTTON_SIZE - PADDING)
        const minY = PADDING
        const maxY = Math.max(PADDING, window.innerHeight - BUTTON_SIZE - PADDING)

        // Bounce slightly off edges
        if (nextX <= minX) {
          nextX = minX
          velocityRef.current.x = -velocityRef.current.x * 0.3
        } else if (nextX >= maxX) {
          nextX = maxX
          velocityRef.current.x = -velocityRef.current.x * 0.3
        }

        if (nextY <= minY) {
          nextY = minY
          velocityRef.current.y = -velocityRef.current.y * 0.3
        } else if (nextY >= maxY) {
          nextY = maxY
          velocityRef.current.y = -velocityRef.current.y * 0.3
        }

        return { x: nextX, y: nextY }
      })

      if (Math.hypot(vx, vy) > 0.4) {
        animFrameRef.current = requestAnimationFrame(step)
      } else {
        velocityRef.current = { x: 0, y: 0 }
      }
    }

    animFrameRef.current = requestAnimationFrame(step)
  }, [])

  // Unified start for mouse and touch
  const handleStart = (clientX, clientY) => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)

    setIsDragging(true)
    hasMovedRef.current = false
    dragStartRef.current = { x: clientX, y: clientY }
    startPosRef.current = { ...position }
    lastMoveRef.current = { x: clientX, y: clientY, time: performance.now() }
    velocityRef.current = { x: 0, y: 0 }
  }

  const handleMove = useCallback((clientX, clientY) => {
    const deltaX = clientX - dragStartRef.current.x
    const deltaY = clientY - dragStartRef.current.y

    if (Math.hypot(deltaX, deltaY) > 4) {
      hasMovedRef.current = true
    }

    const now = performance.now()
    const dt = Math.max(1, now - lastMoveRef.current.time)
    const moveX = clientX - lastMoveRef.current.x
    const moveY = clientY - lastMoveRef.current.y

    // Calculate throw velocity with smoothing
    const instantVx = (moveX / dt) * 16
    const instantVy = (moveY / dt) * 16

    velocityRef.current = {
      x: velocityRef.current.x * 0.4 + instantVx * 0.6,
      y: velocityRef.current.y * 0.4 + instantVy * 0.6
    }

    lastMoveRef.current = { x: clientX, y: clientY, time: now }

    const rawX = startPosRef.current.x + deltaX
    const rawY = startPosRef.current.y + deltaY
    setPosition(clampPos(rawX, rawY))
  }, [clampPos])

  const handleEnd = useCallback(() => {
    setIsDragging(false)

    if (!hasMovedRef.current) {
      // It was a tap/click -> trigger refresh
      if (onRefresh) {
        onRefresh()
        setJustSynced(true)
        setTimeout(() => setJustSynced(false), 2500)
      }
    } else {
      // It was a throw -> initiate momentum
      startThrowInertia()
    }
  }, [onRefresh, startThrowInertia])

  // Mouse event listeners
  const onMouseDown = (e) => {
    if (e.button !== 0) return
    e.preventDefault()
    handleStart(e.clientX, e.clientY)

    const onMouseMove = (moveEvent) => {
      moveEvent.preventDefault()
      handleMove(moveEvent.clientX, moveEvent.clientY)
    }

    const onMouseUp = () => {
      handleEnd()
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }

  // Touch event listeners
  const onTouchStart = (e) => {
    if (e.touches.length !== 1) return
    const touch = e.touches[0]
    handleStart(touch.clientX, touch.clientY)

    const onTouchMove = (moveEvent) => {
      if (moveEvent.touches.length !== 1) return
      const t = moveEvent.touches[0]
      handleMove(t.clientX, t.clientY)
    }

    const onTouchEnd = () => {
      handleEnd()
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
    }

    window.addEventListener('touchmove', onTouchMove, { passive: false })
    window.addEventListener('touchend', onTouchEnd)
  }

  // Cleanup inertia animation on unmount
  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [])

  return (
    <div
      ref={buttonRef}
      style={{
        transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
        touchAction: 'none',
        userSelect: 'none'
      }}
      className="fixed top-0 left-0 z-50 transition-shadow duration-200"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Tooltip on hover/drag */}
      {showTooltip && !isDragging && (
        <div className="absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap px-2.5 py-1 rounded-lg bg-stone-900/90 backdrop-blur-xs text-white text-[10px] font-semibold shadow-md pointer-events-none animate-in fade-in zoom-in-95 duration-150 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-rose-300" />
          <span>Tap to Refresh • Drag anywhere</span>
        </div>
      )}

      {/* Floating Action Button */}
      <button
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
        disabled={isRefreshing}
        aria-label="Refresh Sheet Data"
        title="Tap to refresh data from Google Sheet, or drag anywhere"
        className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-[0_8px_25px_rgba(189,60,89,0.35)] border-2 border-white/80 transition-transform active:scale-90 select-none cursor-grab active:cursor-grabbing ${isDragging ? 'scale-105 shadow-[0_12px_32px_rgba(189,60,89,0.5)] cursor-grabbing' : 'hover:scale-105'
          } ${isRefreshing
            ? 'bg-gradient-to-tr from-[#9e2f47] to-[#bd3c59] opacity-90'
            : 'bg-gradient-to-tr from-[#bd3c59] via-[#d44865] to-[#e15b74]'
          }`}
      >
        <RefreshCw
          className={`w-6 h-6 drop-shadow-xs transition-transform duration-700 ${isRefreshing ? 'animate-spin' : ''
            }`}
        />
      </button>

      {/* Sync Success Indicator */}
      {justSynced && !isRefreshing && (
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded-md bg-emerald-700 text-white text-[9px] font-bold shadow-md animate-in fade-in slide-in-from-top-1">
          Updated! ✨
        </div>
      )}
    </div>
  )
}
