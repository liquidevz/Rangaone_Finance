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
        <h2 className="text-2xl font-semibold mb-4 text-[#001633]">Contact Us</h2>
        <p className="mb-4">For privacy-related questions or concerns:</p>
        <p className="mb-2"><strong>Email:</strong> compliance@rangaone.finance</p>
        <p className="mb-2"><strong>Phone:</strong> +91-93261 99388</p>
      </section>
    </PolicyLayout>
  )
}