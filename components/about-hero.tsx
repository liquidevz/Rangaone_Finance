// components\image-trail-hero.tsx
"use client"
import { motion } from "framer-motion"

export const AboutHero = () => {
  return (
    <section className="h-[20rem] md:h-screen bg-[#fffff] w-screen overflow-hidden">
      <Copy />
    </section>
  )
}

const Copy = () => {
  return (
    <div className="absolute bottom-0 left-0 right-0 z-40">
      <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-start md:items-end justify-between px-4 md:px-8 relative">
        <div className="relative w-full">
          {/* Mobile Hero Image */}
          <div className="absolute bottom-0 left-0 z-10 block md:hidden">
            <img
              src="/landing-page/mobileHeroImage.png"
              alt="RangaOne Hero Mobile"
              className="w-full h-auto max-w-full object-contain"
              style={{
                maxHeight: '40vh',
                minHeight: '150px',
              }}
            />
          </div>
    
          {/* Desktop Hero Image */}
          <div className="absolute bottom-0 left-0 z-10 hidden md:block">
            <img
              src="/landing-page/HeroImage.png"
              alt="RangaOne Hero Desktop"
              className="w-full h-auto max-w-full object-contain"
              style={{
                maxHeight: '50vh',
                minHeight: '250px',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}