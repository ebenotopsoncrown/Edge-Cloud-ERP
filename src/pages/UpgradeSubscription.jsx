import React, { useState } from "react";
import { Company } from "@/api/entities";
import { SendEmail } from "@/api/integrations";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle, Rocket, Star, Building2, Crown, Zap, AlertCircle, CreditCard } from "lucide-react";
import { useCompany } from "../components/auth/CompanyContext";
import PageShell, { PageHeader } from "../components/shared/PageShell";

const PLAN_COLORS = {
  basic:        { primary: '#1B4F8A', light: '#EBF4FB', dark: '#1B4F8A' },
  professional: { primary: '#7C3AED', light: '#F3E8FF', dark: '#6D28D9' },
  enterprise:   { primary: '#00A86B', light: '#D1FAE5', dark: '#059669' },
};

export default function UpgradeSubscription() {
  const { currentCompany } = useCompany();
  const queryClient = useQueryClient();
  const [selectedPlan, setSelectedPlan] = useState(null);

  const plans = [
    {
      id: 'basic', name: 'Basic', icon: Rocket, price: 49, period: 'month',
      description: 'Perfect for small businesses just getting started',
      features: ['1 Company','Up to 3 Users','Core Accounting','Sales & Purchases','Basic Inventory','Standard Reports','5GB Storage','Email Support'],
      modules: { sales:true, purchases:true, inventory:true, accounting:true, manufacturing:false, job_costing:false, fixed_assets:false, payroll:false, non_profit:false, multi_currency:false, pos:false }
    },
    {
      id: 'professional', name: 'Professional', icon: Star, price: 99, period: 'month', popular: true,
      description: 'Most popular for growing businesses',
      features: ['3 Companies','Up to 10 Users','All Basic Features','Manufacturing Module','Job Costing','Fixed Assets','POS System','Advanced Reports','25GB Storage','Priority Email Support'],
      modules: { sales:true, purchases:true, inventory:true, accounting:true, manufacturing:true, job_costing:true, fixed_assets:true, payroll:false, non_profit:false, multi_currency:true, pos:true }
    },
    {
      id: 'enterprise', name: 'Enterprise', icon: Crown, price: 199, period: 'month',
      description: 'Complete solution for large organizations',
      features: ['Unlimited Companies','Unlimited Users','All Professional Features','Payroll Module','Non-Profit Features','Multi-Currency','Custom Reports','API Access','Unlimited Storage','Dedicated Account Manager','24/7 Phone Support'],
      modules: { sales:true, purchases:true, inventory:true, accounting:true, manufacturing:true, job_costing:true, fixed_assets:true, payroll:true, non_profit:true, multi_currency:true, pos:true }
    }
  ];

  const upgradeMutation = useMutation({
    mutationFn: async (planId) => {
      const plan = plans.find(p => p.id === planId);
      await Company.update(currentCompany.id, {
        license_type: planId, subscription_status: 'active', is_evaluation: false,
        evaluation_days_remaining: 0, modules_enabled: plan.modules,
        user_limit: planId === 'basic' ? 3 : planId === 'professional' ? 10 : 999
      });
      await SendEmail({
        to: currentCompany.contact_email,
        subject: `Welcome to Edge Cloud ERP ${plan.name} Plan!`,
        body: `Dear ${currentCompany.company_name} Team,\n\nCongratulations! Your subscription to Edge Cloud ERP ${plan.name} plan has been activated.\n\nPlan: ${plan.name} · $${plan.price}/month\n\nBest regards,\nEdge Cloud ERP Team`
      });
    },
    onSuccess: () => { queryClient.invalidateQueries(['companies']); alert('Subscription upgraded successfully! Please refresh the page.'); window.location.reload(); },
    onError: (error) => alert(`Upgrade failed: ${error.message}`)
  });

  const handleUpgrade = (planId) => {
    if (confirm(`Are you sure you want to upgrade to the ${plans.find(p => p.id === planId)?.name} plan?`)) {
      upgradeMutation.mutate(planId);
    }
  };

  const evaluationDaysRemaining = React.useMemo(() => {
    if (!currentCompany?.is_evaluation || !currentCompany?.license_expiry_date) return null;
    const diffDays = Math.ceil((new Date(currentCompany.license_expiry_date) - new Date()) / (1000*60*60*24));
    return diffDays > 0 ? diffDays : 0;
  }, [currentCompany]);

  if (!currentCompany?.is_evaluation) {
    return (
      <PageShell>
        <div style={{ background: '#EBF4FB', border: '1.5px solid #BFDBFE', borderRadius: 12, padding: '20px 24px', display: 'flex', gap: 14 }}>
          <AlertCircle style={{ width: 22, height: 22, color: '#1B4F8A', flexShrink: 0, marginTop: 2 }} />
          <p style={{ fontSize: 14, color: '#1E3A5F', fontWeight: 500 }}>
            Your account is already on a paid subscription plan. To change your plan, please contact our support team.
          </p>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        title="Upgrade Your Subscription"
        subtitle="Choose the perfect plan for your business needs"
        icon={CreditCard}
        accentColor="#1B4F8A"
      />

      {/* Evaluation warning banner */}
      {evaluationDaysRemaining !== null && (
        <div style={{
          background: evaluationDaysRemaining <= 5 ? '#FEF2F2' : '#FFF7ED',
          border: `1.5px solid ${evaluationDaysRemaining <= 5 ? '#FECACA' : '#FED7AA'}`,
          borderRadius: 12, padding: '14px 20px', display: 'flex', gap: 12, marginBottom: 28, alignItems: 'center'
        }}>
          <AlertCircle style={{ width: 20, height: 20, color: evaluationDaysRemaining <= 5 ? '#EF4444' : '#F97316', flexShrink: 0 }} />
          <p style={{ fontSize: 14, fontWeight: 600, color: evaluationDaysRemaining <= 5 ? '#991B1B' : '#9A3412' }}>
            {evaluationDaysRemaining === 0
              ? 'Your evaluation period has expired. Upgrade now to continue using the system.'
              : `You have ${evaluationDaysRemaining} day${evaluationDaysRemaining !== 1 ? 's' : ''} remaining in your evaluation period.`}
          </p>
        </div>
      )}

      {/* Pricing Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginBottom: 32 }}>
        {plans.map(plan => {
          const Icon = plan.icon;
          const pc = PLAN_COLORS[plan.id];
          return (
            <div
              key={plan.id}
              style={{
                background: 'white', borderRadius: 16,
                border: plan.popular ? `2.5px solid ${pc.primary}` : '1.5px solid #E2E8F0',
                boxShadow: plan.popular ? `0 8px 32px ${pc.primary}22` : '0 2px 12px rgba(15,43,91,0.07)',
                overflow: 'hidden', position: 'relative',
                transform: plan.popular ? 'scale(1.03)' : 'scale(1)',
                transition: 'box-shadow 200ms',
              }}
            >
              {plan.popular && (
                <div style={{ background: pc.primary, color: 'white', textAlign: 'center', padding: '6px 0', fontSize: 11.5, fontWeight: 800, letterSpacing: '0.12em' }}>
                  MOST POPULAR
                </div>
              )}

              {/* Plan header */}
              <div style={{ background: pc.light, padding: '24px 24px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <div style={{ width: 44, height: 44, background: pc.primary, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon style={{ width: 22, height: 22, color: 'white' }} />
                  </div>
                  <div>
                    <p style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', lineHeight: 1 }}>{plan.name}</p>
                    <p style={{ fontSize: 12.5, color: '#64748B', marginTop: 3 }}>{plan.description}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                  <span style={{ fontSize: 42, fontWeight: 900, color: pc.primary, lineHeight: 1 }}>${plan.price}</span>
                  <span style={{ fontSize: 14, color: '#64748B' }}>/{plan.period}</span>
                </div>
              </div>

              {/* Features */}
              <div style={{ padding: '20px 24px' }}>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {plan.features.map((feature, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
                      <CheckCircle style={{ width: 16, height: 16, color: pc.primary, flexShrink: 0, marginTop: 1 }} />
                      <span style={{ fontSize: 13.5, color: '#374151' }}>{feature}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={upgradeMutation.isPending}
                  style={{
                    width: '100%', padding: '12px', border: 'none', borderRadius: 10,
                    background: pc.primary, color: 'white', fontSize: 15, fontWeight: 700,
                    cursor: upgradeMutation.isPending ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                    opacity: upgradeMutation.isPending ? 0.7 : 1
                  }}
                >
                  {upgradeMutation.isPending ? 'Processing…' : `Upgrade to ${plan.name}`}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Custom Plan */}
      <div style={{ background: 'white', borderRadius: 14, border: '1.5px solid #E2E8F0', padding: '24px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, boxShadow: '0 2px 8px rgba(15,43,91,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 56, height: 56, background: 'linear-gradient(135deg, #1B4F8A, #0F2B5B)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap style={{ width: 28, height: 28, color: 'white' }} />
          </div>
          <div>
            <p style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', marginBottom: 4 }}>Custom Enterprise Plan</p>
            <p style={{ fontSize: 13.5, color: '#64748B' }}>Need a tailored solution? We can create a custom plan specific to your requirements.</p>
          </div>
        </div>
        <button style={{ padding: '10px 22px', border: '2px solid #1B4F8A', borderRadius: 9, background: 'white', color: '#1B4F8A', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
          Contact Sales
        </button>
      </div>

      {/* FAQ */}
      <div>
        <p style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', marginBottom: 16, textAlign: 'center' }}>Frequently Asked Questions</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { q: 'Can I change my plan later?', a: 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately, and we\'ll prorate any charges or credits.' },
            { q: 'What happens to my data if I don\'t upgrade?', a: 'Your data is safe. After the evaluation period ends, your account will be in read-only mode. You can view your data but cannot create new transactions until you upgrade.' },
            { q: 'Is there a long-term contract?', a: 'No, all our plans are month-to-month. You can cancel anytime without any penalties.' },
            { q: 'What payment methods do you accept?', a: 'We accept all major credit cards, bank transfers, and PayPal. Contact our sales team for enterprise payment options.' },
          ].map((faq, i) => (
            <div key={i} style={{ background: 'white', borderRadius: 12, border: '1px solid #F1F5F9', padding: '18px 22px', boxShadow: '0 1px 4px rgba(15,43,91,0.05)' }}>
              <p style={{ fontSize: 14.5, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>{faq.q}</p>
              <p style={{ fontSize: 13.5, color: '#64748B', lineHeight: 1.6 }}>{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
