"use client";
import PolicyLayout from "@/components/policy-layout"

export default function DisclosurePage() {
  return (
    <PolicyLayout title="Disclosures">
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-[#001633]">1. About the Research Analyst</h2>
        <p className="mb-4">RANGAONE FINWALA PRIVATE LIMITED is a SEBI Registered Research Analyst Entity having its registered office at:</p>
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 mb-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">📍</span>
            </div>
            <div>
              <p className="font-semibold text-blue-900 mb-2">Registered Office</p>
              <p className="text-blue-800">004 Ambika Darshan, Shivaji Nagar, Sahargaon, Mumbai Suburban, Maharashtra, Mumbai – 400099</p>
            </div>
          </div>
        </div>
        <p className="mb-4">RANGAONE FINWALA PRIVATE LIMITED was registered with SEBI as a Research Analyst Entity vide Registration No. <strong>INH000022552</strong> on August 06, 2025, pursuant to which it provides Research Analyst services to its clients.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-[#001633]">2. Education and Qualification</h2>
        <p className="mb-4">The directors and key personnel of RANGAONE FINWALA PRIVATE LIMITED are qualified with a Bachelor of Commerce (B.Com) degree and hold NISM Series XV Research Analyst Certification. With a strong analytical skill set, the Company focuses on identifying investment opportunities and implementing effective strategies.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-[#001633]">3. Details of Business Activities</h2>
        <p className="mb-4">RANGAONE FINWALA PRIVATE LIMITED provides research recommendations based on both fundamental and technical analysis. Research reports and calls may be shared with clients through approved communication modes.</p>
        <ul className="list-disc pl-6 mb-4">
          <li>Free insights may be shared on public/social platforms for educational purposes.</li>
          <li>Paid subscribers are provided with detailed research services after completing necessary client onboarding and compliance formalities.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-[#001633]">4. Disciplinary History</h2>
        <p className="mb-4">There are no outstanding litigations or disciplinary actions against RANGAONE FINWALA PRIVATE LIMITED by SEBI or any other regulatory authority.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-[#001633]">5. Terms and Conditions of Research Report</h2>
        <p className="mb-4">RANGAONE FINWALA PRIVATE LIMITED has exercised due diligence in verifying the correctness and authenticity of the information contained in its research reports, insofar as it relates to current and historical information. However, the Company does not guarantee accuracy or completeness.</p>
        <p className="mb-4">The opinions expressed are based on current research as of the date of publication and are subject to change without notice.</p>
        <p className="mb-4">RANGAONE FINWALA PRIVATE LIMITED accepts no liability arising from the use of this document or information contained herein. Recipients of this material should rely on their own judgment and seek professional advice before acting. The Company shall not be responsible for any loss or damage arising from any inadvertent error in the information, views, or opinions expressed.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-[#001633]">6. Financial Interest and Conflict of Interest</h2>
        <p className="mb-4">Neither RANGAONE FINWALA PRIVATE LIMITED nor its associates, including relatives of directors/key persons:</p>
        <ul className="list-disc pl-6 mb-4">
          <li>Hold any financial interest in the subject company.</li>
          <li>Have any actual/beneficial ownership of more than 1% in the subject company.</li>
          <li>Have any other material conflict of interest with the subject company.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-[#001633]">7. Affiliation with Intermediaries</h2>
        <p className="mb-4">RANGAONE FINWALA PRIVATE LIMITED and its associates are not affiliated with any intermediaries and have not received any brokerage, commission, or remuneration from any third party in respect of their research services.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-[#001633]">8. Compensation</h2>
        <p className="mb-4">RANGAONE FINWALA PRIVATE LIMITED or its associates have not received any compensation from the subject company covered by the Research Analyst in the past twelve months.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-[#001633]">9. Public Offerings</h2>
        <p className="mb-4">RANGAONE FINWALA PRIVATE LIMITED or its associates have not managed or co-managed the public offering of securities for the subject company in the past twelve months.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-[#001633]">10. Market Making</h2>
        <p className="mb-4">RANGAONE FINWALA PRIVATE LIMITED or its associates have not served as an officer, director, or employee of the subject company and have not been engaged in market-making activity for the subject company.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-[#001633]">11. Reliability of Sources</h2>
        <p className="mb-4">RANGAONE FINWALA PRIVATE LIMITED has ensured that the facts mentioned in research reports are based on reliable sources and publicly available information. However, investors are advised to independently evaluate market conditions and risks before making any investment decisions.</p>
      </section>
    </PolicyLayout>
  )
}