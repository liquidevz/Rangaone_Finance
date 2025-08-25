import PolicyLayout from "@/components/policy-layout"

export default function DisclosurePage() {
  return (
    <PolicyLayout title="Standard Disclosures">
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-[#001633]">Company Information</h2>
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <p className="mb-2"><strong>Company Name:</strong> RangaOne Finwala Pvt. Ltd.</p>
            <p className="mb-2"><strong>SEBI Registration No:</strong> INH000022552</p>
            <p className="mb-2"><strong>Registration Type:</strong> Non-Individual Research Analyst</p>
            <p className="mb-2"><strong>Registration Validity:</strong> Aug 06, 2025 - Aug 05, 2030</p>
            <p className="mb-2"><strong>CIN:</strong> U85499MH2024PTC430892</p>
            <p className="mb-2"><strong>GST:</strong> 27AANCR9959F1ZM</p>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-[#001633]">Business Activities</h2>
          <p className="mb-4">RangaOne Finwala is engaged in providing:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Investment research and analysis</li>
            <li>Stock recommendations</li>
            <li>Market outlook and sector analysis</li>
            <li>Portfolio advisory services</li>
            <li>Investment strategy consultation</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-[#001633]">Conflict of Interest</h2>
          <p className="mb-4">We maintain strict policies to avoid conflicts of interest:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>No proprietary trading in recommended securities</li>
            <li>Disclosure of any material financial interest</li>
            <li>Transparent research methodology</li>
            <li>Independent research opinions</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-[#001633]">Research Methodology</h2>
          <p className="mb-4">Our research is based on:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Fundamental analysis of companies</li>
            <li>Technical analysis of price movements</li>
            <li>Macroeconomic factors</li>
            <li>Industry and sector trends</li>
            <li>Management quality assessment</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-[#001633]">Risk Factors</h2>
          <p className="mb-4">Investment in securities market are subject to market risks:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Market volatility and price fluctuations</li>
            <li>Liquidity risks</li>
            <li>Credit and default risks</li>
            <li>Regulatory and policy changes</li>
            <li>Economic and political factors</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-[#001633]">Disclaimers</h2>
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
            <p className="mb-2"><strong>Registration Disclaimer:</strong> "Registration granted by SEBI and certification from NISM in no way guarantee performance of the intermediary or provide any assurance of returns to investors."</p>
            <p><strong>Investment Warning:</strong> "Investment in securities market are subject to market risks. Read all the related documents carefully before investing."</p>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-[#001633]">Contact Information</h2>
          <p className="mb-4">For any queries or clarifications:</p>
          <p className="mb-2"><strong>Email:</strong> compliance@rangaone.finance</p>
          <p className="mb-2"><strong>Phone:</strong> +91-93261 99388</p>
          <p className="mb-2"><strong>Address:</strong> 004 Ambika Darshan, Shivaji Nagar, Sahargaon, Mumbai Suburban, Maharashtra, 400099</p>
        </section>
    </PolicyLayout>
  )
}