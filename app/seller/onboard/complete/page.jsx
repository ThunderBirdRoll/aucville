"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function OnboardComplete() {
  const router = useRouter();
  const [status, setStatus] = useState("checking"); // "checking" | "success" | "incomplete" | "error"

  useEffect(() => {
    fetch("/api/payment/seller/account/complete", { method: "POST" })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        console.log(data.success);
        if (data.success) {
          setStatus("success");
          setTimeout(() => router.push("/my-auction"), 2500);
        } else {
          setStatus("incomplete");
        }
      })
      .catch(() => setStatus("error"));
  }, []);

  if (status === "checking") {
    return <CenteredMessage title="Checking your account…" subtitle="One moment." />;
  }

  if (status === "incomplete") {
    return (
      <CenteredMessage
        title="Almost there"
        subtitle="A few more details are needed to finish setting up payouts."
        action={{ label: "Finish setup", href: "/seller/onboard/refresh" }}
      />
    );
  }

  if (status === "error") {
    return <CenteredMessage title="Something went wrong" subtitle="Please try again." />;
  }

  return (
    <CenteredMessage
      title="Payout account connected!"
      subtitle="Redirecting you to your auctions…"
      success
    />
  );
}

function CenteredMessage({ title, subtitle, success, action }) {
  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      fontFamily: "'Inter', sans-serif", background: "#f9fafb", gap: 16
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: "50%",
        background: success ? "#d1fae5" : "#fef3c7",
        display: "flex", alignItems: "center", justifyContent: "center"
      }}>
        {success ? (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
            stroke="#1B3A2D" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
            stroke="#92400e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        )}
      </div>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: "#1B3A2D", margin: 0 }}>{title}</h1>
      <p style={{ fontSize: 14, color: "#6b7280", margin: 0, textAlign: "center", maxWidth: 320 }}>{subtitle}</p>
      {action && (
        <a href={action.href} style={{
          marginTop: 8, padding: "10px 24px", borderRadius: 9,
          background: "#1B3A2D", color: "#fff", fontSize: 14, fontWeight: 600,
          textDecoration: "none",
        }}>
          {action.label}
        </a>
      )}
    </div>
  );
}