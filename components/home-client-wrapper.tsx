'use client'

import { ImageTrailHero } from "@/components/image-trail-hero"
import { Navbar } from "@/components/navbar"
import dynamic from 'next/dynamic'

const PricingSection = dynamic(() => import("@/components/pricing-section"), { ssr: false })
const FeatureComparison = dynamic(() => import("@/components/feature-comparison"), { ssr: false })
const QuoteSection = dynamic(() => import("@/components/quote-section"), { ssr: false })
const ModelPortfolioSection = dynamic(() => import("@/components/model-portfolio-section"), { ssr: false })
const FAQContactSection = dynamic(() => import("@/components/faq-contact-section"), { ssr: false })
const Footer = dynamic(() => import("@/components/footer"), { ssr: false })

export function HomeClient() {
  return (
    <main>
      <Navbar />
      <ImageTrailHero />
      <PricingSection />
      <FeatureComparison />
      <QuoteSection />
      <ModelPortfolioSection />
      <FAQContactSection />
      <Footer />
    </main>
  )
}

export { PricingSection, FeatureComparison, QuoteSection, ModelPortfolioSection, FAQContactSection, Footer }
