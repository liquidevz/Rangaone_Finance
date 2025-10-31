'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface FilterState {
  category: string;
  status: string;
  action: string;
  stockId: string;
  startDate: Date | null;
  endDate: Date | null;
  horizon: string;
}

interface FilterContextType {
  filters: FilterState;
  setFilters: (filters: FilterState) => void;
  updateFilter: (key: keyof FilterState, value: any) => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;
}

const defaultFilters: FilterState = {
  category: 'all',
  status: 'all',
  action: 'all',
  stockId: '',
  startDate: null,
  endDate: null,
  horizon: 'Long Term',
};

const FilterContext = createContext<FilterContextType | undefined>(undefined);

const STORAGE_KEY = 'recommendations-filters';

export function FilterProvider({ children }: { children: ReactNode }) {
  const [filters, setFiltersState] = useState<FilterState>(defaultFilters);

  // Load filters from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setFiltersState({
          ...defaultFilters,
          ...parsed,
          startDate: parsed.startDate ? new Date(parsed.startDate) : null,
          endDate: parsed.endDate ? new Date(parsed.endDate) : null,
        });
      }
    } catch (error) {
      console.error('Failed to load saved filters:', error);
    }
  }, []);

  // Save filters to localStorage whenever they change
  const setFilters = (newFilters: FilterState) => {
    setFiltersState(newFilters);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newFilters));
    } catch (error) {
      console.error('Failed to save filters:', error);
    }
  };

  const updateFilter = (key: keyof FilterState, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
  };

  const clearFilters = () => {
    setFilters(defaultFilters);
  };

  const hasActiveFilters = 
    filters.category !== 'all' ||
    filters.status !== 'all' ||
    filters.action !== 'all' ||
    filters.stockId !== '' ||
    filters.startDate !== null ||
    filters.endDate !== null ||
    filters.horizon !== 'Long Term';

  return (
    <FilterContext.Provider value={{
      filters,
      setFilters,
      updateFilter,
      clearFilters,
      hasActiveFilters,
    }}>
      {children}
    </FilterContext.Provider>
  );
}

export function useFilters() {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error('useFilters must be used within a FilterProvider');
  }
  return context;
}