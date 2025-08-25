import { Navbar } from "./navbar"
import Footer from "./footer"

interface PolicyLayoutProps {
  children: React.ReactNode
  title: string
}

export default function PolicyLayout({ children, title }: PolicyLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Main Content */}
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="bg-white rounded-lg shadow-sm p-6 sm:p-8 lg:p-12">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 sm:mb-8 text-[#001633] border-b border-gray-200 pb-4">
              {title}
            </h1>
            <div className="prose prose-sm sm:prose-base lg:prose-lg xl:prose-xl max-w-none">
              {children}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}