"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ThanksPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [telegramLinks, setTelegramLinks] = useState<string[]>([]);

  useEffect(() => {
    // Check for Telegram links in URL parameters
    const linksParam = searchParams.get('telegram_links');
    if (linksParam) {
      try {
        const links = JSON.parse(decodeURIComponent(linksParam));
        if (Array.isArray(links)) {
          setTelegramLinks(links);
        }
      } catch (error) {
        console.error('Error parsing Telegram links:', error);
      }
    }

    // Auto redirect to dashboard after 5 seconds (increased to give time to see links)
    const timer = setTimeout(() => {
      router.push("/dashboard");
    }, 5000);

    return () => clearTimeout(timer);
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md mx-auto text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-12 h-12 text-green-600" />
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Payment Successful!
        </h1>
        
        <p className="text-gray-600 mb-8">
          Thank you for your purchase. Your subscription has been activated successfully.
        </p>
        
        <div className="space-y-4">
          <Button 
            onClick={() => router.push("/dashboard")}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            Continue to Dashboard
          </Button>
          
          {/* Telegram Links Section */}
          {telegramLinks.length > 0 && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="text-sm font-semibold text-blue-800 mb-3">
                Join Your Telegram Groups:
              </h4>
              <div className="space-y-2">
                {telegramLinks.map((link, index) => (
                  <a
                    key={index}
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-center"
                  >
                    Join Telegram Group {index + 1}
                  </a>
                ))}
              </div>
              <p className="text-xs text-blue-600 mt-2">
                Click the links above to join your exclusive Telegram groups
              </p>
            </div>
          )}
          
          <p className="text-sm text-gray-500">
            Redirecting automatically in 5 seconds...
          </p>
        </div>
      </div>
    </div>
  );
}