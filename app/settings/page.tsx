"use client"

import { useState } from "react"
import DashboardLayout from "@/components/dashboard-layout"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import ProfileSettings from "@/components/settings/profile-settings"
import PortfolioSettings from "@/components/settings/portfolio-settings"
import SubscriptionSettings from "@/components/settings/subscription-settings"
import PaymentSettings from "@/components/settings/payment-settings"
import { User, Settings, Briefcase, CreditCard } from "lucide-react"
import { PageHeader } from "@/components/page-header"

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile")

  return (
    <DashboardLayout>
      <div className="flex flex-col w-full gap-4 sm:gap-6 max-w-6xl mx-auto">
        <PageHeader 
          title="Account Settings" 
          subtitle="Manage your account preferences and information"
          size="lg"
        />

        <Card className="overflow-hidden" data-tour="settings-panel">
          <Tabs defaultValue="profile" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="border-b border-gray-200">
              <div className="overflow-x-auto scrollbar-hide">
                <TabsList className="bg-transparent p-0 h-auto flex w-max min-w-full justify-start">
                  <TabsTrigger
                    value="profile"
                    className="flex items-center py-3 px-3 sm:py-4 sm:px-6 text-sm sm:text-base whitespace-nowrap data-[state=active]:border-b-2 data-[state=active]:border-indigo-900 data-[state=active]:text-indigo-900 data-[state=active]:font-medium rounded-none data-[state=active]:shadow-none data-[state=active]:bg-transparent hover:bg-gray-50 transition-colors"
                  >
                    <User className="h-4 w-4 mr-1.5 sm:mr-2 flex-shrink-0" />
                    <span className="hidden xs:inline">Profile</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="portfolios"
                    className="flex items-center py-3 px-3 sm:py-4 sm:px-6 text-sm sm:text-base whitespace-nowrap data-[state=active]:border-b-2 data-[state=active]:border-indigo-900 data-[state=active]:text-indigo-900 data-[state=active]:font-medium rounded-none data-[state=active]:shadow-none data-[state=active]:bg-transparent hover:bg-gray-50 transition-colors"
                  >
                    <Briefcase className="h-4 w-4 mr-1.5 sm:mr-2 flex-shrink-0" />
                    <span className="hidden xs:inline">Portfolios</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="subscriptions"
                    className="flex items-center py-3 px-3 sm:py-4 sm:px-6 text-sm sm:text-base whitespace-nowrap data-[state=active]:border-b-2 data-[state=active]:border-indigo-900 data-[state=active]:text-indigo-900 data-[state=active]:font-medium rounded-none data-[state=active]:shadow-none data-[state=active]:bg-transparent hover:bg-gray-50 transition-colors"
                  >
                    <Settings className="h-4 w-4 mr-1.5 sm:mr-2 flex-shrink-0" />
                    <span className="hidden xs:inline">Subscriptions</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="payments"
                    className="flex items-center py-3 px-3 sm:py-4 sm:px-6 text-sm sm:text-base whitespace-nowrap data-[state=active]:border-b-2 data-[state=active]:border-indigo-900 data-[state=active]:text-indigo-900 data-[state=active]:font-medium rounded-none data-[state=active]:shadow-none data-[state=active]:bg-transparent hover:bg-gray-50 transition-colors"
                  >
                    <CreditCard className="h-4 w-4 mr-1.5 sm:mr-2 flex-shrink-0" />
                    <span className="hidden xs:inline">Payments</span>
                  </TabsTrigger>
                </TabsList>
              </div>
            </div>

            <TabsContent value="profile" className="p-3 sm:p-6">
              <ProfileSettings />
            </TabsContent>

            <TabsContent value="portfolios" className="p-3 sm:p-6">
              <PortfolioSettings />
            </TabsContent>

            <TabsContent value="subscriptions" className="p-3 sm:p-6">
              <SubscriptionSettings />
            </TabsContent>

            <TabsContent value="payments" className="p-3 sm:p-6">
              <PaymentSettings />
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </DashboardLayout>
  )
}
