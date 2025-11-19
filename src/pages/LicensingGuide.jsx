
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import {
  BookOpen,
  Key,
  Users,
  Settings,
  CheckCircle,
  AlertTriangle,
  FileText,
  Rocket,
  Database,
  Cloud,
  Building2
} from "lucide-react";

export default function LicensingGuide() {
  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900">Edge Cloud Enterprise</h1>
        <h2 className="text-2xl font-semibold text-blue-600">Complete Deployment & Multi-Tenancy Guide</h2>
        <p className="text-gray-600">Everything you need to know about deploying for multiple clients</p>
      </div>

      <Tabs defaultValue="architecture" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="architecture">Architecture</TabsTrigger>
          <TabsTrigger value="multi-user">Multi-User</TabsTrigger>
          <TabsTrigger value="multi-company">Multi-Company</TabsTrigger>
          <TabsTrigger value="licensing">Licensing</TabsTrigger>
          <TabsTrigger value="customization">Customization</TabsTrigger>
          <TabsTrigger value="deployment">Deployment</TabsTrigger>
        </TabsList>

        {/* ARCHITECTURE TAB */}
        <TabsContent value="architecture" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cloud className="w-5 h-5" />
                How Edge Cloud Enterprise Works
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="prose max-w-none">
                <h3 className="text-xl font-semibold">Platform Architecture</h3>
                <p className="text-gray-700">
                  Edge Cloud Enterprise is built on the <strong>base44 platform</strong>, which provides:
                </p>
                <ul className="space-y-2 text-gray-700">
                  <li><strong>Cloud Infrastructure:</strong> Hosted on secure cloud servers</li>
                  <li><strong>Automatic Scaling:</strong> Handles multiple users and companies</li>
                  <li><strong>Built-in Authentication:</strong> User management and security</li>
                  <li><strong>Database per App Instance:</strong> Complete data isolation</li>
                  <li><strong>API-First Design:</strong> Easy integrations and customizations</li>
                </ul>

                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mt-6">
                  <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <Database className="w-5 h-5 text-blue-600" />
                    Data Isolation Model
                  </h4>
                  <p className="text-sm text-gray-700 mb-4">
                    Each deployment of Edge Cloud Enterprise gets its own <strong>isolated database</strong>.
                    This means:
                  </p>
                  <ul className="text-sm space-y-2 text-gray-700">
                    <li>✓ Complete data separation between clients</li>
                    <li>✓ No risk of data leakage between companies</li>
                    <li>✓ Each client can have custom modules enabled/disabled</li>
                    <li>✓ Independent backups and security</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* MULTI-USER TAB */}
        <TabsContent value="multi-user" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Multi-User Access Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-6">
                <div className="border-l-4 border-blue-500 pl-4 py-2 bg-blue-50 rounded">
                  <h3 className="font-semibold text-lg mb-2">How Multi-User Access Works</h3>
                  <p className="text-gray-700 mb-3">
                    Edge Cloud Enterprise uses the base44 platform's built-in user management system:
                  </p>
                  <ol className="list-decimal list-inside space-y-2 text-gray-700">
                    <li><strong>Admin Users:</strong> Full access to all modules, settings, and data</li>
                    <li><strong>Regular Users:</strong> Limited access based on their assigned permissions</li>
                    <li><strong>Role-Based Access:</strong> Control what each user can see and do</li>
                  </ol>
                </div>

                <Card className="bg-green-50 border-green-200">
                  <CardContent className="pt-6">
                    <h4 className="font-semibold text-lg mb-3">Adding Users to Your App (Step-by-Step)</h4>
                    <ol className="space-y-3 text-gray-700">
                      <li>
                        <strong>Step 1: Access User Management</strong>
                        <ul className="list-disc list-inside ml-4 mt-1 text-sm">
                          <li>Click on the base44 menu (top right)</li>
                          <li>Select "Dashboard" → "Users"</li>
                        </ul>
                      </li>
                      <li>
                        <strong>Step 2: Invite New User</strong>
                        <ul className="list-disc list-inside ml-4 mt-1 text-sm">
                          <li>Click "Invite User" button</li>
                          <li>Enter user's email address</li>
                          <li>Select role: Admin or User</li>
                          <li>Send invitation</li>
                        </ul>
                      </li>
                      <li>
                        <strong>Step 3: User Receives Invitation</strong>
                        <ul className="list-disc list-inside ml-4 mt-1 text-sm">
                          <li>User gets email with invitation link</li>
                          <li>User creates password and logs in</li>
                          <li>User immediately has access to the system</li>
                        </ul>
                      </li>
                    </ol>
                  </CardContent>
                </Card>

                <Card className="bg-purple-50 border-purple-200">
                  <CardContent className="pt-6">
                    <h4 className="font-semibold text-lg mb-3">User Roles & Permissions</h4>
                    <div className="space-y-4">
                      <div>
                        <h5 className="font-semibold text-purple-900 mb-2">Admin Users Can:</h5>
                        <ul className="text-sm space-y-1 text-gray-700">
                          <li>✓ Access all modules and features</li>
                          <li>✓ View, create, edit, and delete all records</li>
                          <li>✓ Invite and manage other users</li>
                          <li>✓ Configure system settings and preferences</li>
                          <li>✓ Generate licenses for clients</li>
                          <li>✓ Access financial reports and dashboards</li>
                        </ul>
                      </div>
                      <div>
                        <h5 className="font-semibold text-purple-900 mb-2">Regular Users Can:</h5>
                        <ul className="text-sm space-y-1 text-gray-700">
                          <li>✓ Access modules based on their assignment</li>
                          <li>✓ View and create records in their assigned areas</li>
                          <li>✓ Update their own profile information</li>
                          <li>✓ Generate reports they have permission for</li>
                          <li>✗ Cannot access system settings</li>
                          <li>✗ Cannot manage other users</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-yellow-50 border-yellow-200">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-1" />
                      <div>
                        <h4 className="font-semibold text-yellow-900 mb-2">Important: User Limits</h4>
                        <p className="text-sm text-yellow-800 mb-2">
                          Each deployment can have <strong>unlimited users</strong> by default on the base44 platform.
                          However, if you're implementing licensing for clients, you can set user limits per license type.
                        </p>
                        <p className="text-sm text-yellow-800">
                          Example: Trial license = 3 users, Professional = 10 users, Enterprise = Unlimited
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* MULTI-COMPANY TAB */}
        <TabsContent value="multi-company" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Multi-Company Setup & Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-6">
                <div className="border-l-4 border-green-500 pl-4 py-2 bg-green-50 rounded">
                  <h3 className="font-semibold text-lg mb-2">How to Handle Multiple Companies</h3>
                  <p className="text-gray-700 mb-3">
                    Edge Cloud Enterprise supports <strong>two deployment models</strong> for multiple companies:
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="border-2 border-blue-300 bg-blue-50">
                    <CardContent className="pt-6">
                      <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                        <Database className="w-5 h-5 text-blue-600" />
                        Option 1: Separate App Instance Per Company
                      </h4>
                      <p className="text-sm text-gray-700 mb-3">
                        <strong>Recommended Approach</strong>
                      </p>
                      <div className="space-y-3">
                        <div>
                          <p className="font-semibold text-sm">How It Works:</p>
                          <ul className="text-sm space-y-1 text-gray-700 mt-1">
                            <li>• Create separate app instance for each client</li>
                            <li>• Each company gets its own database</li>
                            <li>• Complete data isolation</li>
                            <li>• Custom URL per client</li>
                          </ul>
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-green-700">Advantages:</p>
                          <ul className="text-sm space-y-1 text-gray-700">
                            <li>✓ Maximum security and isolation</li>
                            <li>✓ Custom branding per client</li>
                            <li>✓ Independent backups</li>
                            <li>✓ Different modules per client</li>
                            <li>✓ Client-specific customizations</li>
                          </ul>
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-red-700">Disadvantages:</p>
                          <ul className="text-sm space-y-1 text-gray-700">
                            <li>✗ More app instances to manage</li>
                            <li>✗ Updates need to be applied to each</li>
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-2 border-purple-300 bg-purple-50">
                    <CardContent className="pt-6">
                      <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                        <Cloud className="w-5 h-5 text-purple-600" />
                        Option 2: Single Instance, Multiple Companies
                      </h4>
                      <p className="text-sm text-gray-700 mb-3">
                        <strong>Multi-Tenant in One Database</strong>
                      </p>
                      <div className="space-y-3">
                        <div>
                          <p className="font-semibold text-sm">How It Works:</p>
                          <ul className="text-sm space-y-1 text-gray-700 mt-1">
                            <li>• All companies in one app instance</li>
                            <li>• Add "company_id" field to all entities</li>
                            <li>• Filter data by company_id</li>
                            <li>• Users select company on login</li>
                          </ul>
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-green-700">Advantages:</p>
                          <ul className="text-sm space-y-1 text-gray-700">
                            <li>✓ Single app to manage</li>
                            <li>✓ Easier updates</li>
                            <li>✓ Lower hosting costs</li>
                            <li>✓ Cross-company reporting possible</li>
                          </ul>
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-red-700">Disadvantages:</p>
                          <ul className="text-sm space-y-1 text-gray-700">
                            <li>✗ Requires custom development</li>
                            <li>✗ Less data isolation</li>
                            <li>✗ Same modules for all companies</li>
                            <li>✗ Risk of data leakage if not coded correctly</li>
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="bg-blue-100 border-2 border-blue-300">
                  <CardContent className="pt-6">
                    <h4 className="font-semibold text-lg mb-3">🎯 Recommended Deployment Strategy</h4>
                    <p className="text-gray-800 mb-4">
                      <strong>For Most Use Cases:</strong> Use <strong>Option 1 (Separate Instances)</strong>
                    </p>
                    <div className="bg-white rounded-lg p-4 space-y-3">
                      <div>
                        <p className="font-semibold text-blue-900 mb-2">Step-by-Step Process:</p>
                        <ol className="list-decimal list-inside space-y-2 text-gray-700">
                          <li>
                            <strong>Clone this app for each new client</strong>
                            <ul className="list-disc list-inside ml-6 mt-1 text-sm">
                              <li>Go to base44 dashboard</li>
                              <li>Click "Clone App" or create new app from this template</li>
                              <li>Name it: "[Client Name] - ERP"</li>
                            </ul>
                          </li>
                          <li>
                            <strong>Configure for the client</strong>
                            <ul className="list-disc list-inside ml-6 mt-1 text-sm">
                              <li>Update company branding in layout</li>
                              <li>Enable/disable modules in Settings</li>
                              <li>Set up Chart of Accounts</li>
                              <li>Import opening balances</li>
                            </ul>
                          </li>
                          <li>
                            <strong>Invite client users</strong>
                            <ul className="list-disc list-inside ml-6 mt-1 text-sm">
                              <li>Invite admin user(s)</li>
                              <li>Invite regular users as needed</li>
                              <li>Assign proper roles</li>
                            </ul>
                          </li>
                          <li>
                            <strong>Provide access</strong>
                            <ul className="list-disc list-inside ml-6 mt-1 text-sm">
                              <li>Give client the app URL</li>
                              <li>Provide login credentials</li>
                              <li>Conduct training session</li>
                            </ul>
                          </li>
                        </ol>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-yellow-50 border-yellow-200">
                  <CardContent className="pt-6">
                    <h4 className="font-semibold text-lg mb-3">Company File Concept</h4>
                    <p className="text-gray-700 mb-3">
                      If you're familiar with QuickBooks' "company file" concept, here's how it maps to Edge Cloud Enterprise:
                    </p>
                    <div className="bg-white rounded-lg p-4">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2">QuickBooks</th>
                            <th className="text-left py-2">Edge Cloud Enterprise</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b">
                            <td className="py-2">Company File (.QBW)</td>
                            <td className="py-2">Separate App Instance</td>
                          </tr>
                          <tr className="border-b">
                            <td className="py-2">Multiple Company Files</td>
                            <td className="py-2">Multiple App Instances (Clones)</td>
                          </tr>
                          <tr className="border-b">
                            <td className="py-2">Switch Between Files</td>
                            <td className="py-2">Switch Between Apps (Different URLs)</td>
                          </tr>
                          <tr>
                            <td className="py-2">User Access Per File</td>
                            <td className="py-2">User Access Per App Instance</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* LICENSING TAB */}
        <TabsContent value="licensing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5" />
                Client Licensing System
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-gray-700">See the Settings → License Management page for the complete licensing SOP and license generation process.</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CUSTOMIZATION TAB */}
        <TabsContent value="customization" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Customization Options
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-gray-700">See the Settings page for detailed customization guide.</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* DEPLOYMENT TAB */}
        <TabsContent value="deployment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Rocket className="w-5 h-5" />
                Client Deployment Process
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-gray-700">See the Settings page for complete deployment SOP.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <h3 className="text-2xl font-bold text-gray-900">Summary: How Deployment Works</h3>
            <div className="max-w-3xl mx-auto text-left space-y-3">
              <div className="bg-white rounded-lg p-4">
                <p className="font-semibold text-blue-900 mb-2">1️⃣ Multi-User Access:</p>
                <p className="text-sm text-gray-700">Built into base44 platform. Just invite users via email. They get instant access with role-based permissions.</p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <p className="font-semibold text-green-900 mb-2">2️⃣ Multiple Companies:</p>
                <p className="text-sm text-gray-700">Clone this app for each client. Each gets isolated database, custom branding, and independent configuration.</p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <p className="font-semibold text-purple-900 mb-2">3️⃣ Client Deployment:</p>
                <p className="text-sm text-gray-700">Clone → Configure → Invite Users → Train → Go Live. Takes 2-4 weeks depending on complexity.</p>
              </div>
            </div>
            <div className="flex justify-center gap-4 pt-4">
              <Badge className="bg-blue-600 text-white px-4 py-2 text-base">
                Version 1.0
              </Badge>
              <Badge variant="outline" className="px-4 py-2 text-base">
                Last Updated: {format(new Date(), 'MMMM yyyy')}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
