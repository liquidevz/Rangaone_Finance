"use client"

import { useState, useEffect, useRef } from "react"
import { subscriptionService, SubscriptionAccess } from "@/services/subscription.service"
import { tipsService, Tip } from "@/services/tip.service"
import { portfolioService } from "@/services/portfolio.service"
import { marketDataService, MarketIndexData } from "@/services/market-data.service"
import { cache } from "@/lib/cache"
import { Portfolio } from "@/lib/types"

export interface DashboardData {
  subscriptionAccess: SubscriptionAccess | null
  marketData: MarketIndexData[]
  generalTips: Tip[]
  portfolioTips: Tip[]
  portfolios: Portfolio[]
  portfolioDetails: { [key: string]: any }
  lastUpdated: string
}

export interface UseDashboardDataResult {
  data: DashboardData
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

/**
 * Hook that fetches all dashboard data in parallel.
 * This eliminates duplicate API calls and reduces waterfall effect.
 */
export function useDashboardData(isAuthenticated: boolean): UseDashboardDataResult {
  const [data, setData] = useState<DashboardData>({
    subscriptionAccess: null,
    marketData: [],
    generalTips: [],
    portfolioTips: [],
    portfolios: [],
    portfolioDetails: {},
    lastUpdated: ''
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const fetchedRef = useRef(false)

  const fetchAllData = async () => {
    // Prevent duplicate fetches
    if (fetchedRef.current) return
    fetchedRef.current = true

    setLoading(true)
    setError(null)

    try {
      // Check cache first for all data
      const cachedData = cache.get<DashboardData>('dashboard_all_data')
      if (cachedData) {
        setData(cachedData)
        setLoading(false)
        return
      }

      // Fetch all data in parallel
      const [
        marketResult,
        subscriptionResult,
        generalTipsResult,
        portfolioTipsResult,
        portfoliosResult
      ] = await Promise.allSettled([
        // Market data
        marketDataService.getMarketIndices(false),
        // Subscription access (only if authenticated)
        isAuthenticated ? subscriptionService.getSubscriptionAccess() : Promise.resolve(null),
        // General tips
        tipsService.getAll(),
        // Portfolio tips
        tipsService.getPortfolioTips(),
        // Portfolios
        isAuthenticated 
          ? portfolioService.getAll().catch(() => portfolioService.getPublic())
          : portfolioService.getPublic()
      ])

      // Extract results with fallbacks
      const marketData = marketResult.status === 'fulfilled' && marketResult.value?.data
        ? marketResult.value.data
        : []

      const subscriptionAccess = subscriptionResult.status === 'fulfilled'
        ? subscriptionResult.value
        : null

      const generalTips = generalTipsResult.status === 'fulfilled'
        ? generalTipsResult.value.sort((a: Tip, b: Tip) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
        : []

      const portfolioTips = portfolioTipsResult.status === 'fulfilled'
        ? portfolioTipsResult.value.sort((a: Tip, b: Tip) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
        : []

      const portfolios = portfoliosResult.status === 'fulfilled'
        ? portfoliosResult.value
        : []

      // Fetch portfolio details in parallel (only if authenticated and has portfolios)
      let portfolioDetails: { [key: string]: any } = {}
      if (isAuthenticated && portfolios.length > 0) {
        const detailsCacheKey = 'dashboard_portfolio_details'
        const cachedDetails = cache.get<{ [key: string]: any }>(detailsCacheKey)
        
        if (cachedDetails) {
          portfolioDetails = cachedDetails
        } else {
          const detailsPromises = portfolios.map(async (portfolio: Portfolio) => {
            try {
              const details = await portfolioService.getById(portfolio._id)
              return { id: portfolio._id, data: details }
            } catch {
              return { id: portfolio._id, data: null }
            }
          })

          const detailsResults = await Promise.all(detailsPromises)
          portfolioDetails = detailsResults.reduce((acc, { id, data }) => {
            if (data) acc[id] = data
            return acc
          }, {} as { [key: string]: any })

          cache.set(detailsCacheKey, portfolioDetails, 10)
        }
      }

      const newData: DashboardData = {
        subscriptionAccess,
        marketData,
        generalTips,
        portfolioTips,
        portfolios,
        portfolioDetails,
        lastUpdated: new Date().toLocaleTimeString()
      }

      // Cache combined data for 5 minutes
      cache.set('dashboard_all_data', newData, 5)
      setData(newData)
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err)
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const refetch = async () => {
    fetchedRef.current = false
    cache.remove('dashboard_all_data')
    cache.remove('dashboard_portfolio_details')
    await fetchAllData()
  }

  useEffect(() => {
    fetchAllData()
  }, [isAuthenticated])

  return { data, loading, error, refetch }
}
