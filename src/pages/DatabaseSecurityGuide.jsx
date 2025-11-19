
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Lock, Key, Database, AlertTriangle, CheckCircle } from "lucide-react";

export default function DatabaseSecurityGuide() {
  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Database Security & Journal Entry Editing Logic</h1>
        <p className="text-gray-600">Understanding how transaction edits affect journal entries and account balances</p>
      </div>

      {/* CRITICAL: Journal Entry Edit Logic */}
      <Card className="border-2 border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-900">
            <AlertTriangle className="w-6 h-6" />
            CRITICAL: How Transaction Edits Work
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-gray-800">
          <Alert className="bg-white border-orange-300">
            <AlertDescription>
              <strong className="text-orange-900">⚠️ IMPORTANT ACCOUNTING PRINCIPLE:</strong>
              <br/>
              When you edit a transaction and change a GL account, the system does NOT duplicate entries.
              Instead, it reverses the old posting and creates a new posting to the correct account.
            </AlertDescription>
          </Alert>

          <div className="space-y-6 mt-6">
            <div className="bg-white p-6 rounded-lg border-2 border-orange-200">
              <h3 className="font-bold text-lg mb-4 text-orange-900">Example 1: Correcting A/P Account on Bill</h3>
              
              <div className="space-y-4">
                <div className="bg-red-50 p-4 rounded border-l-4 border-red-500">
                  <p className="font-semibold text-red-900">❌ INITIAL WRONG POSTING:</p>
                  <p className="text-sm text-gray-700 mt-2">Bill for ₦50,000</p>
                  <div className="mt-2 font-mono text-sm">
                    <p>DR Salaries & Wages ₦50,000</p>
                    <p>CR Sales Tax Payable ₦50,000 (WRONG ACCOUNT!)</p>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded border-l-4 border-blue-500">
                  <p className="font-semibold text-blue-900">🔧 EDIT ACTION:</p>
                  <p className="text-sm text-gray-700 mt-2">User opens bill and changes CR leg from "Sales Tax Payable" to "Accounts Payable"</p>
                </div>

                <div className="bg-green-50 p-4 rounded border-l-4 border-green-500">
                  <p className="font-semibold text-green-900">✅ SYSTEM AUTOMATIC JOURNAL ENTRIES:</p>
                  <div className="mt-2 space-y-2">
                    <div>
                      <p className="text-xs text-gray-600">Step 1: Reverse old wrong posting</p>
                      <div className="font-mono text-sm">
                        <p>DR Sales Tax Payable ₦50,000 (reverses the credit)</p>
                        <p>CR Salaries & Wages ₦50,000 (reverses the debit)</p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <p className="text-xs text-gray-600">Step 2: Post new correct entry</p>
                      <div className="font-mono text-sm">
                        <p>DR Salaries & Wages ₦50,000</p>
                        <p>CR Accounts Payable ₦50,000 (CORRECT ACCOUNT)</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 p-4 rounded border-l-4 border-purple-500">
                  <p className="font-semibold text-purple-900">📊 NET RESULT IN ACCOUNTS:</p>
                  <div className="mt-2 font-mono text-sm space-y-1">
                    <p>• Salaries & Wages: ₦50,000 DR (unchanged, posted twice: -50k +50k = 50k)</p>
                    <p>• Sales Tax Payable: ₦0 (reversed: +50k -50k = 0)</p>
                    <p>• Accounts Payable: ₦50,000 CR (new posting)</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border-2 border-orange-200">
              <h3 className="font-bold text-lg mb-4 text-orange-900">Example 2: Correcting Expense Account on Payment</h3>
              
              <div className="space-y-4">
                <div className="bg-red-50 p-4 rounded border-l-4 border-red-500">
                  <p className="font-semibold text-red-900">❌ INITIAL WRONG POSTING:</p>
                  <p className="text-sm text-gray-700 mt-2">Payment for Rent ₦5,000 posted to wrong account</p>
                  <div className="mt-2 font-mono text-sm">
                    <p>DR Electricity ₦5,000 (WRONG ACCOUNT!)</p>
                    <p>CR Cash/Bank ₦5,000</p>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded border-l-4 border-blue-500">
                  <p className="font-semibold text-blue-900">🔧 EDIT ACTION:</p>
                  <p className="text-sm text-gray-700 mt-2">User opens payment and changes DR leg from "Electricity" to "Rent"</p>
                  <p className="text-xs text-gray-600 mt-1">(Cash/Bank leg remains unchanged)</p>
                </div>

                <div className="bg-green-50 p-4 rounded border-l-4 border-green-500">
                  <p className="font-semibold text-green-900">✅ SYSTEM AUTOMATIC JOURNAL ENTRIES:</p>
                  <div className="mt-2 space-y-2">
                    <div>
                      <p className="text-xs text-gray-600">Step 1: Reverse old wrong posting</p>
                      <div className="font-mono text-sm">
                        <p>DR Cash/Bank ₦5,000 (reverses the credit)</p>
                        <p>CR Electricity ₦5,000 (reverses the debit)</p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <p className="text-xs text-gray-600">Step 2: Post new correct entry</p>
                      <div className="font-mono text-sm">
                        <p>DR Rent ₦5,000 (CORRECT ACCOUNT)</p>
                        <p>CR Cash/Bank ₦5,000</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 p-4 rounded border-l-4 border-purple-500">
                  <p className="font-semibold text-purple-900">📊 NET RESULT IN ACCOUNTS:</p>
                  <div className="mt-2 font-mono text-sm space-y-1">
                    <p>• Electricity: ₦0 (reversed: +5k -5k = 0)</p>
                    <p>• Rent: ₦5,000 DR (new posting)</p>
                    <p>• Cash/Bank: ₦5,000 CR (unchanged, posted twice: +5k -5k = -5k)</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Principles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Key Principles of Transaction Editing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="text-green-600 font-bold text-lg">1.</div>
              <div>
                <p className="font-semibold">No Duplicate Entries</p>
                <p className="text-sm text-gray-600">The system never creates duplicate debits or credits. It reverses the old entry and posts the new one.</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="text-green-600 font-bold text-lg">2.</div>
              <div>
                <p className="font-semibold">Only Changed Legs Are Affected</p>
                <p className="text-sm text-gray-600">If you only change the DR leg, the CR leg remains untouched. Only the changed account gets reversed and reposted.</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="text-green-600 font-bold text-lg">3.</div>
              <div>
                <p className="font-semibold">Full Reversal Before New Posting</p>
                <p className="text-sm text-gray-600">The entire old journal entry is reversed (all legs) before posting the new correct entry.</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="text-green-600 font-bold text-lg">4.</div>
              <div>
                <p className="font-semibold">Net Balance Is What Matters</p>
                <p className="text-sm text-gray-600">In the ledger, you'll see both the original and reversal entries, but the net balance is correct.</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="text-green-600 font-bold text-lg">5.</div>
              <div>
                <p className="font-semibold">Audit Trail Preserved</p>
                <p className="text-sm text-gray-600">All entries remain visible in the journal, providing a complete audit trail of corrections.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Implementation Status */}
      <Card className="border-2 border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-900">
            <CheckCircle className="w-5 h-5" />
            Current Implementation Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-semibold">✅ Bills - IMPLEMENTED</p>
                <p className="text-sm text-gray-700">Bill edits correctly reverse old entries and post new ones</p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-semibold">✅ Invoices - IMPLEMENTED</p>
                <p className="text-sm text-gray-700">Invoice edits correctly reverse old entries and post new ones</p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-semibold">✅ Payments - IMPLEMENTED</p>
                <p className="text-sm text-gray-700">Payment edits reverse old postings and create new correct entries</p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-semibold">✅ Inventory Receipts - IMPLEMENTED</p>
                <p className="text-sm text-gray-700">Inventory receipt edits reverse quantities and GL entries, then post new ones</p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-semibold">✅ Manual Journal Entries - IMPLEMENTED</p>
                <p className="text-sm text-gray-700">Manual JE edits reverse all account balances and repost with new amounts</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Testing Checklist */}
      <Card>
        <CardHeader>
          <CardTitle>Testing Checklist</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <p className="font-semibold mb-3">To verify the edit logic is working correctly:</p>
            
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="w-4 h-4" />
                <span className="text-sm">Create a bill with wrong A/P account</span>
              </label>
              
              <label className="flex items-center gap-2">
                <input type="checkbox" className="w-4 h-4" />
                <span className="text-sm">Check wrong account balance (should show the amount)</span>
              </label>
              
              <label className="flex items-center gap-2">
                <input type="checkbox" className="w-4 h-4" />
                <span className="text-sm">Edit bill and change to correct A/P account</span>
              </label>
              
              <label className="flex items-center gap-2">
                <input type="checkbox" className="w-4 h-4" />
                <span className="text-sm">Check wrong account balance (should be ₦0)</span>
              </label>
              
              <label className="flex items-center gap-2">
                <input type="checkbox" className="w-4 h-4" />
                <span className="text-sm">Check correct account balance (should show the amount)</span>
              </label>
              
              <label className="flex items-center gap-2">
                <input type="checkbox" className="w-4 h-4" />
                <span className="text-sm">Check expense account (should remain unchanged)</span>
              </label>
              
              <label className="flex items-center gap-2">
                <input type="checkbox" className="w-4 h-4" />
                <span className="text-sm">View Journal Entries (should see reversal and new entry)</span>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
