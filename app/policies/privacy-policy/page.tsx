"use client";
import PolicyLayout from "@/components/policy-layout"

export default function PrivacyPolicyPage() {
  return (
    <PolicyLayout title="Privacy Policy">
      <div className="mb-6">
        <p className="mb-4"><strong>SEBI Registered Research Analyst No.: INH000022552 – RANGAONE FINWALA PRIVATE LIMITED</strong></p>
        <p className="mb-4">Your privacy is very important to us. Accordingly, we have developed this Policy to help you understand how we collect, use, communicate, disclose, and safeguard personal information. The following outlines our Privacy Policy.</p>
      </div>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-[#001633]">1. General Privacy</h2>
        <p className="mb-4">Like most websites, RANGAONE FINWALA PRIVATE LIMITED collects non-personally-identifying information such as browser type, language preference, referring site, and the date and time of each visitor request.</p>
        <p className="mb-4">The Company may also collect potentially personally-identifying information such as Internet Protocol (IP) addresses for security purposes.</p>
        <p className="mb-4">Visitors can always refuse to provide personally-identifying information; however, doing so may prevent access to certain website-related activities or services.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-[#001633]">2. Protection of Personally-Identifying Information</h2>
        <p className="mb-4">RANGAONE FINWALA PRIVATE LIMITED discloses potentially personally-identifying and personally-identifying information only to:</p>
        <ul className="list-disc pl-6 mb-4">
          <li>Employees, contractors, and affiliated organizations who need the information to process it on behalf of the Company or to provide services available through the website, and</li>
          <li>Who have agreed not to disclose it further.</li>
        </ul>
        <p className="mb-4">The Company does not rent or sell personally-identifying information to any third party.</p>
        <p className="mb-4">If you are a registered user and have supplied your email address, the Company may occasionally send you communications to inform you about new features, request feedback, or update you on RANGAONE FINWALA PRIVATE LIMITED and its services.</p>
        <p className="mb-4">The Company takes all reasonable measures to protect against unauthorized access, use, alteration, or destruction of personally-identifying information.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-[#001633]">3. Cookies</h2>
        <p className="mb-4">A cookie is a small string of information stored on a visitor's computer that the browser provides to the website upon return.</p>
        <p className="mb-4">RANGAONE FINWALA PRIVATE LIMITED uses cookies to:</p>
        <ul className="list-disc pl-6 mb-4">
          <li>Identify and track visitors,</li>
          <li>Understand website usage, and</li>
          <li>Enhance user access preferences.</li>
        </ul>
        <p className="mb-4">Visitors who do not wish to have cookies placed on their computers may set their browsers to refuse cookies before using the website. However, certain features of the website may not function properly without cookies enabled.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-[#001633]">4. Privacy Policy Changes</h2>
        <p className="mb-4">Although most changes are likely to be minor, RANGAONE FINWALA PRIVATE LIMITED may update its Privacy Policy from time to time at its sole discretion.</p>
        <p className="mb-4">Visitors are encouraged to frequently check this page for any changes. Continued use of the website after any modification of the Privacy Policy constitutes acceptance of the updated policy.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-[#001633]">5. Contact Information</h2>
        <p className="mb-4">For any queries regarding this Privacy Policy or handling of personal data, you may contact:</p>
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">📞</span>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-green-900 mb-3">RANGAONE FINWALA PRIVATE LIMITED</p>
              <div className="space-y-2">
                <p className="text-green-800"><strong>Email:</strong> Sanika.official11@gmail.com</p>
                <p className="text-green-800"><strong>Phone:</strong> +91 93261 99388</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PolicyLayout>
  )
}