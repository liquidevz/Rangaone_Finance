"use client"

import dynamic from "next/dynamic"
import { ImageTrailHero } from "@/components/image-trail-hero"
import { Navbar } from "@/components/navbar"

const PricingSection = dynamic(() => import("@/components/pricing-section"), { ssr: true })
const FeatureComparison = dynamic(() => import("@/components/feature-comparison"), { ssr: true })
const QuoteSection = dynamic(() => import("@/components/quote-section"), { ssr: true })
const ModelPortfolioSection = dynamic(() => import("@/components/model-portfolio-section"), { ssr: true })
const FAQContactSection = dynamic(() => import("@/components/faq-contact-section"), { ssr: true })
const Footer = dynamic(() => import("@/components/footer"), { ssr: true })

export default function Home() {
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