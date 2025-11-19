import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Cloud, 
  Building2, 
  Users,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Database
} from "lucide-react";

export default function MultiTenancyGuide() {
  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900">Edge Cloud Enterprise</h1>
        <h2 className="text-2xl font-semibold text-blue-600">Multi-Tenancy Architecture Guide</h2>
        <p className="text-gray-600">Understanding the TWO deployment models</p>
      </div>

      <Alert className="bg-blue-50 border-blue-200">
        <AlertTriangle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-900">
          <strong>Important:</strong> There are TWO ways to deploy Edge Cloud Enterprise for multiple clients. 
          Choose the model that best fits your business.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="comparison" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="comparison">Comparison</TabsTrigger>
          <TabsTrigger value="saas">SaaS Model (Recommended)</TabsTrigger>
          <TabsTrigger value="dedicated">Dedicated Instance Model</TabsTrigger>
        </TabsList>

        {/* COMPARISON TAB */}
        <TabsContent value="comparison" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* SaaS Model */}
            <Card className="border-2 border-green-300 bg-green-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-900">
                  <Cloud className="w-5 h-5" />
                  Model 1: SaaS Multi-Tenant
                </CardTitle>
                <Badge className="bg-green-600 text-white w-fit">RECOMMENDED - Like QuickBooks Online</Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-white rounded-lg p-4">
                  <h4 className="font-semibold mb-3">How It Works:</h4>
                  <ul className="text-sm space-y-2 text-gray-700">
                    <li>✓ <strong>ONE app instance</strong></li>
                    <li>✓ <strong>ONE domain</strong>: edgecloudenterprise.com</li>
                    <li>✓ All clients access the same URL</li>
                    <li>✓ Users select their company after login</li>
                    <li>✓ Data separated by company_id</li>
                    <li>✓ One database with company isolation</li>
                  </ul>
                </div>

                <div className="bg-white rounded-lg p-4">
                  <h4 className="font-semibold mb-3 text-green-700">Advantages:</h4>
                  <ul className="text-sm space-y-1 text-gray-700">
                    <li>✓ True white-label under YOUR brand</li>
                    <li>✓ Single domain for all clients</li>
                    <li>✓ Easy to manage and update</li>
                    <li>✓ Lower hosting costs</li>
                    <li>✓ Quick client onboarding</li>
                    <li>✓ Centralized management</li>
                  </ul>
                </div>

                <div className="bg-white rounded-lg p-4">
                  <h4 className="font-semibold mb-3 text-red-700">Disadvantages:</h4>
                  <ul className="text-sm space-y-1 text-gray-700">
                    <li>✗ Requires company_id on all entities</li>
                    <li>✗ Must implement company selection</li>
                    <li>✗ All clients share same modules</li>
                    <li>✗ Risk of data leakage if not coded right</li>
                  </ul>
                </div>

                <div className="bg-green-100 rounded-lg p-4">
                  <p className="text-sm font-semibold text-green-900">Example URLs:</p>
                  <ul className="text-sm mt-2 space-y-1">
                    <li>• <code className="bg-white px-2 py-1 rounded">edgecloudenterprise.com</code> (All clients)</li>
                    <li>• User logs in → Selects "ABC Manufacturing"</li>
                    <li>• User sees only ABC Manufacturing data</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Dedicated Model */}
            <Card className="border-2 border-blue-300 bg-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-900">
                  <Database className="w-5 h-5" />
                  Model 2: Dedicated Instances
                </CardTitle>
                <Badge className="bg-blue-600 text-white w-fit">Maximum Isolation</Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-white rounded-lg p-4">
                  <h4 className="font-semibold mb-3">How It Works:</h4>
                  <ul className="text-sm space-y-2 text-gray-700">
                    <li>✓ <strong>SEPARATE app per client</strong></li>
                    <li>✓ <strong>DIFFERENT URLs</strong> per client</li>
                    <li>✓ Each client = separate database</li>
                    <li>✓ Complete isolation</li>
                    <li>✓ Clone app for each client</li>
                    <li>✓ Independent customization</li>
                  </ul>
                </div>

                <div className="bg-white rounded-lg p-4">
                  <h4 className="font-semibold mb-3 text-green-700">Advantages:</h4>
                  <ul className="text-sm space-y-1 text-gray-700">
                    <li>✓ Complete data isolation</li>
                    <li>✓ Custom modules per client</li>
                    <li>✓ Client-specific customizations</li>
                    <li>✓ Independent backups</li>
                    <li>✓ Can use client's custom domain</li>
                  </ul>
                </div>

                <div className="bg-white rounded-lg p-4">
                  <h4 className="font-semibold mb-3 text-red-700">Disadvantages:</h4>
                  <ul className="text-sm space-y-1 text-gray-700">
                    <li>✗ Different URL per client (not your domain)</li>
                    <li>✗ More app instances to manage</li>
                    <li>✗ Updates must be applied to each</li>
                    <li>✗ Higher hosting costs</li>
                    <li>✗ NOT true white-label</li>
                  </ul>
                </div>

                <div className="bg-blue-100 rounded-lg p-4">
                  <p className="text-sm font-semibold text-blue-900">Example URLs:</p>
                  <ul className="text-sm mt-2 space-y-1">
                    <li>• <code className="bg-white px-2 py-1 rounded">abc-mfg.base44.app</code> (Client A)</li>
                    <li>• <code className="bg-white px-2 py-1 rounded">xyz-const.base44.app</code> (Client B)</li>
                    <li>• <code className="bg-white px-2 py-1 rounded">hope-found.base44.app</code> (Client C)</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <CheckCircle className="w-16 h-16 mx-auto text-green-600" />
                <h3 className="text-2xl font-bold text-gray-900">Recommendation: Use SaaS Model</h3>
                <p className="text-gray-700 max-w-2xl mx-auto">
                  Based on your requirement ("like QuickBooks Online"), you should use the <strong>SaaS Multi-Tenant Model</strong>. 
                  All clients access via <strong>edgecloudenterprise.com</strong>, select their company on login, and get a fully white-labeled experience under YOUR brand.
                </p>
                <div className="flex justify-center gap-4 pt-4">
                  <Badge className="bg-green-600 text-white px-6 py-2 text-base">
                    ✓ Same Domain for All
                  </Badge>
                  <Badge className="bg-green-600 text-white px-6 py-2 text-base">
                    ✓ Company Selection
                  </Badge>
                  <Badge className="bg-green-600 text-white px-6 py-2 text-base">
                    ✓ Your Brand Only
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SAAS MODEL TAB */}
        <TabsContent value="saas" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cloud className="w-5 h-5" />
                Implementing SaaS Multi-Tenant Model
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert className="bg-yellow-50 border-yellow-200">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-900">
                  <strong>Current Status:</strong> Edge Cloud Enterprise is currently built as a single-company system. 
                  To implement true multi-tenancy, we need to add company selection and company_id filtering.
                </AlertDescription>
              </Alert>

              <Card className="border-2 border-blue-200">
                <CardContent className="pt-6">
                  <h4 className="font-semibold text-lg mb-4">Implementation Steps</h4>
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm">
                        1
                      </div>
                      <div className="flex-1">
                        <h5 className="font-semibold mb-2">Create Company Entity</h5>
                        <p className="text-sm text-gray-700">
                          Add a Company entity to store company/organization information:
                          company_name, license_key, is_active, modules_enabled, etc.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm">
                        2
                      </div>
                      <div className="flex-1">
                        <h5 className="font-semibold mb-2">Add company_id to All Entities</h5>
                        <p className="text-sm text-gray-700">
                          Add company_id field to: Invoice, Bill, Customer, Vendor, Product, Account, 
                          Employee, Job, WorkOrder, etc. This isolates data per company.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm">
                        3
                      </div>
                      <div className="flex-1">
                        <h5 className="font-semibold mb-2">Link Users to Companies</h5>
                        <p className="text-sm text-gray-700">
                          Extend User entity with company_id or create UserCompany relationship table. 
                          Users can belong to one or multiple companies.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm">
                        4
                      </div>
                      <div className="flex-1">
                        <h5 className="font-semibold mb-2">Create Company Selector Component</h5>
                        <p className="text-sm text-gray-700">
                          After login, show company selection screen. Store selected company in context/state. 
                          All subsequent queries filter by company_id.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm">
                        5
                      </div>
                      <div className="flex-1">
                        <h5 className="font-semibold mb-2">Update All Queries to Filter by Company</h5>
                        <p className="text-sm text-gray-700">
                          Every list/filter query must include company_id filter. Example:
                          <code className="bg-gray-100 px-2 py-1 rounded block mt-2">
                            base44.entities.Invoice.filter({`{company_id: currentCompany.id}`})
                          </code>
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm">
                        6
                      </div>
                      <div className="flex-1">
                        <h5 className="font-semibold mb-2">Test Data Isolation</h5>
                        <p className="text-sm text-gray-700">
                          Create test companies, verify users can only see their company's data, 
                          ensure no data leakage between companies.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-green-50 border-green-200">
                <CardContent className="pt-6">
                  <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    How It Works After Implementation
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div className="bg-white rounded-lg p-4">
                      <p className="font-semibold mb-2">1. Client Onboarding:</p>
                      <ul className="space-y-1 text-gray-700 ml-4">
                        <li>• Admin creates new Company record in system</li>
                        <li>• Generates license key for the company</li>
                        <li>• Sets up initial Chart of Accounts for company</li>
                        <li>• Invites company admin users</li>
                      </ul>
                    </div>

                    <div className="bg-white rounded-lg p-4">
                      <p className="font-semibold mb-2">2. User Experience:</p>
                      <ul className="space-y-1 text-gray-700 ml-4">
                        <li>• User goes to: <code className="bg-gray-100 px-1 rounded">edgecloudenterprise.com</code></li>
                        <li>• Logs in with email/password</li>
                        <li>• Sees list of companies they have access to</li>
                        <li>• Selects "ABC Manufacturing"</li>
                        <li>• Works within that company's data only</li>
                        <li>• Can switch companies if they have access to multiple</li>
                      </ul>
                    </div>

                    <div className="bg-white rounded-lg p-4">
                      <p className="font-semibold mb-2">3. Your Branding:</p>
                      <ul className="space-y-1 text-gray-700 ml-4">
                        <li>• Your logo everywhere</li>
                        <li>• Your domain name only</li>
                        <li>• Your brand colors</li>
                        <li>• No "base44" or other branding visible to clients</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        {/* DEDICATED MODEL TAB */}
        <TabsContent value="dedicated" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Dedicated Instance Model (Current Setup)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert className="bg-blue-50 border-blue-200">
                <AlertTriangle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-900">
                  This is what was explained earlier. Each client gets their own app instance with separate URL.
                  See Settings → Deployment Guide for complete details.
                </AlertDescription>
              </Alert>

              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6">
                <h4 className="font-semibold text-lg mb-3 text-yellow-900">Why This Doesn't Meet Your Requirement:</h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>✗ Client A: <code className="bg-white px-2 py-1 rounded">client-a.base44.app</code></li>
                  <li>✗ Client B: <code className="bg-white px-2 py-1 rounded">client-b.base44.app</code></li>
                  <li>✗ NOT your domain (edgecloudenterprise.com)</li>
                  <li>✗ NOT white-labeled under your brand</li>
                  <li>✗ Different URLs confuse clients</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <h3 className="text-2xl font-bold text-gray-900">🎯 Next Steps</h3>
            <p className="text-gray-700 max-w-3xl mx-auto">
              <strong>To implement true multi-tenancy (SaaS model):</strong> I can help you add Company entity, 
              company_id to all entities, company selector, and automatic filtering. This will give you the 
              QuickBooks Online style deployment where all clients access via edgecloudenterprise.com.
            </p>
            <p className="text-sm text-gray-600 italic">
              Let me know if you want me to implement the SaaS multi-tenant model now!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}