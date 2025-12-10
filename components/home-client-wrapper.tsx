'use client'

import dynamic from 'next/dynamic'

export const PricingSection = dynamic(() => import("@/components/pricing-section"), { ssr: false, loading: () => <div className="h-96" /> })
export const FeatureComparison = dynamic(() => import("@/components/feature-comparison"), { ssr: false, loading: () => <div className="h-96" /> })
export const QuoteSection = dynamic(() => import("@/components/quote-section"), { ssr: false, loading: () => <div className="h-64" /> })
export const ModelPortfolioSection = dynamic(() => import("@/components/model-portfolio-section"), { ssr: false, loading: () => <div className="h-96" /> })
export const FAQContactSection = dynamic(() => import("@/components/faq-contact-section"), { ssr: false, loading: () => <div className="h-96" /> })
export const Footer = dynamic(() => import("@/components/footer"), { ssr: false, loading: () => <div className="h-32" /> })
