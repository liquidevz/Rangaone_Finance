"use client"

import { useState } from "react"
import DashboardLayout from "@/components/dashboard-layout"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Send } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import SubscriptionContactTabs from "@/components/subscription-contact-tabs"
import { contactService } from "@/services/contact.service"

export default function DashboardContactUs() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
    preferredContact: "whatsapp",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await contactService.sendInnerContactMessage(formData)
      toast({
        title: "Message Sent",
        description: "We'll get back to you as soon as possible.",
      })
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
        preferredContact: "whatsapp",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader 
          title="Contact Support" 
          subtitle="Get help with your investment journey"
          showBackButton={false}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Get in Touch</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <SubscriptionContactTabs />

                <div>
                  <h3 className="font-semibold mb-3">Officers Contact</h3>
                  
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-sm mb-1">Grievance Officer</h4>
                    <p className="text-sm text-gray-600">Ms. Sanika Karnik</p>
                    <p className="text-sm text-gray-600">Email: sanika.official11@gmail.com</p>
                    <p className="text-sm text-gray-600">Phone: +91-93261 99388</p>
                  </div>

                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-sm mb-1">Principal Officer</h4>
                    <p className="text-sm text-gray-600">Mr. Vibhanshu Gupta</p>
                    <p className="text-sm text-gray-600">Email: guptavibhanshu2002@gmail.com</p>
                    <p className="text-sm text-gray-600">Phone: +91-93512 00235</p>
                  </div>

                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-sm mb-1">Compliance Officer</h4>
                    <p className="text-sm text-gray-600">Ms. Sanika Karnik</p>
                    <p className="text-sm text-gray-600">Email: compliance@rangaone.finance</p>
                    <p className="text-sm text-gray-600">Phone: +91-93261 99388</p>
                  </div>
                </div>

                
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Send Us a Message</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input id="phone" name="phone" value={formData.phone} onChange={handleChange} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject</Label>
                      <Input id="subject" name="subject" value={formData.subject} onChange={handleChange} required />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Your Message</Label>
                    <Textarea
                      id="message"
                      name="message"
                      rows={6}
                      value={formData.message}
                      onChange={handleChange}
                      required
                      className="resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Preferred Contact Method</Label>
                    <RadioGroup
                      defaultValue={formData.preferredContact}
                      name="preferredContact"
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, preferredContact: value }))}
                      className="flex flex-wrap gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="whatsapp" id="whatsapp" />
                        <Label htmlFor="whatsapp">WhatsApp</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="phone" id="phone" />
                        <Label htmlFor="phone">Phone Call</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="email" id="email" />
                        <Label htmlFor="email">Email</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <Button type="submit" className="w-full bg-[#001633] hover:bg-[#003366]" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <span className="flex items-center">
                        <svg
                          className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Sending...
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <Send className="mr-2 h-4 w-4" />
                        Send Message
                      </span>
                    )}
                  </Button>
                </form>
                <div>
                  <h3 className="font-semibold mt-2">Support</h3>
                  
                  <div className="p-3 bg-gray-50 rounded-lg space-y-3">
                    <div>
                      <h4 className="font-medium text-sm mb-1">CustomerCare Number</h4>
                      <p className="text-sm text-gray-600"> +91-70213 37693</p>
                    </div>

                    <div>
                      <h4 className="font-medium text-sm mb-1">Timing</h4>
                      <p className="text-sm text-gray-600">Monday - Friday (10am-6pm)</p>
                    </div>

                    <div>
                      <h4 className="font-medium text-sm mb-1">Email:</h4>
                      <p className="text-sm text-gray-600 break-all">Support@rangaone.finance</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Company Details</h3>
                  
                  <div className="p-3 bg-gray-50 rounded-lg space-y-2 overflow-hidden">
                    <div className="space-y-1 text-xs">
                      <div>
                        <span className="font-medium text-gray-700 flex-shrink-0">Phone:</span>
                        <span className="text-gray-600 break-all ml-2">+91-93261 99388</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700 flex-shrink-0">Email:</span>
                        <span className="text-gray-600 break-all ml-2">Support@rangaone.finance</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">BSE Enlistment:</span>
                        <span className="text-gray-600 break-all ml-2">6662</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">CIN:</span>
                        <span className="text-gray-600 break-all ml-2">U85499MH2024PTC430894</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700 flex-shrink-0">GST:</span>
                        <span className="text-gray-600 break-all ml-2">27AANCRR9959F1ZM</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
    </DashboardLayout>
  )
}