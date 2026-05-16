import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useQuery } from '@tanstack/react-query';

const CompanyContext = createContext(null);

export function CompanyProvider({ children }) {
  const [currentCompany, setCurrentCompany] = useState(null);
  const [isLoadingCompany, setIsLoadingCompany] = useState(true);

  // Get current auth user
  const { data: userData } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Get ALL active companies - no strict email filtering
  const { data: accessibleCompanies = [], refetch: refetchCompanies } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (error) {
        console.error('Error fetching companies:', error);
        throw error;
      }
      return data ?? [];
    },
    enabled: !!userData,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Auto-select company when list loads
  useEffect(() => {
    if (!userData) return;

    if (accessibleCompanies.length > 0) {
      const storedCompanyId = sessionStorage.getItem('current_company_id');

      if (storedCompanyId) {
        const found = accessibleCompanies.find(c => c.id === storedCompanyId);
        if (found) {
          setCurrentCompany(found);
          setIsLoadingCompany(false);
          return;
        }
      }

      // Auto-select if only one company exists
      if (accessibleCompanies.length === 1) {
        setCurrentCompany(accessibleCompanies[0]);
        sessionStorage.setItem('current_company_id', accessibleCompanies[0].id);
      }

      setIsLoadingCompany(false);
    } else {
      const timer = setTimeout(() => setIsLoadingCompany(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [userData, accessibleCompanies]);

  const switchCompany = (company) => {
    if (company === null) {
      setCurrentCompany(null);
      sessionStorage.removeItem('current_company_id');
    } else {
      setCurrentCompany(company);
      sessionStorage.setItem('current_company_id', company.id);
    }
  };

  const clearCompany = () => {
    setCurrentCompany(null);
    sessionStorage.removeItem('current_company_id');
    localStorage.removeItem('current_company_id');
  };

  const isEvaluationExpired = () => {
    if (!currentCompany) return false;
    if (!currentCompany.is_evaluation) return false;
    if (currentCompany.subscription_status === 'active') return false;
    if (!currentCompany.license_expiry_date) return false;
    return new Date() > new Date(currentCompany.license_expiry_date);
  };

  const canPerformAction = (actionType = 'write') => {
    if (!currentCompany) return false;
    if (currentCompany.subscription_status === 'active') return true;
    if (!currentCompany.is_evaluation) return true;
    if (isEvaluationExpired()) return actionType === 'read';
    return true;
  };

  const retryConnection = () => {
    refetchCompanies();
    window.location.reload();
  };

  return (
    <CompanyContext.Provider value={{
      currentCompany,
      switchCompany,
      clearCompany,
      user: userData,
      isLoadingCompany,
      isEvaluationExpired,
      canPerformAction,
      networkError: null,
      retryConnection,
      hasNetworkError: false,
      refetchCompanies,
      accessibleCompanies,
    }}>
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error('useCompany must be used within CompanyProvider');
  }
  return context;
}
