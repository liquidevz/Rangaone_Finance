"use client"

import PublicLayout from "@/components/public-layout"
import { Card, CardContent } from "@/components/ui/card"
import { AlertTriangle, Clock, CreditCard } from "lucide-react"
import { PageHeader } from "@/components/page-header"

export default function CancellationsRefunds() {
  return (
    <PublicLayout>
      <div className="space-y-6">
        <PageHeader 
          title="Cancellations & Refunds Policy" 
          subtitle={`Last updated: ${new Date().toLocaleDateString()}`}
          showBackButton={false}
          size="lg"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="text-center">
            <CardContent className="p-4">
              <Clock className="mx-auto mb-2 text-indigo-900" size={32} />
              <h3 className="font-bold">24-Hour Window</h3>
              <p className="text-sm text-gray-600">Cancel within 24 hours for full refund</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-4">
              <CreditCard className="mx-auto mb-2 text-indigo-900" size={32} />
              <h3 className="font-bold">Easy Process</h3>
              <p className="text-sm text-gray-600">Simple cancellation via support</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-4">
              <AlertTriangle className="mx-auto mb-2 text-indigo-900" size={32} />
              <h3 className="font-bold">Fair Policy</h3>
              <p className="text-sm text-gray-600">Transparent terms and conditions</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-4 md:p-8 space-y-6">
            <section>
              <h2 className="text-2xl font-bold mb-4 text-indigo-900">1. Subscription Cancellation</h2>
              <div className="bg-blue-50 p-4 rounded-lg mb-4">
                <h3 className="font-bold text-lg mb-2">24-Hour Cancellation Window</h3>
                <p className="text-gray-700 leading-relaxed">
                  You may cancel your subscription within 24 hours of purchase for a full refund, 
                  provided you have not accessed premium content or services.
                </p>
              </div>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Cancellation requests must be submitted within 24 hours of purchase</li>
                <li>Full refund will be processed within 5-7 business days</li>
                <li>Refund will be credited to the original payment method</li>
                <li>Access to premium services will be immediately revoked</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-indigo-900">2. Refund Eligibility</h2>
              <div className="space-y-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-bold text-green-800 mb-2">Eligible for Refund:</h3>
                  <ul className="list-disc pl-6 text-gray-700 space-y-1">
                    <li>Cancellation within 24 hours of purchase</li>
                    <li>Technical issues preventing service access</li>
                    <li>Duplicate payments or billing errors</li>
                    <li>Service not delivered as promised</li>
                  </ul>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <h3 className="font-bold text-red-800 mb-2">Not Eligible for Refund:</h3>
                  <ul className="list-disc pl-6 text-gray-700 space-y-1">
                    <li>Cancellation after 24 hours with service usage</li>
                    <li>Change of mind after accessing premium content</li>
                    <li>Market losses based on recommendations</li>
                    <li>Partial subscription periods</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-indigo-900">3. How to Cancel</h2>
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="font-bold mb-3">Step-by-Step Cancellation Process:</h3>
                <ol className="list-decimal pl-6 text-gray-700 space-y-2">
                  <li>Contact our support team via email or phone</li>
                  <li>Provide your subscription details and reason for cancellation</li>
                  <li>Receive confirmation of cancellation request</li>
                  <li>Refund processed within 5-7 business days (if eligible)</li>
                </ol>
              </div>
              <div className="mt-4 p-4 border-l-4 border-indigo-900">
                <p className="text-gray-700">
                  <strong>Contact Information:</strong><br />
                  Email: support@RangaOnefinwala.com<br />
                  Phone: +91-8319648459<br />
                  WhatsApp: +91-8319648459
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-indigo-900">4. Auto-Renewal Cancellation</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                To prevent auto-renewal of your subscription:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Cancel at least 24 hours before the renewal date</li>
                <li>You will retain access until the current billing period ends</li>
                <li>No refund for the current billing period</li>
                <li>Confirmation email will be sent upon successful cancellation</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-indigo-900">5. Refund Processing</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-bold mb-2">Processing Time</h3>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>Credit/Debit Cards: 5-7 business days</li>
                    <li>Net Banking: 3-5 business days</li>
                    <li>UPI/Wallets: 1-3 business days</li>
                    <li>Bank transfers may take additional time</li>
                  </ul>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h3 className="font-bold mb-2">Important Notes</h3>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>Refunds processed to original payment method</li>
                    <li>Processing fees may be deducted</li>
                    <li>Email confirmation sent upon processing</li>
                    <li>Contact support for refund status</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-indigo-900">6. Partial Refunds</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                In exceptional circumstances, partial refunds may be considered:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Service disruption for extended periods</li>
                <li>Technical issues affecting service quality</li>
                <li>Billing errors or overcharges</li>
                <li>Each case evaluated individually</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-indigo-900">7. Dispute Resolution</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                If you're not satisfied with our refund decision:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Contact our grievance officer</li>
                <li>Provide detailed explanation of your concern</li>
                <li>We will review and respond within 7 business days</li>
                <li>Escalate to SEBI if needed (SCORES portal)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-indigo-900">8. Contact for Cancellations</h2>
              <div className="bg-indigo-50 p-6 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-bold mb-2">Support Team</h3>
                    <p className="text-gray-700">Email: support@RangaOnefinwala.com</p>
                    <p className="text-gray-700">Phone: +91-8319648459</p>
                    <p className="text-gray-700">WhatsApp: +91-8319648459</p>
                  </div>
                  <div>
                    <h3 className="font-bold mb-2">Business Hours</h3>
                    <p className="text-gray-700">Monday - Friday: 9:00 AM - 6:00 PM</p>
                    <p className="text-gray-700">Saturday: 10:00 AM - 2:00 PM</p>
                    <p className="text-gray-700">Sunday: Closed</p>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-indigo-900">9. Policy Updates</h2>
              <p className="text-gray-700 leading-relaxed">
                This policy may be updated periodically. Changes will be communicated via email and posted on our website. 
                Continued use of our services after policy updates constitutes acceptance of the revised terms.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </PublicLayout>
  )
}