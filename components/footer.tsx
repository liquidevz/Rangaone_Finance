import Link from "next/link"
import { FiPhone, FiMail } from "react-icons/fi"
import { FaTelegram, FaInstagram, FaLinkedin, FaTwitter } from "react-icons/fa"

export default function Footer() {
  return (
    <footer className="bg-white pt-16 pb-6">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Company Info */}
          <div>
            <div className="flex items-center mb-6">
              <div className="relative w-12 h-12 bg-[#001633] rounded-full flex items-center justify-center mr-3">
                <span className="text-[#FFFFF0] text-2xl font-bold">R</span>
              </div>
              <div className="text-[#001633]">
                <div className="font-bold text-lg leading-tight">RangaOne</div>
                <img src="/logo.png" alt="RangaOne Finance Logo" className="h-8 w-auto" />
              </div>
            </div>
            <p className="text-gray-600 mb-6">
              "Build wealth with confidence. Spot opportunities, make strategic moves, and watch your portfolio grow."
            </p>
            <div className="space-y-2">
              <div className="flex items-center">
                <FiPhone className="text-[#1e3a8a] mr-2" />
                <span className="text-gray-700">+91-8319648459</span>
              </div>
              <div className="flex items-center">
                <FiMail className="text-[#1e3a8a] mr-2" />
                <span className="text-gray-700">For Inquiry - info@RangaOnefinwala.com</span>
              </div>
              <div className="flex items-center">
                <FiMail className="text-[#1e3a8a] mr-2" />
                <span className="text-gray-700">For Grievances - compliance@RangaOnefinwala.com</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-bold mb-6 text-[#001633]">Quick Links</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/about" className="text-gray-600 hover:text-[#1e3a8a] transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/investor-charter" className="text-gray-600 hover:text-[#1e3a8a] transition-colors">
                  Investor Charter
                </Link>
              </li>
              <li>
                <Link href="/complaints" className="text-gray-600 hover:text-[#1e3a8a] transition-colors">
                  Complaints
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-gray-600 hover:text-[#1e3a8a] transition-colors">
                  Plan & Pricing
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-gray-600 hover:text-[#1e3a8a] transition-colors">
                  Latest Blogs
                </Link>
              </li>
              <li>
                <Link href="/Policies/contact-us" className="text-gray-600 hover:text-[#1e3a8a] transition-colors">
                  Contact us
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-lg font-bold mb-6 text-[#001633]">Services</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/services/smart-equity" className="text-gray-600 hover:text-[#1e3a8a] transition-colors">
                  Smart Equity
                </Link>
              </li>
              <li>
                <Link href="/services/hni-elite" className="text-gray-600 hover:text-[#1e3a8a] transition-colors">
                  HNI Elite
                </Link>
              </li>
              <li>
                <Link
                  href="/services/model-portfolios"
                  className="text-gray-600 hover:text-[#1e3a8a] transition-colors"
                >
                  Model Portfolios
                </Link>
              </li>
              <li>
                <Link
                  href="/services/wealth-management"
                  className="text-gray-600 hover:text-[#1e3a8a] transition-colors"
                >
                  Wealth Management
                </Link>
              </li>
              <li>
                <Link href="/services/ipo-advisory" className="text-gray-600 hover:text-[#1e3a8a] transition-colors">
                  IPO Advisory
                </Link>
              </li>
            </ul>
          </div>

          {/* Terms & Social Media */}
          <div className="grid grid-cols-1 gap-8">
            <div>
              <h3 className="text-lg font-bold mb-6 text-[#001633]">Terms</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/disclaimer" className="text-gray-600 hover:text-[#1e3a8a] transition-colors">
                    Disclaimer
                  </Link>
                </li>
                <li>
                  <Link href="/disclosure" className="text-gray-600 hover:text-[#1e3a8a] transition-colors">
                    Disclosure
                  </Link>
                </li>
                <li>
                  <Link href="/grievance" className="text-gray-600 hover:text-[#1e3a8a] transition-colors">
                    Grievance Redressal
                  </Link>
                </li>
                <li>
                  <Link href="/aml-policy" className="text-gray-600 hover:text-[#1e3a8a] transition-colors">
                    AML Policy
                  </Link>
                </li>
                <li>
                  <Link href="/Policies/privacy-policy" className="text-gray-600 hover:text-[#1e3a8a] transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/Policies/terms-and-conditions" className="text-gray-600 hover:text-[#1e3a8a] transition-colors">
                    Terms and Conditions
                  </Link>
                </li>
                <li>
                  <Link href="/Policies/cancellations-refunds" className="text-gray-600 hover:text-[#1e3a8a] transition-colors">
                    Cancellations & Refunds
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-6 text-[#001633]">Social Media</h3>
              <div className="flex space-x-4">
                <Link
                  href="https://t.me/RangaOnefinwala"
                  className="text-[#1e3a8a] hover:text-[#3b82f6] transition-colors"
                >
                  <FaTelegram size={24} />
                </Link>
                <Link
                  href="https://instagram.com/RangaOnefinwala"
                  className="text-[#1e3a8a] hover:text-[#3b82f6] transition-colors"
                >
                  <FaInstagram size={24} />
                </Link>
                <Link
                  href="https://linkedin.com/company/RangaOnefinwala"
                  className="text-[#1e3a8a] hover:text-[#3b82f6] transition-colors"
                >
                  <FaLinkedin size={24} />
                </Link>
                <Link
                  href="https://twitter.com/RangaOnefinwala"
                  className="text-[#1e3a8a] hover:text-[#3b82f6] transition-colors"
                >
                  <FaTwitter size={24} />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="border-t border-gray-200 pt-6 pb-4 text-sm text-gray-600">
          <p className="mb-2">
            *Disclaimer: "Registration granted by SEBI and certification from NISM in no way guarantee performance of
            the intermediary or provide any assurance of returns to investors."
          </p>
          <p>
            *Standard warning: "Investment in securities market are subject to market risks. Read all the related
            documents carefully before investing."
          </p>
        </div>

        {/* Registration Info */}
        <div className="grid md:grid-cols-3 gap-6 py-6 border-t border-gray-200 text-sm text-gray-600">
          <div>
            <h4 className="font-bold mb-2">SEBI Registered Research Analyst</h4>
            <p>Name: RangaOne FINWALA</p>
            <p>Type of Registration: Individual</p>
            <p>SEBI Registration No: INH000013350</p>
            <p>BSE Enlistment number: 5886</p>
            <p>Validity of Registration: Oct 12, 2023 – Perpetual</p>
          </div>
          <div>
            <h4 className="font-bold mb-2">SEBI office address:</h4>
            <p>
              SEBI Bhavan BKC, Plot No.C4-A, 'G' Block Bandra-Kurla Complex, Bandra (East), Mumbai – 400051, Maharashtra
            </p>
          </div>
          <div>
            <h4 className="font-bold mb-2">Registered Office address:</h4>
            <p>Office no.3, Ward No.11, Managanj, Jaithari, Post Jaithari, Anuppur, Madhya Pradesh, 484330</p>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-200 pt-6 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-600 text-sm">RangaOne FINWALA ©{new Date().getFullYear()} All Rights Reserved.</p>
          <div className="flex items-center mt-4 md:mt-0">
            <span className="text-gray-600 text-sm mr-4">
              SCORES:{" "}
              <a href="https://www.scores.gov.in" className="text-[#1e3a8a] hover:underline">
                www.scores.gov.in
              </a>
            </span>
            <span className="text-gray-600 text-sm">
              ODR PORTAL:{" "}
              <a href="https://smartodr.in" className="text-[#1e3a8a] hover:underline">
                www.smartodr.in
              </a>
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
