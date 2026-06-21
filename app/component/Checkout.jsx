"use client";

import React, { useEffect, useState } from "react";
import {
  useStripe,
  useElements,
  PaymentElement,
} from "@stripe/react-stripe-js";
import { Loader2, AlertCircle, Lock, CheckCircle2 } from "lucide-react";

const CheckoutPage = ({ amount, orderId }) => {
  const stripe = useStripe();
  const elements = useElements();

  const [errorMessage, setErrorMessage] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [fetchingIntent, setFetchingIntent] = useState(true);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("idle"); // idle | processing | succeeded

  useEffect(() => {
    if (!amount || !orderId) return;

    let cancelled = false;
    setFetchingIntent(true);
    setErrorMessage("");

    fetch("/api/payment/create-payment-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, orderId }),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Could not start payment session.");
        if (!data.clientSecret) throw new Error("Payment session is missing a client secret.");
        if (!cancelled) setClientSecret(data.clientSecret);
      })
      .catch((err) => {
        if (!cancelled) setErrorMessage(err.message || "Failed to initialize payment.");
      })
      .finally(() => {
        if (!cancelled) setFetchingIntent(false);
      });

    return () => { cancelled = true; };
  }, [amount, orderId]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!stripe || !elements || loading) return;

    setLoading(true);
    setErrorMessage("");

    try {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setErrorMessage(submitError.message);
        return;
      }

      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        clientSecret,
        redirect: "if_required",
        confirmParams: {
          return_url:
            typeof window !== "undefined"
              ? `${window.location.origin}/checkout/complete?orderId=${orderId}`
              : undefined,
        },
      });

      if (error) {
        setErrorMessage(error.message || "Payment failed. Please try again.");
        return;
      }

      if (paymentIntent.status === "succeeded") {
        setStatus("succeeded");
        await fetch("/api/payment/success", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            paymentIntentId: paymentIntent.id,
            orderId,
          }),
        });
      } else if (paymentIntent.status === "processing") {
        setStatus("processing");
      } else {
        setErrorMessage(`Payment status: ${paymentIntent.status}. Please try again.`);
      }
    } catch (err) {
      setErrorMessage(err.message || "Something went wrong while processing payment.");
    } finally {
      setLoading(false);
    }
  };

  // ── Loading skeleton (waiting on Stripe.js + client secret) ──
  if (fetchingIntent || !stripe || !elements) {
    return (
      <>
        <style>{`@keyframes ckSpin{to{transform:rotate(360deg)}}`}</style>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "48px 0", fontFamily: "'DM Sans','Helvetica Neue',sans-serif",
        }}>
          <Loader2 size={26} stroke="#52B788" style={{ animation: "ckSpin 1s linear infinite" }} />
        </div>
      </>
    );
  }

  // ── Could not even start a payment session ──
  if (!clientSecret) {
    return (
      <div style={{
        fontFamily: "'DM Sans','Helvetica Neue',sans-serif",
        background: "#FEF2F2", border: "0.5px solid #FECACA", borderRadius: 14,
        padding: "18px 20px", display: "flex", alignItems: "flex-start", gap: 10,
      }}>
        <AlertCircle size={18} stroke="#B91C1C" style={{ flexShrink: 0, marginTop: 1 }} />
        <div>
          <div style={{ fontSize: 13.5, color: "#B91C1C", fontWeight: 400, marginBottom: 2 }}>
            Couldn't start checkout
          </div>
          <div style={{ fontSize: 12.5, color: "#991B1B", fontWeight: 300 }}>
            {errorMessage || "Please refresh and try again."}
          </div>
        </div>
      </div>
    );
  }

  // ── Success state ──
  if (status === "succeeded") {
    return (
      <div style={{
        fontFamily: "'DM Sans','Helvetica Neue',sans-serif",
        textAlign: "center", padding: "32px 20px",
      }}>
        <CheckCircle2 size={44} stroke="#52B788" style={{ marginBottom: 14 }} />
        <div style={{ fontSize: 18, fontWeight: 400, color: "#111827", marginBottom: 6 }}>
          Payment successful
        </div>
        <div style={{ fontSize: 13, color: "#6B7280", fontWeight: 300 }}>
          Your order is confirmed and being processed.
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@200;300;400;500&display=swap');
        @keyframes ckSpin{to{transform:rotate(360deg)}}

        .ck-form{font-family:'DM Sans','Helvetica Neue',sans-serif;font-weight:300}
        .ck-card{background:rgba(255,255,255,0.95);border:0.5px solid #D1D5DB;border-radius:16px;padding:22px;backdrop-filter:blur(6px)}
        .ck-amount-row{display:flex;align-items:baseline;justify-content:space-between;margin-bottom:18px;padding-bottom:16px;border-bottom:0.5px solid #F3F4F6}
        .ck-amount-label{font-size:11px;font-weight:500;color:#374151;letter-spacing:0.6px;text-transform:uppercase}
        .ck-amount-val{font-size:24px;font-weight:400;color:#111827;letter-spacing:-0.4px}

        .ck-err{display:flex;align-items:center;gap:8px;background:#FEF2F2;border:0.5px solid #FECACA;border-radius:10px;padding:11px 14px;font-size:12.5px;color:#B91C1C;font-weight:300;margin-top:14px}
        .ck-processing{display:flex;align-items:center;gap:8px;background:rgba(82,183,136,0.08);border:0.5px solid rgba(82,183,136,0.3);border-radius:10px;padding:11px 14px;font-size:12.5px;color:#1B3A2D;font-weight:300;margin-top:14px}

        .ck-btn{width:100%;display:flex;align-items:center;justify-content:center;gap:8px;background:#1B3A2D;color:#fff;border:none;border-radius:12px;padding:14px 20px;font-size:14px;font-weight:400;font-family:inherit;cursor:pointer;margin-top:18px;transition:background .15s,transform .1s}
        .ck-btn:hover:not(:disabled){background:#2D6A4F}
        .ck-btn:active:not(:disabled){transform:scale(0.98)}
        .ck-btn:disabled{background:#9CA3AF;cursor:not-allowed}

        .ck-secure{display:flex;align-items:center;justify-content:center;gap:5px;margin-top:12px;font-size:11px;color:#9CA3AF;font-weight:300}
      `}</style>

      <form onSubmit={handleSubmit} className="ck-form">
        <div className="ck-card">
          <div className="ck-amount-row">
            <span className="ck-amount-label">Total due</span>
            <span className="ck-amount-val">${amount}</span>
          </div>

          <PaymentElement />

          {errorMessage && (
            <div className="ck-err">
              <AlertCircle size={14} style={{ flexShrink: 0 }} />
              {errorMessage}
            </div>
          )}

          {status === "processing" && (
            <div className="ck-processing">
              <Loader2 size={14} style={{ animation: "ckSpin 1s linear infinite", flexShrink: 0 }} />
              Your payment is processing — this may take a moment.
            </div>
          )}

          <button type="submit" className="ck-btn" disabled={!stripe || loading}>
            {loading
              ? <><Loader2 size={15} style={{ animation: "ckSpin 1s linear infinite" }} /> Processing…</>
              : `Pay $${amount}`}
          </button>

          <div className="ck-secure">
            <Lock size={11} /> Payments secured by Stripe
          </div>
        </div>
      </form>
    </>
  );
};

export default CheckoutPage;