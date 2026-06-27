"use client";
import { useSession } from "next-auth/react";
import { useState } from "react";
import Navbar from "../../component/Navbar"

export default function OnboardPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);

  async function handleSetup() {
    try {
      setLoading(true);
      const res = await fetch("/api/payment/seller/account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sellerId: session?.user.id || "",
          email: session?.user.email || "",
        }),
      });
      const { url } = await res.json();
      window.location.href = url;
    } catch (error) {
      setLoading(false);
      alert("Something went wrong. Please try again.");
    }
  }

  return (
<div
  style={{
    background: "#ffffff",
    width: "100%",
    minHeight: "100vh",
    overflowX: "hidden",
  }}
>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;1,9..144,400&family=Inter:wght@400;500;600&display=swap');

        @keyframes ob-spin {
          to { transform: rotate(360deg); }
        }

        .ob-wrap {
          font-family: 'Inter', 'Helvetica Neue', sans-serif;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          padding: 2rem 1rem;
          background: #f5f7f5;
        }

        .ob-card {
          width: 100%;
          max-width: 420px;
          background: #ffffff;
          border: 1px solid rgba(10, 31, 20, 0.1);
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(10, 31, 20, 0.08), 0 4px 16px rgba(10, 31, 20, 0.04);
        }

        .ob-header {
          background: #0a1f14;
          padding: 32px 32px 28px;
        }

        .ob-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(82, 183, 136, 0.15);
          border: 1px solid rgba(82, 183, 136, 0.25);
          border-radius: 20px;
          padding: 4px 11px;
          font-size: 11px;
          font-weight: 600;
          color: #6fcf9d;
          letter-spacing: 0.8px;
          text-transform: uppercase;
          margin-bottom: 18px;
        }

        .ob-badge-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #52B788;
        }

        .ob-header h1 {
          font-family: 'Fraunces', Georgia, serif;
          font-size: 28px;
          font-weight: 400;
          color: #ffffff;
          margin: 0 0 10px;
          line-height: 1.2;
          letter-spacing: -0.3px;
        }

        .ob-header h1 em {
          font-style: italic;
          color: #6fcf9d;
        }

        .ob-header p {
          font-size: 13px;
          color: #7aab92;
          margin: 0;
          line-height: 1.65;
        }

        .ob-body {
          padding: 28px 32px 32px;
        }

        .ob-steps {
          display: flex;
          flex-direction: column;
          margin-bottom: 24px;
        }

        .ob-step {
          display: flex;
          gap: 14px;
          align-items: flex-start;
          padding: 14px 0;
          border-bottom: 1px solid rgba(10, 31, 20, 0.07);
        }

        .ob-step:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        .ob-step:first-child {
          padding-top: 0;
        }

        .ob-step-num {
          width: 28px;
          height: 28px;
          flex-shrink: 0;
          border-radius: 50%;
          background: rgba(26, 122, 72, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 600;
          color: #1a7a48;
        }

        .ob-step-title {
          font-size: 13.5px;
          font-weight: 500;
          color: #0a1f14;
          margin-bottom: 3px;
        }

        .ob-step-desc {
          font-size: 12px;
          color: #6b7f74;
          line-height: 1.55;
        }

        .ob-notice {
          background: rgba(26, 122, 72, 0.06);
          border: 1px solid rgba(26, 122, 72, 0.15);
          border-radius: 11px;
          padding: 13px 15px;
          display: flex;
          gap: 10px;
          align-items: flex-start;
          margin-bottom: 20px;
        }

        .ob-notice-icon {
          width: 16px;
          height: 16px;
          flex-shrink: 0;
          margin-top: 1px;
          color: #1a7a48;
        }

        .ob-notice p {
          font-size: 12px;
          color: #2d6644;
          margin: 0;
          line-height: 1.6;
        }

        .ob-btn {
          width: 100%;
          height: 50px;
          background: #145c35;
          color: #ffffff;
          border: none;
          border-radius: 13px;
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          transition: background 0.18s ease, transform 0.12s ease;
          letter-spacing: 0.1px;
        }

        .ob-btn:hover:not(:disabled) {
          background: #0f4527;
        }

        .ob-btn:active:not(:disabled) {
          transform: scale(0.98);
        }

        .ob-btn:disabled {
          background: #2a4a35;
          color: rgba(255, 255, 255, 0.45);
          cursor: not-allowed;
        }

        .ob-btn-spinner {
          width: 15px;
          height: 15px;
          border: 2px solid rgba(255, 255, 255, 0.25);
          border-top-color: rgba(255, 255, 255, 0.7);
          border-radius: 50%;
          animation: ob-spin 0.75s linear infinite;
          flex-shrink: 0;
        }

        .ob-stripe-icon {
          width: 18px;
          height: 18px;
          flex-shrink: 0;
          opacity: 0.85;
        }

        .ob-footer {
          font-size: 11px;
          color: #9ab0a2;
          text-align: center;
          margin-top: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
        }

        .ob-footer-lock {
          width: 12px;
          height: 12px;
          opacity: 0.6;
        }

        @media (max-width: 480px) {
          .ob-header { padding: 26px 24px 22px; }
          .ob-body { padding: 22px 24px 26px; }
        }
      `}</style>
<Navbar/>

      <div className="ob-wrap">
        <div className="ob-card">
          <div className="ob-header">
           
            <h1>
              Start receiving <em>payouts.</em>
            </h1>
            <p>Connect your bank in minutes via Stripe's secure onboarding.</p>
          </div>

          <div className="ob-body">
            <div className="ob-steps">
              <div className="ob-step">
                <div className="ob-step-num">1</div>
                <div>
                  <div className="ob-step-title">Verify your identity</div>
                  <div className="ob-step-desc">
                    Government ID + basic personal info. Takes about 2 minutes.
                  </div>
                </div>
              </div>
              <div className="ob-step">
                <div className="ob-step-num">2</div>
                <div>
                  <div className="ob-step-title">Add a bank account</div>
                  <div className="ob-step-desc">
                    Routing and account number. Stripe encrypts everything.
                  </div>
                </div>
              </div>
              <div className="ob-step">
                <div className="ob-step-num">3</div>
                <div>
                  <div className="ob-step-title">Get paid automatically</div>
                  <div className="ob-step-desc">
                    Payouts land within 2 business days of each sale.
                  </div>
                </div>
              </div>
            </div>

            <div className="ob-notice">
              <svg className="ob-notice-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <p>
                You'll be redirected to Stripe to complete setup securely. We never store your banking details.
              </p>
            </div>

            <button
              className="ob-btn"
              onClick={handleSetup}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="ob-btn-spinner" />
                  Connecting…
                </>
              ) : (
                <>
                  <svg className="ob-stripe-icon" viewBox="0 0 28 28" fill="white">
                    <path d="M13.3 11.1c0-.9.8-1.3 2-1.3 1.8 0 4.1.5 5.9 1.5V6.6c-2-.8-3.9-1.1-5.9-1.1C11.1 5.5 8 7.5 8 11.4c0 6.1 8.4 5.1 8.4 7.7 0 1.1-.9 1.4-2.2 1.4-1.9 0-4.4-.8-6.3-1.9v4.8c2.1.9 4.3 1.3 6.3 1.3 4.8 0 8-2.4 8-6.3-.1-6.6-8.9-5.4-8.9-7.3z"/>
                  </svg>
                  Set up payouts
                </>
              )}
            </button>

            <div className="ob-footer">
              <svg className="ob-footer-lock" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              Secured by Stripe Connect
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}