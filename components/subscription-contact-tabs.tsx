"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PhoneCall, MessageSquare, Crown, Star } from "lucide-react"
import { subscriptionService, SubscriptionAccess } from "@/services/subscription.service"

interface ContactDetails {
  whatsapp: string
  phone: string
  label: string
  description: string
}

const contactConfig: Record<string, ContactDetails> = {
  general: {
    whatsapp: "917021337693",
    phone: "+917021337693",
    label: "General Support",
    description: "Basic support for general inquiries"
  },
  basic: {
    whatsapp: "917021337693",
    phone: "+917021337693", 
    label: "Basic Support",
    description: "Priority support for Basic subscribers"
  },
  premium: {
    whatsapp: "919326199388",
    phone: "+919167694966",
    label: "Premium Support",
    description: "Dedicated premium support with faster response"
  }
}

export default function SubscriptionContactTabs() {
  const [subscriptionAccess, setSubscriptionAccess] = useState<SubscriptionAccess | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const access = await subscriptionService.getSubscriptionAccess()
        setSubscriptionAccess(access)
      } catch (error) {
        console.error("Failed to fetch subscription:", error)
        setSubscriptionAccess({
          hasBasic: false,
          hasPremium: false,
          portfolioAccess: [],
          subscriptionType: 'none'
        })
      } finally {
        setLoading(false)
      }
    }

    fetchSubscription()
  }, [])

  const getActiveTab = () => {
    if (!subscriptionAccess) return "general"
    if (subscriptionAccess.hasPremium) return "premium"
    if (subscriptionAccess.hasBasic) return "basic"
    return "general"
  }

  const ContactCard = ({ type, config }: { type: string; config: ContactDetails }) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          {type === "premium" && <Crown className="h-5 w-5 text-yellow-500" />}
          {type === "basic" && <Star className="h-5 w-5 text-blue-500" />}
          {config.label}
        </CardTitle>
        <p className="text-sm text-muted-foreground">{config.description}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button
          className="w-full bg-green-600 hover:bg-green-700"
          onClick={() => window.open(`https://wa.me/${config.whatsapp}`, "_blank")}
        >
          <MessageSquare className="mr-2 h-4 w-4" />
          WhatsApp Support
        </Button>
        <Button 
          className="w-full bg-[#001633] hover:bg-[#003366]" 
          onClick={() => window.open(`tel:${config.phone}`, "_blank")}
        >
          <PhoneCall className="mr-2 h-4 w-4" />
          Call Support
        </Button>
      </CardContent>
    </Card>
  )

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-2">
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Tabs defaultValue={getActiveTab()} className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="general">General</TabsTrigger>
        <TabsTrigger value="basic" disabled={!subscriptionAccess?.hasBasic && !subscriptionAccess?.hasPremium}>
          Basic
        </TabsTrigger>
        <TabsTrigger value="premium" disabled={!subscriptionAccess?.hasPremium}>
          Premium
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="general" className="mt-4">
        <ContactCard type="general" config={contactConfig.general} />
      </TabsContent>
      
      <TabsContent value="basic" className="mt-4">
        <ContactCard type="basic" config={contactConfig.basic} />
      </TabsContent>
      
      <TabsContent value="premium" className="mt-4">
        <ContactCard type="premium" config={contactConfig.premium} />
      </TabsContent>
    </Tabs>
  )
}