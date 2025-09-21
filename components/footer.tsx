import Link from "next/link"
import { FaInstagram, FaYoutube, FaLinkedin } from "react-icons/fa"

export default function Footer() {
  return (
    <footer className="bg-white pt-8 sm:pt-16 pb-4 sm:pb-6">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        {/* Logo and Tagline */}
        <div className="mb-6 sm:mb-12">
          <Link href="/" className="flex items-center gap-2 mb-3 sm:mb-4">
            <img 
              src="/landing-page/rlogo.png" 
              alt="RangaOne Logo" 
              className="h-8 sm:h-12 w-auto" 
            />
            <img 
              src="/landing-page/namelogodark.png" 
              alt="RangaOne Name" 
              className="h-8 sm:h-12 w-auto" 
            />
          </Link>
          <p className="text-[#001633] italic text-sm">Your Growth Our Priority</p>
        </div>

        {/* Main Footer Content */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-8 mb-6 sm:mb-8">
          {/* Social Media */}
          <div>
            <h3 className="text-[#001633] font-bold mb-2 sm:mb-4 text-base">Social Media</h3>
            <div className="space-y-1 sm:space-y-2">
              <a href="https://www.instagram.com/onesanika" target="_blank" rel="noopener noreferrer" className="flex items-center hover:opacity-75">
                <FaInstagram className="mr-1 sm:mr-2" size={14} />
                <span className="text-sm">Instagram</span>
              </a>
              <a href="https://youtube.com/@rangaonefinance" target="_blank" rel="noopener noreferrer" className="flex items-center hover:opacity-75">
                <FaYoutube className="mr-1 sm:mr-2" size={14} />
                <span className="text-sm">Youtube</span>
              </a>
              <a href="https://www.linkedin.com/company/rangaone-finwala-private-limited/" target="_blank" rel="noopener noreferrer" className="flex items-center hover:opacity-75">
                <FaLinkedin className="mr-1 sm:mr-2" size={14} />
                <span className="text-sm">LinkedIn</span>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-[#001633] font-bold mb-2 sm:mb-4 text-base">Quick Links</h3>
            <ul className="space-y-1 sm:space-y-2 text-sm">
              <li><Link href="/about-us" className="hover:text-[#1e3a8a]">About Us</Link></li>
              <li><Link href="#pricing" className="hover:text-[#1e3a8a]">Plans & Pricing</Link></li>
              <li><Link href="/contact-us" className="hover:text-[#1e3a8a]">Contact Us</Link></li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-[#001633] font-bold mb-2 sm:mb-4 text-base">Services</h3>
            <ul className="space-y-1 sm:space-y-2 text-sm">
              <li><Link href="/basic-subscription" className="hover:text-[#1e3a8a]">Rangaone Wealth Basic</Link></li>
              <li><Link href="/premium-subscription" className="hover:text-[#1e3a8a]">Rangaone Wealth Premium</Link></li>
              <li><Link href="/model-portfolios" className="hover:text-[#1e3a8a]">Model Portfolios</Link></li>
            </ul>
          </div>

          {/* Terms */}
          <div>
            <h3 className="text-[#001633] font-bold mb-2 sm:mb-4 text-base">Terms</h3>
            <ul className="space-y-1 sm:space-y-2 text-sm">
              <li><Link href="/policies/disclaimer" className="hover:text-[#1e3a8a]">Disclaimer</Link></li>
              <li><Link href="/policies/disclosure" className="hover:text-[#1e3a8a]">Disclosure</Link></li>
              <li><Link href="/policies/grievance-redressal" className="hover:text-[#1e3a8a]">Grievance Redressal</Link></li>
              <li><Link href="/policies/investor-charter" className="hover:text-[#1e3a8a]">Investor Charter</Link></li>
            </ul>
          </div>

          {/* Additional Terms */}
          <div>
            <h3 className="text-[#001633] font-bold mb-2 sm:mb-4 text-base">Policies</h3>
            <ul className="space-y-1 sm:space-y-2 text-sm">
              <li><Link href="/policies/pmla-aml-policy" className="hover:text-[#1e3a8a]">PMLA (AML) Policy</Link></li>
              <li><Link href="/policies/privacy-policy" className="hover:text-[#1e3a8a]">Privacy Policy</Link></li>
              <li><Link href="/policies/terms-conditions" className="hover:text-[#1e3a8a]">Terms & Conditions</Link></li>
              <li><Link href="/policies/investor-complaints" className="hover:text-[#1e3a8a]">Investor Complaints</Link></li>
              <li><Link href="/policies/cancellation-refund-policy" className="hover:text-[#1e3a8a]">Cancellation & Refund Policy</Link></li>
            </ul>
          </div>
        </div>

        <hr className="border-gray-300 mb-4 sm:mb-8" />

        {/* Company Details Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 mb-6 sm:mb-8 text-sm">
          {/* SEBI Details */}
          <div>
            <h4 className="text-[#001633] font-bold mb-3">SEBI Registered Research Analyst Details</h4>
            <div className="space-y-3">
              <div className="grid grid-cols-2 lg:grid-cols-1 gap-x-4 gap-y-2 lg:gap-y-1">
                <span className="font-semibold text-gray-700 lg:block">Registered Name:</span>
                <span className="lg:block">RangaOne Finwala Pvt. Ltd.</span>
                <span className="font-semibold text-gray-700 lg:block">Type of Registration:</span>
                <span className="lg:block">Non-Individual</span>
                <span className="font-semibold text-gray-700 lg:block">Registration Number:</span>
                <span className="lg:block">INH000022552</span>
                <span className="font-semibold text-gray-700 lg:block">Registration Validity:</span>
                <span className="lg:block">Aug 06,2025 - Aug 05,2030</span>
              </div>
              <div className="border-t pt-2">
                <p className="font-semibold text-gray-700 mb-1">SEBI Office Address:</p>
                <div className="pl-2 border-l-2 border-gray-200">
                  <p>SEBI Bhavan BKC - Plot No.C4-A, 'G' Block</p>
                  <p>Bandra-Kurla Complex, Bandra (East),</p>
                  <p>Mumbai – 400051, Maharashtra</p>
                </div>
              </div>
            </div>
          </div>

          {/* Company Details */}
          <div>
            <h4 className="text-[#001633] font-bold mb-3">RangaOne Finwala Pvt. Ltd.</h4>
            <div className="space-y-3">
              <div>
                <p className="font-semibold text-gray-700 mb-1">Registered Office Address:</p>
                <div className="pl-2 border-l-2 border-gray-200">
                  <p>004 Ambika Darshan, Shivaji Nagar, Sahargaon, Mumbai</p>
                  <p>Suburban, Maharashtra - 400099</p>
                </div>
              </div>
              <div className="border-t pt-2">
                <div className="grid grid-cols-2 lg:grid-cols-1 gap-x-4 gap-y-2 lg:gap-y-1">
                  <span className="font-semibold text-gray-700 lg:block">Email:</span>
                  <span className="lg:block">Support@rangaone.finance</span>
                  <span className="font-semibold text-gray-700 lg:block">Phone:</span>
                  <span className="lg:block">+91-93261 99388</span>
                  <span className="font-semibold text-gray-700 lg:block">BSE Enlistment Number:</span>
                  <span className="lg:block">6662</span>
                  <span className="font-semibold text-gray-700 lg:block">CIN:</span>
                  <span className="lg:block">U85499MH2024PTC430892</span>
                  <span className="font-semibold text-gray-700 lg:block">GST:</span>
                  <span className="lg:block">27AANCR9959F1ZM</span>
                </div>
              </div>
            </div>
          </div>

          {/* Officers Contact */}
          <div>
            <h4 className="text-[#001633] font-bold mb-3">Officers Contact</h4>
            <div className="space-y-3">
              <div>
                <p><span className="font-semibold">Grievance Officer</span></p>
                <p>Ms. Sanika Karnik</p>
                <p>Email: sanika.official11@gmail.com</p>
                <p>Phone: +91-93261 99388</p>
              </div>
              <div>
                <p><span className="font-semibold">Principal Officer</span></p>
                <p>Mr. Vibhanshu Gupta</p>
                <p>Email: guptavibhanshu2002@gmail.com</p>
                <p>Phone: +91-93512 00235</p>
              </div>
              <div>
                <p><span className="font-semibold">Compliance Officer</span></p>
                <p>Ms. Sanika Karnik</p>
                <p>Email: compliance@rangaone.finance</p>
                <p>Phone: +91-93261 99388</p>
              </div>
            </div>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-[#001633] font-bold mb-3">Support</h4>
            <div className="space-y-1">
              <p><span className="font-semibold">FAQ</span></p>
              <p><span className="font-semibold">CustomerCare Number</span></p>
              <p>+91-70213 37693</p>
              <p><span className="font-semibold">Timing</span></p>
              <p>Monday - Friday</p>
              <p>(10am-6pm)</p>
              <p><span className="font-semibold">Email us:</span></p>
              <p>Support@rangaone.finance</p>
            </div>
          </div>
        </div>

        <hr className="border-gray-300 mb-4 sm:mb-6" />

        {/* Disclaimers */}
        <div className="text-xs text-gray-600 mb-4 sm:mb-6">
          <p className="mb-1 sm:mb-2 text-sm leading-tight">
            *Disclaimer: "Registration granted by SEBI and certification from NISM in no way guarantee performance of the intermediary or provide any assurance of returns to investors."
          </p>
          <p className="text-sm leading-tight">
            *Standard warning: "Investment in securities market are subject to market risks. Read all the related documents carefully before investing."
          </p>
        </div>

        {/* Copyright and Links */}
        <div className="flex flex-col sm:flex-row justify-between items-center text-xs space-y-2 sm:space-y-0">
          <p className="text-[#001633] font-semibold text-center sm:text-left">
            RangaOne Finwala ©2025 All Rights Reserved.
          </p>
          <div className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-4 text-center">
            <span className="font-semibold text-sm">
              SCORES: <a href="https://www.scores.gov.in" className="text-[#1e3a8a] hover:underline">www.scores.gov.in</a>
            </span>
            <span className="font-semibold text-sm">
              ODR PORTAL: <a href="https://www.smartodr.in" className="text-[#1e3a8a] hover:underline">www.smartodr.in</a>
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}