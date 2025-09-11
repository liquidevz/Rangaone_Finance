// New file to force cache break - Updated at 2025-08-22 10:30
export const fetchPortfolios = async () => {
  console.log('Fetching from backend API directly:', 'https://api.rangaone.finance/api/user/portfolios')
  const response = await fetch('https://api.rangaone.finance/api/user/portfolios', {
    headers: {
      'Content-Type': 'application/json',
      'accept': 'application/json',
    },
  })
  console.log('Response status:', response.status)
  const data = await response.json()
  console.log('Portfolio data received:', data.length, 'portfolios')
  return data
}