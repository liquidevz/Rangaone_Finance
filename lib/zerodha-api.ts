// This is a mock implementation of the Zerodha API client
// In a real application, you would use the actual Zerodha API

interface StockData {
  symbol: string
  name: string
  exchange: string
  price: number
  change: number
  changePercent: number
  target: number
  timeHorizon: string
  closed?: boolean
  returnPercentage?: number
  buyRange?: { min: number; max: number }
  targetPrice?: { min: number; max: number }
  addMoreAt?: { min: number; max: number }
  recommendedDate?: string
  ltp?: { price: number; change: number; changePercent: number }
  whyBuy?: string[]
}

// Update the mock data to include some stocks with longer names for testing
export async function fetchStockData(): Promise<StockData[]> {
  // In a real implementation, you would make an API call to Zerodha
  // For demonstration purposes, we'll simulate an API call with a delay
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        {
          symbol: "IDFCFIRSTB",
          name: "IDFC FIRST BANK",
          exchange: "BSE",
          price: 1108.2,
          change: 10.4,
          changePercent: 0.95,
          target: 18,
          timeHorizon: "Long Term",
          buyRange: { min: 101, max: 103 },
          targetPrice: { min: 113, max: 126 },
          addMoreAt: { min: 90, max: 92 },
          recommendedDate: "19 March 2025",
          ltp: { price: 105.41, change: -2.22, changePercent: 2.06 },
          whyBuy: [
            "Technically trading at a Discounted price (39%).",
            "Low Price to Equity ratio of 15.9 (Very Attractive).",
            "Showing Good Sales & Profit growth of 48% & 27% respectively.",
            "DIIs have increased their stake from 9% to 14%.",
            "The company is expanding their assisted business through different channels and products and entering into wealth management.",
          ],
        },
        {
          symbol: "AXISBANK",
          name: "AXIS BANK",
          exchange: "NSE",
          price: 1108.2,
          change: 10.4,
          changePercent: 0.95,
          target: 39,
          timeHorizon: "Long Term",
          buyRange: { min: 980, max: 1010 },
          targetPrice: { min: 1200, max: 1250 },
          addMoreAt: { min: 950, max: 970 },
          recommendedDate: "15 March 2025",
          ltp: { price: 1050.75, change: 12.35, changePercent: 1.19 },
          whyBuy: [
            "Strong digital banking initiatives driving growth.",
            "Improving asset quality with reducing NPAs.",
            "Expanding retail loan book with focus on high-yield segments.",
            "Consistent dividend payouts with potential for increase.",
            "Strategic partnerships in fintech space enhancing market reach.",
          ],
        },
        {
          symbol: "TATAMOTORS",
          name: "TATA MOTORS LIMITED INTERNATIONAL DIVISION",
          exchange: "BSE",
          price: 1108.2,
          change: 10.4,
          changePercent: 0.95,
          target: 18,
          timeHorizon: "Short Term",
          buyRange: { min: 1050, max: 1080 },
          targetPrice: { min: 1200, max: 1250 },
          addMoreAt: { min: 1000, max: 1030 },
          recommendedDate: "10 March 2025",
          ltp: { price: 1095.6, change: 15.8, changePercent: 1.46 },
          whyBuy: [
            "Strong recovery in JLR sales globally.",
            "EV transition strategy showing positive results.",
            "Market share gains in domestic commercial vehicle segment.",
            "Debt reduction plan on track with improving cash flows.",
            "New product launches receiving positive market response.",
          ],
        },
        {
          symbol: "HDFCBANK",
          name: "HDFC BANK",
          exchange: "NSE",
          price: 1567.8,
          change: 23.5,
          changePercent: 1.52,
          target: 25,
          timeHorizon: "Swing",
          buyRange: { min: 1500, max: 1550 },
          targetPrice: { min: 1700, max: 1750 },
          addMoreAt: { min: 1450, max: 1480 },
          recommendedDate: "5 March 2025",
          ltp: { price: 1567.8, change: 23.5, changePercent: 1.52 },
          whyBuy: [
            "Market leader in private banking sector with strong brand value.",
            "Consistent growth in net interest income and fee-based revenue.",
            "Successful integration with HDFC Ltd enhancing mortgage portfolio.",
            "Expanding rural and semi-urban presence driving new customer acquisition.",
            "Industry-leading technology infrastructure with digital banking focus.",
          ],
        },
        {
          symbol: "RELIANCE",
          name: "RELIANCE INDUSTRIES",
          exchange: "BSE",
          price: 2890.45,
          change: -15.3,
          changePercent: -0.53,
          target: 32,
          timeHorizon: "Long Term",
          buyRange: { min: 2800, max: 2850 },
          targetPrice: { min: 3200, max: 3300 },
          addMoreAt: { min: 2700, max: 2750 },
          recommendedDate: "1 March 2025",
          ltp: { price: 2890.45, change: -15.3, changePercent: 0.53 },
          whyBuy: [
            "Diversified business model with strong presence across sectors.",
            "Retail segment showing robust growth with expanding footprint.",
            "Jio platform continuing to gain market share in telecom sector.",
            "Strategic investments in renewable energy creating future growth avenues.",
            "Strong cash flow generation supporting dividend payouts and buybacks.",
          ],
        },
      ])
    }, 1000)
  })
}

// New function to fetch closed recommendations
export async function fetchClosedRecommendations(): Promise<StockData[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        {
          symbol: "WIPRO",
          name: "WIPRO LIMITED",
          exchange: "NSE",
          price: 452.75,
          change: 5.25,
          changePercent: 1.17,
          target: 15,
          timeHorizon: "Short Term",
          closed: true,
          returnPercentage: 12.5,
          buyRange: { min: 400, max: 410 },
          targetPrice: { min: 450, max: 460 },
          addMoreAt: { min: 380, max: 390 },
          recommendedDate: "15 January 2025",
          ltp: { price: 452.75, change: 5.25, changePercent: 1.17 },
          whyBuy: [
            "Strong order book growth in key markets.",
            "Margin improvement through operational efficiency.",
            "Strategic acquisitions enhancing digital capabilities.",
            "Increasing dividend payout ratio.",
            "Positive outlook for IT services spending by clients.",
          ],
        },
        {
          symbol: "SUNPHARMA",
          name: "SUN PHARMACEUTICAL",
          exchange: "BSE",
          price: 1245.6,
          change: -8.4,
          changePercent: -0.67,
          target: 22,
          timeHorizon: "Swing",
          closed: true,
          returnPercentage: 18.3,
          buyRange: { min: 1050, max: 1070 },
          targetPrice: { min: 1240, max: 1260 },
          addMoreAt: { min: 1000, max: 1020 },
          recommendedDate: "10 January 2025",
          ltp: { price: 1245.6, change: -8.4, changePercent: 0.67 },
          whyBuy: [
            "Market leader in domestic pharmaceutical market.",
            "Strong specialty product pipeline in US market.",
            "Expanding presence in emerging markets.",
            "Consistent R&D investments driving future growth.",
            "Improving EBITDA margins through cost optimization.",
          ],
        },
        {
          symbol: "ICICIBANK",
          name: "ICICI BANK",
          exchange: "NSE",
          price: 978.35,
          change: 12.65,
          changePercent: 1.31,
          target: 25,
          timeHorizon: "Long Term",
          closed: true,
          returnPercentage: 21.7,
          buyRange: { min: 800, max: 820 },
          targetPrice: { min: 970, max: 990 },
          addMoreAt: { min: 780, max: 790 },
          recommendedDate: "5 January 2025",
          ltp: { price: 978.35, change: 12.65, changePercent: 1.31 },
          whyBuy: [
            "Improving asset quality with reducing NPAs.",
            "Strong growth in retail loan book.",
            "Digital banking initiatives driving cost efficiency.",
            "Expanding fee income through subsidiary businesses.",
            "Attractive valuation compared to peers.",
          ],
        },
        {
          symbol: "MARUTI",
          name: "MARUTI SUZUKI INDIA",
          exchange: "BSE",
          price: 10542.8,
          change: 156.2,
          changePercent: 1.5,
          target: 30,
          timeHorizon: "Swing",
          closed: true,
          returnPercentage: 27.8,
          buyRange: { min: 8200, max: 8400 },
          targetPrice: { min: 10500, max: 10700 },
          addMoreAt: { min: 8000, max: 8100 },
          recommendedDate: "1 January 2025",
          ltp: { price: 10542.8, change: 156.2, changePercent: 1.5 },
          whyBuy: [
            "Market leader in passenger vehicle segment.",
            "Strong product pipeline with focus on SUV segment.",
            "Expanding CNG vehicle portfolio amid rising fuel prices.",
            "Improving average selling price through premium offerings.",
            "Strong balance sheet with significant cash reserves.",
          ],
        },
      ])
    }, 1200)
  })
}
