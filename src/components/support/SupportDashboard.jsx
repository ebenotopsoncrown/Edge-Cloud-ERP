import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Shield,
  AlertCircle,
  CheckCircle,
  Database,
  Users,
  FileText,
  Bug,
  HelpCircle
} from "lucide-react";

export default function SupportDashboard() {
  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Technical Support & Bug Management</h1>
        <p className="text-gray-500 mt-1">Understanding how support works without affecting client data</p>
      </div>

      <Alert className="bg-blue-50 border-blue-200">
        <Shield className="h-5 w-5 text-blue-600" />
        <AlertDescription className="text-blue-900">
          <strong>Zero-Downtime Support:</strong> All support activities are designed to never affect client 
          data, cause downtime, or interrupt business operations.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="support-model" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="support-model">Support Model</TabsTrigger>
          <TabsTrigger value="debugging">Debugging Process</TabsTrigger>
          <TabsTrigger value="data-safety">Data Safety</TabsTrigger>
          <TabsTrigger value="bug-reporting">Bug Reporting</TabsTrigger>
        </TabsList>

        {/* SUPPORT MODEL TAB */}
        <TabsContent value="support-model" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5" />
                How Support Works in Edge Cloud Enterprise
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      Read-Only Support Access
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <p><strong>What:</strong> Support team can VIEW client data to diagnose issues</p>
                    <p><strong>Safety:</strong> Cannot modify, delete, or change any client data</p>
                    <p><strong>Audit:</strong> All support access is logged with timestamp and user</p>
                    <div className="bg-white rounded p-3 mt-3">
                      <p className="text-xs font-mono text-gray-700">
                        Support can see: Reports, Transactions, Settings<br/>
                        Support CANNOT: Edit, Delete, Modify anything
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Database className="w-5 h-5 text-blue-600" />
                      Isolated Testing Environment
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <p><strong>What:</strong> Copy of client data in separate test environment</p>
                    <p><strong>Safety:</strong> Tests run on copy, not live production data</p>
                    <p><strong>Process:</strong> Fix bugs in test, then deploy to production</p>
                    <div className="bg-white rounded p-3 mt-3">
                      <p className="text-xs font-mono text-gray-700">
                        1. Create data snapshot<br/>
                        2. Test fix in isolation<br/>
                        3. Deploy to production<br/>
                        4. Zero client impact
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="w-5 h-5 text-purple-600" />
                      Comprehensive Audit Logs
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <p><strong>What:</strong> Every action tracked - who, what, when</p>
                    <p><strong>Purpose:</strong> Full transparency and accountability</p>
                    <p><strong>Access:</strong> Clients can view all support activity</p>
                    <div className="bg-white rounded p-3 mt-3">
                      <p className="text-xs text-gray-700">
                        Logged: User access, data viewed, changes made, fixes deployed, time spent
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Bug className="w-5 h-5 text-orange-600" />
                      Automated Bug Detection
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <p><strong>What:</strong> System monitors for errors automatically</p>
                    <p><strong>Proactive:</strong> Bugs detected before clients report them</p>
                    <p><strong>Alerts:</strong> Support team notified immediately</p>
                    <div className="bg-white rounded p-3 mt-3">
                      <p className="text-xs text-gray-700">
                        Examples: Report calculation errors, missing transactions, data sync issues
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Support Response Times</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                  <h4 className="font-bold text-red-900 mb-2">Critical Issues</h4>
                  <p className="text-3xl font-bold text-red-600 mb-2">30 min</p>
                  <p className="text-sm text-red-700">System down, data loss, critical bugs</p>
                </div>
                <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4">
                  <h4 className="font-bold text-orange-900 mb-2">High Priority</h4>
                  <p className="text-3xl font-bold text-orange-600 mb-2">4 hours</p>
                  <p className="text-sm text-orange-700">Report errors, incorrect calculations</p>
                </div>
                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                  <h4 className="font-bold text-green-900 mb-2">Normal Issues</h4>
                  <p className="text-3xl font-bold text-green-600 mb-2">24 hours</p>
                  <p className="text-sm text-green-700">Feature requests, minor bugs</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* DEBUGGING PROCESS TAB */}
        <TabsContent value="debugging" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Step-by-Step Debugging Process</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    step: 1,
                    title: "Issue Reported",
                    description: "Client reports bug via support portal, email, or phone",
                    color: "blue",
                    actions: ["Ticket created automatically", "Priority assigned", "Support team notified"]
                  },
                  {
                    step: 2,
                    title: "Read-Only Investigation",
                    description: "Support team views (but cannot modify) client data",
                    color: "purple",
                    actions: ["Review relevant reports", "Check transaction history", "Identify issue scope"]
                  },
                  {
                    step: 3,
                    title: "Data Snapshot Created",
                    description: "Copy of client data moved to isolated test environment",
                    color: "indigo",
                    actions: ["Full data backup", "Test environment setup", "No impact on production"]
                  },
                  {
                    step: 4,
                    title: "Bug Reproduced & Fixed",
                    description: "Issue recreated in test environment and resolved",
                    color: "green",
                    actions: ["Test the fix thoroughly", "Verify calculations", "Check side effects"]
                  },
                  {
                    step: 5,
                    title: "Quality Assurance Testing",
                    description: "Independent QA team verifies the fix",
                    color: "yellow",
                    actions: ["Multiple test scenarios", "Edge case testing", "Performance check"]
                  },
                  {
                    step: 6,
                    title: "Deploy to Production",
                    description: "Fix rolled out to live system with zero downtime",
                    color: "green",
                    actions: ["Automated deployment", "Real-time monitoring", "Rollback ready if needed"]
                  },
                  {
                    step: 7,
                    title: "Client Verification",
                    description: "Client confirms issue is resolved",
                    color: "teal",
                    actions: ["Client notified", "Testing on their end", "Ticket closed"]
                  }
                ].map((item) => (
                  <div key={item.step} className="flex gap-4">
                    <div className={`flex-shrink-0 w-12 h-12 bg-${item.color}-600 text-white rounded-full flex items-center justify-center font-bold text-lg`}>
                      {item.step}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-lg text-gray-900">{item.title}</h4>
                      <p className="text-gray-700 mt-1">{item.description}</p>
                      <ul className="mt-2 space-y-1">
                        {item.actions.map((action, idx) => (
                          <li key={idx} className="text-sm text-gray-600 flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            {action}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* DATA SAFETY TAB */}
        <TabsContent value="data-safety" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Data Protection Measures
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <AlertDescription className="text-green-900">
                  <strong>100% Data Safety Guarantee:</strong> Your client data is NEVER modified, deleted, 
                  or tampered with during support activities.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-blue-50 border-blue-200">
                  <CardHeader>
                    <CardTitle className="text-lg">Automatic Backups</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                      <p><strong>Hourly:</strong> Incremental backups every hour</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                      <p><strong>Daily:</strong> Full database backup every 24 hours</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                      <p><strong>Weekly:</strong> Long-term archive backup</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                      <p><strong>Retention:</strong> 90 days of backup history</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-purple-50 border-purple-200">
                  <CardHeader>
                    <CardTitle className="text-lg">Role-Based Access Control</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex items-start gap-2">
                      <Users className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                      <p><strong>Support (Read-Only):</strong> View data, generate reports</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <Users className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                      <p><strong>Developers:</strong> Test environment only</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <Users className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                      <p><strong>QA Team:</strong> Test environment verification</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <Users className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                      <p><strong>Client:</strong> Full access to their own data</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-green-50 border-green-200">
                  <CardHeader>
                    <CardTitle className="text-lg">Data Isolation</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex items-start gap-2">
                      <Database className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <p><strong>Company-Level:</strong> Each company's data is completely isolated</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <Database className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <p><strong>No Cross-Contamination:</strong> Impossible to access other company data</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <Database className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <p><strong>Test vs Production:</strong> Separate databases ensure safety</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-orange-50 border-orange-200">
                  <CardHeader>
                    <CardTitle className="text-lg">Change Management</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex items-start gap-2">
                      <FileText className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
                      <p><strong>Version Control:</strong> All code changes tracked in Git</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <FileText className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
                      <p><strong>Code Review:</strong> Every fix reviewed by senior developer</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <FileText className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
                      <p><strong>Rollback Ready:</strong> Can instantly revert if issues occur</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* BUG REPORTING TAB */}
        <TabsContent value="bug-reporting" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>How Clients Report Bugs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-blue-50 border-2 border-blue-200">
                  <CardHeader>
                    <CardTitle className="text-lg">📧 Email Support</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-2">
                    <p className="font-semibold">support@edgecloudenterprise.com</p>
                    <p className="text-gray-700">Email us with issue description, screenshots, and steps to reproduce</p>
                    <Badge className="bg-blue-600">Response: 4-24 hours</Badge>
                  </CardContent>
                </Card>

                <Card className="bg-green-50 border-2 border-green-200">
                  <CardHeader>
                    <CardTitle className="text-lg">💬 Live Chat</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-2">
                    <p className="font-semibold">In-App Chat Support</p>
                    <p className="text-gray-700">Click the help icon to chat with support team in real-time</p>
                    <Badge className="bg-green-600">Response: Instant</Badge>
                  </CardContent>
                </Card>

                <Card className="bg-orange-50 border-2 border-orange-200">
                  <CardHeader>
                    <CardTitle className="text-lg">📞 Phone Support</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-2">
                    <p className="font-semibold">+1 (555) 123-4567</p>
                    <p className="text-gray-700">Call for critical issues requiring immediate attention</p>
                    <Badge className="bg-orange-600">Response: Immediate</Badge>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-yellow-50 border-yellow-200">
                <CardHeader>
                  <CardTitle className="text-lg">What Information to Include in Bug Reports</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span><strong>Description:</strong> What you were trying to do</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span><strong>Expected Result:</strong> What should have happened</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span><strong>Actual Result:</strong> What actually happened (the bug)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span><strong>Steps to Reproduce:</strong> How to make the bug happen again</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span><strong>Screenshots:</strong> Visual evidence of the issue</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span><strong>Browser/Device:</strong> What device and browser you're using</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span><strong>Date/Time:</strong> When the issue occurred</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}