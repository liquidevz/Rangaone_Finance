import { NextRequest, NextResponse } from 'next/server'
import { subscriptionService } from '@/services/subscription.service'
import { portfolioService } from '@/services/portfolio.service'
import { tipsService } from '@/services/tip.service'

interface SearchResult {
  id: string
  title: string
  type: 'portfolio' | 'subscription' | 'page' | 'tip' | 'stock'
  url: string
  description?: string
  category?: string
  createdAt?: string
  symbol?: string
  stockId?: string
  onClick?: {
    action: string
    params?: Record<string, any>
  }
}

const PAGES: SearchResult[] = [
  { id: 'dashboard', title: 'Dashboard', type: 'page', url: '/dashboard', description: 'Your investment overview' },
  { id: 'model-portfolios', title: 'Model Portfolios', type: 'page', url: '/model-portfolios', description: 'Investment portfolios' },
  { id: 'rangaone-wealth', title: 'RangaOne Wealth', type: 'page', url: '/rangaone-wealth', description: 'Stock recommendations' },
  { id: 'all-recommendations', title: 'All Recommendations', type: 'page', url: '/rangaone-wealth/all-recommendations', description: 'Browse all recommendations' },
  { id: 'open-recommendations', title: 'Open Recommendations', type: 'page', url: '/rangaone-wealth/open-recommendations', description: 'Active recommendations' },
  { id: 'closed-recommendations', title: 'Closed Recommendations', type: 'page', url: '/rangaone-wealth/closed-recommendations', description: 'Closed recommendations' },
  { id: 'my-portfolios', title: 'My Portfolios', type: 'page', url: '/rangaone-wealth/my-portfolios', description: 'Your subscribed portfolios' },
  { id: 'settings', title: 'Settings', type: 'page', url: '/settings', description: 'Account settings' },
  { id: 'investment-calculator', title: 'Investment Calculator', type: 'page', url: '/investment-calculator', description: 'Calculate returns' },
  { id: 'videos-for-you', title: 'Videos For You', type: 'page', url: '/videos-for-you', description: 'Educational videos' },
]

function fuzzyMatch(text: string, query: string): number {
  const textLower = text.toLowerCase()
  const queryLower = query.toLowerCase()
  
  // Exact match gets highest score
  if (textLower === queryLower) return 10
  
  // Contains match gets high score
  if (textLower.includes(queryLower)) return 5
  
  // Fuzzy character matching gets lower score
  let score = 0
  let queryIndex = 0
  
  for (let i = 0; i < textLower.length && queryIndex < queryLower.length; i++) {
    if (textLower[i] === queryLower[queryIndex]) {
      score++
      queryIndex++
    }
  }
  
  return queryIndex === queryLower.length ? score / text.length : 0
}

async function getSearchData(): Promise<SearchResult[]> {
  try {
    const [subscriptionsData, portfolios, tips, portfolioTips] = await Promise.all([
      subscriptionService.getUserSubscriptions().catch(() => ({ subscriptions: [] })),
      portfolioService.getAll().catch(() => []),
      tipsService.getAll().catch(() => []),
      tipsService.getPortfolioTips().catch(() => [])
    ])
    
    const searchItems: SearchResult[] = [...PAGES]
    
    subscriptionsData.subscriptions.forEach(sub => {
      const productId = typeof sub.productId === 'string' ? sub.productId : sub.productId?._id
      const productName = typeof sub.productId === 'object' ? sub.productId?.name : sub.productId
      
      if (productName && productId) {
        searchItems.push({
          id: productId,
          title: productName,
          type: sub.productType === 'Portfolio' ? 'portfolio' : 'subscription',
          url: sub.productType === 'Portfolio' ? `/model-portfolios/${productId}` : `/dashboard`,
          description: `${sub.productType} subscription - ${sub.planType || 'Active'}`,
          category: sub.productType,
          onClick: {
            action: 'navigate',
            params: { url: sub.productType === 'Portfolio' ? `/model-portfolios/${productId}` : `/dashboard` }
          }
        })
      }
    })
    
    portfolios.forEach(portfolio => {
      if (portfolio._id && portfolio.name) {
        searchItems.push({
          id: portfolio._id,
          title: `${portfolio.name} Portfolio`,
          type: 'portfolio',
          url: `/model-portfolios/${portfolio._id}`,
          description: portfolio.description || `${portfolio.PortfolioCategory || 'Investment'} portfolio recommendations`,
          category: portfolio.PortfolioCategory,
          onClick: {
            action: 'navigate',
            params: { url: `/model-portfolios/${portfolio._id}` }
          }
        })
      }
    })
    
    // Add regular tips (non-portfolio)
    tips.forEach(tip => {
      if (tip._id && (tip.title || tip.stockId)) {
        const bundleType = tip.category === 'premium' ? 'Premium' : 'Basic'
        searchItems.push({
          id: tip._id,
          title: tip.title || tip.stockId || 'Recommendation',
          type: 'tip',
          url: `/tips/${tip._id}`,
          description: `${bundleType} Bundle - ${tip.action || 'Buy'} recommendation`,
          category: tip.category,
          createdAt: tip.createdAt,
          stockId: tip.stockId,
          symbol: tip.symbol,
          onClick: {
            action: 'navigate',
            params: { url: `/tips/${tip._id}` }
          }
        })
      }
    })
    
    // Add portfolio-specific tips with portfolio names
    portfolioTips.forEach(tip => {
      if (tip._id && (tip.title || tip.stockId)) {
        const portfolioName = typeof tip.portfolio === 'object' ? tip.portfolio.name : 'Portfolio'
        const bundleType = tip.category === 'premium' ? 'Premium' : 'Basic'
        searchItems.push({
          id: `portfolio-tip-${tip._id}`,
          title: `${tip.title || tip.stockId} - ${portfolioName}`,
          type: 'tip',
          url: `/tips/${tip._id}`,
          description: `${portfolioName} Portfolio - ${bundleType} Bundle recommendation`,
          category: tip.category,
          createdAt: tip.createdAt,
          stockId: tip.stockId,
          symbol: tip.symbol,
          onClick: {
            action: 'navigate',
            params: { url: `/tips/${tip._id}` }
          }
        })
      }
    })
    
    const uniqueStocks = new Set()
    tips.forEach(tip => {
      if (tip.stockId && !uniqueStocks.has(tip.stockId)) {
        uniqueStocks.add(tip.stockId)
        searchItems.push({
          id: `stock-${tip.stockId}`,
          title: tip.stockId,
          type: 'stock',
          url: `/recommendations?stock=${tip.stockId}`,
          description: `Stock recommendations for ${tip.stockId}`,
          symbol: tip.stockId,
          onClick: {
            action: 'navigate',
            params: { url: `/recommendations?stock=${tip.stockId}` }
          }
        })
      }
    })
    
    return searchItems
  } catch (error) {
    console.error('Failed to load search data:', error)
    return PAGES
  }
}

function exactMatch(text: string, query: string): boolean {
  return text.toLowerCase() === query.toLowerCase()
}

function startsWithMatch(text: string, query: string): boolean {
  return text.toLowerCase().startsWith(query.toLowerCase())
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const type = searchParams.get('type')
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50)

    if (!query || query.length < 1) {
      return NextResponse.json({
        success: false,
        error: 'Query parameter is required and must be at least 1 character'
      }, { status: 400 })
    }

    const searchData = await getSearchData()
    
    // Prioritize exact matches, then starts-with matches, then fuzzy matches
    let filteredResults = searchData
      .map(item => {
        const titleExact = exactMatch(item.title, query)
        const symbolExact = exactMatch(item.symbol || '', query)
        const stockIdExact = exactMatch(item.stockId || '', query)
        
        const titleStartsWith = startsWithMatch(item.title, query)
        const symbolStartsWith = startsWithMatch(item.symbol || '', query)
        const stockIdStartsWith = startsWithMatch(item.stockId || '', query)
        
        const fuzzyScore = Math.max(
          fuzzyMatch(item.title, query),
          fuzzyMatch(item.description || '', query),
          fuzzyMatch(item.category || '', query),
          fuzzyMatch(item.stockId || '', query),
          fuzzyMatch(item.symbol || '', query)
        )
        
        let score = 0
        if (titleExact || symbolExact || stockIdExact) {
          score = 100 // Highest priority for exact matches
        } else if (titleStartsWith || symbolStartsWith || stockIdStartsWith) {
          score = 50 // Medium priority for starts-with matches
        } else if (fuzzyScore > 0) {
          score = fuzzyScore // Lowest priority for fuzzy matches
        }
        
        return { ...item, score }
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)

    if (type) {
      filteredResults = filteredResults.filter(item => item.type === type)
    }

    // Separate stocks into direct stocks and portfolio holdings
    const stockResults = filteredResults.filter(item => item.type === 'stock').slice(0, limit)
    const portfolioHoldings = filteredResults.filter(item => item.type === 'portfolio').slice(0, limit)
    
    const results = {
      stocks: stockResults.map(stock => ({
        id: stock.id,
        symbol: stock.symbol || stock.title,
        exchange: 'NSE', // Default exchange
        currentPrice: 0, // Will be populated by real-time data
        priceChange: 0,
        priceChangePercent: 0,
        onclick: stock.url,
        action: 'navigate'
      })),
      portfolio_holdings: portfolioHoldings.map(portfolio => ({
        id: `${portfolio.id}_${portfolio.symbol || portfolio.title}`,
        symbol: portfolio.symbol || portfolio.title,
        sector: portfolio.category || 'General',
        currentPrice: 0, // Will be populated by real-time data
        weight: 0, // Will be populated by portfolio data
        portfolioId: portfolio.id,
        portfolioName: portfolio.title,
        onclick: portfolio.url,
        action: 'navigate'
      })),
      pages: filteredResults.filter(item => item.type === 'page').slice(0, limit),
      tips: filteredResults.filter(item => item.type === 'tip').slice(0, limit),
      subscriptions: filteredResults.filter(item => item.type === 'subscription').slice(0, limit)
    }

    const totalResults = results.stocks.length + results.portfolio_holdings.length + 
                        results.pages.length + results.tips.length + results.subscriptions.length

    return NextResponse.json({
      success: true,
      query,
      totalResults,
      results
    })

  } catch (error) {
    console.error('Search API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Search failed'
    }, { status: 500 })
  }
}