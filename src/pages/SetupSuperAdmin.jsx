import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, Shield, AlertCircle } from "lucide-react";

export default function SetupSuperAdmin() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  React.useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
      } catch (err) {
        setError("Failed to fetch user information");
      }
    };
    fetchUser();
  }, []);

  const handleSetupSuperAdmin = async () => {
    if (!currentUser) {
      setError("User not authenticated");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Check if user record already exists
      const existingUsers = await base44.entities.User.filter({ 
        email: currentUser.email 
      });

      if (existingUsers.length > 0) {
        // Update existing user to be super admin
        await base44.entities.User.update(existingUsers[0].id, {
          is_super_admin: true,
          full_name: currentUser.full_name || currentUser.email,
          role: 'admin'
        });
      } else {
        // Create new user record as super admin
        await base44.entities.User.create({
          email: currentUser.email,
          full_name: currentUser.full_name || currentUser.email,
          role: 'admin',
          is_super_admin: true,
          is_active: true
        });
      }

      setSuccess(true);
      
      // Redirect to home page after 2 seconds
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
      
    } catch (err) {
      console.error("Setup error:", err);
      setError(`Setup failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-6">
        <Card className="max-w-2xl w-full shadow-2xl">
          <CardContent className="p-12 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Super Admin Setup Complete!
            </h1>
            <p className="text-lg text-gray-700 mb-6">
              You now have full access to all companies and system features.
            </p>
            <p className="text-sm text-gray-600">
              Redirecting you to the dashboard...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
      <Card className="max-w-2xl w-full shadow-2xl">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <CardTitle className="flex items-center gap-3 text-2xl">
            <Shield className="w-8 h-8" />
            Super Admin Setup
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8 space-y-6">
          {error && (
            <Alert className="bg-red-50 border-red-200">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <AlertDescription className="text-red-900">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Welcome to Edge Cloud ERP!
            </h2>
            
            {currentUser ? (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                <p className="text-sm text-gray-700 mb-2">
                  <strong>Logged in as:</strong> {currentUser.email}
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Name:</strong> {currentUser.full_name || 'Not set'}
                </p>
              </div>
            ) : (
              <div className="animate-pulse bg-gray-100 rounded-lg p-4">
                <p className="text-sm text-gray-500">Loading user information...</p>
              </div>
            )}

            <div className="space-y-3 text-sm text-gray-700">
              <p>
                Click the button below to set yourself as a <strong>Super Administrator</strong>.
              </p>
              <p>
                As a Super Admin, you will be able to:
              </p>
              <ul className="space-y-2 ml-6">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                  <span>Access all companies in the system</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                  <span>Create and manage companies</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                  <span>Manage users and permissions</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                  <span>Configure system settings</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                  <span>Access all modules and features</span>
                </li>
              </ul>
            </div>

            <Alert className="bg-yellow-50 border-yellow-200">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-900 text-sm">
                <strong>Note:</strong> This action should only be performed once during initial setup. 
                Only trusted administrators should have super admin access.
              </AlertDescription>
            </Alert>
          </div>

          <div className="pt-6 border-t">
            <Button
              onClick={handleSetupSuperAdmin}
              disabled={loading || !currentUser}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-6 text-lg"
            >
              {loading ? (
                <>
                  <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  Setting up...
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5 mr-2" />
                  Setup Super Admin Access
                </>
              )}
            </Button>
          </div>

          <div className="text-center text-sm text-gray-600">
            <p>
              After setup, you'll be redirected to create your first company.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}