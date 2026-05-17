import { useState } from "react";

export default function LandingPage({ onSignIn }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const features = [
    { icon: "📊", title: "Accounting & Finance", desc: "Full double-entry accounting, P&L, balance sheet, multi-currency, bank reconciliation" },
    { icon: "🧾", title: "Sales & Invoicing", desc: "Professional invoices, customer management, payment tracking, sales returns" },
    { icon: "🛒", title: "Purchasing", desc: "Purchase orders, vendor management, bills, inventory receipts" },
    { icon: "📦", title: "Inventory", desc: "Multi-location stock management, product tracking, inventory transactions" },
    { icon: "🏭", title: "Manufacturing", desc: "Work orders, bill of materials, production tracking" },
    { icon: "👷", title: "Job Costing", desc: "Project management, phase tracking, cost codes, budget vs actual" },
    { icon: "👥", title: "HR & Payroll", desc: "Employee management, payroll runs, PAYE calculations" },
    { icon: "🏪", title: "Point of Sale", desc: "POS terminals, sessions, sales tracking, store management" },
    { icon: "❤️", title: "Non-Profit", desc: "Donor management, grants, programs, donation tracking" },
    { icon: "🌍", title: "Multi-Currency", desc: "Real-time exchange rates, FX revaluation, global business support" },
    { icon: "🏢", title: "Multi-Company", desc: "Manage multiple entities from one account" },
    { icon: "🔒", title: "Audit Trail", desc: "Complete audit logs, record locking, version history" },
  ];

  const plans = [
    {
      name: "Starter",
      price: "£29",
      period: "/month",
      desc: "Perfect for small businesses",
      features: ["Up to 3 users", "Accounting & Sales", "Inventory", "Email support"],
      cta: "Start Free Trial",
      highlight: false,
    },
    {
      name: "Professional",
      price: "£79",
      period: "/month",
      desc: "For growing businesses",
      features: ["Up to 10 users", "All modules included", "Multi-currency", "Priority support", "Job Costing & Payroll"],
      cta: "Start Free Trial",
      highlight: true,
    },
    {
      name: "Enterprise",
      price: "£149",
      period: "/month",
      desc: "For large organisations",
      features: ["Unlimited users", "Multi-company", "API access", "Dedicated support", "Custom onboarding"],
      cta: "Contact Us",
      highlight: false,
    },
  ];

  const testimonialPlaceholders = [
    { name: "Founding Beta Partner", role: "SME Owner, Nigeria", text: "Spots available — be the first to share your experience" },
    { name: "Founding Beta Partner", role: "Non-Profit Director, UK", text: "Join our beta programme and shape the product" },
    { name: "Founding Beta Partner", role: "Manufacturing Business, Ghana", text: "5 founding partner spots — limited availability" },
  ];

  return (
    <div style={{ fontFamily: "'DM Sans', 'Segoe UI', sans-serif", color: "#1a1f36", overflowX: "hidden" }}>

      {/* NAV */}
      <nav style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid #e8eaf0", padding: "0 2rem" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, background: "linear-gradient(135deg, #1B4F8A, #2E7DE8)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 18 }}>⬡</div>
            <span style={{ fontWeight: 700, fontSize: 18, color: "#1B4F8A" }}>Edge Cloud ERP</span>
          </div>
          <div style={{ display: "flex", gap: "2rem", alignItems: "center" }}>
            <a href="#features" style={{ color: "#4a5568", textDecoration: "none", fontSize: 14, fontWeight: 500 }}>Features</a>
            <a href="#pricing" style={{ color: "#4a5568", textDecoration: "none", fontSize: 14, fontWeight: 500 }}>Pricing</a>
            <a href="#beta" style={{ color: "#4a5568", textDecoration: "none", fontSize: 14, fontWeight: 500 }}>Beta Programme</a>
            <button onClick={onSignIn} style={{ background: "none", border: "1.5px solid #1B4F8A", color: "#1B4F8A", padding: "8px 20px", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 600 }}>Sign In</button>
            <button onClick={onSignIn} style={{ background: "linear-gradient(135deg, #1B4F8A, #2E7DE8)", border: "none", color: "white", padding: "9px 22px", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 600 }}>Start Free Trial</button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ background: "linear-gradient(135deg, #0f1f3d 0%, #1B4F8A 50%, #1a3a6b 100%)", color: "white", padding: "100px 2rem 80px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundImage: "radial-gradient(circle at 20% 50%, rgba(46,125,232,0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(0,168,107,0.2) 0%, transparent 40%)", pointerEvents: "none" }} />
        <div style={{ maxWidth: 800, margin: "0 auto", position: "relative" }}>
          <div style={{ display: "inline-block", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 100, padding: "6px 20px", fontSize: 13, fontWeight: 600, marginBottom: 24, color: "#7dd3fc" }}>
            🚀 Now Live — Founding Beta Partners Wanted
          </div>
          <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 800, lineHeight: 1.15, marginBottom: 24, letterSpacing: "-0.02em" }}>
            The Cloud ERP Built for<br />
            <span style={{ background: "linear-gradient(90deg, #00A86B, #7dd3fc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              African & Diaspora Businesses
            </span>
          </h1>
          <p style={{ fontSize: "1.25rem", color: "rgba(255,255,255,0.75)", lineHeight: 1.7, marginBottom: 40, maxWidth: 600, margin: "0 auto 40px" }}>
            Full-suite ERP — Accounting, Inventory, Payroll, POS, Manufacturing, Non-Profit and more. One platform. Fraction of the cost of Xero or QuickBooks.
          </p>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={onSignIn} style={{ background: "#00A86B", border: "none", color: "white", padding: "16px 36px", borderRadius: 10, cursor: "pointer", fontSize: 16, fontWeight: 700, boxShadow: "0 4px 24px rgba(0,168,107,0.4)" }}>
              Start Free — No Credit Card
            </button>
            <a href="#beta" style={{ background: "rgba(255,255,255,0.1)", border: "1.5px solid rgba(255,255,255,0.3)", color: "white", padding: "16px 36px", borderRadius: 10, cursor: "pointer", fontSize: 16, fontWeight: 600, textDecoration: "none", display: "inline-block" }}>
              Join Beta Programme →
            </a>
          </div>
          <p style={{ marginTop: 20, color: "rgba(255,255,255,0.5)", fontSize: 13 }}>30-day free trial · No setup fees · Cancel anytime</p>
        </div>
      </section>

      {/* STATS BAR */}
      <section style={{ background: "#f8faff", borderBottom: "1px solid #e8eaf0", padding: "32px 2rem" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 32, textAlign: "center" }}>
          {[
            { num: "12+", label: "Business Modules" },
            { num: "44", label: "Data Entities" },
            { num: "£29", label: "Starting Price/Month" },
            { num: "100%", label: "Cloud Based" },
          ].map((s, i) => (
            <div key={i}>
              <div style={{ fontSize: "2rem", fontWeight: 800, color: "#1B4F8A" }}>{s.num}</div>
              <div style={{ fontSize: 14, color: "#6b7280", marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" style={{ padding: "80px 2rem", background: "white" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 60 }}>
            <div style={{ color: "#1B4F8A", fontWeight: 700, fontSize: 13, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>Everything in One Platform</div>
            <h2 style={{ fontSize: "clamp(1.8rem, 3vw, 2.5rem)", fontWeight: 800, marginBottom: 16, letterSpacing: "-0.02em" }}>Replace 6 different tools<br />with one platform</h2>
            <p style={{ color: "#6b7280", fontSize: "1.1rem", maxWidth: 500, margin: "0 auto" }}>Built specifically for the way African and diaspora businesses actually operate</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
            {features.map((f, i) => (
              <div key={i} style={{ background: "#f8faff", border: "1px solid #e8eaf0", borderRadius: 12, padding: "24px", transition: "transform 0.2s, box-shadow 0.2s" }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(27,79,138,0.12)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}>
                <div style={{ fontSize: 28, marginBottom: 12 }}>{f.icon}</div>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: "#1a1f36" }}>{f.title}</h3>
                <p style={{ color: "#6b7280", fontSize: 14, lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DEMO CTA */}
      <section style={{ background: "linear-gradient(135deg, #00A86B, #008f5a)", padding: "60px 2rem", textAlign: "center", color: "white" }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 800, marginBottom: 16 }}>See it live before signing up</h2>
          <p style={{ fontSize: "1.1rem", opacity: 0.9, marginBottom: 32 }}>Explore the full ERP with our demo account — no signup required</p>
          <div style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 12, padding: "20px 32px", display: "inline-block", marginBottom: 24 }}>
            <div style={{ fontSize: 14, opacity: 0.8, marginBottom: 8 }}>Demo Account Credentials</div>
            <div style={{ display: "flex", gap: 32, justifyContent: "center", flexWrap: "wrap" }}>
              <div><span style={{ opacity: 0.7, fontSize: 13 }}>Email: </span><strong style={{ fontSize: 15 }}>demo@edgeclouderp.com</strong></div>
              <div><span style={{ opacity: 0.7, fontSize: 13 }}>Password: </span><strong style={{ fontSize: 15 }}>EdgeDemo2024!</strong></div>
            </div>
          </div>
          <br />
          <button onClick={onSignIn} style={{ background: "white", border: "none", color: "#00A86B", padding: "14px 36px", borderRadius: 10, cursor: "pointer", fontSize: 15, fontWeight: 700 }}>
            Open Demo Account →
          </button>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" style={{ padding: "80px 2rem", background: "#f8faff" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 60 }}>
            <div style={{ color: "#1B4F8A", fontWeight: 700, fontSize: 13, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>Simple Pricing</div>
            <h2 style={{ fontSize: "clamp(1.8rem, 3vw, 2.5rem)", fontWeight: 800, marginBottom: 16, letterSpacing: "-0.02em" }}>A fraction of what Xero charges</h2>
            <p style={{ color: "#6b7280", fontSize: "1.1rem" }}>30-day free trial on all plans. No credit card required.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
            {plans.map((p, i) => (
              <div key={i} style={{ background: p.highlight ? "linear-gradient(135deg, #1B4F8A, #2E7DE8)" : "white", border: p.highlight ? "none" : "1.5px solid #e8eaf0", borderRadius: 16, padding: "36px 28px", color: p.highlight ? "white" : "#1a1f36", position: "relative", boxShadow: p.highlight ? "0 20px 60px rgba(27,79,138,0.3)" : "none", transform: p.highlight ? "scale(1.04)" : "none" }}>
                {p.highlight && <div style={{ position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)", background: "#00A86B", color: "white", fontSize: 12, fontWeight: 700, padding: "4px 16px", borderRadius: 100 }}>MOST POPULAR</div>}
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8, opacity: p.highlight ? 0.9 : 1 }}>{p.name}</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 8 }}>
                  <span style={{ fontSize: "2.5rem", fontWeight: 800 }}>{p.price}</span>
                  <span style={{ fontSize: 14, opacity: 0.7 }}>{p.period}</span>
                </div>
                <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 24 }}>{p.desc}</div>
                <div style={{ borderTop: p.highlight ? "1px solid rgba(255,255,255,0.2)" : "1px solid #e8eaf0", paddingTop: 20, marginBottom: 28 }}>
                  {p.features.map((f, j) => (
                    <div key={j} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, fontSize: 14 }}>
                      <span style={{ color: p.highlight ? "#7dd3fc" : "#00A86B", fontWeight: 700 }}>✓</span>
                      <span style={{ opacity: p.highlight ? 0.9 : 0.8 }}>{f}</span>
                    </div>
                  ))}
                </div>
                <button onClick={onSignIn} style={{ width: "100%", background: p.highlight ? "white" : "#1B4F8A", border: "none", color: p.highlight ? "#1B4F8A" : "white", padding: "13px", borderRadius: 10, cursor: "pointer", fontSize: 14, fontWeight: 700 }}>
                  {p.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BETA PROGRAMME */}
      <section id="beta" style={{ padding: "80px 2rem", background: "white" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ background: "linear-gradient(135deg, #0f1f3d, #1B4F8A)", borderRadius: 20, padding: "60px 48px", color: "white", textAlign: "center" }}>
            <div style={{ display: "inline-block", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 100, padding: "6px 20px", fontSize: 13, fontWeight: 600, marginBottom: 24 }}>
              🎯 5 Spots Only
            </div>
            <h2 style={{ fontSize: "clamp(1.8rem, 3vw, 2.2rem)", fontWeight: 800, marginBottom: 16 }}>Founding Beta Partner Programme</h2>
            <p style={{ opacity: 0.8, fontSize: "1.1rem", lineHeight: 1.7, marginBottom: 40, maxWidth: 600, margin: "0 auto 40px" }}>
              Be one of 5 businesses that shape Edge Cloud ERP from the ground up. Free access, direct founder support, and founding member pricing locked in forever.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20, marginBottom: 40, textAlign: "left" }}>
              {[
                { icon: "🎁", title: "6 Months FREE", desc: "Full access worth £300+" },
                { icon: "📞", title: "Direct Founder Access", desc: "WhatsApp support from Ebenezer" },
                { icon: "🔒", title: "Locked Pricing Forever", desc: "Founding member rate for life" },
                { icon: "🏆", title: "Launch Partner Status", desc: "Featured on our website" },
                { icon: "⚡", title: "Shape the Roadmap", desc: "Your feedback drives features" },
                { icon: "🎯", title: "Priority Onboarding", desc: "Dedicated setup support" },
              ].map((b, i) => (
                <div key={i} style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 12, padding: "20px" }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>{b.icon}</div>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{b.title}</div>
                  <div style={{ opacity: 0.7, fontSize: 13 }}>{b.desc}</div>
                </div>
              ))}
            </div>
            <p style={{ opacity: 0.7, fontSize: 14, marginBottom: 24 }}>
              Ideal for: SMEs in Nigeria & UK · Non-profit organisations · Construction & manufacturing · Retail businesses · African diaspora businesses
            </p>
            <a href="https://www.linkedin.com/in/ebenezer-james" target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", background: "#00A86B", border: "none", color: "white", padding: "16px 40px", borderRadius: 10, cursor: "pointer", fontSize: 16, fontWeight: 700, textDecoration: "none", boxShadow: "0 4px 24px rgba(0,168,107,0.4)" }}>
              Apply for Beta Access →
            </a>
            <p style={{ opacity: 0.5, fontSize: 12, marginTop: 16 }}>DM on LinkedIn or email hello@edgeclouderp.com</p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: "#0f1f3d", color: "rgba(255,255,255,0.6)", padding: "40px 2rem", textAlign: "center" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 20 }}>
            <div style={{ width: 32, height: 32, background: "linear-gradient(135deg, #1B4F8A, #2E7DE8)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 16 }}>⬡</div>
            <span style={{ fontWeight: 700, color: "white", fontSize: 16 }}>Edge Cloud ERP</span>
          </div>
          <div style={{ display: "flex", gap: "2rem", justifyContent: "center", flexWrap: "wrap", marginBottom: 20, fontSize: 14 }}>
            <a href="#features" style={{ color: "rgba(255,255,255,0.6)", textDecoration: "none" }}>Features</a>
            <a href="#pricing" style={{ color: "rgba(255,255,255,0.6)", textDecoration: "none" }}>Pricing</a>
            <a href="#beta" style={{ color: "rgba(255,255,255,0.6)", textDecoration: "none" }}>Beta Programme</a>
            <a href="mailto:hello@edgeclouderp.com" style={{ color: "rgba(255,255,255,0.6)", textDecoration: "none" }}>hello@edgeclouderp.com</a>
          </div>
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 20, fontSize: 13 }}>
            © 2026 Edge Cloud ERP · Powered by Supabase · Hosted on Vercel
          </div>
        </div>
      </footer>
    </div>
  );
}
