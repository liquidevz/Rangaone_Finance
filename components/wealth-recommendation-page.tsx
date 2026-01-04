"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { type Tip } from "@/services/tip.service";
import { motion } from "framer-motion";
import { ArrowUpRight, TrendingUp, Calendar, Target, DollarSign, Clock } from "lucide-react";
import Link from "next/link";

interface WealthRecommendationPageProps {
  stockData?: Tip;
}

export default function WealthRecommendationPage({
  stockData,
}: WealthRecommendationPageProps) {
  const stockSymbol = stockData?.title?.split(':')[0]?.trim().toUpperCase() || 
                     stockData?.title?.split(' ')[0]?.trim().toUpperCase() || 
                     "STOCK";

  const buyRange = stockData?.buyRange || 'N/A';
  const targetPrice = stockData?.targetPrice || 'N/A';
  const targetPercentage = stockData?.targetPercentage || 'N/A';
  const action = stockData?.action || 'Buy';
  const horizon = stockData?.horizon || 'Long term';
  const description = stockData?.description || '';
  const exitPrice = stockData?.exitPrice || '';
  const recommendedDate = stockData?.createdAt ? new Date(stockData.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A';
  const exitDate = 'N/A';

  const formatDescription = (description: string): string[] => {
    if (!description) return [];
    
    return description
      .split(/[•·\n]/)
      .map(point => point.trim())
      .filter(point => point.length > 0 && point !== '…')
      .slice(0, 5);
  };

  const descriptionPoints = formatDescription(description);

  return (
    <div className="min-h-screen bg-white">
      <div className="w-full max-w-md mx-auto px-2 md:px-6 py-2 md:py-4 md:max-w-6xl">

        {/* Premium Stock Card (Small) - Matching TipCard Design */}
        <div className="w-full mb-4 md:mb-6 md:mx-auto max-w-xs md:max-w-sm">
          <div
            className="relative w-full h-full rounded-xl transition-all duration-500 cursor-pointer flex-shrink-0 shadow-md"
            style={{
              background: "linear-gradient(90deg, #FFD700 30%, #3333330A 90%)",
              padding: '2px'
            }}
          >
            <div className="w-full h-full bg-white rounded-[10px] p-2 sm:p-3 md:p-4 lg:p-5 flex flex-col justify-between relative overflow-hidden">
              <div className="w-full h-full flex flex-col justify-between relative z-10">
                <div className="flex justify-between items-start gap-2 sm:gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 sm:mb-1.5">
                      <div
                        className="text-xs sm:text-sm font-semibold rounded px-2 sm:px-2.5 py-0.5 sm:py-1 inline-block shadow-sm whitespace-nowrap"
                        style={{
                          backgroundColor: "#92400E",
                          color: "#FEF3C7"
                        }}
                      >
                        Premium
                      </div>
                    </div>
                    
                    <div className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-black mt-0.5 mb-0.5 sm:mb-1">
                      {stockSymbol}
                    </div>
                    <p className="text-xs sm:text-sm text-gray-500">NSE</p>
                  </div>
                  <div className={`relative p-[4px] rounded-xl flex-shrink-0 ${
                    (stockData?.status === "closed" && stockData?.exitStatus?.toLowerCase().includes("loss")) 
                      ? "bg-gradient-to-r from-red-500 to-red-600" 
                      : "bg-green-500"
                  }`}>
                    <div className={`rounded-md px-1.5 sm:px-2 md:px-2.5 py-1 sm:py-1.5 text-center min-w-[40px] sm:min-w-[44px] md:min-w-[50px] ${
                      (stockData?.status === "closed" && stockData?.exitStatus?.toLowerCase().includes("loss")) 
                        ? "bg-gradient-to-r from-gray-100 to-gray-200" 
                        : "bg-gradient-to-r from-green-50 to-green-100"
                    }`}>
                      <p className={`text-[8px] sm:text-[9px] md:text-[10px] mb-0 leading-tight font-medium ${
                        (stockData?.status === "closed" && stockData?.exitStatus?.toLowerCase().includes("loss")) ? "text-white" : "text-black"
                      }`}>{stockData?.status === 'closed' ? stockData?.exitStatus : 'Target'}</p>
                      <p className={`text-xs sm:text-sm md:text-base font-bold leading-tight ${
                        (stockData?.status === "closed" && stockData?.exitStatus?.toLowerCase().includes("loss")) ? "text-white" : "text-black"
                      }`}>{stockData?.status === 'closed' ? stockData?.exitStatusPercentage : targetPercentage}%</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between items-end mt-1.5 sm:mt-2 md:mt-3 gap-2 sm:gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] sm:text-xs md:text-sm text-gray-500 mb-0.5 sm:mb-1 leading-tight font-medium">Buy Range</p>
                    <div className="text-xs sm:text-sm md:text-base font-semibold text-black">
                      {buyRange}
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <p className="text-[10px] sm:text-xs md:text-sm text-gray-500 mb-0.5 sm:mb-1 leading-tight font-medium">Action</p>
                    <div className="px-2 sm:px-2.5 md:px-3 py-1 sm:py-1.5 rounded text-xs sm:text-sm md:text-base font-medium bg-gray-700 text-[#FFFFF0] inline-block whitespace-nowrap">
                      {action}
                    </div>
                  </div>
                </div>
                
                {stockData?.description && (
                  <div className="mt-1.5 sm:mt-2 p-1.5 sm:p-2 md:p-2.5 bg-gray-100 rounded">
                    <div className="text-[10px] sm:text-xs md:text-sm text-gray-600 leading-tight">
                      {stockData.description.length > 50 ? `${stockData.description.substring(0, 50)}...` : stockData.description}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Title Section */}
        <div className="px-0 mb-4 md:mb-6 text-center">
          <div className="text-sm md:text-lg font-bold text-gray-700 mb-2">{stockSymbol}</div>
        </div>

        {/* Recommendation Details Card (Big) */}
        <Card className="w-full mb-4 md:mb-6 md:mx-auto border-2 border-yellow-300 shadow-lg max-w-md md:max-w-2xl">
          <CardHeader className="bg-blue-900 text-[#FFFFF0] px-2 md:px-4 py-1 md:py-2 rounded-t-lg">
            <h3 className="text-sm md:text-lg font-bold text-center">Recommendation Details</h3>
          </CardHeader>
          <CardContent className="p-2 md:p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-6">
              <div className="space-y-2 md:space-y-4">
                <div>
                  <div className="flex items-center text-xs md:text-sm text-gray-600 mb-0.5 md:mb-1">
                    <DollarSign className="h-3 w-3 md:h-4 md:w-4 mr-0.5 md:mr-1" />
                    Buy Range
                  </div>
                  <div className="text-sm md:text-xl font-bold text-green-600">{buyRange}</div>
                </div>
                
                <div>
                  <div className="flex items-center text-xs md:text-sm text-gray-600 mb-0.5 md:mb-1">
                    <Clock className="h-3 w-3 md:h-4 md:w-4 mr-0.5 md:mr-1" />
                    Horizon
                  </div>
                  <div className="text-sm md:text-xl font-bold text-green-600">{horizon}</div>
                </div>
                
                <div>
                  <div className="flex items-center text-xs md:text-sm text-gray-600 mb-0.5 md:mb-1">
                    <TrendingUp className="h-3 w-3 md:h-4 md:w-4 mr-0.5 md:mr-1" />
                    Exited Price
                  </div>
                  <div className="text-sm md:text-xl font-bold text-green-600">{exitPrice || 'N/A'}</div>
                </div>
              </div>

              <div className="space-y-2 md:space-y-4">
                <div>
                  <div className="flex items-center text-xs md:text-sm text-gray-600 mb-0.5 md:mb-1">
                    <Target className="h-3 w-3 md:h-4 md:w-4 mr-0.5 md:mr-1" />
                    Target Price
                  </div>
                  <div className="text-sm md:text-xl font-bold text-green-600">{targetPrice}</div>
                </div>
                
                <div>
                  <div className="flex items-center text-xs md:text-sm text-gray-600 mb-0.5 md:mb-1">
                    <Calendar className="h-3 w-3 md:h-4 md:w-4 mr-0.5 md:mr-1" />
                    Recommended Date
                  </div>
                  <div className="text-sm md:text-xl font-bold text-green-600">{recommendedDate}</div>
                </div>
                
                <div>
                  <div className="flex items-center text-xs md:text-sm text-gray-600 mb-0.5 md:mb-1">
                    <Calendar className="h-3 w-3 md:h-4 md:w-4 mr-0.5 md:mr-1" />
                    Exit Date
                  </div>
                  <div className="text-sm md:text-xl font-bold text-green-600">{exitDate}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Why Buy This Card (Biggest) */}
        <Card className="w-full mb-4 md:mb-6 md:mx-auto border-2 border-yellow-300 shadow-lg max-w-lg md:max-w-4xl">
          <CardHeader className="bg-blue-900 text-[#FFFFF0] px-2 md:px-6 py-1 md:py-3 rounded-t-lg">
            <h3 className="text-sm md:text-xl font-bold text-center">{`Why ${action} This?`}</h3>
          </CardHeader>
          <CardContent className="p-2 md:p-6">
            <ul className="space-y-2 md:space-y-4">
              {descriptionPoints.length > 0 ? (
                descriptionPoints.map((point, index) => (
                  <li key={index} className="flex items-start">
                    <span className="w-2 h-2 md:w-3 md:h-3 bg-green-500 rounded-full mt-1 md:mt-2 mr-2 md:mr-4 flex-shrink-0"></span>
                    <span className="text-gray-700 leading-relaxed text-sm md:text-lg">{point}</span>
                  </li>
                ))
              ) : (
                <li className="flex items-start">
                  <span className="w-2 h-2 md:w-3 md:h-3 bg-green-500 rounded-full mt-1 md:mt-2 mr-2 md:mr-4 flex-shrink-0"></span>
                  <span className="text-gray-700 leading-relaxed text-sm md:text-lg">
                    Technically trading at a Discounted price (39%).
                  </span>
                </li>
              )}
            </ul>
            
            <div className="mt-2 md:mt-6 text-center">
              <Button className="w-full md:w-auto md:px-8 bg-green-600 hover:bg-green-700 text-[#FFFFF0] font-semibold py-2 md:py-3 rounded-lg text-sm md:text-lg">
                View Detailed Report
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}