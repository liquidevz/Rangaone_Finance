"use client"

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { X, ChevronLeft, ChevronRight, MapPin, Lightbulb, ArrowRight, Play } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TourStep {
  id: string
  title: string
  description: string
  route?: string
  selector: string
  position: 'top' | 'bottom' | 'left' | 'right' | 'center'
  category: 'overview' | 'navigation' | 'features' | 'tools' | 'settings'
  highlightColor?: string
  waitForElement?: boolean
  customContent?: React.ReactNode
  requireInteraction?: boolean
  interactionSelector?: string
  interactionType?: 'click' | 'hover' | 'input' | 'scroll'
  interactionMessage?: string
}

const tourSteps: TourStep[] = [
  // Welcome Step
  {
    id: 'welcome',
    title: 'Welcome to RangaOne Finance! 🎉',
    description: 'Take this guided tour to discover all the powerful features of your investment dashboard. We\'ll show you everything from market insights to portfolio management tools.',
    selector: 'body',
    position: 'center',
    category: 'overview',
    customContent: (
      <div className="text-center py-4">
        <div className="text-6xl mb-4">📈</div>
        <p className="text-lg text-gray-600">Ready to explore your complete investment platform?</p>
      </div>
    )
  },

  // Dashboard Overview
  {
    id: 'dashboard_overview',
    title: 'Dashboard Overview',
    description: 'This is your main dashboard where you can see real-time market data, expert recommendations, and model portfolios. Everything you need for smart investing in one place.',
    route: '/dashboard',
    selector: '.max-w-7xl',
    position: 'center',
    category: 'overview',
    highlightColor: 'blue'
  },

  // Market Indices
  {
    id: 'market_indices',
    title: 'Live Market Indices',
    description: 'Stay updated with real-time market data including NIFTY 50, MIDCAP 150, and NIFTY SMALLCAP 250. Track market trends and make informed investment decisions.',
    route: '/dashboard',
    selector: 'Market Indices',
    position: 'bottom',
    category: 'features',
    waitForElement: true
  },

  // Global Search
  {
    id: 'global_search',
    title: 'Smart Search Feature',
    description: 'Try our intelligent search! Click on the search box and type something to see how it works.',
    route: '/dashboard',
    selector: 'search',
    position: 'bottom',
    category: 'tools',
    requireInteraction: true,
    interactionSelector: 'input[type="search"], input[placeholder*="search" i], .search-input, [data-testid="search"], button[aria-label*="search" i]',
    interactionType: 'click',
    interactionMessage: 'Click on the search box to continue'
  },

  // Expert Recommendations
  {
    id: 'expert_recommendations',
    title: 'Expert Recommendations',
    description: 'Get curated stock recommendations from our experts. Browse between RangaOne Wealth tips and Model Portfolio specific recommendations with detailed analysis and target percentages.',
    route: '/dashboard',
    selector: 'Expert Recommendations',
    position: 'left',
    category: 'features',
    waitForElement: true
  },

  // Model Portfolio Section
  {
    id: 'model_portfolio_section',
    title: 'Model Portfolios Preview',
    description: 'Preview your model portfolios with performance metrics, gains, and CAGR data. These are professionally managed investment strategies tailored for different risk profiles.',
    route: '/dashboard',
    selector: 'Model Portfolio',
    position: 'right',
    category: 'features',
    waitForElement: true
  },

  // Sidebar Navigation
  {
    id: 'sidebar_navigation',
    title: 'Navigation Sidebar',
    description: 'Access all platform features from this sidebar. Navigate between Dashboard, RangaOne Wealth recommendations, Model Portfolios, Investment Calculator, and educational resources.',
    route: '/dashboard',
    selector: 'sidebar',
    position: 'right',
    category: 'navigation'
  },

  // User Menu
  {
    id: 'user_menu',
    title: 'User Account Menu',
    description: 'Click on your avatar to open the user menu and explore account options.',
    route: '/dashboard',
    selector: 'user menu',
    position: 'left',
    category: 'navigation',
    requireInteraction: true,
    interactionSelector: '.h-8.w-8.rounded-xl, button:has(.h-8.w-8.rounded-xl), .user-avatar, button[aria-label*="user" i], img[alt*="avatar" i]',
    interactionType: 'click',
    interactionMessage: 'Click on your avatar to open the menu'
  },

  // RangaOne Wealth
  {
    id: 'rangaone_wealth',
    title: 'RangaOne Wealth - Stock Recommendations',
    description: 'Discover our premium stock recommendations with detailed analysis. View open recommendations for current opportunities and closed ones for performance history.',
    route: '/rangaone-wealth',
    selector: 'main',
    position: 'center',
    category: 'features',
    highlightColor: 'indigo'
  },

  {
    id: 'open_recommendations',
    title: 'Open Recommendations',
    description: 'Active stock recommendations with buy/sell signals, target prices, and analyst confidence ratings. Filter between Basic and Premium recommendations based on your subscription.',
    route: '/rangaone-wealth',
    selector: 'Open Recommendations',
    position: 'bottom',
    category: 'features',
    waitForElement: true
  },

  {
    id: 'closed_recommendations',
    title: 'Closed Recommendations',
    description: 'Historical recommendations showing the performance of our past calls. Learn from successful trades and track our recommendation accuracy over time.',
    route: '/rangaone-wealth',
    selector: 'Closed Recommendations',
    position: 'top',
    category: 'features',
    waitForElement: true
  },

  // Model Portfolios Page
  {
    id: 'model_portfolios_page',
    title: 'Model Portfolios - Complete View',
    description: 'Explore our expertly crafted investment portfolios. Each portfolio shows performance metrics, minimum investment, and subscription requirements for access.',
    route: '/model-portfolios',
    selector: 'main',
    position: 'center',
    category: 'features',
    highlightColor: 'green'
  },

  {
    id: 'portfolio_cards',
    title: 'Portfolio Performance Cards',
    description: 'Each card shows detailed performance metrics including monthly gains, 1-year gains, CAGR since inception, and minimum investment requirements. Subscribe to unlock full details.',
    route: '/model-portfolios',
    selector: '.overflow-hidden.relative',
    position: 'left',
    category: 'features',
    waitForElement: true
  },

  // Investment Calculator
  {
    id: 'investment_calculator',
    title: 'Investment Calculator Tool',
    description: 'Calculate potential returns on your investments. Use this tool to plan your investment strategy and understand how different amounts and timeframes affect your portfolio growth.',
    route: '/investment-calculator',
    selector: 'main',
    position: 'center',
    category: 'tools',
    highlightColor: 'purple'
  },

  // Settings Page
  {
    id: 'settings_page',
    title: 'Account Settings',
    description: 'Manage all your account preferences, portfolio settings, subscription details, and payment information from this centralized settings panel.',
    route: '/settings',
    selector: 'main',
    position: 'center',
    category: 'settings',
    highlightColor: 'orange'
  },

  {
    id: 'settings_tabs',
    title: 'Settings Categories',
    description: 'Try clicking on different tabs to explore various settings. Click on any tab to see how the settings are organized.',
    route: '/settings',
    selector: '[role="tablist"]',
    position: 'bottom',
    category: 'settings',
    waitForElement: true,
    requireInteraction: true,
    interactionSelector: '[role="tab"]:not([aria-selected="true"]), .tab:not(.active), button:not(.active)',
    interactionType: 'click',
    interactionMessage: 'Click on any settings tab to continue'
  },

  // Videos For You
  {
    id: 'videos_page',
    title: 'Educational Videos',
    description: 'Access educational content and market insights from our portfolio experts. Watch tutorials, market analysis, and investment strategies to enhance your knowledge.',
    route: '/videos-for-you',
    selector: 'main',
    position: 'center',
    category: 'features',
    highlightColor: 'red'
  },

  {
    id: 'video_player',
    title: 'Video Learning Center',
    description: 'Featured video player with curated educational content. Learn from our experts about portfolio management, market trends, and investment strategies.',
    route: '/videos-for-you',
    selector: 'iframe',
    position: 'bottom',
    category: 'features',
    waitForElement: true
  },

  // Contact Support
  {
    id: 'contact_support',
    title: 'Contact Support',
    description: 'Get help when you need it. Our support team is ready to assist you with any questions about investments, platform features, or account management.',
    route: '/contact-us',
    selector: 'main',
    position: 'center',
    category: 'features',
    highlightColor: 'teal'
  },

  // Tour Complete
  {
    id: 'tour_complete',
    title: 'Tour Complete! 🎊',
    description: 'Congratulations! You\'ve explored all the key features of RangaOne Finance. You\'re now ready to make informed investment decisions with our comprehensive platform.',
    route: '/dashboard',
    selector: 'body',
    position: 'center',
    category: 'overview',
    customContent: (
      <div className="text-center py-4">
        <div className="text-6xl mb-4">🚀</div>
        <p className="text-lg text-gray-600 mb-4">Start your investment journey with confidence!</p>
        <div className="flex flex-wrap gap-2 justify-center">
          <Badge variant="secondary">Market Analysis</Badge>
          <Badge variant="secondary">Expert Recommendations</Badge>
          <Badge variant="secondary">Portfolio Management</Badge>
          <Badge variant="secondary">Educational Content</Badge>
        </div>
      </div>
    )
  }
]

interface DemoTourProps {
  isOpen: boolean
  onClose: () => void
}

// Centralized state management to prevent race conditions
interface TourState {
  currentStep: number
  highlightedElement: HTMLElement | null
  tooltipPosition: { top: number; left: number }
  isNavigating: boolean
  isTransitioning: boolean
  interactionCompleted: boolean
  navigationError: string | null
  retryCount: number
  isReady: boolean
  interactionElementFound: boolean
}

const initialTourState: TourState = {
  currentStep: 0,
  highlightedElement: null,
  tooltipPosition: { top: 0, left: 0 },
  isNavigating: false,
  isTransitioning: false,
  interactionCompleted: false,
  navigationError: null,
  retryCount: 0,
  isReady: false,
  interactionElementFound: false
}

export function DemoTour({ isOpen, onClose }: DemoTourProps) {
  const [tourState, setTourState] = useState<TourState>(initialTourState)
  const interactionCleanupRef = useRef<(() => void) | null>(null)
  const navigationTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const elementSearchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const router = useRouter()
  const pathname = usePathname()
  const maxRetries = 3

  const currentStepData = tourSteps[tourState.currentStep]

  // Centralized state updater to prevent race conditions
  const updateTourState = useCallback((updates: Partial<TourState>) => {
    setTourState(prev => ({ ...prev, ...updates }))
  }, [])

  // Enhanced element finder with better reliability
  const findElement = useCallback((selector: string): HTMLElement | null => {
    try {
      // First try exact selector
      let element = document.querySelector(selector) as HTMLElement
      if (element && element.offsetParent !== null) {
        return element
      }

      // Text-based searches with improved reliability
      const textSearches: { [key: string]: () => HTMLElement | null } = {
        'Market Indices': () => {
          const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'))
          const heading = headings.find(el => 
            el.textContent?.toLowerCase().includes('market indices') ||
            el.textContent?.toLowerCase().includes('market index')
          )
          if (heading) {
            // Find the closest container with meaningful content
            const container = heading.closest('div[class*="bg-"], section, .card, .border, [class*="shadow"]') as HTMLElement
            return container || heading.parentElement as HTMLElement
          }
          return null
        },
        
        'Expert Recommendations': () => {
          const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'))
          const heading = headings.find(el => 
            el.textContent?.toLowerCase().includes('expert recommendations') ||
            el.textContent?.toLowerCase().includes('expert recommendation')
          )
          if (heading) {
            const container = heading.closest('div[class*="bg-"], section, .card, .border, [class*="shadow"]') as HTMLElement
            return container || heading.parentElement as HTMLElement
          }
          return null
        },
        
        'Model Portfolio': () => {
          const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'))
          const heading = headings.find(el => 
            el.textContent?.toLowerCase().includes('model portfolio') ||
            el.textContent?.toLowerCase().includes('model portfolios')
          )
          if (heading) {
            const container = heading.closest('div[class*="bg-"], section, .card, .border, [class*="shadow"]') as HTMLElement
            return container || heading.parentElement as HTMLElement
          }
          return null
        },

        'Open Recommendations': () => {
          const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'))
          const heading = headings.find(el => 
            el.textContent?.toLowerCase().includes('open recommendations') ||
            el.textContent?.toLowerCase().includes('open recommendation')
          )
          if (heading) {
            const container = heading.closest('div[class*="bg-"], section, .card, .border, [class*="shadow"]') as HTMLElement
            return container || heading.parentElement as HTMLElement
          }
          return null
        },

        'Closed Recommendations': () => {
          const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'))
          const heading = headings.find(el => 
            el.textContent?.toLowerCase().includes('closed recommendations') ||
            el.textContent?.toLowerCase().includes('closed recommendation')
          )
          if (heading) {
            const container = heading.closest('div[class*="bg-"], section, .card, .border, [class*="shadow"]') as HTMLElement
            return container || heading.parentElement as HTMLElement
          }
          return null
        },

        'sidebar': () => {
          const candidates = [
            'nav',
            'aside', 
            '[class*="sidebar" i]',
            '.flex.h-screen > div:first-child',
            '[role="navigation"]',
            'div[class*="nav"]'
          ]
          
          for (const candidate of candidates) {
            const el = document.querySelector(candidate) as HTMLElement
            if (el && el.offsetParent !== null) return el
          }
          return null
        },

        'user menu': () => {
          const candidates = [
            '.h-8.w-8.rounded-xl',
            'button:has(.h-8.w-8.rounded-xl)',
            '.user-avatar',
            'button[aria-label*="user" i]',
            'img[alt*="avatar" i]',
            '[data-testid*="user"]',
            '.profile-button'
          ]
          
          for (const candidate of candidates) {
            const el = document.querySelector(candidate) as HTMLElement
            if (el && el.offsetParent !== null) {
              return el.closest('.relative, button, div') as HTMLElement || el
            }
          }
          return null
        },

        'search': () => {
          const candidates = [
            'input[type="search"]',
            'input[placeholder*="search" i]',
            '.search-input',
            '[data-testid="search"]',
            'button[aria-label*="search" i]',
            '.relative.flex-1',
            '[class*="search"]'
          ]
          
          for (const candidate of candidates) {
            const el = document.querySelector(candidate) as HTMLElement
            if (el && el.offsetParent !== null) {
              return el.closest('.relative, .flex-1, div') as HTMLElement || el
            }
          }
          return null
        }
      }

      // Try text-based searches
      for (const [searchTerm, searchFn] of Object.entries(textSearches)) {
        if (selector.toLowerCase().includes(searchTerm.toLowerCase())) {
          const foundElement = searchFn()
          if (foundElement && foundElement.offsetParent !== null) {
            return foundElement
          }
        }
      }

      // Generic fallbacks with better detection
      if (selector === 'main') {
        const candidates = ['main', '[role="main"]', '.main-content', 'div[class*="main"]']
        for (const candidate of candidates) {
          const el = document.querySelector(candidate) as HTMLElement
          if (el && el.offsetParent !== null) return el
        }
      } else if (selector === 'iframe') {
        const candidates = ['iframe[src*="youtube"]', 'iframe[src*="vimeo"]', 'iframe']
        for (const candidate of candidates) {
          const el = document.querySelector(candidate) as HTMLElement
          if (el && el.offsetParent !== null) return el
        }
      } else if (selector.includes('tablist')) {
        const candidates = ['[role="tablist"]', '.tabs', '.tab-list', '[class*="tab"]']
        for (const candidate of candidates) {
          const el = document.querySelector(candidate) as HTMLElement
          if (el && el.offsetParent !== null) return el
        }
      }

      return null
    } catch (error) {
      console.warn('Element search error:', error)
      return null
    }
  }, [])

  // Improved position calculation with better viewport handling
  const calculatePosition = useCallback((element: HTMLElement | null, position: string) => {
    const tooltipWidth = 420
    const tooltipHeight = 350
    const offset = 25
    const margin = 20
    
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const scrollX = window.pageXOffset
    const scrollY = window.pageYOffset

    let top = 0
    let left = 0

    if (!element || position === 'center') {
      // Center positioning with better viewport handling
      top = scrollY + Math.max(margin, (viewportHeight / 2) - (tooltipHeight / 2))
      left = scrollX + Math.max(margin, (viewportWidth / 2) - (tooltipWidth / 2))
      
      // Ensure it doesn't go off screen
      if (left + tooltipWidth > scrollX + viewportWidth - margin) {
        left = scrollX + viewportWidth - tooltipWidth - margin
      }
      if (top + tooltipHeight > scrollY + viewportHeight - margin) {
        top = scrollY + viewportHeight - tooltipHeight - margin
      }
    } else {
      const rect = element.getBoundingClientRect()
      const elementTop = rect.top + scrollY
      const elementLeft = rect.left + scrollX
      const elementBottom = rect.bottom + scrollY
      const elementRight = rect.right + scrollX
      const elementCenterX = elementLeft + (rect.width / 2)
      const elementCenterY = elementTop + (rect.height / 2)

      switch (position) {
        case 'top':
          top = elementTop - tooltipHeight - offset
          left = elementCenterX - (tooltipWidth / 2)
          // If tooltip goes off top, switch to bottom
          if (top < scrollY + margin) {
            top = elementBottom + offset
          }
          break
        case 'bottom':
          top = elementBottom + offset
          left = elementCenterX - (tooltipWidth / 2)
          // If tooltip goes off bottom, switch to top
          if (top + tooltipHeight > scrollY + viewportHeight - margin) {
            top = elementTop - tooltipHeight - offset
          }
          break
        case 'left':
          top = elementCenterY - (tooltipHeight / 2)
          left = elementLeft - tooltipWidth - offset
          // If tooltip goes off left, switch to right
          if (left < scrollX + margin) {
            left = elementRight + offset
          }
          break
        case 'right':
          top = elementCenterY - (tooltipHeight / 2)
          left = elementRight + offset
          // If tooltip goes off right, switch to left
          if (left + tooltipWidth > scrollX + viewportWidth - margin) {
            left = elementLeft - tooltipWidth - offset
          }
          break
      }

      // Final boundary checks
      left = Math.max(scrollX + margin, Math.min(left, scrollX + viewportWidth - tooltipWidth - margin))
      top = Math.max(scrollY + margin, Math.min(top, scrollY + viewportHeight - tooltipHeight - margin))
    }

    return { top, left }
  }, [])

  // Improved navigation with better error handling and timing
  const navigateToRoute = useCallback(async (route: string): Promise<boolean> => {
    try {
      updateTourState({ navigationError: null, isNavigating: true })
      
      // Clear any existing navigation timeout
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current)
      }
      
      // Navigate using Next.js router
      await router.push(route)
      
      // Wait for route change with timeout
      const navigationPromise = new Promise<boolean>((resolve) => {
        let attempts = 0
        const maxWaitAttempts = 30 // 15 seconds max
        
        const checkNavigation = () => {
          if (window.location.pathname === route) {
            resolve(true)
          } else if (attempts < maxWaitAttempts) {
            attempts++
            setTimeout(checkNavigation, 500)
          } else {
            resolve(false)
          }
        }
        
        checkNavigation()
      })
      
      const navigationSuccess = await navigationPromise
      
      if (!navigationSuccess) {
        throw new Error(`Navigation to ${route} timed out`)
      }
      
      // Wait for DOM to stabilize with improved detection
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Wait for React hydration and components to mount
      let domStable = false
      let stabilityAttempts = 0
      const maxStabilityAttempts = 8
      
      while (!domStable && stabilityAttempts < maxStabilityAttempts) {
        const initialCount = document.querySelectorAll('*').length
        await new Promise(resolve => setTimeout(resolve, 400))
        const finalCount = document.querySelectorAll('*').length
        
        // DOM is stable if element count hasn't changed significantly
        domStable = Math.abs(initialCount - finalCount) <= 2
        stabilityAttempts++
      }
      
      // Additional wait for any async components
      await new Promise(resolve => setTimeout(resolve, 800))
      
      return true
    } catch (error) {
      console.error('Navigation error:', error)
      updateTourState({ 
        navigationError: error instanceof Error ? error.message : 'Navigation failed' 
      })
      return false
    } finally {
      updateTourState({ isNavigating: false })
    }
  }, [router, updateTourState])

  // Improved interaction detection with better cleanup
  const setupInteractionDetection = useCallback((stepData: TourStep) => {
    if (!stepData.requireInteraction || !stepData.interactionSelector) {
      updateTourState({ interactionElementFound: true })
      return
    }

    // Clean up any existing listener
    if (interactionCleanupRef.current) {
      interactionCleanupRef.current()
      interactionCleanupRef.current = null
    }

    const handleInteraction = (event: Event) => {
      event.preventDefault()
      event.stopPropagation()
      
      // Set completion state immediately
      updateTourState({ interactionCompleted: true })
      
      // Cleanup listener after a short delay
      setTimeout(() => {
        if (interactionCleanupRef.current) {
          interactionCleanupRef.current()
          interactionCleanupRef.current = null
        }
      }, 100)
    }

    // Enhanced element finding with comprehensive fallbacks
    const findInteractionElement = (): HTMLElement | null => {
      const selectors = stepData.interactionSelector!.split(',').map(s => s.trim())
      
      // Try each selector
      for (const selector of selectors) {
        const element = document.querySelector(selector) as HTMLElement
        if (element && element.offsetParent !== null) {
          return element
        }
      }
      
      // Comprehensive fallback searches based on step ID
      const fallbackSearches: { [key: string]: string[] } = {
        'global_search': [
          'input[type="search"]',
          'input[placeholder*="search" i]',
          '[data-testid="search"]',
          '.search-input',
          'input[name*="search" i]',
          '[aria-label*="search" i]',
          '.search-box input',
          '.search-field',
          'input[class*="search"]'
        ],
        'user_menu': [
          'button:has(img[alt*="avatar" i])',
          '.user-avatar',
          '[data-testid="user-menu"]',
          'button[aria-label*="user" i]',
          '.profile-button',
          '.user-menu-trigger',
          'img[alt*="profile" i]',
          'button:has(.rounded-xl)'
        ],
        'settings_tabs': [
          '[role="tab"]:not([aria-selected="true"])',
          '.tab:not(.active)',
          'button[data-tab]:not(.active)',
          '.tab-button:not(.selected)',
          '[class*="tab"]:not(.active)',
          'button:not([aria-selected="true"])'
        ]
      }
      
      const fallbacks = fallbackSearches[stepData.id] || []
      for (const fallback of fallbacks) {
        const el = document.querySelector(fallback) as HTMLElement
        if (el && el.offsetParent !== null) return el
      }
      
      return null
    }

    // Retry mechanism with progressive delays
    let attempts = 0
    const maxAttempts = 10
    
    const trySetupInteraction = (): boolean => {
      const interactionElement = findInteractionElement()
      
      if (interactionElement) {
        updateTourState({ interactionElementFound: true })
        
        const eventType = stepData.interactionType || 'click'
        
        // Add event listener with proper options
        interactionElement.addEventListener(eventType, handleInteraction, { 
          once: true,
          passive: false,
          capture: true
        })
        
        // Store cleanup function
        interactionCleanupRef.current = () => {
          interactionElement.removeEventListener(eventType, handleInteraction, { capture: true })
        }
        
        return true
      }
      
      return false
    }
    
    // Initial attempt
    if (!trySetupInteraction()) {
      // Retry with progressive delays
      const retrySetup = () => {
        if (elementSearchTimeoutRef.current) {
          clearTimeout(elementSearchTimeoutRef.current)
        }
        
        elementSearchTimeoutRef.current = setTimeout(() => {
          attempts++
          const success = trySetupInteraction()
          
          if (!success && attempts < maxAttempts) {
            retrySetup()
          } else if (!success) {
            // Fallback: mark as found but not completed to prevent blocking
            updateTourState({ interactionElementFound: true })
          }
        }, 400 + (attempts * 300))
      }
      
      retrySetup()
    }
  }, [updateTourState])

  // Main step highlighting function with improved state management
  const highlightElement = useCallback(async (stepData: TourStep) => {
    try {
      // Prevent overlapping transitions
      if (tourState.isTransitioning) return
      
      updateTourState({ 
        isTransitioning: true,
        navigationError: null,
        interactionCompleted: false,
        interactionElementFound: false,
        isReady: false
      })
      
      // Clear existing highlights smoothly
      updateTourState({ highlightedElement: null })
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // Handle navigation if needed
      if (stepData.route && pathname !== stepData.route) {
        const centerPosition = calculatePosition(null, 'center')
        updateTourState({ tooltipPosition: centerPosition })
        
        let navigationSuccess = false
        let currentRetry = 0
        
        while (!navigationSuccess && currentRetry < maxRetries) {
          navigationSuccess = await navigateToRoute(stepData.route)
          
          if (!navigationSuccess) {
            currentRetry++
            updateTourState({ retryCount: currentRetry })
            
            if (currentRetry < maxRetries) {
              await new Promise(resolve => setTimeout(resolve, 2000))
            }
          }
        }
        
        if (!navigationSuccess) {
          throw new Error(`Failed to navigate to ${stepData.route} after ${maxRetries} attempts`)
        }
      }

      // Enhanced element finding with better retry logic
      let element: HTMLElement | null = null
      let attempts = 0
      const maxAttempts = stepData.waitForElement ? 15 : 8
      
      while (!element && attempts < maxAttempts) {
        element = findElement(stepData.selector)
        
        if (!element) {
          const delay = Math.min(500 + (attempts * 200), 1500)
          await new Promise(resolve => setTimeout(resolve, delay))
          attempts++
          
          // Force reflow every few attempts
          if (attempts % 3 === 0) {
            document.body.offsetHeight
            await new Promise(resolve => setTimeout(resolve, 200))
          }
        }
      }
      
      if (element) {
        // Ensure element is visible in viewport
        const rect = element.getBoundingClientRect()
        const isInViewport = rect.top >= 0 && 
                           rect.bottom <= window.innerHeight &&
                           rect.left >= 0 && 
                           rect.right <= window.innerWidth
        
        if (!isInViewport) {
          element.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center',
            inline: 'center'
          })
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
        
        // Calculate position and setup interaction
        const position = calculatePosition(element, stepData.position)
        updateTourState({ tooltipPosition: position })
        
        // Setup interaction detection
        await new Promise(resolve => setTimeout(resolve, 300))
        setupInteractionDetection(stepData)
        
        // Wait for interaction setup
        await new Promise(resolve => setTimeout(resolve, 400))
        
        // Finally set the highlighted element
        updateTourState({ 
          highlightedElement: element,
          retryCount: 0,
          isReady: true,
          isTransitioning: false
        })
        
      } else {
        console.warn(`Element not found for step ${stepData.id}`)
        const centerPosition = calculatePosition(null, 'center')
        updateTourState({ 
          tooltipPosition: centerPosition,
          isReady: true,
          isTransitioning: false
        })
        setupInteractionDetection(stepData)
      }
      
    } catch (error) {
      console.error('Error in highlightElement:', error)
      updateTourState({ 
        navigationError: error instanceof Error ? error.message : 'Unknown error occurred',
        isTransitioning: false,
        isReady: true
      })
      
      const centerPosition = calculatePosition(null, 'center')
      updateTourState({ tooltipPosition: centerPosition })
    }
  }, [findElement, calculatePosition, pathname, setupInteractionDetection, navigateToRoute, maxRetries, tourState.isTransitioning, updateTourState])

  // Navigation functions with improved state management
  const nextStep = useCallback(() => {
    if (tourState.isTransitioning || tourState.isNavigating) return
    
    // Check if interaction is required and not completed
    if (currentStepData.requireInteraction && !tourState.interactionCompleted) {
      return
    }
    
    // Clean up current interaction listener
    if (interactionCleanupRef.current) {
      interactionCleanupRef.current()
      interactionCleanupRef.current = null
    }
    
    // Reset states for next step
    const nextStepIndex = tourState.currentStep + 1
    
    if (nextStepIndex < tourSteps.length) {
      updateTourState({
        currentStep: nextStepIndex,
        interactionCompleted: false,
        interactionElementFound: false,
        navigationError: null,
        retryCount: 0,
        isReady: false
      })
    } else {
      onClose()
    }
  }, [tourState.currentStep, tourState.isTransitioning, tourState.isNavigating, tourState.interactionCompleted, currentStepData, onClose, updateTourState])

  const previousStep = useCallback(() => {
    if (tourState.isTransitioning || tourState.isNavigating || tourState.currentStep === 0) return
    
    // Clean up current interaction listener
    if (interactionCleanupRef.current) {
      interactionCleanupRef.current()
      interactionCleanupRef.current = null
    }
    
    // Reset states for previous step
    updateTourState({
      currentStep: tourState.currentStep - 1,
      interactionCompleted: false,
      interactionElementFound: false,
      navigationError: null,
      retryCount: 0,
      isReady: false
    })
  }, [tourState.currentStep, tourState.isTransitioning, tourState.isNavigating, updateTourState])

  const skipTour = useCallback(() => {
    // Clean up any active listeners and timeouts
    if (interactionCleanupRef.current) {
      interactionCleanupRef.current()
      interactionCleanupRef.current = null
    }
    
    if (navigationTimeoutRef.current) {
      clearTimeout(navigationTimeoutRef.current)
      navigationTimeoutRef.current = null
    }
    
    if (elementSearchTimeoutRef.current) {
      clearTimeout(elementSearchTimeoutRef.current)
      elementSearchTimeoutRef.current = null
    }
    
    // Reset all states
    setTourState(initialTourState)
    onClose()
  }, [onClose])

  // Main effect to handle step changes
  useEffect(() => {
    if (isOpen && currentStepData && !tourState.isTransitioning) {
      highlightElement(currentStepData)
    }
  }, [isOpen, tourState.currentStep, currentStepData, highlightElement, tourState.isTransitioning])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (interactionCleanupRef.current) {
        interactionCleanupRef.current()
      }
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current)
      }
      if (elementSearchTimeoutRef.current) {
        clearTimeout(elementSearchTimeoutRef.current)
      }
    }
  }, [])

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return
      
      if (e.key === 'Escape') {
        skipTour()
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
  }, [isOpen, nextStep, previousStep, skipTour])

  if (!isOpen) return null

  const Overlay = () => {
    const highlightColor = currentStepData.highlightColor || 'blue'
    const highlightRect = tourState.highlightedElement ? {
      top: tourState.highlightedElement.getBoundingClientRect().top + window.pageYOffset,
      left: tourState.highlightedElement.getBoundingClientRect().left + window.pageXOffset,
      width: tourState.highlightedElement.offsetWidth,
      height: tourState.highlightedElement.offsetHeight
    } : null

    const isInteractionRequired = currentStepData.requireInteraction && !tourState.interactionCompleted
    const canProceed = !isInteractionRequired && 
                      !tourState.isNavigating && 
                      !tourState.isTransitioning && 
                      !tourState.navigationError &&
                      tourState.isReady

    return (
      <div className="fixed inset-0 z-[9999] pointer-events-none">
        {/* Improved spotlight overlay */}
        <div 
          className="absolute inset-0 bg-black transition-all duration-500 ease-out"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            mask: tourState.highlightedElement && highlightRect && !tourState.isTransitioning
              ? `radial-gradient(ellipse ${highlightRect.width/2 + 50}px ${highlightRect.height/2 + 50}px at ${highlightRect.left + highlightRect.width/2}px ${highlightRect.top + highlightRect.height/2}px, transparent 20%, transparent 50%, black 75%)`
              : 'none',
            WebkitMask: tourState.highlightedElement && highlightRect && !tourState.isTransitioning
              ? `radial-gradient(ellipse ${highlightRect.width/2 + 50}px ${highlightRect.height/2 + 50}px at ${highlightRect.left + highlightRect.width/2}px ${highlightRect.top + highlightRect.height/2}px, transparent 20%, transparent 50%, black 75%)`
              : 'none'
          }}
        />
        
        {/* Enhanced highlight border */}
        {tourState.highlightedElement && highlightRect && !tourState.isTransitioning && (
          <div
            className="absolute pointer-events-none transition-all duration-500 ease-out"
            style={{
              top: highlightRect.top - 12,
              left: highlightRect.left - 12,
              width: highlightRect.width + 24,
              height: highlightRect.height + 24,
              border: `4px solid ${
                highlightColor === 'blue' ? '#3B82F6' :
                highlightColor === 'green' ? '#10B981' :
                highlightColor === 'purple' ? '#8B5CF6' :
                highlightColor === 'orange' ? '#F59E0B' :
                highlightColor === 'red' ? '#EF4444' :
                highlightColor === 'indigo' ? '#6366F1' :
                highlightColor === 'teal' ? '#14B8A6' :
                '#3B82F6'
              }`,
              borderRadius: '16px',
              background: 'transparent',
              boxShadow: `
                0 0 0 3px rgba(255,255,255,0.95),
                0 0 30px ${
                  highlightColor === 'blue' ? 'rgba(59, 130, 246, 0.6)' :
                  highlightColor === 'green' ? 'rgba(16, 185, 129, 0.6)' :
                  highlightColor === 'purple' ? 'rgba(139, 92, 246, 0.6)' :
                  highlightColor === 'orange' ? 'rgba(245, 158, 11, 0.6)' :
                  highlightColor === 'red' ? 'rgba(239, 68, 68, 0.6)' :
                  highlightColor === 'indigo' ? 'rgba(99, 102, 241, 0.6)' :
                  highlightColor === 'teal' ? 'rgba(20, 184, 166, 0.6)' :
                  'rgba(59, 130, 246, 0.6)'
                },
                0 8px 32px rgba(0,0,0,0.15)
              `,
              animation: isInteractionRequired 
                ? 'tourPulseInteraction 2s ease-in-out infinite' 
                : 'tourPulseNormal 3s ease-in-out infinite'
            }}
          />
        )}

        {/* Enhanced tooltip */}
        <Card
          className={cn(
            "absolute pointer-events-auto transition-all duration-500 ease-out transform-gpu",
            tourState.isTransitioning 
              ? "opacity-0 scale-90 translate-y-8 blur-sm" 
              : "opacity-100 scale-100 translate-y-0 blur-none"
          )}
          style={{
            top: tourState.tooltipPosition.top,
            left: tourState.tooltipPosition.left,
            width: '420px',
            maxWidth: 'calc(100vw - 32px)',
            borderRadius: '20px',
            boxShadow: '0 20px 40px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(12px)',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.95) 100%)'
          }}
        >
          <CardContent className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-5">
              <div className="flex items-center gap-3">
                <Badge 
                  className={cn(
                    "text-xs font-bold px-3 py-2 border-0 text-white shadow-lg",
                    currentStepData.category === 'overview' && "bg-gradient-to-r from-blue-600 to-blue-700",
                    currentStepData.category === 'navigation' && "bg-gradient-to-r from-green-600 to-green-700", 
                    currentStepData.category === 'features' && "bg-gradient-to-r from-purple-600 to-purple-700",
                    currentStepData.category === 'tools' && "bg-gradient-to-r from-orange-600 to-orange-700",
                    currentStepData.category === 'settings' && "bg-gradient-to-r from-gray-700 to-gray-800"
                  )}
                >
                  Step {tourState.currentStep + 1} of {tourSteps.length}
                </Badge>
                <Badge variant="outline" className="text-xs font-medium px-2 py-1 capitalize border-2">
                  {currentStepData.category}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={skipTour}
                className="p-2 h-8 w-8 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Content */}
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-3 leading-tight">
                  {currentStepData.title}
                </h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {currentStepData.description}
                </p>
              </div>

              {/* Interaction requirement indicator */}
              {isInteractionRequired && (
                <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-200 p-4 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="animate-bounce">
                      <div className="w-3 h-3 bg-amber-400 rounded-full animate-pulse"></div>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-amber-800 mb-1">
                        Interaction Required
                      </p>
                      <p className="text-xs text-amber-700">
                        {currentStepData.interactionMessage || 'Please interact with the highlighted element to continue'}
                      </p>
                      {!tourState.interactionElementFound && (
                        <p className="text-xs text-amber-600 mt-1 italic">
                          Searching for interactive element...
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {currentStepData.customContent && (
                <div className="border-t pt-4">
                  {currentStepData.customContent}
                </div>
              )}

              {/* Navigation status */}
              {tourState.isNavigating && (
                <div className="flex items-center gap-3 text-sm text-blue-700 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-2xl border-2 border-blue-200">
                  <div className="animate-spin h-5 w-5 border-3 border-blue-600 border-t-transparent rounded-full" />
                  <div>
                    <span className="font-medium">Loading {currentStepData.route?.replace('/', '')}...</span>
                    {tourState.retryCount > 0 && (
                      <p className="text-xs text-blue-600 mt-1">Retry attempt {tourState.retryCount}/{maxRetries}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Navigation error */}
              {tourState.navigationError && (
                <div className="flex items-center gap-3 text-sm text-red-700 bg-gradient-to-r from-red-50 to-pink-50 p-4 rounded-2xl border-2 border-red-200">
                  <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">!</span>
                  </div>
                  <div>
                    <p className="font-medium">Navigation Error</p>
                    <p className="text-xs text-red-600 mt-1">{tourState.navigationError}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between mt-6 pt-5 border-t-2 border-gray-100">
              <Button
                variant="outline"
                size="sm"
                onClick={previousStep}
                disabled={tourState.currentStep === 0 || tourState.isNavigating || tourState.isTransitioning}
                className="flex items-center gap-2 px-4 py-2 font-medium disabled:opacity-50 transition-all duration-200 hover:scale-105"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>

              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={skipTour}
                  disabled={tourState.isNavigating || tourState.isTransitioning}
                  className="text-gray-500 hover:text-gray-700 px-3 py-2 disabled:opacity-50 transition-all duration-200"
                >
                  Skip Tour
                </Button>
                
                <Button
                  onClick={nextStep}
                  size="sm"
                  disabled={!canProceed}
                  className={cn(
                    "flex items-center gap-2 px-5 py-2 font-medium transition-all duration-300 rounded-xl shadow-lg hover:shadow-xl",
                    canProceed 
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white hover:scale-105" 
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  )}
                >
                  {tourState.currentStep === tourSteps.length - 1 ? (
                    <>
                      Complete Tour
                      <Play className="h-4 w-4" />
                    </>
                  ) : (
                    <>
                      Continue
                      <ChevronRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-5">
              <div className="flex justify-between text-xs text-gray-600 mb-2 font-medium">
                <span>Tour Progress</span>
                <span>{Math.round(((tourState.currentStep + 1) / tourSteps.length) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
                <div
                  className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 h-3 rounded-full transition-all duration-700 ease-out shadow-lg"
                  style={{ 
                    width: `${((tourState.currentStep + 1) / tourSteps.length) * 100}%`,
                    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1), 0 0 8px rgba(59, 130, 246, 0.3)'
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CSS animations */}
        <style jsx>{`
          @keyframes tourPulseNormal {
            0%, 100% { 
              opacity: 1; 
              transform: scale(1);
            }
            50% { 
              opacity: 0.95; 
              transform: scale(1.01);
            }
          }
          @keyframes tourPulseInteraction {
            0%, 100% { 
              opacity: 1; 
              transform: scale(1);
              filter: brightness(1.1);
            }
            25% {
              opacity: 0.9;
              transform: scale(1.03);
              filter: brightness(1.3);
            }
            50% { 
              opacity: 0.85; 
              transform: scale(1.05);
              filter: brightness(1.5);
            }
            75% {
              opacity: 0.9;
              transform: scale(1.03);
              filter: brightness(1.3);
            }
          }
        `}</style>
      </div>
    )
  }

  return createPortal(<Overlay />, document.body)
}

export default DemoTour
