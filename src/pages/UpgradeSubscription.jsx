import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, Rocket, Star, Building2, Crown, Zap, AlertCircle } from "lucide-react";
import { useCompany } from "../components/auth/CompanyContext";
import { format } from "date-fns";

export default function UpgradeSubscription() {
  const { currentCompany } = useCompany();
  const queryClient = useQueryClient();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showContactForm, setShowContactForm] = useState(false);

  const plans = [
    {
      id: 'basic',
      name: 'Basic',
      icon: Rocket,
      price: 49,
      period: 'month',
      color: 'blue',
      description: 'Perfect for small businesses just getting started',
      features: [
        '1 Company',
        'Up to 3 Users',
        'Core Accounting',
        'Sales & Purchases',
        'Basic Inventory',
        'Standard Reports',
        '5GB Storage',
        'Email Support'
      ],
      modules: {
        sales: true,
        purchases: true,
        inventory: true,
        accounting: true,
        manufacturing: false,
        job_costing: false,
        fixed_assets: false,
        payroll: false,
        non_profit: false,
        multi_currency: false,
        pos: false
      }
    },
    {
      id: 'professional',
      name: 'Professional',
      icon: Star,
      price: 99,
      period: 'month',
      color: 'purple',
      popular: true,
      description: 'Most popular for growing businesses',
      features: [
        '3 Companies',
        'Up to 10 Users',
        'All Basic Features',
        'Manufacturing Module',
        'Job Costing',
        'Fixed Assets',
        'POS System',
        'Advanced Reports',
        '25GB Storage',
        'Priority Email Support'
      ],
      modules: {
        sales: true,
        purchases: true,
        inventory: true,
        accounting: true,
        manufacturing: true,
        job_costing: true,
        fixed_assets: true,
        payroll: false,
        non_profit: false,
        multi_currency: true,
        pos: true
      }
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      icon: Crown,
      price: 199,
      period: 'month',
      color: 'green',
      description: 'Complete solution for large organizations',
      features: [
        'Unlimited Companies',
        'Unlimited Users',
        'All Professional Features',
        'Payroll Module',
        'Non-Profit Features',
        'Multi-Currency',
        'Custom Reports',
        'API Access',
        'Unlimited Storage',
        'Dedicated Account Manager',
        '24/7 Phone Support'
      ],
      modules: {
        sales: true,
        purchases: true,
        inventory: true,
        accounting: true,
        manufacturing: true,
        job_costing: true,
        fixed_assets: true,
        payroll: true,
        non_profit: true,
        multi_currency: true,
        pos: true
      }
    }
  ];

  const upgradeMutation = useMutation({
    mutationFn: async (planId) => {
      const plan = plans.find(p => p.id === planId);
      
      // Update company to paid subscription
      await base44.entities.Company.update(currentCompany.id, {
        license_type: planId,
        subscription_status: 'active',
        is_evaluation: false,
        evaluation_days_remaining: 0,
        modules_enabled: plan.modules,
        user_limit: planId === 'basic' ? 3 : planId === 'professional' ? 10 : 999
      });

      // Send confirmation email
      await base44.integrations.Core.SendEmail({
        to: currentCompany.contact_email,
        subject: `Welcome to Edge Cloud ERP ${plan.name} Plan!`,
        body: `
          Dear ${currentCompany.company_name} Team,

          Congratulations! Your subscription to Edge Cloud ERP ${plan.name} plan has been activated.

          Plan Details:
          - Plan: ${plan.name}
          - Price: $${plan.price}/month
          - Users: ${planId === 'basic' ? 'Up to 3' : planId === 'professional' ? 'Up to 10' : 'Unlimited'}
          - Companies: ${planId === 'basic' ? '1' : planId === 'professional' ? '3' : 'Unlimited'}

          Your account is now fully activated with all the features of the ${plan.name} plan.

          If you have any questions, please don't hesitate to reach out to our support team.

          Best regards,
          Edge Cloud ERP Team
        `
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['companies']);
      alert('Subscription upgraded successfully! Please refresh the page.');
      window.location.reload();
    },
    onError: (error) => {
      alert(`Upgrade failed: ${error.message}`);
    }
  });

  const handleUpgrade = (planId) => {
    if (confirm(`Are you sure you want to upgrade to the ${plans.find(p => p.id === planId)?.name} plan?`)) {
      upgradeMutation.mutate(planId);
    }
  };

  const evaluationDaysRemaining = React.useMemo(() => {
    if (!currentCompany?.is_evaluation || !currentCompany?.license_expiry_date) {
      return null;
    }
    
    const today = new Date();
    const expiryDate = new Date(currentCompany.license_expiry_date);
    const diffTime = expiryDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 ? diffDays : 0;
  }, [currentCompany]);

  if (!currentCompany?.is_evaluation) {
    return (
      <div className="p-6">
        <Alert className="bg-blue-50 border-blue-200">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-900">
            Your account is already on a paid subscription plan. To change your plan, please contact our support team.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900">Upgrade Your Subscription</h1>
        <p className="text-xl text-gray-600">
          Choose the perfect plan for your business needs
        </p>
        {evaluationDaysRemaining !== null && (
          <Alert className={`max-w-2xl mx-auto ${
            evaluationDaysRemaining <= 5 ? 'bg-red-50 border-red-200' : 'bg-orange-50 border-orange-200'
          }`}>
            <AlertCircle className={`h-4 w-4 ${evaluationDaysRemaining <= 5 ? 'text-red-600' : 'text-orange-600'}`} />
            <AlertDescription className={evaluationDaysRemaining <= 5 ? 'text-red-900' : 'text-orange-900'}>
              {evaluationDaysRemaining === 0 ? (
                <strong>Your evaluation period has expired. Upgrade now to continue using the system.</strong>
              ) : (
                <strong>You have {evaluationDaysRemaining} day{evaluationDaysRemaining !== 1 ? 's' : ''} remaining in your evaluation period.</strong>
              )}
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
        {plans.map((plan) => {
          const Icon = plan.icon;
          return (
            <Card 
              key={plan.id}
              className={`relative ${
                plan.popular ? 'border-4 border-purple-500 shadow-2xl scale-105' : 'border-2 border-gray-200'
              } transition-all hover:shadow-xl`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-purple-600 text-white px-4 py-1 text-sm font-semibold">
                    MOST POPULAR
                  </Badge>
                </div>
              )}

              <CardHeader className={`bg-gradient-to-br from-${plan.color}-50 to-${plan.color}-100 border-b`}>
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-12 h-12 bg-${plan.color}-600 rounded-xl flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <p className="text-sm text-gray-600">{plan.description}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-5xl font-bold text-gray-900">${plan.price}</span>
                  <span className="text-gray-600">/{plan.period}</span>
                </div>
              </CardHeader>

              <CardContent className="p-6">
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckCircle className={`w-5 h-5 text-${plan.color}-600 flex-shrink-0 mt-0.5`} />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={upgradeMutation.isLoading}
                  className={`w-full ${
                    plan.popular 
                      ? 'bg-purple-600 hover:bg-purple-700' 
                      : `bg-${plan.color}-600 hover:bg-${plan.color}-700`
                  } text-white font-semibold py-3 text-lg`}
                >
                  {upgradeMutation.isLoading ? 'Processing...' : 'Upgrade Now'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Custom Plan */}
      <Card className="max-w-4xl mx-auto border-2 border-gray-300">
        <CardContent className="p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-gray-700 to-gray-900 rounded-xl flex items-center justify-center">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Custom Enterprise Plan</h3>
                <p className="text-gray-600 mt-1">
                  Need a tailored solution? We can create a custom plan specific to your requirements.
                </p>
              </div>
            </div>
            <Button
              onClick={() => setShowContactForm(true)}
              variant="outline"
              size="lg"
              className="border-2 border-gray-700 hover:bg-gray-700 hover:text-white"
            >
              Contact Sales
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* FAQ Section */}
      <div className="max-w-4xl mx-auto mt-12">
        <h2 className="text-3xl font-bold text-center mb-8">Frequently Asked Questions</h2>
        <div className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold text-lg mb-2">Can I change my plan later?</h3>
              <p className="text-gray-600">
                Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately, 
                and we'll prorate any charges or credits.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold text-lg mb-2">What happens to my data if I don't upgrade?</h3>
              <p className="text-gray-600">
                Your data is safe. After the evaluation period ends, your account will be in read-only mode. 
                You can view your data but cannot create new transactions until you upgrade.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold text-lg mb-2">Is there a long-term contract?</h3>
              <p className="text-gray-600">
                No, all our plans are month-to-month. You can cancel anytime without any penalties.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold text-lg mb-2">What payment methods do you accept?</h3>
              <p className="text-gray-600">
                We accept all major credit cards, bank transfers, and PayPal. Contact our sales team for 
                enterprise payment options.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}