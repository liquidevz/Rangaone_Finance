import type { Portfolio } from "@/lib/types"

// Mock data for development
const mockPortfolios: Portfolio[] = [
  {
    id: "1",
    name: "Growth and Early Stage - Stock Only",
    type: "High Growth",
    description: "A portfolio focused on high-growth early-stage companies with significant upside potential.",
    monthlyYield: 2.85,
    ytdYield: 18.65,
    totalInvestment: 250000,
    currentValue: 296625,
    isPurchased: true,
    stocks: [
      { symbol: "RELIANCE", allocation: 15, currentPrice: 2450, purchasePrice: 2100 },
      { symbol: "HDFCBANK", allocation: 12, currentPrice: 1650, purchasePrice: 1520 },
      { symbol: "TCS", allocation: 10, currentPrice: 3450, purchasePrice: 3200 },
    ],
  },
  {
    id: "2",
    name: "Balanced Growth - Stock Only",
    type: "Balanced",
    description: "A balanced portfolio with a mix of growth and value stocks for steady returns.",
    monthlyYield: 1.75,
    ytdYield: 12.45,
    totalInvestment: 500000,
    currentValue: 562250,
    isPurchased: false,
    stocks: [
      { symbol: "INFY", allocation: 10, currentPrice: 1450, purchasePrice: 1350 },
      { symbol: "ICICIBANK", allocation: 8, currentPrice: 950, purchasePrice: 880 },
      { symbol: "HINDUNILVR", allocation: 7, currentPrice: 2650, purchasePrice: 2500 },
    ],
  },
  {
    id: "3",
    name: "Dividend Income - Stock Only",
    type: "Income",
    description: "A portfolio focused on high-dividend stocks for regular income generation.",
    monthlyYield: 0.95,
    ytdYield: 8.75,
    totalInvestment: 750000,
    currentValue: 815625,
    isPurchased: false,
    stocks: [
      { symbol: "COALINDIA", allocation: 12, currentPrice: 320, purchasePrice: 290 },
      { symbol: "IOC", allocation: 10, currentPrice: 110, purchasePrice: 95 },
      { symbol: "POWERGRID", allocation: 8, currentPrice: 245, purchasePrice: 220 },
    ],
  },
  {
    id: "4",
    name: "Blue Chip - Stock Only",
    type: "Conservative",
    description: "A portfolio of established blue-chip companies with stable growth and lower volatility.",
    monthlyYield: -0.25,
    ytdYield: 6.35,
    totalInvestment: 1000000,
    currentValue: 1063500,
    isPurchased: false,
    stocks: [
      { symbol: "MARUTI", allocation: 15, currentPrice: 9850, purchasePrice: 9500 },
      { symbol: "ASIANPAINT", allocation: 12, currentPrice: 3250, purchasePrice: 3100 },
      { symbol: "BAJFINANCE", allocation: 10, currentPrice: 7150, purchasePrice: 6800 },
    ],
  },
]

// Function to get all portfolios
export async function getPortfolios(): Promise<Portfolio[]> {
  // In a real implementation, this would fetch from your API
  // const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.rangaone.finance'
  // const response = await fetch(`${apiBaseUrl}/api/portfolios`)
  // return response.json()

  // For now, return mock data
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockPortfolios)
    }, 1000) // Simulate network delay
  })
}

// Function to get a specific portfolio by ID
export async function getPortfolio(id: string): Promise<Portfolio | null> {
  // In a real implementation, this would fetch from your API
  // const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.rangaone.finance'
  // const response = await fetch(`${apiBaseUrl}/api/portfolios/${id}`)
  // return response.json()

  // For now, return mock data
  return new Promise((resolve) => {
    setTimeout(() => {
      const portfolio = mockPortfolios.find((p) => p.id === id) || null
      resolve(portfolio)
    }, 500) // Simulate network delay
  })
}

// Function to purchase a portfolio
export async function purchasePortfolio(id: string): Promise<{ success: boolean; message?: string }> {
  // In a real implementation, this would be a POST request to your API
  // const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.rangaone.finance'
  // const response = await fetch(`${apiBaseUrl}/api/portfolios/${id}/purchase`, {
  //   method: 'POST',
  //   headers: {
  //     'Content-Type': 'application/json',
  //   },
  //   credentials: 'include',
  // })
  // return response.json()

  // For now, simulate a successful purchase
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ success: true, message: "Portfolio purchased successfully" })
    }, 800) // Simulate network delay
  })
}
