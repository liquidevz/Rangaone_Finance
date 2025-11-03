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
import { Loader2, Calculator, TrendingUp, AlertCircle, Download, Copy } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatActionForDisplay, getActionColorScheme } from '@/lib/action-display-utils';

interface StockAllocation {
  symbol: string;
  weight: number;
  price: number;
  action: string; // Use exact API status string
  sharesBought: number;
  actualCost: number;
}

interface CalculationResult {
  stocks: StockAllocation[];
  totalInvested: number;
  freeCashRemaining: number;
}

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
    
    // Get all valid holdings for display
    const allValidHoldings = holdings.filter(holding => 
      holding.symbol && 
      typeof holding.buyPrice === 'number' && 
      holding.buyPrice > 0
    );

    if (allValidHoldings.length === 0) {
      throw new Error('Portfolio has no valid holdings with proper data');
    }
    
    // Determine which stocks to actually buy - EXCLUDE HOLD and PARTIAL SELL status stocks
    const excludeFromBuying = (holding: any) => {
      if (!holding.status) return false;
      const status = holding.status.toLowerCase();
      return status.includes('hold') || status.includes('partial sell');
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
      // Even with full investment, exclude HOLD stocks from buying
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
      return bPriority - aPriority;
    });

    const stocks: StockAllocation[] = [];
    let remainingAmount = totalAmount;
    
    // Sort all holdings: buyable stocks first, then others
    const sortedAllHoldings = [...allValidHoldings].sort((a, b) => {
      const aIsBuyable = buyableHoldings.includes(a);
      const bIsBuyable = buyableHoldings.includes(b);
      
      if (aIsBuyable && !bIsBuyable) return -1;
      if (!aIsBuyable && bIsBuyable) return 1;
      
      // Within buyable stocks, sort by priority
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
        return bPriority - aPriority;
      }
      
      return 0;
    });
    
    // Step 1: Ensure at least 1 share of each buyable stock (priority rule)
    prioritizedBuyableHoldings.forEach(holding => {
      if (remainingAmount >= holding.buyPrice) {
        const sharesBought = 1;
        const actualCost = holding.buyPrice;
        remainingAmount -= actualCost;
        
        stocks.push({
          symbol: holding.symbol,
          weight: holding.weight || 0,
          price: holding.buyPrice,
          action: holding.status || 'Fresh Buy', // Use exact API status
          sharesBought,
          actualCost
        });
      }
    });
    
    // Step 2: Apply weightage allocation with 50% rule for additional shares
    stocks.forEach(stock => {
      const allocatedAmount = (stock.weight / 100) * totalAmount;
      const alreadyInvested = stock.actualCost;
      const remainingAllocation = allocatedAmount - alreadyInvested;
      
      if (remainingAllocation > 0 && remainingAmount > 0) {
        // Buy additional whole shares
        const additionalShares = Math.floor(Math.min(remainingAllocation, remainingAmount) / stock.price);
        let additionalCost = additionalShares * stock.price;
        let totalAdditionalShares = additionalShares;
        
        // Apply 50% rule for one more share if needed
        const leftoverAllocation = remainingAllocation - additionalCost;
        const extraNeeded = stock.price - leftoverAllocation;
        
        if (extraNeeded > 0 && extraNeeded <= (stock.price * 0.5) && remainingAmount >= stock.price) {
          totalAdditionalShares += 1;
          additionalCost += stock.price;
        }
        
        // Update stock allocation
        if (totalAdditionalShares > 0 && remainingAmount >= additionalCost) {
          stock.sharesBought += totalAdditionalShares;
          stock.actualCost += additionalCost;
          remainingAmount -= additionalCost;
        }
      }
    });
    
    // Step 3: Add non-buyable stocks to display (0 shares)
    sortedAllHoldings.forEach(holding => {
      const isBuyable = buyableHoldings.includes(holding);
      if (!isBuyable) {
        stocks.push({
          symbol: holding.symbol,
          weight: holding.weight || 0,
          price: holding.buyPrice,
          action: holding.status || 'Fresh Buy', // Use exact API status
          sharesBought: 0,
          actualCost: 0
        });
      }
    });

    // Calculate remaining cash
    remainingAmount = totalAmount - stocks.reduce((sum, stock) => sum + stock.actualCost, 0);

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
      stock.weight.toFixed(2),
      stock.price.toFixed(2),
      stock.sharesBought,
      stock.actualCost.toFixed(2)
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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading portfolios...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-tour="calculator-section">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Investment Calculator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="portfolio">Select Portfolio</Label>
              <Select onValueChange={(value) => {
                const portfolio = portfolios.find(p => p._id === value);
                setSelectedPortfolio(portfolio || null);
                setResult(null);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a portfolio" />
                </SelectTrigger>
                <SelectContent>
                  {portfolios.map((portfolio) => (
                    <SelectItem key={portfolio._id} value={portfolio._id}>
                      {portfolio.name || 'Unnamed Portfolio'} (Min: ₹{(portfolio.minInvestment || 0).toLocaleString()})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Investment Amount (₹)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Enter amount"
                value={investmentAmount}
                onChange={(e) => {
                  setInvestmentAmount(e.target.value);
                  setResult(null);
                }}
              />
            </div>
          </div>

          {selectedPortfolio && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">{selectedPortfolio.name}</h4>
              <p className="text-sm text-blue-700 mb-2">
                {typeof selectedPortfolio.description === 'string' 
                  ? selectedPortfolio.description 
                  : 'Portfolio description not available'
                }
              </p>
              <div className="flex flex-wrap gap-2 text-sm">
                <span className="text-blue-600">Min Investment: ₹{(selectedPortfolio.minInvestment || 0).toLocaleString()}</span>
                <span className="text-blue-600">•</span>
                <span className="text-blue-600">Duration: {selectedPortfolio.durationMonths || 0} months</span>
                <span className="text-blue-600">•</span>
                <span className="text-blue-600">Holdings: {selectedPortfolio.holdings?.length || 0} stocks</span>
              </div>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button 
            onClick={calculateInvestment} 
            disabled={!selectedPortfolio || !investmentAmount || calculating}
            className="w-full"
          >
            {calculating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Calculating...
              </>
            ) : (
              <>
                <TrendingUp className="h-4 w-4 mr-2" />
                Calculate Investment
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card ref={resultsRef}>
          <CardHeader>
            <CardTitle>Investment Allocation Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">₹{result.totalInvested.toLocaleString()}</div>
                <div className="text-sm text-green-700">Total Invested</div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">₹{result.freeCashRemaining.toLocaleString()}</div>
                <div className="text-sm text-blue-700">Cash Remaining</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{result.stocks.filter(s => s.sharesBought > 0).length}</div>
                <div className="text-sm text-purple-700">Stocks Purchased</div>
              </div>
            </div>

            <Separator className="my-4" />

            <div className="space-y-4">
              <h4 className="font-semibold text-lg text-blue-600">Stock-wise Allocation</h4>
              {/* Mobile Table Layout */}
              <div className="block lg:hidden overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-600 text-[#FFFFF0] text-xs">
                      <th className="px-2 py-2 text-left font-medium">Stock Name</th>
                      <th className="px-2 py-2 text-center font-medium">Action</th>
                      <th className="px-2 py-2 text-center font-medium">Wt (%)</th>
                      <th className="px-2 py-2 text-center font-medium">Price (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs">
                    {result.stocks.map((stock, index) => (
                      <React.Fragment key={index}>
                        <tr 
                          className={`cursor-pointer transition-all duration-200 ${index % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-blue-50`}
                          onClick={() => setExpandedRow(expandedRow === index ? null : index)}
                        >
                          <td className="px-2 py-2">
                            <div className="font-medium text-blue-600">{stock.symbol}</div>
                            <div className="text-gray-500 text-xs">NSE : {stock.symbol}</div>
                          </td>
                          <td className="px-2 py-2 text-center">
                            <span className={`px-1 py-0.5 rounded text-xs font-medium ${getActionColorScheme(stock.action || '')}`}>
                              {formatActionForDisplay(stock.action || '')}
                            </span>
                          </td>
                          <td className="px-2 py-2 text-center font-medium">{stock.weight.toFixed(2)}%</td>
                          <td className="px-2 py-2 text-center">
                            <div className="inline-block font-medium px-2 py-1 rounded bg-gray-200 text-gray-700 text-xs">
                              ₹{stock.price.toFixed(2)}
                            </div>
                          </td>
                        </tr>
                        {expandedRow === index && (
                          <tr className="bg-blue-50">
                            <td colSpan={4} className="px-2 py-3">
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="text-gray-600 font-medium">Shares:</span>
                                  <div className="text-gray-800 font-medium">{stock.sharesBought}</div>
                                </div>
                                <div>
                                  <span className="text-gray-600 font-medium">Investment:</span>
                                  <div className="text-gray-800 font-medium">
                                    ₹{stock.actualCost.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Desktop Table Layout */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-600 text-[#FFFFF0] text-xs">
                      <th className="px-2 py-2 text-left font-medium">Stock Name</th>
                      <th className="px-2 py-2 text-center font-medium">Action</th>
                      <th className="px-2 py-2 text-center font-medium">Wt (%)</th>
                      <th className="px-2 py-2 text-center font-medium">Price (₹)</th>
                      <th className="px-2 py-2 text-center font-medium">Shares</th>
                      <th className="px-2 py-2 text-center font-medium">Investment (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs">
                    {result.stocks.map((stock, index) => (
                      <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                        <td className="px-2 py-2">
                          <div className="font-medium text-blue-600">{stock.symbol}</div>
                          <div className="text-gray-500 text-xs">NSE : {stock.symbol}</div>
                        </td>
                        <td className="px-2 py-2 text-center">
                          <span className={`px-1 py-0.5 rounded text-xs font-medium ${getActionColorScheme(stock.action || '')}`}>
                            {formatActionForDisplay(stock.action || '')}
                          </span>
                        </td>
                        <td className="px-2 py-2 text-center font-medium">{stock.weight.toFixed(2)}%</td>
                        <td className="px-2 py-2 text-center">
                          <div className="inline-block font-medium px-2 py-1 rounded bg-gray-200 text-gray-700 text-xs">
                            ₹{stock.price.toFixed(2)}
                          </div>
                        </td>
                        <td className="px-2 py-2 text-center">
                          <div className="font-medium text-blue-600">{stock.sharesBought}</div>
                        </td>
                        <td className="px-2 py-2 text-center">
                          <span className="font-medium">
                            ₹{stock.actualCost.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h5 className="font-medium mb-2">Rules Applied:</h5>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• <strong>Step 1 - Priority Purchase:</strong> Buy More → Buy → Fresh Buy (at least 1 share each)</li>
                <li>• <strong>Step 2 - Weightage Allocation:</strong> Additional shares based on portfolio weightage</li>
                <li>• <strong>Step 3 - 50% Rule:</strong> Buy extra share if shortfall ≤ 50% of stock price</li>
                <li>• <strong>Guarantee:</strong> At least 1 share bought even if weightage is low and 50% rule is broken</li>
                <li>• <strong>Cash Balance:</strong> Unused funds remain as cash balance</li>
              </ul>
            </div>

            <div className="mt-6 flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => copyToClipboard(result)}
                className="flex items-center gap-2"
              >
                <Copy className="h-4 w-4" />
                Copy Order List
              </Button>
              <Button 
                variant="outline" 
                onClick={() => downloadCSV(result)}
                className="flex items-center gap-2"
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