"use client"

import { useState } from "react"
import { Navbar } from "@/components/navbar"
import Footer from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { PhoneCall, MessageSquare, Send } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export default function ContactUs() {
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

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate form submission
    setTimeout(() => {
      setIsSubmitting(false)
      toast({
        title: "Message Sent",
        description: "We'll get back to you as soon as possible.",
      })
      // Reset form
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
        preferredContact: "whatsapp",
      })
    }, 1500)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      <Navbar />
      
      {/* Hero Section */}
      <div className="pt-24 pb-12 lg:pb-16 bg-gradient-to-r from-[#001633] to-[#003366]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-white mb-6 tracking-tight">
              Contact Us
            </h1>
            <div className="w-32 lg:w-40 h-1.5 bg-gradient-to-r from-blue-400 to-indigo-400 mx-auto rounded-full mb-4"></div>
            <p className="text-xl text-blue-100">We're here to help with your investment journey</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="py-16 lg:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <Card className="h-full bg-white/90 backdrop-blur-sm shadow-xl border border-white/20">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                  <CardTitle className="text-xl text-[#001633]">Get in Touch</CardTitle>
                </CardHeader>
                <CardContent className="p-6 flex-1">
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-semibold mb-3 text-[#001633]">Call Us Directly</h3>
                      <Button
                        className="w-full bg-green-600 hover:bg-green-700 mb-3"
                        onClick={() => window.open("https://wa.me/919326199388", "_blank")}
                      >
                        <MessageSquare className="mr-2 h-4 w-4" />
                        WhatsApp
                      </Button>
                      <Button className="w-full bg-[#001633] hover:bg-[#003366]" onClick={() => window.open("tel:+919167694966", "_blank")}>
                        <PhoneCall className="mr-2 h-4 w-4" />
                        Call Now
                      </Button>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-3 text-[#001633]">Officers Contact</h3>
                      
                      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                        <h4 className="font-medium text-sm mb-1 text-[#001633]">Grievance Officer</h4>
                        <p className="text-sm text-gray-600">Ms. Sanika Karnik</p>
                        <p className="text-sm text-gray-600">Email: sanika.official11@gmail.com</p>
                        <p className="text-sm text-gray-600">Phone: +91-93261 99388</p>
                      </div>

                      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                        <h4 className="font-medium text-sm mb-1 text-[#001633]">Principal Officer</h4>
                        <p className="text-sm text-gray-600">Mr. Vibhanshu Gupta</p>
                        <p className="text-sm text-gray-600">Email: guptavibhanshu2002@gmail.com</p>
                        <p className="text-sm text-gray-600">Phone: +91-93512 00235</p>
                      </div>

                      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                        <h4 className="font-medium text-sm mb-1 text-[#001633]">Compliance Officer</h4>
                        <p className="text-sm text-gray-600">Ms. Sanika Karnik</p>
                        <p className="text-sm text-gray-600">Email: compliance@rangaone.finance</p>
                        <p className="text-sm text-gray-600">Phone: +91-93261 99388</p>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-3 text-[#001633]">Support</h3>
                      
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="mb-3">
                          <h4 className="font-medium text-sm mb-1 text-[#001633]">CustomerCare Number</h4>
                          <p className="text-sm text-gray-600">+91-91676 94966</p>
                        </div>

                        <div className="mb-3">
                          <h4 className="font-medium text-sm mb-1 text-[#001633]">Timing</h4>
                          <p className="text-sm text-gray-600">Monday - Friday (10am-6pm)</p>
                        </div>

                        <div>
                          <h4 className="font-medium text-sm mb-1 text-[#001633]">Email us:</h4>
                          <p className="text-sm text-gray-600">Support@rangaone.finance</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-2">
              <Card className="h-full bg-white/90 backdrop-blur-sm shadow-xl border border-white/20">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                  <CardTitle className="text-xl text-[#001633]">Send Us a Message</CardTitle>
                </CardHeader>
                <CardContent className="p-6 flex-1">
                  <form onSubmit={handleSubmit} className="space-y-4 h-full flex flex-col">
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

                    <div className="space-y-2 flex-1">
                      <Label htmlFor="message">Your Message</Label>
                      <Textarea
                        id="message"
                        name="message"
                        rows={6}
                        value={formData.message}
                        onChange={handleChange}
                        required
                        className="resize-none flex-1"
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

                    <Button type="submit" className="w-full bg-[#001633] hover:bg-[#003366] mt-auto" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <span className="flex items-center">
                          <svg
                            className="animate-spin -ml-1 mr-3 h-5 w-5 text-[#FFFFF0]"
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
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
