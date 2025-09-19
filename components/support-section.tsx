"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { FiSend, FiMessageCircle, FiHeart } from "react-icons/fi"

// Add required CSS animations
if (typeof document !== 'undefined') {
  const style = document.createElement('style')
  style.textContent = `
    @keyframes gridMove {
      0% { transform: translate(0, 0); }
      100% { transform: translate(50px, 50px); }
    }
    @keyframes float {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-20px); }
    }
    .animate-float {
      animation: float 6s ease-in-out infinite;
    }
  `
  document.head.appendChild(style)
}

const SupportSection = () => {
  const [isVisible, setIsVisible] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const handleMouseMove = (e: React.MouseEvent) => {
    if (sectionRef.current) {
      const rect = sectionRef.current.getBoundingClientRect()
      setMousePosition({
        x: ((e.clientX - rect.left) / rect.width) * 100,
        y: ((e.clientY - rect.top) / rect.height) * 100,
      })
    }
  }

  return (
    <div
      ref={sectionRef}
      onMouseMove={handleMouseMove}
      className="bg-gradient-to-br from-slate-50 via-blue-50/30 to-violet-50/50 py-2 px-4 relative overflow-hidden font-sans min-h-[150px] flex items-center"
    >


      {/* Animated background grid */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
            linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
          `,
            backgroundSize: "50px 50px",
            animation: "gridMove 20s linear infinite",
          }}
        />
      </div>

      <div className="max-w-6xl mx-auto text-center relative z-10 w-full">
        {/* Floating icons */}
        <div className="absolute -top-8 left-1/4 opacity-20">
          <FiMessageCircle
            className={`text-violet-400 text-2xl transition-all duration-1000 ${isVisible ? "animate-bounce" : ""}`}
            style={{ animationDelay: "2s", animationDuration: "3s" }}
          />
        </div>
        <div className="absolute -top-6 right-1/3 opacity-20">
          <FiHeart
            className={`text-pink-400 text-xl transition-all duration-1000 ${isVisible ? "animate-pulse" : ""}`}
            style={{ animationDelay: "3s" }}
          />
        </div>

        {/* Enhanced typography heading with better animations */}
        <div className="relative">
          <h2
            className={`
              text-2xl md:text-3xl lg:text-4xl font-light text-slate-800 leading-[1.1] tracking-tight
              transition-all duration-1200 ease-out
              ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}
            `}
            style={{
              transitionDelay: "300ms",
              fontFamily:
                "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif",
            }}
          >
            <span
              className={`
                block mb-2 text-slate-500 font-extralight text-lg md:text-xl lg:text-2xl tracking-wider
                transition-all duration-1000 ease-out
                ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"}
              `}
              style={{ transitionDelay: "500ms" }}
            >
              Still have questions?
            </span>

            <span className="relative inline-block">
              <span
                className={`
                  bg-gradient-to-r from-slate-900 via-violet-700 to-blue-700 bg-clip-text text-transparent font-medium
                  transition-all duration-1000 ease-out
                  ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"}
                `}
                style={{ transitionDelay: "700ms" }}
              >
                We're here to help you choose
              </span>
              <br />
              <span
                className={`
                  bg-gradient-to-r from-blue-700 via-violet-700 to-slate-900 bg-clip-text text-transparent font-medium
                  transition-all duration-1000 ease-out
                  ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"}
                `}
                style={{ transitionDelay: "900ms" }}
              >
                the right plan.
              </span>

              {/* Enhanced animated underline with glow */}
              <div className="relative">
                <div
                  className={`
                    absolute -bottom-3 left-1/2 transform -translate-x-1/2 h-1.5 bg-gradient-to-r from-violet-500 to-blue-500 rounded-full
                    transition-all duration-1500 ease-out
                    ${isVisible ? "w-40 opacity-100" : "w-0 opacity-0"}
                  `}
                  style={{ transitionDelay: "1200ms" }}
                />
                <div
                  className={`
                    absolute -bottom-3 left-1/2 transform -translate-x-1/2 h-1.5 bg-gradient-to-r from-violet-400 to-blue-400 rounded-full blur-sm
                    transition-all duration-1500 ease-out
                    ${isVisible ? "w-40 opacity-60" : "w-0 opacity-0"}
                  `}
                  style={{ transitionDelay: "1200ms" }}
                />
              </div>
            </span>
          </h2>
        </div>

        {/* Enhanced button container with better positioning */}
        <div
          className={`
            transition-all duration-1200 ease-out
            ${isVisible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-12 scale-95"}
          `}
          style={{ transitionDelay: "1000ms" }}
        >
          <EnhancedNeumorphismButton />
        </div>

        {/* Subtle help text */}
        <p
          className={`
            mt-4 text-slate-400 text-xs tracking-wide
            transition-all duration-1000 ease-out
            ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
          `}
          style={{ transitionDelay: "1400ms" }}
        >
          Our support team typically responds within 2 hours
        </p>
      </div>

      {/* Enhanced floating particles with better distribution */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className={`
              absolute bg-gradient-to-r from-violet-300 to-blue-300 rounded-full
              animate-float opacity-25
              ${i % 3 === 0 ? "w-2 h-2" : i % 3 === 1 ? "w-1.5 h-1.5" : "w-1 h-1"}
            `}
            style={{
              left: `${10 + i * 8}%`,
              top: `${20 + (i % 4) * 20}%`,
              animationDelay: `${i * 0.8}s`,
              animationDuration: `${5 + i * 0.2}s`,
            }}
          />
        ))}
      </div>

      {/* Ambient light effects */}
      <div
        className="absolute top-0 left-1/4 w-96 h-96 bg-violet-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"
        style={{ animationDuration: "4s" }}
      />
      <div
        className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"
        style={{ animationDuration: "6s", animationDelay: "2s" }}
      />
    </div>
  )
}

const EnhancedNeumorphismButton = () => {
  const [isHovered, setIsHovered] = useState(false)
  const [isPressed, setIsPressed] = useState(false)
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([])

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const newRipple = { id: Date.now(), x, y }
    setRipples((prev) => [...prev, newRipple])

    setTimeout(() => {
      setRipples((prev) => prev.filter((ripple) => ripple.id !== newRipple.id))
    }, 600)
  }

  return (
    <button
      className={`
        px-10 py-5 rounded-full 
        flex items-center gap-4 mx-auto
        text-slate-700 font-semibold text-xl tracking-wide
        shadow-[-8px_-8px_16px_rgba(255,_255,_255,_0.8),_8px_8px_16px_rgba(0,_0,_0,_0.25)]
        transition-all duration-300 ease-out
        hover:shadow-[-3px_-3px_8px_rgba(255,_255,_255,_0.6),_3px_3px_8px_rgba(0,_0,_0,_0.3),inset_-4px_-4px_8px_rgba(255,_255,_255,_1),inset_4px_4px_8px_rgba(0,_0,_0,_0.3)]
        active:shadow-[inset_-2px_-2px_4px_rgba(255,_255,_255,_1),inset_2px_2px_4px_rgba(0,_0,_0,_0.3)]
        hover:text-violet-700
        transform hover:scale-105 active:scale-100
        group relative overflow-hidden
        ${isPressed ? "scale-95" : ""}
      `}
      style={{
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onClick={handleClick}
    >
      <FiSend
        className={`
          transition-all duration-300 ease-out text-2xl
          ${isHovered ? "rotate-12 scale-110 text-violet-600" : "rotate-0 scale-100"}
        `}
      />

      <span className="relative overflow-hidden">
        <span
          className={`
            inline-block transition-transform duration-300 ease-out
            ${isHovered ? "-translate-y-full opacity-0" : "translate-y-0 opacity-100"}
          `}
        >
          Contact Support
        </span>
        <span
          className={`
            absolute left-0 top-0 inline-block transition-transform duration-300 ease-out
            ${isHovered ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"}
          `}
        >
          Let's Chat! 💬
        </span>
      </span>

      {/* Enhanced ripple effects */}
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="absolute bg-gradient-to-r from-violet-400/30 to-blue-400/30 rounded-full animate-ping"
          style={{
            left: ripple.x - 10,
            top: ripple.y - 10,
            width: 20,
            height: 20,
            animationDuration: "600ms",
          }}
        />
      ))}

      {/* Gradient overlay */}
      <div className="absolute inset-0 rounded-full overflow-hidden">
        <div
          className={`
            absolute inset-0 bg-gradient-to-r from-violet-500/10 via-blue-500/10 to-violet-500/10 rounded-full
            transition-all duration-500 ease-out
            ${isHovered ? "scale-100 opacity-100" : "scale-0 opacity-0"}
          `}
        />
      </div>

      {/* Shine effect */}
      <div
        className={`
          absolute inset-0 rounded-full
          bg-gradient-to-r from-transparent via-white/20 to-transparent
          transform -skew-x-12 -translate-x-full
          transition-transform duration-700 ease-out
          ${isHovered ? "translate-x-full" : "-translate-x-full"}
        `}
      />
    </button>
  )
}

export default SupportSection