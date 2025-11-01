const PORTFOLIO_COLOR_MAP: Record<string, string> = {
  "Momentum Portfolio": "bg-gradient-to-br from-[#26426e] via-[#0f2e5f] to-[#26426e] shadow-[0_4px_20px_rgba(38,66,110,0.4)]",
  "Dividend Portfolio": "bg-gradient-to-br from-[#00cdf9] via-[#009ddc] to-[#00cdf9] shadow-[0_4px_20px_rgba(0,205,249,0.4)]",
  "Value Portfolio": "bg-gradient-to-br from-[#ff9d66] via-[#f26430] to-[#ff9d66] shadow-[0_4px_20px_rgba(255,157,102,0.4)]",
  "Growth Portfolio": "bg-gradient-to-br from-[#a09bd5] via-[#6761a8] to-[#a09bd5] shadow-[0_4px_20px_rgba(160,155,213,0.4)]"
}

export function getPortfolioColor(portfolioName: string): string {
  return PORTFOLIO_COLOR_MAP[portfolioName] || "bg-gradient-to-br from-gray-500 via-gray-600 to-gray-500 shadow-lg"
}
