"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import axiosApi from "@/lib/axios";
import { cache } from "@/lib/cache";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface PriceHistoryData {
  date: string;
  rawDate?: string;
  portfolioValue: number;
  benchmarkValue: number;
  portfolioChange: number;
  benchmarkChange: number;
}

type TimePeriod = '1w' | '1m' | '3m' | '6m' | '1Yr' | 'Since Inception';

interface PortfolioPriceHistoryChartProps {
  portfolioId: string;
  portfolioName: string;
  benchmarkName: string;
  className?: string;
}

export default function PortfolioPriceHistoryChart({
  portfolioId,
  portfolioName,
  benchmarkName,
  className = ""
}: PortfolioPriceHistoryChartProps) {
  const [priceHistory, setPriceHistory] = useState<PriceHistoryData[]>([]);
  const [selectedTimePeriod, setSelectedTimePeriod] = useState<TimePeriod>('1m');
  const [chartLoading, setChartLoading] = useState(false);
  const [chartData, setChartData] = useState<PriceHistoryData[]>([]);

  // Map UI periods to API periods
  const mapPeriodToAPI = (period: TimePeriod): string => {
    switch (period) {
      case '1w': return '1w';
      case '1m': return '1m';
      case '3m': return '3m';
      case '6m': return '6m';
      case '1Yr': return '1y';
      case 'Since Inception': return 'all';
      default: return '1m';
    }
  };

  // Fetch price history data
  const fetchPriceHistory = async (portfolioId: string, period: TimePeriod = '1m') => {
    try {
      setChartLoading(true);
      const apiPeriod = mapPeriodToAPI(period);
      const cacheKey = `priceHistory_${portfolioId}_${apiPeriod}`;
      
      // Check cache first
      const cachedData = cache.get<PriceHistoryData[]>(cacheKey);
      if (cachedData) {
        console.log('📊 Using cached price history');
        setPriceHistory(cachedData);
        return;
      }
      
      const response = await axiosApi.get(`/api/portfolios/${portfolioId}/price-history?period=${apiPeriod}`);
      
      console.log('📊 API Response:', response.data);
      
      const portfolioData = response.data.data || [];
      const benchmarkData = response.data.compareData || [];
      
      // Remove duplicates and calculate percentages
      const uniqueData = new Map();
      portfolioData.forEach((portfolioItem: any, index: number) => {
        const benchmarkItem = benchmarkData[index];
        const dateKey = new Date(portfolioItem.date).toDateString();
        
        if (!uniqueData.has(dateKey)) {
          const portfolioValue = Number(portfolioItem.value) || 0;
          const benchmarkValue = benchmarkItem ? Number(benchmarkItem.value) || 0 : 0;
          
          const portfolioBaseValue = Number(portfolioData[0]?.value) || 1;
          const benchmarkBaseValue = Number(benchmarkData[0]?.value) || 1;
          
          const portfolioPercent = ((portfolioValue - portfolioBaseValue) / portfolioBaseValue) * 100;
          const benchmarkPercent = ((benchmarkValue - benchmarkBaseValue) / benchmarkBaseValue) * 100;
          
          uniqueData.set(dateKey, {
            date: new Date(portfolioItem.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
            portfolioValue: portfolioPercent,
            benchmarkValue: benchmarkPercent
          });
        }
      });
      
      const chartData = Array.from(uniqueData.values());
      
      console.log('📈 Chart data:', chartData);
      
      // Cache for 5 minutes
      cache.set(cacheKey, chartData, 5);
      setPriceHistory(chartData);
      
    } catch (error) {
      console.error('❌ Error:', error);
      setPriceHistory([]);
    } finally {
      setChartLoading(false);
    }
  };

  // Handle time period selection
  const handleTimePeriodChange = async (period: TimePeriod) => {
    setSelectedTimePeriod(period);
    
    // Flatten current chart visually while fetching
    if (chartData && chartData.length > 0) {
      const firstPoint = chartData[0];
      const baseline = chartData.map((d) => ({
        ...d,
        portfolioValue: firstPoint.portfolioValue,
        benchmarkValue: firstPoint.benchmarkValue,
      }));
      setChartData(baseline);
    }
    await fetchPriceHistory(portfolioId, period);
  };

  // Calculate Y-axis domain for percentage values
  const yAxisDomain = useMemo(() => {
    if (priceHistory.length === 0) return [-5, 5];
    
    const allValues = priceHistory.flatMap(d => [d.portfolioValue, d.benchmarkValue]);
    const minValue = Math.min(...allValues);
    const maxValue = Math.max(...allValues);
    const range = Math.max(Math.abs(minValue), Math.abs(maxValue));
    
    // Symmetric range around 0 for percentage chart
    const padding = range * 0.2;
    const limit = range + padding;
    
    return [-limit, limit];
  }, [priceHistory]);

  // Animate chart from flatline to actual points when data changes
  useEffect(() => {
    if (!priceHistory || priceHistory.length === 0) {
      setChartData([]);
      return;
    }
    const firstPoint = priceHistory[0];
    const baseline: PriceHistoryData[] = priceHistory.map((d) => ({
      ...d,
      portfolioValue: firstPoint.portfolioValue,
      benchmarkValue: firstPoint.benchmarkValue,
    }));
    setChartData(baseline);
    const timeoutId = setTimeout(() => setChartData(priceHistory), 60);
    return () => clearTimeout(timeoutId);
  }, [priceHistory]);

  // Initial load
  useEffect(() => {
    if (portfolioId) {
      fetchPriceHistory(portfolioId, selectedTimePeriod);
    }
  }, [portfolioId]);

  const timePeriods: TimePeriod[] = ['1w', '1m', '3m', '6m', '1Yr', 'Since Inception'];

  return (
    <Card className={className}>
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 space-y-4 sm:space-y-0">
          <h3 className="text-lg font-semibold text-blue-600">
            {portfolioName} vs {benchmarkName}
          </h3>
          
          {/* Time Period Buttons */}
          <div className="flex flex-wrap gap-1 sm:gap-2">
            {timePeriods.map((period) => (
              <Button
                key={period}
                variant={selectedTimePeriod === period ? "default" : "outline"}
                size="sm"
                className={`text-xs px-2 py-1 h-8 transition-all duration-200 ${
                  selectedTimePeriod === period
                    ? "bg-blue-600 text-white shadow-md"
                    : "hover:bg-blue-50 hover:border-blue-300"
                }`}
                onClick={() => handleTimePeriodChange(period)}
                disabled={chartLoading}
              >
                {period}
              </Button>
            ))}
          </div>
        </div>

        {/* Chart Container */}
        <div className="relative">
          {chartLoading && (
            <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}
          
          <div className="h-64 sm:h-80 lg:h-96">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 20,
                }}
              >
                <CartesianGrid strokeDasharray="1 3" stroke="#f8fafc" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#666' }}
                />
                <YAxis 
                  domain={yAxisDomain}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#666' }}
                  tickFormatter={(value) => `${value.toFixed(1)}%`}
                />

                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                    backdropFilter: 'blur(8px)'
                  }}
                  formatter={(value: any, name: string, props: any) => [
                    `${Number(value) >= 0 ? '+' : ''}${Number(value).toFixed(2)}%`,
                    props.dataKey === 'portfolioValue' ? portfolioName : benchmarkName
                  ]}
                  labelStyle={{ color: '#1f2937', fontWeight: '600', fontSize: '14px' }}
                />
                <Legend 
                  wrapperStyle={{ paddingTop: '20px' }}
                  iconType="line"
                />
                <Line
                  type="monotone"
                  dataKey="portfolioValue"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 8, stroke: '#3b82f6', strokeWidth: 3, fill: '#ffffff' }}
                  name={portfolioName}
                  filter="drop-shadow(0 2px 4px rgba(59, 130, 246, 0.3))"
                />
                <Line
                  type="monotone"
                  dataKey="benchmarkValue"
                  stroke="#f59e0b"
                  strokeWidth={2.5}
                  strokeDasharray="8 4"
                  dot={false}
                  activeDot={{ r: 6, stroke: '#f59e0b', strokeWidth: 2, fill: '#ffffff' }}
                  name={benchmarkName}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}