// New file to force cache break - Updated at 2025-08-22 10:30
export const fetchPortfolios = async () => {
  const response = await fetch('https://api.rangaone.finance/api/user/portfolios', {
    headers: {
      'Content-Type': 'application/json',
      'accept': 'application/json',
    },
  })
  const data = await response.json()
  return data
}