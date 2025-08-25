import Link from "next/link"
import { FaInstagram, FaYoutube, FaLinkedin } from "react-icons/fa"

export default function Footer() {
  return (
    <footer className="bg-white pt-16 pb-6">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        {/* Logo and Tagline */}
        <div className="mb-12">
          <Link href="/" className="flex items-center gap-2 mb-4">
            <img 
              src="/landing-page/rlogo.png" 
              alt="RangaOne Logo" 
              className="h-12 w-auto" 
            />
            <img 
              src="/landing-page/namelogodark.png" 
              alt="RangaOne Name" 
              className="h-12 w-auto" 
            />
          </Link>
          <p className="text-[#001633] italic text-sm">Your Growth Our Priority</p>
        </div>

        {/* Main Footer Content */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 mb-8">
          {/* Social Media */}
          <div>
            <h3 className="text-[#001633] font-bold mb-4">Social Media</h3>
            <div className="space-y-2">
              <div className="flex items-center">
                <FaInstagram className="mr-2" size={16} />
                <span className="text-sm">Instagram</span>
              </div>
              <div className="flex items-center">
                <FaYoutube className="mr-2" size={16} />
                <span className="text-sm">Youtube</span>
              </div>
              <div className="flex items-center">
                <FaLinkedin className="mr-2" size={16} />
                <span className="text-sm">LinkedIn</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-[#001633] font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/about-us" className="hover:text-[#1e3a8a]">About Us</Link></li>
              <li><Link href="#pricing" className="hover:text-[#1e3a8a]">Plans & Pricing</Link></li>
              <li><Link href="/contact-us" className="hover:text-[#1e3a8a]">Contact Us</Link></li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-[#001633] font-bold mb-4">Services</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/basic-subscription" className="hover:text-[#1e3a8a]">Rangaone Wealth Basic</Link></li>
              <li><Link href="/premium-subscription" className="hover:text-[#1e3a8a]">Rangaone Wealth Premium</Link></li>
              <li><Link href="/model-portfolios" className="hover:text-[#1e3a8a]">Model Portfolios</Link></li>
            </ul>
          </div>

          {/* Terms */}
          <div>
            <h3 className="text-[#001633] font-bold mb-4">Terms</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/policies/disclaimer" className="hover:text-[#1e3a8a]">Disclaimer</Link></li>
              <li><Link href="/policies/disclosure" className="hover:text-[#1e3a8a]">Disclosure</Link></li>
              <li><Link href="/policies/grievance-redressal" className="hover:text-[#1e3a8a]">Grievance Redressal</Link></li>
              <li><Link href="/policies/investor-charter" className="hover:text-[#1e3a8a]">Investor Charter</Link></li>
            </ul>
          </div>

          {/* Additional Terms */}
          <div>
            <ul className="space-y-2 text-sm mt-8">
              <li><Link href="/policies/pmla-aml-policy" className="hover:text-[#1e3a8a]">PMLA (AML) Policy</Link></li>
              <li><Link href="/policies/privacy-policy" className="hover:text-[#1e3a8a]">Privacy Policy</Link></li>
              <li><Link href="/policies/terms-conditions" className="hover:text-[#1e3a8a]">Terms & Conditions</Link></li>
              <li><Link href="/policies/investor-complaints" className="hover:text-[#1e3a8a]">Investor Complaints</Link></li>
            </ul>
          </div>
        </div>

        <hr className="border-gray-300 mb-8" />

        {/* Company Details Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 mb-8 text-sm">
          {/* SEBI Details */}
          <div>
            <h4 className="text-[#001633] font-bold mb-3">SEBI Registered Research Analyst Details</h4>
            <div className="space-y-1">
              <p><span className="font-semibold">Registered Name</span></p>
              <p>RangaOne Finwala Pvt. Ltd.</p>
              <p><span className="font-semibold">Type of Registration</span></p>
              <p>Non-Individual</p>
              <p><span className="font-semibold">Registration Number</span></p>
              <p>INH000022552</p>
              <p><span className="font-semibold">Registration Validity</span></p>
              <p>Aug 06,2025 - Aug 05,2030</p>
              <p><span className="font-semibold">SEBI Office Address</span></p>
              <p>SEBI Bhavan BKC</p>
              <p>Plot No.C4-A, 'G' Block</p>
              <p>Bandra-Kurla Complex, Bandra (East),</p>
              <p>Mumbai – 400051, Maharashtra</p>
            </div>
          </div>

          {/* Company Details */}
          <div>
            <h4 className="text-[#001633] font-bold mb-3">RangaOne Finwala Pvt. Ltd.</h4>
            <div className="space-y-1">
              <p><span className="font-semibold">Registered Office Address</span></p>
              <p>004 Ambika Darshan, Shivaji Nagar, Sahargaon, Mumbai</p>
              <p>Suburban, Maharashtra., MUMBAI, MAHARASHTRA,</p>
              <p>400099</p>
              <p><span className="font-semibold">Email</span></p>
              <p>Support@rangaone.finance</p>
              <p><span className="font-semibold">Phone</span></p>
              <p>+91-93261 99388</p>
              <p><span className="font-semibold">BSE Enlistment Number</span></p>
              <p>0000</p>
              <p><span className="font-semibold">CIN</span></p>
              <p>U85499MH2024PTC430892</p>
              <p><span className="font-semibold">GST</span></p>
              <p>27AANCR9959F1ZM</p>
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
              <p>+91-91676 94966</p>
              <p><span className="font-semibold">Timing</span></p>
              <p>Monday - Friday</p>
              <p>(10am-6pm)</p>
              <p><span className="font-semibold">Email us:</span></p>
              <p>Support@rangaone.finance</p>
            </div>
          </div>
        </div>

        <hr className="border-gray-300 mb-6" />

        {/* Disclaimers */}
        <div className="text-xs text-gray-600 mb-6">
          <p className="mb-2">
            *Disclaimer: "Registration granted by SEBI and certification from NISM in no way guarantee performance of the intermediary or provide any assurance of returns to investors."
          </p>
          <p>
            *Standard warning: "Investment in securities market are subject to market risks. Read all the related documents carefully before investing."
          </p>
        </div>

        {/* Copyright and Links */}
        <div className="flex flex-col md:flex-row justify-between items-center text-xs">
          <p className="text-[#001633] font-semibold mb-2 md:mb-0">
            RangaOne Finwala ©2025 All Rights Reserved.
          </p>
          <div className="flex items-center space-x-6">
            <span className="font-semibold">
              SCORES: <a href="https://www.scores.gov.in" className="text-[#1e3a8a] hover:underline">www.scores.gov.in</a>
            </span>
            <span className="font-semibold">
              ODR PORTAL: <a href="https://www.smartodr.in" className="text-[#1e3a8a] hover:underline">www.smartodr.in</a>
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}