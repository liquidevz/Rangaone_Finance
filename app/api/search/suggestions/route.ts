import { NextRequest, NextResponse } from 'next/server'
import { subscriptionService } from '@/services/subscription.service'
import { portfolioService } from '@/services/portfolio.service'
import { tipsService } from '@/services/tip.service'
import { authService } from '@/services/auth.service'

interface Suggestion {
  text: string
  type: 'portfolio' | 'subscription' | 'page' | 'tip' | 'stock'
  id: string
  hasAccess?: boolean
  category?: string
}

const PAGE_SUGGESTIONS: Suggestion[] = [
  { text: 'Dashboard', type: 'page', id: 'dashboard' },
  { text: 'Model Portfolios', type: 'page', id: 'model-portfolios' },
  { text: 'RangaOne Wealth', type: 'page', id: 'rangaone-wealth' },
  { text: 'All Recommendations', type: 'page', id: 'all-recommendations' },
  { text: 'Open Recommendations', type: 'page', id: 'open-recommendations' },
  { text: 'Closed Recommendations', type: 'page', id: 'closed-recommendations' },
  { text: 'My Portfolios', type: 'page', id: 'my-portfolios' },
  { text: 'Settings', type: 'page', id: 'settings' },
  { text: 'Investment Calculator', type: 'page', id: 'investment-calculator' },
  { text: 'Videos For You', type: 'page', id: 'videos-for-you' },
]

async function getSuggestions(query: string): Promise<Suggestion[]> {
  try {
    const queryLower = query.toLowerCase()
    const suggestions: Suggestion[] = []
    
    // Get user subscriptions for access control
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
    
    // Add page suggestions
    PAGE_SUGGESTIONS.forEach(page => {
      if (page.text.toLowerCase().includes(queryLower)) {
        suggestions.push({
          ...page,
          hasAccess: true
        })
      }
    })
    
    // Get dynamic data
    const [portfolios, tips] = await Promise.all([
      portfolioService.getAll().catch(() => []),
      tipsService.getAll().catch(() => [])
    ])
    
    // Show all portfolios with access status
    portfolios.forEach(portfolio => {
      if (portfolio.name && portfolio.name.toLowerCase().includes(queryLower)) {
        const hasAccess = accessData.portfolioAccess.includes(portfolio._id)
        suggestions.push({
          text: portfolio.name,
          type: 'portfolio',
          id: portfolio._id,
          hasAccess
        })
      }
    })
    
    // Add subscription suggestions
    subscriptionsData.subscriptions.forEach(sub => {
      const productName = typeof sub.productId === 'object' ? sub.productId?.name : sub.productId
      if (productName && productName.toLowerCase().includes(queryLower)) {
        const productId = typeof sub.productId === 'string' ? sub.productId : sub.productId?._id
        suggestions.push({
          text: productName,
          type: sub.productType === 'Portfolio' ? 'portfolio' : 'subscription',
          id: productId,
          hasAccess: true
        })
      }
    })
    
    // Show all tips with access status
    tips.forEach(tip => {
      const title = tip.title || tip.stockId
      if (title && title.toLowerCase().includes(queryLower)) {
        const hasAccess = tip.category === 'premium' ? accessData.hasPremium : accessData.hasBasic
        suggestions.push({
          text: title,
          type: 'tip',
          id: tip._id,
          hasAccess,
          category: tip.category
        })
      }
    })
    
    // Add stock suggestions from accessible tips only
    const uniqueStocks = new Set()
    tips.forEach(tip => {
      if (tip.stockId && tip.stockId.toLowerCase().includes(queryLower) && !uniqueStocks.has(tip.stockId)) {
        const hasAccess = tip.category === 'premium' ? accessData.hasPremium : accessData.hasBasic
        if (hasAccess) {
          uniqueStocks.add(tip.stockId)
          suggestions.push({
            text: tip.stockId,
            type: 'stock',
            id: `stock-${tip.stockId}`,
            hasAccess: true
          })
        }
      }
    })
    
    // Remove duplicates and limit results
    const uniqueSuggestions = suggestions.filter((suggestion, index, self) => 
      index === self.findIndex(s => s.text === suggestion.text && s.type === suggestion.type)
    )
    
    return uniqueSuggestions.slice(0, 10)
    
  } catch (error) {
    console.error('Failed to get suggestions:', error)
    return PAGE_SUGGESTIONS.filter(page => 
      page.text.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 5)
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    if (!query || query.length < 1) {
      return NextResponse.json({
        success: false,
        error: 'Query parameter is required and must be at least 1 character'
      }, { status: 400 })
    }

    const suggestions = await getSuggestions(query)

    return NextResponse.json({
      success: true,
      suggestions
    })

  } catch (error) {
    console.error('Search suggestions API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to get suggestions'
    }, { status: 500 })
  }
}