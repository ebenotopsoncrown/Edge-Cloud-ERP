
import React, { createContext, useContext, useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

const CompanyContext = createContext(null);

export function CompanyProvider({ children }) {
  const [currentCompany, setCurrentCompany] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoadingCompany, setIsLoadingCompany] = useState(true);
  const [networkError, setNetworkError] = useState(null);

  // Fetch current user with better error handling
  const { data: userData, error: userError, isError: isUserError } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      try {
        const result = await base44.auth.me();
        setNetworkError(null);
        return result;
      } catch (error) {
        console.error('Error fetching user:', error);
        setNetworkError(error.message || 'Network error - cannot connect to server');
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: (failureCount, error) => {
      if (error.message && error.message.includes('Network Error')) {
        return failureCount < 2; // Retry network errors twice
      }
      return failureCount < 1;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000)
  });

  // Fetch all companies user has access to
  const { data: accessibleCompanies = [], isError: companiesError, error: companiesFetchError, refetch: refetchCompanies } = useQuery({
    queryKey: ['accessible-companies', userData?.id],
    queryFn: async () => {
      if (!userData) return [];
      
      try {
        if (userData.is_super_admin) {
          const result = await base44.entities.Company.list();
          setNetworkError(null);
          return result;
        }
        
        const allCompanies = await base44.entities.Company.list();
        
        // Auto-create/update User entity if needed
        try {
          const existingUserRecords = await base44.entities.User.filter({ email: userData.email });
          const matchingCompanies = allCompanies.filter(c => c.contact_email === userData.email);
          
          if (existingUserRecords.length === 0 && matchingCompanies.length > 0) {
            console.log('Creating User entity for authenticated user...');
            const newUserData = {
              full_name: userData.full_name || userData.email,
              email: userData.email,
              company_id: matchingCompanies[0].id,
              accessible_companies: matchingCompanies.map(c => c.id),
              role: 'admin',
              is_active: true
            };
            
            await base44.entities.User.create(newUserData);
            console.log('User entity created successfully');
          } else if (existingUserRecords.length > 0 && matchingCompanies.length > 0) {
            const existingUser = existingUserRecords[0];
            const existingCompanyIds = existingUser.accessible_companies || [];
            const newCompanyIds = matchingCompanies.map(c => c.id);
            const allCompanyIds = [...new Set([...existingCompanyIds, ...newCompanyIds])];
            
            if (allCompanyIds.length !== existingCompanyIds.length) {
              console.log('Updating User entity with new company access...');
              await base44.entities.User.update(existingUser.id, {
                accessible_companies: allCompanyIds
              });
              console.log('User entity updated successfully');
            }
          }
        } catch (userEntityError) {
          console.warn('Could not create/update User entity:', userEntityError);
        }
        
        setNetworkError(null);
        return allCompanies.filter(company => {
          if (userData.company_id === company.id) return true;
          if (userData.accessible_companies && userData.accessible_companies.includes(company.id)) return true;
          if (company.contact_email === userData.email) return true;
          return false;
        });
      } catch (error) {
        console.error('Error fetching companies:', error);
        setNetworkError(error.message || 'Network error - cannot connect to server');
        
        if (error.message && error.message.includes('Rate limit')) {
          console.warn('⚠️ Rate limit exceeded. Using cached data if available.');
        }
        throw error;
      }
    },
    enabled: !!userData && !isUserError,
    staleTime: 10 * 60 * 1000,
    cacheTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchInterval: false,
    retry: (failureCount, error) => {
      if (error.message && error.message.includes('Rate limit')) {
        return false;
      }
      if (error.message && error.message.includes('Network Error')) {
        return failureCount < 2;
      }
      return failureCount < 1;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000)
  });

  // Load persisted company on mount
  useEffect(() => {
    if (userData && accessibleCompanies.length > 0) {
      setUser(userData);
      
      const storedCompanyId = sessionStorage.getItem('current_company_id');
      
      if (storedCompanyId) {
        const company = accessibleCompanies.find(c => c.id === storedCompanyId);
        if (company) {
          setCurrentCompany(company);
          setIsLoadingCompany(false);
          return;
        } else {
          // CRITICAL FIX: If stored company not found, clear storage and show selector
          console.warn('⚠️ Stored company not found in accessible companies. Clearing storage.');
          sessionStorage.removeItem('current_company_id');
          localStorage.removeItem('current_company_id');
        }
      }
      
      setIsLoadingCompany(false);
    }
  }, [userData, accessibleCompanies]);

  // Handle errors
  useEffect(() => {
    if (companiesError && companiesFetchError) {
      console.error('Error fetching companies:', companiesFetchError);
      if (companiesFetchError.message && companiesFetchError.message.includes('Rate limit')) {
        console.warn('⚠️ Rate limit exceeded. App will continue with cached data.');
      }
      setIsLoadingCompany(false);
    }
  }, [companiesError, companiesFetchError]);

  useEffect(() => {
    if (isUserError && userError) {
      console.error('Error fetching user:', userError);
      setIsLoadingCompany(false);
    }
  }, [isUserError, userError]);

  const switchCompany = (company) => {
    if (company === null) {
      setCurrentCompany(null);
      sessionStorage.removeItem('current_company_id');
      localStorage.removeItem('current_company_id'); // CRITICAL: Also clear localStorage
    } else {
      setCurrentCompany(company);
      sessionStorage.setItem('current_company_id', company.id);
    }
  };

  const clearCompany = () => {
    setCurrentCompany(null);
    localStorage.removeItem('current_company_id');
    sessionStorage.removeItem('current_company_id');
  };

  // CRITICAL FIX: Handle subscription status more gracefully
  const isEvaluationExpired = () => {
    if (!currentCompany) return false;
    
    // If not evaluation or has active subscription, not expired
    if (!currentCompany.is_evaluation || currentCompany.subscription_status === 'active') {
      return false;
    }
    
    // If no expiry date set, not expired
    if (!currentCompany.license_expiry_date) {
      return false;
    }
    
    const today = new Date();
    const expiryDate = new Date(currentCompany.license_expiry_date);
    return today > expiryDate;
  };

  const canPerformAction = (actionType = 'write') => {
    if (!currentCompany) return false;
    
    // CRITICAL FIX: Allow all actions for active subscriptions
    if (currentCompany.subscription_status === 'active') {
      return true;
    }
    
    // If not evaluation mode, allow all actions
    if (!currentCompany.is_evaluation) {
      return true;
    }
    
    // For evaluation accounts, check expiry
    if (isEvaluationExpired()) {
      return actionType === 'read';
    }
    
    return true;
  };

  const retryConnection = () => {
    setNetworkError(null);
    refetchCompanies(); // Added refetchCompanies
    window.location.reload();
  };

  return (
    <CompanyContext.Provider value={{ 
      currentCompany, 
      switchCompany, 
      clearCompany,
      user,
      isLoadingCompany,
      isEvaluationExpired,
      canPerformAction,
      networkError,
      retryConnection,
      hasNetworkError: !!networkError,
      refetchCompanies // CRITICAL: Expose refetch function
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
