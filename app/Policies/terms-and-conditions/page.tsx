"use client"

import DashboardLayout from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function TermsAndConditions() {
  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-indigo-900 text-[#FFFFF0] py-6 px-8 rounded-lg shadow-md">
          <h1 className="text-3xl font-bold text-center">Terms and Conditions</h1>
          <p className="text-center mt-2">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        <Card>
          <CardContent className="p-8 space-y-6">
            <section>
              <h2 className="text-2xl font-bold mb-4 text-indigo-900">1. Acceptance of Terms</h2>
              <p className="text-gray-700 leading-relaxed">
                By accessing and using RangaOne FINWALA services, you accept and agree to be bound by these Terms and Conditions. 
                If you do not agree to these terms, please do not use our services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-indigo-900">2. Services Description</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                RangaOne FINWALA provides investment advisory services including:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Stock recommendations and analysis</li>
                <li>Portfolio management advisory</li>
                <li>Market research and insights</li>
                <li>Investment education and webinars</li>
                <li>IPO advisory services</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-indigo-900">3. SEBI Registration</h2>
              <p className="text-gray-700 leading-relaxed">
                RangaOne FINWALA is a SEBI Registered Research Analyst (Registration No: INH000013350). 
                All services are provided in compliance with SEBI regulations and guidelines.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-indigo-900">4. Investment Risks</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                <strong>Important:</strong> All investments in securities markets are subject to market risks. 
                Past performance does not guarantee future results. You should:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Read all related documents carefully before investing</li>
                <li>Consult with your financial advisor</li>
                <li>Invest only what you can afford to lose</li>
                <li>Understand that market values can fluctuate</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-indigo-900">5. User Responsibilities</h2>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Provide accurate and complete information</li>
                <li>Maintain confidentiality of your account credentials</li>
                <li>Use services only for lawful purposes</li>
                <li>Comply with all applicable laws and regulations</li>
                <li>Make independent investment decisions</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-indigo-900">6. Subscription and Payments</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                Subscription fees are charged as per the selected plan. Payment terms include:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Fees are non-refundable unless specified otherwise</li>
                <li>Subscriptions auto-renew unless cancelled</li>
                <li>Price changes will be communicated in advance</li>
                <li>Failed payments may result in service suspension</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-indigo-900">7. Limitation of Liability</h2>
              <p className="text-gray-700 leading-relaxed">
                RangaOne FINWALA shall not be liable for any direct, indirect, incidental, or consequential damages 
                arising from the use of our services or investment decisions made based on our recommendations.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-indigo-900">8. Intellectual Property</h2>
              <p className="text-gray-700 leading-relaxed">
                All content, research reports, and materials provided are proprietary to RangaOne FINWALA and 
                protected by intellectual property laws. Unauthorized reproduction or distribution is prohibited.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-indigo-900">9. Termination</h2>
              <p className="text-gray-700 leading-relaxed">
                Either party may terminate the service agreement with appropriate notice. Upon termination, 
                access to premium services will cease, but these terms shall survive termination.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-indigo-900">10. Contact Information</h2>
              <div className="text-gray-700 space-y-2">
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