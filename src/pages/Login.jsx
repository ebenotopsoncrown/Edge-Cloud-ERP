import { useState } from "react";
import { Calculator, Cloud, HardHat, Package, Users } from "lucide-react";
import { supabase } from "../api/supabaseClient";

const FEATURES = [
  { label: "Accounting & Multicurrency", icon: Calculator },
  { label: "Inventory & Manufacturing", icon: Package },
  { label: "Payroll & Fixed Assets", icon: Users },
  { label: "Job Costing & Construction", icon: HardHat },
];

const inputClass =
  "w-full bg-white border border-slate-300 text-slate-900 placeholder-slate-400 text-base rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2E7DE8] focus:border-transparent transition";

function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-gradient-to-br from-[#2E7DE8] to-[#00A86B] shrink-0">
        <Cloud className="w-6 h-6 text-white" />
      </div>
      <span className="text-xl font-bold tracking-tight text-[#1B4F8A]">Edge Cloud ERP</span>
    </div>
  );
}

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
      } else if (data.user) {
        // Reload the page — the auth guard in index.jsx will now let them through
        window.location.href = "/";
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-sky-50 lg:grid lg:grid-cols-2">
      {/* Sign-in */}
      <main className="flex items-center justify-center bg-slate-50 px-4 py-10 sm:px-6 lg:min-h-screen">
        <div className="w-full max-w-md">
          {/* The panel holding the logo sits below the card on small screens */}
          <div className="flex justify-center mb-6 lg:hidden">
            <Logo />
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8">
            <h1 className="text-2xl font-bold text-slate-900">Sign in</h1>
            <p className="text-slate-500 text-sm mt-1 mb-6">Enter your details to access your account.</p>

            <form onSubmit={handleLogin} className="space-y-5">
              {/* Error Message */}
              {error && (
                <div role="alert" className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-700 text-sm text-center">{error}</p>
                </div>
              )}

              {/* Email Field */}
              <div>
                <label htmlFor="login-email" className="block text-sm font-medium text-slate-700 mb-2">
                  Email
                </label>
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@yourcompany.com"
                  className={inputClass}
                />
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="login-password" className="block text-sm font-medium text-slate-700 mb-2">
                  Password
                </label>
                <input
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className={inputClass}
                />
                <p className="text-sm text-slate-500 text-right mt-2">Forgot password?</p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#1B4F8A] hover:bg-[#163F6E] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>
          </div>
        </div>
      </main>

      {/* Product panel */}
      <aside className="flex items-center justify-center bg-sky-50 border-t border-sky-100 px-6 py-10 sm:px-10 lg:border-t-0 lg:border-l lg:min-h-screen lg:px-16">
        <div className="w-full max-w-md">
          <div className="hidden lg:block mb-10">
            <Logo />
          </div>
          <h2 className="text-2xl lg:text-4xl font-bold leading-tight tracking-tight text-slate-900">
            Complete cloud accounting and ERP for your business
          </h2>
          <ul className="mt-8 space-y-4">
            {FEATURES.map(({ label, icon: Icon }) => (
              <li key={label} className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-lg bg-white border border-sky-100 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-[#2E7DE8]" />
                </span>
                <span className="text-slate-700 font-medium">{label}</span>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}
