'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useFilters } from '@/components/recommendations/filter-state-context';

export function useRecommendationFilters() {
  const searchParams = useSearchParams();
  const { filters, updateFilter, clearFilters, hasActiveFilters } = useFilters();

  // Handle URL parameters on mount
  useEffect(() => {
    if (!searchParams) return;
    
    const statusParam = searchParams.get('status');
    const categoryParam = searchParams.get('category');
    const horizonParam = searchParams.get('horizon');
    const filterParam = searchParams.get('filter');
    
    // Handle legacy filter parameter
    if (filterParam === 'closed') {
      updateFilter('status', 'Closed');
    } else if (filterParam === 'live' || filterParam === 'open') {
      updateFilter('status', 'Active');
    }
    
    // Handle direct status parameter
    if (statusParam && (statusParam === 'Active' || statusParam === 'Closed')) {
      updateFilter('status', statusParam);
    }
    
    // Handle category parameter
    if (categoryParam && (categoryParam === 'basic' || categoryParam === 'premium')) {
      updateFilter('category', categoryParam);
    }
    
    // Handle horizon parameter
    if (horizonParam && ['Long Term', 'Short Term', 'Swing'].includes(horizonParam)) {
      updateFilter('horizon', horizonParam);
    }
  }, [searchParams?.toString()]);

  return {
    filters,
    updateFilter,
    clearFilters,
    hasActiveFilters,
  };
}