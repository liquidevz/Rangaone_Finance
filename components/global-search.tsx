"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Search, X, TrendingUp, Briefcase, FileText, Clock, ArrowRight, Lightbulb, Eye, Sparkles, Crown, Zap } from "lucide-react"
import { useAuth } from "@/components/auth/auth-context"
import { cn } from "@/lib/utils"

const debounce = <T extends (...args: any[]) => any>(func: T, wait: number) => {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

interface SearchResult {
  id: string
  title: string
  type: "portfolio" | "subscription" | "page" | "tip" | "stock"
  url: string
  description?: string
  category?: string
  createdAt?: string
  updatedAt?: string
  symbol?: string
  stockId?: string
  portfolioName?: string
  portfolioId?: string
  hasAccess?: boolean
  tipAction?: string
  action?: string
  onClick?: {
    action: string
    params?: Record<string, any>
  }
}

interface Suggestion {
  text?: string
  title?: string
  displayText?: string
  type: "portfolio" | "premium" | "basic" | "subscription" | "page" | "tip" | "stock"
  id: string
  hasAccess?: boolean
  category?: string
  createdAt?: string
  portfolioName?: string
  tag?: string
  onclick?: string
  action?: string
  meta?: string
}



export function GlobalSearch() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<{ [key: string]: SearchResult[] }>({})
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const router = useRouter()
  const searchRef = useRef<HTMLDivElement>(null)
  const { isAuthenticated } = useAuth()

  useEffect(() => {
    const saved = localStorage.getItem('recent-searches')
    if (saved) setRecentSearches(JSON.parse(saved))
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])



  const searchAPI = async (searchQuery: string) => {
    try {
      const { get } = await import('@/lib/axios')
      const data: any = await get(`/api/search?q=${encodeURIComponent(searchQuery)}&limit=10`)

      if (data.success) {
        // Handle direct stocks
        const stocks = (data.results.stocks || []).map((stock: any) => ({
          id: stock.id,
          title: stock.symbol,
          type: 'stock' as const,
          url: stock.onclick || `/stocks/${stock.symbol}`,
          description: stock.currentPrice ? `₹${stock.currentPrice} (${stock.priceChangePercent >= 0 ? '+' : ''}${stock.priceChangePercent}%)` : `Stock: ${stock.symbol}`,
          symbol: stock.symbol,
          category: 'direct',
          hasAccess: stock.hasAccess,
          createdAt: stock.createdAt,
          updatedAt: stock.updatedAt
        }))

        // Process tips from search results
        const tips = (data.results.tips || []).map((tip: any) => ({
          id: tip.id,
          title: tip.title,
          type: 'tip' as const,
          url: tip.onclick || tip.url,
          // Check if it has portfolioName - then it's a portfolio tip
          category: tip.portfolioName ? 'portfolio' : (tip.category || 'basic'),
          portfolioName: tip.portfolioName,
          portfolioId: tip.portfolioId,
          hasAccess: tip.hasAccess || tip.accessType !== 'none',
          createdAt: tip.createdAt,
          updatedAt: tip.updatedAt,
          tipAction: tip.tipAction || tip.action
        })).sort((a: any, b: any) => {
          const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime()
          const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime()
          return dateB - dateA
        })

        // Process portfolios (if any direct portfolio results)
        const portfolios = (data.results.portfolios || []).map((portfolio: any) => ({
          id: portfolio.id,
          title: portfolio.name,
          type: 'portfolio' as const,
          url: portfolio.onclick || `/portfolios/${portfolio.id}`,
          description: portfolio.description,
          category: portfolio.category,
          minInvestment: portfolio.minInvestment
        }))

        // Process FAQs as pages
        const faqs = (data.results.faqs || []).map((faq: any) => ({
          id: faq.id,
          title: faq.question,
          type: 'page' as const,
          url: faq.onclick || `/faqs#${faq.id}`,
          description: faq.answer?.substring(0, 100) + '...',
          category: faq.category
        }))

        return {
          Portfolios: portfolios,
          Tips: tips,
          Stocks: stocks,
          Pages: [...(data.results.pages || []), ...faqs],
          Subscriptions: data.results.subscriptions || []
        }
      }
      return { Pages: [], Portfolios: [], Tips: [], Stocks: [], Subscriptions: [] }
    } catch (error) {
      console.error('Search API error:', error)
      return { Pages: [], Portfolios: [], Tips: [], Stocks: [], Subscriptions: [] }
    }
  }

  const getSuggestions = async (searchQuery: string) => {
    try {
      const { get } = await import('@/lib/axios')
      const data: any = await get(`/api/search/suggestions?q=${encodeURIComponent(searchQuery)}`)


      if (data.success && data.suggestions?.length > 0) {
        setSuggestions(data.suggestions)
      } else {
        setSuggestions([])
      }
    } catch (error) {
      console.error('Suggestions API error:', error)
      setSuggestions([])
    }
  }

  const debouncedSearch = useCallback(
    debounce(async (searchQuery: string) => {
      setLoading(true)
      const searchResults = await searchAPI(searchQuery)
      setResults(searchResults)
      setActiveIndex(0)
      setLoading(false)
    }, 200),
    []
  )

  const debouncedSuggestions = useCallback(
    debounce((searchQuery: string) => {
      getSuggestions(searchQuery)
    }, 150),
    []
  )

  const formatDate = (dateString?: string) => {
    if (!dateString) return null
    const date = new Date(dateString)
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const handleInputChange = (value: string) => {
    setQuery(value)
    setIsOpen(true)
    if (value.trim()) {
      debouncedSearch(value)
      debouncedSuggestions(value)
    } else {
      setResults({})
      setSuggestions([])
      setLoading(false)
    }
  }

  const saveRecentSearch = (query: string) => {
    const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5)
    setRecentSearches(updated)
    localStorage.setItem('recent-searches', JSON.stringify(updated))
  }

  const flatResults = Object.values(results).flat()

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false)
      setQuery("")
    } else if (e.key === 'ArrowDown') {
      setActiveIndex(i => Math.min(i + 1, flatResults.length - 1))
    } else if (e.key === 'ArrowUp') {
      setActiveIndex(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && flatResults[activeIndex]) {
      handleResultClick(flatResults[activeIndex])
    }
  }

  const handleResultClick = (result: SearchResult) => {
    saveRecentSearch(result.title)

    // Use url directly for navigation
    router.push(result.url)

    setIsOpen(false)
    setQuery("")
  }

  const getTypeIcon = (type: string, category?: string) => {
    switch (type) {
      case "portfolio": return (
        <div className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl p-2 shadow-lg shadow-purple-500/25">
          <Briefcase className="h-4 w-4 text-white" />
        </div>
      )
      case "subscription": return (
        <div className="bg-gradient-to-br from-emerald-400 to-teal-600 rounded-xl p-2 shadow-lg shadow-emerald-500/25">
          <TrendingUp className="h-4 w-4 text-white" />
        </div>
      )
      case "tip": return (
        <div className={cn(
          "rounded-xl p-2 shadow-lg",
          category === "premium"
            ? "bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-500 shadow-amber-500/25"
            : category === "portfolio"
              ? "bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 shadow-purple-500/25"
              : "bg-gradient-to-br from-blue-400 via-indigo-500 to-blue-600 shadow-blue-500/25"
        )}>
          <Lightbulb className="h-4 w-4 text-white" />
        </div>
      )
      case "stock": return (
        <div className="bg-gradient-to-br from-green-400 to-emerald-600 rounded-xl p-2 shadow-lg shadow-green-500/25">
          <TrendingUp className="h-4 w-4 text-white" />
        </div>
      )
      case "page": return (
        <div className="bg-gradient-to-br from-slate-400 to-gray-600 rounded-xl p-2 shadow-lg shadow-gray-500/25">
          <FileText className="h-4 w-4 text-white" />
        </div>
      )
      default: return (
        <div className="bg-gradient-to-br from-gray-400 to-gray-500 rounded-xl p-2 shadow-lg shadow-gray-500/25">
          <Search className="h-4 w-4 text-white" />
        </div>
      )
    }
  }

  const highlightMatch = (text: string, query: string) => {
    if (!query || !text) return text
    const idx = text.toLowerCase().indexOf(query.toLowerCase())
    if (idx === -1) return text
    return (
      <span>
        {text.slice(0, idx)}
        <span className="bg-blue-100 text-blue-900 px-1 rounded font-medium">
          {text.slice(idx, idx + query.length)}
        </span>
        {text.slice(idx + query.length)}
      </span>
    )
  }

  const getPortfolioColor = (name: string) => {
    const colors = [
      { from: '#26426e', via: '#0f2e5f', to: '#26426e', shadow: 'rgba(38,66,110,0.4)' },
      { from: '#00cdf9', via: '#009ddc', to: '#00cdf9', shadow: 'rgba(0,205,249,0.4)' },
      { from: '#a09bd5', via: '#6761a8', to: '#a09bd5', shadow: 'rgba(160,155,213,0.4)' },
      { from: '#34d399', via: '#10b981', to: '#34d399', shadow: 'rgba(52,211,153,0.4)' },
      { from: '#f472b6', via: '#ec4899', to: '#f472b6', shadow: 'rgba(244,114,182,0.4)' },
      { from: '#fbbf24', via: '#f59e0b', to: '#fbbf24', shadow: 'rgba(251,191,36,0.4)' },
      { from: '#60a5fa', via: '#3b82f6', to: '#60a5fa', shadow: 'rgba(96,165,250,0.4)' },
      { from: '#c084fc', via: '#a855f7', to: '#c084fc', shadow: 'rgba(192,132,252,0.4)' },
      { from: '#4ade80', via: '#22c55e', to: '#4ade80', shadow: 'rgba(74,222,128,0.4)' },
      { from: '#f87171', via: '#ef4444', to: '#f87171', shadow: 'rgba(248,113,113,0.4)' },
      { from: '#fb923c', via: '#f97316', to: '#fb923c', shadow: 'rgba(251,146,60,0.4)' },
      { from: '#14b8a6', via: '#0d9488', to: '#14b8a6', shadow: 'rgba(20,184,166,0.4)' }
    ]
    let hash = 0
    for (let i = 0; i < name.length; i++) {
      hash = ((hash << 5) - hash) + name.charCodeAt(i)
      hash = hash & hash
    }
    return colors[Math.abs(hash) % colors.length]
  }

  const getResultBadge = (type: string, category?: string, portfolioName?: string, tipAction?: string) => {
    if (!type) return null

    // For tips - determine the badge based on portfolio or standalone type
    if (type === 'tip') {
      // If it has portfolioName, it's a portfolio tip - show portfolio name with Portfolio tag
      if (portfolioName) {
        const color = getPortfolioColor(portfolioName)
        return (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-bold px-2 py-1 rounded-full bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-md">
              <Briefcase className="h-3 w-3" />
              Portfolio
            </span>
            <span
              className="text-[10px] sm:text-xs font-semibold px-2 py-1 rounded-full text-white shadow-md border border-white/20"
              style={{
                background: `linear-gradient(135deg, ${color.from}, ${color.via}, ${color.to})`,
                boxShadow: `0 2px 8px ${color.shadow}`
              }}
            >
              {portfolioName}
            </span>
            {tipAction && (
              <span className={cn(
                "text-[10px] sm:text-xs font-bold px-2 py-1 rounded-full shadow-sm uppercase",
                tipAction.toLowerCase() === 'buy' || tipAction.toLowerCase() === 'add more'
                  ? "bg-gradient-to-r from-green-400 to-emerald-500 text-white"
                  : tipAction.toLowerCase() === 'sell'
                    ? "bg-gradient-to-r from-red-400 to-rose-500 text-white"
                    : "bg-gradient-to-r from-amber-400 to-yellow-500 text-gray-900"
              )}>
                {tipAction}
              </span>
            )}
          </div>
        )
      }

      // Premium tip
      if (category === 'premium') {
        return (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-400 via-yellow-500 to-orange-500 text-white shadow-lg shadow-amber-500/30">
              <Crown className="h-3 w-3" />
              Premium
            </span>
            {tipAction && (
              <span className={cn(
                "text-[10px] sm:text-xs font-bold px-2 py-1 rounded-full shadow-sm uppercase",
                tipAction.toLowerCase() === 'buy' || tipAction.toLowerCase() === 'add more'
                  ? "bg-gradient-to-r from-green-400 to-emerald-500 text-white"
                  : tipAction.toLowerCase() === 'sell'
                    ? "bg-gradient-to-r from-red-400 to-rose-500 text-white"
                    : "bg-gradient-to-r from-amber-400 to-yellow-500 text-gray-900"
              )}>
                {tipAction}
              </span>
            )}
          </div>
        )
      }

      // Basic tip (default)
      return (
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-full bg-gradient-to-r from-blue-400 via-indigo-500 to-blue-600 text-white shadow-lg shadow-blue-500/30">
            <Zap className="h-3 w-3" />
            Basic
          </span>
          {tipAction && (
            <span className={cn(
              "text-[10px] sm:text-xs font-bold px-2 py-1 rounded-full shadow-sm uppercase",
              tipAction.toLowerCase() === 'buy' || tipAction.toLowerCase() === 'add more'
                ? "bg-gradient-to-r from-green-400 to-emerald-500 text-white"
                : tipAction.toLowerCase() === 'sell'
                  ? "bg-gradient-to-r from-red-400 to-rose-500 text-white"
                  : "bg-gradient-to-r from-amber-400 to-yellow-500 text-gray-900"
            )}>
              {tipAction}
            </span>
          )}
        </div>
      )
    }

    // For portfolios
    if (type === 'portfolio') {
      const color = portfolioName ? getPortfolioColor(portfolioName) : null
      if (color) {
        return (
          <span
            className="text-[10px] sm:text-xs font-semibold px-2.5 py-1 rounded-full text-white shadow-md border border-white/20"
            style={{
              background: `linear-gradient(135deg, ${color.from}, ${color.via}, ${color.to})`,
              boxShadow: `0 2px 8px ${color.shadow}`
            }}
          >
            {portfolioName}
          </span>
        )
      }
      return (
        <span className="text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-full bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg shadow-purple-500/30">
          Portfolio
        </span>
      )
    }

    // For stocks
    if (type === 'stock') {
      return (
        <span className="text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-full bg-gradient-to-r from-green-400 to-emerald-600 text-white shadow-lg shadow-green-500/30">
          Stock
        </span>
      )
    }

    // For pages
    if (type === 'page') {
      return (
        <span className="text-[10px] sm:text-xs font-semibold px-2.5 py-1 rounded-full bg-gradient-to-r from-slate-400 to-gray-600 text-white shadow-md">
          Page
        </span>
      )
    }

    // Default
    return (
      <span className="text-[10px] sm:text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </span>
    )
  }

  return (
    <div ref={searchRef} className="relative flex-1 max-w-2xl z-40">
      <div className="relative group">
        <input
          type="text"
          placeholder={isAuthenticated ? "Search portfolios, tips, stocks & pages - Click here" : "Please log in to search..."}
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => isAuthenticated && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          disabled={!isAuthenticated}
          className={cn(
            "w-full bg-white border border-gray-300 shadow-sm rounded-xl",
            "pl-10 sm:pl-12 lg:pl-24 pr-10 sm:pr-12 py-2.5 sm:py-3",
            "focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400",
            "focus:shadow-lg focus:bg-white",
            "transition-all duration-300 ease-out",
            "hover:shadow-md hover:border-gray-400",
            "placeholder:text-gray-400 outline-none text-sm sm:text-base",
            !isAuthenticated && "bg-gray-50 cursor-not-allowed opacity-60"
          )}
          aria-label="Global search"
        />
        <div className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 flex items-center gap-2 sm:gap-3 pointer-events-none">
          <Search className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 group-focus-within:text-blue-600 transition-colors duration-200 flex-shrink-0" />
          <div className="hidden lg:flex items-center gap-1 text-xs text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200">
            <kbd className="px-1 py-0.5 bg-gray-100 border border-gray-200 rounded text-xs font-mono">⌘</kbd>
            <kbd className="px-1 py-0.5 bg-gray-100 border border-gray-200 rounded text-xs font-mono">K</kbd>
          </div>
        </div>
        {query && (
          <button
            onClick={() => {
              setQuery("")
              setResults({})
              setIsOpen(false)
            }}
            className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full p-2 transition-all duration-300 flex-shrink-0 hover:scale-110"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 sm:mt-3 bg-white border border-gray-200 rounded-xl sm:rounded-2xl shadow-2xl z-50 max-h-[80vh] sm:max-h-[32rem] overflow-hidden" role="listbox">
          {loading ? (
            <div className="p-6 sm:p-8 text-center">
              <div className="relative mx-auto w-10 h-10 sm:w-12 sm:h-12 mb-3 sm:mb-4">
                <div className="absolute inset-0 border-3 sm:border-4 border-blue-100 rounded-full"></div>
                <div className="absolute inset-0 border-3 sm:border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <p className="text-sm sm:text-base font-semibold text-gray-700">Searching...</p>
              <p className="text-xs sm:text-sm text-gray-500 mt-1 sm:mt-2">Finding portfolios, tips, stocks & pages</p>
            </div>
          ) : query && flatResults.length > 0 ? (
          <div className="max-h-[70vh] sm:max-h-[30rem] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
              {Object.entries(results)
                .filter(([section, items]) => items.length > 0)
                .sort(([a], [b]) => {
                  // Sort order: Tips, Portfolios, Stocks, Pages, Subscriptions
                  const order = ['Tips', 'Portfolios', 'Stocks', 'Pages', 'Subscriptions']
                  return order.indexOf(a) - order.indexOf(b)
                })
                .map(([section, items], sectionIndex) => (
                  <div key={section} className="border-b border-gray-100/80 last:border-b-0">
                    <div className="sticky top-0 bg-gradient-to-r from-slate-50/98 via-blue-50/98 to-indigo-50/98 backdrop-blur-md px-3 sm:px-5 py-2.5 sm:py-3 border-b border-blue-100/60" style={{ zIndex: 50 - sectionIndex }}>
                      <div className="flex items-center gap-2 sm:gap-3">
                        <span className="text-xs sm:text-sm font-bold text-gray-800 uppercase tracking-wider">{section}</span>
                        <span className="text-[10px] sm:text-xs text-white bg-gradient-to-r from-blue-500 to-indigo-600 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full font-bold shadow-sm">{items.length}</span>
                      </div>
                    </div>
                    <div className="py-1">
                      {items.map((result, idx) => {
                        const isActive = activeIndex === flatResults.indexOf(result)
                        return (
                          <button
                            key={result.id}
                            onClick={() => handleResultClick(result)}
                            className={cn(
                              "w-full px-3 sm:px-5 py-3 sm:py-4 text-left transition-all duration-200 group relative",
                              "hover:bg-gradient-to-r hover:from-blue-50/80 hover:via-indigo-50/60 hover:to-purple-50/40",
                              "border-b border-gray-100/60 last:border-b-0",
                              isActive && "bg-gradient-to-r from-blue-50 via-indigo-50/80 to-purple-50/60 border-blue-200/60 shadow-sm"
                            )}
                            role="option"
                            aria-selected={isActive}
                          >
                            <div className="flex items-start gap-2.5 sm:gap-3 relative">
                              <div className="flex-shrink-0 mt-0.5">
                                {getTypeIcon(result.type, result.category)}
                              </div>
                              <div className="flex-1 min-w-0">
                                {/* Title */}
                                <div className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors duration-200 text-sm sm:text-base leading-tight mb-1.5 sm:mb-2 line-clamp-2">
                                  {highlightMatch(String(result.title || ''), query)}
                                </div>
                                
                                {/* Tags/Badges Row */}
                                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap mb-2">
                                  {getResultBadge(result.type, result.category, result.portfolioName, (result as any).tipAction)}
                                </div>
                                
                                {/* Click to view more CTA */}
                                <div className="flex items-center gap-1.5 text-xs sm:text-sm text-blue-600 group-hover:text-blue-700 font-medium">
                                  <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                  <span>Click to view details</span>
                                  <ArrowRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 group-hover:translate-x-1 transition-transform duration-200" />
                                </div>
                              </div>
                              
                              {/* Date badge - only on larger screens */}
                              {(result.createdAt || result.updatedAt) && (
                                <div className="hidden sm:flex flex-shrink-0 items-center">
                                  <span className="text-[10px] text-gray-500 bg-gray-100/80 px-2 py-1 rounded-full whitespace-nowrap">
                                    {formatDate(result.updatedAt || result.createdAt)}
                                  </span>
                                </div>
                              )}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              <div className="p-2.5 sm:p-4 bg-gradient-to-r from-slate-50/80 via-blue-50/80 to-indigo-50/80 border-t border-blue-100/60">
                <div className="flex items-center justify-center gap-3 sm:gap-4 text-[10px] sm:text-xs text-gray-600">
                  <div className="hidden sm:flex items-center gap-1 sm:gap-2">
                    <kbd className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-white border border-gray-300 rounded-md text-[10px] sm:text-xs font-mono shadow-sm">↑↓</kbd>
                    <span className="font-medium">Navigate</span>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2">
                    <kbd className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-white border border-gray-300 rounded-md text-[10px] sm:text-xs font-mono shadow-sm">↵</kbd>
                    <span className="font-medium">Select</span>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2">
                    <kbd className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-white border border-gray-300 rounded-md text-[10px] sm:text-xs font-mono shadow-sm">Esc</kbd>
                    <span className="font-medium">Close</span>
                  </div>
                </div>
              </div>
            </div>
          ) : suggestions.length > 0 ? (
            <div>
              <div className="bg-gradient-to-r from-slate-50/95 via-blue-50/95 to-indigo-50/95 px-3 sm:px-4 py-2.5 sm:py-3 border-b border-blue-100/60">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-500" />
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Suggestions</span>
                </div>
              </div>
              <div className="py-1 max-h-[60vh] sm:max-h-72 overflow-y-auto">
                {suggestions.map((suggestion, index) => {
                  const displayText = suggestion.displayText || suggestion.title || suggestion.text || ''
                  const hasPortfolio = !!suggestion.portfolioName
                  const isPremiumTip = suggestion.meta?.includes('Premium') || (!hasPortfolio && suggestion.meta === 'Standalone Tip')
                  const isBasicTip = !hasPortfolio && !isPremiumTip
                  const action = suggestion.action
                  
                  return (
                    <button
                      key={index}
                      onClick={() => {
                        if (suggestion.onclick) {
                          router.push(suggestion.onclick)
                          setIsOpen(false)
                          setQuery('')
                        } else {
                          handleInputChange(displayText)
                        }
                      }}
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-left hover:bg-gradient-to-r hover:from-blue-50/80 hover:via-indigo-50/60 hover:to-purple-50/40 transition-all duration-200 text-gray-700 group border-b border-gray-100/60 last:border-b-0"
                    >
                      <div className="flex items-start gap-2.5 sm:gap-3">
                        {/* Icon */}
                        <div className="flex-shrink-0 mt-0.5">
                          <div className={cn(
                            "rounded-lg p-1.5 sm:p-2 shadow-md",
                            hasPortfolio
                              ? "bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500"
                              : isPremiumTip
                                ? "bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-500"
                                : "bg-gradient-to-br from-blue-400 via-indigo-500 to-blue-600"
                          )}>
                            <Lightbulb className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          {/* Title */}
                          <div className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors duration-200 text-sm sm:text-base leading-tight mb-1.5 line-clamp-2">
                            {displayText}
                          </div>
                          
                          {/* Tags */}
                          <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                            {hasPortfolio ? (
                              <>
                                <span className="inline-flex items-center gap-0.5 text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-sm">
                                  <Briefcase className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                  Portfolio
                                </span>
                                <span 
                                  className="text-[10px] sm:text-xs font-semibold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-white shadow-sm"
                                  style={{
                                    background: `linear-gradient(135deg, ${getPortfolioColor(suggestion.portfolioName || '').from}, ${getPortfolioColor(suggestion.portfolioName || '').to})`
                                  }}
                                >
                                  {suggestion.portfolioName}
                                </span>
                              </>
                            ) : isPremiumTip ? (
                              <span className="inline-flex items-center gap-0.5 text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full bg-gradient-to-r from-amber-400 via-yellow-500 to-orange-500 text-white shadow-sm">
                                <Crown className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                Premium
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-0.5 text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full bg-gradient-to-r from-blue-400 via-indigo-500 to-blue-600 text-white shadow-sm">
                                <Zap className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                Basic
                              </span>
                            )}
                            
                            {action && (
                              <span className={cn(
                                "text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 rounded-full uppercase shadow-sm",
                                action.toLowerCase() === 'buy' || action.toLowerCase() === 'add more'
                                  ? "bg-gradient-to-r from-green-400 to-emerald-500 text-white"
                                  : action.toLowerCase() === 'sell'
                                    ? "bg-gradient-to-r from-red-400 to-rose-500 text-white"
                                    : "bg-gradient-to-r from-amber-400 to-yellow-500 text-gray-900"
                              )}>
                                {action}
                              </span>
                            )}
                          </div>
                          
                          {/* Click to view */}
                          <div className="flex items-center gap-1 text-[10px] sm:text-xs text-blue-600 group-hover:text-blue-700 font-medium">
                            <Eye className="h-3 w-3" />
                            <span>Click to view details</span>
                            <ArrowRight className="h-2.5 w-2.5 group-hover:translate-x-0.5 transition-transform duration-200" />
                          </div>
                        </div>
                        
                        {/* Date - only on larger screens */}
                        {suggestion.createdAt && (
                          <div className="hidden sm:block flex-shrink-0">
                            <span className="text-[10px] text-gray-500 bg-gray-100/80 px-2 py-1 rounded-full whitespace-nowrap">
                              {formatDate(suggestion.createdAt)}
                            </span>
                          </div>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          ) : !isAuthenticated ? (
            <div className="p-6 sm:p-8 text-center">
              <div className="bg-gradient-to-br from-red-100 via-rose-100 to-pink-100 rounded-2xl w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg shadow-red-200/50">
                <Search className="h-6 w-6 sm:h-8 sm:w-8 text-red-500" />
              </div>
              <p className="text-sm sm:text-base font-semibold text-gray-700 mb-1">Please log in to search</p>
              <p className="text-xs sm:text-sm text-gray-500">Authentication required to access search functionality</p>
            </div>
          ) : query && suggestions.length === 0 ? (
            <div className="p-6 sm:p-8 text-center">
              <div className="bg-gradient-to-br from-gray-100 via-slate-100 to-gray-200 rounded-2xl w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg shadow-gray-200/50">
                <Search className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
              </div>
              <p className="text-sm sm:text-base font-semibold text-gray-700 mb-1">No results found for "{query}"</p>
              <p className="text-xs sm:text-sm text-gray-500">Try different keywords or check your spelling</p>
            </div>
          ) : recentSearches.length > 0 && isAuthenticated ? (
            <div>
              <div className="bg-gradient-to-r from-slate-50/95 via-blue-50/95 to-indigo-50/95 px-3 sm:px-4 py-2.5 sm:py-3 border-b border-blue-100/60">
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-500" />
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Recent Searches</span>
                </div>
              </div>
              <div className="py-1 max-h-40 sm:max-h-48 overflow-y-auto">
                {recentSearches.map((search, index) => (
                  <button
                    key={index}
                    onClick={() => handleInputChange(search)}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-left hover:bg-gradient-to-r hover:from-blue-50/80 hover:via-indigo-50/60 hover:to-purple-50/40 transition-all duration-200 text-sm text-gray-700 group border-b border-gray-100/60 last:border-b-0"
                  >
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="bg-gradient-to-br from-gray-100 to-slate-200 rounded-lg p-1.5 shadow-sm">
                        <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 group-hover:text-blue-500 transition-colors duration-200" />
                      </div>
                      <span className="group-hover:text-blue-700 transition-colors duration-200 flex-1 min-w-0 truncate text-xs sm:text-sm font-medium">{search}</span>
                      <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200 flex-shrink-0" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : isAuthenticated ? (
            <div className="p-6 sm:p-8 text-center">
              <div className="bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100 rounded-2xl w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg shadow-blue-200/50">
                <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
              </div>
              <p className="text-sm sm:text-base font-semibold text-gray-700 mb-1">Start typing to search...</p>
              <p className="text-xs sm:text-sm text-gray-500">Find portfolios, tips, stocks, and pages</p>
            </div>
          ) : (
            <div className="p-6 sm:p-8 text-center">
              <div className="bg-gradient-to-br from-red-100 via-rose-100 to-pink-100 rounded-2xl w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg shadow-red-200/50">
                <Search className="h-6 w-6 sm:h-8 sm:w-8 text-red-500" />
              </div>
              <p className="text-sm sm:text-base font-semibold text-gray-700 mb-1">Please log in to search</p>
              <p className="text-xs sm:text-sm text-gray-500">Authentication required to access search functionality</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Keyboard shortcuts
if (typeof window !== 'undefined') {
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault()
      const searchInput = document.querySelector('[aria-label="Global search"]') as HTMLInputElement
      if (searchInput) {
        searchInput.focus()
      }
    }
  })
}
