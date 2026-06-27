"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function OnboardRefresh() {
  const [loading, setLoading] = useState(false);
  const { data: session } = useSession();

  async function retry() {
    setLoading(true);
    const res = await fetch("/api/payment/seller/account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sellerId: session?.user?.id,
        email: session?.user?.email,
      }),
    });
    const { url } = await res.json();
    window.location.href = url;
  }
  // optional but better UX — auto-retry on mount
  useEffect(() => {
    retry(); // immediately get a fresh link when they land here
  }, []);
  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      fontFamily: "'Inter', sans-serif", background: "#f9fafb", gap: 16
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: "50%",
        background: "#fef3c7", display: "flex", alignItems: "center", justifyContent: "center"
      }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
          stroke="#92400e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: "#1B3A2D", margin: 0 }}>
        Onboarding link expired
      </h1>
      <p style={{ fontSize: 14, color: "#6b7280", margin: 0, textAlign: "center", maxWidth: 300 }}>
        Your setup link expired or was interrupted. Click below to get a fresh one.
      </p>
      <button
        onClick={retry}
        disabled={loading}
        style={{
          marginTop: 8, padding: "10px 24px", borderRadius: 9,
          background: "#1B3A2D", color: "#fff", border: "none",
          fontSize: 14, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.7 : 1
        }}
      >
        {loading ? "Generating link…" : "Retry setup"}
      </button>
    </div>
  );
}