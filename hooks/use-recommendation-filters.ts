'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useFilters } from '@/components/recommendations/filter-state-context';

export function useRecommendationFilters() {
  const searchParams = useSearchParams();
  const { filters, updateFilter, clearFilters, hasActiveFilters } = useFilters();

  // Handle URL parameters on mount
  useEffect(() => {
    const filterParam = searchParams?.get('filter');
    if (filterParam === 'closed') {
      updateFilter('status', 'Closed');
    } else if (filterParam === 'open') {
      updateFilter('status', 'Active');
    }
  }, [searchParams, updateFilter]);

  return {
    filters,
    updateFilter,
    clearFilters,
    hasActiveFilters,
  };
}