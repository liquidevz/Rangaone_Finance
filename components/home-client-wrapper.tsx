'use client'

import dynamic from 'next/dynamic'

export const PricingSection = dynamic(() => import("@/components/pricing-section"), { ssr: false })
export const FeatureComparison = dynamic(() => import("@/components/feature-comparison"), { ssr: false })
export const QuoteSection = dynamic(() => import("@/components/quote-section"), { ssr: false })
export const ModelPortfolioSection = dynamic(() => import("@/components/model-portfolio-section"), { ssr: false })
export const FAQContactSection = dynamic(() => import("@/components/faq-contact-section"), { ssr: false })
export const Footer = dynamic(() => import("@/components/footer"), { ssr: false })
