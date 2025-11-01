"use client";
import PolicyLayout from "@/components/policy-layout"

export default function GrievanceRedressalPage() {
  return (
    <PolicyLayout title="Redressal of Grievance">
      <div className="mb-6">
        <p className="mb-4">At RANGAONE FINWALA PRIVATE LIMITED, client satisfaction and trust are of utmost importance. In case of any grievance or feedback, clients may follow the below process:</p>
      </div>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-[#001633]">Step 1: Initial Complaint</h2>
        <ul className="list-disc pl-6 mb-4">
          <li>If you are not satisfied with our services, please first contact your assigned representative/consultant from the Research Analyst Department, who is your primary point of contact.</li>
          <li>You may raise your complaint through telephone, email, or in person.</li>
          <li>We will make best efforts to resolve your complaint within 7 to 10 working days.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-[#001633]">Step 2: Written Complaint</h2>
        <ul className="list-disc pl-6 mb-4">
          <li>Alternatively, you may send us a complaint in writing or via email at:</li>
        </ul>
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 mb-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">📧</span>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-blue-900 mb-2">Contact Information</p>
              <div className="space-y-1">
                <p className="text-blue-800"><strong>Email:</strong> Sanika.official11@gmail.com</p>
                <p className="text-blue-800"><strong>Phone:</strong> +91 93261 99388</p>
              </div>
            </div>
          </div>
        </div>
        <ul className="list-disc pl-6 mb-4">
          <li>We will acknowledge receipt of your complaint and aim to resolve it within 7 to 10 working days.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-[#001633]">Step 3: Escalation</h2>
        <ul className="list-disc pl-6 mb-4">
          <li>If you are still not satisfied with the response or handling of your complaint, you may escalate the matter by writing to:</li>
        </ul>
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-6 mb-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">👤</span>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-purple-900 mb-2">Grievance Officer Details</p>
              <div className="space-y-1">
                <p className="text-purple-800"><strong>Name:</strong> Ms. Sanika</p>
                <p className="text-purple-800"><strong>Designation:</strong> Compliance & Grievance Officer</p>
                <p className="text-purple-800"><strong>Email:</strong> Sanika.official11@gmail.com</p>
                <p className="text-purple-800"><strong>Phone:</strong> +91 93261 99388</p>
              </div>
            </div>
          </div>
        </div>
        <ul className="list-disc pl-6 mb-4">
          <li>The Grievance Officer will review the matter and respond to you at the earliest.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-[#001633]">Step 4: SEBI SCORES Portal</h2>
        <ul className="list-disc pl-6 mb-4">
          <li>If your complaint is not resolved within 30 days, you may lodge your complaint with the regulator, The Securities and Exchange Board of India (SEBI), through its centralized web-based complaints redressal system – SCORES.</li>
          <li><strong>SCORES Portal Link:</strong> <a href="https://scores.sebi.gov.in/scores/complaintRegister.html" className="text-[#1e3a8a] hover:underline" target="_blank" 
    rel="noopener noreferrer">https://scores.sebi.gov.in/scores/complaintRegister.html</a></li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-[#001633]">Step 5: Online Dispute Resolution (ODR)</h2>
        <ul className="list-disc pl-6 mb-4">
          <li>If your complaint is not resolved on the SCORES portal, you may initiate the dispute resolution process through SEBI's Smart ODR Platform.</li>
          <li><strong>Smart ODR Portal Link:</strong> <a href="https://smartodr.in/login" className="text-[#1e3a8a] hover:underline" target="_blank" 
    rel="noopener noreferrer">https://smartodr.in/login</a></li>
        </ul>
      </section>
    </PolicyLayout>
  )
}