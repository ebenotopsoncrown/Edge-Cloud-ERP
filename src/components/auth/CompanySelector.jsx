
import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, CheckCircle, AlertCircle, LogOut, Lock } from 'lucide-react';
import { useCompany } from './CompanyContext';
import CompanySetupWizard from '../setup/CompanySetupWizard';

export default function CompanySelector() {
  const { switchCompany, user, clearCompany } = useCompany();
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [showSetupWizard, setShowSetupWizard] = useState(false);
  const [setupCompany, setSetupCompany] = useState(null);

  // CRITICAL: Only fetch companies the current user has access to
  const { data: companies = [], isLoading, error: companiesError, refetch } = useQuery({
    queryKey: ['companies', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      try {
        // If super admin, show all companies
        if (user.is_super_admin) {
          return await base44.entities.Company.list();
        }
        
        // Regular users: only show companies they have access to
        const allCompanies = await base44.entities.Company.list();
        
        // Filter by accessible_companies array OR company_id (primary company)
        const accessibleCompanies = allCompanies.filter(company => {
          // Check if this is user's primary company
          if (user.company_id === company.id) return true;
          
          // Check if company is in user's accessible_companies list
          if (user.accessible_companies && user.accessible_companies.includes(company.id)) {
            return true;
          }
          
          return false;
        });
        
        return accessibleCompanies;
      } catch (error) {
        console.error('Error loading companies:', error);
        throw error;
      }
    },
    enabled: !!user,
    retry: 3,
    retryDelay: 1000
  });

  const handleSelectCompany = (company) => {
    // Check if company needs setup
    if (!company.onboarding_completed) {
      setSetupCompany(company);
      setShowSetupWizard(true);
    } else {
      setSelectedCompany(company);
    }
  };

  const handleContinue = () => {
    if (selectedCompany) {
      switchCompany(selectedCompany);
    }
  };

  const handleSetupComplete = () => {
    setShowSetupWizard(false);
    // Refresh and select the company
    if (setupCompany) {
      refetch(); // Refresh companies list
      switchCompany(setupCompany);
    }
  };

  const handleLogout = () => {
    clearCompany();
    base44.auth.logout();
  };

  // CRITICAL FIX: Add option to go to evaluation signup
  const handleCreateNewCompany = () => {
    window.location.href = '/EvaluationSignup';
  };

  // CRITICAL FIX: Better error handling
  if (companiesError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-6">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <AlertCircle className="w-8 h-8 text-red-600" />
              Error Loading Companies
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700">
              We encountered an error while loading your companies. This might be temporary.
            </p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-900 font-mono">
                {companiesError.message || 'Unknown error'}
              </p>
            </div>
            <div className="flex gap-3">
              <Button 
                onClick={() => {
                  refetch();
                  window.location.reload();
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                Retry
              </Button>
              <Button onClick={handleLogout} variant="outline" className="flex-1">
                <LogOut className="w-4 h-4 mr-2" />
                Logout & Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showSetupWizard && setupCompany) {
    return <CompanySetupWizard company={setupCompany} onComplete={handleSetupComplete} />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
        <Card className="w-full max-w-2xl">
          <CardContent className="p-12 text-center">
            <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your companies...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (companies.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <AlertCircle className="w-8 h-8 text-orange-600" />
              No Company Access
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700">
              You don't have access to any companies yet. Please contact your system administrator 
              to be assigned to a company.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                <strong>Note:</strong> For security reasons, you can only see companies that have been 
                specifically assigned to your account.
              </p>
            </div>
            
            {/* CRITICAL FIX: Add option to create new company */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-900 mb-3">
                <strong>Want to create your own company?</strong><br/>
                Click below to start a 30-day free evaluation with your own company.
              </p>
              <Button 
                onClick={handleCreateNewCompany}
                className="bg-green-600 hover:bg-green-700 w-full"
              >
                Create New Company (Free 30-Day Trial)
              </Button>
            </div>
            
            <div className="flex gap-3">
              <Button onClick={handleLogout} variant="outline" className="flex-1">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
      <Card className="w-full max-w-4xl shadow-2xl">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl">Welcome back, {user?.full_name || 'User'}!</CardTitle>
              <p className="text-blue-100 text-sm mt-1">
                {companies.length === 1 
                  ? 'Select your company to continue' 
                  : `You have access to ${companies.length} companies`
                }
              </p>
            </div>
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="text-white hover:bg-white/20"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-8">
          <div className="space-y-4 mb-6">
            {companies.map((company) => (
              <Card
                key={company.id}
                className={`cursor-pointer transition-all border-2 ${
                  selectedCompany?.id === company.id
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                }`}
                onClick={() => handleSelectCompany(company)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                        {company.company_name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-900 mb-1">
                          {company.company_name}
                        </h3>
                        {company.trading_name && company.trading_name !== company.company_name && (
                          <p className="text-sm text-gray-600 mb-2">Trading as: {company.trading_name}</p>
                        )}
                        <div className="flex flex-wrap gap-2 mb-3">
                          {company.company_type && (
                            <Badge variant="outline" className="capitalize">
                              {company.company_type?.replace(/_/g, ' ')}
                            </Badge>
                          )}
                          {company.industry && (
                            <Badge variant="outline">{company.industry}</Badge>
                          )}
                          <Badge className={
                            company.subscription_status === 'active' 
                              ? "bg-green-100 text-green-800" 
                              : company.subscription_status === 'evaluation' || company.subscription_status === 'trial'
                              ? "bg-blue-100 text-blue-800"
                              : "bg-yellow-100 text-yellow-800"
                          }>
                            {company.subscription_status || 'active'}
                          </Badge>
                          {!company.onboarding_completed && (
                            <Badge className="bg-orange-100 text-orange-800">
                              Setup Required
                            </Badge>
                          )}
                          {company.is_evaluation && company.evaluation_days_remaining !== undefined && (
                            <Badge className="bg-purple-100 text-purple-800">
                              {company.evaluation_days_remaining} days left
                            </Badge>
                          )}
                        </div>
                        {company.contact_email && (
                          <p className="text-sm text-gray-500">{company.contact_email}</p>
                        )}
                      </div>
                    </div>
                    {selectedCompany?.id === company.id && (
                      <CheckCircle className="w-8 h-8 text-blue-600 flex-shrink-0" />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {selectedCompany && (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <Lock className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-blue-900">Access Confirmation</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    You are about to access <strong>{selectedCompany.company_name}</strong>. 
                    Click Continue to proceed to the dashboard.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-6 border-t">
            <Button
              variant="outline"
              onClick={handleLogout}
            >
              Logout
            </Button>
            <Button
              onClick={handleContinue}
              disabled={!selectedCompany}
              className="bg-blue-600 hover:bg-blue-700 px-8"
            >
              Continue to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
