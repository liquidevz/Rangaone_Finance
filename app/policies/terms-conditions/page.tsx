import PolicyLayout from "@/components/policy-layout"

export default function TermsConditionsPage() {
  return (
    <PolicyLayout title="Terms & Conditions">
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-[#001633]">1. Introduction</h2>
        <p className="mb-4">These Terms and Conditions ("Terms") govern your use of RangaOne Finwala Pvt. Ltd.'s research services and website. By accessing or using our services, you agree to be bound by these Terms.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-[#001633]">2. Services</h2>
        <p className="mb-4">RangaOne Finwala provides investment research, analysis, and advisory services. Our services include but are not limited to:</p>
        <ul className="list-disc pl-6 mb-4">
          <li>Stock recommendations and analysis</li>
          <li>Market research reports</li>
          <li>Investment advisory services</li>
          <li>Portfolio management guidance</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-[#001633]">3. User Responsibilities</h2>
        <p className="mb-4">Users must:</p>
        <ul className="list-disc pl-6 mb-4">
          <li>Provide accurate and complete information</li>
          <li>Use services only for lawful purposes</li>
          <li>Maintain confidentiality of account credentials</li>
          <li>Comply with all applicable laws and regulations</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-[#001633]">4. Investment Risks</h2>
        <p className="mb-4">All investments carry risk. Past performance does not guarantee future results. Users should carefully consider their financial situation and risk tolerance before making investment decisions.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-[#001633]">5. Limitation of Liability</h2>
        <p className="mb-4">RangaOne Finwala shall not be liable for any direct, indirect, incidental, or consequential damages arising from the use of our services or reliance on our recommendations.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-[#001633]">6. Modifications</h2>
        <p className="mb-4">We reserve the right to modify these Terms at any time. Users will be notified of significant changes, and continued use constitutes acceptance of modified Terms.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-[#001633]">7. Contact Information</h2>
        <p className="mb-4">For questions regarding these Terms, please contact us at:</p>
        <p className="mb-2"><strong>Email:</strong> Support@rangaone.finance</p>
        <p className="mb-2"><strong>Phone:</strong> +91-93261 99388</p>
      </section>
    </PolicyLayout>
  )
}