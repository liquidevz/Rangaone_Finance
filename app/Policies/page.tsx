"use client"

import DashboardLayout from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Shield, CreditCard, Phone, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function PoliciesIndex() {
  const policies = [
    {
      title: "Terms and Conditions",
      description: "Our comprehensive terms of service, user responsibilities, and service agreements.",
      icon: FileText,
      href: "/Policies/terms-and-conditions",
      color: "bg-blue-50 text-blue-600"
    },
    {
      title: "Privacy Policy",
      description: "How we collect, use, and protect your personal information and data.",
      icon: Shield,
      href: "/Policies/privacy-policy",
      color: "bg-green-50 text-green-600"
    },
    {
      title: "Cancellations & Refunds",
      description: "Our cancellation policy, refund procedures, and eligibility criteria.",
      icon: CreditCard,
      href: "/Policies/cancellations-refunds",
      color: "bg-orange-50 text-orange-600"
    },
    {
      title: "Contact Us",
      description: "Get in touch with our support team for any questions or assistance.",
      icon: Phone,
      href: "/Policies/contact-us",
      color: "bg-purple-50 text-purple-600"
    }
  ]

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="bg-indigo-900 text-[#FFFFF0] py-8 px-8 rounded-lg shadow-md text-center">
          <h1 className="text-4xl font-bold mb-2">Policies & Information</h1>
          <p className="text-lg opacity-90">
            Important information about our services, policies, and how to reach us
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {policies.map((policy, index) => {
            const IconComponent = policy.icon
            return (
              <Card key={index} className="hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-3 rounded-lg ${policy.color}`}>
                      <IconComponent size={24} />
                    </div>
                    <CardTitle className="text-xl">{policy.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-gray-600 mb-4 leading-relaxed">
                    {policy.description}
                  </p>
                  <Link href={policy.href}>
                    <Button className="w-full bg-indigo-900 hover:bg-indigo-800 group">
                      Read More
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <Card className="bg-gray-50">
          <CardContent className="p-8">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold text-indigo-900">Need Help?</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                If you have any questions about our policies or need assistance with our services, 
                don't hesitate to reach out to our support team.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/Policies/contact-us">
                  <Button className="bg-green-600 hover:bg-green-700">
                    <Phone className="mr-2 h-4 w-4" />
                    Contact Support
                  </Button>
                </Link>
                <Button 
                  variant="outline"
                  onClick={() => window.open("https://wa.me/918319648459", "_blank")}
                >
                  WhatsApp Us
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Important Disclaimers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-gray-700">
            <p>
              <strong>SEBI Registration:</strong> RangaOne FINWALA is a SEBI Registered Research Analyst 
              (Registration No: INH000013350). Registration granted by SEBI and certification from NISM 
              in no way guarantee performance of the intermediary or provide any assurance of returns to investors.
            </p>
            <p>
              <strong>Investment Warning:</strong> Investment in securities market are subject to market risks. 
              Read all the related documents carefully before investing. Past performance does not guarantee future results.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.open("https://www.scores.gov.in", "_blank")}
              >
                SCORES Portal
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.open("https://smartodr.in", "_blank")}
              >
                ODR Portal
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}