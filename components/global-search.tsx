// NOTE: Ensure you have run:
// npm install fuse.js
// npm install --save-dev @types/fuse.js @types/lodash

"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Search, X, TrendingUp, Briefcase, Lightbulb, FileText, Clock, Zap, Star, ArrowRight, Command } from "lucide-react"
import { Input } from "@/components/ui/input"
import { tipsService } from "@/services/tip.service"
import { portfolioService } from "@/services/portfolio.service"
import { useAuth } from "@/components/auth/auth-context"
// Custom debounce function to avoid lodash dependency
const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}
import Fuse from "fuse.js"
import { cn } from "@/lib/utils"

interface SearchResult {
  id: string
  title: string
  type: "stock" | "portfolio" | "tip" | "page"
  url: string
  description?: string
  category?: string
  createdAt?: string
  highlight?: string
}

const STATIC_PAGES: SearchResult[] = [
  { id: "rangaone-wealth", title: "RangaOne Wealth", type: "page", url: "/rangaone-wealth", description: "Expert stock recommendations" },
  { id: "model-portfolios", title: "Model Portfolios", type: "page", url: "/model-portfolios", description: "Curated investment portfolios" },
  { id: "dashboard", title: "Dashboard", type: "page", url: "/dashboard", description: "Your investment overview" },
  { id: "all-recommendations", title: "All Recommendations", type: "page", url: "/rangaone-wealth/all-recommendations", description: "Browse all stock recommendations" },
  { id: "closed-recommendations", title: "Closed Recommendations", type: "page", url: "/rangaone-wealth/closed-recommendations", description: "View closed recommendations" },
]

export function GlobalSearch() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<{ [key: string]: SearchResult[] }>({})
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
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

  // --- Parallel async search with fuzzy matching ---
  const searchAPI = async (searchQuery: string) => {
    if (!searchQuery.trim()) return { Tips: [], Portfolios: [], Stocks: [], Pages: [] }

    setLoading(true)
    const [tips, portfolios] = await Promise.all([
      isAuthenticated ? tipsService.getAll() : Promise.resolve([]),
      isAuthenticated ? portfolioService.getAll() : portfolioService.getPublic(),
    ])

    // Fuzzy search setup
    const fuseTips = new Fuse(tips, { keys: ["title", "stockId", "symbol"], threshold: 0.4 })
    const fusePortfolios = new Fuse(portfolios, { keys: ["name", "description"], threshold: 0.4 })
    const fusePages = new Fuse(STATIC_PAGES, { keys: ["title", "description"], threshold: 0.3 })

    // Results
    const tipResults = fuseTips.search(searchQuery).slice(0, 4).map((res: any) => ({
      id: res.item._id,
      title: res.item.title || res.item.stockId || 'Untitled Tip',
      type: 'tip' as const,
      url: `/rangaone-wealth/recommendation/${res.item._id}`,
      description: `${res.item.category || 'Basic'} recommendation`,
      category: res.item.category,
      createdAt: res.item.createdAt,
      highlight: typeof res.matches?.[0]?.value === 'string' ? res.matches[0].value : ''
    }))
    const portfolioResults = fusePortfolios.search(searchQuery).slice(0, 3).map((res: any) => ({
      id: res.item._id,
      title: res.item.name,
      type: 'portfolio' as const,
      url: `/model-portfolios/${res.item._id}`,
      description: res.item.description || `Investment portfolio`,
      highlight: typeof res.matches?.[0]?.value === 'string' ? res.matches[0].value : ''
    }))

    const pageResults = fusePages.search(searchQuery).slice(0, 2).map((res: any) => ({
      id: res.item.id,
      title: res.item.title,
      type: res.item.type,
      url: res.item.url,
      description: res.item.description,
      highlight: typeof res.matches?.[0]?.value === 'string' ? res.matches[0].value : ''
    }))

    setLoading(false)
    return {
      Tips: tipResults ?? [],
      Portfolios: portfolioResults ?? [],
      Stocks: [], // Always return empty array for Stocks
      Pages: pageResults ?? [],
    }
  }

  const debouncedSearch = useCallback(
    debounce(async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setResults({})
        setLoading(false)
        return
      }
      setLoading(true)
      const searchResults = await searchAPI(searchQuery)
      setResults(searchResults)
      setActiveIndex(0)
      setLoading(false)
    }, 250),
    [isAuthenticated]
  )

  const handleInputChange = (value: string) => {
    setQuery(value)
    setIsOpen(true)
    debouncedSearch(value)
  }

  const saveRecentSearch = (query: string) => {
    const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5)
    setRecentSearches(updated)
    localStorage.setItem('recent-searches', JSON.stringify(updated))
  }

  // --- Keyboard navigation ---
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
      case "stock": return (
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg p-2 shadow-sm">
          <TrendingUp className="h-4 w-4 text-white" />
        </div>
      )
      case "portfolio": return (
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg p-2 shadow-sm">
          <Briefcase className="h-4 w-4 text-white" />
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

  // --- Highlight match utility ---
  const highlightMatch = (text: string, query: string) => {
    if (!query || !text || typeof text !== 'string') return text
    const idx = text.toLowerCase().indexOf(query.toLowerCase())
    if (idx === -1) return text
    return (
      <span>
        {text.slice(0, idx)}
        <span className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-900 px-1 rounded font-medium">
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
      page: { text: "Page", className: "bg-gradient-to-r from-gray-500 to-slate-600 text-white" }
    }
    
    const badge = badges[type as keyof typeof badges] || { text: type, className: "bg-gray-100 text-gray-600" }
    
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
    <div ref={searchRef} className="relative flex-1 max-w-  xl">
      <div className="relative group">
        <input
          type="text"
          placeholder="Search stocks, portfolios & reports..."
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
            <Command className="h-3 w-3" />
            <span>K</span>
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
              <p className="text-sm font-medium text-gray-600">Searching across all content...</p>
              <p className="text-xs text-gray-400 mt-1">Finding the best matches for you</p>
            </div>
          ) : query && flatResults.length > 0 ? (
            <div className="max-h-[30rem] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
              {Object.entries(results).map(([section, items]) => (
                items.length > 0 && (
                  <div key={section} className="border-b border-gray-100/80 last:border-b-0">
                    <div className="sticky top-0 bg-gradient-to-r from-gray-50/90 to-blue-50/90 backdrop-blur-sm px-4 py-3 border-b border-gray-100/50">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-blue-500" />
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
                <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
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
              <p className="text-xs text-gray-500">Find stocks, portfolios, tips, and more</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Add keyboard shortcut support
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