"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { portfolioService } from '@/services/portfolio.service';
import { Portfolio } from '@/lib/types';
import {
  Loader2,
  Calculator,
  TrendingUp,
  AlertCircle,
  Download,
  Copy,
  PieChart,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatActionForDisplay, getActionColorScheme } from '@/lib/action-display-utils';
import { FaRupeeSign } from 'react-icons/fa';

// ==================== TYPES ====================
interface StockAllocation {
  symbol: string;
  weight: number;
  price: number;
  action: string;
  sharesBought: number;
  actualCost: number;
  message?: string;
  shortfall?: number;
}

interface CalculationResult {
  stocks: StockAllocation[];
  totalInvested: number;
  freeCashRemaining: number;
}

const stripHtml = (html: string): string => {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').trim();
};

// ==================== UTILITY FUNCTIONS ====================
// Truncate to 2 decimals without rounding (e.g., 7.869 -> 7.86)
const truncateToTwoDecimals = (num: number): string => {
  if (isNaN(num)) return '0.00';
  return (Math.floor(num * 100) / 100).toFixed(2);
};

// Format currency with proper commas (no K/L/Cr)
const formatCurrency = (value: number): string => {
  if (!isFinite(value) || isNaN(value)) return '₹0';
  // Use truncate for formatting to avoid rounding up
  const truncated = Math.floor(value * 100) / 100;
  return `₹${truncated.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};

// ==================== MAIN COMPONENT ====================
export function InvestmentCalculator() {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [selectedPortfolio, setSelectedPortfolio] = useState<Portfolio | null>(null);
  const [investmentAmount, setInvestmentAmount] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [error, setError] = useState<string>('');
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const resultsRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadPortfolios();
  }, []);

  const loadPortfolios = async () => {
    try {
      setLoading(true);
      const data = await portfolioService.getAccessiblePortfolios();
      setPortfolios(data);
    } catch (error) {
      console.error('Failed to load portfolios:', error);
      setError('Failed to load portfolios');
    } finally {
      setLoading(false);
    }
  };

  const calculateInvestment = () => {
    if (!selectedPortfolio || !investmentAmount) {
      setError('Please select a portfolio and enter investment amount');
      return;
    }

    const amount = parseFloat(investmentAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid investment amount');
      return;
    }

    if (!selectedPortfolio.holdings || selectedPortfolio.holdings.length === 0) {
      setError('Selected portfolio has no holdings to invest in');
      return;
    }

    setCalculating(true);
    setError('');

    try {
      const calculation = performCalculation(selectedPortfolio, amount);
      setResult(calculation);
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (error: any) {
      console.error('Calculation error:', error);
      setError(error.message || 'Failed to calculate investment allocation');
    } finally {
      setCalculating(false);
    }
  };

  const performCalculation = (portfolio: Portfolio, totalAmount: number): CalculationResult => {
    const holdings = portfolio.holdings || [];
    const minInvestment = portfolio.minInvestment || 0;

    const allValidHoldings = holdings.filter(holding =>
      holding.symbol &&
      typeof holding.buyPrice === 'number' &&
      holding.buyPrice > 0
    );

    if (allValidHoldings.length === 0) {
      throw new Error('Portfolio has no valid holdings with proper data');
    }

    const excludeFromBuying = (holding: any) => {
      if (!holding.status) return false;
      const status = holding.status.toLowerCase();
      return status.includes('hold') || status.includes('partial sell') || status.includes('full sell');
    };

    let buyableHoldings;
    if (totalAmount < minInvestment) {
      buyableHoldings = allValidHoldings.filter(holding =>
        holding.status &&
        !excludeFromBuying(holding) &&
        (holding.status.toLowerCase().includes('buy more') ||
          holding.status.toLowerCase().includes('addon-buy') ||
          holding.status.toLowerCase().includes('fresh-buy') ||
          (holding.status.toLowerCase().includes('buy') && !holding.status.toLowerCase().includes('fresh')))
      );

      if (buyableHoldings.length === 0) {
        buyableHoldings = allValidHoldings.filter(holding =>
          holding.status &&
          !excludeFromBuying(holding) &&
          holding.status.toLowerCase().includes('fresh-buy')
        );
      }

      if (buyableHoldings.length === 0) {
        throw new Error('No Buy or Buy More stocks available for investment below minimum amount');
      }
    } else {
      buyableHoldings = allValidHoldings.filter(holding => !excludeFromBuying(holding));
    }

    const prioritizedBuyableHoldings = [...buyableHoldings].sort((a, b) => {
      const getStatusPriority = (status: string) => {
        if (!status) return 0;
        const s = status.toLowerCase();
        if (s.includes('buy more') || s.includes('addon-buy')) return 3;
        if (s.includes('buy') && !s.includes('fresh')) return 2;
        if (s.includes('fresh-buy')) return 1;
        return 0;
      };

      const aPriority = getStatusPriority(a.status || '');
      const bPriority = getStatusPriority(b.status || '');

      if (bPriority !== aPriority) {
        return bPriority - aPriority;
      }

      return (b.weight || 0) - (a.weight || 0);
    });

    const stocks: StockAllocation[] = [];
    let remainingAmount = totalAmount;

    const sortedAllHoldings = [...allValidHoldings].sort((a, b) => {
      const aIsBuyable = buyableHoldings.includes(a);
      const bIsBuyable = buyableHoldings.includes(b);

      if (aIsBuyable && !bIsBuyable) return -1;
      if (!aIsBuyable && bIsBuyable) return 1;

      if (aIsBuyable && bIsBuyable) {
        const getStatusPriority = (status: string) => {
          if (!status) return 0;
          const s = status.toLowerCase();
          if (s.includes('buy more') || s.includes('addon-buy')) return 3;
          if (s.includes('buy') && !s.includes('fresh')) return 2;
          if (s.includes('fresh-buy')) return 1;
          return 0;
        };

        const aPriority = getStatusPriority(a.status || '');
        const bPriority = getStatusPriority(b.status || '');

        if (bPriority !== aPriority) {
          return bPriority - aPriority;
        }

        return (b.weight || 0) - (a.weight || 0);
      }

      return 0;
    });

    prioritizedBuyableHoldings.forEach(holding => {
      if (remainingAmount >= holding.buyPrice) {
        const sharesBought = 1;
        const actualCost = holding.buyPrice;
        remainingAmount -= actualCost;

        stocks.push({
          symbol: holding.symbol,
          weight: holding.weight || 0,
          price: holding.buyPrice,
          action: holding.status || 'Fresh Buy',
          sharesBought,
          actualCost
        });
      } else {
        // Add to list even if we can't afford it yet (will clear Step 2 checks or show 0)
        stocks.push({
          symbol: holding.symbol,
          weight: holding.weight || 0,
          price: holding.buyPrice,
          action: holding.status || 'Fresh Buy',
          sharesBought: 0,
          actualCost: 0
        });
      }
    });

    stocks.forEach(stock => {
      const allocatedAmount = (stock.weight / 100) * totalAmount;
      const alreadyInvested = stock.actualCost;
      const remainingAllocation = Math.max(0, allocatedAmount - alreadyInvested);

      if (remainingAllocation > 0 && remainingAmount > 0) {
        const additionalShares = Math.floor(Math.min(remainingAllocation, remainingAmount) / stock.price);
        let additionalCost = additionalShares * stock.price;
        let totalAdditionalShares = additionalShares;

        // Calculate "leftover" from the *intended* allocation
        const currentTotalCost = alreadyInvested + additionalCost;
        const leftoverFromTarget = allocatedAmount - currentTotalCost;

        const halfPrice = stock.price * 0.5;
        let msg = "";
        let shortfallAmount = 0;

        // 50% Rule Check
        // 50% Rule Check
        if (leftoverFromTarget >= halfPrice) {
          // If we are close enough (>= 50% of a share's worth allocated), we buy it
          totalAdditionalShares += 1;
          additionalCost += stock.price;
        }

        if (totalAdditionalShares > 0) {
          stock.sharesBought += totalAdditionalShares;
          stock.actualCost += additionalCost;
          remainingAmount -= additionalCost;
        }
      } else {
        // No remaining allocation or no cash
        // Check 50% rule based on "allocated vs actual"
        const allocatedAmount = (stock.weight / 100) * totalAmount;
        const currentTotalCost = stock.actualCost;
        const leftoverFromTarget = allocatedAmount - currentTotalCost;

        if (leftoverFromTarget >= (stock.price * 0.5)) {
          // Force buy one more if we satisfy >= 50%
          stock.sharesBought += 1;
          stock.actualCost += stock.price;
          remainingAmount -= stock.price;
        }
      }
    });

    sortedAllHoldings.forEach(holding => {
      const isBuyable = buyableHoldings.includes(holding);
      if (!isBuyable) {
        stocks.push({
          symbol: holding.symbol,
          weight: holding.weight || 0,
          price: holding.buyPrice,
          action: holding.status || 'Fresh Buy',
          sharesBought: 0,
          actualCost: 0
        });
      }
    });

    const totalInvested = stocks.reduce((sum, stock) => sum + stock.actualCost, 0);
    const freeCashRemaining = totalAmount - totalInvested;

    return {
      stocks,
      totalInvested,
      freeCashRemaining
    };
  };

  const copyToClipboard = (result: CalculationResult) => {
    const orderList = result.stocks
      .filter(stock => stock.sharesBought > 0)
      .map(stock => `${stock.symbol}: ${stock.sharesBought} shares @ ₹${stock.price}`)
      .join('\n');

    const summary = `Investment Order List\n${'='.repeat(20)}\n${orderList}\n\nTotal Investment: ₹${result.totalInvested.toLocaleString()}\nCash Remaining: ₹${result.freeCashRemaining.toLocaleString()}`;

    navigator.clipboard.writeText(summary).then(() => {
      alert('Order list copied to clipboard!');
    }).catch(() => {
      alert('Failed to copy to clipboard');
    });
  };

  const downloadCSV = (result: CalculationResult) => {
    const headers = ['Stock Symbol', 'Action', 'Weight %', 'Price', 'Shares Bought', 'Investment Amount'];
    const rows = result.stocks.map(stock => [
      stock.symbol,
      formatActionForDisplay(stock.action),
      truncateToTwoDecimals(stock.weight),
      truncateToTwoDecimals(stock.price),
      stock.sharesBought,
      truncateToTwoDecimals(stock.actualCost)
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `investment-allocation-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // ==================== LOADING STATE ====================
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-gray-500 mx-auto" />
          <p className="text-base font-medium text-gray-600">Loading portfolios...</p>
        </div>
      </div>
    );
  }

  // ==================== RENDER ====================
  return (
    <div className="space-y-6" data-tour="calculator-section">
      {/* ==================== INPUT CARD ==================== */}
      <Card className="shadow-sm border border-gray-200">
        <CardHeader className="bg-gray-50 border-b border-gray-200">
          <CardTitle className="flex items-center gap-2 text-lg text-gray-800">
            <Calculator className="h-5 w-5 text-gray-600" />
            Investment Calculator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 p-5 bg-white">
          {/* Portfolio & Amount Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Portfolio Selection */}
            <div className="space-y-2">
              <Label htmlFor="portfolio" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <PieChart className="h-4 w-4 text-gray-500" />
                Select Portfolio
              </Label>
              <Select
                onValueChange={(value) => {
                  const portfolio = portfolios.find(p => p._id === value);
                  setSelectedPortfolio(portfolio || null);
                  setResult(null);
                  setError('');
                }}
              >
                <SelectTrigger className="h-11 border border-gray-300 bg-white text-gray-800 hover:border-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                  <SelectValue placeholder="Choose a portfolio" />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200">
                  {portfolios.map((portfolio) => (
                    <SelectItem key={portfolio._id} value={portfolio._id} className="text-gray-800 focus:bg-blue-50 focus:text-blue-800">
                      <div className="flex flex-col">
                        <span className="font-medium">{portfolio.name || 'Unnamed Portfolio'}</span>
                        <span className="text-xs text-gray-500">
                          Min: {formatCurrency(portfolio.minInvestment || 0)}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Investment Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <FaRupeeSign className="h-3.5 w-3.5 text-gray-500" />
                Investment Amount (₹)
              </Label>
              <Input
                id="amount"
                type="number"
                placeholder="Enter amount"
                value={investmentAmount}
                onChange={(e) => {
                  setInvestmentAmount(e.target.value);
                  setResult(null);
                  setError('');
                }}
                onWheel={(e) => e.currentTarget.blur()}
                className="h-11 border border-gray-300 bg-white text-gray-800 hover:border-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-base font-medium placeholder:text-gray-400"
                step="0.01"
                min="0"
              />
            </div>
          </div>

          {/* Portfolio Details */}
          {selectedPortfolio && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
              <h4 className="font-semibold text-blue-900 mb-2">{selectedPortfolio.name}</h4>
              <p className="text-sm text-blue-700 mb-3">
                {Array.isArray(selectedPortfolio.description)
                  ? stripHtml(selectedPortfolio.description.find((item: any) => item.key === 'home card')?.value || '')
                  : stripHtml(selectedPortfolio.description || '')}
              </p>
              <div className="flex flex-wrap gap-3 text-sm">
                <span className="px-3 py-1.5 bg-white rounded-md border border-blue-200 text-blue-700">
                  Min: {formatCurrency(selectedPortfolio.minInvestment || 0)}
                </span>
                <span className="px-3 py-1.5 bg-white rounded-md border border-blue-200 text-blue-700">
                  Duration: {selectedPortfolio.durationMonths || 0} months
                </span>
                <span className="px-3 py-1.5 bg-white rounded-md border border-blue-200 text-blue-700">
                  Holdings: {selectedPortfolio.holdings?.length || 0} stocks
                </span>
              </div>
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Calculate Button */}
          <Button
            onClick={calculateInvestment}
            disabled={!selectedPortfolio || !investmentAmount || calculating}
            className="w-full h-12 text-base font-semibold bg-blue-600 hover:bg-blue-700 text-white"
          >
            {calculating ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Calculating...
              </>
            ) : (
              <>
                <TrendingUp className="h-5 w-5 mr-2" />
                Calculate Investment
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* ==================== RESULTS CARD ==================== */}
      {result && (
        <Card ref={resultsRef} className="shadow-sm border border-gray-200">
          <CardHeader className="bg-gray-50 border-b border-gray-200">
            <CardTitle className="flex items-center gap-2 text-lg text-gray-800">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Investment Allocation Results
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 bg-white">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="text-2xl font-bold text-green-700 mb-1">
                  {formatCurrency(result.totalInvested)}
                </div>
                <div className="text-sm text-green-600 font-medium">Total Invested</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-2xl font-bold text-blue-700 mb-1">
                  {formatCurrency(result.freeCashRemaining)}
                </div>
                <div className="text-sm text-blue-600 font-medium">Cash Remaining</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200 sm:col-span-2 lg:col-span-1">
                <div className="text-2xl font-bold text-purple-700 mb-1">
                  {result.stocks.filter(s => s.sharesBought > 0).length}
                </div>
                <div className="text-sm text-purple-600 font-medium">Stocks Purchased</div>
              </div>
            </div>

            {/* Shortfall Alert */}
            {result.freeCashRemaining < 0 && (
              <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600" />
                <div>
                  <div className="font-bold text-amber-800">Additional Funds Required: ₹{Math.abs(result.freeCashRemaining).toLocaleString()}</div>
                  <div className="text-sm text-amber-700">Some stocks were auto-allocated to maintain &gt;50% weightage coverage. Please add this amount to fulfill the order.</div>
                </div>
              </div>
            )}

            <Separator className="my-5" />

            {/* Stock Allocation Table */}
            <div className="space-y-4">
              <h4 className="font-semibold text-base text-gray-800">
                Stock-wise Allocation
              </h4>

              {/* Mobile Table */}
              <div className="block lg:hidden">
                <div className="space-y-2">
                  {result.stocks.map((stock, index) => (
                    <div
                      key={index}
                      className={`rounded-lg border overflow-hidden ${stock.sharesBought > 0
                        ? 'border-gray-200 bg-white shadow-sm'
                        : 'border-gray-100 bg-gray-50'
                        }`}
                    >
                      <div
                        className="p-3 cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => setExpandedRow(expandedRow === index ? null : index)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <div className="font-semibold text-gray-800">{stock.symbol}</div>
                            <div className="text-xs text-gray-500">NSE : {stock.symbol}</div>
                          </div>
                          {expandedRow === index ? (
                            <ChevronUp className="h-5 w-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-gray-400" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getActionColorScheme(stock.action)}`}>
                            {formatActionForDisplay(stock.action)}
                          </span>
                          <span className="text-xs text-gray-500">
                            Weight: {truncateToTwoDecimals(stock.weight)}%
                          </span>
                        </div>
                      </div>

                      {expandedRow === index && (
                        <div className="p-3 bg-gray-50 border-t border-gray-100">
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <div className="text-xs text-gray-500 mb-0.5">Price</div>
                              <div className="font-semibold text-gray-800">{formatCurrency(stock.price)}</div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-500 mb-0.5">Shares</div>
                              <div className="font-semibold text-gray-800">{stock.sharesBought}</div>
                            </div>
                            <div className="col-span-2">
                              <div className="text-xs text-gray-500 mb-0.5">Investment</div>
                              <div className="font-bold text-green-700">
                                {formatCurrency(stock.actualCost)}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Desktop Table */}
              <div className="hidden lg:block overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Stock Name</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Action</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Weight</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Price</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Shares</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Investment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {result.stocks.map((stock, index) => (
                      <tr
                        key={index}
                        className={`${stock.sharesBought > 0
                          ? 'bg-white hover:bg-gray-50'
                          : 'bg-gray-50/50'
                          }`}
                      >
                        <td className="px-4 py-3">
                          <div className="font-semibold text-blue-600">{stock.symbol}</div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getActionColorScheme(stock.action)}`}>
                            {formatActionForDisplay(stock.action)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-sm font-medium text-gray-700">
                          {truncateToTwoDecimals(stock.weight)}%
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-sm font-medium text-gray-700 px-2 py-1 bg-gray-100 rounded">
                            {formatCurrency(stock.price)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-base font-bold ${stock.sharesBought > 0 ? 'text-blue-600' : 'text-gray-400'
                            }`}>
                            {stock.sharesBought}
                          </span>
                        </td>
                        <td className="px-2 py-2 text-center">
                          <span className="font-medium">
                            ₹{truncateToTwoDecimals(stock.actualCost)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Rules Applied */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h5 className="font-semibold text-gray-800 mb-2">Rules Applied:</h5>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• <strong>Step 1 - Priority Purchase:</strong> Buy More → Buy → Fresh Buy (sorted by weight)</li>
                <li>• <strong>Step 2 - Weightage Allocation:</strong> Additional shares based on portfolio weightage</li>
                <li>• <strong>Step 3 - 50% Rule:</strong> Buy extra share if shortfall ≤ 50% of stock price</li>
                <li>• <strong>Exclusions:</strong> HOLD, PARTIAL SELL, FULL SELL excluded from purchase</li>
                <li>• <strong>Cash Balance:</strong> Unused funds remain as cash balance</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                onClick={() => copyToClipboard(result)}
                className="flex items-center justify-center gap-2"
              >
                <Copy className="h-4 w-4" />
                Copy Order List
              </Button>
              <Button
                variant="outline"
                onClick={() => downloadCSV(result)}
                className="flex items-center justify-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download CSV
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}