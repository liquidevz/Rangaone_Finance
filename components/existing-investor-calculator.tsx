"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { portfolioService } from '@/services/portfolio.service';
import { userPortfolioService } from '@/services/user-portfolio.service';
import { Portfolio } from '@/lib/types';
import {
    Loader2,
    Calculator,
    TrendingUp,
    TrendingDown,
    AlertCircle,
    Download,
    Copy,
    PieChart,
    ChevronDown,
    ChevronUp,
    Plus,
    IndianRupee,
    RefreshCw
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatActionForDisplay, getActionColorScheme } from '@/lib/action-display-utils';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// ==================== CONSTANTS ====================
const WEIGHTAGE_TOLERANCE = 0.5;

// ==================== TYPES ====================
interface StockHolding {
    symbol: string;
    action: string;
    targetWeight: number;
    currentPrice: number;
    quantity: number;
    currentValue: number;
    yourWeight: number;
    difference: number;
    status: 'ok' | 'overweight' | 'underweight';
}

interface AllocationRecommendation {
    symbol: string;
    action: string;
    currentQty: number;
    addQty: number;
    ltp: number;
    investmentNeeded: number;
    reason: string;
    targetWeight: number;
}

// ==================== UTILITY FUNCTIONS ====================
// Format currency with proper commas (no K/L/Cr)
const formatCurrency = (value: number): string => {
    if (!isFinite(value) || isNaN(value)) return '₹0';
    const truncated = Math.floor(value * 100) / 100;
    return `₹${truncated.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};

// Truncate to 2 decimals without rounding (e.g., 7.869 -> 7.86)
const truncateToTwoDecimals = (num: number): string => {
    if (isNaN(num)) return '0.00';
    return (Math.floor(num * 100) / 100).toFixed(2);
};

const stripHtml = (html: string): string => {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '').trim();
};

// Underweight = GREEN (buy signal) - gradient based on severity
const getUnderweightColor = (difference: number, targetWeight: number): string => {
    if (targetWeight === 0) return 'text-green-300';
    const percentageOff = Math.abs(difference) / targetWeight;
    if (percentageOff >= 1) return 'text-green-700';
    if (percentageOff >= 0.75) return 'text-green-600';
    if (percentageOff >= 0.5) return 'text-green-500';
    if (percentageOff >= 0.25) return 'text-green-400';
    return 'text-green-300';
};

// Overweight = RED (reduce signal) - gradient based on severity
const getOverweightColor = (difference: number, targetWeight: number): string => {
    if (targetWeight === 0) return 'text-red-300';
    const percentageOff = Math.abs(difference) / targetWeight;
    if (percentageOff >= 1) return 'text-red-700';
    if (percentageOff >= 0.75) return 'text-red-600';
    if (percentageOff >= 0.5) return 'text-red-500';
    if (percentageOff >= 0.25) return 'text-red-400';
    return 'text-red-300';
};

// ==================== MAIN COMPONENT ====================
export function ExistingInvestorCalculator() {
    const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
    const [selectedPortfolio, setSelectedPortfolio] = useState<Portfolio | null>(null);
    const [stockQuantities, setStockQuantities] = useState<Record<string, number>>({});
    const [cashHolding, setCashHolding] = useState<string>('');
    const [newInvestmentAmount, setNewInvestmentAmount] = useState<string>('');
    const [strictBudget, setStrictBudget] = useState(true);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>('');
    const [syncing, setSyncing] = useState(false);
    const [expandedRow, setExpandedRow] = useState<string | null>(null);
    const [expandedAllocRow, setExpandedAllocRow] = useState<string | null>(null);
    const [showAllocation, setShowAllocation] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [showValidationWarning, setShowValidationWarning] = useState(false);
    const [showNoPortfolioModal, setShowNoPortfolioModal] = useState(false);
    const resultsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadPortfolios();
    }, []);

    useEffect(() => {
        if (selectedPortfolio?.holdings) {
            const initialQuantities: Record<string, number> = {};
            selectedPortfolio.holdings.forEach(holding => {
                initialQuantities[holding.symbol] = 0;
            });
            setStockQuantities(initialQuantities);
            setCashHolding('');
            setNewInvestmentAmount('');
            setShowAllocation(false);
            setShowResults(false);
        }
    }, [selectedPortfolio]);

    const handleSyncQuantity = async () => {
        if (!selectedPortfolio?._id) return;

        setSyncing(true);
        try {
            // Get saved portfolio data
            const response = await userPortfolioService.getSavedPortfolio(selectedPortfolio._id, true);
            const data = response?.data || null;

            if (!data) {
                // No saved portfolio found, show modal
                setShowNoPortfolioModal(true);
                setSyncing(false);
                return;
            }

            // Update stock quantities with saved values
            const updatedQuantities: Record<string, number> = { ...stockQuantities };
            data.holdings.forEach((holding: any) => {
                if (holding.stockSymbol) {
                    updatedQuantities[holding.stockSymbol] = holding.quantity || 0;
                }
            });

            setStockQuantities(updatedQuantities);
        } catch (error) {
            console.error("Sync failed:", error);
            // Show error in a simple way since we don't have toast here
            alert("Failed to sync quantities. Please try again.");
        } finally {
            setSyncing(false);
        }
    };

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

    const handleQuantityChange = (symbol: string, value: string) => {
        const numValue = value === '' ? 0 : parseInt(value, 10);
        setStockQuantities(prev => ({
            ...prev,
            [symbol]: isNaN(numValue) ? 0 : Math.max(0, numValue)
        }));
    };

    // Calculate cash value
    const cashValue = parseFloat(cashHolding) || 0;

    // Auto-calculate stocks
    const calculatedStocks = useMemo(() => {
        if (!selectedPortfolio?.holdings) return [];

        const holdings = selectedPortfolio.holdings;

        // Calculate total holdings value (stocks only)
        let totalHoldingsValue = 0;
        holdings.forEach(holding => {
            const qty = Number(stockQuantities[holding.symbol]) || 0;
            const price = Number(holding.currentPrice) || 0;
            totalHoldingsValue += qty * price;
        });

        const totalPortfolioValue = totalHoldingsValue + cashValue;

        const stockData: StockHolding[] = holdings.map(holding => {
            const qty = Number(stockQuantities[holding.symbol]) || 0;
            const currentPrice = Number(holding.currentPrice) || 0;
            const currentValue = qty * currentPrice;

            const yourWeight = totalPortfolioValue > 0 ? (currentValue / totalPortfolioValue) * 100 : 0;
            const targetWeight = Number(holding.weight) || 0;
            const difference = yourWeight - targetWeight;

            let status: 'ok' | 'overweight' | 'underweight' = 'ok';
            if (qty > 0 && Math.abs(difference) > WEIGHTAGE_TOLERANCE) {
                status = difference > 0 ? 'overweight' : 'underweight';
            } else if (qty === 0 && targetWeight > 0) {
                status = 'underweight';
            }

            return {
                symbol: holding.symbol,
                action: holding.status || 'Fresh Buy',
                targetWeight,
                currentPrice,
                quantity: qty,
                currentValue,
                yourWeight,
                difference,
                status
            };
        });

        return stockData.sort((a, b) => b.targetWeight - a.targetWeight);
    }, [selectedPortfolio, stockQuantities, cashValue]);

    // Calculate summary
    const totalHoldingsValue = calculatedStocks.reduce((sum, s) => sum + s.currentValue, 0);
    const totalPortfolioValue = totalHoldingsValue + cashValue;
    const hasAnyQuantity = Object.values(stockQuantities).some(q => q > 0);

    // Calculate new investment allocation - SKIP HOLD STOCKS
    const allocationRecommendations = useMemo((): AllocationRecommendation[] => {
        const investAmount = parseFloat(newInvestmentAmount) || 0;
        if (investAmount <= 0 || !selectedPortfolio?.holdings) return [];

        let remainingAmount = investAmount;
        const recommendations: AllocationRecommendation[] = [];
        // Target base: Current Holdings + Max(Existing Cash, New Investment)
        // This prevents double counting if user inputs "Cash" and then types same amount in "Invest"
        const newTotalValue = totalHoldingsValue + Math.max(cashValue, investAmount);

        // Step 1: Stocks with target weight > 0 but user holds 0 quantity (SKIP HOLD)
        const zeroQtyStocks = calculatedStocks
            .filter(s => s.quantity === 0 && s.targetWeight > 0 && s.action.toLowerCase() !== 'hold')
            .sort((a, b) => b.targetWeight - a.targetWeight);

        for (const stock of zeroQtyStocks) {
            if (remainingAmount < stock.currentPrice) continue;
            const targetValue = (stock.targetWeight / 100) * newTotalValue;
            if (stock.currentPrice > targetValue) continue;

            const cost = stock.currentPrice;
            if (cost <= remainingAmount) {
                recommendations.push({
                    symbol: stock.symbol,
                    action: stock.action,
                    currentQty: 0,
                    addQty: 1,
                    ltp: stock.currentPrice,
                    investmentNeeded: cost,
                    reason: 'No holding - add min 1',
                    targetWeight: stock.targetWeight
                });
                remainingAmount -= cost;
            }
        }

        // Step 2: Allocate to underweight stocks (Strict Target Capping)
        const underweightStocks = calculatedStocks
            .filter(s => s.action.toLowerCase() !== 'hold')
            .map(s => {
                // Calculate Exact Value Deficit based on Target % of (Current PV + Investment)
                const targetValue = (s.targetWeight / 100) * newTotalValue;
                const currentValue = s.currentValue;
                const deficitValue = targetValue - currentValue;

                // Determine Ideal Quantity to meet target
                // Use Math.floor to ensure we NEVER exceed the target allocation ("Hard Cap")
                const idealAddQty = Math.floor(deficitValue / s.currentPrice);

                // Account for shares already added in Step 1 (Zero Qty stocks)
                const existingRec = recommendations.find(r => r.symbol === s.symbol);
                const step1Qty = existingRec ? existingRec.addQty : 0;

                // Net shares needed beyond Step 1
                const maxAddQty = Math.max(0, idealAddQty - step1Qty);

                return {
                    ...s,
                    maxAddQty,
                    sharesAdded: 0
                };
            })
            .filter(s => s.maxAddQty > 0)
            .sort((a, b) => b.targetWeight - a.targetWeight); // Prioritize high weight stocks

        // Round Robin Allocation up to Max Cap
        let iterations = 0;
        let active = true;

        while (active && remainingAmount > 0 && iterations < 200000) {
            iterations++;
            active = false;

            for (const stock of underweightStocks) {
                if (stock.sharesAdded < stock.maxAddQty && remainingAmount >= stock.currentPrice) {
                    // Update Recommendation
                    const existingRec = recommendations.find(r => r.symbol === stock.symbol);
                    if (existingRec) {
                        existingRec.addQty += 1;
                        existingRec.investmentNeeded += stock.currentPrice;
                        existingRec.reason = 'Balancing weight';
                    } else {
                        recommendations.push({
                            symbol: stock.symbol,
                            action: stock.action,
                            currentQty: stock.quantity,
                            addQty: 1,
                            ltp: stock.currentPrice,
                            investmentNeeded: stock.currentPrice,
                            reason: 'Balancing weight',
                            targetWeight: stock.targetWeight
                        });
                    }

                    stock.sharesAdded++;
                    remainingAmount -= stock.currentPrice;
                    active = true; // Continue if we made a purchase
                }
            }
        }

        return recommendations.filter(r => r.addQty > 0);
    }, [newInvestmentAmount, calculatedStocks, selectedPortfolio, totalPortfolioValue, strictBudget]);

    const totalAllocationAmount = allocationRecommendations.reduce((sum, r) => sum + r.investmentNeeded, 0);
    const remainingFromAllocation = (parseFloat(newInvestmentAmount) || 0) - totalAllocationAmount;

    const getStatusIndicator = (stock: StockHolding) => {
        if (stock.status === 'ok') {
            return <span className="text-gray-400 text-lg">•</span>;
        } else if (stock.status === 'overweight') {
            // Overweight = RED down arrow (reduce)
            return <span className={`text-lg font-bold ${getOverweightColor(stock.difference, stock.targetWeight)}`}>↑</span>;
        } else {
            // Underweight = GREEN up arrow (buy)
            return <span className={`text-lg font-bold ${getUnderweightColor(stock.difference, stock.targetWeight)}`}>↓</span>;
        }
    };

    const handleAnalyze = () => {
        if (hasAnyQuantity || cashValue > 0) {
            setShowResults(true);
        }
    };

    const copyToClipboard = () => {
        const lines = calculatedStocks
            .filter(stock => stock.quantity > 0)
            .map(stock => `${stock.symbol}: ${stock.quantity} shares @ ₹${stock.currentPrice} = ${formatCurrency(stock.currentValue)} (Your: ${truncateToTwoDecimals(stock.yourWeight)}% | Target: ${truncateToTwoDecimals(stock.targetWeight)}%)`)
            .join('\n');

        const summary = `Portfolio Analysis\n${'='.repeat(25)}\n${lines}\n\nTotal Holdings: ${formatCurrency(totalHoldingsValue)}\nCash: ${formatCurrency(cashValue)}\nTotal Portfolio: ${formatCurrency(totalPortfolioValue)}`;
        navigator.clipboard.writeText(summary);
        alert('Copied!');
    };

    const handleCalculateClick = () => {
        const investAmount = parseFloat(newInvestmentAmount) || 0;
        const cashObj = parseFloat(cashHolding) || 0;

        if (investAmount > cashObj) {
            setShowValidationWarning(true);
            return;
        }

        setShowAllocation(true);
        // Auto-scroll to results after a brief delay
        setTimeout(() => {
            resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    };

    const downloadCSV = () => {
        const headers = ['Stock', 'Qty', 'Price', 'Value', 'Your %', 'Target %', 'Diff %', 'Status'];
        const rows = calculatedStocks.map(s => [
            s.symbol, s.quantity, truncateToTwoDecimals(s.currentPrice), truncateToTwoDecimals(s.currentValue),
            truncateToTwoDecimals(s.yourWeight), truncateToTwoDecimals(s.targetWeight), truncateToTwoDecimals(s.difference), s.status
        ]);
        const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `portfolio-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    // Calculate potential opportunities for message box
    const potentialOpportunities = useMemo(() => {
        // Only show if we have positive remaining cash but not enough to buy one more share
        if (remainingFromAllocation <= 0) return [];

        return calculatedStocks
            .filter(s => {
                // Skip 'Hold'/'Reduce'/'Sell' actions
                const action = s.action.toLowerCase();
                if (action === 'hold' || action === 'reduce' || action === 'sell') return false;

                const price = s.currentPrice;
                // Check if remaining cash covers at least 50% of the price but less than 100%
                return remainingFromAllocation >= (price * 0.5) && remainingFromAllocation < price;
            })
            .map(s => ({
                symbol: s.symbol,
                price: s.currentPrice,
                shortfall: s.currentPrice - remainingFromAllocation,
                targetWeight: s.targetWeight
            }))
            .sort((a, b) => a.shortfall - b.shortfall); // Show smallest shortfall first
    }, [calculatedStocks, remainingFromAllocation]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-10 w-10 animate-spin text-gray-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6" data-tour="existing-calculator-section">
            <AlertDialog open={showValidationWarning} onOpenChange={setShowValidationWarning}>
                <AlertDialogContent className="w-[90%] max-w-md rounded-lg">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Invalid Investment Amount</AlertDialogTitle>
                        <AlertDialogDescription>
                            The investment amount cannot be more than your current cash holding (₹{parseFloat(cashHolding || '0').toLocaleString('en-IN')}).
                            <br /><br />
                            Would you like to reset the investment amount to match your cash holding?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
                        <AlertDialogCancel onClick={() => setShowValidationWarning(false)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                setNewInvestmentAmount(cashHolding);
                                setShowValidationWarning(false);
                            }}
                            className="bg-purple-600 hover:bg-purple-700 text-white"
                        >
                            Reset to Cash Value
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* INPUT CARD */}
            <Card className="shadow-sm border border-gray-200">
                <CardHeader className="bg-gray-50 border-b border-gray-200">
                    <CardTitle className="flex items-center gap-2 text-lg text-gray-800">
                        <Calculator className="h-5 w-5 text-gray-600" />
                        Existing Portfolio Analysis
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5 p-5 bg-white">
                    {/* Portfolio Selection */}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <PieChart className="h-4 w-4 text-gray-500" />
                            Select Portfolio
                        </Label>
                        <Select
                            onValueChange={(value) => {
                                const portfolio = portfolios.find(p => p._id === value);
                                setSelectedPortfolio(portfolio || null);
                                setError('');
                            }}
                        >
                            <SelectTrigger className="h-11 border border-gray-300 bg-white">
                                <SelectValue placeholder="Choose a portfolio" />
                            </SelectTrigger>
                            <SelectContent className="bg-white">
                                {portfolios.map((portfolio) => (
                                    <SelectItem key={portfolio._id} value={portfolio._id}>
                                        {portfolio.name} ({portfolio.holdings?.length || 0} stocks)
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {selectedPortfolio && (
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                            <h4 className="font-semibold text-blue-900 mb-2">{selectedPortfolio.name}</h4>
                            <p className="text-sm text-blue-700 line-clamp-2">
                                {Array.isArray(selectedPortfolio.description)
                                    ? stripHtml(selectedPortfolio.description.find((item: any) => item.key === 'home card')?.value || '')
                                    : stripHtml(selectedPortfolio.description || '')}
                            </p>
                        </div>
                    )}

                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                </CardContent>
            </Card>

            {/* SINGLE TABLE - Real-time updates with editable qty */}
            {selectedPortfolio && selectedPortfolio.holdings && selectedPortfolio.holdings.length > 0 && (
                <Card className="shadow-sm border border-gray-200">
                    <CardHeader className="bg-gray-50 border-b border-gray-200">
                        <CardTitle className="flex items-center gap-2 text-lg text-gray-800">
                            <TrendingUp className="h-5 w-5 text-green-600" />
                            Portfolio Holdings & Analysis
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-5 bg-white">
                        {/* Summary Cards - Real-time update */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                                <div className="text-2xl font-bold text-green-700 mb-1">
                                    {formatCurrency(totalHoldingsValue)}
                                </div>
                                <div className="text-sm text-green-600 font-medium">Holdings Value</div>
                            </div>
                            <div className="text-center p-4 bg-amber-50 rounded-lg border border-amber-200">
                                <div className="text-2xl font-bold text-amber-700 mb-1">
                                    {formatCurrency(cashValue)}
                                </div>
                                <div className="text-sm text-amber-600 font-medium">Cash</div>
                                <Input
                                    type="number"
                                    placeholder="Enter cash"
                                    value={cashHolding}
                                    onChange={(e) => setCashHolding(e.target.value)}
                                    onWheel={(e) => e.currentTarget.blur()}
                                    className="h-8 mt-2 text-center text-sm"
                                    min="0"
                                />
                            </div>
                            <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                                <div className="text-2xl font-bold text-blue-700 mb-1">
                                    {formatCurrency(totalPortfolioValue)}
                                </div>
                                <div className="text-sm text-blue-600 font-medium">Total Portfolio</div>
                            </div>
                        </div>

                        {/* Legend */}
                        <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex flex-wrap gap-3 sm:gap-6 text-sm justify-center sm:justify-start">
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full">
                                    <span className="text-gray-500 font-medium">−</span>
                                    <span className="text-gray-600 font-medium">On Track (±{WEIGHTAGE_TOLERANCE}%)</span>
                                </div>
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-red-100 rounded-full">
                                    <span className="text-red-500 font-bold">↑</span>
                                    <span className="text-red-700 font-medium">Over-bought</span>
                                </div>
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 rounded-full">
                                    <span className="text-green-500 font-bold">↓</span>
                                    <span className="text-green-700 font-medium">Under-bought</span>
                                </div>
                            </div>
                        </div>

                        {/* Combined Table with Editable Qty */}
                        <div className="rounded-lg border border-gray-200">
                            {/* Mobile View (Cards) */}
                            <div className="block md:hidden divide-y divide-gray-100">
                                {calculatedStocks.map((stock, index) => (
                                    <div key={index} className={`p-4 ${stock.status === 'underweight' ? 'bg-green-50' :
                                        stock.status === 'overweight' ? 'bg-red-50' :
                                            'bg-white'
                                        }`}>
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <div className="font-semibold text-gray-900">{stock.symbol}</div>
                                                <div className="text-xs text-gray-500">NSE</div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold ${stock.status === 'ok' ? 'bg-gray-200 text-gray-700' :
                                                    stock.status === 'overweight' ? 'bg-red-500 text-white' :
                                                        'bg-green-500 text-white'
                                                    }`}>
                                                    {stock.status === 'overweight' && '↑'}
                                                    {stock.status === 'underweight' && '↓'}
                                                    {stock.status === 'ok' && '−'}
                                                    {truncateToTwoDecimals(Math.abs(stock.difference))}%
                                                </span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 mb-3">
                                            <div>
                                                <label className="text-xs text-gray-500 block mb-1">Your Quantity</label>
                                                <Input
                                                    type="number"
                                                    placeholder="0"
                                                    value={stockQuantities[stock.symbol] || ''}
                                                    onChange={(e) => handleQuantityChange(stock.symbol, e.target.value)}
                                                    className="h-8 w-full text-center"
                                                    min="0"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-500 block mb-1">Current Value</label>
                                                <div className="font-bold text-gray-900 text-sm py-1.5">
                                                    {formatCurrency(stock.currentValue)}
                                                </div>
                                            </div>
                                        </div>

                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="w-full h-8 text-xs text-gray-500 hover:text-gray-900 hover:bg-gray-100/50"
                                            onClick={() => setExpandedRow(expandedRow === stock.symbol ? null : stock.symbol)}
                                        >
                                            {expandedRow === stock.symbol ? (
                                                <>Less Details <ChevronUp className="h-3 w-3 ml-1" /></>
                                            ) : (
                                                <>More Details <ChevronDown className="h-3 w-3 ml-1" /></>
                                            )}
                                        </Button>

                                        {expandedRow === stock.symbol && (
                                            <div className="mt-3 pt-3 border-t border-gray-200/50 grid grid-cols-2 gap-y-3 text-sm">
                                                <div>
                                                    <div className="text-xs text-gray-500">Price</div>
                                                    <div className="font-medium">₹{truncateToTwoDecimals(stock.currentPrice)}</div>
                                                </div>
                                                <div>
                                                    <div className="text-xs text-gray-500">Your Weight</div>
                                                    <div className={`font-medium ${stock.status === 'underweight' ? 'text-green-600' : stock.status === 'overweight' ? 'text-red-600' : 'text-blue-600'}`}>
                                                        {truncateToTwoDecimals(stock.yourWeight)}%
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="text-xs text-gray-500">Target Weight</div>
                                                    <div className="font-medium text-gray-900">{truncateToTwoDecimals(stock.targetWeight)}%</div>
                                                </div>
                                                <div>
                                                    <div className="text-xs text-gray-500">Difference</div>
                                                    <div className={`font-medium ${stock.difference > 0 ? 'text-blue-600' : 'text-gray-600'}`}>
                                                        {stock.difference > 0 ? '+' : ''}{truncateToTwoDecimals(stock.difference)}%
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Desktop View (Table) */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-gray-100">
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Stock</th>
                                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Qty</th>
                                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Price</th>
                                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Value</th>
                                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Your %</th>
                                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Target %</th>
                                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Diff</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {calculatedStocks.map((stock, index) => (
                                            <tr key={index} className={
                                                stock.quantity === 0 ? 'bg-gray-50/50' :
                                                    stock.status === 'underweight' ? 'bg-green-50 hover:bg-green-100' :
                                                        stock.status === 'overweight' ? 'bg-red-50 hover:bg-red-100' :
                                                            'bg-white hover:bg-gray-50'
                                            }>
                                                <td className="px-4 py-3">
                                                    <div className={`font-semibold ${stock.quantity > 0 ? 'text-blue-600' : 'text-gray-500'}`}>{stock.symbol}</div>
                                                    <div className="text-xs text-gray-500">NSE</div>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <Input
                                                        type="number"
                                                        placeholder="0"
                                                        value={stockQuantities[stock.symbol] || ''}
                                                        onChange={(e) => handleQuantityChange(stock.symbol, e.target.value)}
                                                        onWheel={(e) => e.currentTarget.blur()}
                                                        className="h-9 w-20 text-center mx-auto"
                                                        min="0"
                                                    />
                                                </td>
                                                <td className="px-4 py-3 text-center">₹{truncateToTwoDecimals(stock.currentPrice)}</td>
                                                <td className="px-4 py-3 text-center font-bold text-green-600">₹{(stock.quantity * stock.currentPrice).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                                                <td className="px-4 py-3 text-center font-bold text-blue-600">{truncateToTwoDecimals(stock.yourWeight)}%</td>
                                                <td className="px-4 py-3 text-center text-gray-700">{truncateToTwoDecimals(stock.targetWeight)}%</td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${stock.status === 'ok' ? 'bg-gray-200 text-gray-700' :
                                                        stock.status === 'overweight' ? 'bg-red-500 text-white' :
                                                            'bg-green-500 text-white'
                                                        }`}>
                                                        {stock.status === 'overweight' && '↑'}
                                                        {stock.status === 'underweight' && '↓'}
                                                        {stock.status === 'ok' && '−'}
                                                        {stock.difference > 0 ? '+' : ''}{truncateToTwoDecimals(stock.difference)}%
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="mt-4 flex flex-wrap gap-3">
                            <Button variant="outline" onClick={copyToClipboard} className="flex items-center gap-2">
                                <Copy className="h-4 w-4" /> Copy
                            </Button>
                            <Button variant="outline" onClick={downloadCSV} className="flex items-center gap-2">
                                <Download className="h-4 w-4" /> Export CSV
                            </Button>
                            <Button 
                                variant="outline" 
                                onClick={handleSyncQuantity} 
                                disabled={syncing || !selectedPortfolio}
                                className="flex items-center gap-2"
                            >
                                {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                                Sync with Portfolio
                            </Button>

                        </div>
                    </CardContent>
                </Card>
            )}

            {/* No Portfolio Saved Modal */}
            <AlertDialog open={showNoPortfolioModal} onOpenChange={setShowNoPortfolioModal}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>No Saved Portfolio Found</AlertDialogTitle>
                        <AlertDialogDescription>
                            You haven't saved any holdings for this portfolio yet. Please enter your quantities manually and save the portfolio first in the "My Portfolios" section.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction onClick={() => setShowNoPortfolioModal(false)}>OK</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* NEW INVESTMENT ALLOCATION */}
            {selectedPortfolio && selectedPortfolio.holdings && selectedPortfolio.holdings.length > 0 && (
                <Card className="shadow-sm border border-purple-200">
                    <CardHeader className="bg-purple-50 border-b border-purple-200">
                        <CardTitle className="flex items-center gap-2 text-lg text-purple-800">
                            <Plus className="h-5 w-5 text-purple-600" />
                            Add New Investment
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-5 bg-white">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1">
                                <Label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-2">
                                    <IndianRupee className="h-4 w-4 text-gray-500" />
                                    Amount to Invest (₹)
                                </Label>
                                <Input
                                    type="number"
                                    placeholder="e.g. 50000"
                                    value={newInvestmentAmount}
                                    onChange={(e) => {
                                        setNewInvestmentAmount(e.target.value);
                                        setShowAllocation(false);
                                    }}
                                    onWheel={(e) => e.currentTarget.blur()}
                                    className="h-11"
                                    min="0"
                                />
                            </div>
                            <div className="flex items-end">
                                <Button
                                    onClick={handleCalculateClick}
                                    disabled={!newInvestmentAmount || parseFloat(newInvestmentAmount) <= 0}
                                    className="h-11 px-6 bg-purple-600 hover:bg-purple-700 text-white"
                                >
                                    <Calculator className="h-4 w-4 mr-2" />
                                    Calculate Allocation
                                </Button>
                            </div>
                        </div>

                        {showAllocation && allocationRecommendations.length > 0 && (
                            <div ref={resultsRef}>
                                <Separator className="my-5" />

                                {/* Allocation Summary */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                                    <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                                        <div className="text-2xl font-bold text-green-700 mb-1">
                                            {formatCurrency(totalAllocationAmount)}
                                        </div>
                                        <div className="text-sm text-green-600 font-medium">Total Invested</div>
                                    </div>
                                    <div className={`text-center p-4 rounded-lg border ${remainingFromAllocation < 0 ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
                                        <div className={`text-2xl font-bold mb-1 ${remainingFromAllocation < 0 ? 'text-red-700' : 'text-blue-700'}`}>
                                            {formatCurrency(remainingFromAllocation)}
                                        </div>
                                        <div className={`text-sm font-medium ${remainingFromAllocation < 0 ? 'text-red-600' : 'text-blue-600'}`}>
                                            {remainingFromAllocation < 0 ? 'Shortfall' : 'Cash Remaining'}
                                        </div>
                                    </div>
                                    <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                                        <div className="text-2xl font-bold text-purple-700 mb-1">
                                            {allocationRecommendations.length}/{calculatedStocks.length}
                                        </div>
                                        <div className="text-sm text-purple-600 font-medium">Stocks to Buy</div>
                                    </div>
                                </div>

                                {/* Potential Opportunities Message Box */}
                                {potentialOpportunities.length > 0 && (
                                    <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 bg-amber-100 rounded-full">
                                                <TrendingUp className="h-4 w-4 text-amber-600" />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-semibold text-amber-800 mb-2">Smart Top-up Opportunities</h4>
                                                <p className="text-sm text-amber-700 mb-3">
                                                    Buy any <strong>one</strong> of these stocks to utilize your remaining cash (approx. ₹0 left).
                                                </p>
                                                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                                    {potentialOpportunities.map((opp, idx) => (
                                                        <div key={idx} className="bg-white border border-amber-100 rounded p-2 text-sm flex justify-between items-center shadow-sm">
                                                            <div>
                                                                <span className="font-semibold text-gray-700">{opp.symbol}</span>
                                                                <div className="text-xs text-gray-500">Price: {formatCurrency(opp.price)}</div>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="text-xs text-amber-600">Add only</div>
                                                                <div className="font-bold text-amber-700">{formatCurrency(opp.shortfall)}</div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}


                                <h4 className="font-semibold text-gray-800 mb-3">Stock-wise Allocation</h4>

                                {/* Allocation Table - Show ALL stocks, allocated first */}
                                <div className="rounded-lg border border-green-200 overflow-hidden">
                                    {/* Mobile View (Cards) */}
                                    <div className="block md:hidden divide-y divide-green-100">
                                        {[...calculatedStocks]
                                            .map(stock => {
                                                const rec = allocationRecommendations.find(r => r.symbol === stock.symbol);
                                                return { stock, rec, hasAllocation: rec && rec.addQty > 0 };
                                            })
                                            .sort((a, b) => {
                                                // Priority 1: Fresh allocations (allocation > 0, current qty = 0)
                                                const aIsFreshAlloc = a.hasAllocation && a.stock.quantity === 0;
                                                const bIsFreshAlloc = b.hasAllocation && b.stock.quantity === 0;
                                                if (aIsFreshAlloc && !bIsFreshAlloc) return -1;
                                                if (!aIsFreshAlloc && bIsFreshAlloc) return 1;

                                                // Within fresh allocations, sort by add-on qty descending
                                                if (aIsFreshAlloc && bIsFreshAlloc) {
                                                    return (b.rec?.addQty || 0) - (a.rec?.addQty || 0);
                                                }

                                                // Priority 2: Holdings with allocation (allocation > 0, current qty > 0)
                                                const aIsHoldingWithAlloc = a.hasAllocation && a.stock.quantity > 0;
                                                const bIsHoldingWithAlloc = b.hasAllocation && b.stock.quantity > 0;
                                                if (aIsHoldingWithAlloc && !bIsHoldingWithAlloc) return -1;
                                                if (!aIsHoldingWithAlloc && bIsHoldingWithAlloc) return 1;

                                                // Within holdings with allocation, sort by add-on qty descending
                                                if (aIsHoldingWithAlloc && bIsHoldingWithAlloc) {
                                                    return (b.rec?.addQty || 0) - (a.rec?.addQty || 0);
                                                }

                                                // Priority 3: Holdings without allocation before non-holdings
                                                if (a.stock.quantity > 0 && b.stock.quantity === 0) return -1;
                                                if (a.stock.quantity === 0 && b.stock.quantity > 0) return 1;

                                                return 0;
                                            })
                                            .map(({ stock, rec, hasAllocation }, index) => (
                                                <div key={index} className={`p-4 ${hasAllocation
                                                    ? "bg-green-50/50"
                                                    : stock.quantity > 0
                                                        ? "bg-white"
                                                        : "bg-gray-50/50"
                                                    }`}>
                                                    <div className="flex justify-between items-start mb-3">
                                                        <div>
                                                            <div className="font-semibold text-gray-900">{stock.symbol}</div>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getActionColorScheme(stock.action)}`}>
                                                                    {formatActionForDisplay(stock.action)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        {hasAllocation && (
                                                            <span className="inline-flex items-center px-2 py-1 rounded bg-green-100 text-green-800 text-xs font-bold border border-green-200">
                                                                + {rec?.addQty} Qty
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4 mb-3">
                                                        <div>
                                                            <div className="text-xs text-gray-500 mb-1">Investment</div>
                                                            <div className={`font-bold ${hasAllocation ? 'text-green-700' : 'text-gray-400'}`}>
                                                                {hasAllocation && rec ? `₹${(stock.currentPrice * rec.addQty).toFixed(0)}` : '-'}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div className="text-xs text-gray-500 mb-1">Price</div>
                                                            <div className="font-medium text-gray-700">₹{truncateToTwoDecimals(stock.currentPrice)}</div>
                                                        </div>
                                                    </div>

                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="w-full h-8 text-xs text-gray-500 hover:text-gray-900 hover:bg-gray-100/50"
                                                        onClick={() => setExpandedAllocRow(expandedAllocRow === stock.symbol ? null : stock.symbol)}
                                                    >
                                                        {expandedAllocRow === stock.symbol ? (
                                                            <>Less Details <ChevronUp className="h-3 w-3 ml-1" /></>
                                                        ) : (
                                                            <>More Details <ChevronDown className="h-3 w-3 ml-1" /></>
                                                        )}
                                                    </Button>

                                                    {expandedAllocRow === stock.symbol && (
                                                        <div className="mt-3 pt-3 border-t border-gray-200/50 grid grid-cols-2 gap-y-3 text-sm">
                                                            <div>
                                                                <div className="text-xs text-gray-500">Current Quantity</div>
                                                                <div className={`font-medium ${stock.quantity > 0 ? 'text-blue-600' : 'text-gray-400'}`}>
                                                                    {stock.quantity}
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <div className="text-xs text-gray-500">Target Weight</div>
                                                                <div className="font-medium text-gray-700">{truncateToTwoDecimals(stock.targetWeight)}%</div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                    </div>

                                    {/* Desktop View (Table) */}
                                    <div className="hidden md:block overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="bg-green-100">
                                                    <th className="px-4 py-3 text-left font-semibold text-green-800">Stock Name</th>
                                                    <th className="px-4 py-3 text-center font-semibold text-green-800">Action</th>
                                                    <th className="px-4 py-3 text-center font-semibold text-green-800">Weight</th>
                                                    <th className="px-4 py-3 text-center font-semibold text-green-800">Price</th>
                                                    <th className="px-4 py-3 text-center font-semibold text-green-800">Current Qty</th>
                                                    <th className="px-4 py-3 text-center font-semibold text-green-800">Add-on Qty</th>
                                                    <th className="px-4 py-3 text-center font-semibold text-green-800">Investment</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-green-100">
                                                {/* Sort: fresh allocations first (current=0, add-on>0), then holdings with add-on, then other holdings */}
                                                {[...calculatedStocks]
                                                    .map(stock => {
                                                        const rec = allocationRecommendations.find(r => r.symbol === stock.symbol);
                                                        return { stock, rec, hasAllocation: rec && rec.addQty > 0 };
                                                    })
                                                    .sort((a, b) => {
                                                        // Priority 1: Fresh allocations (allocation > 0, current qty = 0)
                                                        const aIsFreshAlloc = a.hasAllocation && a.stock.quantity === 0;
                                                        const bIsFreshAlloc = b.hasAllocation && b.stock.quantity === 0;
                                                        if (aIsFreshAlloc && !bIsFreshAlloc) return -1;
                                                        if (!aIsFreshAlloc && bIsFreshAlloc) return 1;

                                                        // Within fresh allocations, sort by add-on qty descending
                                                        if (aIsFreshAlloc && bIsFreshAlloc) {
                                                            return (b.rec?.addQty || 0) - (a.rec?.addQty || 0);
                                                        }

                                                        // Priority 2: Holdings with allocation (allocation > 0, current qty > 0)
                                                        const aIsHoldingWithAlloc = a.hasAllocation && a.stock.quantity > 0;
                                                        const bIsHoldingWithAlloc = b.hasAllocation && b.stock.quantity > 0;
                                                        if (aIsHoldingWithAlloc && !bIsHoldingWithAlloc) return -1;
                                                        if (!aIsHoldingWithAlloc && bIsHoldingWithAlloc) return 1;

                                                        // Within holdings with allocation, sort by add-on qty descending
                                                        if (aIsHoldingWithAlloc && bIsHoldingWithAlloc) {
                                                            return (b.rec?.addQty || 0) - (a.rec?.addQty || 0);
                                                        }

                                                        // Priority 3: Holdings without allocation before non-holdings
                                                        if (a.stock.quantity > 0 && b.stock.quantity === 0) return -1;
                                                        if (a.stock.quantity === 0 && b.stock.quantity > 0) return 1;

                                                        return 0;
                                                    })
                                                    .map(({ stock, rec, hasAllocation }, index) => (
                                                        <tr
                                                            key={index}
                                                            className={hasAllocation
                                                                ? "bg-white hover:bg-green-50"
                                                                : stock.quantity > 0
                                                                    ? "bg-blue-50/30 hover:bg-blue-50/50"
                                                                    : "bg-gray-50/50 hover:bg-red-50/50"
                                                            }
                                                        >
                                                            <td className="px-4 py-3">
                                                                <div className={`font-semibold ${hasAllocation ? 'text-gray-800' : stock.quantity > 0 ? 'text-blue-600' : 'text-gray-500'}`}>{stock.symbol}</div>
                                                                <div className="text-xs text-gray-500">NSE</div>
                                                            </td>
                                                            <td className="px-4 py-3 text-center">
                                                                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getActionColorScheme(stock.action)}`}>
                                                                    {formatActionForDisplay(stock.action)}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3 text-center text-gray-700">{stock.targetWeight.toFixed(2)}%</td>
                                                            <td className="px-4 py-3 text-center text-gray-700">₹{stock.currentPrice.toFixed(2)}</td>
                                                            <td className={`px-4 py-3 text-center font-bold ${stock.quantity > 0 ? 'text-blue-600' : 'text-gray-400'}`}>
                                                                {stock.quantity}
                                                            </td>
                                                            <td className={`px-4 py-3 text-center font-bold ${hasAllocation ? 'text-green-600' : 'text-gray-400'}`}>
                                                                {hasAllocation && rec ? `+${rec.addQty}` : '0'}
                                                            </td>
                                                            <td className={`px-4 py-3 text-center font-bold ${hasAllocation ? 'text-green-700' : 'text-gray-400'}`}>
                                                                {hasAllocation && rec ? `₹${(stock.currentPrice * rec.addQty).toFixed(2)}` : '₹0'}
                                                            </td>
                                                        </tr>
                                                    ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {showAllocation && allocationRecommendations.length === 0 && parseFloat(newInvestmentAmount) > 0 && (
                            <Alert className="mt-4">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>Portfolio is balanced or amount too small to allocate.</AlertDescription>
                            </Alert>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
