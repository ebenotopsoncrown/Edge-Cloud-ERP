import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import {
  TrendingUp,
  Shield,
  Zap,
  Users,
  BarChart3,
  CheckCircle,
  ArrowRight,
  Package,
  Factory,
  Briefcase,
  Heart,
  Cloud,
  Rocket,
  ShoppingCart,
  DollarSign,
  AlertCircle
} from "lucide-react";

export default function LandingPage({ onLogin }) {
  // CRITICAL FIX: Use base44's built-in authentication
  const handleSignIn = () => {
    // Redirect to base44 authentication
    base44.auth.redirectToLogin(window.location.origin + '/Dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <header className="bg-blue-600 border-b border-blue-500">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg relative">
              <Cloud className="w-8 h-8 text-blue-300/50 absolute" style={{ transform: 'translate(-2px, -2px)' }} />
              <TrendingUp className="w-7 h-7 text-blue-600 relative z-10" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Edge Cloud ERP</h1>
              <p className="text-sm text-blue-100">Innovation beyond limit</p>
            </div>
          </div>
          <Button
            onClick={handleSignIn}
            className="bg-white text-blue-600 hover:bg-blue-50 font-semibold px-6 shadow-md"
          >
            Sign In
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24">
          <div className="text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full">
              <Zap className="w-4 h-4 text-blue-400" />
              <span className="text-blue-300 text-sm font-medium">Cloud-Based Enterprise Solution</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight">
              Complete ERP System
              <br />
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Built for Growth
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto">
              Comprehensive financial management, inventory control, and business intelligence
              in one powerful platform. Start your free 30-day trial today.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                asChild
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-8 py-6 text-lg rounded-xl shadow-2xl shadow-blue-500/50 transition-all hover:scale-105"
              >
                <Link to={createPageUrl("EvaluationSignup")}>
                  <Rocket className="w-5 h-5 mr-2" />
                  Start Free 30-Day Trial
                </Link>
              </Button>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap justify-center gap-8 pt-8 text-gray-400">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span>No Credit Card Required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span>Full Feature Access</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span>Setup in Minutes</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Complete Business Management Suite Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">Complete Business Management Suite</h2>
          <p className="text-xl text-gray-400">Everything you need to run your business efficiently</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur">
            <CardHeader>
              <DollarSign className="w-12 h-12 text-blue-400 mb-4" />
              <CardTitle className="text-white">Financial Management</CardTitle>
            </CardHeader>
            <CardContent className="text-gray-300">
              <ul className="space-y-2">
                <li>• Chart of Accounts</li>
                <li>• General Ledger</li>
                <li>• Accounts Receivable/Payable</li>
                <li>• Multi-Currency Support</li>
                <li>• Financial Reporting</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur">
            <CardHeader>
              <ShoppingCart className="w-12 h-12 text-green-400 mb-4" />
              <CardTitle className="text-white">Sales & Invoicing</CardTitle>
            </CardHeader>
            <CardContent className="text-gray-300">
              <ul className="space-y-2">
                <li>• Customer Management</li>
                <li>• Invoice Generation</li>
                <li>• Payment Processing</li>
                <li>• Sales Analytics</li>
                <li>• POS Integration</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur">
            <CardHeader>
              <Package className="w-12 h-12 text-purple-400 mb-4" />
              <CardTitle className="text-white">Inventory Control</CardTitle>
            </CardHeader>
            <CardContent className="text-gray-300">
              <ul className="space-y-2">
                <li>• Real-time Stock Tracking</li>
                <li>• Multi-location Management</li>
                <li>• Purchase Orders</li>
                <li>• Warehouse Management</li>
                <li>• Reorder Automation</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur">
            <CardHeader>
              <Factory className="w-12 h-12 text-orange-400 mb-4" />
              <CardTitle className="text-white">Manufacturing</CardTitle>
            </CardHeader>
            <CardContent className="text-gray-300">
              <ul className="space-y-2">
                <li>• Bill of Materials</li>
                <li>• Work Orders</li>
                <li>• Production Planning</li>
                <li>• Cost Tracking</li>
                <li>• Quality Control</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur">
            <CardHeader>
              <BarChart3 className="w-12 h-12 text-cyan-400 mb-4" />
              <CardTitle className="text-white">Business Intelligence</CardTitle>
            </CardHeader>
            <CardContent className="text-gray-300">
              <ul className="space-y-2">
                <li>• Real-time Dashboards</li>
                <li>• Financial Statements</li>
                <li>• KPI Tracking</li>
                <li>• Custom Reports</li>
                <li>• Data Analytics</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur">
            <CardHeader>
              <Users className="w-12 h-12 text-pink-400 mb-4" />
              <CardTitle className="text-white">Team Collaboration</CardTitle>
            </CardHeader>
            <CardContent className="text-gray-300">
              <ul className="space-y-2">
                <li>• User Management</li>
                <li>• Role-based Access</li>
                <li>• Multi-user Support</li>
                <li>• Audit Trail</li>
                <li>• Activity Tracking</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <Card className="bg-gradient-to-r from-blue-600 to-cyan-600 border-none">
          <CardContent className="p-12 text-center">
            <h2 className="text-4xl font-bold text-white mb-4">
              Ready to Transform Your Business?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Join hundreds of businesses already using Edge Cloud ERP
            </p>
            <Button
              asChild
              className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-6 text-lg rounded-xl shadow-xl"
            >
              <Link to={createPageUrl("EvaluationSignup")}>
                <Rocket className="w-5 h-5 mr-2" />
                Start Your Free Trial Now
              </Link>
            </Button>
            <p className="text-blue-100 mt-4 text-sm">
              No credit card required • Full access • Cancel anytime
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center text-gray-400">
            <p className="mb-2">© 2024 Edge Cloud ERP. All rights reserved.</p>
            <p className="text-sm">Enterprise Resource Planning Made Simple</p>
          </div>
        </div>
      </div>
    </div>
  );
}