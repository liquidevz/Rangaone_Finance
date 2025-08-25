import Link from "next/link"
import { FaInstagram, FaYoutube, FaLinkedin } from "react-icons/fa"

export default function Footer() {
  return (
    <footer className="bg-white pt-16 pb-6">
      <div className="container mx-auto px-8">
        {/* Logo and Tagline */}
        <div className="mb-12">
          <div className="flex items-center mb-4">
            <div className="relative w-12 h-12 bg-[#001633] rounded-full flex items-center justify-center mr-3">
              <span className="text-white text-2xl font-bold">R</span>
            </div>
            <div className="text-[#001633]">
              <div className="font-bold text-xl leading-tight">RangaOne</div>
              <div className="text-sm italic">Finance</div>
            </div>
          </div>
          <p className="text-[#001633] italic text-sm">Your Growth Our Priority</p>
        </div>

        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-8">
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
                <Link href="/contact" className="text-gray-600 hover:text-[#1e3a8a] transition-colors">
                  Contact us
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-[#001633] font-bold mb-4">Services</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/rangaone-wealth-basic" className="hover:text-[#1e3a8a]">Rangaone Wealth Basic</Link></li>
              <li><Link href="/rangaone-wealth-premium" className="hover:text-[#1e3a8a]">Rangaone Wealth Premium</Link></li>
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
                  <Link href="/privacy-policy" className="text-gray-600 hover:text-[#1e3a8a] transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="text-gray-600 hover:text-[#1e3a8a] transition-colors">
                    Terms and Condition
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
            <span className="font-semibold">
              ODR PORTAL: <a href="https://www.smartodr.in" className="text-[#1e3a8a] hover:underline">www.smartodr.in</a>
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}