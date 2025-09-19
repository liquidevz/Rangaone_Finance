"use client"

import { Navbar } from "@/components/navbar"
import { AboutHero } from "@/components/about-hero"
import { DirectorsSection } from "@/components/directors-section"

export default function AboutUs() {
  return (
    <main>
      <Navbar />
      <AboutHero />
      <DirectorsSection />
    </main>
  )
}