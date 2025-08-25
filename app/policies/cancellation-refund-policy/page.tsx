"use client";
import PolicyLayout from "@/components/policy-layout"

export default function CancellationRefundPolicyPage() {
  return (
    <PolicyLayout title="Cancellation & Refund Policy">
      <div className="mb-6">
        <p className="mb-4"><strong>RangaOne Finwala Private Limited</strong></p>
        <p className="mb-4"><strong>SEBI-Registered Research Analyst (Registration No: INH000022552)</strong></p>
        <p className="mb-4"><strong>Last Updated: Aug 25, 2025</strong></p>
        <p className="mb-4">At Rangaone Finwala Private Limited, we are committed to delivering high-quality research recommendation services with transparency and fairness, in compliance with the Securities and Exchange Board of India (SEBI) (Research Analysts) Regulations, 2014, and related guidelines, including the SEBI Circular dated February 17, 2025. This refund policy outlines the conditions under which refunds may be requested for our paid services, ensuring clarity for our clients and alignment with regulatory standards.</p>
      </div>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-[#001633]">1. Scope of the Refund Policy</h2>
        <p className="mb-4">This policy applies to all paid services provided by RangaOne Finwala Private Limited, including but not limited to research reports, research recommendation subscriptions, and related services. It does not cover investment outcomes, as all investments are subject to market risks, and we do not guarantee returns or profits. Clients are advised to review our Terms and Conditions and SEBI regulations before subscribing.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-[#001633]">2. Eligibility for Refunds</h2>
        <p className="mb-4">Clients may request a refund under the following circumstances:</p>
        
        <h3 className="text-xl font-semibold mb-3 text-[#001633]">a. Non-Delivery of Services</h3>
        <ul className="list-disc pl-6 mb-4">
          <li>If we fail to deliver the agreed-upon service (e.g., research report or subscription) within the specified timeframe due to reasons within our control, a full refund for the undelivered service will be provided.</li>
        </ul>

        <h3 className="text-xl font-semibold mb-3 text-[#001633]">b. Cancellation Within Cooling-Off Period</h3>
        <ul className="list-disc pl-6 mb-4">
          <li>If you cancel your subscription or service within 7 working days from the date of payment, provided the service has not been accessed, downloaded, or utilized (e.g., viewed reports, joined Telegram Services, accessed the Dashboard on Website, etc.).</li>
        </ul>

        <h3 className="text-xl font-semibold mb-3 text-[#001633]">c. Premature Termination</h3>
        <ul className="list-disc pl-6 mb-4">
          <li>If you or RangaOne Finwala Private Limited terminates the service before the subscription period expires, you are entitled to a pro-rata refund for the unutilized full months, subject to the conditions in Section 3 (Non-Refundable Scenarios) and Section 5 (Refund Process).</li>
        </ul>

        <h3 className="text-xl font-semibold mb-3 text-[#001633]">d. Persistent Technical Issues</h3>
        <ul className="list-disc pl-6 mb-4">
          <li>If you encounter technical issues (e.g. inability to access reports or platforms) that we cannot resolve within 7 working days despite reasonable efforts, you may request a refund for the affected service period.</li>
        </ul>

        <h3 className="text-xl font-semibold mb-3 text-[#001633]">e. Regulatory Actions</h3>
        <ul className="list-disc pl-6 mb-4">
          <li>If RangaOne Finwala Private Limited's SEBI registration is suspended or cancelled due to regulatory violations, or if we cease operations due to regulatory penalties, you are entitled to a pro-rata refund for the unutilized period.</li>
        </ul>

        <h3 className="text-xl font-semibold mb-3 text-[#001633]">f. Double Payment or Overcharging</h3>
        <ul className="list-disc pl-6 mb-4">
          <li>If you are charged twice for the same service period or overcharged beyond the SEBI-prescribed fee limit (₹1,51,000 per annum per family for individual and HUF clients), the excess amount will be refunded.</li>
        </ul>

        <h3 className="text-xl font-semibold mb-3 text-[#001633]">g. Centralized Fee Collection Mechanism (CeFCoM)</h3>
        <ul className="list-disc pl-6 mb-4">
          <li>If you opt for CeFCoM and discontinue services, refunds for unutilized periods will be processed through CeFCoM in compliance with SEBI guidelines.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-[#001633]">3. Non-Refundable Scenarios</h2>
        <p className="mb-4">Refunds will not be provided in the following cases:</p>
        
        <h3 className="text-xl font-semibold mb-3 text-[#001633]">a. Dissatisfaction with Investment Outcomes</h3>
        <ul className="list-disc pl-6 mb-4">
          <li>Losses or dissatisfaction due to market performance or investment outcomes, as investments are subject to market risks.</li>
        </ul>

        <h3 className="text-xl font-semibold mb-3 text-[#001633]">b. Accessed or Utilized Services</h3>
        <ul className="list-disc pl-6 mb-4">
          <li>Services that have been fully or partially accessed, downloaded, or utilized (e.g., viewed reports or recommendations).</li>
        </ul>

        <h3 className="text-xl font-semibold mb-3 text-[#001633]">c. Partial Month Usage</h3>
        <ul className="list-disc pl-6 mb-4">
          <li>Refunds will not be provided for partially utilized months. For example, if a client subscribes on February 1, 2025, for 3 months and terminates on March 10, 2025, no refund will be provided for March 2025; refunds will apply only to full unutilized months (e.g., April 2025).</li>
        </ul>

        <h3 className="text-xl font-semibold mb-3 text-[#001633]">d. Expiry of Cooling-Off Period</h3>
        <ul className="list-disc pl-6 mb-4">
          <li>Refund requests made after the 7-day cooling-off period for cancellations, unless eligible under premature termination or other criteria in Section 2.</li>
        </ul>

        <h3 className="text-xl font-semibold mb-3 text-[#001633]">e. Client Breach of Terms</h3>
        <ul className="list-disc pl-6 mb-4">
          <li>If you engage in fraudulent activity, misuse research reports (e.g., illegal sharing), provide fraudulent KYC documents, or violate our Terms and Conditions.</li>
        </ul>

        <h3 className="text-xl font-semibold mb-3 text-[#001633]">f. Force Majeure Events</h3>
        <ul className="list-disc pl-6 mb-4">
          <li>Service disruptions due to events beyond our control, such as natural disasters, pandemics, government restrictions, or other force majeure events, as specified in our service agreement.</li>
        </ul>

        <h3 className="text-xl font-semibold mb-3 text-[#001633]">g. Non-Refundable Fees</h3>
        <ul className="list-disc pl-6 mb-4">
          <li>Administrative, onboarding, or other fees designated as non-refundable in the service agreement.</li>
        </ul>

        <h3 className="text-xl font-semibold mb-3 text-[#001633]">h. Disruptions Beyond Our Control</h3>
        <ul className="list-disc pl-6 mb-4">
          <li>Technical or operational disruptions beyond our control (e.g., third-party platform failures), provided we notify you and make reasonable efforts to resolve them. In such cases, we may extend the service period at our discretion instead of offering a refund.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-[#001633]">4. Refund Process</h2>
        <p className="mb-4">To request a refund, please follow these steps:</p>
        <ul className="list-disc pl-6 mb-4">
          <li><strong>Submit a Request:</strong> Email us at sanika.official11@gmail.com (mail to: support@rangaone.finance) or use the contact form on our website, providing:
            <ul className="list-disc pl-6 mt-2">
              <li>Your full name.</li>
              <li>Service details (e.g., subscription type, payment date).</li>
              <li>Payment reference number.</li>
              <li>Reason for the refund request.</li>
              <li>For premature termination, provide written notice at least 10 working days prior to termination to facilitate a smooth deboarding process.</li>
            </ul>
          </li>
          <li><strong>Review Period:</strong> We will review your request within 5 working days and may contact you for additional details.</li>
          <li><strong>Processing:</strong> If approved, refunds will be processed within 10 working days (or 30 days for CeFCoM-based refunds) to the original payment method (e.g., bank transfer, UPI). Cash refunds are not permitted.</li>
          <li><strong>Confirmation:</strong> You will receive a confirmation email once the refund is processed.</li>
        </ul>
        <p className="mb-4"><strong>Note:</strong> Refunds for unutilized periods are calculated on a pro-rata basis for full months only, excluding any non-refundable fees or partial months.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-[#001633]">5. Grievance Redressal</h2>
        <p className="mb-4">If you are dissatisfied with our services or the refund process, please contact our Grievance Officer:</p>
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 mb-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">👤</span>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-blue-900 mb-2">Grievance Officer</p>
              <div className="space-y-1">
                <p className="text-blue-800"><strong>Name:</strong> Sanika Karnik</p>
                <p className="text-blue-800"><strong>Email:</strong> sanika.official11@gmail.com</p>
                <p className="text-blue-800"><strong>Phone:</strong> +91 9326199388</p>
              </div>
            </div>
          </div>
        </div>
        <p className="mb-4">If your concern remains unresolved, you may escalate it to SEBI's Complaints Redress System (SCORES) at <a href="https://scores.sebi.gov.in" className="text-[#1e3a8a] hover:underline">https://scores.sebi.gov.in</a> or contact SEBI's toll-free helpline at 1800 266 7575 or 1800 22 7575.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-[#001633]">6. Centralized Fee Collection Mechanism (CeFCoM)</h2>
        <p className="mb-4">For clients opting for CeFCoM, all fee payments and refunds will be processed through this SEBI-mandated platform. If you discontinue services, refunds for unutilized periods will be handled via CeFCoM, ensuring compliance with regulatory standards. Please contact us for details on opting into CeFCoM.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-[#001633]">7. Policy Updates</h2>
        <p className="mb-4">We reserve the right to update this refund policy to comply with SEBI regulations or business requirements. The latest version will be available on our website (<a href="https://rangaone.finance/refund-policy/" className="text-[#1e3a8a] hover:underline">https://rangaone.finance/refund-policy/</a>) with the "Last Updated" date indicated. Clients are encouraged to review the policy periodically.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-[#001633]">8. Contact Us</h2>
        <p className="mb-4">For questions or assistance regarding this refund policy, please reach out to:</p>
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6 mb-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">📞</span>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-green-900 mb-3">Contact Information</p>
              <div className="space-y-2">
                <p className="text-green-800"><strong>Email:</strong> sanika.official11@gmail.com / support@rangaone.finance</p>
                <p className="text-green-800"><strong>Phone:</strong> +91 93261 99388</p>
                <p className="text-green-800"><strong>Address:</strong> 004, Ambika Darshan, Shivaji Nagar, Sahargaon, Mumbai, Maharashtra, 400099</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-[#001633]">Disclaimer</h2>
        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-l-4 border-amber-400 p-6 rounded-r-lg shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center mt-0.5">
              <span className="text-white text-sm font-bold">!</span>
            </div>
            <div>
              <p className="text-amber-700">This refund policy is subject to our full Terms and Conditions and SEBI regulations. Investment in securities is subject to market risks, and past performance is not indicative of future results. Please read all related documents carefully before subscribing to our services.</p>
            </div>
          </div>
        </div>
      </section>
    </PolicyLayout>
  )
}