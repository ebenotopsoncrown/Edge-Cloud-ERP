import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Cloud, 
  Copy, 
  Key, 
  Globe,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Database,
  Settings as SettingsIcon
} from "lucide-react";

export default function DeploymentGuide() {
  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900">Edge Cloud Enterprise</h1>
        <h2 className="text-2xl font-semibold text-blue-600">Complete Deployment Architecture & Licensing Guide</h2>
        <p className="text-gray-600">Step-by-step process for deploying to multiple clients</p>
      </div>

      <Alert className="bg-blue-50 border-blue-200">
        <AlertTriangle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-900">
          <strong>Important:</strong> This guide explains how the multi-tenant architecture works on Supabase platform.
          Read carefully to understand the deployment model.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="architecture" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="architecture">Architecture</TabsTrigger>
          <TabsTrigger value="cloning">Cloning Process</TabsTrigger>
          <TabsTrigger value="licensing">Licensing Model</TabsTrigger>
          <TabsTrigger value="customization">Customization</TabsTrigger>
        </TabsList>

        {/* ARCHITECTURE TAB */}
        <TabsContent value="architecture" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cloud className="w-5 h-5" />
                How the Deployment Architecture Works
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border-2 border-blue-200">
                <h3 className="text-xl font-bold mb-4">ðŸ—ï¸ Master Template vs Client Instances</h3>
                <div className="space-y-4">
                  <div className="bg-white rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-2">ðŸ“‹ Master Template (This App)</h4>
                    <ul className="text-sm space-y-1 text-gray-700">
                      <li>â€¢ This is YOUR master template: <code className="bg-gray-100 px-2 py-1 rounded">edgecloudenterprise.com</code></li>
                      <li>â€¢ Contains all core features and modules</li>
                      <li>â€¢ Used as the base for cloning</li>
                      <li>â€¢ Never deployed directly to clients</li>
                      <li>â€¢ Your development and testing environment</li>
                    </ul>
                  </div>

                  <div className="flex justify-center">
                    <ArrowRight className="w-8 h-8 text-blue-600" />
                  </div>

                  <div className="bg-white rounded-lg p-4">
                    <h4 className="font-semibold text-green-900 mb-2">ðŸ¢ Client Instances (Cloned Apps)</h4>
                    <ul className="text-sm space-y-1 text-gray-700">
                      <li>â€¢ Each client gets their OWN separate app instance</li>
                      <li>â€¢ Each has a unique URL: <code className="bg-gray-100 px-2 py-1 rounded">client-abc-erp.yourdomain.com</code></li>
                      <li>â€¢ Completely isolated database</li>
                      <li>â€¢ Can be customized independently</li>
                      <li>â€¢ Custom domain possible: <code className="bg-gray-100 px-2 py-1 rounded">erp.clientcompany.com</code></li>
                    </ul>
                  </div>
                </div>
              </div>

              <Card className="border-2 border-green-200 bg-green-50">
                <CardContent className="pt-6">
                  <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    Example Deployment Scenario
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div className="bg-white rounded p-3">
                      <p className="font-semibold">Your Master Template:</p>
                      <code className="text-blue-600">edgecloudenterprise.com</code>
                      <p className="text-xs text-gray-600 mt-1">Used for development and as clone source</p>
                    </div>

                    <ArrowRight className="w-6 h-6 text-gray-400 mx-auto" />

                    <div className="space-y-2">
                      <div className="bg-white rounded p-3">
                        <p className="font-semibold">Client 1: ABC Manufacturing</p>
                        <code className="text-green-600">abc-manufacturing-erp.yourdomain.com</code>
                        <p className="text-xs text-gray-600 mt-1">Modules: Sales, Purchases, Manufacturing, Inventory</p>
                      </div>

                      <div className="bg-white rounded p-3">
                        <p className="font-semibold">Client 2: XYZ Construction</p>
                        <code className="text-green-600">xyz-construction-erp.yourdomain.com</code>
                        <p className="text-xs text-gray-600 mt-1">Modules: Sales, Purchases, Job Costing, Fixed Assets</p>
                      </div>

                      <div className="bg-white rounded p-3">
                        <p className="font-semibold">Client 3: Hope Foundation (Non-Profit)</p>
                        <code className="text-green-600">hope-foundation-erp.yourdomain.com</code>
                        <p className="text-xs text-gray-600 mt-1">Modules: Sales, Accounting, Non-Profit, Donations</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Alert className="bg-yellow-50 border-yellow-200">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-900">
                  <strong>Key Point:</strong> Your domain (edgecloudenterprise.com) remains YOUR template. 
                  Each client gets their own separate app with their own URL. Customizations to Client A 
                  do NOT affect Client B or your master template.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CLONING TAB */}
        <TabsContent value="cloning" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Copy className="w-5 h-5" />
                How to Clone App for New Client
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">ðŸ“ Where to Clone the App</h3>
                <p className="text-gray-700 mb-4">
                  Cloning happens in the <strong>Supabase platform dashboard</strong>, NOT inside this app.
                </p>
              </div>

              <Card className="border-2 border-green-200">
                <CardContent className="pt-6">
                  <h4 className="font-semibold text-lg mb-4">Step-by-Step Cloning Process</h4>
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                        1
                      </div>
                      <div className="flex-1">
                        <h5 className="font-semibold mb-2">Access Supabase Dashboard</h5>
                        <ul className="text-sm space-y-1 text-gray-700">
                          <li>â€¢ Click on your profile/menu (top right of this screen)</li>
                          <li>â€¢ Select "Supabase Dashboard" or "Platform Dashboard"</li>
                          <li>â€¢ This takes you to: <code className="bg-gray-100 px-2 py-1 rounded">supabase.com/dashboard</code></li>
                        </ul>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                        2
                      </div>
                      <div className="flex-1">
                        <h5 className="font-semibold mb-2">Find Your Master App</h5>
                        <ul className="text-sm space-y-1 text-gray-700">
                          <li>â€¢ You'll see a list of all your apps</li>
                          <li>â€¢ Find "Edge Cloud Enterprise" (your master template)</li>
                          <li>â€¢ Click on the three dots (â‹®) or "Actions" menu</li>
                        </ul>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                        3
                      </div>
                      <div className="flex-1">
                        <h5 className="font-semibold mb-2">Clone the App</h5>
                        <ul className="text-sm space-y-1 text-gray-700">
                          <li>â€¢ Click "Clone App" or "Duplicate App"</li>
                          <li>â€¢ Give it a name: e.g., "[Client Name] - ERP"</li>
                          <li>â€¢ Example: "ABC Manufacturing - ERP"</li>
                          <li>â€¢ The system will create a complete copy</li>
                        </ul>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                        4
                      </div>
                      <div className="flex-1">
                        <h5 className="font-semibold mb-2">Access the Cloned App</h5>
                        <ul className="text-sm space-y-1 text-gray-700">
                          <li>â€¢ Once cloning completes (takes 1-2 minutes)</li>
                          <li>â€¢ Click "Open App" to access the new instance</li>
                          <li>â€¢ You'll get a URL like: <code className="bg-gray-100 px-2 py-1 rounded">abc-manufacturing-erp.yourdomain.com</code></li>
                          <li>â€¢ This is now a completely separate app</li>
                        </ul>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                        5
                      </div>
                      <div className="flex-1">
                        <h5 className="font-semibold mb-2">Configure for Client</h5>
                        <ul className="text-sm space-y-1 text-gray-700">
                          <li>â€¢ Open the cloned app</li>
                          <li>â€¢ Go to Settings â†’ Enable/disable modules</li>
                          <li>â€¢ Update branding (company name in layout if needed)</li>
                          <li>â€¢ Set up Chart of Accounts</li>
                          <li>â€¢ Create license record (Settings â†’ License Management)</li>
                        </ul>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                        6
                      </div>
                      <div className="flex-1">
                        <h5 className="font-semibold mb-2">Invite Client Users</h5>
                        <ul className="text-sm space-y-1 text-gray-700">
                          <li>â€¢ In the cloned app, go to app menu â†’ Dashboard â†’ Users</li>
                          <li>â€¢ Click "Invite User"</li>
                          <li>â€¢ Enter client admin's email</li>
                          <li>â€¢ Select role (Admin or User)</li>
                          <li>â€¢ Client receives email invitation</li>
                        </ul>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                        7
                      </div>
                      <div className="flex-1">
                        <h5 className="font-semibold mb-2">Hand Over to Client</h5>
                        <ul className="text-sm space-y-1 text-gray-700">
                          <li>â€¢ Provide client with their app URL</li>
                          <li>â€¢ They log in with their invited email</li>
                          <li>â€¢ Conduct training session</li>
                          <li>â€¢ Go live!</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-purple-50 border-purple-200">
                <CardContent className="pt-6">
                  <h4 className="font-semibold text-lg mb-3">â±ï¸ Timeline</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Cloning app:</span>
                      <span className="font-semibold">1-2 minutes</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Configuration & setup:</span>
                      <span className="font-semibold">2-4 hours</span>
                    </div>
                    <div className="flex justify-between">
                      <span>User training:</span>
                      <span className="font-semibold">1-2 days</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Data migration (if needed):</span>
                      <span className="font-semibold">1-2 weeks</span>
                    </div>
                    <div className="flex justify-between border-t pt-2 mt-2">
                      <span className="font-semibold">Total deployment time:</span>
                      <span className="font-semibold text-purple-600">2-4 weeks</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        {/* LICENSING TAB */}
        <TabsContent value="licensing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5" />
                Understanding the Licensing Model
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert className="bg-yellow-50 border-yellow-200">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-900">
                  <strong>Important Clarification:</strong> The licensing system in Settings â†’ License Management 
                  is currently for <strong>record-keeping and documentation purposes</strong>. 
                  It does NOT enforce license restrictions within the app.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-2 border-blue-200">
                  <CardContent className="pt-6">
                    <h4 className="font-semibold text-lg mb-3">ðŸ“ Current Licensing (Record-Keeping)</h4>
                    <div className="space-y-3 text-sm">
                      <div>
                        <p className="font-semibold mb-1">What It Does:</p>
                        <ul className="space-y-1 text-gray-700">
                          <li>âœ“ Generates unique license keys</li>
                          <li>âœ“ Generates activation codes</li>
                          <li>âœ“ Stores client license information</li>
                          <li>âœ“ Tracks which modules are enabled</li>
                          <li>âœ“ Records expiry dates</li>
                          <li>âœ“ Maintains client contact info</li>
                        </ul>
                      </div>
                      <div>
                        <p className="font-semibold mb-1 text-red-600">What It Doesn't Do:</p>
                        <ul className="space-y-1 text-gray-700">
                          <li>âœ— Does NOT verify license on app startup</li>
                          <li>âœ— Does NOT block access if license expires</li>
                          <li>âœ— Does NOT enforce user limits</li>
                          <li>âœ— Does NOT require activation code input</li>
                        </ul>
                      </div>
                      <div className="bg-blue-50 rounded p-3 mt-3">
                        <p className="text-xs">
                          <strong>Use Case:</strong> Keep records of which client has which license type, 
                          for your internal tracking and billing purposes.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2 border-green-200">
                  <CardContent className="pt-6">
                    <h4 className="font-semibold text-lg mb-3">ðŸ” True Licensing (If Needed)</h4>
                    <div className="space-y-3 text-sm">
                      <div>
                        <p className="font-semibold mb-1">Would Require:</p>
                        <ul className="space-y-1 text-gray-700">
                          <li>â€¢ License validation on app startup</li>
                          <li>â€¢ Activation code verification screen</li>
                          <li>â€¢ Blocking access if license invalid/expired</li>
                          <li>â€¢ User limit enforcement</li>
                          <li>â€¢ Module restriction based on license type</li>
                          <li>â€¢ Regular license checks</li>
                        </ul>
                      </div>
                      <div className="bg-yellow-50 rounded p-3 mt-3">
                        <p className="text-xs">
                          <strong>Note:</strong> This level of license enforcement is complex and typically 
                          not needed when you control app deployment and user access through Supabase platform.
                        </p>
                      </div>
                      <div className="bg-green-50 rounded p-3">
                        <p className="text-xs">
                          <strong>Alternative:</strong> Control access through Supabase's user management. 
                          You control who gets invited, what they can access, and when to revoke access.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-blue-50 border-2 border-blue-300">
                <CardContent className="pt-6">
                  <h4 className="font-semibold text-lg mb-4">âœ… Recommended Licensing Approach</h4>
                  <div className="space-y-4">
                    <div className="bg-white rounded-lg p-4">
                      <h5 className="font-semibold mb-2">1. Use License Management for Records</h5>
                      <p className="text-sm text-gray-700">
                        Go to Settings â†’ License Management in each client's app instance. 
                        Generate a license record with their details, selected modules, and expiry date. 
                        This helps you track what each client has purchased.
                      </p>
                    </div>

                    <div className="bg-white rounded-lg p-4">
                      <h5 className="font-semibold mb-2">2. Control Access via Supabase platform</h5>
                      <p className="text-sm text-gray-700">
                        Use Supabase's user management to control who can access each client's app. 
                        If a client stops paying, you simply remove their users' access through the platform dashboard.
                      </p>
                    </div>

                    <div className="bg-white rounded-lg p-4">
                      <h5 className="font-semibold mb-2">3. Module Control via Settings</h5>
                      <p className="text-sm text-gray-700">
                        Use Settings â†’ Module Preferences to enable/disable modules for each client based on 
                        what they've paid for. This is manual but effective.
                      </p>
                    </div>

                    <div className="bg-white rounded-lg p-4">
                      <h5 className="font-semibold mb-2">4. Contract & Billing Separately</h5>
                      <p className="text-sm text-gray-700">
                        Handle licensing, contracts, and billing through your standard business processes 
                        (invoices, contracts, payment terms). The app doesn't need to enforce this.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CUSTOMIZATION TAB */}
        <TabsContent value="customization" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SettingsIcon className="w-5 h-5" />
                Client-Specific Customizations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  How Customization Works Without Affecting Master Template
                </h3>
                <p className="text-gray-700 mb-4">
                  Because each client gets their own cloned app instance, you can customize each one independently 
                  without affecting your master template or other clients.
                </p>
              </div>

              <Card className="border-2 border-purple-200">
                <CardContent className="pt-6">
                  <h4 className="font-semibold text-lg mb-4">Types of Customizations</h4>
                  <div className="space-y-4">
                    <div className="bg-purple-50 rounded-lg p-4">
                      <h5 className="font-semibold mb-2">1. Module Selection (Easy)</h5>
                      <ul className="text-sm space-y-1 text-gray-700">
                        <li>â€¢ Go to Settings â†’ Module Preferences in client's app</li>
                        <li>â€¢ Enable/disable modules based on client needs</li>
                        <li>â€¢ Example: Manufacturer needs Manufacturing, Construction company needs Job Costing</li>
                        <li>â€¢ This is per-instance, doesn't affect other clients</li>
                      </ul>
                    </div>

                    <div className="bg-blue-50 rounded-lg p-4">
                      <h5 className="font-semibold mb-2">2. Branding Customization (Moderate)</h5>
                      <ul className="text-sm space-y-1 text-gray-700">
                        <li>â€¢ Edit layout file to change company name</li>
                        <li>â€¢ Change colors in the CSS variables</li>
                        <li>â€¢ Upload client's logo</li>
                        <li>â€¢ Modify header/footer text</li>
                      </ul>
                    </div>

                    <div className="bg-yellow-50 rounded-lg p-4">
                      <h5 className="font-semibold mb-2">3. Custom Components (Advanced)</h5>
                      <ul className="text-sm space-y-1 text-gray-700">
                        <li>â€¢ Client needs a special report? Create it in THEIR app instance</li>
                        <li>â€¢ Need custom invoice template? Modify in THEIR app</li>
                        <li>â€¢ Special workflow required? Build it in THEIR app</li>
                        <li>â€¢ These changes stay in that client's instance only</li>
                      </ul>
                    </div>

                    <div className="bg-green-50 rounded-lg p-4">
                      <h5 className="font-semibold mb-2">4. Data Structure Customization (Advanced)</h5>
                      <ul className="text-sm space-y-1 text-gray-700">
                        <li>â€¢ Need extra fields on invoices? Add to THEIR Invoice entity</li>
                        <li>â€¢ Custom approval workflow? Add status fields in THEIR app</li>
                        <li>â€¢ Special product attributes? Extend Product entity in THEIR app</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-yellow-50 border-yellow-200">
                <CardContent className="pt-6">
                  <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-600" />
                    Domain & URL Structure Explained
                  </h4>
                  <div className="space-y-4 text-sm">
                    <div>
                      <p className="font-semibold mb-2">Your Question: "Won't customizations affect my domain?"</p>
                      <p className="text-gray-700 mb-3"><strong>Answer: No!</strong> Here's why:</p>
                    </div>

                    <div className="bg-white rounded-lg p-4 space-y-3">
                      <div>
                        <p className="font-semibold text-blue-600">Scenario 1: Master Template</p>
                        <code className="bg-gray-100 px-2 py-1 rounded block mt-1">edgecloudenterprise.com</code>
                        <p className="text-xs text-gray-600 mt-1">This remains your clean template. Never deployed to clients.</p>
                      </div>

                      <div>
                        <p className="font-semibold text-green-600">Scenario 2: Client A (Standard Deployment)</p>
                        <code className="bg-gray-100 px-2 py-1 rounded block mt-1">client-a-erp.yourdomain.com</code>
                        <p className="text-xs text-gray-600 mt-1">Clone of your template. You add custom "Project Tracking" module here.</p>
                      </div>

                      <div>
                        <p className="font-semibold text-purple-600">Scenario 3: Client B (Standard Deployment)</p>
                        <code className="bg-gray-100 px-2 py-1 rounded block mt-1">client-b-erp.yourdomain.com</code>
                        <p className="text-xs text-gray-600 mt-1">Clone of your template. You add custom "Fleet Management" module here.</p>
                      </div>

                      <div>
                        <p className="font-semibold text-orange-600">Scenario 4: Client C (Custom Domain)</p>
                        <code className="bg-gray-100 px-2 py-1 rounded block mt-1">erp.clientc.com</code>
                        <p className="text-xs text-gray-600 mt-1">Clone of your template, but uses client's custom domain (configured in Supabase settings).</p>
                      </div>
                    </div>

                    <Alert className="bg-green-50 border-green-200">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-900">
                        <strong>Key Point:</strong> Each client gets a completely separate app instance with its own URL. 
                        Customizing Client A's app does NOT affect Client B's app or your master template at edgecloudenterprise.com.
                      </AlertDescription>
                    </Alert>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-blue-300">
                <CardContent className="pt-6">
                  <h4 className="font-semibold text-lg mb-4">Best Practices for Managing Multiple Clients</h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex gap-3">
                      <div className="w-6 h-6 bg-blue-600 text-white rounded flex items-center justify-center flex-shrink-0 text-xs font-bold">1</div>
                      <div>
                        <p className="font-semibold">Keep Master Template Clean</p>
                        <p className="text-gray-600">Only add features to master template if they're useful for ALL or MOST clients</p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="w-6 h-6 bg-blue-600 text-white rounded flex items-center justify-center flex-shrink-0 text-xs font-bold">2</div>
                      <div>
                        <p className="font-semibold">Document Custom Features</p>
                        <p className="text-gray-600">Keep notes on which client has which customizations for support purposes</p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="w-6 h-6 bg-blue-600 text-white rounded flex items-center justify-center flex-shrink-0 text-xs font-bold">3</div>
                      <div>
                        <p className="font-semibold">Test in Master Template First</p>
                        <p className="text-gray-600">Before updating client apps, test new features in your master template</p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="w-6 h-6 bg-blue-600 text-white rounded flex items-center justify-center flex-shrink-0 text-xs font-bold">4</div>
                      <div>
                        <p className="font-semibold">Selective Updates</p>
                        <p className="text-gray-600">You don't have to update all client instances when you improve master template. Update only when needed.</p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="w-6 h-6 bg-blue-600 text-white rounded flex items-center justify-center flex-shrink-0 text-xs font-bold">5</div>
                      <div>
                        <p className="font-semibold">Charge for Custom Development</p>
                        <p className="text-gray-600">Custom features = premium pricing. Build into your service packages.</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
        <CardContent className="pt-6">
          <h3 className="text-2xl font-bold text-center mb-6">ðŸŽ¯ Quick Reference</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Copy className="w-4 h-4 text-blue-600" />
                Cloning
              </h4>
              <p className="text-xs text-gray-600">Supabase Dashboard â†’ Apps â†’ Your Master App â†’ Actions â†’ Clone</p>
            </div>

            <div className="bg-white rounded-lg p-4">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Key className="w-4 h-4 text-green-600" />
                Licensing
              </h4>
              <p className="text-xs text-gray-600">Settings â†’ License Management (for record-keeping)</p>
            </div>

            <div className="bg-white rounded-lg p-4">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Globe className="w-4 h-4 text-purple-600" />
                Customization
              </h4>
              <p className="text-xs text-gray-600">Edit client's cloned app instance directly (doesn't affect others)</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
