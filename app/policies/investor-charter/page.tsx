import PolicyLayout from "@/components/policy-layout"

export default function InvestorCharterPage() {
  return (
    <PolicyLayout title="Investor Charter">
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-[#001633]">Our Vision</h2>
          <p className="mb-4">To provide transparent, reliable, and professional investment research services that empower investors to make informed decisions while maintaining the highest standards of integrity and compliance.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-[#001633]">Our Mission</h2>
          <p className="mb-4">To deliver high-quality research and advisory services that help investors achieve their financial goals through:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Independent and unbiased research</li>
            <li>Transparent communication</li>
            <li>Professional expertise</li>
            <li>Regulatory compliance</li>
            <li>Client-centric approach</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-[#001633]">Services We Provide</h2>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Equity Research:</strong> Fundamental and technical analysis of stocks</li>
            <li><strong>Market Analysis:</strong> Sector and market outlook reports</li>
            <li><strong>Investment Recommendations:</strong> Buy, sell, and hold recommendations</li>
            <li><strong>Portfolio Advisory:</strong> Investment strategy and portfolio guidance</li>
            <li><strong>Risk Assessment:</strong> Risk analysis and mitigation strategies</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-[#001633]">Your Rights as an Investor</h2>
          <h3 className="text-xl font-semibold mb-3 text-[#001633]">Right to Information</h3>
          <ul className="list-disc pl-6 mb-4">
            <li>Receive clear and accurate information about our services</li>
            <li>Access to research methodology and assumptions</li>
            <li>Timely updates on recommendations and market changes</li>
            <li>Transparent fee structure and charges</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3 text-[#001633]">Right to Fair Treatment</h3>
          <ul className="list-disc pl-6 mb-4">
            <li>Equal access to research and recommendations</li>
            <li>Professional and courteous service</li>
            <li>Confidentiality of personal information</li>
            <li>No discrimination based on investment size</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3 text-[#001633]">Right to Grievance Redressal</h3>
          <ul className="list-disc pl-6 mb-4">
            <li>File complaints about our services</li>
            <li>Timely resolution of grievances</li>
            <li>Escalation to regulatory authorities if unsatisfied</li>
            <li>No retaliation for filing complaints</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-[#001633]">Your Responsibilities as an Investor</h2>
          <ul className="list-disc pl-6 mb-4">
            <li>Provide accurate and complete information</li>
            <li>Read and understand all research reports and disclaimers</li>
            <li>Make investment decisions based on your risk profile</li>
            <li>Keep your contact information updated</li>
            <li>Report any suspicious activities or concerns</li>
            <li>Comply with applicable laws and regulations</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-[#001633]">Our Commitments</h2>
          <h3 className="text-xl font-semibold mb-3 text-[#001633]">Quality of Service</h3>
          <ul className="list-disc pl-6 mb-4">
            <li>Provide research based on thorough analysis</li>
            <li>Maintain professional standards</li>
            <li>Ensure timely delivery of services</li>
            <li>Continuous improvement of service quality</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3 text-[#001633]">Transparency</h3>
          <ul className="list-disc pl-6 mb-4">
            <li>Clear disclosure of conflicts of interest</li>
            <li>Transparent fee structure</li>
            <li>Open communication about risks</li>
            <li>Regular updates on recommendations</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3 text-[#001633]">Compliance</h3>
          <ul className="list-disc pl-6 mb-4">
            <li>Adhere to SEBI regulations and guidelines</li>
            <li>Maintain proper records and documentation</li>
            <li>Regular compliance monitoring and reporting</li>
            <li>Continuous training of staff</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-[#001633]">Grievance Redressal Mechanism</h2>
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <h3 className="text-lg font-semibold mb-2">Step 1: Contact Us Directly</h3>
            <p className="mb-2"><strong>Grievance Officer:</strong> Ms. Sanika Karnik</p>
            <p className="mb-2"><strong>Email:</strong> sanika.official11@gmail.com</p>
            <p className="mb-2"><strong>Phone:</strong> +91-93261 99388</p>
            <p className="mb-4"><strong>Timeline:</strong> Resolution within 7 working days</p>

            <h3 className="text-lg font-semibold mb-2">Step 2: Escalation</h3>
            <p className="mb-2">If not satisfied, escalate to:</p>
            <p className="mb-2"><strong>SEBI SCORES:</strong> <a href=\"https://www.scores.gov.in\" className=\"text-[#1e3a8a] hover:underline\">www.scores.gov.in</a></p>
            <p className=\"mb-2\"><strong>ODR Portal:</strong> <a href=\"https://www.smartodr.in\" className=\"text-[#1e3a8a] hover:underline\">www.smartodr.in</a></p>
          </div>
        </section>

        <section className="mb-8">
          <h2 className=\"text-2xl font-semibold mb-4 text-[#001633]\">Regulatory Information</h2>
          <div className=\"bg-blue-50 p-4 rounded-lg mb-4\">
            <p className=\"mb-2\"><strong>SEBI Registration No:</strong> INH000022552</p>
            <p className=\"mb-2\"><strong>Registration Type:</strong> Non-Individual Research Analyst</p>
            <p className=\"mb-2\"><strong>Validity:</strong> Aug 06, 2025 - Aug 05, 2030</p>
            <p className=\"mb-2\"><strong>BSE Enlistment Number:</strong> 0000</p>
          </div>
        </section>

        <section className=\"mb-8\">
          <h2 className=\"text-2xl font-semibold mb-4 text-[#001633]\">Important Disclaimers</h2>
          <div className=\"bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4\">
            <p className=\"mb-2\"><strong>Registration Disclaimer:</strong> \"Registration granted by SEBI and certification from NISM in no way guarantee performance of the intermediary or provide any assurance of returns to investors.\"</p>
            <p><strong>Investment Warning:</strong> \"Investment in securities market are subject to market risks. Read all the related documents carefully before investing.\"</p>
          </div>
        </section>

        <section className=\"mb-8\">
          <h2 className=\"text-2xl font-semibold mb-4 text-[#001633]\">Contact Information</h2>
          <div className=\"bg-gray-50 p-4 rounded-lg\">
            <p className=\"mb-2\"><strong>Company:</strong> RangaOne Finwala Pvt. Ltd.</p>
            <p className=\"mb-2\"><strong>Address:</strong> 004 Ambika Darshan, Shivaji Nagar, Sahargaon, Mumbai Suburban, Maharashtra, 400099</p>
            <p className=\"mb-2\"><strong>Email:</strong> Support@rangaone.finance</p>
            <p className=\"mb-2\"><strong>Phone:</strong> +91-93261 99388</p>
            <p className=\"mb-2\"><strong>Customer Care:</strong> +91-91676 94966</p>
            <p><strong>Timing:</strong> Monday - Friday (10am-6pm)</p>
          </div>
        </section>
    </PolicyLayout>
  )
}