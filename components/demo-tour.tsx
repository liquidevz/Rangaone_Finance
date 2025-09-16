"use client"

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

interface TourStep {
  id: string
  title: string
  description: string
  route?: string
  customContent?: React.ReactNode
}

const tourSteps: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to RangaOne Finance! 🎉',
    description: 'This is your investment dashboard with all the tools you need to make informed investment decisions.',
    customContent: (
      <div className="text-center py-4">
        <div className="text-6xl mb-4">📈</div>
        <p className="text-lg text-gray-600">Let\'s explore the dashboard features!</p>
      </div>
    )
  },
  {
    id: 'sidebar',
    title: 'Navigation Sidebar',
    description: 'Use the sidebar to navigate between different sections like RangaOne Wealth, Model Portfolios, Investment Calculator, and Settings.'
  },
  {
    id: 'search',
    title: 'Global Search',
    description: 'Use the search bar to quickly find stocks, portfolios, or any content across the platform.'
  },
  {
    id: 'content',
    title: 'Main Content Area',
    description: 'This area displays the current page content. Navigate using the sidebar to explore different features.'
  },
  {
    id: 'complete',
    title: 'Tour Complete! 🎊',
    description: 'You\'re all set! Use the sidebar to explore RangaOne Wealth, Model Portfolios, and other features.',
    customContent: (
      <div className="text-center py-4">
        <div className="text-6xl mb-4">🚀</div>
        <p className="text-lg text-gray-600">Start exploring your investment platform!</p>
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
  const router = useRouter()
  const pathname = usePathname()

  const currentStepData = tourSteps[currentStep]

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0)
    }
  }, [isOpen])

  const nextStep = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      onClose()
    }
  }

  const previousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return
      
      if (e.key === 'Escape') {
        onClose()
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
  }, [isOpen, nextStep, previousStep, onClose])

  if (!isOpen) return null

  const tourContent = (
    <div className="fixed inset-0 z-[9999]">
      <div className="absolute inset-0 bg-black bg-opacity-50" />
      
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md bg-white shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Badge className="bg-blue-600 text-white">
                Step {currentStep + 1} of {tourSteps.length}
              </Badge>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <h3 className="text-lg font-bold mb-2">{currentStepData.title}</h3>
            <p className="text-sm text-gray-600 mb-4">{currentStepData.description}</p>

            {currentStepData.customContent && (
              <div className="mb-4">{currentStepData.customContent}</div>
            )}

            <div className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={previousStep} 
                disabled={currentStep === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              
              <Button onClick={nextStep}>
                {currentStep === tourSteps.length - 1 ? 'Complete' : 'Next'}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>

            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all" 
                  style={{ width: `${((currentStep + 1) / tourSteps.length) * 100}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  return createPortal(tourContent, document.body)
}

export default DemoTour