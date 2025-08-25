import PolicyLayout from "@/components/policy-layout"

export default function DisclaimerPage() {
  return (
    <PolicyLayout title="Disclaimer">
        <section className="mb-8">
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
            <p className="font-semibold text-red-800 mb-2">Important Notice:</p>
            <p className="text-red-700">"Registration granted by SEBI and certification from NISM in no way guarantee performance of the intermediary or provide any assurance of returns to investors."</p>
          </div>
          
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <p className="font-semibold text-yellow-800 mb-2">Investment Warning:</p>
            <p className="text-yellow-700">"Investment in securities market are subject to market risks. Read all the related documents carefully before investing."</p>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-[#001633]">General Disclaimer</h2>
          <p className="mb-4">The information provided by RangaOne Finwala Pvt. Ltd. is for educational and informational purposes only. It should not be considered as personalized investment advice or a recommendation to buy, sell, or hold any securities.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-[#001633]">Investment Risks</h2>
          <p className="mb-4">All investments involve risk, including the potential loss of principal. Past performance does not guarantee future results. The value of investments may fluctuate, and investors may not get back the amount originally invested.</p>
          
          <h3 className="text-xl font-semibold mb-3 text-[#001633]">Specific Risks Include:</h3>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Market Risk:</strong> Securities prices may decline due to market conditions</li>
            <li><strong>Liquidity Risk:</strong> Difficulty in buying or selling securities</li>
            <li><strong>Credit Risk:</strong> Risk of default by issuers</li>
            <li><strong>Interest Rate Risk:</strong> Impact of changing interest rates</li>
            <li><strong>Currency Risk:</strong> Foreign exchange fluctuations</li>
            <li><strong>Regulatory Risk:</strong> Changes in laws and regulations</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-[#001633]">Research Limitations</h2>
          <p className="mb-4">Our research and recommendations are based on information available at the time of publication. We cannot guarantee the accuracy, completeness, or timeliness of such information.</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Information may become outdated</li>
            <li>Market conditions change rapidly</li>
            <li>Company fundamentals may deteriorate</li>
            <li>External factors may impact performance</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-[#001633]">No Guarantee of Returns</h2>
          <p className="mb-4">RangaOne Finwala does not guarantee any returns on investments. All investment decisions should be made based on individual financial circumstances, risk tolerance, and investment objectives.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-[#001633]">Limitation of Liability</h2>
          <p className="mb-4">RangaOne Finwala Pvt. Ltd., its directors, employees, and associates shall not be liable for any direct, indirect, incidental, consequential, or punitive damages arising from:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Use of our research or recommendations</li>
            <li>Investment decisions based on our analysis</li>
            <li>Technical issues with our platform</li>
            <li>Delays in information dissemination</li>
            <li>Third-party actions or omissions</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-[#001633]">Professional Advice</h2>
          <p className="mb-4">Investors are advised to:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Consult with qualified financial advisors</li>
            <li>Conduct independent research</li>
            <li>Consider personal financial situation</li>
            <li>Diversify investment portfolio</li>
            <li>Review investment objectives regularly</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-[#001633]">Regulatory Information</h2>
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <p className="mb-2"><strong>SEBI Registration:</strong> INH000022552</p>
            <p className="mb-2"><strong>Validity:</strong> Aug 06, 2025 - Aug 05, 2030</p>
            <p className="mb-2"><strong>Type:</strong> Non-Individual Research Analyst</p>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-[#001633]">Contact Information</h2>
          <p className="mb-4">For any clarifications or concerns:</p>
          <p className="mb-2"><strong>Email:</strong> compliance@rangaone.finance</p>
          <p className="mb-2"><strong>Phone:</strong> +91-93261 99388</p>
        </section>
    </PolicyLayout>
  )
}