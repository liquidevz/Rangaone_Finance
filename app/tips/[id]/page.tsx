"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Download, Calendar, Target, TrendingUp, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { tipsService, Tip } from "@/services/tip.service";
import { useAuth } from "@/components/auth/auth-context";

export default function TipDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const [tip, setTip] = useState<Tip | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      loadTipDetails(params.id as string);
    }
  }, [params.id]);

  const loadTipDetails = async (id: string) => {
    try {
      setLoading(true);
      const tipData = await tipsService.getById(id);
      setTip(tipData);
    } catch (error) {
      console.error("Failed to load tip details:", error);
      toast({
        title: "Error",
        description: "Failed to load tip details. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (downloadLink: string) => {
    window.open(downloadLink, '_blank');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tip details...</p>
        </div>
      </div>
    );
  }

  if (!tip) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Tip Not Found</h2>
          <p className="text-gray-600 mb-4">The tip you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => router.back()} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            onClick={() => router.back()}
            variant="outline"
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Model Portfolio Header */}
          <div className="bg-[#1e3a8a] text-[#FFFFF0] rounded-t-xl px-6 py-4 mb-0">
            <h1 className="text-2xl font-bold text-center tracking-wide">
              MODEL PORTFOLIO
            </h1>
          </div>

          {/* Expert Recommendations Section */}
          <Card className="rounded-t-none border-t-0 mb-6">
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <h2 className="text-lg font-semibold text-gray-700 mb-4">
                  EXPERT RECOMMENDATIONS
                </h2>
                
                {/* Stock Info Card */}
                <div className="bg-gradient-to-r from-cyan-50 to-blue-50 border-2 border-cyan-200 rounded-lg p-4 mb-4 max-w-md mx-auto">
                  <div className="flex items-center justify-between">
                    <div className="text-left">
                      <div className="bg-[#1e3a8a] text-[#FFFFF0] px-3 py-1 rounded text-sm font-medium mb-2 inline-block">
                        Model Portfolio
                      </div>
                      <h3 className="font-bold text-gray-900 text-lg">
                        {tip.stockId}
                      </h3>
                      <p className="text-sm text-gray-600">NSE</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600 mb-1">Weightage</p>
                      <div className={`rounded px-3 py-1 ${
                        tip.action === "SELL" 
                          ? "bg-red-50 border border-red-300" 
                          : tip.action === "Partial Profit Booked" || tip.action === "PARTIAL SELL" || tip.action === "Partial Sell"
                            ? "bg-orange-50 border border-orange-300"
                            : "bg-white border border-gray-300"
                      }`}>
                        <span className={`font-bold ${
                          tip.action === "SELL" 
                            ? "text-red-800" 
                            : tip.action === "Partial Profit Booked" || tip.action === "PARTIAL SELL" || tip.action === "Partial Sell"
                              ? "text-orange-800"
                              : "text-gray-900"
                        }`}>
                          {tip.targetPercentage || "4%"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                  <span className="font-bold">Title:- </span>
                  {tip.title}
                </h3>

                {/* Recommendation Details Card */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-6 mb-6">
                  <div className="bg-[#1e3a8a] text-[#FFFFF0] px-4 py-2 rounded-lg inline-block mb-4">
                    <h4 className="font-semibold">Recommendation Details</h4>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div className="text-center">
                      <h5 className="font-semibold text-gray-900 mb-2">Buy Range</h5>
                      <p className="text-green-600 font-bold text-lg">{tip.buyRange}</p>
                    </div>
                    <div className="text-center">
                      <h5 className="font-semibold text-gray-900 mb-2">Add more at</h5>
                      <p className="text-green-600 font-bold text-lg">{tip.addMoreAt}</p>
                    </div>
                    <div className="text-center">
                      <h5 className="font-semibold text-gray-900 mb-2">Action</h5>
                      <p className="text-green-600 font-bold text-lg">
                        {tip.action || "HOLD"}
                      </p>
                    </div>
                    <div className="text-center">
                      <h5 className="font-semibold text-gray-900 mb-2">Recommended Date</h5>
                      <p className="text-green-600 font-bold text-lg">
                        {formatDate(tip.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Why Buy This Section */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="bg-[#1e3a8a] text-[#FFFFF0] px-4 py-2 rounded-lg inline-block mb-4">
                <h4 className="font-semibold">Why Buy This?</h4>
              </div>
              
              <div className="space-y-3">
                {typeof tip.content === 'string' ? (
                  <div className="prose prose-sm max-w-none">
                    <div dangerouslySetInnerHTML={{ __html: tip.content }} />
                  </div>
                ) : Array.isArray(tip.content) ? (
                  tip.content.map((item, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-gray-800 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-gray-700 leading-relaxed">
                        {typeof item === 'string' ? item : item.value}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-gray-800 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-gray-700 leading-relaxed">
                        Technically trading at a Discounted price (39%).
                      </p>
                    </div>
                    <div className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-gray-800 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-gray-700 leading-relaxed">
                        Low Price to Equity ratio of 15.9 ( Very Attractive )
                      </p>
                    </div>
                    <div className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-gray-800 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-gray-700 leading-relaxed">
                        Showing Good Sales & Profit growth of 48% & 27% respectively.
                      </p>
                    </div>
                    <div className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-gray-800 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-gray-700 leading-relaxed">
                        DIIs have increased their stake from 9% to 14%.
                      </p>
                    </div>
                    <div className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-gray-800 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-gray-700 leading-relaxed">
                        The company is expanding their assisted business through different channels and products and entering into wealth management.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* View Detailed Report Button */}
              <div className="text-center mt-6">
                {tip.downloadLinks && tip.downloadLinks.length > 0 ? (
                  <Button
                    onClick={() => handleDownload(tip.downloadLinks[0].linkUrl)}
                    className="bg-green-600 hover:bg-green-700 text-[#FFFFF0] px-8 py-3 rounded-lg font-semibold"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    View Detailed Report
                  </Button>
                ) : (
                  <Button
                    onClick={() => window.open(tip.tipUrl, '_blank')}
                    className="bg-green-600 hover:bg-green-700 text-[#FFFFF0] px-8 py-3 rounded-lg font-semibold"
                  >
                    View Detailed Report
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Additional Information */}
          {(tip.description || tip.horizon) && (
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="bg-[#1e3a8a] text-[#FFFFF0] px-4 py-2 rounded-lg inline-block mb-4">
                  <h4 className="font-semibold">Additional Information</h4>
                </div>
                
                <div className="space-y-4">
                  {tip.description && (
                    <div>
                      <h5 className="font-semibold text-gray-900 mb-2">Description</h5>
                      <p className="text-gray-700">{tip.description}</p>
                    </div>
                  )}
                  
                  {tip.horizon && (
                    <div>
                      <h5 className="font-semibold text-gray-900 mb-2">Investment Horizon</h5>
                      <p className="text-gray-700">{tip.horizon}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>
    </div>
  );
} 