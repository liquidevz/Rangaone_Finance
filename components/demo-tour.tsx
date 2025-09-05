"use client"

import React, { useState, useEffect, useCallback } from 'react'
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
    description: 'Quickly find stocks, portfolios, recommendations, and any information across our platform. Our intelligent search helps you discover investment opportunities.',
    route: '/dashboard',
    selector: 'search',
    position: 'bottom',
    category: 'tools'
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
    description: 'Manage your account, access settings, and logout from here. Click on your avatar to see account options including profile settings and subscription management.',
    route: '/dashboard',
    selector: 'user menu',
    position: 'left',
    category: 'navigation'
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
    description: 'Navigate through different settings categories: Profile (personal info), Portfolios (investment preferences), Subscriptions (plan management), and Payments (billing history).',
    route: '/settings',
    selector: '[role="tablist"]',
    position: 'bottom',
    category: 'settings',
    waitForElement: true
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

export function DemoTour({ isOpen, onClose }: DemoTourProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 })
  const [isNavigating, setIsNavigating] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  const currentStepData = tourSteps[currentStep]

  const findElement = useCallback((selector: string): HTMLElement | null => {
    try {
      // First try exact selector
      let element = document.querySelector(selector) as HTMLElement
      
      if (!element) {
        // Try simplified selectors
        const alternatives = [
          selector.replace(/\\\:/g, ':'), // Fix escaped colons
          selector.replace(/\\/g, ''), // Remove all escapes
          selector.split(',')[0].trim(), // Take first if comma-separated
          selector.replace(/\:has\([^)]+\)/g, ''), // Remove :has() selectors
          selector.replace(/\:first-child/g, ''), // Remove :first-child
          selector.replace(/\:contains\([^)]+\)/g, ''), // Remove :contains()
        ]
        
        for (const alt of alternatives) {
          if (alt && alt !== selector && alt.trim()) {
            element = document.querySelector(alt) as HTMLElement
            if (element) break
          }
        }
      }

      // Text-based fallbacks for specific elements
      if (!element) {
        if (selector.includes('Market Indices') || selector.includes('market_indices')) {
          element = Array.from(document.querySelectorAll('h2, h3')).find(el => 
            el.textContent?.includes('Market Indices')
          )?.closest('div, section, .bg-white') as HTMLElement
        }
        
        if (selector.includes('Expert Recommendations') || selector.includes('expert_recommendations')) {
          element = Array.from(document.querySelectorAll('h2, h3')).find(el => 
            el.textContent?.includes('Expert Recommendations')
          )?.closest('div, section, .bg-white') as HTMLElement
        }
        
        if (selector.includes('Model Portfolio') || selector.includes('model_portfolio')) {
          element = Array.from(document.querySelectorAll('h2, h3')).find(el => 
            el.textContent?.includes('Model Portfolio')
          )?.closest('div, section, .bg-white') as HTMLElement
        }

        // For RangaOne Wealth page
        if (selector.includes('Open Recommendations')) {
          element = Array.from(document.querySelectorAll('h2, h3')).find(el => 
            el.textContent?.includes('Open Recommendations')
          )?.closest('div, section, .shadow-sm') as HTMLElement
        }

        if (selector.includes('Closed Recommendations')) {
          element = Array.from(document.querySelectorAll('h2, h3')).find(el => 
            el.textContent?.includes('Closed Recommendations')
          )?.closest('div, section, .shadow-sm') as HTMLElement
        }

        // Sidebar and navigation elements
        if (selector.includes('sidebar') || selector.includes('Sidebar')) {
          element = document.querySelector('nav, aside, [class*="sidebar"]') as HTMLElement ||
                   document.querySelector('.flex.h-screen > div:first-child') as HTMLElement
        }

        if (selector.includes('user') && selector.includes('menu')) {
          element = document.querySelector('.h-8.w-8.rounded-xl')?.closest('.relative') as HTMLElement
        }

        // Global search
        if (selector.includes('search') || selector.includes('Search')) {
          element = document.querySelector('input[placeholder*="search" i], .relative.flex-1') as HTMLElement
        }
      }

      return element
    } catch (error) {
      console.warn('Error finding element:', error)
      return null
    }
  }, [])

  const calculatePosition = useCallback((element: HTMLElement | null, position: string) => {
    const tooltipWidth = 400
    const tooltipHeight = 320
    const offset = 25
    const margin = 15
    
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const scrollX = window.pageXOffset
    const scrollY = window.pageYOffset

    let top = 0
    let left = 0

    if (!element || position === 'center') {
      // Center positioning - always safe
      top = scrollY + (viewportHeight / 2) - (tooltipHeight / 2)
      left = scrollX + (viewportWidth / 2) - (tooltipWidth / 2)
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
    }

    // Final boundary checks with smart repositioning
    if (left < scrollX + margin) {
      left = scrollX + margin
    } else if (left + tooltipWidth > scrollX + viewportWidth - margin) {
      left = scrollX + viewportWidth - tooltipWidth - margin
    }

    if (top < scrollY + margin) {
      top = scrollY + margin
    } else if (top + tooltipHeight > scrollY + viewportHeight - margin) {
      top = scrollY + viewportHeight - tooltipHeight - margin
    }

    return { 
      top: Math.max(scrollY + margin, top), 
      left: Math.max(scrollX + margin, left) 
    }
  }, [])

  const highlightElement = useCallback(async (stepData: TourStep) => {
    // Clear previous highlighting immediately
    setHighlightedElement(null)
    
    // Handle navigation if needed
    if (stepData.route && pathname !== stepData.route) {
      setIsNavigating(true)
      
      // Calculate position for center while navigating
      const centerPosition = calculatePosition(null, 'center')
      setTooltipPosition(centerPosition)
      
      router.push(stepData.route)
      
      // Wait for navigation to complete
      await new Promise(resolve => setTimeout(resolve, 1500))
      setIsNavigating(false)
      
      // Additional wait for page to stabilize
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    // Try to find element with retries for better reliability
    let element: HTMLElement | null = null
    let attempts = 0
    const maxAttempts = stepData.waitForElement ? 8 : 3
    
    while (!element && attempts < maxAttempts) {
      element = findElement(stepData.selector)
      if (!element) {
        await new Promise(resolve => setTimeout(resolve, 300))
        attempts++
      }
    }
    
    // Calculate position first, then set element and position together
    const position = calculatePosition(element, stepData.position)
    
    if (element) {
      // Smooth scroll to element
      element.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center',
        inline: 'center'
      })
      
      // Wait for scroll to complete, then set highlighting
      await new Promise(resolve => setTimeout(resolve, 600))
      
      // Double-check element is still there after scroll
      const finalElement = findElement(stepData.selector)
      if (finalElement) {
        setHighlightedElement(finalElement)
        // Recalculate position after scroll
        const finalPosition = calculatePosition(finalElement, stepData.position)
        setTooltipPosition(finalPosition)
      } else {
        setTooltipPosition(position)
      }
    } else {
      // No element found, use center or calculated position
      setTooltipPosition(position)
    }
  }, [findElement, calculatePosition, router, pathname])

  const nextStep = useCallback(() => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      onClose()
    }
  }, [currentStep, onClose])

  const previousStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }, [currentStep])

  const skipTour = useCallback(() => {
    onClose()
  }, [onClose])

  // Highlight current step element
  useEffect(() => {
    if (isOpen && currentStepData) {
      highlightElement(currentStepData)
    }
  }, [isOpen, currentStep, currentStepData, highlightElement])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      setHighlightedElement(null)
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
    const highlightRect = highlightedElement ? {
      top: highlightedElement.getBoundingClientRect().top + window.pageYOffset,
      left: highlightedElement.getBoundingClientRect().left + window.pageXOffset,
      width: highlightedElement.offsetWidth,
      height: highlightedElement.offsetHeight
    } : null

    return (
      <div className="fixed inset-0 z-[9999] pointer-events-none">
        {/* Clean overlay without blur - improved performance */}
        <div className="absolute inset-0 bg-black/60 transition-opacity duration-300" />
        
        {/* Cutout spotlight effect for highlighted element */}
        {highlightedElement && highlightRect && (
          <div
            className="absolute bg-black/60 transition-all duration-300 ease-out"
            style={{
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              clipPath: `polygon(
                0% 0%, 
                0% 100%, 
                ${highlightRect.left - 10}px 100%, 
                ${highlightRect.left - 10}px ${highlightRect.top - 10}px, 
                ${highlightRect.left + highlightRect.width + 10}px ${highlightRect.top - 10}px, 
                ${highlightRect.left + highlightRect.width + 10}px ${highlightRect.top + highlightRect.height + 10}px, 
                ${highlightRect.left - 10}px ${highlightRect.top + highlightRect.height + 10}px, 
                ${highlightRect.left - 10}px 100%, 
                100% 100%, 
                100% 0%
              )`
            }}
          />
        )}
        
        {/* Smooth highlight border */}
        {highlightedElement && highlightRect && (
          <div
            className="absolute transition-all duration-500 ease-out pointer-events-none animate-pulse"
            style={{
              top: highlightRect.top - 6,
              left: highlightRect.left - 6,
              width: highlightRect.width + 12,
              height: highlightRect.height + 12,
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
              boxShadow: `
                0 0 0 2px rgba(255,255,255,0.9),
                0 0 20px ${
                  highlightColor === 'blue' ? 'rgba(59, 130, 246, 0.5)' :
                  highlightColor === 'green' ? 'rgba(16, 185, 129, 0.5)' :
                  highlightColor === 'purple' ? 'rgba(139, 92, 246, 0.5)' :
                  highlightColor === 'orange' ? 'rgba(245, 158, 11, 0.5)' :
                  highlightColor === 'red' ? 'rgba(239, 68, 68, 0.5)' :
                  highlightColor === 'indigo' ? 'rgba(99, 102, 241, 0.5)' :
                  highlightColor === 'teal' ? 'rgba(20, 184, 166, 0.5)' :
                  'rgba(59, 130, 246, 0.5)'
                },
                0 4px 20px rgba(0,0,0,0.1)
              `
            }}
          />
        )}
        
        {/* Enhanced Tooltip with smoother transitions */}
        <Card
          className="absolute bg-white shadow-2xl border border-gray-200 z-[10000] pointer-events-auto transform transition-all duration-300 ease-out"
          style={{
            top: tooltipPosition.top,
            left: tooltipPosition.left,
            width: '400px',
            maxWidth: 'calc(100vw - 32px)',
            borderRadius: '20px',
            willChange: 'transform',
            backfaceVisibility: 'hidden',
          }}
        >
          <CardContent className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <Badge 
                  className={cn(
                    "text-xs font-bold px-3 py-1.5 border-0 text-white shadow-sm",
                    currentStepData.category === 'overview' && "bg-blue-600",
                    currentStepData.category === 'navigation' && "bg-green-600", 
                    currentStepData.category === 'features' && "bg-purple-600",
                    currentStepData.category === 'tools' && "bg-orange-600",
                    currentStepData.category === 'settings' && "bg-gray-700"
                  )}
                >
                  Step {currentStep + 1} of {tourSteps.length}
                </Badge>
                <Badge variant="outline" className="text-xs font-medium px-2 py-1 capitalize">
                  {currentStepData.category}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={skipTour}
                className="p-2 h-8 w-8 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Content */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2 leading-snug">
                  {currentStepData.title}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {currentStepData.description}
                </p>
              </div>

              {currentStepData.customContent && (
                <div className="border-t pt-4">{currentStepData.customContent}</div>
              )}

              {isNavigating && (
                <div className="flex items-center gap-3 text-sm text-blue-700 bg-blue-50 p-3 rounded-xl border border-blue-200">
                  <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full" />
                  <span className="font-medium">Loading {currentStepData.route?.replace('/', '')}...</span>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
              <Button
                variant="outline"
                size="sm"
                onClick={previousStep}
                disabled={currentStep === 0 || isNavigating}
                className="flex items-center gap-2 px-3 py-2 font-medium disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={skipTour}
                  disabled={isNavigating}
                  className="text-gray-500 hover:text-gray-700 px-3 py-2 disabled:opacity-50"
                >
                  Exit Tour
                </Button>
                
                <Button
                  onClick={nextStep}
                  size="sm"
                  disabled={isNavigating}
                  className="flex items-center gap-2 px-4 py-2 font-medium bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 shadow-md"
                >
                  {currentStep === tourSteps.length - 1 ? (
                    <>
                      Finish
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
            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-500 mb-2">
                <span>Progress</span>
                <span>{Math.round(((currentStep + 1) / tourSteps.length) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 h-2 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${((currentStep + 1) / tourSteps.length) * 100}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return createPortal(<Overlay />, document.body)
}

export default DemoTour
