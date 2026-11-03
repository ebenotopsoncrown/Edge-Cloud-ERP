import React from "react";

// Keeps a render error in one page from blanking the whole app.
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("Unhandled render error:", error, info?.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div style={{ minHeight: "100vh", background: "#F5F7FA", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ background: "white", borderRadius: 16, padding: 40, maxWidth: 480, width: "100%", textAlign: "center", boxShadow: "0 20px 40px rgba(0,0,0,0.1)" }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "#0F172A", marginBottom: 12 }}>This page hit a problem</h1>
          <p style={{ color: "#64748B", fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
            Your saved data is not affected. Return to the dashboard to keep working.
          </p>
          <button
            onClick={() => { window.location.href = "/"; }}
            style={{ padding: "10px 24px", background: "#1B4F8A", color: "white", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" }}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }
}
