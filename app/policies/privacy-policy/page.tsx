import PolicyLayout from "@/components/policy-layout"

export default function PrivacyPolicyPage() {
  return (
    <PolicyLayout title="Privacy Policy">
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-[#001633]">Introduction</h2>
          <p className="mb-4">RangaOne Finwala Pvt. Ltd. ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our services.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-[#001633]">Information We Collect</h2>
          <h3 className="text-xl font-semibold mb-3 text-[#001633]">Personal Information</h3>
          <ul className="list-disc pl-6 mb-4">
            <li>Name, email address, phone number</li>
            <li>Financial information and investment preferences</li>
            <li>Identity verification documents</li>
            <li>Bank account details for transactions</li>
          </ul>
          
          <h3 className="text-xl font-semibold mb-3 text-[#001633]">Technical Information</h3>
          <ul className="list-disc pl-6 mb-4">
            <li>IP address and browser information</li>
            <li>Device information and operating system</li>
            <li>Usage patterns and preferences</li>
            <li>Cookies and tracking technologies</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-[#001633]">How We Use Your Information</h2>
          <ul className="list-disc pl-6 mb-4">
            <li>Provide investment research and advisory services</li>
            <li>Process transactions and maintain accounts</li>
            <li>Communicate important updates and recommendations</li>
            <li>Comply with regulatory requirements</li>
            <li>Improve our services and user experience</li>
            <li>Prevent fraud and ensure security</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-[#001633]">Information Sharing</h2>
          <p className="mb-4">We may share your information with:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Regulatory authorities as required by law</li>
            <li>Service providers who assist in our operations</li>
            <li>Legal advisors and auditors</li>
            <li>Law enforcement agencies when legally required</li>
          </ul>
          <p className="mb-4">We do not sell, trade, or rent your personal information to third parties for marketing purposes.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-[#001633]">Data Security</h2>
          <p className="mb-4">We implement appropriate security measures to protect your information:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Encryption of sensitive data</li>
            <li>Secure servers and firewalls</li>
            <li>Regular security audits</li>
            <li>Access controls and authentication</li>
            <li>Employee training on data protection</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-[#001633]">Your Rights</h2>
          <p className="mb-4">You have the right to:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Access your personal information</li>
            <li>Correct inaccurate information</li>
            <li>Request deletion of your data</li>
            <li>Opt-out of marketing communications</li>
            <li>File complaints with regulatory authorities</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-[#001633]">Data Retention</h2>
          <p className="mb-4">We retain your information for as long as necessary to:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Provide our services</li>
            <li>Comply with legal obligations</li>
            <li>Resolve disputes</li>
            <li>Enforce our agreements</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-[#001633]">Cookies Policy</h2>
          <p className="mb-4">We use cookies to enhance your experience. You can control cookie settings through your browser preferences.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-[#001633]">Updates to Privacy Policy</h2>
          <p className="mb-4">We may update this Privacy Policy periodically. We will notify you of significant changes through our website or email.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-[#001633]">Contact Us</h2>
          <p className="mb-4">For privacy-related questions or concerns:</p>
          <p className="mb-2"><strong>Email:</strong> compliance@rangaone.finance</p>
          <p className="mb-2"><strong>Phone:</strong> +91-93261 99388</p>
          <p className="mb-2"><strong>Address:</strong> 004 Ambika Darshan, Shivaji Nagar, Sahargaon, Mumbai Suburban, Maharashtra, 400099</p>
        </section>
    </PolicyLayout>
  )
}