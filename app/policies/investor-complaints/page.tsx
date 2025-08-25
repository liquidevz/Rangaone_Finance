"use client";
import PolicyLayout from "@/components/policy-layout"

export default function InvestorComplaintsPage() {
  return (
    <PolicyLayout title="Investor Complaints">
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-[#001633]">How to File a Complaint</h2>
          <p className="mb-4">We are committed to resolving your concerns promptly and fairly. You can file a complaint through multiple channels:</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-[#001633]">Step 1: Direct Contact</h2>
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 mb-4">
            <div className="flex items-start gap-3 mb-6">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">👤</span>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-blue-900 mb-3">Primary Contact</h3>
                <div className="space-y-2">
                  <p className="text-blue-800"><strong>Grievance Officer:</strong> Ms. Sanika Karnik</p>
                  <p className="text-blue-800"><strong>Email:</strong> sanika.official11@gmail.com</p>
                  <p className="text-blue-800"><strong>Phone:</strong> +91-93261 99388</p>
                  <p className="text-blue-800"><strong>Timing:</strong> Monday - Friday (10am-6pm)</p>
                </div>
              </div>
            </div>
            
            <div className="border-t border-blue-200 pt-4">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">Alternative Contacts</h3>
              <div className="space-y-2">
                <p className="text-blue-800"><strong>General Support:</strong> Support@rangaone.finance</p>
                <p className="text-blue-800"><strong>Compliance:</strong> compliance@rangaone.finance</p>
                <p className="text-blue-800"><strong>Customer Care:</strong> +91-91676 94966</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-[#001633]">Step 2: Written Complaint</h2>
          <p className="mb-4">You can send a written complaint to our registered office:</p>
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <p className="mb-2"><strong>Address:</strong></p>
            <p className="mb-1">RangaOne Finwala Pvt. Ltd.</p>
            <p className="mb-1">004 Ambika Darshan, Shivaji Nagar</p>
            <p className="mb-1">Sahargaon, Mumbai Suburban</p>
            <p className="mb-1">Maharashtra, MUMBAI, MAHARASHTRA</p>
            <p>400099</p>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-[#001633]">Information Required</h2>
          <p className="mb-4">When filing a complaint, please provide the following information:</p>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Personal Details:</strong> Name, contact number, email address</li>
            <li><strong>Account Information:</strong> Client ID or account number (if applicable)</li>
            <li><strong>Complaint Details:</strong> Nature of complaint with specific details</li>
            <li><strong>Timeline:</strong> When the issue occurred</li>
            <li><strong>Supporting Documents:</strong> Any relevant documents or screenshots</li>
            <li><strong>Expected Resolution:</strong> What outcome you are seeking</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-[#001633]">Resolution Timeline</h2>
          <div className="bg-green-50 p-4 rounded-lg mb-4">
            <ul className="list-disc pl-6">
              <li><strong>Acknowledgment:</strong> Within 24 hours of receipt</li>
              <li><strong>Initial Response:</strong> Within 3 working days</li>
              <li><strong>Resolution:</strong> Within 7 working days for standard complaints</li>
              <li><strong>Complex Issues:</strong> Up to 30 days with regular updates</li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-[#001633]">Step 3: Regulatory Escalation</h2>
          <p className="mb-4">If you are not satisfied with our resolution, you can escalate to regulatory authorities:</p>
          
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div className="bg-red-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">SEBI SCORES Portal</h3>
              <p className="mb-2">Securities and Exchange Board of India</p>
              <p className="mb-2"><strong>Website:</strong> <a href="https://www.scores.gov.in" className="text-[#1e3a8a] hover:underline">www.scores.gov.in</a></p>
              <p className="text-sm">Online complaint registration and tracking system</p>
            </div>
            
            <div className="bg-orange-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">ODR Portal</h3>
              <p className="mb-2">Online Dispute Resolution</p>
              <p className="mb-2"><strong>Website:</strong> <a href="https://www.smartodr.in" className="text-[#1e3a8a] hover:underline">www.smartodr.in</a></p>
              <p className="text-sm">Alternative dispute resolution mechanism</p>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-[#001633]">Types of Complaints We Handle</h2>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Service Quality:</strong> Issues with research quality or delivery</li>
            <li><strong>Communication:</strong> Delayed or inadequate communication</li>
            <li><strong>Billing:</strong> Incorrect charges or billing disputes</li>
            <li><strong>Technical Issues:</strong> Platform or system-related problems</li>
            <li><strong>Recommendations:</strong> Concerns about investment advice</li>
            <li><strong>Account Management:</strong> Account access or management issues</li>
            <li><strong>Compliance:</strong> Regulatory or ethical concerns</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-[#001633]">Our Commitment</h2>
          <div className="bg-blue-50 p-4 rounded-lg mb-4">
            <ul className="list-disc pl-6">
              <li>Fair and impartial handling of all complaints</li>
              <li>Prompt acknowledgment and regular updates</li>
              <li>Thorough investigation of issues</li>
              <li>Transparent communication throughout the process</li>
              <li>No retaliation against complainants</li>
              <li>Continuous improvement based on feedback</li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-[#001633]">Complaint Tracking</h2>
          <p className="mb-4">Once you file a complaint, you will receive:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Unique complaint reference number</li>
            <li>Acknowledgment email/SMS</li>
            <li>Regular status updates</li>
            <li>Final resolution communication</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-[#001633]">Prevention is Better</h2>
          <p className="mb-4">To avoid issues, we recommend:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Read all terms and conditions carefully</li>
            <li>Keep your contact information updated</li>
            <li>Regularly review your account statements</li>
            <li>Contact us immediately if you notice any discrepancies</li>
            <li>Provide feedback to help us improve our services</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-[#001633]">Contact Summary</h2>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="mb-2"><strong>Primary Contact:</strong> Ms. Sanika Karnik - sanika.official11@gmail.com</p>
            <p className="mb-2"><strong>Phone:</strong> +91-93261 99388</p>
            <p className="mb-2"><strong>Customer Care:</strong> +91-91676 94966</p>
            <p className="mb-2"><strong>Email:</strong> Support@rangaone.finance</p>
            <p><strong>Timing:</strong> Monday - Friday (10am-6pm)</p>
          </div>
        </section>
    </PolicyLayout>
  )
}