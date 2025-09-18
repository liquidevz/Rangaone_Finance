"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { ChevronDown } from "lucide-react"
import { SectionHeading } from "@/components/ui/section-heading"
import { contactService, ContactFormData } from "@/services/contact.service"
import { faqService, FAQ } from "@/services/faq.service"
import { useToast } from "@/components/ui/use-toast"

export default function FAQContactSection() {
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [loading, setLoading] = useState(true)
  const [openIndex, setOpenIndex] = useState<number | null>(0)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    represent: "BASIC",
    message: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const fetchFAQs = async () => {
      try {
        setLoading(true)
        console.log('Fetching FAQs for General category...')
        const generalFAQs = await faqService.getFAQsByCategory('General')
        console.log('Received FAQs:', generalFAQs)
        setFaqs(generalFAQs)
      } catch (error) {
        console.error('Error fetching FAQs:', error)
        toast({
          title: "Error",
          description: "Failed to load FAQs. Please try again later.",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }

    fetchFAQs()
  }, [])

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleRepresentChange = (value: string) => {
    setFormData((prev) => ({ ...prev, represent: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const contactData: ContactFormData = {
        name: formData.name,
        email: formData.email,
        message: `Representation: ${formData.represent}\n\nMessage: ${formData.message}`
      }

      await contactService.sendContactMessage(contactData)
      
      setIsSubmitting(false)
      setIsSubmitted(true)
      toast({
        title: "Message Sent Successfully",
        description: "We'll get back to you as soon as possible.",
      })
      
      // Reset form after 3 seconds
      setTimeout(() => {
        setIsSubmitted(false)
        setFormData({
          name: "",
          email: "",
          represent: "BASIC",
          message: "",
        })
      }, 3000)
    } catch (error: any) {
      setIsSubmitting(false)
      toast({
        title: "Error",
        description: error.message || "Failed to send message. Please try again.",
        variant: "destructive"
      })
    }
  }

  return (
    <section className="py-16 bg-[#fefcea]" id="faq-contact">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-8">
          {/* FAQ Section */}
          <div>
            <SectionHeading title="FAQs" subtitle="Let's answer some questions" align="left" />

            {/* FAQ Accordion */}
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#001633] mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading FAQs...</p>
                </div>
              ) : faqs.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">No FAQs found for General category.</p>
                  <p className="text-sm text-gray-500 mt-2">Check console for API response details.</p>
                </div>
              ) : (
                faqs.map((faq, index) => (
                  <div
                    key={faq.id}
                    className="border border-gray-300 rounded-lg overflow-hidden transition-all duration-200"
                  >
                    <button
                      className="flex justify-between items-center w-full px-4 py-3 text-left bg-[#fefcea] hover:bg-gray-50"
                      onClick={() => toggleFAQ(index)}
                    >
                      <span className="font-medium text-gray-900">{faq.question}</span>
                      <ChevronDown
                        className={`h-5 w-5 text-gray-500 transition-transform duration-200 ${
                          openIndex === index ? "transform rotate-180" : ""
                        }`}
                      />
                    </button>
                    <div
                      className={`px-4 overflow-hidden transition-all duration-200 ${
                        openIndex === index ? "max-h-40 py-3" : "max-h-0"
                      }`}
                    >
                      <p className="text-gray-600">{faq.answer}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-[#001633] text-[#FFFFF0] rounded-xl p-6 md:p-8 shadow-lg">
            <h2 className="text-2xl font-bold mb-6">Contact us</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <p className="text-lg mb-4">Hi 👋 My name is...</p>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Your name..."
                  className="w-full bg-[#032552] border border-[#001633] rounded-md p-3 text-[#FFFFF0] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="mb-6">
                <p className="text-lg mb-4">and my email is...</p>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Your email..."
                  className="w-full bg-[#032552] border border-[#001633] rounded-md p-3 text-[#FFFFF0] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="mb-6">
                <p className="text-lg mb-4">and I represent</p>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleRepresentChange("BASIC")}
                    className={`py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                      formData.represent === "BASIC"
                        ? "bg-[#fefcea] text-[#001633]"
                        : "bg-[#032552] text-[#FFFFF0] hover:bg-[#001633]"
                    }`}
                  >
                    BASIC
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRepresentChange("PREMIUM")}
                    className={`py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                      formData.represent === "PREMIUM"
                        ? "bg-[#fefcea] text-[#001633]"
                        : "bg-[#032552] text-[#FFFFF0] hover:bg-[#001633]"
                    }`}
                  >
                    PREMIUM
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRepresentChange("MODEL PORTFOLIO")}
                    className={`py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                      formData.represent === "MODEL PORTFOLIO"
                        ? "bg-[#fefcea] text-[#001633]"
                        : "bg-[#032552] text-[#FFFFF0] hover:bg-[#001633]"
                    }`}
                  >
                    MODEL PORTFOLIO
                  </button>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-lg mb-4">I'd love to ask about...</p>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Your question..."
                  rows={4}
                  className="w-full bg-[#032552] border border-[#001633] rounded-md p-3 text-[#FFFFF0] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || isSubmitted}
                className="w-full bg-[#fefcea] text-[#001633] py-3 rounded-md font-medium hover:bg-gray-100 transition-colors"
              >
                {isSubmitting ? "Submitting..." : isSubmitted ? "Submitted!" : "Submit"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}
