"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Search, X, TrendingUp, Briefcase, FileText, Clock, ArrowRight, Lightbulb } from "lucide-react"
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
  portfolioName?: string
  portfolioId?: string
  onClick?: {
    action: string
    params?: Record<string, any>
  }
}

interface Suggestion {
  text: string
  type: "portfolio" | "subscription" | "page" | "tip" | "stock"
  id: string
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
      const data = await get(`/api/search?q=${encodeURIComponent(searchQuery)}&limit=10`)
      
      if (data.success) {
        // Handle direct stocks
        const stocks = (data.results.stocks || []).map(stock => ({
          id: stock.id,
          title: stock.symbol,
          type: 'stock' as const,
          url: stock.onclick || `/stocks/${stock.symbol}`,
          description: stock.currentPrice ? `₹${stock.currentPrice} (${stock.priceChangePercent >= 0 ? '+' : ''}${stock.priceChangePercent}%)` : `Stock: ${stock.symbol}`,
          symbol: stock.symbol,
          category: 'direct'
        }))
        
        // Handle portfolio holdings
        const portfolioHoldings = (data.results.portfolio_holdings || []).map(holding => ({
          id: holding.id,
          title: holding.symbol,
          type: 'stock' as const,
          url: `${holding.onclick || `/model-portfolios/${holding.portfolioId}`}#portfolio-investment-tips`,
          description: `${holding.portfolioName} - ${holding.sector}${holding.currentPrice ? ` | ₹${holding.currentPrice}` : ''}${holding.weight ? ` | ${holding.weight}%` : ''}`,
          symbol: holding.symbol,
          category: 'portfolio',
          portfolioName: holding.portfolioName,
          portfolioId: holding.portfolioId
        }))
        
        // Combine stocks and portfolio holdings
        const allStocks = [...stocks, ...portfolioHoldings]
        
        return {
          Pages: data.results.pages || [],
          Portfolios: data.results.portfolios || [],
          Tips: data.results.tips || [],
          Stocks: allStocks,
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
      const data = await get(`/api/search/suggestions?q=${encodeURIComponent(searchQuery)}`)
      
      console.log('Suggestions response:', data)
      
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
    
    if (result.onClick?.action === 'navigate' && result.onClick.params?.url) {
      router.push(result.onClick.params.url)
    } else {
      router.push(result.url)
    }
    
    setIsOpen(false)
    setQuery("")
  }

  const getTypeIcon = (type: string, category?: string) => {
    switch (type) {
      case "portfolio": return (
        <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg p-2 shadow-sm">
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
    if (!type) return null
    
    const badges = {
      tip: category === "premium" 
        ? { text: "Premium Bundle", className: "bg-gradient-to-r from-yellow-400 to-amber-500 text-white shadow-lg" }
        : { text: "Basic Bundle", className: "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg" },
      portfolio: { text: "Portfolio", className: "bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg" },
      stock: category === "portfolio" 
        ? { text: "Portfolio Stock", className: "bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg" }
        : { text: "Stock", className: "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg" },
      subscription: { text: "Subscription", className: "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg" },
      page: { text: "Page", className: "bg-gradient-to-r from-gray-500 to-slate-600 text-white shadow-lg" }
    }
    
    const badge = badges[type as keyof typeof badges] || { text: type.charAt(0).toUpperCase() + type.slice(1), className: "bg-gray-100 text-gray-600" }
    
    return (
      <span className={cn(
        "text-xs font-semibold px-3 py-1.5 rounded-full shadow-md border border-white/20",
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
            "w-full bg-white border border-gray-300 shadow-sm rounded-xl",
            "pl-10 sm:pl-12 lg:pl-24 pr-10 sm:pr-12 py-3",
            "focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400",
            "focus:shadow-lg focus:bg-white",
            "transition-all duration-300 ease-out",
            "hover:shadow-md hover:border-gray-400",
            "placeholder:text-gray-400 outline-none text-sm sm:text-base"
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
        <div className="absolute top-full left-0 right-0 mt-3 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 max-h-[32rem] overflow-hidden" role="listbox">
          {loading ? (
            <div className="p-8 text-center">
              <div className="relative mx-auto w-12 h-12 mb-4">
                <div className="absolute inset-0 border-4 border-blue-100 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <p className="text-base font-semibold text-gray-700">Searching...</p>
              <p className="text-sm text-gray-500 mt-2">Finding portfolios, tips, stocks & pages</p>
            </div>
          ) : query && flatResults.length > 0 ? (
            <div className="max-h-[30rem] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
              {Object.entries(results)
                .filter(([section, items]) => items.length > 0)
                .sort(([a], [b]) => {
                  // Sort order: Stocks, Portfolios, Tips, Pages, Subscriptions
                  const order = ['Stocks', 'Portfolios', 'Tips', 'Pages', 'Subscriptions']
                  return order.indexOf(a) - order.indexOf(b)
                })
                .map(([section, items]) => (
                  <div key={section} className="border-b border-gray-100/80 last:border-b-0">
                    <div className="sticky top-0 bg-gradient-to-r from-blue-50/95 to-indigo-50/95 backdrop-blur-md px-5 py-4 border-b border-blue-100/60">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-gray-800 uppercase tracking-wide">{section}</span>
                        <span className="text-xs text-blue-600 bg-blue-100/80 px-3 py-1 rounded-full font-medium">{items.length}</span>
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
                              "w-full px-5 py-4 text-left transition-all duration-300 group relative",
                              "hover:bg-gradient-to-r hover:from-blue-50/90 hover:to-indigo-50/90 hover:scale-[1.01]",
                              "border-b border-gray-100/60 last:border-b-0",
                              isActive && "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200/60 shadow-sm"
                            )}
                            role="option"
                            aria-selected={isActive}
                          >
                            <div className="flex items-start gap-3">
                              {getTypeIcon(result.type, result.category)}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-2">
                                  <div className="font-semibold text-gray-900 truncate group-hover:text-blue-700 transition-colors duration-300 text-base">
                                    {highlightMatch(String(result.title || ''), query)}
                                    {result.portfolioName && result.category === 'portfolio' && (
                                      <span className="text-sm text-blue-600 ml-2 font-medium">in {result.portfolioName}</span>
                                    )}
                                  </div>
                                  {getResultBadge(result.type, result.category) && getResultBadge(result.type, result.category)}
                                </div>
                                {result.description && (
                                  <div className="text-sm text-gray-600 truncate group-hover:text-gray-700 transition-colors duration-300">
                                    {highlightMatch(String(result.description), query)}
                                  </div>
                                )}
                                {result.createdAt && (
                                  <div className="text-xs text-gray-500 mt-2 font-medium">
                                    {new Date(result.createdAt).toLocaleDateString()}
                                  </div>
                                )}
                              </div>
                              <ArrowRight className={cn(
                                "h-5 w-5 text-gray-400 transition-all duration-300 opacity-0 group-hover:opacity-100 group-hover:translate-x-2 group-hover:text-blue-600",
                                isActive && "opacity-100 text-blue-500 translate-x-1"
                              )} />
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              <div className="p-4 bg-gradient-to-r from-blue-50/60 to-indigo-50/60 border-t border-blue-100/60">
                <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <kbd className="px-2 py-1 bg-white border border-gray-300 rounded-md text-xs font-mono shadow-sm">↑↓</kbd>
                    <span className="font-medium">Navigate</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <kbd className="px-2 py-1 bg-white border border-gray-300 rounded-md text-xs font-mono shadow-sm">↵</kbd>
                    <span className="font-medium">Select</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <kbd className="px-2 py-1 bg-white border border-gray-300 rounded-md text-xs font-mono shadow-sm">Esc</kbd>
                    <span className="font-medium">Close</span>
                  </div>
                </div>
              </div>
            </div>
          ) : suggestions.length > 0 ? (
            <div>
              <div className="bg-gradient-to-r from-gray-50/90 to-blue-50/90 px-4 py-3 border-b border-gray-100/50">
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-blue-500" />
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Suggestions</span>
                </div>
              </div>
              <div className="py-1">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleInputChange(suggestion.text)}
                    className="w-full px-4 py-3 text-left hover:bg-gradient-to-r hover:from-blue-50/80 hover:to-indigo-50/80 transition-all duration-200 text-sm text-gray-700 group border-b border-gray-50/80 last:border-b-0"
                  >
                    <div className="flex items-center gap-3">
                      {getTypeIcon(suggestion.type)}
                      <span className="group-hover:text-blue-700 transition-colors duration-200">{suggestion.text}</span>
                      <ArrowRight className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200 ml-auto" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : query && suggestions.length === 0 ? (
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