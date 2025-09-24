"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useRouter, usePathname } from 'next/navigation'
import { X, ChevronLeft, ChevronRight, HelpCircle, Target } from 'lucide-react'

interface TourStep {
  id: string
  title: string
  description: string
  target: string
  position: 'top' | 'bottom' | 'left' | 'right' | 'center'
  route?: string
  action?: 'click' | 'navigate'
  waitForElement?: boolean
  offset?: { x: number; y: number }
}

const tourSteps: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to RangaOne Finance! 🎉',
    description: 'Let\'s take a comprehensive tour of your investment platform. We\'ll visit different pages to show you all features.',
    target: '[data-tour="main-content"]',
    position: 'center',
    route: '/dashboard'
  },
  {
    id: 'sidebar',
    title: 'Navigation Sidebar 🧭',
    description: 'Your main navigation hub. Access RangaOne Wealth, Model Portfolios, Investment Calculator, and Settings from here.',
    target: '[data-tour="sidebar"]',
    position: 'right'
  },
  {
    id: 'market-indices',
    title: 'Live Market Data 📊',
    description: 'Real-time market indices with live updates. Monitor NIFTY 50, MIDCAP, and SMALLCAP performance.',
    target: '[data-tour="market-indices"]',
    position: 'bottom'
  },
  {
    id: 'recommendations',
    title: 'Expert Recommendations 🎯',
    description: 'Get expert stock picks with detailed analysis, target prices, and confidence levels from our research team.',
    target: '[data-tour="recommendations"]',
    position: 'right'
  },
  {
    id: 'model-portfolios',
    title: 'Model Portfolios 💼',
    description: 'Professionally managed portfolios with real performance data, CAGR, and detailed holdings information.',
    target: '[data-tour="model-portfolios"]',
    position: 'left'
  },
  {
    id: 'search',
    title: 'Global Search 🔍',
    description: 'Quickly find stocks, portfolios, and recommendations using our powerful search feature.',
    target: '[data-tour="search"]',
    position: 'bottom'
  },
  {
    id: 'user-menu',
    title: 'User Profile 👤',
    description: 'Access your account settings, profile management, and logout options from here.',
    target: '[data-tour="user-menu"]',
    position: 'bottom'
  },
  {
    id: 'rangaone-wealth-nav',
    title: 'Explore RangaOne Wealth 💎',
    description: 'Let\'s explore our premium stock recommendation service with detailed analysis and insights.',
    target: '[data-tour="sidebar"]',
    position: 'right',
    route: '/rangaone-wealth',
    action: 'navigate'
  },
  {
    id: 'wealth-recommendations',
    title: 'Stock Analysis & Picks 📈',
    description: 'Detailed stock recommendations with entry/exit points, target prices, and risk analysis.',
    target: '[data-tour="recommendations-list"]',
    position: 'center',
    waitForElement: true
  },
  {
    id: 'model-portfolios-nav',
    title: 'Model Portfolios Section 📊',
    description: 'Discover professionally managed portfolios tailored for different risk profiles and investment goals.',
    target: '[data-tour="main-content"]',
    position: 'center',
    route: '/model-portfolios',
    action: 'navigate'
  },
  {
    id: 'portfolio-grid',
    title: 'Portfolio Performance 📈',
    description: 'Compare different portfolios with real-time performance metrics, CAGR, and risk indicators.',
    target: '[data-tour="portfolios-grid"]',
    position: 'center',
    waitForElement: true
  },
  {
    id: 'calculator-nav',
    title: 'Investment Calculator 🧮',
    description: 'Plan your investments with our SIP and lump sum calculators for better financial planning.',
    target: '[data-tour="main-content"]',
    position: 'center',
    route: '/investment-calculator',
    action: 'navigate'
  },
  {
    id: 'calculator-tools',
    title: 'Financial Planning Tools 💰',
    description: 'Calculate SIP returns, plan your investments, and set realistic financial goals.',
    target: '[data-tour="calculator-section"]',
    position: 'center',
    waitForElement: true
  },
  {
    id: 'settings-nav',
    title: 'Account Settings ⚙️',
    description: 'Manage your profile, notifications, payment methods, and subscription preferences.',
    target: '[data-tour="main-content"]',
    position: 'center',
    route: '/settings',
    action: 'navigate'
  },
  {
    id: 'settings-panel',
    title: 'Profile Management 📱',
    description: 'Update your personal information, notification preferences, and manage your subscriptions.',
    target: '[data-tour="settings-panel"]',
    position: 'center',
    waitForElement: true
  },
  {
    id: 'complete',
    title: 'Tour Complete! 🎊',
    description: 'You\'ve successfully explored the entire platform! Ready to start your investment journey?',
    target: '[data-tour="main-content"]',
    position: 'center',
    route: '/dashboard',
    action: 'navigate'
  }
]

interface DemoTourProps {
  isOpen: boolean
  onClose: () => void
}

// Global tour state management
class TourManager {
  private static instance: TourManager
  private currentStep = 0
  private isActive = false
  private router: any = null
  private onStepChange: ((step: number) => void) | null = null

  static getInstance() {
    if (!TourManager.instance) {
      TourManager.instance = new TourManager()
    }
    return TourManager.instance
  }

  setRouter(router: any) {
    this.router = router
  }

  setStepChangeCallback(callback: (step: number) => void) {
    this.onStepChange = callback
  }

  start() {
    this.isActive = true
    this.currentStep = 0
    sessionStorage.setItem('demo-tour-active', 'true')
    sessionStorage.setItem('demo-tour-step', '0')
  }

  nextStep() {
    const stepData = tourSteps[this.currentStep]
    
    if (stepData.route && stepData.action === 'navigate') {
      this.currentStep++
      sessionStorage.setItem('demo-tour-step', this.currentStep.toString())
      this.router?.push(stepData.route)
      return
    }
    
    if (this.currentStep < tourSteps.length - 1) {
      this.currentStep++
      sessionStorage.setItem('demo-tour-step', this.currentStep.toString())
      this.onStepChange?.(this.currentStep)
    } else {
      this.stop()
    }
  }

  previousStep() {
    if (this.currentStep > 0) {
      this.currentStep--
      sessionStorage.setItem('demo-tour-step', this.currentStep.toString())
      
      const stepData = tourSteps[this.currentStep]
      if (stepData.route) {
        this.router?.push(stepData.route)
      } else {
        this.onStepChange?.(this.currentStep)
      }
    }
  }

  stop() {
    this.isActive = false
    this.currentStep = 0
    sessionStorage.removeItem('demo-tour-active')
    sessionStorage.removeItem('demo-tour-step')
  }

  resume() {
    const savedStep = sessionStorage.getItem('demo-tour-step')
    if (savedStep) {
      this.currentStep = parseInt(savedStep)
      this.isActive = true
      return true
    }
    return false
  }

  getCurrentStep() {
    return this.currentStep
  }

  isActiveTour() {
    return this.isActive || sessionStorage.getItem('demo-tour-active') === 'true'
  }
}

export function DemoTour({ isOpen, onClose }: DemoTourProps) {
  const tourManager = TourManager.getInstance()
  const [currentStep, setCurrentStep] = useState(0)
  const [highlightedElement, setHighlightedElement] = useState<Element | null>(null)
  const router = useRouter()
  const pathname = usePathname()

  const currentStepData = tourSteps[currentStep] || tourSteps[0]

  const highlightElement = useCallback((element: Element) => {
    document.querySelectorAll('.tour-highlight').forEach(el => {
      el.classList.remove('tour-highlight')
    })
    element.classList.add('tour-highlight')
    element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' })
    setHighlightedElement(element)
  }, [])

  const getModalPosition = useCallback(() => {
    if (!highlightedElement) {
      return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)', arrow: null }
    }
    const rect = highlightedElement.getBoundingClientRect()
    const { position } = currentStepData
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const isMobile = viewportWidth < 768
    const modalWidth = Math.min(isMobile ? viewportWidth - 32 : 420, viewportWidth - 32)
    const modalHeight = isMobile ? 400 : 350
    const gap = isMobile ? 16 : 20
    
    // Check if modal would overlap with highlighted element
    const wouldOverlap = (modalTop: number, modalLeft: number) => {
      const modalRight = modalLeft + modalWidth
      const modalBottom = modalTop + modalHeight
      return !(modalRight < rect.left || modalLeft > rect.right || modalBottom < rect.top || modalTop > rect.bottom)
    }
    
    // On mobile, position at bottom to avoid overlap
    if (isMobile) {
      const bottomPosition = Math.min(viewportHeight - modalHeight - gap, rect.bottom + gap)
      return {
        top: bottomPosition,
        left: '50%', 
        transform: 'translateX(-50%)',
        arrow: bottomPosition < rect.bottom + gap ? null : 'tour-arrow-top'
      }
    }
    
    let top: number | string, left: number | string, transform = 'none', arrow: string | null = null
    
    // Try side positions first (right/left), then bottom, avoid top
    const positions = [
      { pos: 'right', priority: 1 },
      { pos: 'left', priority: 2 },
      { pos: 'bottom', priority: 3 }
    ]
    
    for (const { pos } of positions) {
      let testTop: number, testLeft: number, testArrow: string | null = null
      
      switch (pos) {
        case 'top':
          // Skip top positioning to avoid covering component
          continue
        case 'bottom':
          testTop = Math.min(rect.bottom + gap, viewportHeight - modalHeight - gap)
          testLeft = Math.min(Math.max(gap, rect.left + rect.width / 2 - modalWidth / 2), viewportWidth - modalWidth - gap)
          testArrow = 'tour-arrow-top'
          break
        case 'left':
          testTop = Math.min(Math.max(gap, rect.top + rect.height / 2 - modalHeight / 2), viewportHeight - modalHeight - gap)
          testLeft = Math.max(gap, rect.left - modalWidth - gap)
          testArrow = 'tour-arrow-right'
          break
        case 'right':
          testTop = Math.min(Math.max(gap, rect.top + rect.height / 2 - modalHeight / 2), viewportHeight - modalHeight - gap)
          testLeft = Math.min(rect.right + gap, viewportWidth - modalWidth - gap)
          testArrow = 'tour-arrow-left'
          break
        default:
          continue
      }
      
      // Check if this position works (no overlap and within viewport)
      if (!wouldOverlap(testTop, testLeft) && 
          testTop >= gap && testLeft >= gap && 
          testTop + modalHeight <= viewportHeight - gap && 
          testLeft + modalWidth <= viewportWidth - gap) {
        return { top: testTop, left: testLeft, transform: 'none', arrow: testArrow }
      }
    }
    
    // Fallback: position at sides or bottom corners only
    const sidePositions = [
      { top: rect.top + rect.height / 2 - modalHeight / 2, left: viewportWidth - modalWidth - gap }, // right side
      { top: rect.top + rect.height / 2 - modalHeight / 2, left: gap }, // left side
      { top: viewportHeight - modalHeight - gap, left: gap }, // bottom left
      { top: viewportHeight - modalHeight - gap, left: viewportWidth - modalWidth - gap } // bottom right
    ]
    
    for (const pos of sidePositions) {
      if (pos.top >= gap && pos.left >= gap && !wouldOverlap(pos.top, pos.left)) {
        return { top: pos.top, left: pos.left, transform: 'none', arrow: null }
      }
    }
    
    // Final fallback: center modal
    return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)', arrow: null }
  }, [highlightedElement, currentStepData])

  const handleElementInteraction = useCallback(() => {
    if (!highlightedElement) return
    highlightedElement.classList.add('tour-pulse')
    setTimeout(() => highlightedElement.classList.remove('tour-pulse'), 1500)
  }, [highlightedElement])

  const handleClose = useCallback(() => {
    document.querySelectorAll('.tour-highlight, .tour-pulse').forEach(el => {
      el.classList.remove('tour-highlight', 'tour-pulse')
    })
    tourManager.stop()
    onClose()
  }, [onClose])

  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = `
      .tour-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(4px);
        z-index: 9998;
        pointer-events: none;
      }
      
      .tour-spotlight {
        position: fixed;
        background: transparent;
        border-radius: 12px;
        box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5);
        z-index: 9999;
        pointer-events: none;
        mix-blend-mode: multiply;
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      }
      
      .tour-highlight {
        position: relative;
        z-index: 10000;
        pointer-events: none;
        border: 3px solid #8B5CF6;
        border-radius: 12px;
        box-shadow: 0 0 25px rgba(139, 92, 246, 0.6), inset 0 0 25px rgba(139, 92, 246, 0.15);
        animation: tour-glow 2.5s ease-in-out infinite alternate;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }
      
      @keyframes tour-glow {
        from {
          box-shadow: 0 0 25px rgba(139, 92, 246, 0.6), inset 0 0 25px rgba(139, 92, 246, 0.15);
          transform: scale(1);
        }
        to {
          box-shadow: 0 0 35px rgba(139, 92, 246, 0.9), inset 0 0 35px rgba(139, 92, 246, 0.25);
          transform: scale(1.01);
        }
      }
      
      .tour-pulse {
        animation: tour-pulse 1.8s ease-in-out infinite;
      }
      
      @keyframes tour-pulse {
        0%, 100% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.08); opacity: 0.9; }
      }
      
      .tour-modal {
        position: fixed;
        z-index: 10001;
        max-width: 420px;
        background: linear-gradient(135deg, #ffffff 0%, #fafafa 100%);
        border-radius: 20px;
        box-shadow: 0 32px 64px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.05);
        backdrop-filter: blur(16px);
        pointer-events: auto;
        border: 1px solid rgba(255, 255, 255, 0.2);
      }
      
      .tour-arrow {
        position: absolute;
        width: 0;
        height: 0;
        border-style: solid;
        filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1));
      }
      
      .tour-arrow-top {
        border-left: 12px solid transparent;
        border-right: 12px solid transparent;
        border-bottom: 12px solid #ffffff;
        top: -12px;
        left: 50%;
        transform: translateX(-50%);
      }
      
      .tour-arrow-bottom {
        border-left: 12px solid transparent;
        border-right: 12px solid transparent;
        border-top: 12px solid #ffffff;
        bottom: -12px;
        left: 50%;
        transform: translateX(-50%);
      }
      
      .tour-arrow-left {
        border-top: 12px solid transparent;
        border-bottom: 12px solid transparent;
        border-right: 12px solid #ffffff;
        left: -12px;
        top: 50%;
        transform: translateY(-50%);
      }
      
      .tour-arrow-right {
        border-top: 12px solid transparent;
        border-bottom: 12px solid transparent;
        border-left: 12px solid #ffffff;
        right: -12px;
        top: 50%;
        transform: translateY(-50%);
      }
    `
    document.head.appendChild(style)
    return () => {
      document.head.removeChild(style)
    }
  }, [])

  useEffect(() => {
    tourManager.setRouter(router)
    tourManager.setStepChangeCallback(setCurrentStep)
    
    if (isOpen) {
      if (tourManager.resume()) {
        setCurrentStep(tourManager.getCurrentStep())
      } else {
        tourManager.start()
        setCurrentStep(0)
      }
    }
  }, [isOpen])
  
  useEffect(() => {
    if (tourManager.isActiveTour() && !isOpen) {
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('resume-demo-tour'))
      }, 500)
    }
  }, [pathname])

  useEffect(() => {
    if (!isOpen || !currentStepData) return
    
    const findAndHighlightElement = () => {
      const element = document.querySelector(currentStepData.target)
      if (element) {
        highlightElement(element)
        return true
      }
      return false
    }
    
    if (currentStepData.waitForElement) {
      const maxRetries = 20
      let retries = 0
      const retryFind = () => {
        if (findAndHighlightElement() || retries >= maxRetries) return
        retries++
        setTimeout(retryFind, 200)
      }
      setTimeout(retryFind, 100)
    } else {
      setTimeout(findAndHighlightElement, 100)
    }
    
    return () => {
      document.querySelectorAll('.tour-highlight').forEach(el => {
        el.classList.remove('tour-highlight')
      })
    }
  }, [currentStep, isOpen, currentStepData, pathname, highlightElement])

  // Update positions on scroll/resize
  useEffect(() => {
    if (!isOpen || !highlightedElement) return
    
    const updatePositions = () => {
      // Force re-render to update positions
      setHighlightedElement(prev => prev ? document.querySelector(currentStepData.target) : null)
    }
    
    window.addEventListener('scroll', updatePositions, { passive: true })
    window.addEventListener('resize', updatePositions)
    
    return () => {
      window.removeEventListener('scroll', updatePositions)
      window.removeEventListener('resize', updatePositions)
    }
  }, [isOpen, highlightedElement, currentStepData])

  const nextStep = () => {
    tourManager.nextStep()
    if (!tourManager.isActiveTour()) {
      onClose()
    }
  }

  const previousStep = () => {
    const prevStepData = tourSteps[currentStep - 1]
    if (prevStepData?.route && prevStepData.route !== pathname) {
      router.push(prevStepData.route)
      setTimeout(() => {
        tourManager.previousStep()
      }, 100)
    } else {
      tourManager.previousStep()
    }
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return
      
      if (e.key === 'Escape') {
        handleClose()
      } else if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault()
        nextStep()
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        previousStep()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  if (!isOpen || !currentStepData) return null

  const modalPosition = getModalPosition()
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="tour-overlay"
          />
          
          {highlightedElement && (
            <motion.div
              key={`spotlight-${currentStep}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ 
                opacity: 1, 
                scale: 1,
                top: highlightedElement.getBoundingClientRect().top - 8,
                left: highlightedElement.getBoundingClientRect().left - 8,
                width: highlightedElement.getBoundingClientRect().width + 16,
                height: highlightedElement.getBoundingClientRect().height + 16,
              }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="tour-spotlight"
            />
          )}
          
          <motion.div
            key={`modal-${currentStep}`}
            initial={{ opacity: 0, scale: 0.85, y: 30, rotateX: 10 }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              y: 0, 
              rotateX: 0,
              top: modalPosition.top,
              left: modalPosition.left,
            }}
            exit={{ opacity: 0, scale: 0.9, y: 20, rotateX: -5 }}
            transition={{ 
              type: "spring", 
              stiffness: 300, 
              damping: 30,
              opacity: { duration: 0.3 }
            }}
            className="tour-modal"
            style={{
              transform: modalPosition.transform,
              width: window.innerWidth < 768 ? window.innerWidth - 32 : Math.min(420, window.innerWidth - 40)
            }}
          >
            {modalPosition.arrow && (
              <div className={`tour-arrow ${modalPosition.arrow}`} />
            )}
            
            <div className="p-6 sm:p-7">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <motion.div 
                    className="w-12 h-12 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Target className="w-6 h-6 text-white" />
                  </motion.div>
                  <span className="bg-gradient-to-r from-gray-100 to-gray-50 text-gray-700 px-4 py-2 rounded-full text-sm font-semibold shadow-sm border border-gray-200">
                    {currentStep + 1} of {tourSteps.length}
                  </span>
                </div>
                <motion.button
                  onClick={handleClose}
                  className="text-gray-400 hover:text-gray-600 transition-all duration-200 p-2 rounded-full hover:bg-gray-100"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>
              
              <motion.h3 
                className="text-2xl font-bold text-gray-900 mb-3 leading-tight"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                {currentStepData?.title || 'Loading...'}
              </motion.h3>
              <motion.p 
                className="text-gray-600 mb-6 leading-relaxed text-base"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                {currentStepData?.description || 'Please wait...'}
              </motion.p>
              
              <motion.div 
                className="mb-6"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="flex justify-between text-sm font-medium text-gray-500 mb-3">
                  <span>Progress</span>
                  <span className="text-violet-600">{Math.round(((currentStep + 1) / tourSteps.length) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
                  <motion.div 
                    className="bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-600 h-3 rounded-full shadow-sm"
                    initial={{ width: 0 }}
                    animate={{ width: `${((currentStep + 1) / tourSteps.length) * 100}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                  />
                </div>
              </motion.div>
              
              <motion.div 
                className="space-y-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <div className="flex gap-2">
                  <motion.button
                    onClick={previousStep}
                    disabled={currentStep === 0}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex-1"
                    whileHover={{ scale: currentStep === 0 ? 1 : 1.02 }}
                    whileTap={{ scale: currentStep === 0 ? 1 : 0.98 }}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </motion.button>
                  
                  {highlightedElement && (
                    <motion.button
                      onClick={handleElementInteraction}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 text-violet-600 hover:text-violet-700 hover:bg-violet-50 rounded-xl transition-all duration-200 font-medium border border-violet-200 hover:border-violet-300 flex-1"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Target className="w-4 h-4" />
                      Try It
                    </motion.button>
                  )}
                </div>
                
                <motion.button
                  onClick={nextStep}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-500 to-indigo-600 text-white hover:from-violet-600 hover:to-indigo-700 rounded-xl transition-all duration-200 font-semibold shadow-lg hover:shadow-xl w-full"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {currentStep === tourSteps.length - 1 ? 'Finish Tour' : 
                   currentStepData?.action === 'navigate' ? 'Go There' : 'Next Step'}
                  <ChevronRight className="w-4 h-4" />
                </motion.button>
              </motion.div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default DemoTour