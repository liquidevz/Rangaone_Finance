"use client"

import { ImageTrailHero } from "@/components/image-trail-hero"
import PricingSection from "@/components/pricing-section"
import FeatureComparison from "@/components/feature-comparison"
import QuoteSection from "@/components/quote-section"
import Footer from "@/components/footer"
import ModelPortfolioSection from "@/components/model-portfolio-section"
import FAQContactSection from "@/components/faq-contact-section"
import { Navbar } from "@/components/navbar"
// import StackedCardTestimonials from "@/components/stacked-card-testimonials"

export default function Home() {
  return (
    <main>
      <Navbar />
      <ImageTrailHero />
      <PricingSection />
      <FeatureComparison />
      <QuoteSection />
      <ModelPortfolioSection />
      {/* <StackedCardTestimonials /> */}
      <FAQContactSection />
      <Footer />
    </main>
  )
}