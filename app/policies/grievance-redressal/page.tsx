import PolicyLayout from "@/components/policy-layout"

export default function GrievanceRedressalPage() {
  return (
    <PolicyLayout title="Grievance Redressal">
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-[#001633]">Our Commitment</h2>
          <p className="mb-4">RangaOne Finwala Pvt. Ltd. is committed to providing excellent service to all our clients. We have established a comprehensive grievance redressal mechanism to address any concerns or complaints you may have.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-[#001633]">How to File a Complaint</h2>
          <p className="mb-4">You can register your complaint through the following channels:</p>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Email:</strong> compliance@rangaone.finance</li>
            <li><strong>Phone:</strong> +91-93261 99388</li>
            <li><strong>Written Communication:</strong> 004 Ambika Darshan, Shivaji Nagar, Sahargaon, Mumbai Suburban, Maharashtra, MUMBAI, MAHARASHTRA, 400099</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-[#001633]">Grievance Officer</h2>
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <p className="mb-2"><strong>Name:</strong> Ms. Sanika Karnik</p>
            <p className="mb-2"><strong>Email:</strong> sanika.official11@gmail.com</p>
            <p className="mb-2"><strong>Phone:</strong> +91-93261 99388</p>
            <p className="mb-2"><strong>Timing:</strong> Monday - Friday (10am-6pm)</p>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-[#001633]">Resolution Timeline</h2>
          <p className="mb-4">We are committed to resolving your complaints in a timely manner:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Acknowledgment within 24 hours of receipt</li>
            <li>Resolution within 7 working days for standard complaints</li>
            <li>Complex matters may take up to 30 days</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-[#001633]">Escalation Process</h2>
          <p className="mb-4">If you are not satisfied with our resolution, you may escalate to:</p>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>SEBI SCORES Portal:</strong> <a href="https://www.scores.gov.in" className="text-[#1e3a8a] hover:underline">www.scores.gov.in</a></li>
            <li><strong>ODR Portal:</strong> <a href="https://www.smartodr.in" className="text-[#1e3a8a] hover:underline">www.smartodr.in</a></li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-[#001633]">Information Required</h2>
          <p className="mb-4">When filing a complaint, please provide:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Your name and contact details</li>
            <li>Account/Client ID (if applicable)</li>
            <li>Nature of complaint with specific details</li>
            <li>Supporting documents (if any)</li>
            <li>Expected resolution</li>
          </ul>
        </section>
    </PolicyLayout>
  )
}