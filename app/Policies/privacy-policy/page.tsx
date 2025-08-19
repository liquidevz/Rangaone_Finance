"use client"

import DashboardLayout from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function PrivacyPolicy() {
  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-indigo-900 text-[#FFFFF0] py-6 px-8 rounded-lg shadow-md">
          <h1 className="text-3xl font-bold text-center">Privacy Policy</h1>
          <p className="text-center mt-2">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        <Card>
          <CardContent className="p-8 space-y-6">
            <section>
              <h2 className="text-2xl font-bold mb-4 text-indigo-900">1. Information We Collect</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                We collect information you provide directly to us, such as:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Personal information (name, email, phone number)</li>
                <li>Financial information (investment preferences, risk profile)</li>
                <li>Account credentials and authentication data</li>
                <li>Communication preferences</li>
                <li>Transaction and subscription history</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-indigo-900">2. How We Use Your Information</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                We use your information to:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Provide personalized investment advisory services</li>
                <li>Process subscriptions and payments</li>
                <li>Send research reports and market updates</li>
                <li>Communicate about your account and services</li>
                <li>Comply with regulatory requirements</li>
                <li>Improve our services and user experience</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-indigo-900">3. Information Sharing</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                We do not sell, trade, or rent your personal information. We may share information only:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>With your explicit consent</li>
                <li>To comply with legal obligations</li>
                <li>With trusted service providers under strict confidentiality</li>
                <li>To protect our rights and prevent fraud</li>
                <li>In case of business transfer or merger</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-indigo-900">4. Data Security</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                We implement appropriate security measures to protect your information:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>SSL encryption for data transmission</li>
                <li>Secure servers and databases</li>
                <li>Regular security audits and updates</li>
                <li>Access controls and authentication</li>
                <li>Employee training on data protection</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-indigo-900">5. Cookies and Tracking</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                We use cookies and similar technologies to:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Remember your preferences and settings</li>
                <li>Analyze website usage and performance</li>
                <li>Provide personalized content</li>
                <li>Ensure security and prevent fraud</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-3">
                You can control cookie settings through your browser preferences.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-indigo-900">6. Your Rights</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                You have the right to:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Access your personal information</li>
                <li>Correct inaccurate information</li>
                <li>Request deletion of your data</li>
                <li>Opt-out of marketing communications</li>
                <li>Data portability where applicable</li>
                <li>Lodge complaints with regulatory authorities</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-indigo-900">7. Data Retention</h2>
              <p className="text-gray-700 leading-relaxed">
                We retain your information for as long as necessary to provide services and comply with legal obligations. 
                Financial records are maintained as per SEBI regulations and applicable laws.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-indigo-900">8. Third-Party Services</h2>
              <p className="text-gray-700 leading-relaxed">
                Our website may contain links to third-party services. We are not responsible for their privacy practices. 
                Please review their privacy policies before providing any information.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-indigo-900">9. Children's Privacy</h2>
              <p className="text-gray-700 leading-relaxed">
                Our services are not intended for individuals under 18 years of age. We do not knowingly collect 
                personal information from children.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-indigo-900">10. Changes to Privacy Policy</h2>
              <p className="text-gray-700 leading-relaxed">
                We may update this privacy policy periodically. Changes will be posted on this page with an updated 
                revision date. Continued use of our services constitutes acceptance of the updated policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-indigo-900">11. Contact Us</h2>
              <div className="text-gray-700 space-y-2">
                <p>For privacy-related questions or concerns, contact us at:</p>
                <p><strong>Email:</strong> compliance@RangaOnefinwala.com</p>
                <p><strong>Phone:</strong> +91-8319648459</p>
                <p><strong>Address:</strong> Office no.3, Ward No.11, Managanj, Jaithari, Post Jaithari, Anuppur, Madhya Pradesh, 484330</p>
              </div>
            </section>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}