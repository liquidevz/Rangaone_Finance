"use client"

import { Navbar } from "./navbar"
import Footer from "./footer"

interface PublicLayoutProps {
  children: React.ReactNode
}

export default function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4">
          {children}
        </div>
      </main>
      <Footer />
    </div>
  )
}