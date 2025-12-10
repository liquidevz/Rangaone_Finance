import { NextRequest, NextResponse } from 'next/server'
import { subscriptionService } from '@/services/subscription.service'
import { portfolioService } from '@/services/portfolio.service'
import { tipsService } from '@/services/tip.service'
import { authService } from '@/services/auth.service'

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
  hasAccess?: boolean
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
    // Direct API call to get user subscriptions
    const subscriptionsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.rangaone.finance'}/api/user/subscriptions`, {
      headers: {
        'Authorization': `Bearer ${authService.getAccessToken()}`,
        'Content-Type': 'application/json'
      }
    })

    const subscriptionsData = subscriptionsResponse.ok ? await subscriptionsResponse.json() : { subscriptions: [], has_basic: false, has_premium: false, access: { portfolioIds: [] } }

    const accessData = {
      hasBasic: subscriptionsData.has_basic || false,
      hasPremium: subscriptionsData.has_premium || false,
      portfolioAccess: subscriptionsData.access?.portfolioIds || [],
      subscriptionType: subscriptionsData.overview?.subscriptionType || 'none'
    }

    const [portfolios, tips, portfolioTips] = await Promise.all([
      portfolioService.getAll().catch(() => []),
      tipsService.getAll().catch(() => []),
      tipsService.getPortfolioTips().catch(() => [])
    ])

    const searchItems: SearchResult[] = [...PAGES]

      (subscriptionsData.subscriptions || []).forEach(sub => {
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

    // Get user's accessible portfolios from /api/user/portfolios
    const userPortfoliosResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.rangaone.finance'}/api/user/portfolios`, {
      headers: {
        'Authorization': `Bearer ${authService.getAccessToken()}`,
        'Content-Type': 'application/json'
      }
    })

    const userPortfolios = userPortfoliosResponse.ok ? await userPortfoliosResponse.json() : []
    const accessiblePortfolioIds = new Set(
      userPortfolios
        .filter((p: any) => !p.message || p.message !== "Subscribe to view complete details")
        .map((p: any) => p._id)
    )

    // Show all portfolios but mark access status based on /api/user/portfolios
    portfolios.forEach(portfolio => {
      if (portfolio._id && portfolio.name) {
        const hasAccess = accessiblePortfolioIds.has(portfolio._id)
        searchItems.push({
          id: portfolio._id,
          title: `${portfolio.name} Portfolio`,
          type: 'portfolio',
          url: `/model-portfolios/${portfolio._id}`,
          description: portfolio.description || `${portfolio.PortfolioCategory || 'Investment'} portfolio recommendations`,
          category: portfolio.PortfolioCategory,
          hasAccess,
          onClick: {
            action: 'navigate',
            params: { url: `/model-portfolios/${portfolio._id}` }
          }
        })
      }
    })

    // Track processed tip IDs to avoid duplicates
    const processedTipIds = new Set()

    // Combine all tips and check for portfolio association
    const allTips = [...tips, ...portfolioTips]

    allTips.forEach(tip => {
      if (tip._id && (tip.title || tip.stockId) && !processedTipIds.has(tip._id)) {
        processedTipIds.add(tip._id)

        // Determine valid category - only 'premium' or 'basic' are valid
        // Ignore 'portfolio' as it's an invalid category value
        let validCategory: string
        if (tip.category === 'premium' || tip.category === 'basic') {
          validCategory = tip.category
        } else {
          validCategory = 'basic' // Default fallback for invalid categories
        }

        const bundleType = validCategory === 'premium' ? 'Premium' : 'Basic'

        // Check access based on tip category
        const hasAccess = validCategory === 'premium' ? accessData.hasPremium : accessData.hasBasic

        // Check if tip has portfolio ID
        const hasPortfolio = tip.portfolio && (typeof tip.portfolio === 'string' || typeof tip.portfolio === 'object')

        if (hasPortfolio) {
          // Add to portfolios section - check portfolio-specific access
          const portfolioId = typeof tip.portfolio === 'string' ? tip.portfolio : tip.portfolio._id
          const portfolioName = tip.portfolioName || (typeof tip.portfolio === 'object' ? tip.portfolio.name : 'Portfolio')

          searchItems.push({
            id: tip._id,
            title: `${tip.title || tip.stockId} - ${portfolioName}`,
            type: 'portfolio',
            url: `/tips/${tip._id}`,
            description: `Buy Range: ${tip.buyRange || 'N/A'} | Target: ${tip.targetPrice || 'N/A'} | Status: ${tip.status || 'N/A'}`,
            category: validCategory,
            createdAt: tip.createdAt,
            stockId: tip.stockId,
            symbol: tip.symbol,
            hasAccess: portfolioId ? accessiblePortfolioIds.has(portfolioId) : false,
            onClick: {
              action: 'navigate',
              params: { url: `/tips/${tip._id}` }
            }
          })
        } else {
          // Add to tips section
          searchItems.push({
            id: tip._id,
            title: tip.title || tip.stockId || 'Recommendation',
            type: 'tip',
            url: `/tips/${tip._id}`,
            description: `Buy Range: ${tip.buyRange || 'N/A'} | Target: ${tip.targetPrice || 'N/A'} | Status: ${tip.status || 'N/A'}`,
            category: validCategory,
            createdAt: tip.createdAt,
            stockId: tip.stockId,
            symbol: tip.symbol,
            hasAccess,
            onClick: {
              action: 'navigate',
              params: { url: `/tips/${tip._id}` }
            }
          })
        }
      }
    })

    // Show all stocks but mark access status
    const uniqueStocks = new Set()
    allTips.forEach(tip => {
      if (tip.stockId && !uniqueStocks.has(tip.stockId)) {
        const hasAccess = tip.category === 'premium' ? accessData.hasPremium : accessData.hasBasic
        uniqueStocks.add(tip.stockId)
        searchItems.push({
          id: `stock-${tip.stockId}`,
          title: tip.stockId,
          type: 'stock',
          url: `/recommendations?stock=${tip.stockId}`,
          description: `Stock recommendations for ${tip.stockId}`,
          symbol: tip.stockId,
          hasAccess,
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

    // Separate results by type
    const stockResults = filteredResults.filter(item => item.type === 'stock').slice(0, limit)
    const portfolioResults = filteredResults.filter(item => item.type === 'portfolio').slice(0, limit)
    const tipResults = filteredResults.filter(item => item.type === 'tip').slice(0, limit)
    const pageResults = filteredResults.filter(item => item.type === 'page').slice(0, limit)
    const subscriptionResults = filteredResults.filter(item => item.type === 'subscription').slice(0, limit)

    const results = {
      stocks: stockResults.map(stock => ({
        id: stock.id,
        symbol: stock.symbol || stock.title,
        exchange: 'NSE',
        currentPrice: 0,
        priceChange: 0,
        priceChangePercent: 0,
        onclick: stock.url,
        action: 'navigate',
        hasAccess: stock.hasAccess
      })),
      portfolios: portfolioResults.map(portfolio => ({
        ...portfolio,
        onclick: portfolio.url,
        action: 'navigate',
        hasAccess: portfolio.hasAccess
      })),
      tips: tipResults.map(tip => ({
        ...tip,
        onclick: tip.url,
        action: 'navigate',
        hasAccess: tip.hasAccess
      })),
      pages: pageResults,
      subscriptions: subscriptionResults
    }

    const totalResults = results.stocks.length + results.portfolios.length +
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