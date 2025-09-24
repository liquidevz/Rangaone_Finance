"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Search, X, TrendingUp, Briefcase, FileText, Clock, ArrowRight, Lightbulb } from "lucide-react"
import { subscriptionService } from "@/services/subscription.service"
import { portfolioService } from "@/services/portfolio.service"
import { tipsService } from "@/services/tip.service"
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
  symbol?: string
  stockId?: string
}

const PAGES: SearchResult[] = [
  { id: "dashboard", title: "Dashboard", type: "page", url: "/dashboard", description: "Your investment overview" },
  { id: "model-portfolios", title: "Model Portfolios", type: "page", url: "/model-portfolios", description: "Investment portfolios" },
  { id: "rangaone-wealth", title: "RangaOne Wealth", type: "page", url: "/rangaone-wealth", description: "Stock recommendations" },
  { id: "all-recommendations", title: "All Recommendations", type: "page", url: "/rangaone-wealth/all-recommendations", description: "Browse all recommendations" },
  { id: "open-recommendations", title: "Open Recommendations", type: "page", url: "/rangaone-wealth/open-recommendations", description: "Active recommendations" },
  { id: "closed-recommendations", title: "Closed Recommendations", type: "page", url: "/rangaone-wealth/closed-recommendations", description: "Closed recommendations" },
  { id: "my-portfolios", title: "My Portfolios", type: "page", url: "/rangaone-wealth/my-portfolios", description: "Your subscribed portfolios" },
  { id: "settings", title: "Settings", type: "page", url: "/settings", description: "Account settings" },
  { id: "investment-calculator", title: "Investment Calculator", type: "page", url: "/investment-calculator", description: "Calculate returns" },
  { id: "videos-for-you", title: "Videos For You", type: "page", url: "/videos-for-you", description: "Educational videos" },
]

export function GlobalSearch() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<{ [key: string]: SearchResult[] }>({})
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [searchData, setSearchData] = useState<SearchResult[]>([])
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
  
  useEffect(() => {
    if (isAuthenticated) {
      loadSearchData()
    } else {
      setSearchData(PAGES)
    }
  }, [isAuthenticated])
  
  const loadSearchData = async () => {
    try {
      const [subscriptionsData, portfolios, tips] = await Promise.all([
        subscriptionService.getUserSubscriptions().catch(() => ({ subscriptions: [] })),
        portfolioService.getAll().catch(() => []),
        isAuthenticated ? tipsService.getAll().catch(() => []) : Promise.resolve([])
      ])
      
      const searchItems: SearchResult[] = [...PAGES]
      
      // Add subscriptions data
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
            category: sub.productType
          })
        }
      })
      
      // Add all portfolios
      portfolios.forEach(portfolio => {
        if (portfolio._id && portfolio.name) {
          searchItems.push({
            id: portfolio._id,
            title: portfolio.name,
            type: 'portfolio',
            url: `/model-portfolios/${portfolio._id}`,
            description: portfolio.description || `${portfolio.PortfolioCategory || 'Investment'} portfolio`,
            category: portfolio.PortfolioCategory
          })
        }
      })
      
      // Add tips/recommendations
      tips.forEach(tip => {
        if (tip._id && (tip.title || tip.stockId)) {
          searchItems.push({
            id: tip._id,
            title: tip.title || tip.stockId || 'Recommendation',
            type: 'tip',
            url: `/tips/${tip._id}`,
            description: `${tip.category || 'Basic'} recommendation - ${tip.action || 'Buy'}`,
            category: tip.category,
            createdAt: tip.createdAt,
            stockId: tip.stockId,
            symbol: tip.symbol
          })
        }
      })
      
      // Add stock symbols from tips
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
            symbol: tip.stockId
          })
        }
      })
      
      setSearchData(searchItems)
    } catch (error) {
      console.error('Failed to load search data:', error)
      setSearchData(PAGES)
    }
  }

  const searchItems = (searchQuery: string) => {
    if (!searchQuery.trim()) return { Pages: [], Portfolios: [], Tips: [], Stocks: [], Subscriptions: [] }
    
    const query = searchQuery.toLowerCase()
    const filtered = searchData.filter(item => 
      item.title.toLowerCase().includes(query) ||
      item.description?.toLowerCase().includes(query) ||
      item.category?.toLowerCase().includes(query) ||
      item.stockId?.toLowerCase().includes(query) ||
      item.symbol?.toLowerCase().includes(query)
    )
    
    return {
      Pages: filtered.filter(item => item.type === 'page').slice(0, 3),
      Portfolios: filtered.filter(item => item.type === 'portfolio').slice(0, 4),
      Tips: filtered.filter(item => item.type === 'tip').slice(0, 5),
      Stocks: filtered.filter(item => item.type === 'stock').slice(0, 3),
      Subscriptions: filtered.filter(item => item.type === 'subscription').slice(0, 2)
    }
  }

  const debouncedSearch = useCallback(
    debounce((searchQuery: string) => {
      setLoading(true)
      const searchResults = searchItems(searchQuery)
      setResults(searchResults)
      setActiveIndex(0)
      setLoading(false)
    }, 200),
    [searchData]
  )

  const handleInputChange = (value: string) => {
    setQuery(value)
    setIsOpen(true)
    if (value.trim()) {
      debouncedSearch(value)
    } else {
      setResults({})
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
    router.push(result.url)
    setIsOpen(false)
    setQuery("")
  }

  const getTypeIcon = (type: string, category?: string) => {
    switch (type) {
      case "portfolio": return (
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg p-2 shadow-sm">
          <Briefcase className="h-4 w-4 text-white" />
        </div>
      )
      case "subscription": return (
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg p-2 shadow-sm">
          <TrendingUp className="h-4 w-4 text-white" />
        </div>
      )
      case "tip": return (
        <div className={cn(
          "rounded-lg p-2 shadow-sm",
          category === "premium" 
            ? "bg-gradient-to-br from-yellow-400 to-amber-500" 
            : "bg-gradient-to-br from-blue-500 to-indigo-600"
        )}>
          <Lightbulb className="h-4 w-4 text-white" />
        </div>
      )
      case "stock": return (
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg p-2 shadow-sm">
          <TrendingUp className="h-4 w-4 text-white" />
        </div>
      )
      case "page": return (
        <div className="bg-gradient-to-br from-gray-500 to-slate-600 rounded-lg p-2 shadow-sm">
          <FileText className="h-4 w-4 text-white" />
        </div>
      )
      default: return (
        <div className="bg-gradient-to-br from-gray-400 to-gray-500 rounded-lg p-2 shadow-sm">
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

  const getResultBadge = (type: string, category?: string) => {
    const badges = {
      tip: category === "premium" 
        ? { text: "Premium", className: "bg-gradient-to-r from-yellow-400 to-amber-500 text-white" }
        : { text: "Basic", className: "bg-gradient-to-r from-blue-500 to-indigo-600 text-white" },
      portfolio: { text: "Portfolio", className: "bg-gradient-to-r from-blue-500 to-indigo-600 text-white" },
      stock: { text: "Stock", className: "bg-gradient-to-r from-green-500 to-emerald-600 text-white" },
      subscription: { text: "Subscription", className: "bg-gradient-to-r from-green-500 to-emerald-600 text-white" },
      page: { text: "Page", className: "bg-gradient-to-r from-gray-500 to-slate-600 text-white" }
    }
    
    const badge = badges[type as keyof typeof badges] || { text: type.charAt(0).toUpperCase() + type.slice(1), className: "bg-gray-100 text-gray-600" }
    
    return (
      <span className={cn(
        "text-xs font-medium px-2 py-1 rounded-full shadow-sm",
        badge.className
      )}>
        {badge.text}
      </span>
    )
  }

  return (
    <div ref={searchRef} className="relative flex-1 max-w-2xl">
      <div className="relative group">
        <input
          type="text"
          placeholder="Search portfolios, tips, stocks & pages..."
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className={cn(
            "w-full bg-white backdrop-blur-sm border-gray-200/80 shadow-sm border rounded-xl",
            "pl-12 lg:pl-20 pr-12 py-3",
            "focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-400",
            "focus-visible:shadow-lg focus-visible:bg-white",
            "transition-all duration-300 ease-out",
            "hover:shadow-md hover:border-gray-300/80",
            "placeholder:text-gray-400 outline-none text-base"
          )}
          aria-label="Global search"
        />
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 flex items-center gap-3 pointer-events-none">
          <Search className="h-5 w-5 text-gray-500 group-focus-within:text-blue-600 transition-colors duration-200" />
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
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-1 transition-all duration-200"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-3 bg-white/95 backdrop-blur-xl border border-gray-200/80 rounded-2xl shadow-2xl z-50 max-h-[32rem] overflow-hidden" role="listbox">
          {loading ? (
            <div className="p-6 text-center">
              <div className="relative mx-auto w-8 h-8 mb-3">
                <div className="absolute inset-0 border-3 border-blue-200 rounded-full"></div>
                <div className="absolute inset-0 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <p className="text-sm font-medium text-gray-600">Searching...</p>
              <p className="text-xs text-gray-400 mt-1">Finding portfolios, tips, stocks & pages</p>
            </div>
          ) : query && flatResults.length > 0 ? (
            <div className="max-h-[30rem] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
              {Object.entries(results).map(([section, items]) => (
                items.length > 0 && (
                  <div key={section} className="border-b border-gray-100/80 last:border-b-0">
                    <div className="sticky top-0 bg-gradient-to-r from-gray-50/90 to-blue-50/90 backdrop-blur-sm px-4 py-3 border-b border-gray-100/50">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">{section}</span>
                        <span className="text-xs text-gray-400 bg-gray-200/80 px-2 py-0.5 rounded-full">{items.length}</span>
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
                              "w-full px-4 py-3 text-left transition-all duration-200 group relative",
                              "hover:bg-gradient-to-r hover:from-blue-50/80 hover:to-indigo-50/80",
                              "border-b border-gray-50/80 last:border-b-0",
                              isActive && "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200/50"
                            )}
                            role="option"
                            aria-selected={isActive}
                          >
                            <div className="flex items-start gap-3">
                              {getTypeIcon(result.type, result.category)}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <div className="font-semibold text-gray-900 truncate group-hover:text-blue-700 transition-colors duration-200">
                                    {highlightMatch(String(result.title || ''), query)}
                                  </div>
                                  {getResultBadge(result.type, result.category)}
                                </div>
                                {result.description && (
                                  <div className="text-sm text-gray-600 truncate group-hover:text-gray-700 transition-colors duration-200">
                                    {highlightMatch(String(result.description), query)}
                                  </div>
                                )}
                                {result.createdAt && (
                                  <div className="text-xs text-gray-400 mt-1">
                                    {new Date(result.createdAt).toLocaleDateString()}
                                  </div>
                                )}
                              </div>
                              <ArrowRight className={cn(
                                "h-4 w-4 text-gray-400 transition-all duration-200 opacity-0 group-hover:opacity-100 group-hover:translate-x-1",
                                isActive && "opacity-100 text-blue-500"
                              )} />
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              ))}
              <div className="p-3 bg-gradient-to-r from-gray-50/50 to-blue-50/50 border-t border-gray-100/80">
                <div className="flex items-center justify-center gap-3 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-xs font-mono">↑↓</kbd>
                    <span>Navigate</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-xs font-mono">↵</kbd>
                    <span>Select</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-xs font-mono">Esc</kbd>
                    <span>Close</span>
                  </div>
                </div>
              </div>
            </div>
          ) : query ? (
            <div className="p-8 text-center">
              <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-600 mb-1">No results found for "{query}"</p>
              <p className="text-xs text-gray-400">Try different keywords or check your spelling</p>
            </div>
          ) : recentSearches.length > 0 ? (
            <div>
              <div className="bg-gradient-to-r from-gray-50/90 to-blue-50/90 px-4 py-3 border-b border-gray-100/50">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Recent Searches</span>
                </div>
              </div>
              <div className="py-1 max-h-48 overflow-y-auto">
                {recentSearches.map((search, index) => (
                  <button
                    key={index}
                    onClick={() => handleInputChange(search)}
                    className="w-full px-4 py-3 text-left hover:bg-gradient-to-r hover:from-blue-50/80 hover:to-indigo-50/80 transition-all duration-200 text-sm text-gray-700 group border-b border-gray-50/80 last:border-b-0"
                  >
                    <div className="flex items-center gap-3">
                      <Clock className="h-4 w-4 text-gray-400 group-hover:text-blue-500 transition-colors duration-200" />
                      <span className="group-hover:text-blue-700 transition-colors duration-200">{search}</span>
                      <ArrowRight className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200 ml-auto" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center">
              <div className="bg-gradient-to-br from-blue-100 to-indigo-200 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-blue-600" />
              </div>
              <p className="text-sm font-medium text-gray-700 mb-1">Start typing to search...</p>
              <p className="text-xs text-gray-500">Find portfolios, tips, stocks, and pages</p>
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