"use client";

import { PageHeader } from "@/components/page-header";
import DashboardLayout from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { portfolioService } from "@/services/portfolio.service";
import { subscriptionService, type SubscriptionAccess } from "@/services/subscription.service";
import { useAuth } from "@/components/auth/auth-context";
import { MethodologyModal } from "@/components/methodology-modal";
import type { Portfolio } from "@/lib/types";
import { FileText, Eye, Lock, ShoppingCart, ClipboardList } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "@/components/cart/cart-context";
import { PaymentModal } from "@/components/payment-modal";
import { cache } from "@/lib/cache";

// Extend the Portfolio type to include the message field from the API response
interface PortfolioWithMessage extends Omit<Portfolio, "subscriptionFee"> {
  message?: string; // This field indicates if user needs to subscribe
  cashBalance?: number;
  CAGRSinceInception?: number;
  subscriptionFee?: Array<{
    type: string;
    price: number;
  }>;
  timeHorizon?: string;
  rebalancing?: string;
  index?: string;
  details?: string;
  compareWith?: string;
  holdingsValue?: number;
  monthlyContribution?: number;
}

// Custom portfolio bundle type for PaymentModal compatibility
interface PortfolioBundle {
  _id: string;
  name: string;
  description: string;
  category: string;
  portfolios: Array<{ name: string }>;
  quarterlyPrice: number;
  yearlyPrice: number;
  monthlyPrice: number;
}

export default function ModelPortfoliosPage() {
  const [portfolios, setPortfolios] = useState<PortfolioWithMessage[]>([]);
  const [subscriptionAccess, setSubscriptionAccess] = useState<SubscriptionAccess | null>(null);
  const [loading, setLoading] = useState(true);
  const [methodologyModal, setMethodologyModal] = useState<{
    isOpen: boolean;
    portfolioId: string;
    portfolioName: string;
  }>({
    isOpen: false,
    portfolioId: "",
    portfolioName: "",
  });
  const { toast } = useToast();
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { addToCart } = useCart();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPortfolioBundle, setSelectedPortfolioBundle] = useState<PortfolioBundle | null>(null);

  // Helper function to safely render description
  const renderDescription = (desc: any): string => {
    if (!desc) return "No description available";
    if (typeof desc === "string") return desc;
    if (Array.isArray(desc)) {
      const homeCardDesc = desc.find((item: any) => item.key === "home card");
      if (homeCardDesc && homeCardDesc.value) {
        const textContent = homeCardDesc.value.replace(/<[^>]*>/g, "");
        return textContent.length > 250
          ? textContent.substring(0, 250) + "..."
          : textContent;
      }

      return desc
        .map((item: any) => {
          if (typeof item === "string") return item;
          if (item?.value) {
            const textContent = String(item.value).replace(/<[^>]*>/g, "");
            return textContent;
          }
          if (item?.key) return item.key;
          return String(item);
        })
        .filter(Boolean)
        .join(", ");
    }
    return String(desc);
  };

  // Helper function to safely convert values to strings
  const safeString = (value: any): string => {
    if (value === null || value === undefined) return "0";
    if (typeof value === "string") return value || "0";
    if (typeof value === "number") return value.toString();
    if (typeof value === "boolean") return value.toString();
    return String(value) || "0";
  };

  // Helper function to safely convert to number
  const safeNumber = (value: any): number => {
    if (value === null || value === undefined) return 0;
    const num = Number(value);
    return isNaN(num) ? 0 : num;
  };

  // Check if user has access to a portfolio using subscription access data
  const hasPortfolioAccess = (portfolio: PortfolioWithMessage): boolean => {
    if (!isAuthenticated || !subscriptionAccess) {
      return false;
    }
    
    // Access is STRICTLY based on portfolioAccess array only
    // Even if hasPremium is true, only portfolios in the array are accessible
    return subscriptionAccess.portfolioAccess.includes(portfolio._id);
  };

  useEffect(() => {
    async function loadPortfolios() {
      if (authLoading) return;

      try {
        setLoading(true);

        // Check cache for subscription access
        let accessData = cache.get<SubscriptionAccess>('subscription_access');
        
        // Fetch subscription access data if authenticated
        if (isAuthenticated) {
          if (!accessData) {
            try {
              accessData = await subscriptionService.getSubscriptionAccess();
              cache.set('subscription_access', accessData, 5); // Cache for 5 minutes
              console.log("📊 Model portfolios subscription access from API:", accessData);
            } catch (error) {
              console.error("Failed to fetch subscription access:", error);
              accessData = {
                hasBasic: false,
                hasPremium: false,
                portfolioAccess: [],
                subscriptionType: 'none'
              };
            }
          }
          setSubscriptionAccess(accessData);
        }

        // Check cache for portfolios
        const cacheKey = isAuthenticated ? 'user_portfolios' : 'public_portfolios';
        let portfoliosData = cache.get<PortfolioWithMessage[]>(cacheKey);
        
        if (!portfoliosData) {
          if (isAuthenticated) {
            // Fetch portfolios from /api/user/portfolios
            portfoliosData = await portfolioService.getAll() as unknown as PortfolioWithMessage[];
          } else {
            // If not authenticated, still try to fetch to show subscription prompts
            try {
              portfoliosData = await portfolioService.getAll() as unknown as PortfolioWithMessage[];
            } catch (error) {
              // If that fails, try public endpoint as fallback
              portfoliosData = await portfolioService.getPublic() as unknown as PortfolioWithMessage[];
            }
          }
          // Cache for 10 minutes
          cache.set(cacheKey, portfoliosData, 10);
        }
        
        setPortfolios(portfoliosData);
      } catch (error: any) {
        console.error("Failed to load portfolios:", error);

        if (error?.response?.status === 401) {
          // Clear cache on auth error
          cache.remove('subscription_access');
          cache.remove('user_portfolios');
          toast({
            title: "Authentication Error",
            description: "Your session has expired. Please log in again.",
            variant: "destructive",
          });
          router.push("/login");
        } else {
          toast({
            title: "Error",
            description: "Failed to load portfolios. Please try again later.",
            variant: "destructive",
          });
        }

        setPortfolios([]);
      } finally {
        setLoading(false);
      }
    }

    loadPortfolios();
  }, [toast, router, isAuthenticated, authLoading]);

  const handleAddToCart = async (portfolio: PortfolioWithMessage) => {
    try {
      console.log("Adding portfolio to cart:", portfolio._id, portfolio.name);

      // Check if user is authenticated
      if (!isAuthenticated) {
        console.log("User not authenticated, adding to local cart and redirecting to login");
        
        // Add portfolio to local cart first
        await addToCart(portfolio._id, 1, {
          name: portfolio.name,
          subscriptionFee: portfolio.subscriptionFee || []
        });
        
        // Store the cart path for redirect after login
        sessionStorage.setItem("redirectPath", "/cart");
        sessionStorage.setItem("addToCartAction", "true");
        
        toast({
          title: "Login Required",
          description: "Please log in to complete adding items to your cart.",
          variant: "destructive",
        });
        
        // Redirect to login page
        router.push("/login");
        return;
      }

      // Add to cart with error handling
      try {
        // Always add with quantity 1
        await addToCart(portfolio._id, 1);
        
        toast({
          title: "Added to Cart",
          description: `${portfolio.name} has been added to your cart.`,
        });
        
        console.log("Successfully added to cart:", portfolio._id);
      } catch (cartError: any) {
        console.error("Error in cart operation:", cartError);
        toast({
          title: "Cart Error",
          description: "There was an issue with your cart. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error adding to cart:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add portfolio to cart.",
        variant: "destructive",
      });
    }
  };

  const handleViewDetails = (portfolioId: string) => {
    // Additional check before navigation
    const portfolio = portfolios.find(p => p._id === portfolioId);
    if (portfolio && hasPortfolioAccess(portfolio)) {
      router.push(`/model-portfolios/${portfolioId}`);
    } else {
      toast({
        title: "Access Required",
        description: "Please subscribe to view this portfolio's details.",
        variant: "destructive",
      });
    }
  };

  const handleMethodologyClick = (
    portfolioId: string,
    portfolioName: string
  ) => {
    setMethodologyModal({
      isOpen: true,
      portfolioId,
      portfolioName,
    });
  };

  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="max-w-6xl mx-auto">
          <PageHeader
            title="MODEL PORTFOLIOS" 
            subtitle="Discover our expertly crafted investment strategies"
            size="lg"
          />
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <PageHeader
          title="MODEL PORTFOLIOS"
          subtitle="Discover our expertly crafted investment strategies"
        />
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6" data-tour="portfolios-grid">
            {portfolios.map((portfolio) => {
              const hasAccess = hasPortfolioAccess(portfolio);
              const isLocked = !hasAccess;
              
              // Debug logging for each portfolio access check
              console.log(`🔍 Portfolio Access Check:`, {
                portfolioId: portfolio._id,
                portfolioName: portfolio.name,
                hasAccess: hasAccess,
                isInAccessArray: subscriptionAccess?.portfolioAccess.includes(portfolio._id),
                accessArray: subscriptionAccess?.portfolioAccess,
                isLocked: isLocked
              });
              // Find methodology PDF link in description array
              let methodologyLink: string | undefined = undefined;
              if (Array.isArray(portfolio.description)) {
                const methodologyItem = portfolio.description.find(
                  (item: any) => item.key === "methodology PDF link"
                );
                if (methodologyItem && methodologyItem.value) {
                  methodologyLink = methodologyItem.value;
                }
              }
              return (
                <Card key={portfolio._id} className="overflow-hidden relative">
                  {isLocked && (
                    <div className="absolute bottom-1/2 left-1/3 transform -translate-x-1/2 flex items-center gap-3 text-sm text-gray-700 z-20">
                      <div className="bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full p-2 shadow-lg transition-transform hover:scale-110">
                        <Lock className="h-5 w-5 text-[#FFFFF0] animate-[wiggle_1s_ease-in-out_infinite]" />
                      </div>
                    </div>
                  )}
                  <CardContent className="p-4 sm:p-6">
                    {/* Mobile-responsive header section */}
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-3 sm:mb-4 space-y-3 sm:space-y-0">
                      <div className="flex items-start space-x-3 sm:space-x-4">
                        <div className="bg-blue-100 p-2 sm:p-3 rounded-lg flex-shrink-0">
                          <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg sm:text-xl font-semibold leading-tight">
                              {portfolio.name}
                            </h3>
                            {isLocked && (
                              <Lock className="h-4 w-4 text-gray-400" />
                            )}
                          </div>
                          <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">
                            {renderDescription(portfolio.description)}
                          </p>
                        </div>
                      </div>
                      {/* Methodology button */}
                      <div className="flex flex-row gap-2 w-full sm:w-auto justify-center sm:justify-start">
                        {hasAccess ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(portfolio._id)}
                          >
                            <Eye className="h-4 w-4" />
                            <span className="text-xs sm:text-sm">
                              View Details
                            </span>
                          </Button>
                        ) : methodologyLink ? (
                          <a
                            href={methodologyLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center space-x-1 flex-1 sm:flex-none sm:w-auto"
                          >
                            <Button variant="outline" size="sm">
                              <FileText className="h-4 w-4" />
                              <span className="text-xs sm:text-sm">
                                View Methodology
                              </span>
                            </Button>
                          </a>
                        ) : null}
                      </div>
                    </div>

                    {/* Mobile-responsive metrics grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-4 mb-4 sm:mb-6">
                      <div
                        className={`p-2 sm:p-4 bg-gray-50 rounded-lg relative group ${
                          isLocked ? "overflow-hidden" : ""
                        }`}
                      >
                        <p className="text-xs sm:text-sm text-gray-600 mb-1">
                          Monthly Gains
                        </p>
                        <div className="relative">
                          <p
                            className={`text-lg sm:text-xl font-semibold ${
                              isLocked
                                ? "blur-sm text-green-600"
                                : safeNumber(portfolio.monthlyGains) >= 0
                                ? "text-green-600"
                                : "text-red-600"
                            } ${
                              safeNumber(portfolio.monthlyGains) === 0
                                ? "cursor-help"
                                : ""
                            }`}
                          >
                            {isLocked
                              ? `+${
                                  Math.floor(Math.random() * 20) + 5
                                }.${Math.floor(Math.random() * 99)}%`
                              : safeNumber(portfolio.monthlyGains) === 0
                              ? "-"
                              : `${safeString(portfolio.monthlyGains)}%`}
                            {safeNumber(portfolio.monthlyGains) === 0 && (
                              <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-[#FFFFF0] text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-20">
                                Updates Frequently
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div
                        className={`p-2 sm:p-4 bg-gray-50 rounded-lg relative group ${
                          isLocked ? "overflow-hidden" : ""
                        }`}
                      >
                        <p className="text-xs sm:text-sm text-gray-600 mb-1">
                          1 Year Gains
                        </p>
                        <div className="relative">
                          <p
                            className={`text-lg sm:text-xl font-semibold ${
                              isLocked
                                ? "blur-sm text-green-600"
                                : safeNumber(portfolio.oneYearGains) >= 0
                                ? "text-green-600"
                                : "text-red-600"
                            } ${
                              safeNumber(portfolio.oneYearGains) === 0
                                ? "cursor-help"
                                : ""
                            }`}
                          >
                            {isLocked
                              ? `+${
                                  Math.floor(Math.random() * 15) + 2
                                }.${Math.floor(Math.random() * 99)}%`
                              : safeNumber(portfolio.oneYearGains) === 0
                              ? "-"
                              : `${safeString(portfolio.oneYearGains)}%`}
                            {safeNumber(portfolio.oneYearGains) === 0 && (
                              <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-[#FFFFF0] text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-20">
                                Updates Frequently
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div
                        className={`p-2 sm:p-4 bg-gray-50 rounded-lg relative group ${
                          isLocked ? "overflow-hidden" : ""
                        }`}
                      >
                        <p className="text-xs sm:text-sm text-gray-600 mb-1">
                          CAGR Since Inception
                        </p>
                        <div className="relative">
                          <p
                            className={`text-lg sm:text-xl font-semibold ${
                              isLocked
                                ? "blur-sm text-green-600"
                                : safeNumber(portfolio.CAGRSinceInception) >= 0
                                ? "text-green-600"
                                : "text-red-600"
                            } ${
                              safeNumber(portfolio.CAGRSinceInception) === 0
                                ? "cursor-help"
                                : ""
                            }`}
                          >
                            {isLocked
                              ? `+${
                                  Math.floor(Math.random() * 25) + 10
                                }.${Math.floor(Math.random() * 99)}%`
                              : safeNumber(portfolio.CAGRSinceInception) === 0
                              ? "-"
                              : `${safeString(portfolio.CAGRSinceInception)}%`}
                            {safeNumber(portfolio.CAGRSinceInception) === 0 && (
                              <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-[#FFFFF0] text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-20">
                                Updates Frequently
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="p-2 sm:p-4 bg-gray-50 rounded-lg group">
                        <p className="text-xs sm:text-sm text-gray-600 mb-1">
                          Monthly Contribution
                        </p>
                        <div className="relative">
                          <p className={`text-lg sm:text-xl font-semibold text-blue-600 ${portfolio.monthlyContribution === 0 ? 'cursor-help' : ''}`}>
                            {portfolio.monthlyContribution === 0 ? '-' : `₹${portfolio.monthlyContribution}`}
                            {portfolio.monthlyContribution === 0 && (
                              <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-[#FFFFF0] text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-20">
                                Updates Frequently
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="p-2 sm:p-4 bg-gray-50 rounded-lg group">
                        <p className="text-xs sm:text-sm text-gray-600 mb-1">
                          Min. Investment
                        </p>
                        <div className="relative">
                          <p
                            className={`text-lg sm:text-xl font-semibold text-gray-900 ${
                              safeNumber(portfolio.minInvestment) === 0
                                ? "cursor-help"
                                : ""
                            }`}
                          >
                            {safeNumber(portfolio.minInvestment) === 0
                              ? "-"
                              : `₹${safeString(portfolio.minInvestment)}`}
                            {safeNumber(portfolio.minInvestment) === 0 && (
                              <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-[#FFFFF0] text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-20">
                                Updates Frequently
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Action section */}
                    {hasAccess ? (
                      <div className="flex flex-row gap-2">
                        {methodologyLink ? (
                          <a
                            href={methodologyLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center space-x-1 flex-1"
                          >
                            <Button variant="outline" size="sm" className="w-full">
                              <FileText className="h-4 w-4" />
                              <span className="text-xs sm:text-sm">
                                View Methodology
                              </span>
                            </Button>
                          </a>
                        ) : null}
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center justify-center space-x-1 flex-1"
                          onClick={() =>
                            router.push(
                              `/model-portfolios/${portfolio._id}#reports`
                            )
                          }
                        >
                          <ClipboardList className="h-4 w-4" />
                          <span
                            className="text-xs sm:text-sm"
                            id="reports-section"
                          >
                            Reports
                          </span>
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between bg-blue-50 p-3 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Lock className="h-4 w-4 text-blue-600" />
                          <p className="text-sm text-blue-900">
                            {portfolio.message ||
                              "Subscribe to view complete details"}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          className="bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full p-2 shadow-lg transition-transform hover:scale-110"
                          onClick={() => {
                            // Create a bundle-like object for the portfolio
                            const portfolioBundle: PortfolioBundle = {
                              _id: portfolio._id,
                              name: portfolio.name,
                              description: renderDescription(portfolio.description),
                              category: 'portfolio',
                              portfolios: [{ name: portfolio.name }],
                              quarterlyPrice: portfolio.subscriptionFee?.find(f => f.type === 'quarterly')?.price || 0,
                              yearlyPrice: portfolio.subscriptionFee?.find(f => f.type === 'yearly')?.price || 0,
                              monthlyPrice: portfolio.subscriptionFee?.find(f => f.type === 'monthly')?.price || 0
                            };
                            setSelectedPortfolioBundle(portfolioBundle);
                            setShowPaymentModal(true);
                          }}
                        >
                          <ShoppingCart className="h-4 w-4 mr-1" />
                          Subscribe Now
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <MethodologyModal
        isOpen={methodologyModal.isOpen}
        onClose={() =>
          setMethodologyModal({
            isOpen: false,
            portfolioId: "",
            portfolioName: "",
          })
        }
        portfolioId={methodologyModal.portfolioId}
        portfolioName={methodologyModal.portfolioName}
      />
      {showPaymentModal && selectedPortfolioBundle && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedPortfolioBundle(null);
          }}
          bundle={selectedPortfolioBundle}
        />
      )}
    </DashboardLayout>
  );
}
