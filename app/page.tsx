"use client"

import { ImageTrailHero } from "@/components/image-trail-hero"
import { Navbar } from "@/components/navbar"
import { PricingSection, FeatureComparison, QuoteSection, ModelPortfolioSection, FAQContactSection, Footer } from "@/components/home-client-wrapper"

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