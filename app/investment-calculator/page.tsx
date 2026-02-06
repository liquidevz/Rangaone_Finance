"use client";

import DashboardLayout from "@/components/dashboard-layout";
import { PageHeader } from '@/components/page-header';
import { InvestmentCalculator } from "@/components/investment-calculator";
import { ExistingInvestorCalculator } from "@/components/existing-investor-calculator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserPlus, Users } from "lucide-react";

export default function InvestmentCalculatorPage() {
  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        <PageHeader
          title="Investment Calculator"
          subtitle="Calculate your investment allocation or analyze your existing portfolio weightage."
        />

        <Tabs defaultValue="new" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6 h-12 bg-gray-100 p-1 rounded-lg">
            <TabsTrigger
              value="new"
              className="flex items-center gap-2 text-sm font-medium data-[state=active]:bg-green-100 data-[state=active]:text-green-700 data-[state=active]:shadow-sm rounded-md transition-all"
            >
              <UserPlus className="h-4 w-4" />
              New Investment
            </TabsTrigger>
            <TabsTrigger
              value="existing"
              className="flex items-center gap-2 text-sm font-medium data-[state=active]:bg-green-100 data-[state=active]:text-green-700 data-[state=active]:shadow-sm rounded-md transition-all"
            >
              <Users className="h-4 w-4" />
              Existing Investment
            </TabsTrigger>
          </TabsList>

          <TabsContent value="new" className="mt-0">
            <InvestmentCalculator />
          </TabsContent>

          <TabsContent value="existing" className="mt-0">
            <ExistingInvestorCalculator />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
