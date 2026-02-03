"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/dashboard-layout";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Switch } from "@/components/ui/switch";
import {
    Briefcase,
    Save,
    Loader2,
    AlertCircle,
    TrendingUp,
    ChevronDown,
    ChevronUp,
    Trash2
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { userPortfolioService, UserPortfolio, UserPortfolioHolding } from "@/services/user-portfolio.service";
import { portfolioService } from "@/services/portfolio.service";
import { useAuth } from "@/components/auth/auth-context";

// Component for a single Portfolio Card
const PortfolioItem = ({
    portfolio,
    isExpanded,
    onToggle,
    onRefresh
}: {
    portfolio: UserPortfolio,
    isExpanded: boolean,
    onToggle: () => void,
    onRefresh: () => void
}) => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [portfolioTemplate, setPortfolioTemplate] = useState<any>(null);
    const [holdings, setHoldings] = useState<UserPortfolioHolding[]>([]);
    const [showToAdmin, setShowToAdmin] = useState(false);
    const [savedData, setSavedData] = useState<any>(null);

    // Initial load when expanded matches this portfolio
    useEffect(() => {
        if (isExpanded && !portfolioTemplate) {
            loadDetails();
        }
    }, [isExpanded]);

    // Format helpers
    const formatCurrency = (val: number) => `₹${val.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
    const formatPercent = (val: number) => `${val.toFixed(2)}%`;

    const loadDetails = async () => {
        setLoading(true);
        try {
            // 1. Get Template
            const template = await portfolioService.getById(portfolio._id);
            if (!template) throw new Error("Template not found");
            setPortfolioTemplate(template);

            // 2. Get Saved Data
            const response = await userPortfolioService.getSavedPortfolio(portfolio._id, true);
            // FIX: Check if response has data property (API wrapper)
            const data = response?.data || null;

            setSavedData(data); // Store strictly the data part

            // 3. Merge
            const mergedHoldings = template.holdings.map((stock: any) => {
                const savedStock = data?.holdings?.find((h: any) => h.stockSymbol === stock.symbol);
                return {
                    stockSymbol: stock.symbol,
                    stockName: savedStock?.stockName || stock.name || "",
                    quantity: savedStock ? savedStock.quantity : 0,
                    averagePrice: savedStock ? savedStock.averagePrice : 0,
                    currentPrice: savedStock?.currentPrice,
                    currentValue: savedStock?.currentValue,
                    profitLoss: savedStock?.profitLoss,
                    profitLossPercent: savedStock?.profitLossPercent,
                };
            });

            setHoldings(mergedHoldings);
            if (data) {
                setShowToAdmin(data.showToAdmin || false);
            }
        } catch (error) {
            console.error(error);
            toast({ title: "Error", description: "Failed to load details", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = {
                portfolioId: portfolio._id,
                portfolioName: portfolio.name,
                holdings: holdings.map(h => ({
                    stockSymbol: h.stockSymbol,
                    quantity: h.quantity,
                    averagePrice: h.averagePrice
                })),
                showToAdmin
            };

            const response = await userPortfolioService.savePortfolio(payload);
            if (response.success) {
                toast({ title: "Success", description: "Portfolio saved!" });
                loadDetails(); // Reload to get updated P/L
                onRefresh(); // Refresh parent if needed
            } else {
                throw new Error(response.error || "Save failed");
            }
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await userPortfolioService.deletePortfolio(portfolio._id);
            toast({ title: "Deleted", description: "Portfolio data removed." });
            setSavedData(null);
            setHoldings(holdings.map(h => ({ ...h, quantity: 0, averagePrice: 0, currentValue: 0, profitLoss: 0 })));
            onToggle(); // Close
            onRefresh();
        } catch (error) {
            toast({ title: "Error", description: "Failed to delete", variant: "destructive" });
        } finally {
            setDeleting(false);
        }
    };

    const handleHoldingChange = (index: number, field: 'quantity' | 'averagePrice', value: string) => {
        const numValue = parseFloat(value);
        const newValue = isNaN(numValue) ? 0 : Math.max(0, numValue);
        const newHoldings = [...holdings];
        newHoldings[index] = { ...newHoldings[index], [field]: newValue };
        setHoldings(newHoldings);
    };

    // Calculate generic totals for display even if not saved yet (client-side estimation)
    const clientTotalInv = holdings.reduce((sum, h) => sum + (h.quantity * h.averagePrice), 0);

    // Use saved data stats if available, otherwise client calc
    const displayTotalInv = savedData?.totalInvestment || 0;
    const displayTotalCurr = savedData?.totalCurrentValue || 0;
    const displayTotalPL = savedData?.totalProfitLoss || 0;
    const displayPLPercent = savedData?.totalProfitLossPercent || 0;

    return (
        <Card className={`mb-4 transition-all duration-300 border-l-4 ${displayTotalInv > 0 ? 'border-l-blue-600' : 'border-l-gray-300'} ${isExpanded ? 'shadow-lg ring-1 ring-blue-100' : 'hover:shadow-md'}`}>
            <CardHeader className="cursor-pointer pb-2" onClick={onToggle}>
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${displayTotalInv > 0 ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                            <Briefcase className="h-5 w-5" />
                        </div>
                        <div>
                            <CardTitle className="text-lg">{portfolio.name}</CardTitle>
                            <CardDescription>
                                {displayTotalInv > 0
                                    ? `Invested: ${formatCurrency(displayTotalInv)} • Current: ${formatCurrency(displayTotalCurr)}`
                                    : "No holdings saved yet"
                                }
                            </CardDescription>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {displayTotalInv > 0 && (
                            <div className={`text-right hidden sm:block ${displayTotalPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                <div className="font-bold text-lg">{displayTotalPL > 0 ? '+' : ''}{formatCurrency(displayTotalPL)}</div>
                                <div className="text-xs font-semibold">({displayPLPercent}%)</div>
                            </div>
                        )}
                        {isExpanded ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
                    </div>
                </div>
            </CardHeader>

            {isExpanded && (
                <CardContent className="pt-0 animate-in slide-in-from-top-2 duration-300">
                    <div className="mt-4 border-t pt-4">
                        {loading ? (
                            <div className="flex justify-center p-8"><Loader2 className="animate-spin h-6 w-6 text-blue-600" /></div>
                        ) : (
                            <div className="space-y-6">
                                {/* Configuration - Desktop Table */}
                                <div className="hidden md:block overflow-x-auto rounded-lg border border-gray-100">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-gray-50 text-gray-600 font-medium">
                                            <tr>
                                                <th className="px-4 py-3">Stock</th>
                                                <th className="px-4 py-3 text-center">Qty</th>
                                                <th className="px-4 py-3 text-center">Avg Price</th>
                                                <th className="px-4 py-3 text-right">Inv. Val</th>
                                                <th className="px-4 py-3 text-right">CMP</th>
                                                <th className="px-4 py-3 text-right">Curr. Val</th>
                                                <th className="px-4 py-3 text-right">P/L</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {holdings.map((h, idx) => {
                                                const inv = h.quantity * h.averagePrice;
                                                const pl = h.profitLoss || 0;
                                                return (
                                                    <tr key={h.stockSymbol} className="hover:bg-gray-50/50">
                                                        <td className="px-4 py-3 font-medium text-gray-900">{h.stockSymbol}</td>
                                                        <td className="px-4 py-3 text-center">
                                                            <Input
                                                                type="number" min="0"
                                                                value={h.quantity || ''}
                                                                onChange={e => handleHoldingChange(idx, 'quantity', e.target.value)}
                                                                className="w-20 mx-auto h-8 text-center px-1 font-mono"
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <Input
                                                                type="number" min="0"
                                                                value={h.averagePrice || ''}
                                                                onChange={e => handleHoldingChange(idx, 'averagePrice', e.target.value)}
                                                                className="w-24 mx-auto h-8 text-center px-1 font-mono"
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3 text-right text-gray-500 font-mono">{formatCurrency(inv)}</td>
                                                        <td className="px-4 py-3 text-right font-mono">{h.currentPrice || '-'}</td>
                                                        <td className="px-4 py-3 text-right font-medium font-mono">{h.currentValue ? formatCurrency(h.currentValue) : '-'}</td>
                                                        <td className={`px-4 py-3 text-right font-medium font-mono ${pl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                            {pl !== 0 ? (
                                                                <div className="flex flex-col items-end">
                                                                    <span>{pl > 0 ? '+' : ''}{formatCurrency(pl)}</span>
                                                                    <span className="text-xs opacity-80">{h.profitLossPercent}%</span>
                                                                </div>
                                                            ) : '-'}
                                                        </td>
                                                    </tr>
                                                )
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Configuration - Mobile List View */}
                                <div className="md:hidden space-y-4">
                                    {holdings.map((h, idx) => {
                                        const inv = h.quantity * h.averagePrice;
                                        const pl = h.profitLoss || 0;
                                        const hasMetrics = !!h.currentPrice;

                                        return (
                                            <div key={h.stockSymbol} className="bg-gray-50/50 rounded-lg p-3 border border-gray-100">
                                                <div className="flex justify-between items-start mb-3">
                                                    <div>
                                                        <div className="font-bold text-gray-900">{h.stockSymbol}</div>
                                                        {hasMetrics && <div className="text-xs text-gray-500">CMP: ₹{h.currentPrice}</div>}
                                                    </div>
                                                    {hasMetrics && pl !== 0 && (
                                                        <div className={`text-right ${pl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                            <div className="font-bold text-sm">{pl > 0 ? '+' : ''}{formatCurrency(pl)}</div>
                                                            <div className="text-xs">({h.profitLossPercent}%)</div>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="grid grid-cols-2 gap-3 mb-2">
                                                    <div className="space-y-1">
                                                        <Label className="text-xs text-gray-400 uppercase">Qty</Label>
                                                        <Input
                                                            type="number" min="0"
                                                            value={h.quantity || ''}
                                                            onChange={e => handleHoldingChange(idx, 'quantity', e.target.value)}
                                                            className="h-9 font-mono"
                                                            placeholder="0"
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-xs text-gray-400 uppercase">Avg Price</Label>
                                                        <Input
                                                            type="number" min="0"
                                                            value={h.averagePrice || ''}
                                                            onChange={e => handleHoldingChange(idx, 'averagePrice', e.target.value)}
                                                            className="h-9 font-mono"
                                                            placeholder="0"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="flex justify-between items-center text-xs text-gray-500 pt-2 border-t border-gray-200/50">
                                                    <div>Inv: <span className="font-medium text-gray-900">{formatCurrency(inv)}</span></div>
                                                    {h.currentValue && <div>Curr: <span className="font-medium text-gray-900">{formatCurrency(h.currentValue)}</span></div>}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Footer Actions */}
                                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-2">
                                    <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg w-full sm:w-auto">
                                        <Switch checked={showToAdmin} onCheckedChange={setShowToAdmin} id={`admin-${portfolio._id}`} />
                                        <Label htmlFor={`admin-${portfolio._id}`} className="text-sm cursor-pointer">Share with Admin</Label>
                                    </div>

                                    <div className="flex gap-2 w-full sm:w-auto">
                                        {savedData && (
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="destructive" size="sm" className="flex-1 sm:flex-none">
                                                        <Trash2 className="h-4 w-4 mr-2" /> Delete
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Delete {portfolio.name}?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            This will permanently remove your saved holdings for this portfolio. This action cannot be undone.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        )}

                                        <Button onClick={handleSave} disabled={saving} className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700">
                                            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                                            Save Changes
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            )}
        </Card>
    );
};

export default function UserPortfolioPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const [subscribedPortfolios, setSubscribedPortfolios] = useState<UserPortfolio[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedIds, setExpandedIds] = useState<string[]>([]);
    const [refreshTrigger, setRefreshTrigger] = useState(0); // Hack to force refresh list

    useEffect(() => {
        if (authLoading) return;
        if (!isAuthenticated) {
            router.push("/login?redirect=/resources/user-portfolio");
            return;
        }

        const fetchPortfolios = async () => {
            setLoading(true);
            try {
                const portfolios = await userPortfolioService.getSubscribedPortfolios();
                setSubscribedPortfolios(portfolios);
            } catch (error) {
                toast({ title: "Error", description: "Failed to load portfolios", variant: "destructive" });
            } finally {
                setLoading(false);
            }
        };

        fetchPortfolios();
    }, [isAuthenticated, authLoading, router, refreshTrigger]);

    const toggleExpand = (id: string) => {
        setExpandedIds(prev =>
            prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
        );
    };

    if (authLoading || loading) {
        return (
            <DashboardLayout>
                <div className="flex justify-center items-center min-h-[60vh]">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
                <PageHeader
                    title="My Portfolios"
                    subtitle="Manage holdings for your subscribed model portfolios"
                    size="lg"
                />

                {subscribedPortfolios.length === 0 ? (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>No Subscriptions</AlertTitle>
                        <AlertDescription>You need to subscribe to model portfolios first. <Button variant="link" onClick={() => router.push('/model-portfolios')}>Browse</Button></AlertDescription>
                    </Alert>
                ) : (
                    <div className="space-y-4">
                        {subscribedPortfolios.map(p => (
                            <PortfolioItem
                                key={p._id}
                                portfolio={p}
                                isExpanded={expandedIds.includes(p._id)}
                                onToggle={() => toggleExpand(p._id)}
                                onRefresh={() => setRefreshTrigger(prev => prev + 1)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
