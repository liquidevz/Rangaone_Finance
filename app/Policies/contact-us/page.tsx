"use client"

import { useState } from "react"
import PublicLayout from "@/components/public-layout"
import { Card, CardContent } from "@/components/ui/card"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { PhoneCall, MessageSquare, Send, Mail, MapPin, Clock } from "lucide-react"
import { FaTelegram, FaInstagram, FaLinkedin, FaTwitter } from "react-icons/fa"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"

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
    <PublicLayout>
      <div className="space-y-6">
        <PageHeader 
          title="Contact Us" 
          subtitle="We're here to help with your investment journey"
          showBackButton={false}
          size="lg"
        />

        {/* Quick Contact Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <PhoneCall className="mx-auto mb-3 text-indigo-900" size={32} />
              <h3 className="font-bold mb-2">Call Us</h3>
              <p className="text-gray-600 mb-3">+91-8319648459</p>
              <Button 
                className="w-full" 
                onClick={() => window.open("tel:+918319648459", "_blank")}
              >
                Call Now
              </Button>
            </CardContent>
          </Card>
          
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <MessageSquare className="mx-auto mb-3 text-green-600" size={32} />
              <h3 className="font-bold mb-2">WhatsApp</h3>
              <p className="text-gray-600 mb-3">Quick Support</p>
              <Button 
                className="w-full bg-green-600 hover:bg-green-700"
                onClick={() => window.open("https://wa.me/918319648459", "_blank")}
              >
                Chat Now
              </Button>
            </CardContent>
          </Card>
          
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <Mail className="mx-auto mb-3 text-blue-600" size={32} />
              <h3 className="font-bold mb-2">Email Us</h3>
              <p className="text-gray-600 mb-3">24/7 Support</p>
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700"
                onClick={() => window.open("mailto:info@RangaOnefinwala.com", "_blank")}
              >
                Send Email
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Contact Information */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <div className="bg-blue-50 p-4 rounded-t-lg">
                <h2 className="text-xl font-bold flex items-center">
                  <MapPin className="mr-2" size={20} />
                  Contact Information
                </h2>
              </div>
              <CardContent className="p-6 space-y-6">
                <div>
                  <h3 className="font-semibold mb-3 text-indigo-900">Office Address</h3>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    Office no.3, Ward No.11, Managanj, Jaithari, Post Jaithari, Anuppur, Madhya Pradesh, 484330
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-3 text-indigo-900">Phone & Email</h3>
                  <div className="space-y-2 text-sm">
                    <p className="flex items-center text-gray-700">
                      <PhoneCall className="mr-2" size={16} />
                      +91-8319648459
                    </p>
                    <p className="flex items-center text-gray-700">
                      <Mail className="mr-2" size={16} />
                      info@RangaOnefinwala.com
                    </p>
                    <p className="flex items-center text-gray-700">
                      <Mail className="mr-2" size={16} />
                      compliance@RangaOnefinwala.com
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3 text-indigo-900 flex items-center">
                    <Clock className="mr-2" size={16} />
                    Business Hours
                  </h3>
                  <div className="text-sm text-gray-700 space-y-1">
                    <p>Monday - Friday: 9:00 AM - 6:00 PM</p>
                    <p>Saturday: 10:00 AM - 2:00 PM</p>
                    <p>Sunday: Closed</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3 text-indigo-900">Follow Us</h3>
                  <div className="flex space-x-4">
                    <Link
                      href="https://t.me/RangaOnefinwala"
                      className="text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      <FaTelegram size={24} />
                    </Link>
                    <Link
                      href="https://instagram.com/RangaOnefinwala"
                      className="text-pink-600 hover:text-pink-800 transition-colors"
                    >
                      <FaInstagram size={24} />
                    </Link>
                    <Link
                      href="https://linkedin.com/company/RangaOnefinwala"
                      className="text-blue-700 hover:text-blue-900 transition-colors"
                    >
                      <FaLinkedin size={24} />
                    </Link>
                    <Link
                      href="https://twitter.com/RangaOnefinwala"
                      className="text-blue-400 hover:text-blue-600 transition-colors"
                    >
                      <FaTwitter size={24} />
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <div className="bg-yellow-50 p-4 rounded-t-lg">
                <h2 className="text-xl font-bold">SEBI Registration</h2>
              </div>
              <CardContent className="p-6">
                <div className="text-sm text-gray-700 space-y-2">
                  <p><strong>Registration No:</strong> INH000013350</p>
                  <p><strong>BSE Enlistment:</strong> 5886</p>
                  <p><strong>Validity:</strong> Oct 12, 2023 – Perpetual</p>
                  <p><strong>Type:</strong> Individual Research Analyst</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card>
              <div className="bg-blue-50 p-4 rounded-t-lg">
                <h2 className="text-xl font-bold">Send Us a Message</h2>
                <p className="text-gray-600">Fill out the form below and we'll get back to you soon</p>
              </div>
              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name *</Label>
                      <Input 
                        id="name" 
                        name="name" 
                        value={formData.name} 
                        onChange={handleChange} 
                        required 
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        placeholder="Enter your email"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input 
                        id="phone" 
                        name="phone" 
                        value={formData.phone} 
                        onChange={handleChange} 
                        required 
                        placeholder="Enter your phone number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject *</Label>
                      <Input 
                        id="subject" 
                        name="subject" 
                        value={formData.subject} 
                        onChange={handleChange} 
                        required 
                        placeholder="What is this regarding?"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Your Message *</Label>
                    <Textarea
                      id="message"
                      name="message"
                      rows={5}
                      value={formData.message}
                      onChange={handleChange}
                      required
                      placeholder="Please describe your inquiry in detail..."
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

                  <Button 
                    type="submit" 
                    className="w-full bg-indigo-900 hover:bg-indigo-800" 
                    disabled={isSubmitting}
                  >
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

        {/* Additional Information */}
        <Card>
            <div className="bg-gray-50 p-4 rounded-t-lg">
              <h2 className="text-xl font-bold">Important Information</h2>
            </div>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-700">
              <div>
                <h3 className="font-bold mb-2">Regulatory Information</h3>
                <p className="mb-2">
                  RangaOne FINWALA is a SEBI Registered Research Analyst. Registration granted by SEBI and 
                  certification from NISM in no way guarantee performance of the intermediary or provide any 
                  assurance of returns to investors.
                </p>
              </div>
              <div>
                <h3 className="font-bold mb-2">Investment Warning</h3>
                <p>
                  Investment in securities market are subject to market risks. Read all the related documents 
                  carefully before investing. Past performance does not guarantee future results.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PublicLayout>
  )
}