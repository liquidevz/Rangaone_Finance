"use client";
import { Navbar } from "./navbar"
import Footer from "./footer"

interface PolicyLayoutProps {
  children: React.ReactNode
  title: string
}

export default function PolicyLayout({ children, title }: PolicyLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      <Navbar />
      
      {/* Hero Section */}
      <div className="pt-24 pb-12 lg:pb-16 bg-gradient-to-r from-[#001633] to-[#003366]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-white mb-6 tracking-tight">
              {title}
            </h1>
            <div className="w-32 lg:w-40 h-1.5 bg-gradient-to-r from-blue-400 to-indigo-400 mx-auto rounded-full"></div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <main className="py-16 lg:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl xl:max-w-6xl">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl lg:rounded-3xl shadow-xl border border-white/20 overflow-hidden">
            <div className="p-8 sm:p-12 lg:p-16 xl:p-20">
              <div className="prose prose-lg max-w-none policy-content">
                <style jsx global>{`
                  .policy-content {
                    color: #374151;
                    line-height: 1.75;
                  }
                  .policy-content h2 {
                    color: #001633;
                    font-weight: 700;
                    font-size: 1.875rem;
                    margin-top: 2.5rem;
                    margin-bottom: 1.25rem;
                    padding-bottom: 0.75rem;
                    border-bottom: 2px solid #e5e7eb;
                    position: relative;
                  }
                  .policy-content h2::after {
                    content: '';
                    position: absolute;
                    bottom: -2px;
                    left: 0;
                    width: 60px;
                    height: 2px;
                    background: linear-gradient(to right, #3b82f6, #6366f1);
                  }
                  .policy-content h3 {
                    color: #1f2937;
                    font-weight: 600;
                    font-size: 1.5rem;
                    margin-top: 2rem;
                    margin-bottom: 1rem;
                  }
                  .policy-content p {
                    margin-bottom: 1.25rem;
                    text-align: justify;
                  }
                  .policy-content ul {
                    margin: 1.5rem 0;
                  }
                  .policy-content li {
                    margin: 0.75rem 0;
                    padding-left: 0.5rem;
                  }
                  .policy-content strong {
                    color: #001633;
                    font-weight: 600;
                  }
                `}</style>
                {children}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}