import PolicyLayout from "@/components/policy-layout"

export default function PMLAAMLPolicyPage() {
  return (
    <PolicyLayout title="PMLA (AML) Policy">
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-[#001633]">Introduction</h2>
          <p className="mb-4">RangaOne Finwala Pvt. Ltd. is committed to preventing money laundering and terrorist financing. This Anti-Money Laundering (AML) Policy is designed to comply with the Prevention of Money Laundering Act (PMLA), 2002, and related regulations.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-[#001633]">Objective</h2>
          <p className="mb-4">Our AML policy aims to:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Prevent money laundering and terrorist financing</li>
            <li>Ensure compliance with regulatory requirements</li>
            <li>Maintain the integrity of the financial system</li>
            <li>Protect our business from financial crimes</li>
            <li>Report suspicious transactions to authorities</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-[#001633]">Customer Due Diligence (CDD)</h2>
          <h3 className="text-xl font-semibold mb-3 text-[#001633]">Know Your Customer (KYC) Requirements</h3>
          <p className="mb-4">We implement comprehensive KYC procedures:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Identity verification using government-issued documents</li>
            <li>Address verification through utility bills or bank statements</li>
            <li>PAN card verification for tax compliance</li>
            <li>Bank account verification</li>
            <li>Source of income documentation</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3 text-[#001633]">Enhanced Due Diligence (EDD)</h3>
          <p className="mb-4">For high-risk customers, we conduct enhanced due diligence:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Additional documentation requirements</li>
            <li>Senior management approval</li>
            <li>Enhanced monitoring of transactions</li>
            <li>Regular review of customer profile</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-[#001633]">Risk Assessment</h2>
          <p className="mb-4">We assess money laundering risks based on:</p>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Customer Risk:</strong> Profile, location, business activities</li>
            <li><strong>Product Risk:</strong> Nature of services provided</li>
            <li><strong>Geographic Risk:</strong> High-risk jurisdictions</li>
            <li><strong>Transaction Risk:</strong> Unusual patterns or amounts</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-[#001633]">Transaction Monitoring</h2>
          <p className="mb-4">We monitor transactions for suspicious activities:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Unusual transaction patterns</li>
            <li>Transactions inconsistent with customer profile</li>
            <li>Large cash transactions</li>
            <li>Rapid movement of funds</li>
            <li>Transactions with high-risk jurisdictions</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-[#001633]">Suspicious Transaction Reporting</h2>
          <p className="mb-4">We report suspicious transactions to the Financial Intelligence Unit (FIU-IND) when:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Transactions appear suspicious or unusual</li>
            <li>Customer behavior raises concerns</li>
            <li>Transactions lack economic rationale</li>
            <li>Documentation appears fraudulent</li>
          </ul>
          <p className="mb-4">Reports are filed within the prescribed timelines as per regulatory requirements.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-[#001633]">Record Keeping</h2>
          <p className="mb-4">We maintain comprehensive records:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Customer identification documents</li>
            <li>Transaction records and supporting documents</li>
            <li>Correspondence with customers</li>
            <li>Risk assessment documentation</li>
            <li>Training records</li>
          </ul>
          <p className="mb-4">Records are maintained for a minimum of 5 years as required by law.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-[#001633]">Employee Training</h2>
          <p className="mb-4">All employees receive regular training on:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>AML laws and regulations</li>
            <li>Identification of suspicious activities</li>
            <li>Customer due diligence procedures</li>
            <li>Reporting requirements</li>
            <li>Record keeping obligations</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-[#001633]">Compliance Officer</h2>
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <p className="mb-2"><strong>Name:</strong> Ms. Sanika Karnik</p>
            <p className="mb-2"><strong>Email:</strong> compliance@rangaone.finance</p>
            <p className="mb-2"><strong>Phone:</strong> +91-93261 99388</p>
            <p className="mb-2"><strong>Responsibilities:</strong> Overseeing AML compliance, training, and reporting</p>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-[#001633]">Policy Review</h2>
          <p className="mb-4">This policy is reviewed annually and updated as necessary to ensure compliance with current regulations and best practices.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-[#001633]">Contact Information</h2>
          <p className="mb-4">For AML-related queries:</p>
          <p className="mb-2"><strong>Email:</strong> compliance@rangaone.finance</p>
          <p className="mb-2"><strong>Phone:</strong> +91-93261 99388</p>
        </section>
    </PolicyLayout>
  )
}